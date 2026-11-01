import { eligibility, inputAmount, unavailable } from "./common.ts";
import type { CoefficientTable } from "./payg-tables.ts";
import {
  combined2025Claimed,
  combined2025Unclaimed,
  combined2026Claimed,
  combined2026Unclaimed,
  combinedEarlyClaimed,
  ordinary2025Claimed,
  ordinary2025Unclaimed,
  ordinary2026Claimed,
  ordinary2026Unclaimed,
} from "./payg-tables.ts";
import { TAX_RULE_VERSION } from "./sources.ts";
import type { PaygInput, PaygResult, PayPeriod, TaxAmount } from "./types.d.ts";

const units = {
  cents: 100,
  fortnightCents: 200,
  monthlyAdjustmentCents: 33,
  monthsPerQuarter: 3,
  quarterCents: 1300,
  weeklyAddedCents: 99,
  coefficientScale: 10_000,
  halfMillion: 500_000,
  million: 1_000_000,
  weeksPerFortnight: 2,
  weeksPerQuarter: 13,
  halfDollar: 0.5,
};
const periodSources = { "2025-july": "T33", "2025-september": "T34", "2026-july": "T22" };
const ordinaryTables = {
  "2025-july": { claimed: ordinary2025Claimed, unclaimed: ordinary2025Unclaimed },
  "2025-september": { claimed: ordinary2025Claimed, unclaimed: ordinary2025Unclaimed },
  "2026-july": { claimed: ordinary2026Claimed, unclaimed: ordinary2026Unclaimed },
};
const combinedTables = {
  "2025-september": { claimed: combined2025Claimed, unclaimed: combined2025Unclaimed },
  "2026-july": { claimed: combined2026Claimed, unclaimed: combined2026Unclaimed },
};
function weeklyEquivalentCents(earnings: number, period: PayPeriod): number {
  let cents = Math.round(earnings * units.cents);
  let numerator = cents;
  let denominator = units.cents;
  if (period === "fortnightly") {
    denominator = units.fortnightCents;
  } else if (period === "monthly") {
    if (cents % units.cents === units.monthlyAdjustmentCents) {
      cents += 1;
    }
    numerator = cents * units.monthsPerQuarter;
    denominator = units.quarterCents;
  } else if (period === "quarterly") {
    denominator = units.quarterCents;
  }
  return Math.floor(numerator / denominator) * units.cents + units.weeklyAddedCents;
}

function formulaWithholding(table: CoefficientTable, xCents: number, period: PayPeriod): number {
  let coefficient = table.top;
  for (const { upper, a, b } of table.bands) {
    if (xCents < upper * units.cents) {
      coefficient = { a, b };
      break;
    }
  }
  const { a, b } = coefficient;
  const rawMillionths =
    Math.round(a * units.coefficientScale) * xCents -
    Math.round(b * units.coefficientScale) * units.cents;
  const weekly = Math.floor((rawMillionths + units.halfMillion) / units.million);
  if (period === "fortnightly") {
    return weekly * units.weeksPerFortnight;
  }
  if (period === "monthly") {
    return Math.floor((weekly * units.weeksPerQuarter) / units.monthsPerQuarter + units.halfDollar);
  }
  if (period === "quarterly") {
    return weekly * units.weeksPerQuarter;
  }
  return weekly;
}

function paygAmount(amount: number, source: string): TaxAmount {
  return { status: "available", amount, basis: "representative withholding", sources: [source] };
}

function ordinaryTable(input: PaygInput): CoefficientTable {
  const tables = ordinaryTables[input.rulePeriod];
  if (input.thresholdClaimed) {
    return tables.claimed;
  }
  return tables.unclaimed;
}

function combinedTable(input: PaygInput): CoefficientTable {
  if (input.rulePeriod === "2025-july") {
    return combinedEarlyClaimed;
  }
  const tables = combinedTables[input.rulePeriod];
  if (input.thresholdClaimed) {
    return tables.claimed;
  }
  return tables.unclaimed;
}

function payrollEarnings(input: PaygInput, source: string): TaxAmount {
  const checks = [
    eligibility(input.ordinaryEmployee, "Ordinary employee payroll treatment", [source]),
    eligibility(input.tfnProvided, "TFN declaration supplied", [source]),
    eligibility(input.noAdjustments, "No offsets, levy variations or irregular pay", [source]),
  ];
  for (const check of checks) {
    if (check.status === "unavailable") {
      return check;
    }
  }
  if (input.thresholdClaimed === null) {
    return unavailable("missing-input", "Payer tax-free-threshold declaration is required.", [
      source,
    ]);
  }
  return inputAmount(input.earnings, "Representative taxable payroll earnings", false);
}

function loanWithholding(
  input: PaygInput,
  x: number,
  ordinary: TaxAmount,
  source: string,
): TaxAmount {
  if (input.studyLoanDeclared === null) {
    return unavailable("missing-input", "Payer study-loan declaration is required.", [source]);
  }
  if (!input.studyLoanDeclared) {
    return ordinary;
  }
  if (input.rulePeriod === "2025-july" && !input.thresholdClaimed) {
    return unavailable(
      "unverified-rule",
      "R14: July–September 2025 no-threshold combined loan table needs independent verification.",
      [source],
    );
  }
  return paygAmount(formulaWithholding(combinedTable(input), x, input.period), source);
}

function calculatePayg(input: PaygInput): PaygResult {
  const source = periodSources[input.rulePeriod];
  const earnings = payrollEarnings(input, source);
  let ordinary = earnings;
  let combined = earnings;
  if (earnings.status === "available") {
    const x = weeklyEquivalentCents(earnings.amount, input.period);
    ordinary = paygAmount(formulaWithholding(ordinaryTable(input), x, input.period), source);
    combined = loanWithholding(input, x, ordinary, source);
  }
  let loanIncrement = combined;
  if (ordinary.status === "available" && combined.status === "available") {
    loanIncrement = paygAmount(combined.amount - ordinary.amount, source);
  }
  return {
    ordinary,
    combined,
    loanIncrement,
    method: "published combined coefficient formula",
    ruleVersion: TAX_RULE_VERSION,
  };
}

export { calculatePayg };

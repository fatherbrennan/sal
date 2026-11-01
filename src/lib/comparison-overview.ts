import type { ComparisonResult } from "./calculations/comparison.ts";
import { metricAmount } from "./calculations/comparison-insights.ts";
import { quotient, rows, total, value } from "./calculations/inputs.ts";
import { calculateRepresentativePayroll } from "./calculations/tax/payroll.ts";
import { calculatePayrollHourly } from "./calculations/tax/payroll-hourly.ts";
import { numeric } from "./data/numeric.ts";
import { type Equation, explanation } from "./explanations/model.ts";

const cashAfterCosts = "Cash after tax and job costs";
const monthsPerYear = 12;
const daysPerWeek = 7;
const hoursTolerance = 0.01;

function monthlyCash(result: ComparisonResult): number | null {
  if (result.scenario.oneOff) {
    return null;
  }
  return quotient(metricAmount(result, cashAfterCosts), monthsPerYear);
}

function monthlyCashEquation(result: ComparisonResult, source: Equation): Equation {
  const amount = monthlyCash(result);
  const warnings: string[] = [];
  if (amount === null) {
    warnings.push("Unavailable for unknown cash or a scenario including one-offs.");
  }
  return {
    ...explanation(
      `${result.offer.name || "Untitled offer"} · average monthly comparison cash`,
      "average_monthly_cash_after_job_costs = annual_cash_after_job_costs / months_per_year",
      { annualCashAfterJobCosts: metricAmount(result, cashAfterCosts), monthsPerYear },
    ),
    context:
      "Annual comparison estimate divided evenly across twelve months; not a payslip forecast.",
    result: { name: "average_monthly_cash_after_job_costs", value: amount, unit: "money" },
    units: Object.fromEntries([["annual_cash_after_job_costs", "money"]]),
    notes: [
      "After personal super, before other payroll outflows. Target earnings remain contingent.",
    ],
    warnings,
    origins: Object.fromEntries([
      ["months_per_year", "Twelve calendar months; not the number of salary deposits."],
    ]),
    references: Object.fromEntries([
      [
        "annual_cash_after_job_costs",
        { scope: "annual_cash", name: "annual_cash_after_job_costs" },
      ],
    ]),
    sections: [{ ...source, scope: "annual_cash" }],
  };
}

function overviewPayroll(result: ComparisonResult) {
  const payroll = calculateRepresentativePayroll({
    year: result.tax.withOffer.input.year,
    annualBaseCash: result.baseCash,
    profile: result.profile,
    payer: result.payer,
  });
  return {
    result,
    payroll,
    hourly: calculatePayrollHourly({
      payroll,
      weeklyHours: numeric(result.payer, "weeklyHours"),
      weeks: numeric(result.payer, "weeks"),
    }),
  };
}

function comparisonBasis(result: ComparisonResult): string[] {
  const notes: string[] = [];
  if (metricAmount(result, "Return commute journeys") === 0) {
    notes.push("No commuting in the entered calendar.");
  } else if (value(result.payer, "costMethod") === "ato") {
    notes.push("Broader ATO cost estimate, including ownership costs; not cash spending.");
  } else if (value(result.payer, "costMethod") === "entered") {
    notes.push("Entered running costs and trip charges.");
  } else {
    notes.push("Commuting-cost basis is incomplete.");
  }
  const rosterHours = total(
    rows(result.offer, "roster").map((item) => numeric(item.fields, "hours")),
  );
  const weeklyHours = quotient(rosterHours, numeric(result.payer, "cycleDays"));
  const paidHours = numeric(result.payer, "weeklyHours");
  if (
    weeklyHours !== null &&
    paidHours !== null &&
    Math.abs(weeklyHours * daysPerWeek - paidHours) > hoursTolerance
  ) {
    notes.push("Roster differs from standard paid hours; check this is intentional.");
  }
  for (const note of result.notes) {
    if (note.startsWith("No dates are identified as leave")) {
      notes.push("No leave dates entered; entitlement has not reduced attendance.");
    }
  }
  return notes;
}

export { cashAfterCosts, comparisonBasis, monthlyCash, monthlyCashEquation, overviewPayroll };

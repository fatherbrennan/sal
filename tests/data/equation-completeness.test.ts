import { expect, it } from "bun:test";
import {
  type ComparisonInput,
  calculateComparison,
} from "../../src/lib/calculations/comparison.ts";
import { calculateRepresentativePayroll } from "../../src/lib/calculations/tax/payroll.ts";
import { calculatePayrollHourly } from "../../src/lib/calculations/tax/payroll-hourly.ts";
import type { PaygRulePeriod } from "../../src/lib/calculations/tax/types.d.ts";
import type { Fields } from "../../src/lib/data/model.d.ts";
import { comparisonEquation } from "../../src/lib/explanations/comparison.ts";
import { differenceEquation } from "../../src/lib/explanations/difference.ts";
import {
  equationGraph,
  resolveVariable,
  unresolvedVariables,
} from "../../src/lib/explanations/navigation.ts";
import { oneOffEquation } from "../../src/lib/explanations/one-off.ts";
import {
  allocatedHoursEquation,
  payrollEquation,
  payrollNames,
} from "../../src/lib/explanations/payroll.ts";
import { annualEquation } from "../../src/lib/explanations/tax.ts";
import { annualNames } from "../../src/lib/explanations/tax-context.ts";
import { bonus, offer, profile } from "../calculations/package-fixture.ts";

const cases: Fields[] = [
  {},
  { unit: "hour", amount: "55.25", paidUnits: "1976", inclusion: "excludes" },
  { unit: "day", amount: "400", paidUnits: "240", superEligible: "no" },
  { amount: "400000", inclusion: "includes" },
  { amount: "400000", inclusion: "excludes", evenSuper: "" },
  { inclusion: "excludes", superEligible: "", superRate: "" },
  { inclusion: "", amount: "", superEligible: "" },
  { unit: "", employment: "" },
  { superLimit: "uncapped", superRate: "15" },
  { employment: "sole-trader", gst: "inclusive", contractorSuper: "12000" },
  { employment: "sole-trader", gst: "exclusive", unit: "hour", paidUnits: "1500" },
  { employment: "sole-trader", gst: "", contractorSuper: "" },
  { tripBasis: "legs", energy: "none", costMethod: "ato" },
  { tripBasis: "", costMethod: "" },
];

function source(fields: Fields, year: ComparisonInput["year"]): ComparisonInput {
  const record = offer(fields);
  const earnings = [
    bonus(),
    { ...bonus({ amount: "5500", certainty: "target", recurrence: "once" }), id: "target" },
  ];
  const perks = [
    { id: "gym", fields: { amount: "30", frequency: "monthly" } },
    { id: "phone", fields: { amount: "100", frequency: "annual" } },
    { id: "meal", fields: { amount: "5", frequency: "journey" } },
  ];
  const costs = [
    {
      id: "cost",
      fields: { amount: "12", reimbursement: "2", frequency: "weekly", recurrence: "recurring" },
    },
    { id: "once", fields: { amount: "500", reimbursement: "0", recurrence: "once" } },
  ];
  Object.assign(record.items, { earnings, perks, costs });
  return {
    offer: record,
    year,
    profile,
    vehicle: {},
    target: false,
    oneOff: false,
    timeValue: true,
  };
}

function taxAndPayroll(input: ComparisonInput) {
  const result = calculateComparison(input);
  const equations = Object.keys(annualNames).flatMap((key) => [
    annualEquation(key, result.tax.withOffer, result, { title: "With offer" }),
    annualEquation(key, result.tax.withoutOffer, result, {
      title: "Without offer",
      withoutOffer: true,
    }),
  ]);
  const payroll = calculateRepresentativePayroll({
    year: input.year,
    annualBaseCash: result.baseCash,
    profile: result.profile,
    payer: result.payer,
  });
  const weeklyHours = 40;
  const weeks = 52;
  const hourly = calculatePayrollHourly({ payroll, weeklyHours, weeks });
  const context = { result, payroll, hourly };
  equations.push(allocatedHoursEquation(context));
  for (const row of [payroll, ...payroll.rulePeriods]) {
    let period: PaygRulePeriod | null = null;
    if ("rulePeriod" in row) {
      period = row.rulePeriod;
    }
    const entries = Object.entries(row);
    if ("withholding" in row) {
      entries.push(...Object.entries(row.withholding));
    }
    for (const [key, amount] of entries) {
      if (
        payrollNames[key] !== undefined &&
        typeof amount === "object" &&
        amount !== null &&
        "status" in amount
      ) {
        for (const perHour of [true, false]) {
          equations.push(payrollEquation(key, amount, context, { period, perHour }));
        }
      }
    }
  }
  return equations;
}

it.each(cases)(
  "every rendered variable resolves across quote and scenario branches: %j",
  (fields) => {
    for (const year of ["2025-26", "2026-27"] as const) {
      for (const include of [false, true]) {
        const input = {
          ...source(fields, year),
          target: include,
          oneOff: include,
          timeValue: include,
        };
        const result = calculateComparison(input);
        const equations = result.metrics.map(({ label }) =>
          comparisonEquation(label, input, result),
        );
        equations.push(...taxAndPayroll(input));
        const missing = equations.flatMap((equation) =>
          unresolvedVariables(equationGraph(equation)),
        );
        expect([...new Set(missing)].toSorted((left, right) => left.localeCompare(right))).toEqual(
          [],
        );
      }
    }
  },
);

it("keeps comparison, one-off and item references within their actual offer and scenario", () => {
  const first = source({}, "2026-27");
  const second = source({ amount: "224000" }, "2026-27");
  const label = "Cash before tax per paid hour";
  const firstResult = calculateComparison(first);
  const secondResult = calculateComparison(second);
  const difference = differenceEquation(label, null, null, [
    comparisonEquation(label, first, firstResult),
    comparisonEquation(label, second, secondResult),
  ]);
  const graph = equationGraph(difference);
  expect(resolveVariable(graph, "", "offer_value")?.scope).toBe("offer_0");
  expect(resolveVariable(graph, "", "baseline_value")?.scope).toBe("offer_1");
  expect(unresolvedVariables(graph)).toEqual([]);
  const combined = calculateComparison({ ...first, oneOff: true });
  const once = equationGraph(oneOffEquation(firstResult, combined, first));
  expect(resolveVariable(once, "", "recurring_annual_cash_after_job_costs")?.scope).toBe(
    "recurring",
  );
  expect(resolveVariable(once, "", "annual_cash_after_job_costs_with_one_offs")?.scope).toBe(
    "with_one_offs",
  );
  expect(unresolvedVariables(once)).toEqual([]);
  const perks = equationGraph(comparisonEquation("Personal perk value", first, firstResult));
  const members = resolveVariable(perks, "", "annual_personal_perk_values")?.members ?? [];
  expect(members.map((member) => member.scope)).toEqual(["perk_1", "perk_2", "perk_3"]);
  expect(resolveVariable(perks, "perk_1", "monthly_personal_perk_value")?.origin).toContain(
    "entered monthly",
  );
  const annualPhoneValue = 100;
  expect(resolveVariable(perks, "perk_2", "annual_personal_perk_value")?.value).toBe(
    annualPhoneValue,
  );
});

const profileCases: Fields[] = [
  { studyLoan: "yes", loanScheme: "help", helpEligible: "yes", loanDebt: "24000" },
  { studyLoan: "yes", loanScheme: "other-or-multiple" },
  { studyLoan: "", household: "" },
  {
    household: "full-year-spouse",
    spouseTaxableIncome: "10000",
    spouseMlsIncome: "200000",
    levyChildren: "1",
    mlsChildren: "2",
    hospitalCover: "no",
  },
  {
    household: "single-with-dependants",
    levyFamilyRelief: "no",
    mlsChildren: "2",
    hospitalCover: "no",
  },
  { taxableWithOffer: "40000", taxableWithoutOffer: "20000", standardDeduction: "yes" },
  { taxableWithOffer: "66667", standardDeduction: "" },
  {
    household: "full-year-spouse",
    studyLoan: "yes",
    loanScheme: "help",
    helpEligible: "yes",
    loanDebt: "",
    helpFamilyOffer: "yes",
    helpFamilyBase: "no",
  },
];

it.each(profileCases)(
  "preserves tax and payroll variable origins through personal circumstances: %j",
  (edits) => {
    for (const year of ["2025-26", "2026-27"] as const) {
      for (const payFrequency of ["weekly", "fortnightly", "monthly", "quarterly"]) {
        const input = source({ payFrequency, threshold: "no" }, year);
        input.profile = { ...profile, ...edits };
        const missing = taxAndPayroll(input).flatMap((equation) =>
          unresolvedVariables(equationGraph(equation)),
        );
        expect([...new Set(missing)].toSorted((left, right) => left.localeCompare(right))).toEqual(
          [],
        );
      }
    }
  },
);

import { expect, it } from "bun:test";
import { calculateComparison } from "../../src/lib/calculations/comparison.ts";
import {
  cashAfterCosts,
  comparisonBasis,
  monthlyCash,
  monthlyCashEquation,
  overviewPayroll,
} from "../../src/lib/comparison-overview.ts";
import type { Fields } from "../../src/lib/data/model.d.ts";
import { comparisonEquation } from "../../src/lib/explanations/comparison.ts";
import { equationGraph, unresolvedVariables } from "../../src/lib/explanations/navigation.ts";
import { offer, profile } from "../calculations/package-fixture.ts";

function input(fields: Fields = {}) {
  const record = offer(fields);
  record.items = {
    roster: [
      {
        id: "shift",
        fields: { day: "1", start: "09:00", hours: "8", journeys: "1", place: "onsite" },
      },
    ],
  };
  return {
    offer: record,
    profile,
    vehicle: {},
    year: "2026-27",
    target: false,
    oneOff: false,
    timeValue: true,
  } as const;
}

it("shows monthly averages without inventing missing cash or repeating one-off payments", () => {
  const result = calculateComparison(input());
  const example = { annual: 1200, monthly: 100 };
  for (const [annual, monthly] of [
    [example.annual, example.monthly],
    [0, 0],
    [-example.annual, -example.monthly],
    [null, null],
  ]) {
    const sample = {
      ...result,
      metrics: [
        { label: cashAfterCosts, amount: annual ?? null, unit: "money", lowerIsBetter: false },
      ],
    } as const;
    expect(monthlyCash({ ...sample, metrics: [...sample.metrics] })).toBe(monthly ?? null);
  }
  expect(monthlyCash({ ...result, scenario: { target: false, oneOff: true } })).toBeNull();
});

it("links monthly cash to the complete annual equation and retains unavailable explanations", () => {
  const source = input({ energy: "none" });
  const result = calculateComparison(source);
  const equation = monthlyCashEquation(result, comparisonEquation(cashAfterCosts, source, result));
  expect(equation.formula).toBe(
    "average_monthly_cash_after_job_costs = annual_cash_after_job_costs / months_per_year",
  );
  expect(unresolvedVariables(equationGraph(equation))).toEqual([]);
  expect(equation.warnings).toEqual([]);
  const unknown = monthlyCashEquation(
    { ...result, scenario: { target: false, oneOff: true } },
    equation,
  );
  expect(unknown.result?.value).toBeNull();
  expect(unknown.warnings).toHaveLength(1);
});

it("identifies broader estimates, unavailable costs and calendar assumptions beside results", () => {
  const entered = comparisonBasis(calculateComparison(input()));
  expect(entered.join(" ")).toContain("Entered running costs");
  expect(entered.join(" ")).toContain("Roster differs");
  expect(entered.join(" ")).toContain("No leave dates");
  expect(comparisonBasis(calculateComparison(input({ costMethod: "ato" }))).join(" ")).toContain(
    "not cash spending",
  );
  expect(comparisonBasis(calculateComparison(input({ costMethod: "" }))).join(" ")).toContain(
    "basis is incomplete",
  );
  expect(comparisonBasis(calculateComparison(input({ weeklyHours: "8" }))).join(" ")).not.toContain(
    "Roster differs",
  );
  expect(
    comparisonBasis(calculateComparison(input({ cycleDays: "", weeklyHours: "" }))).join(" "),
  ).not.toContain("Roster differs");
  const remote = input();
  remote.offer.items = { roster: [] };
  expect(comparisonBasis(calculateComparison(remote)).join(" ")).toContain("No commuting");
});

it("uses ordinary base payroll with every rule period and preserves unknown bank estimates", () => {
  const source = input();
  const context = overviewPayroll(calculateComparison({ ...source, year: "2025-26" }));
  expect(context.payroll.rulePeriods.map(({ rulePeriod }) => rulePeriod)).toEqual([
    "2025-july",
    "2025-september",
  ]);
  expect(context.payroll.period).toBe("fortnightly");
  expect(context.payroll.grossBaseCash).toMatchObject({ status: "available", amount: 3846.15 });
  const unknown = overviewPayroll(calculateComparison(input({ periodOtherDeductions: "" })));
  expect(
    unknown.payroll.rulePeriods.every(({ bankEstimate }) => bankEstimate.status === "unavailable"),
  ).toBe(true);
  const contractor = overviewPayroll(calculateComparison(input({ employment: "sole-trader" })));
  expect(
    contractor.payroll.rulePeriods.every(
      ({ bankEstimate }) => bankEstimate.status === "unavailable",
    ),
  ).toBe(true);
});

import { expect, it } from "bun:test";
import {
  type ComparisonInput,
  calculateComparison,
} from "../../src/lib/calculations/comparison.ts";
import { comparisonEquation } from "../../src/lib/explanations/comparison.ts";
import { financialCostEquations } from "../../src/lib/explanations/financial-definitions.ts";
import {
  equationGraph,
  resolveVariable,
  unresolvedVariables,
} from "../../src/lib/explanations/navigation.ts";
import { offer, profile } from "../calculations/package-fixture.ts";

function input(): ComparisonInput {
  const record = offer({ personalSuper: "100000" });
  record.items = {
    roster: [
      {
        id: "shift",
        fields: { day: "1", start: "09:00", hours: "8", journeys: "1", place: "onsite" },
      },
    ],
    perks: [{ id: "unknown", fields: { amount: "", frequency: "annual" } }],
    costs: [
      {
        id: "cost",
        fields: {
          amount: "100",
          reimbursement: "20",
          frequency: "monthly",
          recurrence: "recurring",
        },
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
  };
}

it("links every financial component without relying on personal perks", () => {
  const source = input();
  const result = calculateComparison(source);
  for (const label of Object.keys(financialCostEquations)) {
    const equation = comparisonEquation(label, source, result);
    expect(unresolvedVariables(equationGraph(equation))).toEqual([]);
  }
  const equation = comparisonEquation("Cash + super after tax and job costs", source, result);
  const financial = resolveVariable(equationGraph(equation), "", "annual_net_financial_value");
  expect(
    financial?.blocks.some((block) =>
      block.formula.includes(
        "annual_net_financial_value = annual_cash_after_tax + annual_net_super_contributions",
      ),
    ),
  ).toBe(true);
  expect(equation.formula).not.toContain("perk");
  const reimbursements = comparisonEquation("Other job-cost reimbursements", source, result);
  expect(
    resolveVariable(equationGraph(reimbursements), "cost_1", "monthly_job_cost_reimbursement")
      ?.origin,
  ).toContain("entered monthly amount");
});

it("keeps negative time valuation unavailable through recursive package equations", () => {
  const source = input();
  source.profile = { ...profile, taxableWithOffer: "400000", taxableWithoutOffer: "0" };
  const result = calculateComparison(source);
  const equation = comparisonEquation("Cash after tax, job costs and time", source, result);
  const travel = resolveVariable(equationGraph(equation), "", "annual_after_tax_travel_time_value");
  expect(
    travel?.blocks.some((block) =>
      block.formula.includes("annual_after_tax_travel_time_value = unavailable"),
    ),
  ).toBe(true);
  expect(equation.result?.value).toBeNull();
});

import { expect, it } from "bun:test";
import { calculateComparison } from "../../src/lib/calculations/comparison.ts";
import { leaveCashOutLabel } from "../../src/lib/calculations/leave-metrics.ts";
import { comparisonEquation } from "../../src/lib/explanations/comparison.ts";
import {
  equationGraph,
  resolveVariable,
  unresolvedVariables,
} from "../../src/lib/explanations/navigation.ts";
import { bonus, offer, profile } from "../calculations/package-fixture.ts";

it.each(["2025-26", "2026-27"] as const)(
  "traces hypothetical leave through gross pay and the changed annual tax scenario in %s",
  (year) => {
    const input = {
      offer: offer({
        amount: "130000",
        inclusion: "excludes",
        annualLeave: "4",
        leaveOrdinaryHours: "38",
        leaveRateBasis: "salary",
        leaveLoadingBasis: "none",
      }),
      profile,
      vehicle: {},
      year,
      target: false,
      oneOff: false,
      timeValue: true,
    };
    input.offer.items = { earnings: [bonus({ amount: "10000", inclusion: "excludes" })] };
    const result = calculateComparison(input);
    const equation = comparisonEquation(leaveCashOutLabel, input, result);
    const graph = equationGraph(equation);
    const gross = 10_000;
    expect(unresolvedVariables(graph)).toEqual([]);
    expect(
      resolveVariable(graph, "after_leave", "annual_leave_entitlement_gross_value")?.value,
    ).toBeCloseTo(gross);
    expect(
      resolveVariable(graph, "after_leave", "offer_assessable_income")
        ?.blocks.map((block) => block.formula)
        .join("\n"),
    ).toContain("annual_leave_entitlement_gross_value");
    expect(
      resolveVariable(graph, "after_leave", "offer_assessable_labour_income")
        ?.blocks.map((block) => block.formula)
        .join("\n"),
    ).toContain("annual_leave_entitlement_gross_value");
    const expectedTax = { "2025-26": 39_838, "2026-27": 39_570 };
    expect(resolveVariable(graph, "", "annual_tax_with_leave")?.value).toBe(expectedTax[year]);
    expect(equation.result?.value).toBe(result.leaveCashOut.net.amount);
  },
);

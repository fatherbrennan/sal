import { expect, it } from "bun:test";
import {
  type ComparisonInput,
  calculateComparison,
} from "../../src/lib/calculations/comparison.ts";
import { leaveValuationKeys } from "../../src/lib/calculations/leave-metrics.ts";
import { comparisonEquation } from "../../src/lib/explanations/comparison.ts";
import {
  equationGraph,
  resolveVariable,
  unresolvedVariables,
} from "../../src/lib/explanations/navigation.ts";
import { bonus, offer, profile } from "../calculations/package-fixture.ts";

it("explains known zero extra super through exhausted statutory headroom", () => {
  const source = {
    offer: offer({
      amount: "300000",
      inclusion: "excludes",
      annualLeave: "4",
      leaveOrdinaryHours: "38",
      leaveRateBasis: "salary",
      leaveLoadingBasis: "none",
    }),
    profile,
    vehicle: {},
    year: "2026-27",
    target: false,
    oneOff: false,
    timeValue: true,
  } as const;
  const result = calculateComparison(source);
  const equation = comparisonEquation(
    "Hypothetical leave cash-out: employer super",
    source,
    result,
  );
  expect(equation.result?.value).toBe(0);
  expect(equation.formula).toContain(
    "max(0, cash_out_super_earnings_limit - cash_out_existing_period_earnings)",
  );
  expect(unresolvedVariables(equationGraph(equation))).toEqual([]);
});

it.each(["2025-26", "2026-27"] as const)(
  "links earned and cash-out super through base quotes and year-specific checks: %s",
  (year) => {
    const source = cashOutSource(year);
    const result = calculateComparison(source);
    for (const label of Object.keys(leaveValuationKeys)) {
      const equation = comparisonEquation(label, source, result);
      expect(unresolvedVariables(equationGraph(equation))).toEqual([]);
      expect(equation.result?.value).toBe(
        result.metrics.find((metric) => metric.label === label)?.amount,
      );
    }
    const graph = equationGraph(
      comparisonEquation("Hypothetical leave cash-out: net total", source, result),
    );
    const expected = { gross: 11_200, super: 1200, baseSuper: 15_600, taxable: 150_000 };
    expect(resolveVariable(graph, "", "annual_base_employer_super")?.value).toBe(
      expected.baseSuper,
    );
    expect(resolveVariable(graph, "", "annual_leave_base_pay_plus_super")?.value).toBeCloseTo(
      expected.gross,
    );
    expect(resolveVariable(graph, "", "leave_cash_out_employer_super")?.value).toBeCloseTo(
      expected.super,
    );
    expect(resolveVariable(graph, "", "taxable_income_with_leave")?.value).toBe(expected.taxable);
  },
);

it.each(["2025-26", "2026-27"] as const)("links the combined hypothetical total in %s", (year) => {
  const source = cashOutSource(year);
  const result = calculateComparison(source);
  const taxable = 150_000;
  const total = comparisonEquation(
    "Package value including hypothetical leave cash-out",
    source,
    result,
  );
  const graph = equationGraph(total);
  expect(unresolvedVariables(graph)).toEqual([]);
  expect(
    resolveVariable(graph, "", "annual_net_package_after_commuting_costs_and_time")?.scope,
  ).toBe("real_world");
  expect(resolveVariable(graph, "", "leave_cash_out_net_total")?.scope).toBe("leave_cash_out");
  expect(resolveVariable(graph, "leave_cash_out", "taxable_income_with_leave")?.value).toBe(
    taxable,
  );
  expect(total.result?.value).toBe(
    result.metrics.find(
      ({ label }) => label === "Package value including hypothetical leave cash-out",
    )?.amount,
  );
});

function cashOutSource(year: ComparisonInput["year"]): ComparisonInput {
  const record = offer({
    amount: "130000",
    inclusion: "excludes",
    annualLeave: "4",
    leaveOrdinaryHours: "38",
    leaveRateBasis: "salary",
    leaveLoadingBasis: "none",
  });
  record.items = { earnings: [bonus({ amount: "10000", inclusion: "excludes" })] };
  return {
    offer: record,
    profile,
    vehicle: {},
    year,
    target: false,
    oneOff: false,
    timeValue: true,
  };
}

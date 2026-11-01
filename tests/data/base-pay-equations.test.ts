import { expect, it } from "bun:test";
import {
  type ComparisonInput,
  calculateComparison,
} from "../../src/lib/calculations/comparison.ts";
import type { Fields } from "../../src/lib/data/model.d.ts";
import { comparisonEquation } from "../../src/lib/explanations/comparison.ts";
import type { EquationSection } from "../../src/lib/explanations/model.ts";
import {
  equationGraph,
  resolveVariable,
  unresolvedVariables,
} from "../../src/lib/explanations/navigation.ts";
import { annualEquation } from "../../src/lib/explanations/tax.ts";
import { bonus, offer, profile } from "../calculations/package-fixture.ts";

function input(fields: Fields = {}): ComparisonInput {
  const record = offer({ amount: "105000", ...fields });
  record.items = { earnings: [bonus({ amount: "10000" })] };
  return {
    offer: record,
    profile,
    vehicle: {},
    year: "2026-27",
    target: false,
    oneOff: false,
    timeValue: false,
  };
}

it("links the base-hour numerator through its own salary split, excluding bonus amounts", () => {
  const source = input();
  const equation = comparisonEquation(
    "Base cash per paid hour",
    source,
    calculateComparison(source),
  );
  const graph = equationGraph(equation);
  const baseCash = 93_750;
  expect(resolveVariable(graph, "", "annual_base_cash")?.value).toBeCloseTo(baseCash);
  expect(
    resolveVariable(graph, "", "annual_base_cash")
      ?.blocks.map(({ formula }) => formula)
      .join("\n"),
  ).toContain("annual_base_cash = annual_base_cash_before_cap");
  expect(unresolvedVariables(graph)).toEqual([]);
});

it.each([{}, { amount: "400000" }, { inclusion: "excludes", amount: "400000" }, { inclusion: "" }])(
  "base-only equations resolve across complete, capped and incomplete quotes: %j",
  (fields) => {
    const source = { ...input(fields), baseOnly: true };
    source.offer.items = { earnings: [bonus({ taxClass: "" })] };
    const result = calculateComparison(source);
    const missing = result.metrics.flatMap(({ label }) =>
      unresolvedVariables(equationGraph(comparisonEquation(label, source, result))),
    );
    expect([...new Set(missing)]).toEqual([]);
    const cash = comparisonEquation("Cash after tax and personal super", source, result);
    expect(cash.context).toContain("Base only");
    expect(cash.formula).not.toContain("unsupported");
  },
);

it("shows embedded base-only and capped component breakdowns as unavailable", () => {
  const source = input();
  source.offer.items = { earnings: [bonus({ included: "yes" })] };
  source.baseOnly = true;
  const result = calculateComparison(source);
  const equation = comparisonEquation("Annual base cash before deductions", source, result);
  expect(equation.formula).toBe("annual_base_cash = unavailable");
  expect(unresolvedVariables(equationGraph(equation))).toEqual([]);
});

it("keeps an ineligible bonus out of the capped inclusive base-cash equation", () => {
  const source = input({ amount: "400000" });
  source.offer.items = { earnings: [bonus({ eligible: "no" })] };
  const result = calculateComparison(source);
  const equation = comparisonEquation("Annual base cash before deductions", source, result);
  const baseCash = 367_500.4;
  expect(equation.result?.value).toBeCloseTo(baseCash);
  expect(equation.formula).toBe(
    "annual_base_cash = annual_base_pay_quote - annual_base_employer_super",
  );
  expect(unresolvedVariables(equationGraph(equation))).toEqual([]);
});

function formulas(section: EquationSection): string {
  return [section.formula, ...(section.sections ?? []).map(formulas)].join("\n");
}

it("base-only tax equations do not present the saved full-offer override as a usable input", () => {
  const source = {
    ...input(),
    baseOnly: true,
    profile: { ...profile, taxableWithOffer: "102678" },
  };
  const result = calculateComparison(source);
  const equation = annualEquation("taxableInput", result.tax.withOffer, result, {
    title: "Taxable income",
  });
  expect(equation.result?.value).toBeNull();
  expect(formulas(equation)).not.toContain("taxable_income = 102678");
  expect(formulas(equation)).toContain("taxable_income = unavailable");
  expect(unresolvedVariables(equationGraph(equation))).toEqual([]);
});

it("base-only tax equations retain unknown reportable super at every linked input", () => {
  const source = { ...input({ reportableSuperOffer: "3000" }), baseOnly: true };
  const result = calculateComparison(source);
  const equation = annualEquation("mls", result.tax.withOffer, result, {
    title: "Medicare levy surcharge",
  });
  const graph = equationGraph(equation);
  expect(resolveVariable(graph, "", "offer_reportable_super_contributions")?.value).toBeNull();
  expect(equation.result?.value).toBeNull();
  expect(unresolvedVariables(graph)).toEqual([]);
});

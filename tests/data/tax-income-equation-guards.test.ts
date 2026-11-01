import { expect, it } from "bun:test";
import {
  type ComparisonInput,
  calculateComparison,
} from "../../src/lib/calculations/comparison.ts";
import { comparisonEquation } from "../../src/lib/explanations/comparison.ts";
import type { EquationSection } from "../../src/lib/explanations/model.ts";
import { equationGraph, resolveVariable } from "../../src/lib/explanations/navigation.ts";
import { annualEquation } from "../../src/lib/explanations/tax.ts";
import { bonus, offer, profile } from "../calculations/package-fixture.ts";

function input(): ComparisonInput {
  return {
    offer: offer({ amount: "100000", inclusion: "excludes" }),
    profile,
    vehicle: {},
    year: "2026-27",
    target: false,
    oneOff: false,
    timeValue: false,
  };
}

it("tax income guards: package cash drill-down also rejects sacrifice above cash pay", () => {
  const source = input();
  source.offer.fields = {
    ...source.offer.fields,
    sacrifice: "100001",
    reportableSuperOffer: "100001",
  };
  const result = calculateComparison(source);
  const explained = comparisonEquation("Cash after tax and personal super", source, result);
  const target = resolveVariable(equationGraph(explained), "", "annual_cash_before_tax");
  expect(target?.blocks.map(({ formula }) => formula).join("\n")).toContain(
    "annual_cash_before_tax = unavailable",
  );
  expect(target?.blocks.map(({ formula }) => formula).join("\n")).not.toContain(
    "annual_cash_before_tax = annual_cash_pay - annual_salary_sacrifice",
  );
});

function formulas(section: EquationSection): string {
  return [section.formula, ...(section.sections ?? []).map(formulas)].join("\n");
}

function detail(source: ComparisonInput, withoutOffer = false) {
  const comparison = calculateComparison(source);
  let scenario = comparison.tax.withOffer;
  if (withoutOffer) {
    scenario = comparison.tax.withoutOffer;
  }
  return annualEquation("derivedTaxableIncome", scenario, comparison, {
    title: "Offer income",
    withoutOffer,
  });
}

it.each([
  { certainty: "guaranteed", recurrence: "recurring", target: false, oneOff: false },
  { certainty: "target", recurrence: "recurring", target: true, oneOff: false },
  { certainty: "guaranteed", recurrence: "once", target: false, oneOff: true },
])(
  "tax income guards: selected $certainty / $recurrence unsupported earnings remain unavailable",
  ({ certainty, recurrence, target, oneOff }) => {
    const source = input();
    source.target = target;
    source.oneOff = oneOff;
    source.offer.items = { earnings: [bonus({ certainty, recurrence, taxClass: "other" })] };
    const explained = detail(source);
    expect(explained.result?.value).toBeNull();
    expect(formulas(explained)).toContain("offer_assessable_income = unavailable");
    expect(formulas(explained)).toContain(
      "selected bonus has unsupported or unknown tax treatment",
    );
    expect(formulas(explained)).not.toContain(
      "offer_assessable_income = annual_cash_pay - annual_salary_sacrifice",
    );
    expect(formulas(explained)).toContain(
      "offer_assessable_labour_income = annual_cash_pay - annual_salary_sacrifice",
    );
    const absent = detail(source, true);
    expect(absent.result?.value).toBe(0);
    expect(formulas(absent)).toContain("offer_assessable_income = 0");
    expect(formulas(absent)).not.toContain("offer_assessable_income = unavailable");
  },
);

it.each([
  { certainty: "target", recurrence: "recurring" },
  { certainty: "guaranteed", recurrence: "once" },
])(
  "tax income guards: excluded $certainty / $recurrence earnings do not block income",
  (fields) => {
    const source = input();
    source.offer.items = { earnings: [bonus({ ...fields, taxClass: "other" })] };
    const explained = detail(source);
    const baseCash = 100_000;
    expect(explained.result?.value).toBe(baseCash);
    expect(formulas(explained)).toContain(
      "offer_assessable_income = annual_cash_pay - annual_salary_sacrifice",
    );
    expect(formulas(explained)).not.toContain("offer_assessable_income = unavailable");
  },
);

it("tax income guards: excessive salary sacrifice cannot produce negative assessable or labour income", () => {
  const source = input();
  source.offer.fields = {
    ...source.offer.fields,
    sacrifice: "100001",
    reportableSuperOffer: "100001",
  };
  const explained = detail(source);
  expect(explained.result?.value).toBeNull();
  expect(formulas(explained)).toContain("offer_assessable_income = unavailable");
  expect(formulas(explained)).toContain("offer_assessable_labour_income = unavailable");
  expect(formulas(explained)).toContain("Salary sacrifice exceeds the selected cash pay");
  expect(formulas(explained)).not.toContain("annual_cash_pay - annual_salary_sacrifice");
  source.offer.fields = {
    ...source.offer.fields,
    sacrifice: "100000",
    reportableSuperOffer: "100000",
  };
  const boundary = detail(source);
  expect(boundary.result?.value).toBe(0);
  expect(formulas(boundary)).toContain(
    "offer_assessable_income = annual_cash_pay - annual_salary_sacrifice",
  );
});

it("tax income guards: business losses stay unsupported without erasing explicit labour inputs", () => {
  const source = input();
  source.offer = offer({
    employment: "sole-trader",
    amount: "100000",
    gst: "exclusive",
    businessDeductions: "100001",
    eligibleLabour: "0",
    specifiedDeductions: "0",
  });
  const explained = detail(source);
  expect(explained.result?.value).toBeNull();
  expect(formulas(explained)).toContain("offer_assessable_income = unavailable");
  expect(formulas(explained)).toContain("Business deductions exceed revenue excluding GST");
  expect(formulas(explained)).not.toContain("offer_assessable_income = annual_cash_pay");
  expect(
    resolveVariable(equationGraph(explained), "", "offer_assessable_labour_income")?.value,
  ).toBe(0);
  expect(detail(source, true).result?.value).toBe(0);
  source.offer.fields = { ...source.offer.fields, businessDeductions: "100000" };
  expect(detail(source).result?.value).toBe(0);
});

it("tax income guards: a taxable-income override does not make unsupported income construction valid", () => {
  const source = input();
  source.offer.items = { earnings: [bonus({ taxClass: "other" })] };
  source.profile = { ...source.profile, taxableWithOffer: "120000" };
  const comparison = calculateComparison(source);
  const explained = annualEquation("taxableInput", comparison.tax.withOffer, comparison, {
    title: "Established taxable input",
  });
  const establishedTaxableIncome = 120_000;
  expect(explained.result?.value).toBe(establishedTaxableIncome);
  expect(formulas(explained)).toContain("taxable_income = 120000");
  expect(formulas(explained)).toContain("offer_assessable_income = unavailable");
  expect(comparison.tax.withOffer.derivedTaxableIncome.status).toBe("unavailable");
});

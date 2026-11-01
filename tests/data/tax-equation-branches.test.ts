import { expect, it } from "bun:test";
import { calculateComparison } from "../../src/lib/calculations/comparison.ts";
import type { TaxYear } from "../../src/lib/calculations/tax/types.d.ts";
import type { Fields } from "../../src/lib/data/model.d.ts";
import {
  type Equation,
  type EquationSection,
  equationValues,
} from "../../src/lib/explanations/model.ts";
import { annualEquation, annualSections } from "../../src/lib/explanations/tax.ts";
import { offer, profile } from "../calculations/package-fixture.ts";

function result(profileEdits: Fields = {}, offerEdits: Fields = {}, year: TaxYear = "2026-27") {
  return calculateComparison({
    offer: offer(offerEdits),
    profile: { ...profile, ...profileEdits },
    vehicle: {},
    year,
    target: false,
    oneOff: false,
    timeValue: false,
  });
}

function equation(key: string, comparison: ReturnType<typeof result>, withoutOffer = false) {
  let scenario = comparison.tax.withOffer;
  if (withoutOffer) {
    scenario = comparison.tax.withoutOffer;
  }
  return annualEquation(key, scenario, comparison, { title: "Annual example", withoutOffer });
}

function blocks(value: EquationSection): EquationSection[] {
  return [value, ...(value.sections ?? []).flatMap(blocks)];
}

function formulas(value: Equation): string {
  return blocks(value)
    .map((block) => block.formula)
    .join("\n");
}

function bindings(value: Equation): string {
  return blocks(value)
    .map((section) => section.values ?? {})
    .map(equationValues)
    .join("\n");
}

const spouse: Fields = {
  household: "full-year-spouse",
  spouseTaxableIncome: "10000",
  spouseMlsIncome: "200000",
  levyChildren: "1",
  mlsChildren: "2",
};
const loan: Fields = {
  studyLoan: "yes",
  loanScheme: "help",
  helpEligible: "yes",
  loanDebt: "24000",
};

it.each([
  { year: "2025-26", rate: "0.16", excluded: "0.15", deduction: 0 },
  { year: "2026-27", rate: "0.15", excluded: "0.16", deduction: 1000 },
] satisfies { year: TaxYear; rate: string; excluded: string; deduction: number }[])(
  "tax equation branches: shows only the selected year's income rate and applicable standard deduction: $year",
  ({ year, rate, excluded, deduction }) => {
    const comparison = result({ standardDeduction: "yes" }, {}, year);
    const tax = equation("basicIncomeTax", comparison);
    expect(tax.title).toContain(year);
    expect(formulas(tax)).toContain(`first_band_rate = ${rate}`);
    expect(formulas(tax)).not.toContain(`first_band_rate = ${excluded}`);
    expect(equation("standardDeduction", comparison).result?.value).toBe(deduction);
  },
);

it("tax equation branches: distinguishes declined standard-deduction eligibility from an unanswered input", () => {
  const declined = equation("standardDeduction", result({ standardDeduction: "no" }));
  const missing = equation("standardDeduction", result({ standardDeduction: "" }));
  expect(declined.formula).toContain("standard_deduction = 0");
  expect(declined.result?.value).toBe(0);
  expect(missing.formula).toBe("standard_deduction = unavailable");
  expect(missing.result?.value).toBeNull();
  expect(missing.warnings?.join(" ")).toContain("missing-input");
  expect(formulas(missing)).toContain("Standard-deduction eligibility is not established");
});

it("tax equation branches: keeps the established taxable-income override distinct from the estimate conversion", () => {
  const override = equation("taxableInput", result({ taxableWithOffer: "40000" }));
  expect(override.formula).toBe("taxable_income = 40000");
  expect(override.result).toMatchObject({ name: "taxable_income", value: 40_000 });
  expect(bindings(override)).toContain("taxable_income = 40000");
  expect(Object.entries(override.origins ?? {})).toContainEqual([
    "taxable_income",
    expect.stringContaining("taxableWithOffer"),
  ]);
  expect(formulas(override)).not.toContain("floor(round(derived_taxable_income");
  const estimated = equation("taxableInput", result({}, { amount: "112000.56" }));
  expect(estimated.formula).toContain("floor(round(derived_taxable_income * 100) / 100)");
  expect(formulas(estimated)).toContain("not verified final-assessment precision");
});

it.each([
  { taxable: "40000", applied: 575, taper: "700000 - (taxable_income - 37500) * 50" },
  { taxable: "45001", applied: 324.985, taper: "325000 - (taxable_income - 45000) * 15" },
])(
  "tax equation branches: retains the active LITO taper and its raw precision at $taxable",
  ({ taxable, applied, taper }) => {
    const offset = equation("lito", result({ taxableWithOffer: taxable }));
    expect(offset.formula).toBe("applied_lito = min(basic_income_tax, lito_entitlement)");
    expect(formulas(offset)).toContain(taper);
    expect(offset.result?.value).toBe(applied);
    expect(bindings(offset)).toContain(`applied_lito = ${applied}`);
  },
);

it("tax equation branches: keeps the unresolved LITO endpoint unavailable instead of displaying a zero offset", () => {
  const comparison = result({ taxableWithOffer: "66667" });
  const offset = equation("lito", comparison);
  expect(offset.formula).toBe("applied_lito = unavailable");
  expect(offset.result?.value).toBeNull();
  expect(offset.warnings?.join(" ")).toContain("Unavailable (unverified-rule)");
  expect(offset.warnings?.join(" ")).toContain("66,667");
  expect(formulas(offset)).toContain("lito_entitlement = unavailable");
  expect(equation("basicIncomeTax", comparison).result?.value).not.toBeNull();
});

it("tax equation branches: keeps spouse taxable income and levy children separate from the surcharge test", () => {
  const comparison = result({ ...spouse, taxableWithOffer: "40000" }, {}, "2025-26");
  const levy = equation("medicare", comparison);
  const surcharge = equation("mls", comparison);
  expect(formulas(levy)).toContain("levy_family_income = taxable_income + spouse_taxable_income");
  expect(formulas(levy)).toContain(
    "levy_family_threshold = 47238 + 4338 * levy_qualifying_children",
  );
  expect(bindings(levy)).toContain("spouse_taxable_income = 10000");
  expect(bindings(levy)).toContain("levy_qualifying_children = 1");
  expect(formulas(surcharge)).toContain(
    "mls_household_test_income = mls_individual_test_income + spouse_mls_test_income",
  );
  expect(formulas(surcharge)).toContain("mls_threshold_multiplier = 2");
  expect(formulas(surcharge)).toContain("mls_individual_test_income <= 28011");
  expect(formulas(surcharge)).toContain("mls_base_thresholds = [101000, 118000, 158000]");
  expect(bindings(surcharge)).toContain("spouse_mls_test_income = 200000");
  expect(bindings(surcharge)).toContain("mls_qualifying_children = 2");
});

it("tax equation branches: uses family MLS tiers for a single parent without importing spouse income or assumed levy relief", () => {
  const comparison = result({
    household: "single-with-dependants",
    levyFamilyRelief: "no",
    mlsChildren: "2",
  });
  const surcharge = equation("mls", comparison);
  expect(formulas(surcharge)).toContain("threshold_multiplier = 2");
  expect(formulas(surcharge)).toContain("max(0, mls_qualifying_children - 1) * 1500");
  expect(formulas(surcharge)).not.toContain(" + spouse_mls_test_income");
  expect(formulas(equation("medicare", comparison))).not.toContain("family_income =");
  const unknown = equation("medicare", result({ household: "" }));
  expect(unknown.formula).toBe("medicare_levy = unavailable");
  expect(unknown.warnings?.join(" ")).toContain("missing-input");
  expect(formulas(unknown)).not.toContain("No family reduction applies");
});

it("tax equation branches: shows no-loan zero only when the resident gate permits the annual component", () => {
  const none = equation("help", result({ studyLoan: "no" }));
  expect(none.formula).toBe("help_repayment = 0");
  expect(none.result?.value).toBe(0);
  expect(formulas(none)).not.toContain("lower_threshold");
  expect(formulas(none)).not.toContain("offer_assessable_income");
  const unsupported = equation("help", result({ studyLoan: "no", resident: "no" }));
  expect(unsupported.formula).toBe("help_repayment = unavailable");
  expect(unsupported.result?.value).toBeNull();
  expect(unsupported.warnings?.join(" ")).toContain("unsupported-regime");
});

it.each([
  { edits: { studyLoan: "" }, code: "missing-input", detail: "not established" },
  {
    edits: { studyLoan: "yes", loanScheme: "other-or-multiple" },
    code: "unsupported-regime",
    detail: "unsupported",
  },
] satisfies { edits: Fields; code: string; detail: string }[])(
  "tax equation branches: preserves $code loan status instead of choosing a supported repayment branch",
  ({ edits, code, detail }) => {
    const unknown = equation("help", result(edits));
    expect(unknown.formula).toBe("help_repayment = unavailable");
    expect(unknown.result?.value).toBeNull();
    expect(unknown.warnings?.join(" ")).toContain(code);
    expect(formulas(unknown)).toContain(detail);
    expect(formulas(unknown)).not.toContain("lower_threshold =");
  },
);

it("tax equation branches: keeps HELP family exemption and debt requirements separate in the two annual scenarios", () => {
  const comparison = result({
    ...spouse,
    ...loan,
    loanDebt: "",
    helpFamilyOffer: "yes",
    helpFamilyBase: "no",
  });
  const exempt = equation("help", comparison);
  const baseline = equation("help", comparison, true);
  expect(exempt.formula).toBe("help_repayment = 0");
  expect(exempt.result?.value).toBe(0);
  expect(formulas(exempt)).toContain("section 8 family exemption");
  expect(formulas(exempt)).not.toContain("lower_threshold");
  expect(baseline.result?.value).toBeNull();
  expect(baseline.warnings?.join(" ")).toContain("HELP repayable debt");
  expect(formulas(baseline)).toContain("lower_threshold = 69528");
  const unknown = equation("help", result({ ...spouse, ...loan, helpFamilyOffer: "" }));
  expect(unknown.result?.value).toBeNull();
  expect(formulas(unknown)).toContain("family-exemption status is unknown");
});

it("tax equation branches: explains contractor income separately and leaves an unselected arrangement unknown", () => {
  const contractor = equation(
    "derivedTaxableIncome",
    result(
      {},
      {
        employment: "sole-trader",
        amount: "110000",
        gst: "inclusive",
        eligibleLabour: "100000",
        businessDeductions: "2000",
        specifiedDeductions: "0",
      },
    ),
  );
  expect(formulas(contractor)).toContain("offer_assessable_income = annual_cash_pay");
  expect(Object.entries(contractor.origins ?? {})).toContainEqual([
    "offer_deductions",
    expect.stringContaining("business deduction inputs"),
  ]);
  expect(formulas(contractor)).not.toContain("annual_cash_pay - annual_salary_sacrifice");
  expect(bindings(contractor)).toContain("offer_deductions = 2000");
  const unknown = equation("derivedTaxableIncome", result({}, { employment: "" }));
  expect(unknown.result?.value).toBeNull();
  expect(formulas(unknown)).toContain("Offer income treatment is unknown");
  expect(formulas(unknown)).not.toContain(
    "offer_assessable_income = annual_cash_pay - annual_salary_sacrifice",
  );
});

it("tax equation branches: isolates annual scenarios and links attribution without alias equations", () => {
  const comparison = result({ taxableWithOffer: "40000", taxableWithoutOffer: "10000" });
  const [withOffer] = annualSections(comparison, comparison.tax.withOffer);
  const [without] = annualSections(comparison, comparison.tax.withoutOffer, true);
  expect(withOffer?.scope).toBe("with_offer");
  expect(without?.scope).toBe("without_offer");
  const detail = equation("rawComponentSubtotal", comparison);
  const attribution = blocks(detail).find((block) => block.references !== undefined);
  expect(attribution?.references).toEqual(
    Object.fromEntries([
      [
        "annual_component_subtotal_with_offer",
        { scope: "with_offer", name: "annual_component_subtotal" },
      ],
      [
        "annual_component_subtotal_without_offer",
        { scope: "without_offer", name: "annual_component_subtotal" },
      ],
    ]),
  );
  expect(formulas(detail)).not.toContain("annual_tax_with_offer =");
  expect(formulas(detail)).not.toContain("entered_");
  expect(formulas(detail)).toContain(
    "offer_attributed_annual_tax_estimate = annual_component_subtotal_with_offer - annual_component_subtotal_without_offer",
  );
});

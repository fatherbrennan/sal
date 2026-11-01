import { expect, it } from "bun:test";
import { calculateProfileTax } from "../../../src/lib/calculations/tax/profile.ts";
import type { TaxFields } from "../../../src/lib/calculations/tax/types.d.ts";
import { amount, checkedDecimalPlaces } from "./fixtures.ts";
import { offer, profile } from "./profile-fixtures.ts";

const spouseFields: TaxFields = {
  household: "full-year-spouse",
  spouseTaxableIncome: "10000",
  spouseMlsIncome: "10000",
  levyChildren: "0",
  mlsChildren: "0",
};

it("applies the MC-B2 spouse reduction without adding spouse income to own cash or taxable income", () => {
  const result = calculateProfileTax({
    year: "2025-26",
    profile: profile(spouseFields),
    offer: offer({ assessableIncome: 40_000, assessableLabourIncome: 40_000 }),
  });
  const checked = { levy: 76.2, income: 40_000 };
  expect(amount(result.withOffer.annual.medicare)).toBeCloseTo(checked.levy, checkedDecimalPlaces);
  expect(amount(result.withoutOffer.annual.medicare)).toBe(0);
  expect(result.withOffer.input.taxableIncome).toBe(checked.income);
  expect(result.incrementalTax.status).toBe("available");
});

it("keeps spouse taxable income separate from the MC-B5 surcharge test and liable-day charge", () => {
  const result = calculateProfileTax({
    year: "2026-27",
    profile: profile({
      ...spouseFields,
      spouseTaxableIncome: "100000",
      spouseMlsIncome: "100000",
      hospitalCover: "no",
      mlsLiableDays: "100",
    }),
    offer: offer({
      assessableIncome: 109_500,
      assessableLabourIncome: 109_500,
      reportableSuper: 20_000,
    }),
  });
  const surcharge = 300;
  expect(amount(result.withOffer.annual.mls)).toBe(surcharge);
  expect(amount(result.withoutOffer.annual.mls)).toBe(0);
});

it("uses distinct established child counts for levy relief and MLS tiers", () => {
  const result = calculateProfileTax({
    year: "2025-26",
    profile: profile({
      ...spouseFields,
      spouseTaxableIncome: "0",
      spouseMlsIncome: "190000",
      levyChildren: "2",
      mlsChildren: "1",
      hospitalCover: "no",
      mlsLiableDays: "365",
    }),
    offer: offer({ assessableIncome: 50_000, assessableLabourIncome: 50_000 }),
  });
  const surcharge = 625;
  expect(amount(result.withOffer.annual.medicare)).toBe(0);
  expect(amount(result.withOffer.annual.mls)).toBe(surcharge);
});

it("makes the verified single-with-dependants MLS branch available without inventing levy relief", () => {
  const result = calculateProfileTax({
    year: "2026-27",
    profile: profile({
      household: "single-with-dependants",
      levyFamilyRelief: "no",
      mlsChildren: "2",
      hospitalCover: "no",
      mlsLiableDays: "365",
    }),
    offer: offer({ assessableIncome: 211_500, assessableLabourIncome: 211_500 }),
  });
  const levy = 4230;
  expect(amount(result.withOffer.annual.mls)).toBe(0);
  expect(amount(result.withOffer.annual.medicare)).toBe(levy);
  expect(result.incrementalTax.status).toBe("available");
});

it("requires separate established HELP family exceptions for the two assessment scenarios", () => {
  const result = calculateProfileTax({
    year: "2025-26",
    profile: profile({
      ...spouseFields,
      otherIncome: "20000",
      reportableSuper: "60000",
      studyLoan: "yes",
      loanScheme: "help",
      helpEligible: "yes",
      loanDebt: "100000",
      helpFamilyOffer: "no",
      helpFamilyBase: "yes",
    }),
    offer: offer({ assessableIncome: 40_000, assessableLabourIncome: 40_000 }),
  });
  const withLoan = 7950;
  expect(amount(result.withOffer.annual.help)).toBe(withLoan);
  expect(amount(result.withoutOffer.annual.help)).toBe(0);
});

it.each([
  { edits: { household: "" } },
  { edits: { household: "other" } },
  { edits: { household: "invalid" } },
  { edits: { ...spouseFields, spouseTaxableIncome: "" } },
  { edits: { ...spouseFields, spouseMlsIncome: "" } },
  { edits: { ...spouseFields, levyChildren: "" } },
  { edits: { ...spouseFields, mlsChildren: "" } },
  { edits: { ...spouseFields, levyChildren: "0.5" } },
  { edits: { household: "single-with-dependants", levyFamilyRelief: "yes", mlsChildren: "1" } },
  { edits: { household: "single-with-dependants", mlsChildren: "1" } },
  { edits: { ...spouseFields, studyLoan: "yes", loanScheme: "help", helpEligible: "yes" } },
] satisfies { edits: TaxFields }[])(
  "does not infer missing family facts or support special regimes",
  ({ edits }) => {
    const result = calculateProfileTax({
      year: "2026-27",
      profile: profile(edits),
      offer: offer(),
    });
    expect(result.incrementalTax.status).toBe("unavailable");
  },
);

it("independently recalculates labour-limited standard deductions in both valid scenarios", () => {
  const result = calculateProfileTax({
    year: "2026-27",
    profile: profile({
      otherIncome: "50000",
      otherLabourIncome: "500",
      deductions: "300",
      otherSpecifiedDeductions: "200",
      standardDeduction: "yes",
    }),
    offer: offer({
      assessableIncome: 10_000,
      assessableLabourIncome: 10_000,
      deductions: 400,
      specifiedWorkDeductions: 100,
    }),
  });
  const checked = {
    baseStandard: 300,
    offerStandard: 700,
    baseIncome: 49_400,
    offerIncome: 58_600,
    tax: 3082,
  };
  expect(amount(result.withoutOffer.standardDeduction)).toBe(checked.baseStandard);
  expect(amount(result.withOffer.standardDeduction)).toBe(checked.offerStandard);
  expect(amount(result.withoutOffer.derivedTaxableIncome)).toBe(checked.baseIncome);
  expect(amount(result.withOffer.derivedTaxableIncome)).toBe(checked.offerIncome);
  expect(amount(result.incrementalTax)).toBeCloseTo(checked.tax, checkedDecimalPlaces);
});

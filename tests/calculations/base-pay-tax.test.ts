import { expect, it } from "bun:test";
import { calculateComparison } from "../../src/lib/calculations/comparison.ts";
import type { Fields } from "../../src/lib/data/model.d.ts";
import { bonus, offer, profile } from "./package-fixture.ts";
import { amount } from "./tax/fixtures.ts";

function input(fields: Fields = {}, personal: Fields = {}) {
  const record = offer({ amount: "105000", ...fields });
  record.items = { earnings: [bonus({ amount: "10000" })] };
  return {
    offer: record,
    profile: { ...profile, ...personal },
    vehicle: {},
    year: "2026-27" as const,
    target: false,
    oneOff: false,
    timeValue: false,
    baseOnly: true,
  };
}

const help: Fields = {
  studyLoan: "yes",
  loanScheme: "help",
  helpEligible: "yes",
  loanDebt: "100000",
};
const spouse: Fields = {
  ...help,
  household: "full-year-spouse",
  spouseTaxableIncome: "0",
  spouseMlsIncome: "0",
  levyChildren: "0",
  mlsChildren: "0",
  helpFamilyOffer: "no",
  helpFamilyBase: "yes",
};

it.each(["0", "102678"])(
  "base-only tax refuses a saved full-offer taxable-income override: %s",
  (taxableWithOffer) => {
    const source = input({}, { taxableWithOffer, taxableWithoutOffer: "0" });
    const original = structuredClone(source);
    const result = calculateComparison(source);
    const baseCash = 93_750;
    expect(amount(result.tax.withOffer.derivedTaxableIncome)).toBeCloseTo(baseCash);
    expect(result.tax.withOffer.taxableInput.status).toBe("unavailable");
    expect(result.tax.incrementalTax.status).toBe("unavailable");
    expect(amount(result.tax.withoutOffer.taxableInput)).toBe(0);
    expect(result.baseCash).toBeCloseTo(baseCash);
    expect(source).toEqual(original);
    expect(result.profile).toHaveProperty("taxableWithOffer", taxableWithOffer);
    expect(
      calculateComparison({ ...source, baseOnly: false }).tax.withOffer.taxableInput.status,
    ).toBe("available");
  },
);

it("base-only tax preserves overrides when no earnings are removed and derives explicit blanks", () => {
  const source = input({}, { taxableWithOffer: "93750" });
  source.offer.items = {};
  const baseCash = 93_750;
  expect(amount(calculateComparison(source).tax.withOffer.taxableInput)).toBe(baseCash);
  source.offer.items = { earnings: [bonus()] };
  source.profile = { ...source.profile, taxableWithOffer: "" };
  expect(amount(calculateComparison(source).tax.withOffer.taxableInput)).toBe(baseCash);
});

it.each(["yes", "no"])(
  "base-only tax requires a fresh non-single HELP family result instead of reusing %s",
  (helpFamilyOffer) => {
    const source = input({}, { ...spouse, helpFamilyOffer });
    const result = calculateComparison(source);
    expect(result.tax.withOffer.annual.help.status).toBe("unavailable");
    expect(result.tax.withOffer.annual.basicIncomeTax.status).toBe("available");
    expect(amount(result.tax.withoutOffer.annual.help)).toBe(0);
    expect(result.profile).toHaveProperty("helpFamilyOffer", helpFamilyOffer);
    expect(
      calculateComparison({ ...source, baseOnly: false }).tax.withOffer.annual.help.status,
    ).toBe("available");
  },
);

it("base-only tax recomputes supported single HELP and keeps unrelated settings and amounts", () => {
  const source = input({ sacrifice: "1000", reportableSuperOffer: "1000" }, help);
  const result = calculateComparison(source);
  const repayment = 3633.3;
  expect(amount(result.tax.withOffer.annual.help)).toBeCloseTo(repayment);
  expect(result.payer).toHaveProperty("sacrifice", "1000");
  expect(result.tax.incrementalTax.status).toBe("available");
});

it("base-only tax withholds bonus-linked reportable super without erasing other tax components", () => {
  const source = input({ sacrifice: "1000", reportableSuperOffer: "3000" }, help);
  const result = calculateComparison(source);
  expect(result.tax.withOffer.input.mls?.reportableSuper).toBeNull();
  expect(result.tax.withOffer.annual.help.status).toBe("unavailable");
  expect(result.tax.withOffer.annual.mls.status).toBe("unavailable");
  expect(result.tax.withOffer.annual.basicIncomeTax.status).toBe("available");
  expect(result.tax.withOffer.annual.medicare.status).toBe("available");
  expect(result.payer).toHaveProperty("reportableSuperOffer", "3000");
  expect(calculateComparison({ ...source, baseOnly: false }).tax.incrementalTax.status).toBe(
    "available",
  );
});

it("base-only tax retains standard sacrifice-derived reporting and explicit zero", () => {
  const source = input({ sacrifice: "1000" }, help);
  const { reportableSuperOffer: _, ...fields } = source.offer.fields;
  source.offer.fields = fields;
  const reported = 1000;
  expect(calculateComparison(source).tax.withOffer.input.mls?.reportableSuper).toBe(reported);
  expect(calculateComparison(input()).tax.withOffer.input.mls?.reportableSuper).toBe(0);
  expect(calculateComparison(input({ reportableSuperOffer: "" })).tax.incrementalTax.status).toBe(
    "unavailable",
  );
});

it("base-only tax holds entered other income, deductions and contributions fixed", () => {
  const source = input(
    { sacrifice: "1000", reportableSuperOffer: "1000", personalSuper: "500" },
    { otherIncome: "10000", deductions: "500", workDeductions: "1000" },
  );
  const result = calculateComparison(source);
  const expected = { withOffer: 101_250, withoutOffer: 9500, tax: 22_920, cash: 69_330 };
  expect(amount(result.tax.withOffer.taxableInput)).toBe(expected.withOffer);
  expect(amount(result.tax.withoutOffer.taxableInput)).toBe(expected.withoutOffer);
  expect(amount(result.tax.incrementalTax)).toBe(expected.tax);
  expect(
    result.metrics.find(({ label }) => label === "Cash after tax and personal super")?.amount,
  ).toBeCloseTo(expected.cash);
});

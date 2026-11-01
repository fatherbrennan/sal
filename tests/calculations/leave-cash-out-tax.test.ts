import { expect, it } from "bun:test";
import { leaveCashOut } from "../../src/lib/calculations/leave-cash-out.ts";
import { calculateProfileTax } from "../../src/lib/calculations/tax/profile.ts";
import type { ProfileTaxInput } from "../../src/lib/calculations/tax/types.d.ts";
import { offer, profile } from "./tax/profile-fixtures.ts";

const precision = 6;
const gross = { amount: 10_000, reason: "" };
function input(overrides: Partial<ProfileTaxInput> = {}): ProfileTaxInput {
  return {
    year: "2026-27",
    offer: offer({ assessableIncome: 130_000, assessableLabourIncome: 130_000 }),
    profile: profile({
      household: "single",
      standardDeduction: "yes",
      hospitalCover: "no",
      mlsLiableDays: "365",
    }),
    ...overrides,
  };
}

it.each([
  { year: "2025-26", cash: 100_000, net: 5700 },
  { year: "2026-27", cash: 100_000, net: 5710 },
  { year: "2025-26", cash: 130_000, net: 6325 },
  { year: "2026-27", cash: 130_000, net: 6395 },
] as const)("rebuilds annual tax across income and surcharge bands: %j", ({ year, cash, net }) => {
  const source = input({
    year,
    offer: offer({ assessableIncome: cash, assessableLabourIncome: cash }),
  });
  const result = leaveCashOut(gross, source, calculateProfileTax(source).withOffer);
  expect(result.net.amount).toBeCloseTo(net, precision);
});

it.each([
  { year: "2025-26", expected: 4625 },
  { year: "2026-27", expected: 4709.34 },
] as const)("includes the extra HELP repayment: %j", ({ year, expected }) => {
  const source = input({ year });
  source.profile = {
    ...source.profile,
    studyLoan: "yes",
    loanScheme: "help",
    loanDebt: "50000",
    helpEligible: "yes",
  };
  expect(leaveCashOut(gross, source, calculateProfileTax(source).withOffer).net.amount).toBeCloseTo(
    expected,
    precision,
  );
});

it.each([
  { year: "2025-26", cash: 101_000, expected: -1001.29 },
  { year: "2026-27", cash: 106_000, expected: -1041.29 },
] as const)("preserves negative extra cash at an MLS cliff: %j", ({ year, cash, expected }) => {
  const source = input({
    year,
    offer: offer({ assessableIncome: cash, assessableLabourIncome: cash }),
  });
  const result = leaveCashOut(
    { amount: 13, reason: "" },
    source,
    calculateProfileTax(source).withOffer,
  );
  expect(result.net.amount).toBeCloseTo(expected, precision);
});

it("rebuilds labour income and standard deductions instead of adding directly to taxable income", () => {
  const source = input({ offer: offer({ assessableIncome: 500, assessableLabourIncome: 500 }) });
  source.profile = { ...source.profile, otherIncome: "100000" };
  const result = leaveCashOut(
    { amount: 1000, reason: "" },
    source,
    calculateProfileTax(source).withOffer,
  );
  const expected = 840;
  const deduction = 1000;
  expect(result.net.amount).toBe(expected);
  expect(result.after?.standardDeduction).toMatchObject({ amount: deduction });
});

it("does not depend on a without-offer taxable-income override or mutate tax inputs", () => {
  const source = input();
  source.profile = { ...source.profile, taxableWithoutOffer: "999999" };
  const snapshot = structuredClone(source);
  const expected = 6395;
  expect(leaveCashOut(gross, source, calculateProfileTax(source).withOffer).net.amount).toBeCloseTo(
    expected,
    precision,
  );
  expect(source).toEqual(snapshot);
});

it.each(["yes", "no"])("does not reuse a non-single HELP family exemption of %s", (answer) => {
  const source = input();
  source.profile = {
    ...source.profile,
    household: "full-year-spouse",
    spouseTaxableIncome: "50000",
    spouseMlsIncome: "50000",
    levyChildren: "0",
    mlsChildren: "0",
    studyLoan: "yes",
    loanScheme: "help",
    loanDebt: "50000",
    helpEligible: "yes",
    helpFamilyOffer: answer,
  };
  const before = calculateProfileTax(source).withOffer;
  expect(before.annual.rawComponentSubtotal.status).toBe("available");
  expect(leaveCashOut(gross, source, before).net.reason).toContain("family exemption");
});

it("keeps unknown inputs, taxable overrides and unsupported tax components unavailable", () => {
  const source = input();
  const before = calculateProfileTax(source).withOffer;
  expect(leaveCashOut({ amount: null, reason: "Unknown loading" }, source, before).net.reason).toBe(
    "Unknown loading",
  );
  for (const amount of [-1, Number.NaN, Number.POSITIVE_INFINITY]) {
    expect(leaveCashOut({ amount, reason: "" }, source, before).net.amount).toBeNull();
  }
  expect(
    leaveCashOut(
      gross,
      { ...source, profile: { ...source.profile, taxableWithOffer: "130000" } },
      before,
    ).net.reason,
  ).toContain("override");
  const unsupported = input({ profile: profile({ resident: "no" }) });
  expect(
    leaveCashOut(gross, unsupported, calculateProfileTax(unsupported).withOffer).net.amount,
  ).toBeNull();
  for (const key of ["assessableIncome", "assessableLabourIncome"]) {
    expect(
      leaveCashOut(gross, { ...source, offer: { ...source.offer, [key]: null } }, before).net
        .amount,
    ).toBeNull();
  }
  expect(
    leaveCashOut(
      { amount: Number.MAX_VALUE, reason: "" },
      { ...source, offer: offer({ assessableIncome: Number.MAX_VALUE }) },
      before,
    ).net.amount,
  ).toBeNull();
});

it("preserves a newly unsupported tax endpoint rather than presenting partial tax as complete", () => {
  const source = input({
    year: "2025-26",
    offer: offer({ assessableIncome: 66_000, assessableLabourIncome: 66_000 }),
  });
  const result = leaveCashOut(
    { amount: 667, reason: "" },
    source,
    calculateProfileTax(source).withOffer,
  );
  expect(result.net.amount).toBeNull();
  expect(result.after).not.toBeNull();
});

it("recognises a resolved single HELP household in original-mode saved settings", () => {
  const source = input();
  const { household: _, ...fields } = source.profile;
  source.profile = {
    ...fields,
    studyLoan: "yes",
    loanScheme: "help",
    helpEligible: "yes",
    loanDebt: "50000",
  };
  const expected = 4709.34;
  expect(leaveCashOut(gross, source, calculateProfileTax(source).withOffer).net.amount).toBeCloseTo(
    expected,
    precision,
  );
});

it("rejects a non-finite baseline tax component instead of emitting an infinite cash amount", () => {
  const source = input();
  const before = calculateProfileTax(source).withOffer;
  before.annual.rawComponentSubtotal = {
    status: "available",
    amount: Number.NEGATIVE_INFINITY,
    basis: "raw annual component",
    sources: [],
  };
  expect(leaveCashOut(gross, source, before).net.amount).toBeNull();
});

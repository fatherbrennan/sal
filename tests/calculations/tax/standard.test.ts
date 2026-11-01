import { expect, it } from "bun:test";
import { calculateProfileTax } from "../../../src/lib/calculations/tax/profile.ts";
import {
  standardEstimateNotes,
  standardOfferDefaults,
  standardOfferFields,
  standardProfileDefaults,
  standardProfileFields,
} from "../../../src/lib/calculations/tax/standard.ts";
import type { Fields } from "../../../src/lib/data/model.d.ts";
import { amount } from "./fixtures.ts";
import { offer } from "./profile-fixtures.ts";

const employee = { employment: "full-time" };
const standardEmployee = { ...employee, estimateMode: "standard" };

it.each([{}, { estimateMode: "" }, { estimateMode: "detailed" }])(
  "preserves legacy fields without activating standard conventions",
  (mode) => {
    const fields = { sacrifice: "", adult: "no", otherIncome: "0", ...mode };
    expect(standardOfferFields(fields, "2026-27", false)).toEqual(fields);
    expect(standardProfileFields(fields, employee)).toEqual(fields);
  },
);

it("keeps every saved blank, No and override instead of replacing it with a convention", () => {
  const original = {
    ...standardEmployee,
    tfnProvided: "no",
    ordinaryPayroll: "",
    noPaygAdjustments: "no",
    regularPay: "no",
    superEligible: "no",
    ordinaryFund: "",
    evenSuper: "",
    sacrifice: "1000",
    periodSacrifice: "3",
    reportableSuperOffer: "50",
    reportableSuperSameYear: "no",
  };
  const before = { ...original };
  expect(standardOfferFields(original, "2025-26", false)).toMatchObject(original);
  expect(original).toEqual(before);
  const profile = {
    estimateMode: "standard",
    resident: "no",
    adult: "",
    assessmentComplete: "no",
    medicare: "exempt",
    ordinaryMls: "",
    helpEligible: "no",
    standardDeduction: "no",
    otherIncome: "0",
    otherLabourIncome: "",
    deductions: "0",
    otherSpecifiedDeductions: "5",
    workDeductions: "0",
    specifiedWorkDeductions: "",
    hospitalCover: "yes",
    mlsLiableDays: "50",
  };
  expect(standardProfileFields(profile, employee)).toMatchObject(profile);
});

it("adds only the selected employee-model conventions and leaves personal choices unanswered", () => {
  const result = standardOfferFields(standardEmployee, "2026-27", false);
  expect(result).toMatchObject({
    tfnProvided: "yes",
    ordinaryPayroll: "yes",
    noPaygAdjustments: "yes",
    regularPay: "yes",
    superEligible: "yes",
    ordinaryFund: "yes",
    reportableSuperSameYear: "yes",
  });
  expect(result).not.toHaveProperty("threshold");
  expect(result).not.toHaveProperty("sacrifice");
  expect(result).not.toHaveProperty("periodSacrifice");
  expect(result).not.toHaveProperty("periodPersonalSuper");
  expect(result).not.toHaveProperty("evenSuper");
  const profile = standardProfileFields({ estimateMode: "standard" }, employee);
  expect(profile).toMatchObject({ resident: "yes", adult: "yes", standardDeduction: "yes" });
  for (const key of [
    "household",
    "hospitalCover",
    "studyLoan",
    "loanDebt",
    "otherIncome",
    "levyChildren",
  ]) {
    expect(profile[key]).toBeUndefined();
  }
  expect(standardEstimateNotes.join(" ")).toContain(
    "not verified personal, employer or fund facts",
  );
});

it.each([
  { payFrequency: "weekly", expected: "19.23" },
  { payFrequency: "fortnightly", expected: "38.46" },
  { payFrequency: "monthly", expected: "83.33" },
  { payFrequency: "quarterly", expected: "250" },
])(
  "allocates entered sacrifice only as a representative $payFrequency estimate",
  ({ payFrequency, expected }) => {
    const fields = { ...standardEmployee, sacrifice: "1000", personalSuper: "500", payFrequency };
    const result = standardOfferFields(fields, "2026-27", false);
    expect(result).toHaveProperty("periodSacrifice", expected);
    expect(result).toHaveProperty("reportableSuperOffer", "1000");
    expect(result).not.toHaveProperty("periodPersonalSuper");
    expect(fields).not.toHaveProperty("reportableSuperOffer");
    expect(standardOfferFields({ ...fields, sacrifice: "0" }, "2026-27", false)).toMatchObject({
      periodSacrifice: "0",
      reportableSuperOffer: "0",
    });
  },
);

it.each(["", "bad", "-1", "0.001", "1000000001"])(
  "does not derive sacrifice outputs from invalid or missing annual input: %s",
  (sacrifice) => {
    const result = standardOfferFields(
      { ...standardEmployee, sacrifice, payFrequency: "weekly" },
      "2026-27",
      false,
    );
    expect(result).not.toHaveProperty("periodSacrifice");
    expect(result).not.toHaveProperty("reportableSuperOffer");
  },
);

it.each([
  { payFrequency: "" },
  { payFrequency: "daily" },
  { regularPay: "no" },
  { regularPay: "" },
] satisfies Fields[])(
  "does not manufacture equal-period sacrifice when its premise is missing",
  (extra) => {
    const result = standardOfferFields(
      { ...standardEmployee, sacrifice: "1000", payFrequency: "weekly", ...extra },
      "2026-27",
      false,
    );
    expect(result).not.toHaveProperty("periodSacrifice");
    expect(result).toHaveProperty("reportableSuperOffer", "1000");
  },
);

it("respects a different or unknown reporting year without blocking independent payroll allocation", () => {
  for (const reportableSuperSameYear of ["no", ""]) {
    const result = standardOfferFields(
      {
        ...standardEmployee,
        sacrifice: "1000",
        payFrequency: "fortnightly",
        reportableSuperSameYear,
      },
      "2026-27",
      false,
    );
    expect(result).not.toHaveProperty("reportableSuperOffer");
    expect(result).toHaveProperty("periodSacrifice", "38.46");
  }
});

it("allocates only a regular no-bonus 2025 base evenly across quarters", () => {
  expect(standardOfferFields(standardEmployee, "2025-26", false)).toHaveProperty(
    "evenSuper",
    "yes",
  );
  expect(standardOfferFields(standardEmployee, "2025-26", true)).not.toHaveProperty("evenSuper");
  expect(
    standardOfferFields({ ...standardEmployee, regularPay: "no" }, "2025-26", false),
  ).not.toHaveProperty("evenSuper");
});

it.each([{}, { employment: "sole-trader" }, { employment: "unrecognised" }])(
  "does not assign employee conventions or deductions to an unknown or contractor arrangement",
  (arrangement) => {
    const result = standardOfferFields(
      { estimateMode: "standard", sacrifice: "1000", ...arrangement },
      "2025-26",
      false,
    );
    expect(result).not.toHaveProperty("ordinaryPayroll");
    expect(result).not.toHaveProperty("superEligible");
    expect(result).not.toHaveProperty("reportableSuperOffer");
    expect(standardProfileFields({ estimateMode: "standard" }, arrangement)).not.toHaveProperty(
      "standardDeduction",
    );
  },
);

it("derives zero subsets only while their explicit parent total is zero", () => {
  const profile = {
    estimateMode: "standard",
    otherIncome: "0.00",
    deductions: "0",
    workDeductions: "0",
  };
  expect(standardProfileFields(profile, employee)).toMatchObject({
    otherLabourIncome: "0",
    otherSpecifiedDeductions: "0",
    specifiedWorkDeductions: "0",
  });
  expect(standardProfileFields({ ...profile, otherIncome: "100" }, employee)).not.toHaveProperty(
    "otherLabourIncome",
  );
  expect(standardProfileFields({ ...profile, deductions: "" }, employee)).not.toHaveProperty(
    "otherSpecifiedDeductions",
  );
  expect(
    standardOfferFields({ estimateMode: "standard", businessDeductions: "0" }, "2026-27", false),
  ).toHaveProperty("specifiedDeductions", "0");
});

it("derives only structural household facts and full-cover zero days", () => {
  const single = standardProfileFields(
    { estimateMode: "standard", household: "single", hospitalCover: "yes" },
    employee,
  );
  expect(single).toMatchObject({
    single: "yes",
    levyChildren: "0",
    mlsChildren: "0",
    helpFamilyOffer: "no",
    helpFamilyBase: "no",
    mlsLiableDays: "0",
  });
  for (const household of ["full-year-spouse", "single-with-dependants", "other"]) {
    const result = standardProfileFields(
      { estimateMode: "standard", household, hospitalCover: "no" },
      employee,
    );
    expect(result).toHaveProperty("single", "no");
    expect(result).not.toHaveProperty("mlsLiableDays");
    expect(result).not.toHaveProperty("helpFamilyOffer");
    expect(result).not.toHaveProperty("levyChildren");
  }
});

it("returns independent optional-zero constructor defaults without inventing personal status", () => {
  const first = standardOfferDefaults();
  expect(first).toMatchObject({
    sacrifice: "0",
    personalSuper: "0",
    periodPersonalSuper: "0",
    periodOtherDeductions: "0",
    reportableBenefitsOffer: "0",
  });
  Object.assign(first, { sacrifice: "1000" });
  expect(standardOfferDefaults()).toHaveProperty("sacrifice", "0");
  const profile = standardProfileDefaults();
  expect(profile).toMatchObject({
    otherIncome: "0",
    deductions: "0",
    workDeductions: "0",
    reportableSuper: "0",
    reportableBenefits: "0",
  });
  expect(profile).not.toHaveProperty("otherLabourIncome");
  expect(profile).not.toHaveProperty("studyLoan");
});

it("applies the statutory employee deduction in both scenarios without treating the estimate as final assessment", () => {
  const fields = standardProfileFields(
    { ...standardProfileDefaults(), household: "single", hospitalCover: "yes", studyLoan: "no" },
    employee,
  );
  const result = calculateProfileTax({ year: "2026-27", profile: fields, offer: offer() });
  const expected = { deduction: 1000, taxable: 99_000, subtotal: 22_200 };
  expect(amount(result.withOffer.standardDeduction)).toBe(expected.deduction);
  expect(amount(result.withoutOffer.standardDeduction)).toBe(0);
  expect(amount(result.withOffer.taxableInput)).toBe(expected.taxable);
  expect(amount(result.incrementalTax)).toBe(expected.subtotal);
  expect(result.withOffer.annual.finalAssessment.status).toBe("unavailable");
});

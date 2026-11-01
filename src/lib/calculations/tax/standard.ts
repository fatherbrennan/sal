import type { Fields } from "../../data/model.d.ts";
import { inputAmount } from "./common.ts";
import { payrollPeriodConversions } from "./payroll.ts";
import { numeric } from "./profile-inputs.ts";
import type { TaxYear } from "./types.d.ts";

const standardEstimateNotes = [
  "Standard scenario conventions apply only where no saved value exists. They are modelling choices, not verified personal, employer or fund facts.",
  "Tax uses ordinary full-year resident adult treatment, with no special assessment adjustments. Household, hospital cover, loan and payer threshold choices remain explicit.",
  "Employee base pay is modelled as ordinary super-eligible pay, evenly allocated for representative payroll using TFN-provided scales without special adjustments. Bonuses are separate; annual deposit counts are not predicted.",
  "Salary sacrifice is modelled as valid and reportable in the selected income year. Its representative-period estimate is rounded to cents; personal contributions are not automatically payroll deductions.",
  "Net super uses the ordinary 15% contribution-tax model only, excluding excess contributions, Division 293, LISTO, co-contributions, special funds, releases, fees, insurance and investment returns. It is not a verified net account value.",
];
const employeeKinds = [
  "full-time",
  "part-time",
  "casual",
  "fixed-term",
  "apprentice",
  "labour-hire",
  "other-employee",
];

function employee(fields: Fields): boolean {
  const { employment = "" } = fields;
  return employeeKinds.includes(employment);
}

function fillMissing(fields: Fields, defaults: Fields): Fields {
  return { ...defaults, ...fields };
}

function zeroSubset(fields: Fields, parent: string, subset: string): void {
  if (!Object.hasOwn(fields, subset) && numeric(fields, parent) === 0) {
    fields[subset] = "0";
  }
}

function sacrificeEstimates(fields: Fields): void {
  const checked = inputAmount(numeric(fields, "sacrifice"), "Annual salary sacrifice", false);
  if (checked.status === "unavailable") {
    return;
  }
  const { payFrequency, regularPay, reportableSuperSameYear } = fields;
  if (!Object.hasOwn(fields, "reportableSuperOffer") && reportableSuperSameYear === "yes") {
    Object.assign(fields, { reportableSuperOffer: String(checked.amount) });
  }
  if (
    !Object.hasOwn(fields, "periodSacrifice") &&
    regularPay === "yes" &&
    (payFrequency === "weekly" ||
      payFrequency === "fortnightly" ||
      payFrequency === "monthly" ||
      payFrequency === "quarterly")
  ) {
    const centsPerDollar = 100;
    Object.assign(fields, {
      periodSacrifice: String(
        Math.round((checked.amount * centsPerDollar) / payrollPeriodConversions[payFrequency]) /
          centsPerDollar,
      ),
    });
  }
}

function standardOfferFields(fields: Fields, year: TaxYear, hasEarnings: boolean): Fields {
  const { estimateMode } = fields;
  if (estimateMode !== "standard") {
    return fields;
  }
  let result = fillMissing(fields, { ordinaryFund: "yes" });
  if (employee(fields)) {
    result = fillMissing(result, {
      tfnProvided: "yes",
      ordinaryPayroll: "yes",
      noPaygAdjustments: "yes",
      regularPay: "yes",
      superEligible: "yes",
      reportableSuperSameYear: "yes",
    });
    const { regularPay } = result;
    if (year === "2025-26" && !hasEarnings && regularPay === "yes") {
      result = fillMissing(result, { evenSuper: "yes" });
    }
    sacrificeEstimates(result);
  }
  zeroSubset(result, "businessDeductions", "specifiedDeductions");
  return result;
}

function householdEstimates(fields: Fields): Fields {
  const { household } = fields;
  if (household === "single") {
    return fillMissing(fields, {
      single: "yes",
      levyChildren: "0",
      mlsChildren: "0",
      helpFamilyOffer: "no",
      helpFamilyBase: "no",
    });
  }
  if (
    household === "full-year-spouse" ||
    household === "single-with-dependants" ||
    household === "other"
  ) {
    return fillMissing(fields, { single: "no" });
  }
  return fields;
}

function standardProfileFields(fields: Fields, offerFields: Fields): Fields {
  const { estimateMode } = fields;
  if (estimateMode !== "standard") {
    return fields;
  }
  let result = householdEstimates(
    fillMissing(fields, {
      resident: "yes",
      adult: "yes",
      assessmentComplete: "yes",
      medicare: "ordinary",
      ordinaryMls: "yes",
      helpEligible: "yes",
    }),
  );
  const { resident, hospitalCover } = result;
  if (resident === "yes" && employee(offerFields)) {
    result = fillMissing(result, { standardDeduction: "yes" });
  }
  if (hospitalCover === "yes") {
    result = fillMissing(result, { mlsLiableDays: "0" });
  }
  zeroSubset(result, "otherIncome", "otherLabourIncome");
  zeroSubset(result, "deductions", "otherSpecifiedDeductions");
  zeroSubset(result, "workDeductions", "specifiedWorkDeductions");
  return result;
}

function standardOfferDefaults(): Fields {
  return {
    estimateMode: "standard",
    sacrifice: "0",
    personalSuper: "0",
    periodPersonalSuper: "0",
    periodOtherDeductions: "0",
    reportableBenefitsOffer: "0",
    businessCosts: "0",
    businessDeductions: "0",
    contractorSuper: "0",
    contractorPersonalSuper: "0",
  };
}

function standardProfileDefaults(): Fields {
  return {
    estimateMode: "standard",
    otherIncome: "0",
    deductions: "0",
    workDeductions: "0",
    reportableBenefits: "0",
    reportableSuper: "0",
    investmentLoss: "0",
    foreignIncome: "0",
  };
}

export {
  standardEstimateNotes,
  standardOfferDefaults,
  standardOfferFields,
  standardProfileDefaults,
  standardProfileFields,
};

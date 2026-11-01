import type { Fields, SalRecord } from "../../src/lib/data/model.d.ts";
import { newRecord } from "../../src/lib/data/schema.ts";

const now = "2026-10-23T00:00:00.000Z";
const profile: Fields = {
  resident: "yes",
  adult: "yes",
  otherIncome: "0",
  otherLabourIncome: "0",
  deductions: "0",
  otherSpecifiedDeductions: "0",
  workDeductions: "0",
  specifiedWorkDeductions: "0",
  standardDeduction: "no",
  medicare: "ordinary",
  hospitalCover: "yes",
  single: "yes",
  assessmentComplete: "yes",
  ordinaryMls: "yes",
  reportableBenefits: "0",
  reportableSuper: "0",
  investmentLoss: "0",
  foreignIncome: "0",
  studyLoan: "no",
};
function offer(fields: Fields = {}): SalRecord {
  const result = newRecord("offer", "offer-a", now);
  result.fields = {
    estimateMode: "standard",
    unit: "annual",
    weeks: "52",
    payFrequency: "fortnightly",
    superRate: "12",
    superLimit: "statutory",
    cycleDays: "7",
    tripBasis: "return",
    costMethod: "entered",
    businessCosts: "0",
    businessDeductions: "0",
    contractorSuper: "0",
    contractorPersonalSuper: "0",
    employment: "full-time",
    amount: "112000",
    inclusion: "includes",
    weeklyHours: "40",
    superEligible: "yes",
    evenSuper: "yes",
    sacrifice: "0",
    personalSuper: "0",
    ordinaryFund: "yes",
    rosterAnchor: "2026-07-01",
    calendarComplete: "yes",
    rosterComplete: "yes",
    holidaysWorked: "no",
    reportableBenefitsOffer: "0",
    reportableSuperOffer: "0",
    regularPay: "yes",
    periodSacrifice: "0",
    periodPersonalSuper: "0",
    periodOtherDeductions: "0",
    ordinaryPayroll: "yes",
    tfnProvided: "yes",
    threshold: "yes",
    noPaygAdjustments: "yes",
    distance: "40",
    minutes: "60",
    energy: "fuel",
    maintenance: "0",
    tripCharges: "0",
    ...fields,
  };
  return result;
}
function bonus(fields: Fields = {}) {
  return {
    id: "bonus",
    fields: {
      amount: "11200",
      inclusion: "includes",
      eligible: "yes",
      included: "no",
      certainty: "guaranteed",
      recurrence: "recurring",
      taxClass: "ordinary",
      ...fields,
    },
  };
}

export { bonus, offer, profile };

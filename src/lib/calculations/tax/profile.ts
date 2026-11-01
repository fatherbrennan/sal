import { calculateAnnualTax } from "../tax.ts";
import { annual, unavailable } from "./common.ts";
import { calculateStandardDeduction } from "./deduction.ts";
import { helpInput, medicareInput, mlsInput } from "./profile-family.ts";
import {
  answer,
  availableNumber,
  bothAnswers,
  establishedIncome,
  numeric,
  sumInputs,
} from "./profile-inputs.ts";
import type {
  AnnualTaxResult,
  OfferTaxAmounts,
  PaygInput,
  ProfilePaygInput,
  ProfileScenario,
  ProfileTaxInput,
  ProfileTaxResult,
  TaxAmount,
} from "./types.d.ts";

const absentOffer: OfferTaxAmounts = {
  assessableIncome: 0,
  deductions: 0,
  assessableLabourIncome: 0,
  specifiedWorkDeductions: 0,
  reportableSuper: 0,
  reportableBenefits: 0,
};

function taxableIncome(income: TaxAmount, deductions: TaxAmount, standard: TaxAmount): TaxAmount {
  if (income.status === "unavailable") {
    return income;
  }
  if (deductions.status === "unavailable") {
    return deductions;
  }
  if (standard.status === "unavailable") {
    return standard;
  }
  return annual(Math.max(0, income.amount - deductions.amount - standard.amount), ["T02"]);
}

function constructionResult(result: AnnualTaxResult, input: TaxAmount): AnnualTaxResult {
  if (input.status === "available") {
    return result;
  }
  return {
    ...result,
    basicIncomeTax: input,
    lito: input,
    incomeTaxAfterLito: input,
    medicare: input,
    mls: input,
    rawComponentSubtotal: input,
  };
}

function profileScenario(input: ProfileTaxInput, overrideKey: string): ProfileScenario {
  const { profile } = input;
  const { standardDeduction, derivedTaxableIncome } = scenarioIncome(input);
  let taxableInput = establishedIncome(profile, overrideKey, derivedTaxableIncome);
  if (input.excludesEarnings === true && numeric(profile, overrideKey) !== null) {
    taxableInput = unavailable(
      "missing-input",
      "Base-only taxable income cannot reuse the saved full-offer taxable-income override after earnings are removed.",
      [],
    );
  }
  let familyKey = "helpFamilyOffer";
  if (overrideKey === "taxableWithoutOffer") {
    familyKey = "helpFamilyBase";
  }
  const annualInput = annualProfileInput(input, taxableInput, familyKey);
  let approximation: string | null = null;
  if (numeric(profile, overrideKey) === null) {
    approximation =
      "sal estimate: derived taxable income is normalized to the nearest cent, then rounded down to whole dollars. This is not verified ATO final-assessment precision.";
  }
  return {
    input: annualInput,
    annual: constructionResult(calculateAnnualTax(annualInput), taxableInput),
    standardDeduction,
    derivedTaxableIncome,
    taxableInput,
    approximation,
  };
}

function subsetAmount(subset: TaxAmount, total: TaxAmount, name: string): TaxAmount {
  if (
    subset.status === "available" &&
    total.status === "available" &&
    subset.amount > total.amount
  ) {
    return unavailable("invalid-input", `${name} cannot exceed its inclusive total.`, ["T02"]);
  }
  return subset;
}

function scenarioIncome(input: ProfileTaxInput): {
  standardDeduction: TaxAmount;
  derivedTaxableIncome: TaxAmount;
} {
  const { profile, offer, year } = input;
  const income = sumInputs(
    [numeric(profile, "otherIncome"), offer.assessableIncome],
    "Assessable income",
  );
  const deductions = sumInputs(
    [numeric(profile, "deductions"), offer.deductions],
    "Established deductions",
  );
  const labour = subsetAmount(
    sumInputs(
      [numeric(profile, "otherLabourIncome"), offer.assessableLabourIncome],
      "Assessable labour income",
    ),
    income,
    "Assessable labour income",
  );
  const specified = subsetAmount(
    sumInputs(
      [numeric(profile, "otherSpecifiedDeductions"), offer.specifiedWorkDeductions],
      "Specified work deductions",
    ),
    deductions,
    "Specified work deductions",
  );
  let standardDeduction = calculateStandardDeduction({
    year,
    eligible: answer(profile, "standardDeduction"),
    assessableLabourIncome: availableNumber(labour),
    specifiedDeductions: availableNumber(specified),
  });
  if (year === "2026-27" && answer(profile, "standardDeduction") === true) {
    if (labour.status === "unavailable") {
      standardDeduction = labour;
    } else if (specified.status === "unavailable") {
      standardDeduction = specified;
    }
  }
  const derivedTaxableIncome = taxableIncome(income, deductions, standardDeduction);
  return { standardDeduction, derivedTaxableIncome };
}

function annualProfileInput(
  input: ProfileTaxInput,
  taxableInput: TaxAmount,
  familyKey: string,
): ProfileScenario["input"] {
  const { profile, offer, year } = input;
  const fringe = sumInputs(
    [numeric(profile, "reportableBenefits"), offer.reportableBenefits],
    "Reportable benefits",
  );
  const superAmount = sumInputs(
    [numeric(profile, "reportableSuper"), offer.reportableSuper],
    "Reportable super",
  );
  const repayment = sumInputs(
    [
      availableNumber(taxableInput),
      availableNumber(fringe),
      availableNumber(superAmount),
      numeric(profile, "investmentLoss"),
      numeric(profile, "foreignIncome"),
    ],
    "HELP repayment-income components",
  );
  return {
    year,
    taxableIncome: availableNumber(taxableInput),
    ordinaryResidentAdult: bothAnswers(answer(profile, "resident"), answer(profile, "adult")),
    otherAssessmentItemsAbsent: answer(profile, "assessmentComplete"),
    medicare: medicareInput(profile),
    mls: mlsInput(profile, fringe, superAmount),
    help: helpInput(profile, repayment, familyKey, input.excludesEarnings === true),
  };
}

function incremental(withOffer: TaxAmount, withoutOffer: TaxAmount): TaxAmount {
  if (withOffer.status === "unavailable") {
    return withOffer;
  }
  if (withoutOffer.status === "unavailable") {
    return withoutOffer;
  }
  return annual(withOffer.amount - withoutOffer.amount, [
    ...withOffer.sources,
    ...withoutOffer.sources,
  ]);
}

function calculateProfileTax(input: ProfileTaxInput): ProfileTaxResult {
  const withOffer = profileScenario(input, "taxableWithOffer");
  const withoutOffer = profileScenario(
    { ...input, offer: absentOffer, excludesEarnings: false },
    "taxableWithoutOffer",
  );
  return {
    withOffer,
    withoutOffer,
    incrementalTax: incremental(
      withOffer.annual.rawComponentSubtotal,
      withoutOffer.annual.rawComponentSubtotal,
    ),
  };
}

function buildPaygInput({
  profile,
  payer,
  rulePeriod,
  period,
  earnings,
}: ProfilePaygInput): PaygInput {
  return {
    rulePeriod,
    period,
    earnings,
    ordinaryEmployee: bothAnswers(answer(profile, "resident"), answer(payer, "ordinaryPayroll")),
    tfnProvided: answer(payer, "tfnProvided"),
    thresholdClaimed: answer(payer, "threshold"),
    studyLoanDeclared: answer(profile, "studyLoan"),
    noAdjustments: answer(payer, "noPaygAdjustments"),
  };
}

export { buildPaygInput, calculateProfileTax };

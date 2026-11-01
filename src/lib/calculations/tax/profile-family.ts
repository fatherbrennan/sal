import { answer, availableNumber, numeric } from "./profile-inputs.ts";
import type { HelpInput, MedicareInput, MlsInput, TaxAmount, TaxFields } from "./types.d.ts";

function household(fields: TaxFields): MlsInput["household"] {
  const { household: selected } = fields;
  if (
    selected === "single" ||
    selected === "single-with-dependants" ||
    selected === "full-year-spouse"
  ) {
    return selected;
  }
  if (selected === "") {
    return null;
  }
  if (selected !== undefined) {
    return "unsupported";
  }
  if (answer(fields, "single") === true) {
    return "single";
  }
  if (answer(fields, "single") === false) {
    return "unsupported";
  }
  return null;
}

function levyFamily(fields: TaxFields): MedicareInput["family"] {
  const selected = household(fields);
  if (selected === "single") {
    return "single-no-family-reduction";
  }
  if (selected === "full-year-spouse" || selected === null) {
    return selected;
  }
  if (selected === "single-with-dependants") {
    const relief = answer(fields, "levyFamilyRelief");
    if (relief === null) {
      return null;
    }
    if (!relief) {
      return "single-no-family-reduction";
    }
  }
  return "unsupported";
}

function medicareInput(fields: TaxFields): MedicareInput {
  const { medicare } = fields;
  let ordinaryLevyEligible: boolean | null = null;
  if (medicare === "ordinary") {
    ordinaryLevyEligible = true;
  } else if (medicare === "exempt" || medicare === "other") {
    ordinaryLevyEligible = false;
  }
  return {
    ordinaryLevyEligible,
    family: levyFamily(fields),
    spouseTaxableIncome: numeric(fields, "spouseTaxableIncome"),
    establishedQualifyingChildren: numeric(fields, "levyChildren"),
  };
}

function mlsInput(
  fields: TaxFields,
  reportableBenefits: TaxAmount,
  reportableSuper: TaxAmount,
): MlsInput {
  let liableDays = numeric(fields, "mlsLiableDays");
  if (answer(fields, "hospitalCover") === true) {
    liableDays = 0;
  }
  return {
    ordinarySurchargeEligible: answer(fields, "ordinaryMls"),
    household: household(fields),
    reportableFringeBenefits: availableNumber(reportableBenefits),
    reportableSuper: availableNumber(reportableSuper),
    netInvestmentLoss: numeric(fields, "investmentLoss"),
    spouseSurchargeIncome: numeric(fields, "spouseMlsIncome"),
    establishedQualifyingChildren: numeric(fields, "mlsChildren"),
    liableDays,
  };
}

function helpInput(
  fields: TaxFields,
  repaymentIncome: TaxAmount,
  familyKey: string,
  excludesEarnings = false,
): HelpInput | null {
  const { loanScheme } = fields;
  const hasLoan = answer(fields, "studyLoan");
  if (hasLoan === null) {
    return null;
  }
  if (!hasLoan) {
    return { scheme: "none" };
  }
  if (loanScheme === "other-or-multiple") {
    return { scheme: "other-or-multiple" };
  }
  if (loanScheme !== "help") {
    return null;
  }
  let familyException = answer(fields, familyKey);
  if (household(fields) === "single") {
    familyException = false;
  } else if (excludesEarnings) {
    familyException = null;
  }
  return {
    scheme: "help",
    repaymentIncome: availableNumber(repaymentIncome),
    establishedRepayableDebt: numeric(fields, "loanDebt"),
    section8FamilyExemption: familyException,
    ordinaryLiabilityEligible: answer(fields, "helpEligible"),
  };
}

export { helpInput, medicareInput, mlsInput };

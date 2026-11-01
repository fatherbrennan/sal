type TaxYear = "2025-26" | "2026-27";
type PayPeriod = "weekly" | "fortnightly" | "monthly" | "quarterly";
type PaygRulePeriod = "2025-july" | "2025-september" | "2026-july";
type TaxUnavailableCode =
  | "missing-input"
  | "invalid-input"
  | "unsupported-regime"
  | "unverified-rule";

type TaxAmount =
  | {
      status: "available";
      amount: number;
      basis:
        | "raw annual component"
        | "representative withholding"
        | "representative payroll estimate"
        | "representative payroll hourly estimate";
      sources: readonly string[];
    }
  | {
      status: "unavailable";
      code: TaxUnavailableCode;
      reason: string;
      sources: readonly string[];
    };

interface MedicareInput {
  ordinaryLevyEligible: boolean | null;
  family: "single-no-family-reduction" | "full-year-spouse" | "unsupported" | null;
  spouseTaxableIncome: number | null;
  establishedQualifyingChildren: number | null;
}

interface MlsInput {
  ordinarySurchargeEligible: boolean | null;
  household: "single" | "single-with-dependants" | "full-year-spouse" | "unsupported" | null;
  reportableFringeBenefits: number | null;
  reportableSuper: number | null;
  netInvestmentLoss: number | null;
  spouseSurchargeIncome: number | null;
  establishedQualifyingChildren: number | null;
  liableDays: number | null;
}

type HelpInput =
  | { scheme: "none" }
  | { scheme: "other-or-multiple" }
  | {
      scheme: "help";
      repaymentIncome: number | null;
      establishedRepayableDebt: number | null;
      section8FamilyExemption: boolean | null;
      ordinaryLiabilityEligible: boolean | null;
    };

interface AnnualTaxInput {
  year: TaxYear;
  taxableIncome: number | null;
  ordinaryResidentAdult: boolean | null;
  otherAssessmentItemsAbsent: boolean | null;
  medicare: MedicareInput | null;
  mls: MlsInput | null;
  help: HelpInput | null;
}

interface AnnualTaxResult {
  basicIncomeTax: TaxAmount;
  lito: TaxAmount;
  incomeTaxAfterLito: TaxAmount;
  medicare: TaxAmount;
  mls: TaxAmount;
  help: TaxAmount;
  rawComponentSubtotal: TaxAmount;
  finalAssessment: TaxAmount;
  ruleVersion: string;
}

interface StandardDeductionInput {
  year: TaxYear;
  eligible: boolean | null;
  assessableLabourIncome: number | null;
  specifiedDeductions: number | null;
}

interface PaygInput {
  rulePeriod: PaygRulePeriod;
  period: PayPeriod;
  earnings: number | null;
  ordinaryEmployee: boolean | null;
  tfnProvided: boolean | null;
  thresholdClaimed: boolean | null;
  studyLoanDeclared: boolean | null;
  noAdjustments: boolean | null;
}

interface PaygResult {
  ordinary: TaxAmount;
  combined: TaxAmount;
  loanIncrement: TaxAmount;
  method: "published combined coefficient formula";
  ruleVersion: string;
}

type TaxFields = Readonly<Record<string, string | undefined>>;

interface OfferTaxAmounts {
  assessableIncome: number | null;
  deductions: number | null;
  assessableLabourIncome: number | null;
  specifiedWorkDeductions: number | null;
  reportableSuper: number | null;
  reportableBenefits: number | null;
}

interface ProfileTaxInput {
  year: TaxYear;
  profile: TaxFields;
  offer: OfferTaxAmounts;
  excludesEarnings?: boolean;
}

interface ProfileScenario {
  input: AnnualTaxInput;
  annual: AnnualTaxResult;
  standardDeduction: TaxAmount;
  derivedTaxableIncome: TaxAmount;
  taxableInput: TaxAmount;
  approximation: string | null;
}

interface ProfilePaygInput {
  profile: TaxFields;
  payer: TaxFields;
  rulePeriod: PaygRulePeriod;
  period: PayPeriod;
  earnings: number | null;
}

interface ProfileTaxResult {
  withOffer: ProfileScenario;
  withoutOffer: ProfileScenario;
  incrementalTax: TaxAmount;
}

export type {
  AnnualTaxInput,
  AnnualTaxResult,
  HelpInput,
  MedicareInput,
  MlsInput,
  OfferTaxAmounts,
  PaygInput,
  PaygResult,
  PaygRulePeriod,
  PayPeriod,
  ProfilePaygInput,
  ProfileScenario,
  ProfileTaxInput,
  ProfileTaxResult,
  StandardDeductionInput,
  TaxAmount,
  TaxFields,
  TaxUnavailableCode,
  TaxYear,
};

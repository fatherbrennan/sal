import type {
  AnnualTaxInput,
  MedicareInput,
  MlsInput,
  PaygInput,
  TaxAmount,
} from "../../../src/lib/calculations/tax/types.d.ts";

const checkedDecimalPlaces = 8;

function medicare(overrides: Partial<MedicareInput> = {}): MedicareInput {
  return {
    ordinaryLevyEligible: true,
    family: "single-no-family-reduction",
    spouseTaxableIncome: null,
    establishedQualifyingChildren: null,
    ...overrides,
  };
}

function mls(overrides: Partial<MlsInput> = {}): MlsInput {
  return {
    ordinarySurchargeEligible: true,
    household: "single",
    reportableFringeBenefits: 0,
    reportableSuper: 0,
    netInvestmentLoss: 0,
    spouseSurchargeIncome: null,
    establishedQualifyingChildren: null,
    liableDays: 365,
    ...overrides,
  };
}

function annualInput(overrides: Partial<AnnualTaxInput> = {}): AnnualTaxInput {
  return {
    year: "2025-26",
    taxableIncome: 100_000,
    ordinaryResidentAdult: true,
    otherAssessmentItemsAbsent: true,
    medicare: medicare(),
    mls: mls(),
    help: { scheme: "none" },
    ...overrides,
  };
}

function paygInput(overrides: Partial<PaygInput> = {}): PaygInput {
  return {
    rulePeriod: "2026-july",
    period: "weekly",
    earnings: 1000,
    ordinaryEmployee: true,
    tfnProvided: true,
    thresholdClaimed: true,
    studyLoanDeclared: false,
    noAdjustments: true,
    ...overrides,
  };
}

function amount(result: TaxAmount): number {
  if (result.status === "unavailable") {
    throw new Error(`Expected an available amount: ${result.code}: ${result.reason}`);
  }
  return result.amount;
}

export { amount, annualInput, checkedDecimalPlaces, medicare, mls, paygInput };

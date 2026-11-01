import { scenarioReportableSuper } from "../calculations/base-pay.ts";
import type { ComparisonResult } from "../calculations/comparison.ts";
import { value } from "../calculations/inputs.ts";
import type { ProfileScenario, TaxAmount } from "../calculations/tax/types.d.ts";
import { numeric } from "../data/numeric.ts";
import { type Equation, type EquationSection, type EquationValue, explanation } from "./model.ts";
import { paySections } from "./pay-sections.ts";
import {
  annualNames,
  basicFor,
  componentKeys,
  helpFor,
  incomeFor,
  litoFor,
  medicareFor,
  mlsFor,
  primaryFormula,
} from "./tax-context.ts";
import { annualOrigins, assessmentRules, attributionRules, taxUnits } from "./tax-rules.ts";

function taxValue(amount: TaxAmount): number | null {
  if (amount.status === "available") {
    return amount.amount;
  }
  return null;
}

function taxNotes(amount: TaxAmount): string[] {
  const sources = `Rule sources: ${amount.sources.join(", ") || "sal calculation convention"}.`;
  if (amount.status === "unavailable") {
    return [`Unavailable (${amount.code}): ${amount.reason}`, sources];
  }
  return [`Basis: ${amount.basis}. ${sources}`];
}

function scenarioAmounts(scenario: ProfileScenario): Readonly<Record<string, TaxAmount>> {
  const { ruleVersion: _, ...annual } = scenario.annual;
  return {
    ...annual,
    standardDeduction: scenario.standardDeduction,
    derivedTaxableIncome: scenario.derivedTaxableIncome,
    taxableInput: scenario.taxableInput,
  };
}

function scenarioValues(scenario: ProfileScenario): Record<string, EquationValue> {
  const { input } = scenario;
  const values: Record<string, EquationValue> = {};
  for (const [key, amount] of Object.entries(scenarioAmounts(scenario))) {
    const name = annualNames[key];
    if (name !== undefined) {
      values[name] = taxValue(amount);
    }
  }
  return {
    ...values,
    spouseTaxableIncome: input.medicare?.spouseTaxableIncome ?? null,
    levyQualifyingChildren: input.medicare?.establishedQualifyingChildren ?? null,
    reportableFringeBenefits: input.mls?.reportableFringeBenefits ?? null,
    reportableSuperContributions: input.mls?.reportableSuper ?? null,
    netInvestmentLoss: input.mls?.netInvestmentLoss ?? null,
    spouseMlsTestIncome: input.mls?.spouseSurchargeIncome ?? null,
    mlsQualifyingChildren: input.mls?.establishedQualifyingChildren ?? null,
    mlsLiableDays: input.mls?.liableDays ?? null,
  };
}

function offerValues(
  result: ComparisonResult,
  withoutOffer: boolean,
): Record<string, EquationValue> {
  const contractor = value(result.payer, "employment") === "sole-trader";
  let deductions = numeric(result.profile, "workDeductions");
  let specified = numeric(result.profile, "specifiedWorkDeductions");
  if (contractor) {
    deductions = numeric(result.payer, "businessDeductions");
    specified = numeric(result.payer, "specifiedDeductions");
  }
  const values: Record<string, EquationValue> = {
    annualCashPay:
      result.metrics.find(({ label }) => label === "Cash pay / revenue before deductions")
        ?.amount ?? null,
    annualSalarySacrifice: numeric(result.payer, "sacrifice"),
    offerDeductions: deductions,
    offerSpecifiedWorkDeductions: specified,
    offerReportableFringeBenefits: numeric(result.payer, "reportableBenefitsOffer"),
    offerReportableSuperContributions: scenarioReportableSuper(
      { ...result.offer, fields: result.payer },
      result.scenario,
    ),
  };
  if (contractor) {
    Object.assign(values, { offerAssessableLabourIncome: numeric(result.payer, "eligibleLabour") });
  }
  if (withoutOffer) {
    return Object.fromEntries(Object.keys(values).map((key) => [key, 0]));
  }
  return values;
}

function annualValues(result: ComparisonResult, scenario: ProfileScenario, withoutOffer: boolean) {
  const values: Record<string, EquationValue> = {
    ...scenarioValues(scenario),
    ...offerValues(result, withoutOffer),
    otherAssessableIncome: numeric(result.profile, "otherIncome"),
    otherDeductions: numeric(result.profile, "deductions"),
    otherAssessableLabourIncome: numeric(result.profile, "otherLabourIncome"),
    otherSpecifiedWorkDeductions: numeric(result.profile, "otherSpecifiedDeductions"),
    otherReportableFringeBenefits: numeric(result.profile, "reportableBenefits"),
    otherReportableSuperContributions: numeric(result.profile, "reportableSuper"),
    exemptForeignEmploymentIncome: numeric(result.profile, "foreignIncome"),
  };
  if (scenario.input.help?.scheme === "help") {
    Object.assign(values, {
      helpRepaymentIncome: scenario.input.help.repaymentIncome,
      helpRepayableDebt: scenario.input.help.establishedRepayableDebt,
    });
  }
  return values;
}

function methods(
  result: ComparisonResult,
  scenario: ProfileScenario,
  withoutOffer: boolean,
  additionalLeave: boolean,
) {
  const entries: readonly [string, string, string, TaxAmount][] = [
    [
      "income",
      "Taxable income and deductions",
      incomeFor(result, scenario, withoutOffer, additionalLeave),
      scenario.taxableInput,
    ],
    ["basicIncomeTax", "Income tax bands", basicFor(scenario), scenario.annual.basicIncomeTax],
    ["lito", "Low income tax offset", litoFor(scenario), scenario.annual.lito],
    ["medicare", "Medicare levy", medicareFor(scenario), scenario.annual.medicare],
    ["mls", "Medicare levy surcharge", mlsFor(scenario), scenario.annual.mls],
    ["help", "Study-loan repayment", helpFor(scenario), scenario.annual.help],
    [
      "assessment",
      "Annual component estimate",
      assessmentRules,
      scenario.annual.rawComponentSubtotal,
    ],
  ];
  return entries.map(([key, title, formula, amount]) => ({ key, title, formula, amount }));
}

function sectionsFor(
  result: ComparisonResult,
  scenario: ProfileScenario,
  withoutOffer: boolean,
  {
    keys,
    additionalLeave = false,
  }: { keys?: readonly string[] | undefined; additionalLeave?: boolean } = {},
): EquationSection[] {
  const values = annualValues(result, scenario, withoutOffer);
  if (additionalLeave) {
    Object.assign(
      values,
      Object.fromEntries([
        ["annual_leave_entitlement_gross_value", result.leave.entitlementGross.amount],
      ]),
    );
  }
  let scenarioName = "With offer";
  if (withoutOffer) {
    scenarioName = "Without offer";
  }
  const prefix = `${scenario.input.year} · ${scenarioName}`;
  return methods(result, scenario, withoutOffer, additionalLeave)
    .filter(({ key }) => keys === undefined || keys.includes(key))
    .map(({ key, title, formula, amount }) => {
      const notes = taxNotes(amount);
      if (key === "income") {
        notes.push(
          ...taxNotes(scenario.standardDeduction),
          ...taxNotes(scenario.derivedTaxableIncome),
        );
      }
      return {
        title: `${prefix} · ${title}`,
        formula,
        values: explanation(title, formula, values).values,
        origins: annualOrigins(result, withoutOffer),
        units: taxUnits,
        notes,
      };
    });
}

function annualSections(
  result: ComparisonResult,
  scenario: ProfileScenario,
  withoutOffer = false,
): EquationSection[] {
  let scope = "with_offer";
  if (withoutOffer) {
    scope = "without_offer";
  }
  const sections = sectionsFor(result, scenario, withoutOffer);
  if (!withoutOffer) {
    sections.push(...paySections(result, scenario.input.year));
  }
  return [
    {
      title: scope.replaceAll("_", " "),
      formula: "",
      scope,
      sections,
    },
  ];
}

function attributionSection(result: ComparisonResult): EquationSection {
  return {
    title: "Incremental annual component estimate",
    formula: attributionRules,
    units: taxUnits,
    references: Object.fromEntries(
      ["with_offer", "without_offer"].map((scope) => [
        `annual_component_subtotal_${scope}`,
        { scope, name: "annual_component_subtotal" },
      ]),
    ),
    values: Object.fromEntries([
      ["offer_attributed_annual_tax_estimate", taxValue(result.tax.incrementalTax)],
    ]),
    sections: [
      ...annualSections(result, result.tax.withOffer),
      ...annualSections(result, result.tax.withoutOffer, true),
    ],
  };
}

function annualEquation(
  key: string,
  scenario: ProfileScenario,
  result: ComparisonResult,
  {
    title,
    withoutOffer = false,
    additionalLeave = false,
  }: { title: string; withoutOffer?: boolean; additionalLeave?: boolean },
): Equation {
  const amount = scenarioAmounts(scenario)[key];
  const name = annualNames[key];
  if (amount === undefined || name === undefined) {
    throw new Error(`Missing annual equation: ${key}`);
  }
  let formula = primaryFormula(key, result, scenario, withoutOffer);
  const warnings: string[] = [];
  if (amount.status === "unavailable") {
    formula = `${name} = unavailable`;
    warnings.push(`Unavailable (${amount.code}): ${amount.reason}`);
  }
  let keys = componentKeys[key];
  const { help } = scenario.input;
  if (
    key === "help" &&
    (help?.scheme === "none" || (help?.scheme === "help" && help.section8FamilyExemption === true))
  ) {
    keys = ["help"];
  }
  const sections = sectionsFor(result, scenario, withoutOffer, { keys, additionalLeave });
  if (keys === undefined && !additionalLeave) {
    sections.push(attributionSection(result));
  }
  if (!withoutOffer && (keys === undefined || keys.includes("income"))) {
    sections.push(...paySections(result, scenario.input.year));
  }
  return {
    ...explanation(`${title} · ${scenario.input.year}`, formula, {
      ...annualValues(result, scenario, withoutOffer),
      displayedResult: taxValue(amount),
    }),
    context:
      "Annual tax component estimate. Final assessed tax is not verified; payroll withholding is separate.",
    result: { name, value: taxValue(amount), unit: "money" },
    origins: annualOrigins(result, withoutOffer),
    units: taxUnits,
    warnings,
    sections: [
      ...sections,
      { title: "Result basis and sources", formula: "", notes: taxNotes(amount) },
    ],
  };
}

export { annualEquation, annualSections, scenarioValues, taxNotes, taxValue };

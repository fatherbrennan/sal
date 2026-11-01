import { annual, eligibility, inputAmount, unavailable } from "./tax/common.ts";
import { helpRepayment } from "./tax/help.ts";
import { basicTax, lito } from "./tax/income.ts";
import { ordinaryMedicare } from "./tax/medicare.ts";
import { ordinaryMls } from "./tax/mls.ts";
import { TAX_RULE_VERSION } from "./tax/sources.ts";
import type { AnnualTaxInput, AnnualTaxResult, TaxAmount } from "./tax/types.d.ts";

function incomeComponents(
  input: AnnualTaxInput,
  gate: TaxAmount,
): {
  basicIncomeTax: TaxAmount;
  lito: TaxAmount;
  incomeTaxAfterLito: TaxAmount;
} {
  if (gate.status === "unavailable") {
    return { basicIncomeTax: gate, lito: gate, incomeTaxAfterLito: gate };
  }
  const basic = basicTax(input.year, gate.amount);
  const applied = lito(gate.amount, basic);
  let after = applied;
  if (applied.status === "available") {
    after = annual(basic - applied.amount, ["T01", "T03"]);
  }
  return { basicIncomeTax: annual(basic, ["T01"]), lito: applied, incomeTaxAfterLito: after };
}

function subtotal(components: readonly TaxAmount[]): TaxAmount {
  let total = 0;
  for (const component of components) {
    if (component.status === "unavailable") {
      return component;
    }
    total += component.amount;
  }
  return annual(total, ["T01", "T03", "T08", "T09", "T10", "T11", "T12", "T13"]);
}

function calculateAnnualTax(input: AnnualTaxInput): AnnualTaxResult {
  const resident = eligibility(
    input.ordinaryResidentAdult,
    "Ordinary full-year resident adult treatment",
    ["T01", "T03"],
  );
  let gate = resident;
  if (resident.status === "available") {
    gate = inputAmount(input.taxableIncome, "Established taxable income");
  }
  const income = incomeComponents(input, gate);
  let medicare = gate;
  let mls = gate;
  let help = resident;
  if (gate.status === "available") {
    medicare = ordinaryMedicare(gate.amount, input.medicare);
    mls = ordinaryMls(input.year, gate.amount, input.mls);
  }
  if (resident.status === "available") {
    help = helpRepayment(input.year, input.help);
  }
  const complete = eligibility(
    input.otherAssessmentItemsAbsent,
    "Absence of other offsets, charges and special assessment items",
    [],
  );
  return {
    ...income,
    medicare,
    mls,
    help,
    rawComponentSubtotal: subtotal([income.incomeTaxAfterLito, medicare, mls, help, complete]),
    finalAssessment: unavailable(
      "unverified-rule",
      "Final assessed tax is unavailable because rounding and combined-assessment rules are not fully verified. Component totals are estimates.",
      ["T01", "T03", "T08", "T12"],
    ),
    ruleVersion: TAX_RULE_VERSION,
  };
}

export { calculateAnnualTax };

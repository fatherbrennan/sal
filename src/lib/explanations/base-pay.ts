import { baseIsSeparate } from "../calculations/base-pay.ts";
import type { ComparisonResult } from "../calculations/comparison.ts";
import { value } from "../calculations/inputs.ts";
import { remuneration } from "../calculations/remuneration.ts";
import type { TaxYear } from "../calculations/tax/types.d.ts";
import type { EquationSection } from "./model.ts";
import { payRuleSections } from "./rules.ts";

const baseMetrics = Object.fromEntries([
  ["annual_base_cash", "Annual base cash before deductions"],
  ["annual_base_employer_super", "Base employer super"],
  ["annual_bonus_cash", "Selected bonus / commission cash"],
  ["annual_bonus_employer_super", "Selected bonus / commission super"],
]);

function basePayFormulas(result: ComparisonResult, year: TaxYear): Record<string, string> {
  const amounts = Object.fromEntries(
    Object.entries(baseMetrics).map(([name, label]) => [
      name,
      result.metrics.find((metric) => metric.label === label)?.amount ?? null,
    ]),
  );
  const base = remuneration(
    {
      ...result.offer,
      fields: result.payer,
      items: { ...result.offer.items, earnings: [] },
    },
    year,
    false,
    false,
  );
  let cash = "annual_base_cash_before_cap";
  let superAmount = "annual_base_super_before_cap";
  if (base.notes.some((note) => note.startsWith("Employer SG uses"))) {
    superAmount = payRuleSections.cappedSuper;
    if (value(result.payer, "inclusion") === "includes") {
      cash = "annual_base_pay_quote - annual_base_employer_super";
    }
  }
  const formulas = Object.fromEntries([
    ["annual_base_cash", cash],
    ["annual_base_employer_super", superAmount],
    ["annual_bonus_cash", "annual_cash_pay - annual_base_cash"],
    ["annual_bonus_employer_super", "annual_employer_super - annual_base_employer_super"],
  ]);
  for (const [name, amount] of Object.entries(amounts)) {
    if (amount === null) {
      formulas[name] = "unavailable";
    }
  }
  return formulas;
}

function basePaySection(result: ComparisonResult, year: TaxYear): EquationSection {
  const notes = [
    "Base cash excludes separately identified bonuses and commissions. It is before salary sacrifice and tax. Standard paid hours are a comparison denominator, not proof of the legal annual-leave rate.",
  ];
  if (!baseIsSeparate(result.offer)) {
    notes.push("Embedded or unclassified earnings prevent a separate base-pay breakdown.");
  }
  if (value(result.payer, "employment") === "sole-trader") {
    notes.push("Employee salary and bonus breakdowns do not apply to sole-trader revenue.");
  }
  return {
    title: "Base salary and selected additional earnings",
    formula: Object.entries(basePayFormulas(result, year))
      .map(([name, expression]) => `${name} = ${expression}`)
      .join("\n"),
    notes,
  };
}

export { basePayFormulas, basePaySection };

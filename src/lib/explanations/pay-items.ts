import { baseIsSeparate } from "../calculations/base-pay.ts";
import type { ComparisonResult } from "../calculations/comparison.ts";
import { rows, value } from "../calculations/inputs.ts";
import { annualAmount, employeeAmount } from "../calculations/remuneration.ts";
import type { Fields } from "../data/model.d.ts";
import { numeric } from "../data/numeric.ts";
import type { EquationReference, EquationSection } from "./model.ts";
import { payRuleSections } from "./rules.ts";

interface PayItem {
  fields: Fields;
  prefix: string;
  quote: string;
  scope: string;
  title: string;
  eligibility: string;
  blocked: boolean;
}
const minimumRate = 12;
const itemQuantities = ["cash", "super", "remuneration", "eligible_cash"];

function selectedItems(result: ComparisonResult): PayItem[] {
  const base: PayItem = {
    fields: result.payer,
    prefix: "annual_base",
    quote: "annual_base_pay_quote",
    scope: "",
    title: "Base pay before the employer-super limit",
    eligibility: "superEligible",
    blocked: result.scenario.baseOnly === true && !baseIsSeparate(result.offer),
  };
  if (result.scenario.baseOnly === true) {
    return [base];
  }
  return [
    base,
    ...rows(result.offer, "earnings").flatMap(({ fields }, index) => {
      const certainty = value(fields, "certainty");
      const recurrence = value(fields, "recurrence");
      const included = value(fields, "included");
      const excluded =
        (!result.scenario.target && certainty === "target") ||
        (!result.scenario.oneOff && recurrence === "once");
      const blocked = !(certainty && recurrence && included) || (included === "yes" && excluded);
      if (!blocked && (included === "yes" || excluded)) {
        return [];
      }
      return [
        {
          fields,
          prefix: "annual_bonus",
          quote: "annual_bonus_quote",
          scope: `bonus_${index + 1}`,
          title: value(fields, "label") || `Bonus or commission ${index + 1}`,
          eligibility: "eligible",
          blocked,
        },
      ];
    }),
  ];
}

function rateKnown(payer: Fields): boolean {
  const rate = numeric(payer, "superRate");
  return rate !== null && (value(payer, "superLimit") !== "statutory" || rate >= minimumRate);
}

function itemAmount(item: PayItem): number | null {
  if (item.scope === "") {
    return annualAmount(item.fields);
  }
  return numeric(item.fields, "amount");
}

function splitKnown(item: PayItem, payer: Fields): boolean {
  const eligible = value(item.fields, item.eligibility);
  return (
    itemAmount(item) !== null && (eligible === "no" || (eligible === "yes" && rateKnown(payer)))
  );
}

function itemFormula(item: PayItem, payer: Fields): string {
  const { fields, quote, prefix, blocked } = item;
  const inclusion = value(fields, "inclusion");
  const eligible = value(fields, item.eligibility);
  if (blocked || !["includes", "excludes"].includes(inclusion)) {
    return itemQuantities
      .map((quantity) => `${prefix}_${quantity}_before_cap = unknown`)
      .join("\n");
  }
  let cash = "unknown";
  let superAmount = "unknown";
  let gross = "unknown";
  let eligibleCash = "unknown";
  if (inclusion === "excludes") {
    cash = quote;
  }
  if (inclusion === "includes") {
    gross = quote;
  }
  if (splitKnown(item, payer) || (eligible === "yes" && rateKnown(payer))) {
    cash = quote;
    superAmount = "0";
    eligibleCash = "0";
    if (eligible === "yes") {
      if (inclusion === "includes") {
        cash = `${quote} / (1 + employer_super_percent / 100)`;
      }
      superAmount = `${prefix}_cash_before_cap * employer_super_percent / 100`;
      eligibleCash = cash;
    }
    if (inclusion === "excludes") {
      gross = `${prefix}_cash_before_cap + ${prefix}_super_before_cap`;
    }
  }
  return `${prefix}_cash_before_cap = ${cash}\n${prefix}_super_before_cap = ${superAmount}
${prefix}_remuneration_before_cap = ${gross}\n${prefix}_eligible_cash_before_cap = ${eligibleCash}`;
}

function itemSection(item: PayItem, result: ComparisonResult): EquationSection {
  const { scope, quote, title, fields } = item;
  const values = Object.fromEntries([
    ["employer_super_percent", numeric(result.payer, "superRate")],
    ...Object.entries(itemValues(item, result.payer)),
  ]);
  const origins = Object.fromEntries([
    [
      "employer_super_percent",
      "Effective offer employer-super percentage; statutory rates below 12% do not establish eligible contributions.",
    ],
  ]);
  if (scope !== "") {
    values[quote] = numeric(fields, "amount");
    origins[quote] = `Offer → Pay details → ${title.toLowerCase()} amount.`;
  }
  let notes = [payRuleSections.bonuses];
  if (item.blocked) {
    notes = [
      "This item's classification is incomplete, or the base quote includes pay excluded from this scenario. Dependent totals remain unavailable.",
    ];
  }
  return {
    title,
    scope,
    formula: itemFormula(item, result.payer),
    notes,
    values,
    origins,
    units: Object.fromEntries([
      [quote, "money"],
      ...itemQuantities.map((quantity) => [`${item.prefix}_${quantity}_before_cap`, "money"]),
    ]),
  };
}

function itemValues(item: PayItem, payer: Fields): Record<string, number | null> {
  let amount = itemAmount(item);
  if (item.blocked) {
    amount = null;
  }
  let rate = numeric(payer, "superRate");
  if (!rateKnown(payer)) {
    rate = null;
  }
  const split = employeeAmount(
    amount,
    value(item.fields, "inclusion"),
    value(item.fields, item.eligibility),
    rate,
  );
  return Object.fromEntries([
    [`${item.prefix}_cash_before_cap`, split.cash],
    [`${item.prefix}_super_before_cap`, split.super],
    [`${item.prefix}_remuneration_before_cap`, split.gross],
    [`${item.prefix}_eligible_cash_before_cap`, split.eligible],
  ]);
}

function payCollections(items: readonly PayItem[]): Record<string, readonly EquationReference[]> {
  return Object.fromEntries(
    itemQuantities.map((quantity) => [
      `selected_pay_item_${quantity}_before_cap`,
      items.map((item) => ({ scope: item.scope, name: `${item.prefix}_${quantity}_before_cap` })),
    ]),
  );
}

function collectionOrigins(): Record<string, string> {
  return Object.fromEntries(
    itemQuantities.map((quantity) => [
      `selected_pay_item_${quantity}_before_cap`,
      "Selected base and additional bonuses, each linked below. Embedded bonuses are not counted twice; incomplete classifications retain unknown members.",
    ]),
  );
}

function eligibleQuoteBasis(items: readonly PayItem[], payer: Fields): string {
  const active = items.filter(
    (item) =>
      item.blocked ||
      !splitKnown(item, payer) ||
      (value(item.fields, item.eligibility) !== "no" && itemAmount(item) !== 0) ||
      !["includes", "excludes"].includes(value(item.fields, "inclusion")),
  );
  if (active.every((item) => !item.blocked && value(item.fields, "inclusion") === "includes")) {
    return "includes";
  }
  if (active.every((item) => !item.blocked && value(item.fields, "inclusion") === "excludes")) {
    return "excludes";
  }
  return "mixed";
}

export type { PayItem };
export { collectionOrigins, eligibleQuoteBasis, itemSection, payCollections, selectedItems };

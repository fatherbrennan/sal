import { scenarioRemuneration } from "../calculations/base-pay.ts";
import type { ComparisonResult } from "../calculations/comparison.ts";
import { rows, value } from "../calculations/inputs.ts";
import { annualAmount } from "../calculations/remuneration.ts";
import { annualBaseLimit, quarterlyBaseLimit } from "../calculations/super-limits.ts";
import type { Fields } from "../data/model.d.ts";
import { numeric } from "../data/numeric.ts";
import type { EquationSection } from "./model.ts";
import {
  collectionOrigins,
  eligibleQuoteBasis,
  itemSection,
  payCollections,
  selectedItems,
} from "./pay-items.ts";
import { payRuleSections } from "./rules.ts";

function baseQuoteName(fields: Fields): string {
  if (value(fields, "unit") === "hour") {
    return "base_hourly_pay_quote";
  }
  if (value(fields, "unit") === "day") {
    return "base_daily_pay_quote";
  }
  return "annual_base_pay_quote";
}

function quoteQuantity(fields: Fields): { name: string; origin: string } {
  let unit = "days";
  if (value(fields, "unit") === "hour") {
    unit = "hours";
  }
  let basis = "paid";
  let origin =
    "Offer → Pay details → explicitly entered annual paid quantity; not calendar attendance.";
  if (value(fields, "employment") === "sole-trader") {
    basis = "billable";
    origin =
      "Offer → Pay details → Annual paid / billable hours or days: entered sole-trader billable quantity; not employee paid quantities or calendar attendance.";
  }
  return { name: `annual_${basis}_${unit}`, origin };
}

function baseQuoteSection(result: ComparisonResult): EquationSection {
  const fields = result.payer;
  const name = baseQuoteName(fields);
  let formula = "";
  let quoteOrigin =
    "Offer → Pay details → base pay amount, using its declared super or GST inclusion.";
  if (value(fields, "employment") === "sole-trader") {
    quoteOrigin =
      "Offer → Pay details → sole-trader revenue quote, using its declared GST inclusion.";
  }
  const origins: Record<string, string> = Object.fromEntries([
    [name, quoteOrigin],
    ["standard_paid_hours_per_week", "Offer → Pay details → standard paid hours per week."],
    ["standard_weeks_per_year", "Offer → Pay details → annual conversion weeks."],
  ]);
  const values: Record<string, number | null> = Object.fromEntries([
    [name, numeric(fields, "amount")],
    ["standard_paid_hours_per_week", numeric(fields, "weeklyHours")],
    ["standard_weeks_per_year", numeric(fields, "weeks")],
  ]);
  if (["hour", "day"].includes(value(fields, "unit"))) {
    const quantity = quoteQuantity(fields);
    formula = `annual_base_pay_quote = ${name} * ${quantity.name}\n`;
    Object.assign(values, Object.fromEntries([["annual_base_pay_quote", annualAmount(fields)]]));
    values[quantity.name] = numeric(fields, "paidUnits");
    origins[quantity.name] = quantity.origin;
  } else if (value(fields, "unit") !== "annual") {
    formula = "annual_base_pay_quote = unknown\nThe quote period is not established.\n";
    Object.assign(values, Object.fromEntries([["annual_base_pay_quote", null]]));
  }
  return {
    title: "Base pay quote and paid hours",
    formula: `${formula}standard_paid_hours_per_year = standard_paid_hours_per_week * standard_weeks_per_year`,
    values,
    origins,
    units: Object.fromEntries([["annual_base_pay_quote", "money"]]),
  };
}

const outputCollections = Object.fromEntries([
  ["annual_cash_pay", "selected_pay_item_cash_before_cap"],
  ["annual_employer_super", "selected_pay_item_super_before_cap"],
  ["annual_remuneration", "selected_pay_item_remuneration_before_cap"],
]);

function employeeOutputs(result: ComparisonResult): Record<string, string> {
  const fields = result.payer;
  const outputs = Object.fromEntries(
    Object.entries(outputCollections).map(([name, collection]) => [
      name,
      `${name} = sum(${collection})`,
    ]),
  );
  const basis = eligibleQuoteBasis(selectedItems(result), fields);
  if (value(fields, "superLimit") === "uncapped") {
    return outputs;
  }
  if (value(fields, "superLimit") === "") {
    for (const name of Object.keys(outputs)) {
      if (
        !(
          (name === "annual_cash_pay" && basis === "excludes") ||
          (name === "annual_remuneration" && basis === "includes")
        )
      ) {
        outputs[name] = `${name} = unavailable`;
      }
    }
    return outputs;
  }
  if (result.notes.some((note) => note.startsWith("Employer SG uses"))) {
    Object.assign(
      outputs,
      Object.fromEntries([
        ["annual_employer_super", `annual_employer_super = ${payRuleSections.cappedSuper}`],
      ]),
    );
    if (basis === "includes") {
      Object.assign(
        outputs,
        Object.fromEntries([
          [
            "annual_cash_pay",
            "annual_cash_pay = sum(selected_pay_item_remuneration_before_cap) - annual_employer_super",
          ],
        ]),
      );
    } else if (basis === "excludes") {
      Object.assign(
        outputs,
        Object.fromEntries([
          [
            "annual_remuneration",
            "annual_remuneration = sum(selected_pay_item_cash_before_cap) + annual_employer_super",
          ],
        ]),
      );
    }
  }
  return outputs;
}

function contractorOutputs(result: ComparisonResult): Record<string, string> {
  const { payer } = result;
  const gst = value(payer, "gst");
  let cash = "unknown";
  if (gst === "inclusive") {
    cash = "annual_base_pay_quote / 1.1";
  }
  if (gst === "exclusive" || gst === "none") {
    cash = "annual_base_pay_quote";
  }
  return Object.fromEntries([
    ["annual_cash_pay", `annual_cash_pay = ${cash}`],
    [
      "annual_employer_super",
      `annual_employer_super = ${numeric(payer, "contractorSuper") ?? "unknown"}`,
    ],
    ["annual_remuneration", "annual_remuneration = annual_cash_pay + annual_employer_super"],
  ]);
}

function outputRules(result: ComparisonResult): Record<string, string> {
  const employment = value(result.payer, "employment");
  if (
    employment === "" ||
    (employment === "sole-trader" && rows(result.offer, "earnings").length > 0)
  ) {
    return Object.fromEntries(
      Object.keys(outputCollections).map((name) => [name, `${name} = unavailable`]),
    );
  }
  if (employment === "sole-trader") {
    return contractorOutputs(result);
  }
  return employeeOutputs(result);
}

function limitSection(fields: Fields, year: string): EquationSection {
  let name = "employer_super_earnings_limit";
  let amount = annualBaseLimit;
  let formula = "employer_super_earnings_limit = 270830";
  let note = "Annual earnings base per employer for 2026–27.";
  if (year === "2025-26") {
    const quarters = 4;
    amount = quarterlyBaseLimit * quarters;
    formula = "employer_super_earnings_limit = 62500 * 4";
    note = "2025–26 quarterly base, using established equal quarters.";
    if (value(fields, "evenSuper") !== "yes") {
      name = "quarterly_super_earnings_limit";
      amount = quarterlyBaseLimit;
      formula = "quarterly_super_earnings_limit = 62500";
      note =
        "Without established equal quarters, annual eligible cash above the quarterly limit blocks the dependent split. This is an availability guard, not an annual cap.";
    }
  }
  return {
    title: "Employer-super earnings limit",
    formula,
    notes: [note, payRuleSections.cap],
    values: { [name]: amount },
    units: { [name]: "money" },
  };
}

function paySections(result: ComparisonResult, year: string): EquationSection[] {
  const fields = result.payer;
  const sections: EquationSection[] = [baseQuoteSection(result)];
  const outputs = Object.values(outputRules(result)).join("\n");
  const quote = scenarioRemuneration(
    { ...result.offer, fields },
    result.tax.withOffer.input.year,
    result.scenario,
  );
  const amounts = Object.fromEntries([
    ["annual_remuneration", quote.gross],
    ["annual_cash_pay", quote.cash],
    ["annual_employer_super", quote.super],
  ]);
  const units = Object.fromEntries(Object.keys(outputCollections).map((name) => [name, "money"]));
  const employment = value(fields, "employment");
  if (employment === "sole-trader" || employment === "") {
    sections.push({
      title: "Established revenue and hirer-super inputs",
      formula: outputs,
      values: amounts,
      units,
      origins: Object.fromEntries([
        [
          "annual_employer_super",
          "Offer → Pay details → established hirer super, separate from GST-exclusive revenue.",
        ],
      ]),
      notes: [
        "Employment and GST treatment must be established. Sole-trader fees cannot use employee bonus rows.",
      ],
    });
    return sections;
  }
  const items = selectedItems(result);
  sections.push({
    title: "Selected pay items and employer super",
    formula: `${payRuleSections.totals}\n${outputs}`,
    values: amounts,
    units,
    origins: collectionOrigins(),
    collections: payCollections(items),
    notes: [payRuleSections.bonuses],
    sections: items.map((item) => itemSection(item, result)),
  });
  if (value(fields, "superLimit") === "statutory") {
    sections.push(limitSection(fields, year));
  }
  return sections;
}

function payPrimaryFormula(result: ComparisonResult, name: string): string {
  let label = "Cash pay / revenue before deductions";
  if (name === "annual_employer_super") {
    label = "Employer / hirer super";
  }
  if (result.metrics.find((metric) => metric.label === label)?.amount === null) {
    return `${name} = unavailable`;
  }
  return outputRules(result)[name] ?? `${name} = unknown`;
}

export { baseQuoteName, payPrimaryFormula, paySections };

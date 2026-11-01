import type { SalRecord } from "../data/model.d.ts";
import { difference, rows, value } from "./inputs.ts";
import { annualAmount, type Quote, remuneration } from "./remuneration.ts";
import { numeric } from "./tax/profile-inputs.ts";
import type { TaxYear } from "./tax/types.d.ts";

interface PayScenario {
  target: boolean;
  oneOff: boolean;
  baseOnly?: boolean;
}
function baseIsSeparate(record: SalRecord): boolean {
  return rows(record, "earnings").every(({ fields }) => value(fields, "included") === "no");
}
function excludesEarnings(record: SalRecord, scenario: PayScenario): boolean {
  return (
    scenario.baseOnly === true &&
    value(record.fields, "employment") !== "sole-trader" &&
    rows(record, "earnings").length > 0
  );
}
function scenarioReportableSuper(record: SalRecord, scenario: PayScenario): number | null {
  const reported = numeric(record.fields, "reportableSuperOffer");
  if (
    excludesEarnings(record, scenario) &&
    reported !== 0 &&
    !(
      value(record.fields, "reportableSuperSameYear") === "yes" &&
      reported === numeric(record.fields, "sacrifice")
    )
  ) {
    return null;
  }
  return reported;
}
function baseOnlyRemuneration(record: SalRecord, year: TaxYear): Quote {
  if (value(record.fields, "employment") === "sole-trader") {
    return remuneration(record, year, false, false);
  }
  const base = { ...record, items: { ...record.items, earnings: [] } };
  if (!baseIsSeparate(record)) {
    base.fields = { ...record.fields, amount: "" };
  }
  const quote = remuneration(base, year, false, false);
  if (!baseIsSeparate(record)) {
    quote.notes.push(
      "Base-only pay is unavailable: the quote contains additional earnings, or their inclusion is unknown. Establish a separate base quote before comparing salary alone.",
    );
  }
  return quote;
}
function scenarioRemuneration(record: SalRecord, year: TaxYear, scenario: PayScenario): Quote {
  if (scenario.baseOnly === true) {
    return baseOnlyRemuneration(record, year);
  }
  return remuneration(record, year, scenario.target, scenario.oneOff);
}
function baseSuper(
  record: SalRecord,
  year: TaxYear,
  quote: Quote,
  scenario: PayScenario,
): number | null {
  if (value(record.fields, "inclusion") === "includes") {
    return difference(annualAmount(record.fields), quote.baseCash);
  }
  const base = baseOnlyRemuneration(record, year);
  if (base.super === 0 || value(record.fields, "superLimit") === "uncapped") {
    return base.super;
  }
  const uncapped = remuneration(
    { ...record, fields: { ...record.fields, superLimit: "uncapped" } },
    year,
    scenario.target,
    scenario.oneOff,
  );
  if (
    (quote.super !== null && quote.super === uncapped.super) ||
    (quote.cash !== null && quote.cash === base.cash)
  ) {
    return base.super;
  }
  return null;
}
function payBreakdown(record: SalRecord, year: TaxYear, quote: Quote, scenario: PayScenario) {
  let cash: number | null = null;
  let superAmount: number | null = null;
  const employee = value(record.fields, "employment") !== "sole-trader";
  if (employee && baseIsSeparate(record)) {
    cash = quote.baseCash;
    superAmount = baseSuper(record, year, quote, scenario);
    if (scenario.baseOnly === true) {
      superAmount = quote.super;
    }
  }
  return {
    cash,
    super: superAmount,
    bonusCash: difference(quote.cash, cash),
    bonusSuper: difference(quote.super, superAmount),
  };
}

export type { PayScenario };
export {
  baseIsSeparate,
  baseOnlyRemuneration,
  excludesEarnings,
  payBreakdown,
  scenarioRemuneration,
  scenarioReportableSuper,
};

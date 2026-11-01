import type { Fields, SalRecord } from "../data/model.d.ts";
import { numeric } from "../data/numeric.ts";
import { difference, product, quotient, rows, total, value } from "./inputs.ts";
import { annualBaseLimit, minimumRate, quarterlyBaseLimit } from "./super-limits.ts";
import type { TaxYear } from "./tax/types.d.ts";

interface Earnings {
  cash: number | null;
  super: number | null;
  gross: number | null;
  eligible: number | null;
  inclusion: string;
}
interface Quote extends Earnings {
  paidHours: number | null;
  baseCash: number | null;
  notes: string[];
}
type EmployeeAmounts = [Earnings, ...Earnings[]];
const percent = 100;
const gstFactor = 1.1;
const quarters = 4;
const unavailable: Earnings = {
  cash: null,
  super: null,
  gross: null,
  eligible: null,
  inclusion: "",
};

function annualAmount(fields: Fields): number | null {
  const amount = numeric(fields, "amount");
  const unit = value(fields, "unit");
  if (unit === "annual") {
    return amount;
  }
  if (unit === "hour" || unit === "day") {
    return product(amount, numeric(fields, "paidUnits"));
  }
  return null;
}
function employeeAmount(
  amount: number | null,
  inclusion: string,
  eligible: string,
  rate: number | null,
): Earnings {
  const partial = { ...unavailable, inclusion };
  if (inclusion === "includes") {
    partial.gross = amount;
  } else if (inclusion === "excludes") {
    partial.cash = amount;
  }
  if (
    amount === null ||
    !["yes", "no"].includes(eligible) ||
    (eligible === "yes" && rate === null)
  ) {
    return partial;
  }
  if (!["includes", "excludes"].includes(inclusion)) {
    return unavailable;
  }
  let fraction = 0;
  if (eligible === "yes" && rate !== null) {
    fraction = rate / percent;
  }
  let cash = amount;
  if (inclusion === "includes") {
    cash = amount / (1 + fraction);
  }
  const superAmount = cash * fraction;
  let eligibleCash = 0;
  if (eligible === "yes") {
    eligibleCash = cash;
  }
  let gross = cash + superAmount;
  if (inclusion === "includes") {
    gross = amount;
  }
  return { cash, super: superAmount, gross, eligible: eligibleCash, inclusion };
}
function contractorAmount(fields: Fields): Earnings {
  let cash = annualAmount(fields);
  const gst = value(fields, "gst");
  if (!["none", "exclusive", "inclusive"].includes(gst)) {
    return unavailable;
  }
  if (cash !== null && gst === "inclusive") {
    cash /= gstFactor;
  }
  const superAmount = numeric(fields, "contractorSuper");
  return {
    cash,
    super: superAmount,
    gross: total([cash, superAmount]),
    eligible: null,
    inclusion: "excludes",
  };
}
function bonusAmounts(
  record: SalRecord,
  target: boolean,
  oneOff: boolean,
  rate: number | null,
): Earnings[] {
  return rows(record, "earnings").flatMap((item) => {
    const { fields } = item;
    const certainty = value(fields, "certainty");
    const recurrence = value(fields, "recurrence");
    const included = value(fields, "included");
    if (!(certainty && recurrence && included)) {
      return [unavailable];
    }
    const excluded = (!target && certainty === "target") || (!oneOff && recurrence === "once");
    if (included === "yes" && excluded) {
      return [unavailable];
    }
    if (included === "yes" || excluded) {
      return [];
    }
    return [
      employeeAmount(
        numeric(fields, "amount"),
        value(fields, "inclusion"),
        value(fields, "eligible"),
        rate,
      ),
    ];
  });
}
function aggregate(amounts: Earnings[]): Earnings {
  const active = amounts.filter((entry) => entry.eligible !== 0);
  let inclusion = "mixed";
  if (active.every((entry) => entry.inclusion === "includes")) {
    inclusion = "includes";
  } else if (active.every((entry) => entry.inclusion === "excludes")) {
    inclusion = "excludes";
  }
  return {
    cash: total(amounts.map((entry) => entry.cash)),
    super: total(amounts.map((entry) => entry.super)),
    gross: total(amounts.map((entry) => entry.gross)),
    eligible: total(amounts.map((entry) => entry.eligible)),
    inclusion,
  };
}
function independentAmounts(amounts: Earnings[]): Earnings {
  const quote = aggregate(amounts);
  const partial = { ...unavailable, inclusion: quote.inclusion };
  if (quote.inclusion === "includes") {
    partial.gross = quote.gross;
  }
  if (quote.inclusion === "excludes") {
    partial.cash = quote.cash;
  }
  return partial;
}
function contributionLimit(fields: Fields, year: TaxYear): number {
  if (year === "2026-27") {
    return annualBaseLimit;
  }
  if (value(fields, "evenSuper") === "yes") {
    return quarterlyBaseLimit * quarters;
  }
  return quarterlyBaseLimit;
}
function cappedAmount(quote: Earnings, limit: number): Earnings {
  const superAmount = (limit * minimumRate) / percent;
  if (quote.inclusion === "includes" && quote.gross !== null) {
    return {
      ...quote,
      cash: quote.gross - superAmount,
      super: superAmount,
      eligible: difference(total([quote.eligible, quote.super]), superAmount),
    };
  }
  return { ...quote, super: superAmount, gross: total([quote.cash, superAmount]) };
}
function checkLimit(amounts: Earnings[], fields: Fields, year: TaxYear, notes: string[]): Earnings {
  const quote = aggregate(amounts);
  if (value(fields, "superLimit") === "") {
    notes.push("Confirm the employer super contribution limit.");
    return independentAmounts(amounts);
  }
  if (value(fields, "superLimit") === "uncapped") {
    return quote;
  }
  const limit = contributionLimit(fields, year);
  if (quote.eligible !== null && quote.eligible > limit) {
    if (
      (year === "2026-27" || value(fields, "evenSuper") === "yes") &&
      quote.inclusion !== "mixed" &&
      numeric(fields, "superRate") === minimumRate
    ) {
      notes.push(
        "Employer SG uses the established earnings-base cap; this is separate from the individual's contribution cap.",
      );
      return cappedAmount(quote, limit);
    }
    notes.push(
      "The capped split needs established period allocation and a consistent quote basis. Mixed inclusive/exclusive components or higher contractual rates require an explicit contribution breakdown.",
    );
    return independentAmounts(amounts);
  }
  return quote;
}
function payrollBase(
  amounts: EmployeeAmounts,
  combined: Earnings,
  fields: Fields,
  year: TaxYear,
): number | null {
  const [base] = amounts;
  if (base.inclusion === "excludes" || base.eligible === 0) {
    return base.cash;
  }
  if (combined.cash === null) {
    return null;
  }
  const uncapped = aggregate(amounts);
  if (combined.super !== uncapped.super) {
    if (amounts.slice(1).some((entry) => entry.eligible !== 0)) {
      return null;
    }
    return checkLimit([base], fields, year, []).cash;
  }
  return base.cash;
}
function remuneration(record: SalRecord, year: TaxYear, target: boolean, oneOff: boolean): Quote {
  const { fields } = record;
  const notes: string[] = [];
  const paidHours = product(numeric(fields, "weeklyHours"), numeric(fields, "weeks"));
  const employment = value(fields, "employment");
  if (employment === "sole-trader") {
    if (rows(record, "earnings").length > 0) {
      notes.push(
        "Include all fee items in annual revenue; employee bonus rows do not apply to sole-trader fees.",
      );
      return { ...unavailable, paidHours, baseCash: null, notes };
    }
    const quote = contractorAmount(fields);
    notes.push(
      "Contract revenue excludes GST. Business expenses and personal super are shown separately.",
    );
    return { ...quote, paidHours, baseCash: quote.cash, notes };
  }
  if (!employment) {
    return { ...unavailable, paidHours, baseCash: null, notes: ["Select the employment type."] };
  }
  let rate = numeric(fields, "superRate");
  if (rate !== null && rate < minimumRate && value(fields, "superLimit") === "statutory") {
    notes.push(
      "Eligible statutory employer contributions require at least 12% in both selected years.",
    );
    rate = null;
  }
  const base = employeeAmount(
    annualAmount(fields),
    value(fields, "inclusion"),
    value(fields, "superEligible"),
    rate,
  );
  const amounts: EmployeeAmounts = [base, ...bonusAmounts(record, target, oneOff, rate)];
  const combined = checkLimit(amounts, fields, year, notes);
  if (combined.cash === null) {
    notes.push(
      "Complete salary and super inputs. A base quote containing target or one-off earnings cannot establish recurring guaranteed pay; enter a base quote excluding those amounts and list them separately.",
    );
  }
  return { ...combined, paidHours, baseCash: payrollBase(amounts, combined, fields, year), notes };
}
function ordinarySuperNet(gross: number | null, fields: Fields): number | null {
  if (value(fields, "ordinaryFund") !== "yes") {
    return null;
  }
  const ordinaryRetention = 0.85;
  return product(gross, ordinaryRetention);
}
function cashBeforeTax(quote: Quote, fields: Fields): number | null {
  if (value(fields, "employment") === "sole-trader") {
    return difference(quote.cash, numeric(fields, "businessCosts"));
  }
  const remaining = difference(quote.cash, numeric(fields, "sacrifice"));
  if (remaining !== null && remaining < 0) {
    return null;
  }
  return remaining;
}
function baseHourly(quote: Quote): number | null {
  return quotient(quote.gross, quote.paidHours);
}

export type { Quote };
export { annualAmount, baseHourly, cashBeforeTax, employeeAmount, ordinarySuperNet, remuneration };

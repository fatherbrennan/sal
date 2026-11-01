import type { Fields } from "../data/model.d.ts";
import { numeric } from "../data/numeric.ts";
import { type AnnualLeaveResult, known, type LeaveAmount, unavailable } from "./annual-leave.ts";
import { value } from "./inputs.ts";
import type { Quote } from "./remuneration.ts";
import { annualBaseLimit, minimumRate, quarterlyBaseLimit } from "./super-limits.ts";
import type { TaxYear } from "./tax/types.d.ts";

interface LeaveSuper {
  gross: LeaveAmount;
  reportingKnown: boolean;
  existingEligible: number | null;
  periodEligible: number | null;
  periodDivisor: number;
  limit: number;
  rate: number | null;
}

const percent = 100;
const quarters = 4;

function superContext(fields: Fields, quote: Quote, year: TaxYear) {
  let limit = annualBaseLimit;
  let periodDivisor = 1;
  if (year === "2025-26") {
    limit = quarterlyBaseLimit;
    if (value(fields, "evenSuper") === "yes") {
      periodDivisor = quarters;
    }
  }
  let periodEligible: number | null = null;
  if (quote.eligible !== null && Number.isFinite(quote.eligible) && quote.eligible >= 0) {
    periodEligible = quote.eligible / periodDivisor;
  }
  return {
    existingEligible: quote.eligible,
    periodEligible,
    periodDivisor,
    limit,
    rate: numeric(fields, "superRate"),
  };
}

function cashOutSuper(
  leave: AnnualLeaveResult,
  quote: Quote,
  fields: Fields,
  year: TaxYear,
): LeaveSuper {
  const context = superContext(fields, quote, year);
  const result: LeaveSuper = {
    ...context,
    gross: leave.entitlementGross,
    reportingKnown: true,
  };
  const gross = leave.entitlementGross.amount;
  if (gross === null || gross === 0) {
    return result;
  }
  const limit = value(fields, "superLimit");
  if (
    context.rate !== minimumRate ||
    value(fields, "superEligible") !== "yes" ||
    !["statutory", "uncapped"].includes(limit)
  ) {
    return {
      ...result,
      reportingKnown: false,
      gross: unavailable(
        "Establish cash-out super and its reportable contribution treatment; only established statutory 12% treatment can be inferred.",
      ),
    };
  }
  const capped = cappedSuper(result, gross, limit, year);
  if (capped.gross.amount === 0) {
    return capped;
  }
  if (leave.loadingRate.amount !== 0) {
    return {
      ...result,
      gross: unavailable(
        "Establish whether the entered leave loading is super-eligible; loading replacing overtime is not automatically included.",
      ),
    };
  }
  return capped;
}

function cappedSuper(context: LeaveSuper, gross: number, limit: string, year: TaxYear): LeaveSuper {
  if (context.periodEligible === null || !Number.isFinite(gross) || gross < 0) {
    return {
      ...context,
      gross: unavailable(
        "Establish eligible earnings before calculating additional cash-out super.",
      ),
    };
  }
  const remaining = Math.max(0, context.limit - context.periodEligible);
  if (year === "2025-26" && context.periodDivisor === 1 && gross > remaining) {
    return {
      ...context,
      reportingKnown: limit === "statutory",
      gross: unavailable(
        "The payment quarter's existing eligible earnings are unknown and could limit cash-out super. The lump payment cannot be spread across four quarters.",
      ),
    };
  }
  if (limit === "uncapped" && gross > remaining) {
    return {
      ...context,
      reportingKnown: false,
      gross: unavailable(
        "Cash-out contributions above statutory headroom need an established contractual amount and reportable-super treatment.",
      ),
    };
  }
  return { ...context, gross: known((Math.min(gross, remaining) * minimumRate) / percent) };
}

export type { LeaveSuper };
export { cashOutSuper };

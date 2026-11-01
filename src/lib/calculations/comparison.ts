import type { Fields, SalRecord } from "../data/model.d.ts";
import { numeric } from "../data/numeric.ts";
import { type AnnualLeaveResult, annualLeave } from "./annual-leave.ts";
import {
  excludesEarnings,
  payBreakdown,
  scenarioRemuneration,
  scenarioReportableSuper,
} from "./base-pay.ts";
import { attendance } from "./calendar.ts";
import { comparisonMetrics } from "./comparison-metrics.ts";
import {
  commute,
  grossJobCosts,
  jobCostReimbursements,
  jobCosts,
  perks,
  travelTimeValue,
} from "./costs.ts";
import { difference, quotient, rows, total, value } from "./inputs.ts";
import { type LeaveCashOut, leaveCashOut } from "./leave-cash-out.ts";
import { leaveMetrics } from "./leave-metrics.ts";
import { type LeaveValuation, leaveValuation } from "./leave-valuation.ts";
import { cashBeforeTax, ordinarySuperNet, type Quote } from "./remuneration.ts";
import { calculateProfileTax } from "./tax/profile.ts";
import { guardReportedSuper, reportableSuperError } from "./tax/reporting.ts";
import {
  standardEstimateNotes,
  standardOfferFields,
  standardProfileFields,
} from "./tax/standard.ts";
import type { OfferTaxAmounts, ProfileTaxResult, TaxYear } from "./tax/types.d.ts";

interface Metric {
  label: string;
  amount: number | null;
  unit: "money" | "number" | "percent";
  lowerIsBetter: boolean | null;
}
interface ComparisonResult {
  offer: SalRecord;
  scenario: { target: boolean; oneOff: boolean; baseOnly?: boolean };
  metrics: Metric[];
  tax: ProfileTaxResult;
  notes: string[];
  profile: Fields;
  payer: Fields;
  baseCash: number | null;
  baseSuper: number | null;
  leave: AnnualLeaveResult;
  leaveCashOut: LeaveCashOut;
  leaveValuation: LeaveValuation;
}
interface ComparisonInput {
  offer: SalRecord;
  profile: Fields;
  vehicle: Fields;
  year: TaxYear;
  target: boolean;
  oneOff: boolean;
  timeValue: boolean;
  baseOnly?: boolean;
}
function taxProfile(shared: Fields, offer: SalRecord): Fields {
  const overrides = rows(offer, "taxOverride")[0]?.fields ?? {};
  return { ...shared, ...overrides };
}
function taxAmounts(input: ComparisonInput, profile: Fields, cash: number | null): OfferTaxAmounts {
  const { offer, target, oneOff } = input;
  let assessable = cash;
  let deductions = numeric(profile, "workDeductions");
  let labour = cash;
  let specified = numeric(profile, "specifiedWorkDeductions");
  if (value(offer.fields, "employment") === "sole-trader") {
    deductions = numeric(offer.fields, "businessDeductions");
    labour = numeric(offer.fields, "eligibleLabour");
    specified = numeric(offer.fields, "specifiedDeductions");
    if (deductions !== null && cash !== null && deductions > cash) {
      assessable = null;
    }
  }
  if (
    input.baseOnly !== true &&
    rows(offer, "earnings").some(
      ({ fields }) =>
        (target || value(fields, "certainty") !== "target") &&
        (oneOff || value(fields, "recurrence") !== "once") &&
        value(fields, "taxClass") !== "ordinary",
    )
  ) {
    assessable = null;
  }
  return {
    assessableIncome: assessable,
    deductions,
    assessableLabourIncome: labour,
    specifiedWorkDeductions: specified,
    reportableBenefits: numeric(offer.fields, "reportableBenefitsOffer"),
    reportableSuper: scenarioReportableSuper(offer, input),
  };
}
function netValues(quote: Quote, fields: Fields, tax: ProfileTaxResult, perkValue: number | null) {
  const cash = cashBeforeTax(quote, fields);
  let assignedTax: number | null = null;
  if (tax.incrementalTax.status === "available") {
    assignedTax = tax.incrementalTax.amount;
  }
  const grossPackage = total([quote.gross, perkValue]);
  let sacrifice = numeric(fields, "sacrifice");
  let personal = numeric(fields, "personalSuper");
  let operatingSurplus: number | null = null;
  if (value(fields, "employment") === "sole-trader") {
    sacrifice = 0;
    personal = numeric(fields, "contractorPersonalSuper");
    operatingSurplus = cash;
  }
  const superGross = total([quote.super, sacrifice, personal]);
  const superNet = total([ordinarySuperNet(total([quote.super, sacrifice]), fields), personal]);
  const assessedCash = difference(difference(cash, personal), assignedTax);
  const netPackage = total([assessedCash, superNet, perkValue]);
  const grossHourly = quotient(grossPackage, quote.paidHours);
  const cashHourly = quotient(assessedCash, quote.paidHours);
  const financialHourly = quotient(total([assessedCash, superNet]), quote.paidHours);
  return {
    assignedTax,
    grossPackage,
    superGross,
    superNet,
    assessedCash,
    netPackage,
    grossHourly,
    cashHourly,
    financialHourly,
    sacrifice,
    personal,
    operatingSurplus,
  };
}
function comparisonTax(input: ComparisonInput, profile: Fields, quote: Quote) {
  const { fields } = input.offer;
  let assessableCash = cashBeforeTax(quote, fields);
  if (value(fields, "employment") === "sole-trader") {
    assessableCash = quote.cash;
  }
  const reportingError = reportableSuperError(fields);
  const taxInput = {
    year: input.year,
    profile,
    offer: taxAmounts(input, profile, assessableCash),
    excludesEarnings: excludesEarnings(input.offer, input),
  };
  const tax = guardReportedSuper(calculateProfileTax(taxInput), reportingError);
  return { tax, taxInput, reportingError };
}
function comparisonValues(input: ComparisonInput) {
  const { offer, year, oneOff, timeValue } = input;
  const { fields } = offer;
  const profile = standardProfileFields(taxProfile(input.profile, offer), fields);
  const quote = scenarioRemuneration(offer, year, input);
  const breakdown = payBreakdown(offer, year, quote, input);
  const calendar = attendance(offer, year);
  const travel = commute(fields, input.vehicle, calendar.journeys, year);
  const perkValue = perks(offer, calendar.journeys);
  const otherCosts = jobCosts(offer, calendar.journeys, oneOff);
  const costs = total([travel.cash, otherCosts]);
  const { tax, taxInput, reportingError } = comparisonTax(input, profile, quote);
  const leave = annualLeave(offer, breakdown.cash);
  const net = netValues(quote, fields, tax, perkValue);
  const cashOut = leaveCashOut(leave.entitlementGross, taxInput, tax.withOffer);
  return {
    quote,
    breakdown,
    calendar,
    travel,
    perkValue,
    otherCosts,
    reimbursements: jobCostReimbursements(offer, calendar.journeys, oneOff),
    costs,
    grossCosts: grossJobCosts(fields, costs),
    ...net,
    grossTime: travelTimeValue(net.grossHourly, travel.hours, timeValue),
    netTime: travelTimeValue(net.financialHourly, travel.hours, timeValue),
    tax,
    leave,
    cashOut,
    leaveValuation: leaveValuation(leave, breakdown.super, {
      fields,
      profile,
      year,
      quote,
      cashOut,
    }),
    profile,
    notes: [
      ...quote.notes,
      ...calendar.notes,
      travel.note,
      ...reportingNotes(reportingError),
      "Tax figures are component-based estimates. Final assessment precision and special circumstances may change the result.",
      "Reimbursements offset entered costs; personal perks are additive values and are not bank receipts.",
      "Do not enter the same saving as both a perk and a reduced cost, or repeat business costs in extra job costs. Employee-directed super is transferred remuneration, not additional employer reward.",
    ],
  };
}
function reportingNotes(error: string | null): string[] {
  if (error === null) {
    return [];
  }
  return [error];
}
function calculateComparison(input: ComparisonInput): ComparisonResult {
  const fields = standardOfferFields(
    input.offer.fields,
    input.year,
    rows(input.offer, "earnings").length > 0,
  );
  const data = comparisonValues({ ...input, offer: { ...input.offer, fields } });
  const notes = [...data.notes];
  if (
    data.financialHourly !== null &&
    data.financialHourly < 0 &&
    input.timeValue &&
    data.travel.hours !== 0
  ) {
    notes.push(
      "Commute-time valuation is unavailable because cash plus net super per paid hour is negative. Negative cash and financial totals remain visible; commuting is not treated as a gain.",
    );
  }
  if (
    value(fields, "estimateMode") === "standard" ||
    value(data.profile, "estimateMode") === "standard"
  ) {
    notes.push(...standardEstimateNotes);
  }
  return {
    metrics: [...comparisonMetrics(data), ...leaveMetrics(data.leave, data.leaveValuation)],
    offer: input.offer,
    scenario: { target: input.target, oneOff: input.oneOff, baseOnly: input.baseOnly === true },
    tax: data.tax,
    profile: data.profile,
    payer: fields,
    baseCash: data.breakdown.cash,
    baseSuper: data.breakdown.super,
    leave: data.leave,
    leaveCashOut: data.cashOut,
    leaveValuation: data.leaveValuation,
    notes,
  };
}

type ComparisonValues = ReturnType<typeof comparisonValues>;

export type { ComparisonInput, ComparisonResult, ComparisonValues, Metric };
export { calculateComparison };

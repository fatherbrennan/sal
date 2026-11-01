import type { Fields, SalRecord } from "../data/model.d.ts";
import { numeric } from "../data/numeric.ts";
import { validDate } from "../data/validation.ts";
import { value } from "./inputs.ts";

interface LeaveAmount {
  amount: number | null;
  reason: string;
}
interface AnnualLeaveResult {
  eligible: boolean;
  entitlementWeeks: LeaveAmount;
  ordinaryHours: LeaveAmount;
  entitlementHours: LeaveAmount;
  ordinaryRate: LeaveAmount;
  loadingRate: LeaveAmount;
  entitlementBase: LeaveAmount;
  entitlementLoading: LeaveAmount;
  entitlementGross: LeaveAmount;
  balanceHours: LeaveAmount;
  balanceBase: LeaveAmount;
  balanceLoading: LeaveAmount;
  balanceGross: LeaveAmount;
  balanceDate: string | null;
  netPayout: LeaveAmount;
}

const ordinarySalaryWeeks = 52;
const percentScale = 100;
const minimumEntitlementWeeks = 4;
const leaveEmploymentTypes = new Set(["full-time", "part-time"]);
const conditionalEmploymentTypes = new Set([
  "fixed-term",
  "apprentice",
  "labour-hire",
  "other-employee",
]);

function unavailable(reason: string): LeaveAmount {
  return { amount: null, reason };
}

function known(amount: number): LeaveAmount {
  if (!Number.isFinite(amount)) {
    return unavailable("The calculated leave value exceeds the supported numeric range.");
  }
  return { amount, reason: "" };
}

function entered(fields: Fields, key: string, label: string): LeaveAmount {
  const amount = numeric(fields, key);
  if (amount === null || !Number.isFinite(amount) || amount < 0) {
    return unavailable(`Enter a valid ${label}; a blank amount is unknown.`);
  }
  return known(amount);
}

function multiplied(left: LeaveAmount, right: LeaveAmount): LeaveAmount {
  if (left.amount === null) {
    return left;
  }
  if (right.amount === null) {
    return right;
  }
  return known(left.amount * right.amount);
}

function combined(left: LeaveAmount, right: LeaveAmount): LeaveAmount {
  if (left.amount === null) {
    return left;
  }
  if (right.amount === null) {
    return right;
  }
  return known(left.amount + right.amount);
}

function employmentReason(fields: Fields): string {
  const employment = value(fields, "employment");
  if (!employment) {
    return "Select the employment type before calculating employee annual leave.";
  }
  if (leaveEmploymentTypes.has(employment) || conditionalEmploymentTypes.has(employment)) {
    if (Object.hasOwn(fields, "leaveEligible")) {
      if (value(fields, "leaveEligible") === "yes") {
        return "";
      }
    } else if (leaveEmploymentTypes.has(employment) || value(fields, "ordinaryLeave") === "yes") {
      return "";
    }
    return "Confirm non-casual employee paid-leave eligibility for this arrangement before valuing leave.";
  }
  return "This employee annual-leave model does not establish a casual or contractor benefit.";
}

function ordinaryHours(fields: Fields, scope: string): LeaveAmount {
  if (scope) {
    return unavailable(scope);
  }
  const result = entered(fields, "leaveOrdinaryHours", "paid hours per leave week value");
  if (result.amount === 0) {
    return unavailable("Enter paid hours per leave week above zero, using the employer's terms.");
  }
  return result;
}

function ordinaryRate(
  fields: Fields,
  annualBaseCash: number | null,
  hours: LeaveAmount,
  scope: string,
): LeaveAmount {
  if (scope) {
    return unavailable(scope);
  }
  const basis = value(fields, "leaveRateBasis");
  if (basis === "entered") {
    return entered(fields, "leaveHourlyRate", "confirmed base cash rate per leave hour");
  }
  if (basis !== "salary" || value(fields, "unit") !== "annual") {
    return unavailable(
      "Establish the leave-pay basis; salary conversion requires an annual quote.",
    );
  }
  if (hours.amount === null) {
    return hours;
  }
  if (annualBaseCash === null || !Number.isFinite(annualBaseCash) || annualBaseCash < 0) {
    return unavailable(
      "The annual base cash salary has not been isolated from super and other pay.",
    );
  }
  return known(annualBaseCash / hours.amount / ordinarySalaryWeeks);
}

function loadingRate(fields: Fields, scope: string, rate: LeaveAmount): LeaveAmount {
  if (scope) {
    return unavailable(scope);
  }
  const basis = value(fields, "leaveLoadingBasis");
  if (basis === "none") {
    return known(0);
  }
  if (basis === "hourly") {
    return entered(fields, "leaveLoadingHourly", "established additional loading per leave hour");
  }
  if (basis === "percent") {
    const loading = entered(fields, "leaveLoadingPercent", "leave-loading percentage");
    if (loading.amount === null) {
      return loading;
    }
    return multiplied(rate, known(loading.amount / percentScale));
  }
  return unavailable(
    "Establish applicable leave loading; an unanswered setting does not mean none.",
  );
}

function balanceHours(fields: Fields, scope: string): LeaveAmount {
  if (scope) {
    return unavailable(scope);
  }
  if (!validDate(value(fields, "leaveBalanceDate"))) {
    return unavailable("Enter the effective date of the supplied unused annual-leave balance.");
  }
  return entered(fields, "leaveBalanceHours", "unused annual-leave balance in hours");
}

function annualLeave(record: SalRecord, annualBaseCash: number | null): AnnualLeaveResult {
  const { fields } = record;
  const scope = employmentReason(fields);
  let entitlementWeeks = entered(fields, "annualLeave", "annual-leave entitlement in weeks");
  if (scope) {
    entitlementWeeks = unavailable(scope);
  } else if (
    entitlementWeeks.amount !== null &&
    entitlementWeeks.amount < minimumEntitlementWeeks
  ) {
    entitlementWeeks = unavailable(
      "The normal full-year NES leave model requires at least 4 weeks of annual entitlement; this is not a balance or leave taken.",
    );
  }
  const hours = ordinaryHours(fields, scope);
  const entitlementHours = multiplied(entitlementWeeks, hours);
  const rate = ordinaryRate(fields, annualBaseCash, hours, scope);
  const loading = loadingRate(fields, scope, rate);
  const balance = balanceHours(fields, scope);
  const entitlementBase = multiplied(entitlementHours, rate);
  const entitlementLoading = multiplied(entitlementHours, loading);
  const balanceBase = multiplied(balance, rate);
  const balanceLoading = multiplied(balance, loading);
  let balanceDate: string | null = null;
  if (validDate(value(fields, "leaveBalanceDate"))) {
    balanceDate = value(fields, "leaveBalanceDate");
  }
  return {
    eligible: !scope,
    entitlementWeeks,
    ordinaryHours: hours,
    entitlementHours,
    ordinaryRate: rate,
    loadingRate: loading,
    entitlementBase,
    entitlementLoading,
    entitlementGross: combined(entitlementBase, entitlementLoading),
    balanceHours: balance,
    balanceBase,
    balanceLoading,
    balanceGross: combined(balanceBase, balanceLoading),
    balanceDate,
    netPayout: unavailable(
      "A balance valuation is not a payout. Cash-out or termination needs separately verified event-specific tax and super treatment.",
    ),
  };
}

export type { AnnualLeaveResult, LeaveAmount };
export { annualLeave, combined, known, multiplied, ordinarySalaryWeeks, unavailable };

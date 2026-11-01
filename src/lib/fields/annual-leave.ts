import type { Fields } from "../data/model.d.ts";
import { answer, choices, field, select } from "./helpers.ts";

const annualLeaveFields = [
  answer(
    "leaveEligible",
    "Paid annual leave applies?",
    "For non-casual employees covered by the NES, including more generous employer terms. Blank means eligibility is unknown.",
  ),
  field(
    "leaveOrdinaryHours",
    "Paid hours per leave week",
    "decimal",
    "Enter the employer-confirmed hours paid for one week of annual leave. A 40-hour work week alone does not establish 40 leave hours. Separate from comparison hours and time off in lieu.",
  ),
  select(
    "leaveRateBasis",
    "Leave pay",
    choices([
      ["salary", "Normal base salary continues during leave"],
      ["entered", "Enter a confirmed hourly leave rate"],
    ]),
    "The salary estimate assumes one leave week pays annual base cash ÷ 52, excluding bonuses and loading. Use a confirmed hourly rate if the employer uses another pay basis. This choice does not establish an entitlement.",
  ),
  field(
    "leaveHourlyRate",
    "Confirmed leave base rate (AUD/hour)",
    "decimal",
    "Before tax, excluding super and leave loading. Use the employer's established leave-pay rate; enter loading separately.",
  ),
  select(
    "leaveLoadingBasis",
    "Annual leave loading",
    choices([
      ["none", "No loading applies"],
      ["percent", "Percentage of base leave pay"],
      ["hourly", "Dollars per leave hour"],
    ]),
    "Extra pay during annual leave. Blank means unknown. Enter the employer's applicable loading; 17.5% is not universal. Use an hourly amount for a different pay basis or higher-of rule.",
  ),
  field(
    "leaveLoadingPercent",
    "Leave loading (%)",
    "decimal",
    "A confirmed percentage of the base leave pay calculated here. If loading uses an award minimum or another basis, enter its established dollar amount per leave hour instead.",
  ),
  field(
    "leaveLoadingHourly",
    "Additional leave loading (AUD/hour)",
    "decimal",
    "A confirmed uniform extra amount for every leave hour being valued. The ordinary base rate must exclude all loading.",
  ),
  field(
    "leaveBalanceHours",
    "Recorded unused annual leave balance (hours)",
    "decimal",
    "Optional: enter an established balance, not the annual entitlement. Blank means unknown; zero must be entered explicitly.",
  ),
  field(
    "leaveBalanceDate",
    "Leave balance as of",
    "date",
    "The balance is not accrued or updated automatically. Its value uses the currently entered pay basis, not a historical or future payout rate.",
  ),
];

function leaveFieldVisible(key: string, fields: Fields): boolean {
  const { employment = "", leaveRateBasis, leaveLoadingBasis } = fields;
  if (["casual", "sole-trader", ""].includes(employment)) {
    return false;
  }
  if (key === "leaveEligible") {
    return Object.hasOwn(fields, key) || !["full-time", "part-time"].includes(employment);
  }
  if (key === "leaveHourlyRate") {
    return leaveRateBasis === "entered";
  }
  if (key === "leaveLoadingHourly") {
    return leaveLoadingBasis === "hourly";
  }
  if (key === "leaveLoadingPercent") {
    return leaveLoadingBasis === "percent";
  }
  return true;
}

export { annualLeaveFields, leaveFieldVisible };

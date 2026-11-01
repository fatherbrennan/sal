import type { AnnualLeaveResult } from "./annual-leave.ts";
import type { ComparisonResult, Metric } from "./comparison.ts";
import type { LeaveValuation } from "./leave-valuation.ts";

const leaveMetricKeys = {
  "Annual leave entitlement (weeks)": "entitlementWeeks",
  "Ordinary hours per week": "ordinaryHours",
  "Annual leave entitlement (hours)": "entitlementHours",
  "Ordinary leave base cash per hour": "ordinaryRate",
  "Additional leave loading per hour": "loadingRate",
  "Annual entitlement: base cash value": "entitlementBase",
  "Annual entitlement: loading value": "entitlementLoading",
  "Annual entitlement: gross illustrative value": "entitlementGross",
  "Recorded unused balance (hours)": "balanceHours",
  "Recorded balance: base cash value": "balanceBase",
  "Recorded balance: loading value": "balanceLoading",
  "Recorded balance: gross illustrative value": "balanceGross",
} as const satisfies Record<string, keyof AnnualLeaveResult>;
const leaveCashOutLabel = "Hypothetical annual leave cash-out after tax";
const leaveValuationKeys = {
  "Ordinary leave base pay plus super per hour": "grossHourly",
  "Annual leave: allocated base employer super": "earnedSuper",
  "Annual leave: base pay plus super": "earnedGross",
  "Hypothetical leave cash-out: employer super": "payoutSuper",
  "Hypothetical leave cash-out: ordinary fund tax": "payoutSuperTax",
  "Hypothetical leave cash-out: net super": "payoutNetSuper",
  "Hypothetical leave cash-out: net total": "payoutTotal",
  [leaveCashOutLabel]: "payoutCash",
} as const satisfies Record<string, keyof LeaveValuation>;

function leaveValuationKey(label: string) {
  return Object.entries(leaveValuationKeys).find(([name]) => name === label)?.[1];
}

function isLeaveMetric(label: string): boolean {
  return leaveMetricKey(label) !== undefined || leaveValuationKey(label) !== undefined;
}

function leaveMetricKey(label: string) {
  return Object.entries(leaveMetricKeys).find(([name]) => name === label)?.[1];
}

function leaveMetrics(leave: AnnualLeaveResult, valuation: LeaveValuation): Metric[] {
  const counts = new Set(["entitlementWeeks", "ordinaryHours", "entitlementHours", "balanceHours"]);
  return [
    ...Object.entries(leaveMetricKeys).map(([label, key]): Metric => {
      let unit: Metric["unit"] = "money";
      if (counts.has(key)) {
        unit = "number";
      }
      let lowerIsBetter: Metric["lowerIsBetter"] = false;
      if (key === "ordinaryHours" || key === "entitlementHours" || key.startsWith("balance")) {
        lowerIsBetter = null;
      }
      return {
        label,
        amount: leave[key].amount,
        unit,
        lowerIsBetter,
      };
    }),
    ...Object.entries(leaveValuationKeys).map(
      ([label, key]): Metric => ({
        label,
        amount: valuation[key].amount,
        unit: "money",
        lowerIsBetter: key === "payoutSuperTax",
      }),
    ),
  ];
}

function leaveReason(result: ComparisonResult, label: string): string {
  const key = leaveMetricKey(label);
  if (key !== undefined) {
    return result.leave[key].reason;
  }
  const valuationKey = leaveValuationKey(label);
  if (valuationKey !== undefined) {
    return result.leaveValuation[valuationKey].reason;
  }
  return "";
}

export {
  isLeaveMetric,
  leaveCashOutLabel,
  leaveMetricKey,
  leaveMetricKeys,
  leaveMetrics,
  leaveReason,
  leaveValuationKey,
  leaveValuationKeys,
};

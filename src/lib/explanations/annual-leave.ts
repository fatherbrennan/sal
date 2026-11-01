import {
  type AnnualLeaveResult,
  annualLeave,
  ordinarySalaryWeeks,
} from "../calculations/annual-leave.ts";
import { value } from "../calculations/inputs.ts";
import type { SalRecord } from "../data/model.d.ts";
import { numeric } from "../data/numeric.ts";
import type { Equation, EquationSection } from "./model.ts";
import { equationSections, primaryFormula } from "./presentation.ts";

type LeaveMetric = Exclude<keyof AnnualLeaveResult, "eligible" | "balanceDate">;
interface LeaveDefinition {
  name: string;
  title: string;
  unit: string;
  formula: string;
}
const percentageLoadingFormula =
  "annual_leave_loading_per_hour = ordinary_base_cash_per_hour * annual_leave_loading_percent / 100";

function definition(name: string, title: string, formula = "", unit = "money"): LeaveDefinition {
  return { name, title, unit, formula };
}

const leaveDefinitions: Readonly<Record<LeaveMetric, LeaveDefinition>> = {
  entitlementWeeks: definition(
    "annual_leave_entitlement_weeks",
    "Entered annual-leave entitlement",
    "",
    "weeks",
  ),
  ordinaryHours: definition("paid_hours_per_leave_week", "Paid hours per leave week", "", "hours"),
  entitlementHours: definition(
    "annual_leave_entitlement_hours",
    "Annual-leave entitlement hours",
    "annual_leave_entitlement_hours = annual_leave_entitlement_weeks * paid_hours_per_leave_week",
    "hours",
  ),
  ordinaryRate: definition("ordinary_base_cash_per_hour", "Base cash per leave hour"),
  loadingRate: definition("annual_leave_loading_per_hour", "Additional loading per leave hour"),
  entitlementBase: definition(
    "annual_leave_entitlement_base_cash",
    "Nominal base salary value of annual entitlement",
    "annual_leave_entitlement_base_cash = annual_leave_entitlement_hours * ordinary_base_cash_per_hour",
  ),
  entitlementLoading: definition(
    "annual_leave_entitlement_loading",
    "Nominal loading value of annual entitlement",
    "annual_leave_entitlement_loading = annual_leave_entitlement_hours * annual_leave_loading_per_hour",
  ),
  entitlementGross: definition(
    "annual_leave_entitlement_gross_value",
    "Nominal gross value of annual entitlement",
    "annual_leave_entitlement_gross_value = annual_leave_entitlement_base_cash + annual_leave_entitlement_loading",
  ),
  balanceHours: definition(
    "unused_annual_leave_hours",
    "Entered unused annual-leave hours",
    "",
    "hours",
  ),
  balanceBase: definition(
    "unused_annual_leave_base_cash",
    "Unused annual-leave base cash value",
    "unused_annual_leave_base_cash = unused_annual_leave_hours * ordinary_base_cash_per_hour",
  ),
  balanceLoading: definition(
    "unused_annual_leave_loading",
    "Unused annual-leave loading value",
    "unused_annual_leave_loading = unused_annual_leave_hours * annual_leave_loading_per_hour",
  ),
  balanceGross: definition(
    "unused_annual_leave_gross_value",
    "Unused annual-leave gross value",
    "unused_annual_leave_gross_value = unused_annual_leave_base_cash + unused_annual_leave_loading",
  ),
  netPayout: definition(
    "annual_leave_net_payout",
    "Annual-leave net payout",
    "annual_leave_net_payout = unavailable",
  ),
};

const leaveOrigins = Object.fromEntries([
  [
    "annual_leave_entitlement_weeks",
    "Offer → Paid annual leave → entered entitlement weeks; not a balance or leave taken.",
  ],
  [
    "paid_hours_per_leave_week",
    "Offer → Paid annual leave → employer-confirmed paid hours per leave week; separate from comparison hours and statutory ordinary hours. Values above 38 are supported when the employer's leave terms provide them.",
  ],
  [
    "ordinary_base_cash_per_hour",
    "Offer → Paid annual leave → selected leave-pay basis: normal base salary estimate or a confirmed hourly rate, excluding loading, bonus and super.",
  ],
  [
    "annual_leave_loading_per_hour",
    "Offer → Paid annual leave → confirmed loading as a percentage of this base leave pay, dollars per leave hour, or no loading. The base rate excludes loading.",
  ],
  [
    "annual_leave_loading_percent",
    "Offer → Paid annual leave → confirmed percentage of the base leave pay calculated here. Loading on an award minimum or another basis requires an established hourly amount.",
  ],
  [
    "ordinary_salary_weeks_per_year",
    "The normal-base-salary estimate uses 52 weeks and the entered paid hours per leave week. It does not change comparison conversion weeks.",
  ],
  [
    "unused_annual_leave_hours",
    "Offer → Paid annual leave → supplied unused balance at its entered effective date; no accrual or attendance ledger is inferred.",
  ],
  [
    "annual_base_cash",
    "The independently isolated annual base cash from the selected earnings scenario, excluding employer super and separately identified bonuses; unknown when the split is not established.",
  ],
]);

function rateFormula(record: SalRecord): string {
  if (value(record.fields, "leaveRateBasis") === "salary") {
    return "ordinary_base_cash_per_hour = annual_base_cash / (paid_hours_per_leave_week * ordinary_salary_weeks_per_year)";
  }
  return "";
}

function leaveSections(record: SalRecord, baseEquation?: Equation): EquationSection[] {
  const sections: EquationSection[] = Object.values(leaveDefinitions).map(({ title, formula }) => ({
    title,
    formula,
  }));
  sections.push({ title: "Normal base salary estimate", formula: rateFormula(record) });
  if (value(record.fields, "leaveLoadingBasis") === "none") {
    sections.push({ title: "Confirmed no loading", formula: "annual_leave_loading_per_hour = 0" });
  }
  if (value(record.fields, "leaveLoadingBasis") === "percent") {
    sections.push({ title: "Percentage loading", formula: percentageLoadingFormula });
  }
  if (baseEquation !== undefined && value(record.fields, "leaveRateBasis") === "salary") {
    sections.push({
      ...baseEquation,
      formula: primaryFormula(baseEquation),
      sections: equationSections(baseEquation),
    });
  }
  return sections;
}

function metricFormula(record: SalRecord, key: LeaveMetric): string {
  if (key === "ordinaryRate") {
    return rateFormula(record);
  }
  if (key === "loadingRate" && value(record.fields, "leaveLoadingBasis") === "none") {
    return "annual_leave_loading_per_hour = 0";
  }
  if (key === "loadingRate" && value(record.fields, "leaveLoadingBasis") === "percent") {
    return percentageLoadingFormula;
  }
  return leaveDefinitions[key].formula;
}

function leaveNotes(result: AnnualLeaveResult, key: LeaveMetric): string[] {
  const notes = [
    "Informational gross valuation only. Annual earnings use the salary quote or explicitly entered annual paid quantities; these leave values are not added to pay or package totals.",
    "Entitlement is not leave taken or an accrued balance. No leave dates, yearly payout, loading percentage or unused balance are assumed.",
    "The salary estimate assumes each leave week pays annual base cash / 52, excluding bonuses and loading. This is an editable modelling assumption, not proof of the employer's terms. Enter a confirmed hourly rate if leave pay differs.",
  ];
  if (result[key].reason) {
    notes.unshift(result[key].reason);
  }
  if (result.balanceDate !== null) {
    notes.push(
      `Supplied balance effective date: ${result.balanceDate}. Valued using the selected leave-pay basis.`,
    );
  }
  return notes;
}

function annualLeaveEquation(
  record: SalRecord,
  annualBaseCash: number | null,
  key: LeaveMetric,
  baseEquation?: Equation,
): Equation {
  const result = annualLeave(record, annualBaseCash);
  const selected = leaveDefinitions[key];
  const values = Object.fromEntries(
    Object.keys(leaveDefinitions)
      .filter((metric): metric is LeaveMetric => Object.hasOwn(leaveDefinitions, metric))
      .map((metric) => [leaveDefinitions[metric].name, result[metric].amount]),
  );
  Object.assign(
    values,
    Object.fromEntries([
      ["annual_base_cash", annualBaseCash],
      ["ordinary_salary_weeks_per_year", ordinarySalaryWeeks],
      ["annual_leave_loading_percent", numeric(record.fields, "leaveLoadingPercent")],
    ]),
  );
  return {
    title: record.name || "Untitled offer",
    formula: metricFormula(record, key),
    values,
    notes: leaveNotes(result, key),
    origins: leaveOrigins,
    units: Object.fromEntries([
      ...Object.values(leaveDefinitions).map(({ name, unit }) => [name, unit]),
      ["annual_leave_loading_percent", "percent"],
    ]),
    result: { name: selected.name, value: result[key].amount, unit: selected.unit },
    sections: leaveSections(record, baseEquation),
  };
}

export type { LeaveMetric };
export { annualLeaveEquation, leaveDefinitions };

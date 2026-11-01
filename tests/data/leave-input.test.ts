import { expect, it } from "bun:test";
import { calculateComparison } from "../../src/lib/calculations/comparison.ts";
import type { Fields } from "../../src/lib/data/model.d.ts";
import { leaveInput } from "../../src/lib/leave-input.ts";
import { offer, profile } from "../calculations/package-fixture.ts";

function result(fields: Fields) {
  return calculateComparison({
    offer: offer({
      annualLeave: "4",
      leaveOrdinaryHours: "38",
      leaveRateBasis: "salary",
      leaveLoadingBasis: "none",
      ...fields,
    }),
    profile,
    vehicle: {},
    year: "2026-27",
    target: false,
    oneOff: false,
    timeValue: true,
  });
}

it.each([
  ["Annual leave entitlement (weeks)", { annualLeave: "" }, "annualLeave"],
  ["Annual leave entitlement (hours)", { leaveOrdinaryHours: "" }, "leaveOrdinaryHours"],
  ["Annual leave entitlement (hours)", { annualLeave: "3" }, "annualLeave"],
  [
    "Ordinary leave base cash per hour",
    { leaveRateBasis: "entered", leaveHourlyRate: "" },
    "leaveHourlyRate",
  ],
  ["Ordinary leave base cash per hour", { leaveRateBasis: "" }, "leaveRateBasis"],
  ["Ordinary leave base cash per hour", { inclusion: "" }, "inclusion"],
  ["Additional leave loading per hour", { leaveLoadingBasis: "" }, "leaveLoadingBasis"],
  [
    "Additional leave loading per hour",
    { leaveLoadingBasis: "percent", leaveLoadingPercent: "" },
    "leaveLoadingPercent",
  ],
  [
    "Additional leave loading per hour",
    { leaveLoadingBasis: "hourly", leaveLoadingHourly: "" },
    "leaveLoadingHourly",
  ],
  ["Recorded unused balance (hours)", { leaveBalanceDate: "" }, "leaveBalanceDate"],
  [
    "Recorded unused balance (hours)",
    { leaveBalanceDate: "2026-10-28", leaveBalanceHours: "" },
    "leaveBalanceHours",
  ],
  ["Annual leave entitlement (weeks)", { leaveEligible: "" }, "leaveEligible"],
  ["Annual leave entitlement (weeks)", { employment: "" }, "employment"],
] satisfies [string, Fields, string][])(
  "links %s to the blocking input",
  (label, fields, target) => {
    expect(leaveInput(result(fields), label)?.target).toBe(target);
  },
);

it("does not turn known zero, unavailable arrangements or unrelated metrics into missing inputs", () => {
  expect(leaveInput(result({}), "Additional leave loading per hour")).toBeUndefined();
  expect(
    leaveInput(result({ employment: "casual" }), "Annual leave entitlement (weeks)"),
  ).toBeUndefined();
  expect(leaveInput(result({}), "Cash after tax and personal super")).toBeUndefined();
});

import { expect, it } from "bun:test";
import {
  type ComparisonInput,
  calculateComparison,
} from "../../src/lib/calculations/comparison.ts";
import type { Fields } from "../../src/lib/data/model.d.ts";
import { annualLeaveEquation, type LeaveMetric } from "../../src/lib/explanations/annual-leave.ts";
import { comparisonEquation } from "../../src/lib/explanations/comparison.ts";
import {
  equationGraph,
  resolveVariable,
  unresolvedVariables,
} from "../../src/lib/explanations/navigation.ts";
import { bonus, offer, profile } from "../calculations/package-fixture.ts";

const annualBaseCash = 93_750;
const baseQuote = 105_000;
const enteredRate = 40;
const nominalCash = 7211.538_461_538_462;
const keys: readonly LeaveMetric[] = [
  "entitlementWeeks",
  "ordinaryHours",
  "entitlementHours",
  "ordinaryRate",
  "loadingRate",
  "entitlementBase",
  "entitlementLoading",
  "entitlementGross",
  "balanceHours",
  "balanceBase",
  "balanceLoading",
  "balanceGross",
  "netPayout",
];

function context(fields: Fields = {}): ComparisonInput {
  const record = offer({
    amount: "105000",
    annualLeave: "4",
    leaveOrdinaryHours: "38",
    leaveRateBasis: "salary",
    leaveLoadingBasis: "none",
    ...fields,
  });
  Object.assign(record.items, { earnings: [bonus({ amount: "10000" })] });
  return {
    offer: record,
    profile,
    vehicle: {},
    year: "2026-27",
    target: false,
    oneOff: false,
    timeValue: true,
  };
}

it("links leave salary value recursively through the isolated base cash to the entered quote", () => {
  const input = context();
  input.offer.name = "Base salary example";
  const result = calculateComparison(input);
  const base = comparisonEquation("Annual base cash before deductions", input, result);
  const equation = annualLeaveEquation(input.offer, annualBaseCash, "entitlementBase", base);
  const graph = equationGraph(equation);
  expect(equation.title).toBe("Base salary example");
  expect(equation.result?.value).toBeCloseTo(nominalCash);
  expect(resolveVariable(graph, "", "annual_base_cash")?.value).toBeCloseTo(annualBaseCash);
  expect(resolveVariable(graph, "", "annual_base_cash")?.blocks.length).toBeGreaterThan(0);
  expect(resolveVariable(graph, "", "annual_base_pay_quote")?.value).toBe(baseQuote);
  expect(resolveVariable(graph, "", "paid_hours_per_leave_week")?.origin).toContain(
    "separate from comparison",
  );
  expect(unresolvedVariables(graph)).toEqual([]);
});

it("provides provenance for every annual-leave metric across salary, entered and unknown bases", () => {
  const variants: readonly Fields[] = [
    {},
    {
      leaveRateBasis: "entered",
      leaveHourlyRate: "40",
      leaveLoadingBasis: "hourly",
      leaveLoadingHourly: "2.5",
      leaveBalanceHours: "10",
      leaveBalanceDate: "2026-10-25",
    },
    { leaveRateBasis: "", leaveLoadingBasis: "" },
    { leaveOrdinaryHours: "40", leaveLoadingBasis: "percent", leaveLoadingPercent: "17.5" },
    { leaveLoadingBasis: "percent", leaveLoadingPercent: "" },
  ];
  for (const fields of variants) {
    const input = context(fields);
    for (const key of keys) {
      const equation = annualLeaveEquation(input.offer, annualBaseCash, key);
      expect(equation.result).toBeDefined();
      expect(unresolvedVariables(equationGraph(equation))).toEqual([]);
    }
  }
});

it("explains percentage loading through the entered percentage and base leave rate", () => {
  const input = context({
    leaveOrdinaryHours: "40",
    leaveRateBasis: "entered",
    leaveHourlyRate: "50",
    leaveLoadingBasis: "percent",
    leaveLoadingPercent: "17.5",
  });
  const expected = { hourly: 8.75, percent: 17.5 };
  const equation = annualLeaveEquation(input.offer, null, "loadingRate");
  const graph = equationGraph(equation);
  expect(equation.result?.value).toBe(expected.hourly);
  expect(resolveVariable(graph, "", "annual_leave_loading_percent")?.value).toBe(expected.percent);
  expect(resolveVariable(graph, "", "annual_leave_loading_percent")?.unit).toBe("percent");
  expect(equation.formula).toContain("annual_leave_loading_percent / 100");
  expect(unresolvedVariables(graph)).toEqual([]);
});

it("identifies the current balance date, independent hourly inputs and unavailable event payout", () => {
  const input = context({
    leaveRateBasis: "entered",
    leaveHourlyRate: "40",
    leaveLoadingBasis: "hourly",
    leaveLoadingHourly: "2.5",
    leaveBalanceHours: "10",
    leaveBalanceDate: "2026-10-25",
  });
  const equation = annualLeaveEquation(input.offer, null, "balanceGross");
  const graph = equationGraph(equation);
  expect(resolveVariable(graph, "", "ordinary_base_cash_per_hour")?.value).toBe(enteredRate);
  expect(resolveVariable(graph, "", "ordinary_base_cash_per_hour")?.blocks).toEqual([]);
  expect(resolveVariable(graph, "", "ordinary_base_cash_per_hour")?.origin).toContain(
    "selected leave-pay basis",
  );
  expect(equation.notes.join(" ")).toContain("2026-10-25");
  const payout = annualLeaveEquation(input.offer, annualBaseCash, "netPayout");
  expect(payout.result?.value).toBeNull();
  expect(payout.notes.join(" ")).toContain("event-specific");
});

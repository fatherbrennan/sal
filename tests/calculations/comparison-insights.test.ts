import { expect, it } from "bun:test";
import {
  type ComparisonResult,
  calculateComparison,
} from "../../src/lib/calculations/comparison.ts";
import {
  comparisonInsights,
  extraHourLabel,
  extraPackageHourLabel,
  freedHourLabel,
  metricAmount,
  timeTradeoff,
} from "../../src/lib/calculations/comparison-insights.ts";
import { difference, percentage } from "../../src/lib/calculations/inputs.ts";
import { bonus, offer, profile } from "./package-fixture.ts";

function result(target = false, oneOff = false) {
  const record = offer();
  record.items = { earnings: [bonus({ certainty: "target", recurrence: "once" })] };
  return calculateComparison({
    offer: record,
    profile,
    vehicle: {},
    year: "2026-27",
    target,
    oneOff,
    timeValue: true,
  });
}
function withCashAndHours(cash: number | null, hours: number | null): ComparisonResult {
  return {
    ...result(),
    metrics: [
      {
        label: "Cash after tax and job costs",
        amount: cash,
        unit: "money",
        lowerIsBetter: false,
      },
      { label: "Calendar work + travel hours", amount: hours, unit: "number", lowerIsBetter: true },
    ],
  };
}
it("values additional cash only when the alternative commits more known hours", () => {
  const example = {
    baselineCash: 60_000,
    baselineHours: 1600,
    cash: 62_500,
    hours: 1700,
    rate: 25,
  };
  const baseline = withCashAndHours(example.baselineCash, example.baselineHours);
  const current = withCashAndHours(example.cash, example.hours);
  const amount = (value: ComparisonResult, base: ComparisonResult | undefined) =>
    comparisonInsights(value, base, undefined, undefined).find(
      ({ label }) => label === extraHourLabel,
    )?.amount;
  expect(amount(current, baseline)).toBe(example.rate);
  expect(amount(baseline, current)).toBeNull();
  expect(amount(baseline, baseline)).toBeNull();
  expect(amount(current, undefined)).toBeNull();
  expect(amount(withCashAndHours(null, example.hours), baseline)).toBeNull();
  expect(amount(withCashAndHours(example.cash, null), baseline)).toBeNull();
  expect(
    amount(
      withCashAndHours(example.baselineCash, example.hours),
      withCashAndHours(example.cash, example.baselineHours),
    ),
  ).toBe(-example.rate);
  expect(metricAmount(result(), "Missing metric")).toBeNull();
});
it("shows contingent gross and net target upside with matching one-off scenarios", () => {
  const guaranteed = result(false, true);
  const target = result(true, true);
  const amounts = Object.fromEntries(
    comparisonInsights(target, undefined, guaranteed, target).map(({ label, amount }) => [
      label,
      amount,
    ]),
  );
  const expected = {
    grossCash: 10_000,
    grossSuper: 1200,
    grossPackage: 11_200,
    netCash: 6800,
    netSuper: 1020,
    netPackage: 7820,
    share: 8.068_343_62,
  };
  expect(amounts["Target upside: cash before tax"]).toBeCloseTo(expected.grossCash);
  expect(amounts["Target upside: super before tax"]).toBeCloseTo(expected.grossSuper);
  expect(amounts["Target upside: package value before tax and costs"]).toBeCloseTo(
    expected.grossPackage,
  );
  expect(amounts["Target upside: cash after tax"]).toBeCloseTo(expected.netCash);
  expect(amounts["Target upside: super after ordinary tax"]).toBeCloseTo(expected.netSuper);
  expect(amounts["Target upside: package value after tax"]).toBeCloseTo(expected.netPackage);
  expect(amounts["Contingent share of target cash after tax"]).toBeCloseTo(expected.share);
  expect(
    comparisonInsights(result(), undefined, result(), result(true))
      .filter(({ label }) => label.startsWith("Target upside:"))
      .every(({ amount }) => amount === 0),
  ).toBe(true);
  expect(
    comparisonInsights(target, undefined, undefined, target).every(({ amount }) => amount === null),
  ).toBe(true);
});

it("explains both directions of the cash/time trade-off without claiming an overall winner", () => {
  const baseline = { cash: 60_000, hours: 2000 };
  const { moreCash, lessCash, moreHours, lessHours, rate } = {
    moreCash: 66_000,
    lessCash: 54_000,
    moreHours: 2200,
    lessHours: 1800,
    rate: 30,
  };
  const base = withCashAndHours(baseline.cash, baseline.hours);
  const amount = (cash: number | null, hours: number | null, label: string) =>
    comparisonInsights(withCashAndHours(cash, hours), base, undefined, undefined).find(
      (metric) => metric.label === label,
    )?.amount;
  for (const [cash, hours, label, expected] of [
    [moreCash, moreHours, extraHourLabel, rate],
    [lessCash, lessHours, freedHourLabel, rate],
    [moreCash, lessHours, freedHourLabel, null],
    [lessCash, moreHours, freedHourLabel, null],
    [baseline.cash, lessHours, freedHourLabel, null],
    [null, lessHours, freedHourLabel, null],
    [lessCash, null, freedHourLabel, null],
    [moreCash, baseline.hours, extraHourLabel, null],
    [moreCash, moreHours, extraPackageHourLabel, null],
  ] as const) {
    expect(amount(cash, hours, label)).toBe(expected);
  }
  for (const [cash, hours, text] of [
    [moreCash, lessHours, "More cash · fewer work + commute hours"],
    [lessCash, moreHours, "Less cash · more work + commute hours"],
    [moreCash, moreHours, "More cash · more work + commute hours"],
    [lessCash, lessHours, "Less cash · fewer work + commute hours"],
    [baseline.cash, baseline.hours, "Same cash · same work + commute hours"],
    [moreCash, baseline.hours, "More cash · same work + commute hours"],
    [null, baseline.hours, "Cash/time comparison unavailable"],
    [baseline.cash, null, "Cash/time comparison unavailable"],
  ] as const) {
    expect(timeTradeoff(withCashAndHours(cash, hours), base)).toBe(text);
  }
  expect(timeTradeoff(base, undefined)).toBe("Select a baseline to compare cash and time");
});

it("keeps the extra package-per-hour trade-off separate from extra cash", () => {
  const packageResult = (cash: number, hours: number, retained: number): ComparisonResult => ({
    ...withCashAndHours(cash, hours),
    metrics: [
      ...withCashAndHours(cash, hours).metrics,
      {
        label: "Package value after tax and job costs",
        amount: retained,
        unit: "money",
        lowerIsBetter: false,
      },
    ],
  });
  const example = {
    cash: 66_000,
    hours: 2200,
    retained: 80_000,
    baselineCash: 60_000,
    baselineHours: 2000,
    baselinePackage: 70_000,
    rate: 50,
  };
  expect(
    comparisonInsights(
      packageResult(example.cash, example.hours, example.retained),
      packageResult(example.baselineCash, example.baselineHours, example.baselinePackage),
      undefined,
      undefined,
    ).find(({ label }) => label === extraPackageHourLabel)?.amount,
  ).toBe(example.rate);
});
it("keeps relative percentages distinct from absolute changes and unavailable baselines", () => {
  const sample = { offer: 120, baseline: 100, percentage: 20, decrease: -16.666_666_67 };
  expect(percentage(difference(sample.offer, sample.baseline), sample.baseline)).toBe(
    sample.percentage,
  );
  expect(percentage(difference(sample.baseline, sample.offer), sample.offer)).toBeCloseTo(
    sample.decrease,
  );
  expect(percentage(0, sample.baseline)).toBe(0);
  for (const base of [0, -sample.baseline, null]) {
    expect(percentage(sample.percentage, base)).toBeNull();
  }
  expect(percentage(null, sample.baseline)).toBeNull();
});

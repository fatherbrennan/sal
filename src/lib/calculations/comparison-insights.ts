import type { ComparisonResult, Metric } from "./comparison.ts";
import { difference, percentage, quotient } from "./inputs.ts";

const extraHourLabel = "Additional cash after tax and costs per extra work + travel hour";
const extraPackageHourLabel =
  "Additional package value after tax and costs per extra work + travel hour";
const freedHourLabel = "Cash surrendered per work + travel hour freed";
const packageMetric = "Package value after tax and job costs";
const contingentShareLabel = "Contingent share of target cash after tax";
const targetCashMetric = "Cash after tax and personal super";
const cashMetric = "Cash after tax and job costs";
const hoursMetric = "Calendar work + travel hours";
const targetUpsideMetrics = [
  { label: "Target upside: cash before tax", source: "Cash pay / revenue before deductions" },
  { label: "Target upside: super before tax", source: "Gross contributions to super" },
  {
    label: "Target upside: package value before tax and costs",
    source: "Package value before tax and costs",
  },
  {
    label: "Target upside: cash after tax",
    source: "Cash after tax and personal super",
  },
  {
    label: "Target upside: super after ordinary tax",
    source: "Super contributions after ordinary fund tax",
  },
  { label: "Target upside: package value after tax", source: "Package value after tax" },
];

function metricAmount(result: ComparisonResult | undefined, label: string): number | null {
  return result?.metrics.find((metric) => metric.label === label)?.amount ?? null;
}

function comparisonInsights(
  result: ComparisonResult,
  baseline: ComparisonResult | undefined,
  guaranteed: ComparisonResult | undefined,
  target: ComparisonResult | undefined,
): Metric[] {
  const cash = difference(metricAmount(result, cashMetric), metricAmount(baseline, cashMetric));
  const hours = difference(metricAmount(result, hoursMetric), metricAmount(baseline, hoursMetric));
  let surrendered: number | null = null;
  if (cash !== null && hours !== null && cash < 0 && hours < 0) {
    surrendered = quotient(-cash, -hours);
  }
  return [
    {
      label: extraHourLabel,
      amount: quotient(cash, hours),
      unit: "money",
      lowerIsBetter: false,
    },
    {
      label: extraPackageHourLabel,
      amount: quotient(
        difference(metricAmount(result, packageMetric), metricAmount(baseline, packageMetric)),
        hours,
      ),
      unit: "money",
      lowerIsBetter: false,
    },
    { label: freedHourLabel, amount: surrendered, unit: "money", lowerIsBetter: true },
    {
      label: contingentShareLabel,
      amount: percentage(
        difference(
          metricAmount(target, targetCashMetric),
          metricAmount(guaranteed, targetCashMetric),
        ),
        metricAmount(target, targetCashMetric),
      ),
      unit: "percent",
      lowerIsBetter: null,
    },
    ...targetUpsideMetrics.map(
      ({ label, source }): Metric => ({
        label,
        amount: difference(metricAmount(target, source), metricAmount(guaranteed, source)),
        unit: "money",
        lowerIsBetter: false,
      }),
    ),
  ];
}

function timeTradeoff(result: ComparisonResult, baseline: ComparisonResult | undefined): string {
  if (baseline === undefined) {
    return "Select a baseline to compare cash and time";
  }
  const cash = difference(metricAmount(result, cashMetric), metricAmount(baseline, cashMetric));
  const hours = difference(metricAmount(result, hoursMetric), metricAmount(baseline, hoursMetric));
  if (cash === null || hours === null) {
    return "Cash/time comparison unavailable";
  }
  let cashDirection = "Same";
  let hoursDirection = "same";
  if (cash > 0) {
    cashDirection = "More";
  } else if (cash < 0) {
    cashDirection = "Less";
  }
  if (hours > 0) {
    hoursDirection = "more";
  } else if (hours < 0) {
    hoursDirection = "fewer";
  }
  return `${cashDirection} cash · ${hoursDirection} work + commute hours`;
}

export {
  cashMetric,
  comparisonInsights,
  contingentShareLabel,
  extraHourLabel,
  extraPackageHourLabel,
  freedHourLabel,
  hoursMetric,
  metricAmount,
  packageMetric,
  targetCashMetric,
  targetUpsideMetrics,
  timeTradeoff,
};

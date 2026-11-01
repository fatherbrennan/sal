import { difference, percentage } from "../calculations/inputs.ts";
import { type Equation, explanation } from "./model.ts";

function differenceEquation(
  label: string,
  offerValue: number | null,
  baselineValue: number | null,
  sources: readonly Equation[] = [],
): Equation {
  const equation = explanation(
    label,
    "difference_from_baseline = offer_value - baseline_value",
    { offerValue, baselineValue },
    [
      "The baseline changes only this difference. Each offer's own inputs and hourly rates remain in its calculation.",
    ],
  );
  const unit = sources[0]?.result?.unit ?? "number";
  let differenceUnit = unit;
  if (unit === "percent") {
    differenceUnit = "percentage points";
  }
  return {
    ...equation,
    result: {
      name: "difference_from_baseline",
      value: difference(offerValue, baselineValue),
      unit: differenceUnit,
    },
    units: Object.fromEntries([
      ["offer_value", unit],
      ["baseline_value", unit],
    ]),
    origins: Object.fromEntries([
      ["offer_value", "The selected metric for the compared offer."],
      ["baseline_value", "The same metric for the explicitly selected baseline offer."],
    ]),
    references: Object.fromEntries(
      sources.flatMap((source, index) => {
        if (source.result === undefined) {
          return [];
        }
        let name = "offer_value";
        if (index > 0) {
          name = "baseline_value";
        }
        return [[name, { scope: `offer_${index}`, name: source.result.name }]];
      }),
    ),
    sections: sources.map((source, index) => ({ ...source, scope: `offer_${index}` })),
  };
}

function percentageDifferenceValue(
  delta: number | null,
  baseline: number | null,
): number | "Undefined" | null {
  if (delta !== null && baseline === 0) {
    return "Undefined";
  }
  return percentage(delta, baseline);
}

function percentageDifferenceEquation(
  label: string,
  offerValue: number | null,
  baselineValue: number | null,
  sources: readonly Equation[],
): Equation {
  const equation = differenceEquation(label, offerValue, baselineValue, sources);
  return {
    ...equation,
    formula: "percentage_change = (offer_value - baseline_value) / baseline_value * 100",
    notes: [
      ...equation.notes,
      "Percentage change is undefined for a zero baseline. Negative baselines are not supported; missing values remain unavailable.",
    ],
    result: {
      name: "percentage_change",
      value: percentageDifferenceValue(difference(offerValue, baselineValue), baselineValue),
      unit: "percent",
    },
  };
}

export { differenceEquation, percentageDifferenceEquation, percentageDifferenceValue };

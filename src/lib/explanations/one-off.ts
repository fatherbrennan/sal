import type { ComparisonInput, ComparisonResult } from "../calculations/comparison.ts";
import { difference } from "../calculations/inputs.ts";
import { comparisonEquation } from "./comparison.ts";
import { type Equation, explanation } from "./model.ts";

function oneOffEquation(
  recurring: ComparisonResult,
  combined: ComparisonResult,
  input: ComparisonInput,
): Equation {
  const label = "Cash after tax and job costs";
  const recurringValue = recurring.metrics.find((metric) => metric.label === label)?.amount ?? null;
  const combinedValue = combined.metrics.find((metric) => metric.label === label)?.amount ?? null;
  const change = difference(combinedValue, recurringValue);
  const results = [
    comparisonEquation(label, { ...input, oneOff: false }, recurring),
    comparisonEquation(label, { ...input, oneOff: true }, combined),
  ];
  return {
    ...explanation(
      "Combined effect of the selected one-off items",
      "one_off_cash_change = annual_cash_after_job_costs_with_one_offs - recurring_annual_cash_after_job_costs",
      Object.fromEntries([
        ["recurring_annual_cash_after_job_costs", recurringValue],
        ["annual_cash_after_job_costs_with_one_offs", combinedValue],
      ]),
      [
        "Recalculate the complete annual tax scenario with and without the one-off items. Do not add separate item tax estimates or repeat one-off costs annually.",
      ],
    ),
    context: `${input.offer.name || "Untitled offer"} · ${input.year} · Combined one-off effect`,
    result: { name: "one_off_cash_change", value: change, unit: "money" },
    units: Object.fromEntries([
      ["recurring_annual_cash_after_job_costs", "money"],
      ["annual_cash_after_job_costs_with_one_offs", "money"],
    ]),
    warnings: results.flatMap((result) => result.warnings ?? []),
    references: Object.fromEntries([
      [
        "recurring_annual_cash_after_job_costs",
        {
          scope: "recurring",
          name: "annual_cash_after_job_costs",
        },
      ],
      [
        "annual_cash_after_job_costs_with_one_offs",
        {
          scope: "with_one_offs",
          name: "annual_cash_after_job_costs",
        },
      ],
    ]),
    sections: results.map((result, index) => {
      let scope = "recurring";
      if (index > 0) {
        scope = "with_one_offs";
      }
      return { ...result, scope, title: result.context ?? result.title };
    }),
  };
}

export { oneOffEquation };

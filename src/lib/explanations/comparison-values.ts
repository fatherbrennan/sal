import type { ComparisonInput, ComparisonResult } from "../calculations/comparison.ts";
import { attributedTaxComponents } from "../calculations/comparison-metrics.ts";
import { tripValue } from "../calculations/costs.ts";
import { total, value } from "../calculations/inputs.ts";
import { isLeaveMetric } from "../calculations/leave-metrics.ts";
import { numeric } from "../data/numeric.ts";
import { metricEquations } from "./metric-definitions.ts";
import type { EquationValue } from "./model.ts";
import { baseQuoteName } from "./pay-sections.ts";
import { taxValue } from "./tax.ts";
import { annualNames } from "./tax-context.ts";

const fieldNames = {
  weeklyHours: "standard_paid_hours_per_week",
  weeks: "standard_weeks_per_year",
  superRate: "employer_super_percent",
  sacrifice: "annual_salary_sacrifice",
  personalSuper: "annual_personal_super_contribution",
  businessCosts: "annual_business_cash_costs",
  outDistance: "outward_distance_km",
  backDistance: "homeward_distance_km",
  outMinutes: "outward_minutes",
  backMinutes: "homeward_minutes",
  maintenance: "maintenance_per_km",
  tripCharges: "charges_per_return_trip",
  cycleDays: "days_in_cycle",
};

function metricValues(result: ComparisonResult): Record<string, EquationValue> {
  return Object.fromEntries(
    result.metrics
      .filter(({ label }) => !(isLeaveMetric(label) || label.startsWith("formula:")))
      .map((metric) => {
        const definition = metricEquations[metric.label];
        if (definition === undefined) {
          throw new Error(`Missing equation: ${metric.label}`);
        }
        return [definition[0], metric.amount];
      }),
  );
}

function currentValues(
  input: ComparisonInput,
  result: ComparisonResult,
): Record<string, EquationValue> {
  const fields = result.payer;
  const values: Record<string, EquationValue> = Object.fromEntries(
    Object.entries(fieldNames).map(([key, name]) => [name, numeric(fields, key)]),
  );
  Object.assign(
    values,
    Object.fromEntries([
      ["return_distance_km", tripValue(fields, "distance", "outDistance", "backDistance")],
      ["return_minutes", tripValue(fields, "minutes", "outMinutes", "backMinutes")],
    ]),
  );
  values[baseQuoteName(fields)] = numeric(fields, "amount");
  Object.assign(values, metricValues(result));
  if (value(fields, "employment") === "sole-trader") {
    Object.assign(
      values,
      Object.fromEntries([
        ["annual_salary_sacrifice", 0],
        ["annual_personal_super_contribution", numeric(fields, "contractorPersonalSuper")],
      ]),
    );
  }
  for (const [key, name] of [
    ["energyPrice", "price_per_energy_unit"],
    ["consumption", "consumption_per_100_km"],
  ]) {
    if (key !== undefined && name !== undefined) {
      let source = fields;
      if (
        !Object.hasOwn(fields, key) &&
        value(fields, "energy") === value(input.vehicle, "energy")
      ) {
        source = input.vehicle;
      }
      values[name] = numeric(source, key);
    }
  }
  const { annual_commuting_cost, annual_other_job_costs } = values;
  const costs = total(
    [annual_commuting_cost ?? null, annual_other_job_costs ?? null].map((amount) => {
      if (typeof amount === "number") {
        return amount;
      }
      return null;
    }),
  );
  Object.assign(values, Object.fromEntries([["annual_job_costs", costs]]));
  for (const { key } of attributedTaxComponents) {
    const name = annualNames[key];
    values[`${name}_with_offer`] = taxValue(result.tax.withOffer.annual[key]);
    values[`${name}_without_offer`] = taxValue(result.tax.withoutOffer.annual[key]);
  }
  return values;
}

export { currentValues };

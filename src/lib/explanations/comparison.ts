import type { ComparisonInput, ComparisonResult } from "../calculations/comparison.ts";
import { attributedTaxComponents } from "../calculations/comparison-metrics.ts";
import { value } from "../calculations/inputs.ts";
import {
  leaveCashOutLabel,
  leaveMetricKey,
  leaveValuationKey,
} from "../calculations/leave-metrics.ts";
import { annualLeaveEquation } from "./annual-leave.ts";
import { basePayFormulas } from "./base-pay.ts";
import { scenarioContext } from "./comparison-context.ts";
import { referenceEquation } from "./comparison-reference.ts";
import { currentValues } from "./comparison-values.ts";
import { comparisonSections, hasNoJourneys, travelFormula } from "./explanation-sections.ts";
import { itemSections } from "./item-sections.ts";
import { leaveCashOutEquation } from "./leave-cash-out.ts";
import { leaveValuationEquation } from "./leave-valuation.ts";
import { metricEquations } from "./metric-definitions.ts";
import { type Equation, explanation } from "./model.ts";
import { payPrimaryFormula } from "./pay-sections.ts";
import { taxNotes, taxValue } from "./tax.ts";
import { annualNames } from "./tax-context.ts";

function scenarioNotes(input: ComparisonInput): string[] {
  return [
    `Financial year ${input.year}; base-only pay: ${input.baseOnly === true}; target flag: ${input.target}; one-off flag: ${input.oneOff}; travel-time valuation: ${input.timeValue}. Base-only pay excludes all bonus and commission rows.`,
    `Quote unit: ${value(input.offer.fields, "unit") || "unknown"}; salary super inclusion: ${value(input.offer.fields, "inclusion") || "unknown"}; employment: ${value(input.offer.fields, "employment") || "unknown"}.`,
  ];
}

function selectedFormula(input: ComparisonInput, name: string, formula: string): string {
  if (
    name === "annual_contractor_operating_surplus" &&
    value(input.offer.fields, "employment") !== "sole-trader"
  ) {
    return "unavailable";
  }
  if (
    name === "annual_total_job_costs" &&
    value(input.offer.fields, "employment") === "sole-trader"
  ) {
    return "annual_job_costs + annual_business_cash_costs";
  }
  if (
    name.includes("gross_package_after_") &&
    value(input.offer.fields, "employment") === "sole-trader"
  ) {
    return formula.replace(
      "annual_gross_package_value",
      "(annual_gross_package_value - annual_business_cash_costs)",
    );
  }
  if (
    name === "annual_commuting_cost" &&
    !["entered", "ato"].includes(value(input.offer.fields, "costMethod"))
  ) {
    return "unknown";
  }
  if (name === "annual_commuting_cost" && value(input.offer.fields, "costMethod") === "ato") {
    return "annual_commute_kilometres * kilometre_rate + annual_commute_trip_charges";
  }
  return formula;
}

function primaryEquation(
  input: ComparisonInput,
  result: ComparisonResult,
  name: string,
  formula: string,
): string {
  if (formula === "") {
    const amount = result.metrics.find(
      (metric) => metricEquations[metric.label]?.[0] === name,
    )?.amount;
    return `${name} = ${amount ?? "unknown"}`;
  }
  if (["annual_gross_travel_time_value", "annual_after_tax_travel_time_value"].includes(name)) {
    return `${name} = ${travelFormula(input, result, name)}`;
  }
  if (
    hasNoJourneys(result) &&
    ["annual_commuting_cost", "annual_commute_kilometres", "annual_commute_hours"].includes(name)
  ) {
    return `${name} = 0 when annual_return_journeys = 0`;
  }
  if (["annual_cash_pay", "annual_employer_super"].includes(name)) {
    return payPrimaryFormula(result, name);
  }
  const baseFormula = basePayFormulas(result, input.year)[name];
  if (baseFormula !== undefined) {
    return `${name} = ${baseFormula}`;
  }
  return `${name} = ${selectedFormula(input, name, formula)}`;
}

function standardEquation(
  label: string,
  input: ComparisonInput,
  result: ComparisonResult,
): Equation {
  const definition = metricEquations[label];
  if (definition === undefined) {
    throw new Error(`Missing equation: ${label}`);
  }
  const [name, formula, context] = definition;
  const primary = primaryEquation(input, result, name, formula);
  const sections = comparisonSections(input, result, name, context);
  const amount = result.metrics.find((entry) => entry.label === label);
  const equation = explanation(
    input.offer.name || "Untitled offer",
    `${primary}\n\n${sections.map((section) => section.formula).join("\n\n")}`,
    Object.fromEntries([
      ...Object.entries(currentValues(input, result)),
      [
        "annual_component_subtotal_with_offer",
        taxValue(result.tax.withOffer.annual.rawComponentSubtotal),
      ],
      [
        "annual_component_subtotal_without_offer",
        taxValue(result.tax.withoutOffer.annual.rawComponentSubtotal),
      ],
    ]),
    [...scenarioNotes(input), ...result.notes, ...taxNotes(result.tax.incrementalTax)],
  );
  const warnings: string[] = [];
  warnings.push(...componentWarnings(result, label));
  if (amount?.amount === null) {
    warnings.push(
      "Unavailable: a required input or supported rule is missing. See inputs and sources for the calculation's conditions.",
    );
    warnings.push(...result.notes);
    if (context.includes("annual") && result.tax.incrementalTax.status === "unavailable") {
      warnings.push(...taxNotes(result.tax.incrementalTax));
    }
  }
  return {
    ...equation,
    employment: value(result.payer, "employment"),
    formula: primary,
    context: scenarioContext(input, name),
    warnings: [...new Set(warnings)],
    sections: [...sections, ...comparisonItems(input, result, context.includes("recurring"))],
    references: annualReferences(context.includes("annual")),
    origins: vehicleOrigins(input),
    result: { name, value: amount?.amount ?? null, unit: amount?.unit ?? "number" },
    units: Object.fromEntries([
      ...result.metrics.map((metric) => [
        metricEquations[metric.label]?.[0] ?? metric.label,
        metric.unit,
      ]),
      ["annual_job_costs", "money"],
    ]),
  };
}

function comparisonItems(input: ComparisonInput, result: ComparisonResult, recurring: boolean) {
  if (recurring) {
    const journeys = result.metrics.find((metric) => metric.label === "Return commute journeys");
    return itemSections(input, journeys?.amount ?? null);
  }
  return [];
}

function annualReferences(enabled: boolean): NonNullable<Equation["references"]> {
  if (!enabled) {
    return {};
  }
  return Object.fromEntries([
    ...attributedTaxComponents.flatMap(({ key }) => {
      const name = annualNames[key] ?? key;
      return [
        [`${name}_with_offer`, { scope: "with_offer", name }],
        [`${name}_without_offer`, { scope: "without_offer", name }],
      ];
    }),
    [
      "annual_component_subtotal_with_offer",
      { scope: "with_offer", name: "annual_component_subtotal" },
    ],
    [
      "annual_component_subtotal_without_offer",
      { scope: "without_offer", name: "annual_component_subtotal" },
    ],
  ]);
}

function vehicleOrigins(input: ComparisonInput): NonNullable<Equation["origins"]> {
  return Object.fromEntries(
    [
      ["energyPrice", "price_per_energy_unit", "energy price"],
      ["consumption", "consumption_per_100_km", "consumption"],
    ].map(([field, name, label]) => {
      let origin = `Vehicle settings → shared ${label}, inherited only for a matching energy basis.`;
      if (field !== undefined && Object.hasOwn(input.offer.fields, field)) {
        origin = `Offer → Commuting costs → ${label} override.`;
      }
      return [name, origin];
    }),
  );
}

function componentWarnings(result: ComparisonResult, label: string): string[] {
  const component = attributedTaxComponents.find((entry) => entry.label === label);
  if (component === undefined) {
    return [];
  }
  return [result.tax.withOffer, result.tax.withoutOffer].flatMap(({ annual }) => {
    const componentAmount = annual[component.key];
    if (componentAmount.status === "unavailable") {
      return taxNotes(componentAmount);
    }
    return [];
  });
}

function comparisonEquation(
  label: string,
  input: ComparisonInput,
  result: ComparisonResult,
): Equation {
  if (label === "Package value including hypothetical leave cash-out") {
    return referenceEquation(leavePackageEquation(label, input, result), result, label);
  }
  const leaveKey = leaveMetricKey(label);
  const valuationKey = leaveValuationKey(label);
  if (leaveKey !== undefined || valuationKey !== undefined) {
    const leave = referenceEquation(
      annualLeaveEquation(
        result.offer,
        result.baseCash,
        leaveKey ?? "entitlementGross",
        comparisonEquation("Annual base cash before deductions", input, result),
      ),
      result,
      "Annual entitlement: gross illustrative value",
    );
    if (label === leaveCashOutLabel) {
      return referenceEquation(leaveCashOutEquation(result, leave), result, label);
    }
    if (valuationKey !== undefined) {
      return referenceEquation(
        leaveValuationEquation(
          valuationKey,
          result,
          leave,
          comparisonEquation("Base employer super", input, result),
        ),
        result,
        label,
      );
    }
    return referenceEquation(leave, result, label);
  }
  return referenceEquation(standardEquation(label, input, result), result, label);
}

function leavePackageEquation(
  label: string,
  input: ComparisonInput,
  result: ComparisonResult,
): Equation {
  const equation = standardEquation(label, input, result);
  const realWorld = comparisonEquation(
    "Package value after tax, commuting costs and time",
    input,
    result,
  );
  const cashOut = comparisonEquation("Hypothetical leave cash-out: net total", input, result);
  return {
    ...equation,
    context:
      "Package value after tax, commute costs and commute time value plus the hypothetical leave cash-out in the selected financial year.",
    values: Object.fromEntries([
      ...Object.entries(equation.values),
      ["leave_cash_out_net_total", result.leaveValuation.payoutTotal.amount],
    ]),
    warnings: [...(realWorld.warnings ?? []), ...(cashOut.warnings ?? [])],
    notes: [
      ...equation.notes,
      "Retains the original commute costs, hours and commute time valuation. Earned leave value is already within ordinary remuneration and is not added again. The additional cash-out assumes permission; it is not guaranteed annual income.",
    ],
    references: Object.fromEntries([
      [
        "annual_net_package_after_commuting_costs_and_time",
        { scope: "real_world", name: "annual_net_package_after_commuting_costs_and_time" },
      ],
      ["leave_cash_out_net_total", { scope: "leave_cash_out", name: "leave_cash_out_net_total" }],
    ]),
    sections: [
      { ...realWorld, scope: "real_world" },
      { ...cashOut, scope: "leave_cash_out" },
    ],
    units: Object.fromEntries([
      ...Object.entries(equation.units ?? {}),
      ["leave_cash_out_net_total", "money"],
    ]),
  };
}

export { comparisonEquation };

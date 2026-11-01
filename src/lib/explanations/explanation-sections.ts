import type { ComparisonInput, ComparisonResult } from "../calculations/comparison.ts";
import { rows, value } from "../calculations/inputs.ts";
import { numeric } from "../data/numeric.ts";
import { basePaySection } from "./base-pay.ts";
import type { MetricContext } from "./metric-definitions.ts";
import type { EquationSection } from "./model.ts";
import { paySections } from "./pay-sections.ts";
import { calendarRules, recurringRules, superRules } from "./rules.ts";
import { annualSections } from "./tax.ts";

function hasNoJourneys(result: ComparisonResult): boolean {
  return result.metrics.find(({ label }) => label === "Return commute journeys")?.amount === 0;
}

function energyFormula(input: ComparisonInput): string {
  const energy = value(input.offer.fields, "energy");
  if (energy === "none") {
    return "annual_commute_energy_cost = 0";
  }
  if (energy === "fuel" || energy === "electric") {
    return `annual_commute_energy_units = annual_commute_kilometres * consumption_per_100_km / 100
annual_commute_energy_cost = annual_commute_energy_units * price_per_energy_unit`;
  }
  return "annual_commute_energy_cost = unknown\nSelect an energy basis to establish this cost.";
}

function commuteSection(input: ComparisonInput, result: ComparisonResult): EquationSection {
  const { fields } = input.offer;
  const title = "Commuting costs and distance";
  if (hasNoJourneys(result)) {
    return {
      title,
      formula: `annual_commute_kilometres = 0 when annual_return_journeys = 0
annual_commute_hours = 0 when annual_return_journeys = 0
annual_commuting_cost = 0 when annual_return_journeys = 0
No trips occur in the selected calendar, so trip inputs and a cost method are unnecessary.`,
    };
  }
  let trip = "Return distance and minutes are entered totals for both directions.";
  if (value(fields, "tripBasis") === "legs") {
    trip = `return_distance_km = outward_distance_km + homeward_distance_km
return_minutes = outward_minutes + homeward_minutes`;
  } else if (value(fields, "tripBasis") !== "return") {
    trip = "The return-total or separate-legs entry basis is unknown.";
  }
  let cost = `${energyFormula(input)}
annual_commute_maintenance_cost = annual_commute_kilometres * maintenance_per_km
annual_commuting_cost = annual_commute_energy_cost + annual_commute_maintenance_cost + annual_commute_trip_charges
Use offer price/consumption overrides, then compatible shared vehicle settings. Litres and kWh cannot inherit each other's settings.`;
  if (value(fields, "costMethod") === "ato") {
    let rate = "0.91";
    if (input.year === "2025-26") {
      rate = "0.88";
    }
    cost = `kilometre_rate = ${rate}
annual_commuting_cost = annual_commute_kilometres * kilometre_rate + annual_commute_trip_charges
This broader ATO estimate includes ownership costs. It is not a commuting tax deduction.`;
  } else if (value(fields, "costMethod") !== "entered") {
    cost =
      "annual_commuting_cost = unknown\nChoose a commuting-cost method to establish this amount.";
  }
  return {
    title,
    formula: `${trip}
annual_commute_kilometres = annual_return_journeys * return_distance_km
annual_commute_hours = annual_return_journeys * return_minutes / 60
annual_commute_trip_charges = annual_return_journeys * charges_per_return_trip
\n${cost}
With zero return journeys, commute distance, hours and cost are zero without requiring trip inputs.`,
  };
}

function travelFormula(input: ComparisonInput, result: ComparisonResult, name: string): string {
  const hours = result.metrics.find(({ label }) => label === "Commute hours")?.amount;
  if (!input.timeValue || hours === 0) {
    return "0";
  }
  let rateLabel = "Cash + super after tax per paid hour";
  let rateName = "net_financial_value_per_paid_hour";
  if (name.includes("gross")) {
    rateLabel = "Package value before tax per paid hour";
    rateName = "gross_package_per_paid_hour";
  }
  const rate = result.metrics.find(({ label }) => label === rateLabel)?.amount;
  if (rate === null || rate === undefined || rate < 0) {
    return "unavailable";
  }
  return `${rateName} * annual_commute_hours`;
}

function travelSection(
  input: ComparisonInput,
  result: ComparisonResult,
  name: string,
): EquationSection {
  let rate = "net_financial_value_per_paid_hour";
  let output = "annual_after_tax_travel_time_value";
  let numerator = "annual_net_financial_value";
  if (name.includes("gross")) {
    rate = "gross_package_per_paid_hour";
    output = "annual_gross_travel_time_value";
    numerator = "annual_gross_package_value";
  }
  const formula = `${rate} = ${numerator} / standard_paid_hours_per_year\n${output} = ${travelFormula(input, result, name)}\nUse this offer's own hourly rate. After-tax time value uses cash plus super after ordinary contribution tax, excluding personal perks. This is a personal-time valuation, not a cash expense or tax deduction. The standard paid-hours denominator must be positive and known. A negative or unknown rate leaves monetary time valuation unavailable; negative cash remains visible. Known zero commute hours or disabled valuation gives zero without requiring a rate.`;
  return { title: "Travel time", formula };
}

function recurringSection(
  input: ComparisonInput,
  context: readonly MetricContext[],
): EquationSection {
  let formula = recurringRules;
  if (context.includes("pay")) {
    formula += "\nannual_gross_package_value = annual_remuneration + annual_personal_perk_value";
  }
  return {
    title: "Perks and extra costs",
    formula,
    collections: Object.fromEntries([
      [
        "annual_personal_perk_values",
        rows(input.offer, "perks").map((_, index) => ({
          scope: `perk_${index + 1}`,
          name: "annual_personal_perk_value",
        })),
      ],
      [
        "included_job_cost_reimbursements",
        rows(input.offer, "costs").map((_, index) => ({
          scope: `cost_${index + 1}`,
          name: "annual_job_cost_reimbursement",
        })),
      ],
      [
        "included_net_job_costs",
        rows(input.offer, "costs").map((_, index) => ({
          scope: `cost_${index + 1}`,
          name: "annual_net_job_cost",
        })),
      ],
    ]),
  };
}

function needsCalendar(input: ComparisonInput, context: readonly MetricContext[]): boolean {
  const perJourney = [...rows(input.offer, "perks"), ...rows(input.offer, "costs")].some(
    ({ fields }) => value(fields, "frequency") === "journey",
  );
  return (
    context.includes("calendar") ||
    context.includes("commute") ||
    (context.includes("recurring") && perJourney)
  );
}

function netSection(result: ComparisonResult, context: readonly MetricContext[]): EquationSection {
  let cash = "annual_cash_before_tax = annual_cash_pay - annual_salary_sacrifice";
  if (value(result.payer, "employment") === "sole-trader") {
    cash =
      "annual_cash_before_tax = annual_cash_pay - annual_business_cash_costs\nContractor annual_personal_super_contribution is the entered non-deducted payment; annual_salary_sacrifice is zero.";
  } else {
    const pay =
      result.metrics.find(({ label }) => label === "Cash pay / revenue before deductions")
        ?.amount ?? null;
    const sacrifice = numeric(result.payer, "sacrifice");
    if (pay !== null && sacrifice !== null && sacrifice > pay) {
      cash =
        "annual_cash_before_tax = unavailable\nSalary sacrifice exceeds cash pay; negative employee income is not calculated.";
    }
  }
  let packageFormula = "";
  if (context.includes("recurring")) {
    packageFormula =
      "annual_net_package_value = annual_cash_after_tax + annual_net_super_contributions + annual_personal_perk_value";
  }
  return {
    title: "Net package",
    formula: `${cash}
annual_cash_after_tax = annual_cash_before_tax - annual_personal_super_contribution - offer_attributed_annual_tax_estimate
annual_net_financial_value = annual_cash_after_tax + annual_net_super_contributions
${packageFormula}
Annual tax uses the incremental component estimate. Cash and super are separate destinations. Personal perks, when included, are not bank cash.`,
  };
}

function jobCostSection(input: ComparisonInput): EquationSection {
  let totalCosts = "annual_total_job_costs = annual_job_costs";
  if (value(input.offer.fields, "employment") === "sole-trader") {
    totalCosts += " + annual_business_cash_costs";
  }
  return {
    title: "Job costs",
    formula: `annual_job_costs = annual_commuting_cost + annual_other_job_costs\n${totalCosts}\nReimbursements offset their own costs. Contractor business cash costs are already deducted from annual_cash_after_tax and are not deducted twice. Reimbursement coverage concerns the entered extra-cost rows only.`,
  };
}

function comparisonSections(
  input: ComparisonInput,
  result: ComparisonResult,
  name: string,
  context: readonly MetricContext[],
): EquationSection[] {
  const sections: EquationSection[] = [];
  if (context.includes("cash")) {
    sections.push(netSection(result, context));
  }
  if (context.includes("commute") && context.includes("recurring")) {
    sections.push(jobCostSection(input));
  }
  if (name.includes("time_value") || name.endsWith("_costs_and_time")) {
    sections.push(travelSection(input, result, name));
  }
  if (context.includes("pay") || context.includes("annual")) {
    sections.push(...paySections(result, input.year));
    sections.push(basePaySection(result, input.year));
  }
  if (context.includes("super")) {
    sections.push({ title: "Net super contributions", formula: superRules });
  }
  if (context.includes("recurring")) {
    sections.push(recurringSection(input, context));
  }
  if (context.includes("commute")) {
    sections.push(commuteSection(input, result));
    sections.push({
      title: "Work and travel hours",
      formula:
        "annual_work_and_travel_hours = annual_work_hours + annual_commute_hours\nWorked hours exclude unpaid breaks.",
    });
  }
  if (needsCalendar(input, context)) {
    sections.push({ title: "Work calendar and journeys", formula: calendarRules });
  }
  if (context.includes("annual")) {
    sections.push({
      title: "Offer-attributed annual tax",
      formula:
        "offer_attributed_annual_tax_estimate = annual_component_subtotal_with_offer - annual_component_subtotal_without_offer",
    });
    for (const [scenario, without] of [
      [result.tax.withOffer, false],
      [result.tax.withoutOffer, true],
    ] as const) {
      sections.push(...annualSections(result, scenario, without));
    }
  }
  return sections;
}

export { comparisonSections, hasNoJourneys, travelFormula };

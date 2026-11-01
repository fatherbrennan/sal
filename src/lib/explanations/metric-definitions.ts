import { financialCostEquations } from "./financial-definitions.ts";

type MetricContext = "pay" | "recurring" | "super" | "annual" | "cash" | "commute" | "calendar";
const gross: readonly MetricContext[] = ["pay", "recurring"];
const net: readonly MetricContext[] = [...gross, "super", "annual", "cash"];
const costs: readonly MetricContext[] = ["commute", "calendar", "recurring"];
const time: readonly MetricContext[] = [...net, ...costs];

const metricEquations: Readonly<
  Record<string, readonly [string, string, readonly MetricContext[]]>
> = {
  ...financialCostEquations,
  "Package value before tax and costs": [
    "annual_gross_package_value",
    "annual_remuneration + annual_personal_perk_value",
    gross,
  ],
  "Package value after tax": [
    "annual_net_package_value",
    "annual_cash_after_tax + annual_net_super_contributions + annual_personal_perk_value",
    net,
  ],
  "Cash after tax + personal perks": [
    "annual_cash_and_personal_perk_value",
    "annual_cash_after_tax + annual_personal_perk_value",
    net,
  ],
  "Package value after tax and commuting costs": [
    "annual_net_package_after_commuting_costs",
    "annual_net_package_value - annual_commuting_cost",
    [...net, ...costs],
  ],
  "Package value after tax, commuting costs and time": [
    "annual_net_package_after_commuting_costs_and_time",
    "annual_net_package_value - annual_commuting_cost - annual_after_tax_travel_time_value",
    time,
  ],
  "Package value including hypothetical leave cash-out": [
    "annual_net_package_with_leave_cash_out",
    "annual_net_package_after_commuting_costs_and_time + leave_cash_out_net_total",
    [],
  ],
  "Package value after tax and job costs": [
    "annual_net_package_after_job_costs",
    "annual_net_package_value - annual_job_costs",
    [...net, ...costs],
  ],
  "Package value after tax and costs per work + travel hour": [
    "net_package_after_costs_per_work_and_travel_hour",
    "(annual_net_package_value - annual_job_costs) / annual_work_and_travel_hours",
    [...net, ...costs],
  ],
  "Package value before tax, after job costs": [
    "annual_gross_package_after_job_costs",
    "annual_gross_package_value - annual_job_costs",
    [...gross, ...costs],
  ],
  "Package value before tax, after costs per work + travel hour": [
    "gross_package_after_costs_per_work_and_travel_hour",
    "(annual_gross_package_value - annual_job_costs) / annual_work_and_travel_hours",
    [...gross, ...costs],
  ],
  "Package value after tax per paid hour": [
    "net_package_per_paid_hour",
    "annual_net_package_value / standard_paid_hours_per_year",
    net,
  ],
  "Remote worked hours": [
    "annual_remote_work_hours",
    "sum(remote_hours_in_financial_year)",
    ["calendar"],
  ],
  "Remote share of worked hours": [
    "remote_work_percent",
    "annual_remote_work_hours / annual_work_hours * 100",
    ["calendar"],
  ],
  "Calendar work + travel hours": [
    "annual_work_and_travel_hours",
    "annual_work_hours + annual_commute_hours",
    ["calendar", "commute"],
  ],
  "Commute share of work + travel hours": [
    "commute_time_percent",
    "annual_commute_hours / annual_work_and_travel_hours * 100",
    ["calendar", "commute"],
  ],
  "Commute cost / broader estimate per return journey": [
    "commute_cost_per_journey",
    "annual_commuting_cost / annual_return_journeys",
    ["calendar", "commute"],
  ],
  "Offer-attributed income tax after LITO estimate": [
    "attributed_income_tax",
    "income_tax_after_lito_with_offer - income_tax_after_lito_without_offer",
    ["annual"],
  ],
  "Offer-attributed Medicare levy estimate": [
    "attributed_medicare",
    "medicare_levy_with_offer - medicare_levy_without_offer",
    ["annual"],
  ],
  "Offer-attributed Medicare levy surcharge estimate": [
    "attributed_mls",
    "medicare_levy_surcharge_with_offer - medicare_levy_surcharge_without_offer",
    ["annual"],
  ],
  "Offer-attributed HELP repayment estimate": [
    "attributed_help",
    "help_repayment_with_offer - help_repayment_without_offer",
    ["annual"],
  ],
  "Cash after tax and personal super": [
    "annual_cash_after_tax",
    "annual_cash_before_tax - annual_personal_super_contribution - offer_attributed_annual_tax_estimate",
    net,
  ],
  "Cash after tax and job costs": [
    "annual_cash_after_job_costs",
    "annual_cash_after_tax - annual_job_costs",
    [...net, ...costs],
  ],
  "Cash pay / revenue before deductions": [
    "annual_cash_pay",
    "sum(selected_pay_item_cash_before_cap)",
    ["pay"],
  ],
  "Base cash per paid hour": [
    "base_cash_per_standard_paid_hour",
    "annual_base_cash / standard_paid_hours_per_year",
    ["pay"],
  ],
  "Annual base cash before deductions": [
    "annual_base_cash",
    "annual_base_cash_before_cap",
    ["pay"],
  ],
  "Base employer super": ["annual_base_employer_super", "annual_base_super_before_cap", ["pay"]],
  "Selected bonus / commission cash": [
    "annual_bonus_cash",
    "annual_cash_pay - annual_base_cash",
    ["pay"],
  ],
  "Selected bonus / commission super": [
    "annual_bonus_employer_super",
    "annual_employer_super - annual_base_employer_super",
    ["pay"],
  ],
  "Employer / hirer super": [
    "annual_employer_super",
    "sum(selected_pay_item_super_before_cap)",
    ["pay"],
  ],
  "Personal perk value": [
    "annual_personal_perk_value",
    "sum(annual_personal_perk_values)",
    ["recurring"],
  ],
  "Incremental annual tax component estimate": [
    "offer_attributed_annual_tax_estimate",
    "annual_component_subtotal_with_offer - annual_component_subtotal_without_offer",
    ["annual"],
  ],
  "Gross contributions to super": [
    "annual_super_contributions",
    "annual_employer_super + annual_salary_sacrifice + annual_personal_super_contribution",
    ["pay", "super"],
  ],
  "Super contributions after ordinary fund tax": [
    "annual_net_super_contributions",
    "(annual_employer_super + annual_salary_sacrifice) * 0.85 + annual_personal_super_contribution",
    ["pay", "super"],
  ],
  "Ordinary tax on super contributions": [
    "annual_super_contribution_tax",
    "annual_super_contributions - annual_net_super_contributions",
    ["pay", "super"],
  ],
  "Package value before tax per paid hour": [
    "gross_package_per_paid_hour",
    "annual_gross_package_value / standard_paid_hours_per_year",
    gross,
  ],
  "Cash after tax per paid hour": [
    "after_tax_cash_per_paid_hour",
    "annual_cash_after_tax / standard_paid_hours_per_year",
    net,
  ],
  "Cash before tax per paid hour": [
    "gross_cash_per_paid_hour",
    "annual_cash_pay / standard_paid_hours_per_year",
    ["pay"],
  ],
  "Super after ordinary tax per paid hour": [
    "net_super_per_paid_hour",
    "annual_net_super_contributions / standard_paid_hours_per_year",
    ["pay", "super"],
  ],
  "Super before tax per paid hour": [
    "gross_super_per_paid_hour",
    "annual_super_contributions / standard_paid_hours_per_year",
    ["pay", "super"],
  ],
  "Tax per paid hour": [
    "tax_per_paid_hour",
    "offer_attributed_annual_tax_estimate / standard_paid_hours_per_year",
    ["pay", "annual"],
  ],
  "Fund contribution tax per paid hour": [
    "fund_tax_per_paid_hour",
    "annual_super_contribution_tax / standard_paid_hours_per_year",
    ["pay", "super"],
  ],
  "Standard paid hours": [
    "standard_paid_hours_per_year",
    "standard_paid_hours_per_week * standard_weeks_per_year",
    ["pay"],
  ],
  "Calendar work hours": [
    "annual_work_hours",
    "sum(hours_in_financial_year(retained_work_intervals)) + sum(exception_work_hours_in_financial_year)",
    ["calendar"],
  ],
  "Package value before tax per worked hour": [
    "gross_package_per_worked_hour",
    "annual_gross_package_value / annual_work_hours",
    [...gross, "calendar"],
  ],
  "Cash after tax per worked hour": [
    "after_tax_cash_per_worked_hour",
    "annual_cash_after_tax / annual_work_hours",
    [...net, "calendar"],
  ],
  "On-site attendance days": [
    "annual_on_site_days",
    "count(distinct_retained_on_site_shift_start_dates_in_financial_year) + count(on_site_exception_dates_with_positive_hours_in_financial_year)",
    ["calendar"],
  ],
  "Return commute journeys": [
    "annual_return_journeys",
    "sum(journeys_of_retained_shifts_starting_in_financial_year) + sum(exception_journeys_in_financial_year)",
    ["calendar"],
  ],
  "Commute kilometres": [
    "annual_commute_kilometres",
    "annual_return_journeys * return_distance_km",
    ["commute"],
  ],
  "Commute hours": [
    "annual_commute_hours",
    "annual_return_journeys * return_minutes / 60",
    ["commute"],
  ],
  "Commute cash cost / broader estimate": [
    "annual_commuting_cost",
    "annual_commute_energy_cost + annual_commute_maintenance_cost + annual_commute_trip_charges  # entered method; alternative below",
    ["commute"],
  ],
  "Other job costs less reimbursements": [
    "annual_other_job_costs",
    "sum(included_net_job_costs)",
    ["calendar", "recurring"],
  ],
  "Cash after tax and costs per work + travel hour": [
    "cash_per_work_and_travel_hour",
    "(annual_cash_after_tax - annual_job_costs) / (annual_work_hours + annual_commute_hours)",
    [...net, ...costs],
  ],
  "Commute-time value at package before tax": [
    "annual_gross_travel_time_value",
    "gross_package_per_paid_hour * annual_commute_hours",
    [...gross, ...costs],
  ],
  "Commute-time value at cash + super after tax": [
    "annual_after_tax_travel_time_value",
    "net_financial_value_per_paid_hour * annual_commute_hours",
    time,
  ],
  "Package value before tax, after job costs and time": [
    "annual_gross_package_after_costs_and_time",
    "annual_gross_package_value - annual_job_costs - annual_gross_travel_time_value",
    [...gross, ...costs],
  ],
  "Package value after tax, job costs and time": [
    "annual_net_package_after_costs_and_time",
    "annual_net_package_value - annual_job_costs - annual_after_tax_travel_time_value",
    time,
  ],
};

export type { MetricContext };
export { metricEquations };

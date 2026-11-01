import type { MetricContext } from "./metric-definitions.ts";

const financial: readonly MetricContext[] = ["pay", "super", "annual", "cash"];
const costs: readonly MetricContext[] = ["commute", "calendar", "recurring"];
const financialCostEquations: Readonly<
  Record<string, readonly [string, string, readonly MetricContext[]]>
> = {
  "Contractor operating surplus before personal tax": [
    "annual_contractor_operating_surplus",
    "annual_cash_pay - annual_business_cash_costs",
    ["pay"],
  ],
  "Cash + super after tax": [
    "annual_net_financial_value",
    "annual_cash_after_tax + annual_net_super_contributions",
    financial,
  ],
  "Cash + super after tax and job costs": [
    "annual_net_financial_value_after_costs",
    "annual_net_financial_value - annual_job_costs",
    [...financial, ...costs],
  ],
  "Cash + super after tax per paid hour": [
    "net_financial_value_per_paid_hour",
    "annual_net_financial_value / standard_paid_hours_per_year",
    financial,
  ],
  "Cash + super after tax and costs per work + travel hour": [
    "net_financial_value_after_costs_per_work_and_travel_hour",
    "(annual_net_financial_value - annual_job_costs) / annual_work_and_travel_hours",
    [...financial, ...costs],
  ],
  "Total unreimbursed job costs / broader estimate": [
    "annual_total_job_costs",
    "annual_job_costs",
    costs,
  ],
  "Salary-sacrificed super": ["annual_salary_sacrifice", "", []],
  "Personal after-tax super contributions": ["annual_personal_super_contribution", "", []],
  "Other job-cost reimbursements": [
    "annual_other_job_cost_reimbursements",
    "sum(included_job_cost_reimbursements)",
    costs,
  ],
  "Cash after tax, job costs and time": [
    "annual_cash_after_costs_and_time",
    "annual_cash_after_tax - annual_job_costs - annual_after_tax_travel_time_value",
    [...financial, ...costs],
  ],
  "Job-cost share of cash before costs": [
    "job_cost_percent",
    "annual_total_job_costs / (annual_cash_after_tax + annual_total_job_costs - annual_job_costs) * 100",
    [...financial, ...costs],
  ],
  "Other job-cost reimbursement coverage": [
    "job_cost_reimbursement_percent",
    "annual_other_job_cost_reimbursements / (annual_other_job_costs + annual_other_job_cost_reimbursements) * 100",
    costs,
  ],
};

export { financialCostEquations };

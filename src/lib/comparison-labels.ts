const comparisonLabels: Readonly<Record<string, string>> = {
  "Package value after tax, commuting costs and time":
    "Package value after tax, commute costs and commute time value",
  "Cash after tax and personal super": "Cash after tax",
  "Super contributions after ordinary fund tax": "Super contributions after contribution tax",
  "Personal perk value": "Personal perk value",
  "Commute cash cost / broader estimate": "Commute costs",
  "Commute-time value at cash + super after tax": "Commute time value",
  "Cash + super after tax per paid hour": "Cash + super after tax per standard paid hour",
  "Annual leave entitlement (hours)": "Annual leave earned (hours)",
  "Annual entitlement: gross illustrative value": "Hypothetical leave cash-out: cash before tax",
  "Hypothetical annual leave cash-out after tax": "Hypothetical leave cash-out: cash after tax",
  "Annual leave: base pay plus super": "Annual leave value before tax (base pay + super)",
  "Ordinary leave base pay plus super per hour": "Base pay + super before tax per leave hour",
  "Annual leave: allocated base employer super": "Annual leave value: allocated employer super",
  "Hypothetical leave cash-out: employer super":
    "Hypothetical leave cash-out: employer super contributions",
  "Hypothetical leave cash-out: ordinary fund tax":
    "Hypothetical leave cash-out: ordinary contribution tax",
  "Hypothetical leave cash-out: net super":
    "Hypothetical leave cash-out: super after contribution tax",
  "Hypothetical leave cash-out: net total": "Hypothetical leave cash-out: cash + super after tax",
  "Package value including hypothetical leave cash-out":
    "Package value including hypothetical leave cash-out",
  "Package value before tax and costs": "Package value before tax",
  "Package value after tax": "Package value after tax",
  "Cash + super after tax": "Cash + super after tax",
  "Cash after tax + personal perks": "Cash after tax + personal perk value",
  "Annual base cash before deductions": "Base cash pay before tax",
  "Cash pay / revenue before deductions": "Cash pay / contract revenue",
  "Contractor operating surplus before personal tax": "Contractor cash surplus before personal tax",
  "Employer / hirer super": "Employer / hirer super contributions",
  "Base employer super": "Employer super contributions on base pay",
  "Gross contributions to super": "Total super contributions",
  "Salary-sacrificed super": "Salary sacrifice to super",
  "Personal after-tax super contributions": "Personal super contributions from after-tax cash",
  "Ordinary tax on super contributions": "Ordinary super contribution tax",
  "Base cash per paid hour": "Base cash pay before tax per standard paid hour",
  "Package value before tax per paid hour": "Package value before tax per standard paid hour",
  "Package value after tax per paid hour": "Package value after tax per standard paid hour",
  "Cash before tax per paid hour": "Cash pay before tax per standard paid hour",
  "Cash after tax per paid hour": "Cash after tax per standard paid hour",
  "Super before tax per paid hour": "Total super contributions per standard paid hour",
  "Super after ordinary tax per paid hour":
    "Super contributions after contribution tax per standard paid hour",
  "Standard paid hours": "Standard paid hours per year",
  "Calendar work hours": "Work hours per year",
  "On-site attendance days": "On-site workdays per year",
  "Remote worked hours": "Remote work hours per year",
  "Remote share of worked hours": "Remote share of work hours (%)",
  "Return commute journeys": "Return commute trips per year",
  "Commute kilometres": "Commute distance per year (km)",
  "Commute hours": "Commute hours per year",
  "Calendar work + travel hours": "Work + commute hours per year",
  "Commute share of work + travel hours": "Commute share of work + commute hours (%)",
  "Commute cost / broader estimate per return journey": "Commute costs per return trip",
  "Package value after tax and commuting costs": "Package value after tax and commute costs",
  "Commute-time value at package before tax": "Commute time value at package rate before tax",
  "Package value before tax per worked hour": "Package value before tax per work hour",
  "Cash after tax per worked hour": "Cash after tax per work hour",
  "Other job costs less reimbursements": "Other job costs after reimbursements",
  "Other job-cost reimbursements": "Reimbursements for other job costs",
  "Other job-cost reimbursement coverage": "Reimbursed share of other job costs (%)",
  "Total unreimbursed job costs / broader estimate": "Total unreimbursed job costs",
  "Job-cost share of cash before costs": "Job costs as a share of cash before costs (%)",
  "Cash after tax and job costs": "Cash after tax and all job costs",
  "Cash + super after tax and job costs": "Cash + super after tax and all job costs",
  "Package value after tax and job costs": "Package value after tax and all job costs",
  "Cash after tax and costs per work + travel hour":
    "Cash after tax and all job costs per work + commute hour",
  "Cash + super after tax and costs per work + travel hour":
    "Cash + super after tax and all job costs per work + commute hour",
  "Package value after tax and costs per work + travel hour":
    "Package value after tax and all job costs per work + commute hour",
  "Package value before tax, after job costs": "Package value before tax, after all job costs",
  "Package value before tax, after costs per work + travel hour":
    "Package value before tax, after all job costs, per work + commute hour",
  "Cash after tax, job costs and time":
    "Cash value after tax, all job costs and commute time value",
  "Package value before tax, after job costs and time":
    "Package value before tax, after all job costs and commute time value",
  "Package value after tax, job costs and time":
    "Package value after tax, all job costs and commute time value",
  "Selected bonus / commission cash": "Bonus and commission cash before tax",
  "Selected bonus / commission super": "Employer super contributions on bonuses and commissions",
  "Annual leave entitlement (weeks)": "Annual leave earned (weeks)",
  "Ordinary hours per week": "Paid hours per leave week",
  "Ordinary leave base cash per hour": "Base pay before tax per leave hour",
  "Additional leave loading per hour": "Leave loading before tax per leave hour",
  "Annual entitlement: base cash value": "Annual leave value: base pay before tax",
  "Annual entitlement: loading value": "Annual leave value: loading before tax",
  "Recorded unused balance (hours)": "Recorded unused annual leave (hours)",
  "Recorded balance: base cash value": "Recorded leave value: base pay before tax",
  "Recorded balance: loading value": "Recorded leave value: loading before tax",
  "Recorded balance: gross illustrative value":
    "Recorded leave value: base pay + loading before tax",
  "Incremental annual tax component estimate": "Tax and HELP repayments attributed to offer",
  "Offer-attributed income tax after LITO estimate": "Income tax after LITO attributed to offer",
  "Offer-attributed Medicare levy estimate": "Medicare levy attributed to offer",
  "Offer-attributed Medicare levy surcharge estimate":
    "Medicare levy surcharge attributed to offer",
  "Offer-attributed HELP repayment estimate": "HELP repayment attributed to offer",
  "Tax per paid hour": "Tax and HELP repayments attributed to offer per standard paid hour",
  "Fund contribution tax per paid hour": "Ordinary super contribution tax per standard paid hour",
  "Target upside: cash before tax": "Target increase: cash pay before tax",
  "Target upside: super before tax": "Target increase: total super contributions",
  "Target upside: package value before tax and costs": "Target increase: package value before tax",
  "Target upside: cash after tax": "Target increase: cash after tax",
  "Target upside: super after ordinary tax":
    "Target increase: super contributions after contribution tax",
  "Target upside: package value after tax": "Target increase: package value after tax",
  "Contingent share of target cash after tax": "Target-dependent share of cash after tax (%)",
  "Additional cash after tax and costs per extra work + travel hour":
    "Change in cash after tax and job costs per extra work + commute hour",
  "Additional package value after tax and costs per extra work + travel hour":
    "Change in package value after tax and job costs per extra work + commute hour",
  "Cash surrendered per work + travel hour freed":
    "Cash after tax and job costs given up per work + commute hour saved",
};

const componentSigns: Readonly<Record<string, string>> = {
  "Cash after tax and personal super": "+",
  "Super contributions after ordinary fund tax": "+",
  "Personal perk value": "+",
  "Commute cash cost / broader estimate": "−",
  "Commute-time value at cash + super after tax": "−",
};

const metricNotes: Readonly<Record<string, string>> = {
  "Cash after tax and personal super":
    "After personal super transfers; before other payroll deductions.",
  "Super contributions after ordinary fund tax":
    "Ordinary contribution-tax estimate; excludes fund fees and investment growth.",
  "Package value including hypothetical leave cash-out":
    "After tax, commute costs and commute time value.",
};

const equationLabels: Readonly<Record<string, string>> = Object.fromEntries([
  ["basic_income_tax", "Basic income tax"],
  ["applied_lito", "Low income tax offset"],
  ["income_tax_after_lito", "Income tax after low income tax offset"],
  ["medicare_levy", "Medicare levy"],
  ["medicare_levy_surcharge", "Medicare levy surcharge"],
  ["help_repayment", "HELP repayment"],
  ["annual_component_subtotal", "Estimated personal tax and HELP repayments"],
  ["final_assessed_tax", "Final assessed tax"],
  ["standard_deduction", "Employee standard deduction"],
  ["derived_taxable_income", "Derived taxable income"],
  ["taxable_income", "Taxable income used for estimate"],
  ["period_gross_cash_pay", "Base cash pay before tax per pay period"],
  ["period_gross_cash_pay_per_hour", "Base cash pay before tax per standard paid hour"],
  ["period_salary_sacrifice", "Salary sacrifice to super per pay period"],
  ["period_salary_sacrifice_per_hour", "Salary sacrifice to super per standard paid hour"],
  ["period_payg_earnings", "Pay subject to PAYG withholding per pay period"],
  ["period_payg_earnings_per_hour", "Pay subject to PAYG withholding per standard paid hour"],
  [
    "period_personal_super_contribution",
    "Personal super deducted from after-tax pay per pay period",
  ],
  [
    "period_personal_super_contribution_per_hour",
    "Personal super deducted from after-tax pay per standard paid hour",
  ],
  ["period_other_post_tax_deductions", "Other deductions from after-tax pay per pay period"],
  [
    "period_other_post_tax_deductions_per_hour",
    "Other deductions from after-tax pay per standard paid hour",
  ],
  ["period_ordinary_payg", "PAYG withholding before study-loan adjustment per pay period"],
  [
    "period_ordinary_payg_per_hour",
    "PAYG withholding before study-loan adjustment per standard paid hour",
  ],
  ["period_study_loan_withholding", "Additional study-loan withholding per pay period"],
  [
    "period_study_loan_withholding_per_hour",
    "Additional study-loan withholding per standard paid hour",
  ],
  ["period_total_payg", "Total PAYG withholding per pay period"],
  ["period_total_payg_per_hour", "Total PAYG withholding per standard paid hour"],
  [
    "period_cash_after_withholding",
    "Cash after withholding, before after-tax deductions per pay period",
  ],
  [
    "period_cash_after_withholding_per_hour",
    "Cash after withholding, before after-tax deductions per standard paid hour",
  ],
  ["period_bank_cash_estimate", "Estimated payslip cash after deductions per pay period"],
  [
    "period_bank_cash_estimate_per_hour",
    "Estimated payslip cash after deductions per standard paid hour",
  ],
]);

export { comparisonLabels, componentSigns, equationLabels, metricNotes };

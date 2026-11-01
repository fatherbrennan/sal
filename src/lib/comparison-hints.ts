const metricHints: Readonly<Record<string, string>> = {
  "Package value after tax, commuting costs and time":
    "Cash after estimated annual tax + net super + personal perks, less commute costs and valued commute time. Compares overall value before extra job costs.",
  "Cash after tax and personal super":
    "Cash remaining after estimated offer-attributed annual tax and personal super transfers. Before commuting, extra job costs and other payroll outflows; contractor business costs are already deducted.",
  "Super contributions after ordinary fund tax":
    "Employer, salary-sacrificed and personal contributions retained after modelled ordinary fund tax. Shows retirement value added, not spendable cash or investment growth.",
  "Personal perk value":
    "Annual total of your personal values for non-cash benefits. Adds their usefulness to package comparisons; does not establish cash receipts or tax treatment.",
  "Commute cash cost / broader estimate":
    "Annual vehicle costs using entered fuel/energy and maintenance or the broader ATO estimate, plus parking, tolls and fares. Excludes commute time value; not a tax-deduction calculation.",
  "Commute-time value at cash + super after tax":
    "Annual commute hours × this offer's cash-plus-net-super rate per paid hour, excluding perks. Values time spent travelling; not a cash expense. Zero when time valuation is off.",
  "Cash + super after tax per paid hour":
    "Cash after estimated annual tax plus net super, divided by standard paid hours. Excludes perks; before commuting and extra job costs. This offer's rate for valuing commute time.",
  "Annual leave entitlement (weeks)":
    "Paid leave weeks earned in a full year under the entered employer terms. Compares entitlement, not leave taken or your unused balance.",
  "Annual leave entitlement (hours)":
    "Annual entitlement weeks × paid hours per leave week. Shows hours earned, separate from comparison work hours, leave taken and your unused balance.",
  "Annual leave: base pay plus super":
    "One year's leave hours × the combined base-pay and employer-super hourly rate. Values leave already within annual remuneration; excludes bonuses and loading.",
  "Hypothetical leave cash-out: net total":
    "Extra cash kept + extra net super if one year's leave were paid on top of earnings while employed, in this financial year. Illustrative; requires cash-out permission.",
  "Package value including hypothetical leave cash-out":
    "Package value after tax, commute costs and commute time value + extra cash and net super from the hypothetical leave cash-out. Retains the original commute costs and commute time valuation. Assumes cash-out permission; unavailable if either part is unknown.",
  "Hypothetical annual leave cash-out after tax":
    "Illustrative extra leave payment, including established loading, less the change in estimated annual tax and loan repayments. Excludes super; does not establish cash-out eligibility.",
  "Hypothetical leave cash-out: net super":
    "Additional employer super from the hypothetical leave payment, after supported contribution tax and limit checks. Shows extra retirement value, separate from cash kept.",
  "Package value before tax and costs":
    "Selected cash pay/revenue + employer or hirer super + personal perk value. Compares total remuneration value before tax and expenses; perks are your own valuations.",
  "Package value after tax":
    "Cash after estimated annual tax + super after ordinary fund tax + personal perk value, before commuting, extra job costs and commute time deductions. Compares combined annual value.",
  "Cash + super after tax":
    "Cash after estimated annual tax plus contributions retained in super after ordinary fund tax. Compares financial value before commuting and extra job costs, excluding perks.",
  "Cash after tax + personal perks":
    "Cash after estimated annual tax plus your personal perk values. Shows value before commuting and extra job costs; excludes super. Perks are not spendable cash.",
  "Annual base cash before deductions":
    "Isolated base cash pay or contract revenue component after separating employer super and bonus amounts. Shows base earnings before tax, personal super transfers and expenses.",
  "Cash pay / revenue before deductions":
    "Selected base and bonus/commission cash before tax and personal super transfers; contractor revenue excludes GST. Separates cash earnings from employer/hirer super and perks.",
  "Contractor operating surplus before personal tax":
    "Contractor revenue excluding GST, less entered business cash expenses. Shows cash surplus available before personal tax and personal super; tax deductions may differ from cash expenses.",
  "Employer / hirer super":
    "Total employer/hirer contributions for the selected base pay and bonus scenario, before fund tax. Separates employer-funded retirement pay from your own super transfers.",
  "Base employer super":
    "Employer super isolated from the base salary quote, before fund tax and excluding bonus super. Compares the retirement component of base remuneration.",
  "Gross contributions to super":
    "Employer/hirer super + salary-sacrificed super + personal after-tax contributions, before fund tax. Shows total retirement transfers; your own contributions are not extra employer pay.",
  "Salary-sacrificed super":
    "Annual cash pay redirected to super before income tax in this model. A transfer within remuneration, not extra employer reward or bank cash.",
  "Personal after-tax super contributions":
    "Your annual contribution from after-tax cash, transferred from cash value into super value. Shows where remuneration goes without counting the transfer twice.",
  "Ordinary tax on super contributions":
    "Gross super contributions minus contributions retained after modelled ordinary fund tax. Shows the reduction in retirement contributions; excludes unsupported special tax adjustments.",
  "Base cash per paid hour":
    "Isolated base cash before deductions ÷ standard paid hours. Compares base pay rates without bonuses, employer super or perks; not a payslip deposit rate.",
  "Package value before tax per paid hour":
    "Cash pay/revenue + employer/hirer super + personal perk value, divided by standard paid hours. Compares gross package value on a common paid-hour basis.",
  "Package value after tax per paid hour":
    "Cash after estimated annual tax + net super + personal perks, divided by standard paid hours. Compares combined hourly value before commuting, extra job costs and time valuation.",
  "Cash before tax per paid hour":
    "Selected cash pay/revenue before deductions ÷ standard paid hours. Includes selected bonus cash; excludes employer super and perks. Contractor business expenses have not been deducted.",
  "Cash after tax per paid hour":
    "Cash after estimated annual tax and personal super transfers ÷ standard paid hours. Shows cash value before commuting, extra job costs and other payroll outflows; differs from payslip deposits.",
  "Super before tax per paid hour":
    "Employer, salary-sacrificed and personal super contributions ÷ standard paid hours, before fund tax. Shows retirement transfers per paid hour, not extra cash pay.",
  "Super after ordinary tax per paid hour":
    "Contributions retained after modelled ordinary fund tax ÷ standard paid hours. Shows retirement value per paid hour, including your personal contributions.",
  "Standard paid hours":
    "Entered weekly comparison hours × entered annual weeks. Provides the denominator for paid-hour rates; separate from rostered work, billable quantities and commuting.",
  "Calendar work hours":
    "Work hours falling in the selected financial year after roster and dated exceptions. Measures scheduled work; leave entitlement alone does not remove attendance.",
  "On-site attendance days":
    "On-site work dates counted from retained shifts and dated exceptions in the financial year. Shows attendance frequency; multiple trips can occur on one day.",
  "Remote worked hours":
    "Work hours marked remote in the financial-year roster and exceptions. Shows how much scheduled work avoids on-site attendance; excludes commuting time.",
  "Remote share of worked hours":
    "Remote work hours ÷ total calendar work hours, as a percentage. Compares the remote portion of each offer's entered work pattern.",
  "Return commute journeys":
    "Return trips assigned to retained shifts and dated exceptions starting in the financial year. Drives annual distance, commute time and trip costs; may differ from attendance days.",
  "Commute kilometres":
    "Annual return journeys × distance for one return trip. Shows total commuting distance and drives distance-based running costs or the broader ATO estimate.",
  "Commute hours":
    "Annual return journeys × return-trip minutes ÷ 60. Shows yearly commute time, used in work + commute rates and optional monetary time valuation.",
  "Calendar work + travel hours":
    "Financial-year rostered work hours plus commute hours. Measures combined time commitment, separate from standard paid hours; used for rates including commute time.",
  "Commute share of work + travel hours":
    "Commute hours ÷ combined work and commute hours, as a percentage. Shows how much job-related time is spent travelling rather than working.",
  "Commute cost / broader estimate per return journey":
    "Annual commute costs ÷ return journeys. Compares average trip cost using entered expenses or the selected broader ATO estimate; excludes commute time value.",
  "Package value after tax and commuting costs":
    "Cash after estimated annual tax + net super + personal perks, less commute costs. Compares package value after commute costs, before extra job costs and time valuation.",
  "Commute-time value at package before tax":
    "Annual commute hours × this offer's gross package per standard paid hour, including personal perks. Values commute time before tax; zero when time valuation is off.",
  "Package value before tax per worked hour":
    "Gross cash pay/revenue, employer/hirer super and personal perks ÷ financial-year rostered work hours. Shows value per scheduled work hour, excluding travel hours and costs.",
  "Cash after tax per worked hour":
    "Cash after estimated annual tax and personal super transfers ÷ financial-year rostered work hours. Compares cash per work hour before commuting and extra job costs; excludes travel hours.",
  "Other job costs less reimbursements":
    "Entered extra job expenses minus their reimbursements, for the selected scenario. Shows costs you bear beyond commuting and separately entered contractor business expenses.",
  "Other job-cost reimbursements":
    "Reimbursements for entered extra job expenses in the selected scenario. Offsets those costs; shown separately so reimbursement is not mistaken for extra remuneration.",
  "Other job-cost reimbursement coverage":
    "Reimbursements ÷ entered extra job expenses before reimbursement, as a percentage. Shows the share covered; excludes commuting and separately entered business expenses.",
  "Total unreimbursed job costs / broader estimate":
    "Commute costs + extra job costs after reimbursements + contractor business cash costs. Shows the full expense burden; commuting may use the broader ATO estimate.",
  "Job-cost share of cash before costs":
    "All unreimbursed job costs ÷ after-tax cash before business expenses, as a percentage. Compares the expense burden; a broader ATO estimate is not actual cash spending.",
  "Cash after tax and job costs":
    "Cash after estimated annual tax and personal super transfers, less commuting and unreimbursed extra job costs. Shows cash remaining; contractor business costs are already deducted.",
  "Cash + super after tax and job costs":
    "Cash remaining after estimated annual tax and job costs, plus net super. Compares retained financial value, excluding perks and monetary commute time deductions.",
  "Package value after tax and job costs":
    "Cash after estimated annual tax + net super + personal perks, less job costs without deducting business expenses twice. Compares retained package value before time valuation.",
  "Cash after tax and costs per work + travel hour":
    "Cash remaining after estimated annual tax and job costs, divided by combined work and commute hours. Shows cash per committed hour; no separate monetary commute time deduction.",
  "Cash + super after tax and costs per work + travel hour":
    "Cash after estimated annual tax and job costs + net super, divided by work + commute hours. Compares financial value per committed hour, excluding perks.",
  "Package value after tax and costs per work + travel hour":
    "Cash after estimated annual tax + net super + personal perks, less job costs, divided by work + commute hours. Accounts for travel through the denominator only.",
  "Package value before tax, after job costs":
    "Gross cash pay/revenue + employer/hirer super + personal perks, less all unreimbursed job and business costs. Compares expense-adjusted value before tax and time valuation.",
  "Package value before tax, after costs per work + travel hour":
    "Gross package value less all unreimbursed job and business costs, divided by rostered work + commute hours. Compares value per committed hour before tax.",
  "Cash after tax, job costs and time":
    "Cash after estimated annual tax and job costs, less commute hours valued at this offer's cash-plus-net-super hourly rate. A comparison value, not remaining bank cash.",
  "Package value before tax, after job costs and time":
    "Gross package value less all unreimbursed costs and commute time valued at this offer's gross paid-hour rate. Compares value after both expense and time adjustments.",
  "Package value after tax, job costs and time":
    "Cash after estimated annual tax + net super + personal perks, less job costs and commute time valued at this offer's cash-plus-net-super rate. Includes other job costs.",
  "Selected bonus / commission cash":
    "Cash portion of bonuses and commissions included in the selected scenario, before deductions. Separates earnings above base pay; target and one-off amounts follow the scenario choice.",
  "Selected bonus / commission super":
    "Employer super attributable to bonuses and commissions in the selected scenario, before fund tax. Separates bonus retirement value from base-pay super.",
  "Ordinary hours per week":
    "Employer-confirmed paid hours in one leave week. Converts entitlement weeks to hours and supports salary-based leave valuation; separate from comparison weekly hours.",
  "Ordinary leave base cash per hour":
    "Base cash paid for one leave hour, from the normal-salary conversion or confirmed hourly rate. Excludes bonuses, loading and super; used to value leave hours.",
  "Ordinary leave base pay plus super per hour":
    "Base leave cash rate + employer super allocated from the same annual base salary. Values each earned leave hour before tax, excluding bonuses and loading.",
  "Additional leave loading per hour":
    "Extra cash per leave hour from the selected loading percentage or confirmed hourly amount. Added to base leave pay; an unanswered loading choice remains unknown.",
  "Annual entitlement: base cash value":
    "One year's entitlement hours × base cash rate per leave hour. Shows the base-pay component of leave value before tax, excluding loading and super.",
  "Annual entitlement: loading value":
    "One year's entitlement hours × established additional loading per hour. Shows the loading component of the illustration before tax, separately from base leave pay.",
  "Annual leave: allocated base employer super":
    "One year's entitlement hours × employer super allocated per base-salary leave hour. Part of existing annual remuneration, not an additional payment or cash-out contribution.",
  "Annual entitlement: gross illustrative value":
    "One year's leave hours × (base cash + established loading per hour). Gross cash basis for the separate hypothetical cash-out; excludes super and does not establish eligibility.",
  "Hypothetical leave cash-out: employer super":
    "Additional employer super modelled on the hypothetical leave payment before fund tax, subject to established contribution treatment and statutory headroom. Separate from cash paid.",
  "Hypothetical leave cash-out: ordinary fund tax":
    "Modelled ordinary contribution tax on extra employer super from the hypothetical leave payment. Reduces extra retirement value; shown only when contribution circumstances are supported.",
  "Recorded unused balance (hours)":
    "Unused leave hours you entered at the recorded balance date. A supplied snapshot, not automatically accrued entitlement or leave available today.",
  "Recorded balance: base cash value":
    "Recorded unused leave hours × the current modelled base leave rate. Illustrates base-pay value before tax; excludes loading and super and is not a payout quote.",
  "Recorded balance: loading value":
    "Recorded unused leave hours × established additional loading per hour. Shows the illustrative loading component before tax, without establishing cash-out or termination treatment.",
  "Recorded balance: gross illustrative value":
    "Recorded unused leave hours × (base cash + established loading per hour). Illustrates the balance before tax; excludes super and does not establish an available payout.",
  "Incremental annual tax component estimate":
    "Estimated annual income tax, Medicare charges and HELP repayments with this offer minus without it. Attributes the annual change to the offer; differs from payroll withholding.",
  "Offer-attributed income tax after LITO estimate":
    "Estimated annual income tax after the low-income tax offset with this offer minus without it. Isolates the income-tax component; excludes Medicare and HELP repayments.",
  "Offer-attributed Medicare levy estimate":
    "Estimated annual Medicare levy with this offer minus without it. Shows the levy change attributed to the offer, separately from income tax and the surcharge.",
  "Offer-attributed Medicare levy surcharge estimate":
    "Estimated annual Medicare levy surcharge with this offer minus without it, using the entered household and cover facts. Separates the surcharge from the ordinary Medicare levy.",
  "Offer-attributed HELP repayment estimate":
    "Estimated annual compulsory HELP repayment with this offer minus without it. Shows debt repayment attributed to the offer, separately from income tax and payroll withholding.",
  "Tax per paid hour":
    "Offer-attributed estimated annual tax and HELP repayments ÷ standard paid hours. Shows the annual cash reduction per paid hour; not an hourly withholding forecast.",
  "Fund contribution tax per paid hour":
    "Modelled ordinary tax on super contributions ÷ standard paid hours. Shows the retirement contribution reduction per hour, separate from tax deducted from cash pay.",
};

export { metricHints };

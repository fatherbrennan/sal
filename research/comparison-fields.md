# Salary-package comparison field catalogue

Research date: **2026-10-22**; aligned with confirmed product decisions on **2026-10-23**. This is a proposed domain inventory derived from the user's requirements and verified source dependencies. It is **not an approved database schema, a list of assumed user circumstances, or permission to implement every optional calculation**.

Evidence: [employment and cost source records E01–E24](sources/employment-and-costs.md); [ATO specialist references and tax inputs](ato/README.md). E-numbers below refer to those local records. Tax parameters must come from the specialist's verified rule set, not this catalogue.

Use only the user-approved defaults in [product decisions](product-decisions.md). An unknown value, a confirmed zero, an excluded item, and a non-applicable item must remain distinguishable. Ask for conditional inputs only when their calculation applies. Store personal details in IndexedDB, not repository reference files.

Confirmed scope: alternative offers side by side over a normal full year; shared personal tax settings with explicit per-offer overrides; initial tax calculations for full-year Australian tax residents. Dated job-transition and other-residency candidates below remain research context, outside the selected comparison scope.

All employee types remain in scope. Initial contractor calculations cover sole traders; the user
deferred contracting through their own company, partnership or trust. Those entity candidates
remain research context, not initial offer calculations. This does not exclude employee wages
paid by companies or independently relevant other-income inputs.

## 1. Comparison identity and basis

| Field group       | Fields to represent                                                                                                             | Purpose and evidence                                                                                                                                        |
| ----------------- | ------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Comparison        | ID, name, description, creation/update timestamps, selected package/version IDs, chosen baseline                                | Required to save and reproduce the selected side-by-side alternative-offer comparison.                                                                      |
| Meaning of groups | Selected alternative offers, shared personal tax settings and explicit per-offer overrides                                      | Confirmed by the user. Alternative offers must not be summed into one person's tax income.                                                                  |
| Period            | Selected full financial year, applicable within-year rule periods, standard paid-hours conversion and dated attendance calendar | No job start/end-date comparisons. Preserve rule changes without inventing annual pay dates or deposit counts.                                              |
| Currency          | Australian-dollar amounts only                                                                                                  | Confirmed initial scope. Foreign-currency entry and conversion rates are excluded; foreign-source tax circumstances are a separate classification question. |
| Output basis      | Gross cash, employer-funded benefits/super, estimated take-home, spendable cash after costs, optional personal time valuation   | Keep each metric explainable; do not combine unlike values into an unnamed “salary”.                                                                        |
| Scenario inputs   | Explicit amounts, effective dates and separate guaranteed/target bonus or commission cases                                      | Do not invent probabilities, inflation, discount rates or guaranteed target earnings.                                                                       |

## 2. Evidence attached to every material value

| Field group  | Fields to represent                                                                                                 | Rule                                                                                                   |
| ------------ | ------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------ |
| Provenance   | Source type, source title/reference, URL or local-document label, applicable page/clause, source date, checked date | Distinguish an offer, award, payslip, receipt, quote, measurement, user estimate, and government rule. |
| Meaning      | Amount, currency/unit, frequency, gross/net/GST basis, effective from/to, whether already included elsewhere        | No amount is usable without a defined basis.                                                           |
| Certainty    | Confirmed/estimated/unknown/not applicable/excluded, minimum/maximum if supplied, reason                            | Missing is not zero. An uncertain input must produce a visibly uncertain result.                       |
| Traceability | Related benefit/cost/pay item IDs, rule-version ID, person and package version                                      | Reimbursement, salary sacrifice, and duplicated packages must not count the same value twice.          |
| Overrides    | Original sourced value, replacement, reason, author/change date                                                     | A user override is a user input; it must not overwrite the legal reference fact.                       |

## 3. Employment and engagement

| Field group             | Fields to represent                                                                                                                                                      | Applicability and evidence                                                                                                                                |
| ----------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Role                    | Employer/client label, role, location/work base, industry, occupation, seniority/classification                                                                          | Context for offer and governing pay conditions. E02, E11–E14.                                                                                             |
| Legal arrangement       | Employee, sole-trader contractor, company/partnership/trust engagement, director or other identified arrangement; classification evidence                                | Tax entity and worker relationship are separate. Do not infer status solely from an ABN or job title. E16–E17; ATO.                                       |
| Hours classification    | Full-time, part-time, casual; ordinary hours/FTE where applicable                                                                                                        | Separate from fixed-term duration, pay unit, and work location. E05–E06, E15.                                                                             |
| Duration                | Ongoing/fixed-term/seasonal/project, start date, end date, extension terms, probation terms                                                                              | First-year income, continuity, and expiry exposure. E02, E15, E24.                                                                                        |
| Instrument              | National/state system, state/territory, award/agreement name and version, classification/level, contract terms, salary offset/annualised arrangement                     | No universal award rules. E01, E04, E11–E12, E15.                                                                                                         |
| Special classifications | Relevant age band, adult/junior apprentice, trainee, formal training contract, training stage/competency progression, supported-wage arrangement, shiftworker definition | Capture where relevant; retrieve specific rules before automatic pricing. E07, E14; remaining specialised classifications require their exact instrument. |
| Other arrangements      | Labour hire, digital-platform/regulated worker, road transport, piecework, daily/weekly hire, outwork, overseas duties                                                   | Preserve flags and governing terms; a generic employee or contractor calculation may be insufficient. E13, E17; ATO.                                      |

## 4. Cash remuneration

Annual salary quotes retain their annual amount. Hourly/daily employee quotes use explicitly
entered annual paid hours/days multiplied by the quote rate, independently of attendance.
Contractor revenue uses its separately approved annual-estimate or billable-quantity methods.

| Field group            | Fields to represent                                                                                                                                   | Applicability and evidence                                                                                                         |
| ---------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| Quoted amount          | Amount and pay unit: hourly, daily, weekly, fortnightly, monthly, annual, piece, project; currency; quote date                                        | Normalisation requires the stated unit and actual schedule. E02, E13.                                                              |
| Package inclusions     | Whether super, bonus, allowances, leave loading, overtime, penalties, benefits, or fees are included; itemised amounts and reconciliation             | Prevent adding an included item twice. E03–E04.                                                                                    |
| Base pay               | Guaranteed cash rate/amount, ordinary paid hours, effective dates, scheduled increases                                                                | Different from target total remuneration. E02, E05.                                                                                |
| Variable payments      | Bonus/commission type, eligibility, guaranteed/target/max amount, formula/tier, sales/output basis, payout dates, expected attainment with provenance | Guaranteed, target, and realised payments must remain distinct. E13.                                                               |
| Other cash events      | Sign-on, retention, referral, profit share, completion payments, clawback terms, service/vesting conditions                                           | Contract-sourced candidates; no assumed payment or probability. E02.                                                               |
| Penalties and overtime | Qualifying hour categories, rate/multiplier, stacking rule, included hours/limits, actual/expected hours, cash versus time off                        | Rates require the actual instrument. E04–E05, E12.                                                                                 |
| Allowances             | Type, eligibility, amount/unit, frequency, conditional hours/days, included-in-salary flag, reimbursement relationship                                | Separate cash compensation from expense reimbursement and tax treatment. E11; ATO.                                                 |
| Deductions from pay    | Separately evidenced non-perk payroll outflows and super contributions: classification, amount/frequency, purpose, destination and links              | Perks are additions only. Independent payroll/super treatment requires its own verified rules and must not create perk deductions. |
| Timing                 | Pay frequency, pay dates/arrears, unpaid periods, partial-period method, payment delay                                                                | Cash flow and annual totals are different views. No automatic 52-week/260-day conversion.                                          |

## 5. Work schedule and personal time

| Field group     | Fields to represent                                                                                                                      | Applicability and evidence                                                                                                                           |
| --------------- | ---------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| Roster          | Working days, cycle length, dated shifts, start/end times, ordinary hours, paid/unpaid breaks, compressed week, rostered days off        | Use the actual pattern. E05.                                                                                                                         |
| Extra work      | Expected paid/unpaid overtime, on-call availability, call-outs, mandatory preparation/training, after-hours administration               | Worked time, constrained availability, and compensated time are different quantities. Contract/measurement inputs.                                   |
| Locations       | Remote/hybrid/on-site, work sites, visit frequency or dated attendance, guaranteed versus discretionary arrangement, review/change terms | Drives travel and home-work costs. A request right is not a guaranteed benefit. E19.                                                                 |
| Business travel | Travel frequency, nights away, paid travel time, time outside work, allowances, actual reimbursements                                    | Keep business travel separate from commuting. ATO determines tax treatment.                                                                          |
| Calendar        | Work-base region, holiday calendar/version, substituted holidays, leave dates, shutdowns, unpaid days, start/end dates                   | Avoid overlapping leave/holiday deductions and commuting on absent days. E07, E10.                                                                   |
| Time valuation  | Enabled state, each offer's own salary-derived gross full-remuneration and annual assessment-adjusted cash rates, standard paid hours    | Enabled by default but optional; always calculate both derived values. No custom hourly rate. The detailed accounting equations remain under review. |
| Effective rates | Gross cash per paid hour, net cash per worked hour, time-adjusted metric, explicit denominator and included hours                        | Proposed display definitions; no implied universal hourly-rate formula.                                                                              |

## 6. Leave and continuity

| Field group        | Fields to represent                                                                                                                                  | Applicability and evidence                                                                                                    |
| ------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| Annual leave       | Accrual basis, entitlement in hours/weeks, additional leave, loading, purchase/sale arrangements, eligibility, opening balance, planned use          | Salary already paying leave is not increased again by its face value. E07, E18.                                               |
| Other leave        | Personal/carer's, compassionate, family/domestic violence, community service, parental, study, employer-specific leave; paid/unpaid basis and limits | Use distinct conditions; do not pro-rate everything or assume use. E01, E06, E08.                                             |
| Parental benefits  | Employer paid leave, government payment separately, qualifying service, replacement-pay percentage, dates, super treatment, overlap rules            | Benefits require individual eligibility and dated rules. E01, E22; ATO/government rules still needed for numerical modelling. |
| Long service       | Governing jurisdiction/scheme, start/recognised-service dates, accrual, vesting, portability, opening balance, qualifying payout rules               | No universal national formula. E09.                                                                                           |
| Leave restrictions | Shutdown requirements, blackout periods, approval conditions, carry-over/cashing-out terms                                                           | Contract/instrument facts; subjective usability must not be assigned a dollar value automatically.                            |

## 7. Superannuation and deferred remuneration

Field families: quote includes/excludes super; statutory eligibility and dated calculation basis; guaranteed and additional employer contributions; eligible earnings by component; salary-sacrificed super; personal deductible/non-deductible contributions; all-employer contribution totals; caps and remaining cap inputs; relevant balance/age/carry-forward eligibility; defined-benefit arrangements; contribution dates; fees and insurance where personally relevant; access restrictions.

For shares/options/rights: instrument type, quantity, currency, price/date, strike/exercise cost, vesting schedule, performance/service conditions, tax event/date, restrictions/liquidity, forfeiture/clawback, and separately supplied scenario value. An unvested or unmarketable award is not guaranteed cash.

Authority and implementation status: [ATO specialist](ato/README.md). Do not reuse an old super earnings definition across an effective-date change. The catalogue does not assign a super rate or a future share price.

## 8. Tax profile and take-home dependencies

Conditional field families: selected financial year; tax residency and part-year dates; relevant visa/working-holiday category; age at the relevant date; tax-free-threshold declaration where withholding is calculated; year-to-date income/withholding; income from other jobs and sources; deductions and eligible offsets; spouse/dependant circumstances; Medicare eligibility/exemption periods; appropriate private-hospital cover and covered days; study-loan types/balance and repayment-income additions; reportable fringe benefits and super; investment losses; foreign income/tax; employer/FBT category and benefit classifications; eligible special income or termination payments.

Use the [detailed ATO input inventory](ato/README.md) for actual rule dependencies, definitions, dates, and unresolved cases. These are conditional inputs, not a request to collect every personal detail. A TFN, bank account, employer login, or exact residential address is not needed merely to compare estimates.

## 9. Additive perks and separate packaging research

Proposed additive-perk fields: kind, description, personal value, valuation evidence, period/frequency, availability conditions and linked cost replaced. Add the entered personal value once. Do not calculate perk funding, salary deductions, employee contributions, sacrifice or administration charges.

The user selected personal value only for non-cash perk comparisons. Do not require or assume employer value. Any independently required statutory tax/reporting inputs remain separate; a personal estimate cannot supply an unknown statutory amount or establish tax-free treatment.

Candidate extras include use of a car, parking, transit, employer-funded fuel/charging, meals, accommodation, phone/internet, equipment, insurance, childcare, memberships, training, gym access and staff discounts. Source context: E02–E03, E16, E20. Availability and personal value require entered evidence. Record extra super under superannuation, and cash allowances under cash pay, without adding either again as a perk.

Detailed salary packaging and novated-lease modelling remain research-only, outside the confirmed additive-perks behavior. Their quote, financing, funding, eligibility and tax dependencies do not authorize extra perk fields or calculations. Earlier proposed funding fields are superseded by the user's additions-only decision.

## 10. Commute and transport

New offers start with entered fuel/energy and other expenses. The ATO kilometre-rate comparison
estimate is an alternative, not an automatic tax deduction or proof of actual expenditure.
Fuel/energy prices and vehicle consumption use shared settings with explicit per-offer overrides.
Commute entry starts with total return-trip distance and time; separate outward/return entries
are an alternative. Label the basis and do not count both a total and its legs.

| Field group         | Fields to represent                                                                                                                                       | Rule and evidence                                                                                                                                                                                                |
| ------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Trips               | Work site, mode(s), route/evidence, one-way versus return basis, trips per attendance day, attendance dates/count, shared-trip allocation                 | No silent doubling or assuming every paid day requires a commute. User requirement; E05, E10, E19.                                                                                                               |
| Time                | Outbound/return travel, walking/waiting/transfers, parking access time, peak/off-peak, variability, measured date/source                                  | A route estimate is an estimate, not a guaranteed travel duration.                                                                                                                                               |
| Vehicle             | Ownership/lease status, whether job requires an otherwise unnecessary vehicle, fuel/energy type, consumption rate/unit and evidence                       | Keep incremental costs distinct from allocated ownership costs. E20–E21.                                                                                                                                         |
| Fuel/charging       | Petrol/diesel litres per 100 km; EV Wh/km or kWh/100 km; measured charging energy/loss basis; fuel price; home/public charging prices; employer provision | Units and actual price date required. Laboratory consumption differs from observed use. E21.                                                                                                                     |
| Direct charges      | Parking, tolls, transit fare/pass, rideshare/taxi, bicycle costs, booking fees, applicable discounts/caps, employer reimbursement                         | Use actual applicable prices and periods. No fare tables or automatic route APIs are approved.                                                                                                                   |
| Running costs       | Entered servicing, maintenance, tyres and repairs attributable to commuting                                                                               | The user selected running costs and trip charges only, excluding allocated insurance, registration and depreciation.                                                                                             |
| Allocation controls | Relevant commute quantities, car-pool contribution and reimbursed portions                                                                                | No ownership allocation in entered costs. The user retained the ATO alternative as a clearly labelled broader estimate; do not derive an invented running-cost-only component or treat it as actual expenditure. |

## 11. Remote-work and location costs

Field families: home-work days/hours; incremental electricity/heating/cooling; tariff and measured usage; internet/mobile upgrade versus existing baseline; desk/chair/monitor/computer purchases; employer equipment/allowances/reimbursements; maintenance; coworking; work-related extra accommodation; space cost only if explicitly priced; relocation/moving/bond/travel; differences in ongoing housing costs only if included by the user.

Every amount needs an evidence record, period, allocation, and personal versus work basis. Capture one-off setup separately from recurring costs. Tax deductibility is a separate ATO decision; a measured economic cost is not automatically deductible. E19 supports distinct location arrangements; E03 supports offered equipment/benefit differences. Numerical local prices are not supplied by these sources.

## 12. Other job-induced personal costs

Candidate repeatable expense kinds: meals above the person's chosen baseline, uniforms/PPE/laundry, tools, licences, professional fees, training, health checks, insurance, childcare/after-school care, dependant care, travel/accommodation, and other evidenced job-specific costs.

Fields: cost kind, quantity/unit rate, frequency/dates, baseline cost, incremental amount, employer payment/reimbursement, tax treatment reference, optional inclusion, and evidence. E11, E16, E22–E23 provide relevant dependencies; no standard per-day lunch, childcare, or clothing amount is inferred.

## 13. Contractor and business structure

Initial contractor calculations cover sole traders. Company, partnership and trust contracting
and extraction candidates below are deferred; their presence does not expand the selected scope.

| Field group       | Fields to represent                                                                                                                                                          | Rule and evidence                                                                                                       |
| ----------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| Revenue           | Quoted rate/unit, GST-inclusive/exclusive status, billable units, utilisation, minimum commitment, project milestones, payment terms                                         | Revenue is not employee salary or personal spendable cash. E13, E17; ATO.                                               |
| Non-billable time | Marketing, quoting, administration, bookkeeping, training, leave, illness, gaps between engagements                                                                          | User-evidenced schedule or explicit scenario; no assumed full utilisation.                                              |
| Operating costs   | Tools, software, workspace, travel, licences, accounting/legal, insurance, platform/agency fees, subcontractors, financing                                                   | Itemise fixed/variable and reimbursable amounts. E16–E17.                                                               |
| Tax and super     | Entity structure, personal-services-income classification where applicable, GST registration/treatment, GST credits, hirer super obligations, personal contribution strategy | Requires verified rules; a company invoice amount cannot pass directly through an individual salary formula. ATO.       |
| Owner receipts    | Actual/proposed salary, drawings, distributions/dividends, retained business funds, timing, relevant tax attributes                                                          | Distinguish business result and money received by the person. Not all entity types have the same extraction model. ATO. |
| Risk              | Contract duration, termination provisions, debtor delays/default scenario, professional liability, indemnities, insurance limits/excess                                      | Monetary risk requires explicit evidence/scenario inputs, not an invented haircut.                                      |

## 14. Household interactions

Conditional fields: partner income/profile and relevant period; dependants and ages; actual childcare session dates/length/fees and service type; applicable subsidy/recognised participation; income-tested assistance; child-support amounts and applicable assessment year; changes caused by each employment scenario.

E22–E23 verify these dependencies. Full Services Australia calculators and statutory formulas have not been specified here. Show separately entered verified amounts or an explicitly incomplete household result until their complete rules are supported. Do not imply that individual take-home pay equals household disposable income.

## 15. Transition, exit, and uncertainty

Fields: notice period, final-pay amounts, unused leave/long-service balances, redundancy conditions, existing bonus/equity forfeiture, sign-on repayment, training/relocation repayment, gap between jobs, initial unpaid periods, relocation/setup cost, probation/fixed-term end dates, documented renewal terms, and explicit uncertainty scenarios.

The user selected one-off payments and costs separately from recurring annual totals, retaining gross and after-tax views. Separate existing assets and future conditional benefits too. E18 and E24 establish that exit components and entitlement depend on circumstances. Never convert a possible redundancy or promotion into guaranteed income. Dated job-transition comparisons remain outside the approved scope.

## 16. Qualitative differences

Optional descriptive fields: flexibility certainty, role fit, career/training opportunities, workload, location preference, travel burden, job security terms, culture, and personal constraints. They may influence a decision but have no universal monetary value. Only a clearly labelled user valuation may place them in a personal-value scenario; keep the underlying factual terms visible.

## 17. Reproducible outputs and saved results

Retain the input/profile/package versions, comparison period, applicable rule versions, enabled adjustments, calculation timestamp, completeness status, and component breakdown needed to reproduce a result. Derived outputs should include cash and non-cash subtotals, applicable tax components, super separately, out-of-pocket costs, travel/work time, optional personal-value adjustment, differences against the selected baseline, and each result's missing-input/evidence warnings.

Confirmed presentation: a side-by-side table with expandable breakdowns and differences against one user-selected baseline. Display dollars and cents while retaining the precision required by each calculation. A multi-job combined-income scenario needs separate authorisation and rules. No ranking weights or universal “best offer” score are approved.

## Data constraints to carry into specification

- Validate dimensions, currency, finite values, date order, non-overlapping effective periods, and referenced records. A negative amount is allowed only for a defined refund/adjustment field.
- Distinguish quote precision from mathematical precision; preserve source amounts and document every rounding boundary.
- A paid hour, worked hour, billable hour, commute hour, and constrained on-call hour are different measures.
- Item inclusion, reimbursement, expense replacement, and salary sacrifice need explicit links to prevent duplication.
- Taxpayer-level inputs must not drift between alternative packages without a visible scenario change.
- Store minimal personal information. Keep schema, rule, and package versions separate. Recalculate saved comparisons when linked inputs change or a verified rule correction ships; identify the changed rule and retain the versions used by the current result.
- This inventory supports requirement discovery. No individual has been assigned an income, residency, award, household, vehicle, working pattern, or tax outcome.

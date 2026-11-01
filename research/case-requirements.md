# Expanded salary comparison requirements

Prepared 23 October 2026 from the user's [case guide](../case.md), the existing
[field catalogue](comparison-fields.md), and the sources below. This is a researched proposal;
it does not settle the remaining product decisions or authorise salary-feature implementation.
The original guide remains intact. Its examples are a starting point, not a closed field list.

## What a comparison must explain

For each offer, show the quoted package, gross cash earnings, employer super, estimated tax
components, estimated cash received, job-related outlays, benefits, and optional travel-time
value separately. Every total must disclose its period, included components, input completeness,
and rule version. A larger headline package need not produce more available cash or a better
return on personal time. The user requires full remuneration, bank cash, super and tax views
with corresponding hourly rates throughout sal. Gross ordinary cash pay is not bank cash.
The package total covers remuneration only: pay, super and benefits. Employer-only costs such
as payroll tax and workers' compensation are outside scope. The user approved a standard
paid-hours rate using an editable 52-week conversion, plus separately labelled financial-year
calendar calculations for actual work, attendance and commuting. Exact numerator reconciliation
and tax allocation still require verification; the distinct denominators are confirmed.

Compare alternative offers over the same normal full year, using shared personal tax settings
with explicit per-offer overrides. Do not implement job start/end-date comparisons. Keep a saved
package distinct from a comparison's assumptions: changing a shared time valuation or vehicle
price should not rewrite the employer's offer. The user selected side-by-side comparison of
any chosen alternative offers. Concurrent-job groups are not part of this selected mode.
See the [confirmed product decisions](product-decisions.md).

## Changes needed to make the guide calculable

| Guide item                       | Expanded requirement                                                                                                                                                                                   | Reason                                                                                                                            |
| -------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------- |
| Salary and includes-super flag   | Preserve amount, currency, quoted pay unit, effective dates, inclusions, guaranteed cash, and each employer-super component. Allow unknown inclusion until clarified.                                  | A boolean alone does not resolve a quote that also includes bonuses, allowances, or benefits.                                     |
| Bonuses                          | Repeatable items with guaranteed/target/actual basis, fixed amount or evidenced formula, payout dates/frequency, eligibility, clawback, included-in-package status, and separate super classification. | A target bonus is contingent; payment timing can affect payroll withholding and the applicable rule year.                         |
| Weekly hours                     | Ordinary paid hours, actual worked hours, unpaid breaks/overtime, roster cycle, and dated changes.                                                                                                     | Paid, worked, billable, and commuting hours are different denominators.                                                           |
| Remote days per week             | Remote and on-site attendance within a defined roster, occasional site visits, partial days, multiple sites, and attendance exceptions.                                                                | Remote days alone cannot establish annual journeys.                                                                               |
| Daily travel duration            | Total return duration or distinct outward/return legs; minutes or hours explicitly selected; waiting, walking, transfers and parking access where relevant.                                            | Avoid doubling an already-return value or treating one hour thirty minutes as 1.30 hours.                                         |
| Daily travel distance “in hours” | Distance in kilometres, with an explicit one-way/return basis.                                                                                                                                         | The guide has a dimensional mismatch: hours measure duration, not distance.                                                       |
| Manual travel cost               | Select a measured fuel cost per kilometre **or** calculate it from consumption and fuel price. Add separately identified non-fuel costs.                                                               | Adding both fuel methods would count fuel twice.                                                                                  |
| ATO kilometre rate               | A financial-year rate selector with source and applicability. If used for comparison, label it a proxy and keep it separate from a deduction calculation.                                              | A tax-method rate does not prove actual expenditure or trip deductibility. See the [specialist review](ato/case-guide-review.md). |
| Fortnightly pay                  | Approved editable default; representative PAYG periods for each applicable rule period.                                                                                                                | A standardised fortnightly equivalent and a particular year's payroll are different results.                                      |
| Four weeks' annual leave         | Approved editable starting entitlement only where employment rules permit; separate entitlement, leave taken, opening balance, loading and extra/purchased leave.                                      | Four weeks is not universal, and leave entitlement does not establish how many commute days are avoided.                          |

The user confirmed support for 2025–26 and 2026–27, with 2026–27 selected by default.
New offers start with entered fuel/energy and other commuting expenses; the ATO kilometre-rate
comparison estimate remains an alternative. One-off payments and costs are shown separately
from recurring annual totals, with itemised gross amounts and a combined after-tax result.
Fuel/energy prices and vehicle consumption are shared, with explicit per-offer overrides.
Commute entry starts with total return-trip distance and time, with separate outward/return
entries available instead. Preserve the basis and avoid counting return totals or legs twice.
Initial tax calculations cover full-year Australian tax residents, all employee types and
sole-trader contracting. The user deferred contracting through their own company, partnership
or trust; broader entity candidates below remain research context. Employee wages paid by a
company and independently relevant other-income inputs are not excluded by that decision.
This is not a claim that all special resident circumstances are already verified.
Each new salary and bonus amount requires an explicit includes/excludes-super selection;
an unanswered setting remains unknown and blocks its dependent calculations.
New employee offers default employer super to the selected year's statutory minimum, allowing
higher contributions. Verify eligibility, earnings bases and limits separately; the default does
not resolve a quoted amount's super inclusion.
For hourly/daily employee quotes, annual earnings use the rate multiplied by explicitly entered
annual paid hours/days. Do not derive those quantities from attendance or leave entitlement.
Annual salary quotes retain their stated annual amount; the work calendar still drives attendance
and commuting independently.
The user approved editable fortnightly frequency and conditional four-week annual-leave
defaults. Defaults are not evidence of a particular worker's circumstances. The broader
research catalogue below retains dated-input and transition candidates; these do not expand
the approved normal-full-year scope. PAYG uses representative pay periods for each applicable
rule period; it does not promise a full dated deposit schedule. Within-year rule changes still
apply. The dated-event candidates below remain dependencies of specialised calculation paths,
not an approved payroll-calendar feature.

Leave entitlement does not imply leave taken. The user requires explicitly supplied leave
dates for leave adjustments to attendance and commuting; do not subtract a guessed annual
amount. Show when no leave dates are entered, and identify attendance totals as projections
from the entered calendar rather than evidence of actual attendance.

## Input groups and dependencies

These are logical requirements, not persisted field names or a database schema. Every material
quantity needs a unit, period, certainty state, evidence or user-estimate label, and inclusion
relationship. Use unknown, confirmed zero, not applicable, and excluded as distinct states.
The user permits incomplete offers to be saved as drafts. Mark missing inputs and affected
results unavailable without suppressing unrelated, correctly calculated results. Tax-free-
threshold claims are selectable for applicable payers within each alternative scenario.
Annual offer-tax attribution uses the confirmed incremental convention: total tax with the
offer minus total tax without it, with all linked eligibility and deductions recomputed.
The result is distinct from total personal tax and representative payroll cash.

| Group                  | Inputs to represent                                                                                                                                                                                                | Dependencies and checks                                                                                                                                         |
| ---------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Comparison basis       | Period start/end, financial year segments, annualised versus dated view, selected baseline, common taxpayer profile, included cost/value categories                                                                | Reject reversed dates and comparisons that silently mix periods or people.                                                                                      |
| Engagement             | Employee/contractor/entity arrangement, full-/part-time/casual where applicable, start/end, employer identity label, award/agreement or contract reference, work-base jurisdiction                                 | An ABN or job title alone does not establish every tax or super rule.                                                                                           |
| Recurring earnings     | Base amount/unit, ordinary hours, rate changes, overtime/penalty categories and rates, allowances, commissions, inclusion flags                                                                                    | Require governing terms; do not invent an overtime multiplier or universal annual hours.                                                                        |
| Non-recurring earnings | Sign-on, retention, performance bonus, termination and leave payouts, equity events, payment dates and conditions                                                                                                  | Keep first-year and recurring-year views separate.                                                                                                              |
| Super                  | Quote inclusions, statutory and additional contractual contributions, eligible earnings by component, employer aggregation, salary sacrifice, personal contributions, contribution dates and applicable cap inputs | Separate contribution obligation, employee-funded amounts, and amounts received by the fund. Full rule dependencies are in the ATO inventory.                   |
| Tax profile            | Residency/dates, relevant visa and age categories, other income, deductions, offsets, Medicare circumstances, hospital cover, spouse/dependants, study-loan inputs and reportable amounts                          | Conditional fields only; missing material information prevents a falsely complete result. No TFN or bank account is needed.                                     |
| Payroll                | Frequency, first payday, payment lag, ordinary and irregular pay events, withholding declaration inputs, deductions, reimbursements, year-to-date values if relevant                                               | Use dated withholding rules when estimating deposits; retain annual assessment separately.                                                                      |
| Work calendar          | Roster days/hours, paid/unpaid breaks, ordinary/overtime distinction, site per attendance period, remote arrangement and change dates                                                                              | Allow rotating or compressed rosters; a five-day week is not universal.                                                                                         |
| Time away              | Explicitly entered leave dates, paid/unpaid status, public holidays and substitutions, shutdowns, training/business travel                                                                                         | Overlapping exceptions remove an attendance period only once. Do not infer leave taken from entitlement.                                                        |
| Commute legs           | Mode, site, return/one-way basis, distance, elapsed time, frequency or attendance links, route evidence/date, shared-trip allocation                                                                               | No runtime mapping service. User-entered estimates remain estimates.                                                                                            |
| Vehicle energy         | Fuel type, L/100 km and AUD/L, or direct AUD/km; EV Wh/km or kWh/100 km, billed-energy basis, charging losses if not already included, home/public tariff shares                                                   | Mutually exclusive fuel modes; prevent duplicate charging-loss allowances. Shares must reconcile.                                                               |
| Transport outlays      | Fares/passes, parking, tolls, rideshare, maintenance/tyres per km and employer payments/reimbursements                                                                                                             | Entered vehicle comparison costs cover running costs and trip charges only. A pass need not vary linearly with attendance.                                      |
| Vehicle ownership      | Excluded from entered comparison costs: allocated insurance, registration and depreciation                                                                                                                         | The ATO alternative remains a broader vehicle-cost estimate by explicit user choice. Label its wider scope; do not invent a running-cost-only share.            |
| Remote-work costs      | Incremental power, internet/mobile, equipment, coworking, setup costs and employer provision                                                                                                                       | Distinguish existing personal spending from costs caused by the job. Tax treatment is a separate decision.                                                      |
| Other job costs        | Childcare/dependant care, meals above the selected baseline, uniforms/PPE, licences, memberships, professional insurance, training, relocation                                                                     | Record actual period and reimbursement; household subsidies require their own eligibility model.                                                                |
| Benefits               | Additive personal perk value and its period; separately evidenced tax/reporting values only where required by a tax calculation                                                                                    | Perks are additions only. No perk funding, salary reductions, employee contributions or deduction calculations. Personal value does not establish a tax amount. |
| Transition             | Employment gap, lost bonus/equity, leave payout, relocation, repayments/clawbacks, probation/fixed-term dates                                                                                                      | One-time transition effects must not repeat every year.                                                                                                         |
| Uncertainty            | Confirmed/estimated/contingent inputs, separately entered low/base/high scenarios, user-selected probability if used                                                                                               | No automatic probability, future fuel price, promotion, or investment return.                                                                                   |

The [broader catalogue](comparison-fields.md) retains specialised arrangements: labour hire,
apprentices/trainees, piecework, on-call work, business structures, foreign components,
parental benefits, long-service schemes, and household interactions. Recording an arrangement
does not establish that its complete calculation is supported. Unsupported combinations must
identify the missing rule or offer an explicitly partial result.

## Small calculation responsibilities

The user requires variables passed into small functions. Proposed calculation functions are
deterministic: explicit inputs and rule versions in; a result, breakdown, and completeness
status out. They do not read IndexedDB, UI state, the current date, or the network. Scheduling,
tax, expense, and comparison composition remain separate responsibilities.

| Responsibility               | Explicit inputs                                                                                                     | Output and invariant                                                                                         |
| ---------------------------- | ------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------ |
| Split a period               | Comparison dates and all relevant rule/roster/pay changes                                                           | Non-overlapping segments whose union is the original period.                                                 |
| Resolve attendance           | Roster, site/remote assignment, dated exceptions or declared attendance estimate                                    | Paid/worked/remote/on-site quantities and journey count; no automatic 52-week multiplier.                    |
| Resolve pay events           | Quoted rates/units, roster or paid quantities, contract terms and payment dates                                     | Guaranteed, variable and one-off gross cash events with inclusions reconciled.                               |
| Resolve super                | Classified earnings, contribution terms, employer totals and dated rule set                                         | Statutory/additional/sacrificed contributions separately; fail when the quoted package cannot be reconciled. |
| Assess annual liability      | Full taxpayer-year income components and verified tax rules                                                         | Income tax, offsets, Medicare, surcharge, loan repayments and applicable additional charges separately.      |
| Estimate withholding         | Actual pay event, declaration facts, prior events where required and applicable schedule                            | Estimated withholding for that event; never annual tax divided by a frequency count and relabelled payroll.  |
| Sum bank receipts            | Cash pay, reimbursements, withholding, employee cash deductions                                                     | Deposit estimate before personally paid job costs; do not also subtract final annual liability here.         |
| Calculate journey quantities | Explicit journeys/legs, distance and elapsed time                                                                   | Kilometres and hours; a return journey is counted once.                                                      |
| Calculate fuel cost          | Kilometres, L/100 km and AUD/L, or direct AUD/km                                                                    | One fuel amount from the selected mode.                                                                      |
| Calculate EV energy cost     | Kilometres, consumption, billed-energy/loss basis and tariff allocation                                             | Energy and cash cost with units reconciled.                                                                  |
| Calculate kilometre proxy    | Kilometres and selected sourced AUD/km reference                                                                    | Labelled comparison proxy; no implied deductible amount or measured cash cost.                               |
| Reconcile outlays            | Cost items, reimbursements, employer-funded items and inclusion links                                               | Cash paid personally, net reimbursements, and economic allocations separately.                               |
| Value time                   | Included commuting hours, toggle, each offer's salary-derived gross and after-tax cash hourly rates and their bases | Optional personal-value deduction; no custom rate and no change to tax or cash received.                     |
| Aggregate package value      | Explicit selected cash/non-cash/super/cost/time components                                                          | Explainable subtotals and total, with no duplicate component identities.                                     |
| Compare alternatives         | Completed scenario outputs, common period/basis and selected baseline                                               | Absolute differences, percentage differences where defined, and completeness mismatch.                       |

Use direct algebra only where its conditions hold. For example, dividing an inclusive quote
by `1 + super rate` requires evidence that the quote contains only cash and that proportionate
super, with the same applicable base and no binding cap or other component. Otherwise use the
classified components and contract terms. The specialist review records the legal boundary.

## Units and proposed metric definitions

Let `D` be applicable journey kilometres, `H` personal travel hours, `q` fuel consumption in
L/100 km, `p` fuel price in AUD/L, `f` a directly supplied fuel cost in AUD/km, and `v` the
selected personal hourly value. These equations are dimensional arithmetic, not tax rules:
- Consumption-based fuel cost: `D × q ÷ 100 × p`.
- Direct per-kilometre fuel cost: `D × f`, as an alternative to the preceding calculation.
- Maintenance allocation: `D × maintenance AUD/km`, only when not already included in another rate.
- EV energy at the stated measurement boundary: `D × Wh/km ÷ 1,000`; convert that boundary to
  billed energy only with an explicitly supplied efficiency/loss basis.
- Time valuation: `H × v` when enabled; disabling it changes economic value, not the cash ledger.
- Gross cash per paid hour: corresponding gross cash divided by the paid hours it represents.
- Cash after job outlays per worked hour: the selected net cash measure less personal job cash
  costs, divided by actual worked hours for the same period.
- Time-inclusive hourly comparison: selected value divided by worked plus included personal
  travel hours. Show this separately from subtracting a monetary time valuation; combining both
  intentionally requires an explicit label and decision to avoid presenting one penalty twice.

A zero-hour denominator produces “not applicable/unavailable”, not infinity. Percentage change
against a zero baseline is undefined; show the absolute difference. Do not label a partly known
cost total complete. Inputs and outputs are AUD only; foreign-currency entry and conversion are
excluded initially. Rule-specific precision and rounding boundaries remain to be verified before
numerical implementation. Salary and comparison totals display dollars and cents. Unit prices,
including fuel per litre and electricity per kWh, preserve entered precision beyond two decimals;
do not round their stored values to total-display precision. Display rounding does not establish
calculation precision.

## Results to retain and display

| Result                       | Required distinction                                                                                                                                  |
| ---------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| Quoted employer package      | Original offer versus reconciled calculated components.                                                                                               |
| Annual gross cash            | Guaranteed, target and actual/selected scenario; one-offs visible.                                                                                    |
| Annual super                 | Employer statutory/additional and employee-funded contributions; gross contributions versus fund-net amounts only if those taxes/fees are supported.  |
| Annual tax outcome           | Liability components, withholding credit, and possible reconciliation separately; loan repayments are not labelled income tax.                        |
| Pay deposits                 | Representative payroll deposits for each applicable rule period, including reimbursement and deduction treatment; no assumed annual deposit schedule. |
| Spendable cash               | Clearly selected assessment-adjusted or payroll-cash basis, less personal cash outlays.                                                               |
| Travel cost                  | Entered fuel/energy, running costs and trip charges, or the clearly labelled broader ATO estimate; personal time separately.                          |
| Total economic package value | Exact elected components; adding gross super to post-tax cash must be labelled a mixed-basis comparison, not after-tax wealth.                        |
| Effective rates              | Numerator, denominator, period and whether paid leave/commuting are included.                                                                         |
| Comparison differences       | Baseline and pair identified, changed inputs, absolute difference, valid percentage, and missing-input differences.                                   |

The user selected a combined after-tax package value: annual cash after assessed tax, supported
net super and personal perk values, with each component visible. Job costs and travel-time
adjustments remain separate. Keep cash before other payroll outflows distinct from cash
remaining after them; full remuneration retains those destinations. Missing super-tax evidence
does not establish zero tax or a fully net result.

Saved comparisons automatically recalculate when linked offers or shared settings change, as
selected by the user. Retain package/profile versions, rule versions and the basis used by the
current result; do not display an old result as current. A verified tax-rule correction in a new
application version triggers automatic recalculation and clearly identifies the changed rule.
JSON backups must preserve these relationships and pass the validation and
atomic-import requirements in AGENTS.md.
When backup records already exist, show the differences and let the user choose which version
to keep before applying the import. Do not silently overwrite local records or create duplicates.

The user selected a side-by-side comparison table with expandable breakdowns. Guaranteed and
target bonus/commission scenarios are shown separately; no probability is assumed. Baseline
differences use one offer selected by the user. Edits save automatically with saving/saved/error
status. Appearance follows system light/dark preferences with a manual switch, persisted in
IndexedDB.

On phones, the comparison remains a horizontally scrollable side-by-side table with metric
labels kept visible and accessible navigation to its breakdowns.
Use the user's selected compact, spreadsheet-like spacing throughout the interface, while
preserving readable labels, keyboard operation, focus visibility and the accessibility target.

Removing an offer archives it and allows restoration while preserving existing comparisons.
Work patterns use repeating rosters with dated exceptions, including rotating shifts. These
are user-approved choices; neither implies a fixed weekday schedule or a frozen comparison.
Offer entry uses one form with expandable sections, retaining autosave and visible draft status.
Invalid entries show validation errors and retain their last valid saved values. Other valid
edits continue to autosave only when the resulting stored offer passes validation, including
cross-field consistency. Saving those edits must not conceal the invalid field's unsaved state.

## Independent acceptance cases to prepare

These are future observable requirements, not a claim that executable calculator tests exist.

| Case                                                                                | Expected property                                                                                                    |
| ----------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------- |
| Equivalent salary quoted with/without super under a verified simple case            | Reconciled cash and employer super agree.                                                                            |
| Bonus included in headline package, then separately itemised                        | Total value does not increase merely because presentation changed.                                                   |
| Fully remote roster with no site visits                                             | No commute journeys; any declared remote-work costs remain.                                                          |
| Occasional visit during a remote arrangement                                        | Only the specified attendance creates journeys.                                                                      |
| Leave and a public holiday overlap                                                  | Attendance is removed once; payroll and accrual follow the applicable rules separately.                              |
| Return-trip versus two one-way legs with identical totals                           | Distance, time and cost agree.                                                                                       |
| Fuel amount supplied per km versus equivalent consumption/price                     | Fuel totals agree; only one mode is counted.                                                                         |
| Employer reimburses a recorded expense                                              | Personal net outlay changes once; taxable treatment follows its independently established classification.            |
| ATO-rate proxy selected                                                             | No fuel/maintenance duplicate; no automatic deduction, 5,000-km comparison cap, or cash-expense assertion.           |
| Time valuation disabled                                                             | Cash, tax and travel quantity remain unchanged; only the selected personal-value adjustment disappears.              |
| Same salary, different leave taken/attendance                                       | Cash and commuting effects follow their own inputs; leave is not automatically extra salary.                         |
| One-off bonus versus recurring bonus                                                | Second-year comparison does not repeat the one-off payment.                                                          |
| Comparison spans 30 June/1 July                                                     | Relevant quantities and rules are segmented rather than applying one year's table to all events.                     |
| Different payroll count in a dated year                                             | Do not infer a full-year deposit count from representative periods; standardised annual equivalents remain labelled. |
| Two alternative jobs versus two concurrent jobs                                     | Alternative offers are not summed; concurrent taxable income is assessed at the taxpayer level.                      |
| Missing fare, unknown super inclusion, zero hours, invalid number, broken reference | Result is incomplete or rejected as appropriate; missing is never silently zero.                                     |
| Identical package compared with itself                                              | Each comparable difference is zero.                                                                                  |
| Swap a pair's baseline                                                              | Absolute difference reverses sign; percentage denominators follow the chosen baseline.                               |

Financial boundary tests additionally require independently verified examples around every
supported bracket, cap, exemption, date boundary, and rounding rule. The ATO research gaps must
be closed for the particular path before it can be described as supported.

## Source checks for this expansion

Checked 23 October 2026; relevant body text retrieved, not search snippets:
- [Fair Work: annual leave](https://www.fairwork.gov.au/leave/annual-leave), “Who gets annual leave”,
  “How much annual leave”, and accumulation: national-system non-casual employees generally
  receive four ordinary-working weeks; qualifying shiftworkers can receive more. This supports
  conditional entitlement inputs, not a universal default or an assumption that leave is taken.
- [Fair Work: public holidays](https://www.fairwork.gov.au/employment-conditions/public-holidays),
  substitution and work-base sections: jurisdiction and substitutions matter. No calendar or
  universal annual holiday count was inferred.
- Rechecked both Fair Work pages on 23 October 2026 for the hourly-basis discussion: paid annual
  leave is time off with pay; public-holiday entitlements follow the work base and include distinct
  worked/not-worked cases. The user approved separate paid-hours, actual-work and commuting
  calculations after this discussion. The sources establish employment distinctions, not the
  application's numeric 52-week conversion convention, which is a user-approved design choice.
- [Green Vehicle Guide: how to guide](https://greenvehicleguide.gov.au/pages/ToolsAndCalculators/HowToGuide),
  information/fuel/charging sections: fuel uses L/100 km, electric consumption Wh/km; laboratory
  figures can differ from actual consumption. The site accepts distance and price inputs. Its
  example annual distance and prices are not sal defaults.
- [ATO specialist supplement](ato/case-guide-review.md) records tax/super/rate evidence and
  limitations. The [existing source register](sources/employment-and-costs.md) supplies the
  wider employment/cost dependencies; its original verification dates remain visible.

No actual contract, roster, commute, tariff, benefit valuation or personal tax profile has been
provided or validated. Remaining product choices include annualisation, time-rate formulas,
economic-value inclusions and uncertainty handling.
Full-year scope, shared personal tax settings with overrides and editable employment defaults
are confirmed, as are representative PAYG periods and separate time-inclusive hourly versus
monetary time-cost measures. All confirmed choices are recorded in
[product decisions](product-decisions.md).

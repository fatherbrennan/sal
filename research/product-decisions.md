# Product decisions

Confirmed by the user after the tooling checks on 23 October 2026.

The user subsequently requested removal of irrelevant form questions and explicitly approved
editable $0 defaults for optional other income, deductions and extra super in **new records**.
Existing saved values and blanks must remain unchanged. The [field audit](field-simplification.md)
records the implemented removals, conditional controls, model scope and compatibility safeguards.
The 25 October annual-leave implementation supersedes the earlier removal of unused leave metadata:
entitlement now supports a separate informational value, with explicit ordinary-pay facts and an
optional dated balance. See [the leave investigation and implementation](annual-leave-base-pay.md).

| Decision                   | Selected behavior                                                                                                              |
| -------------------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| Many-to-many comparison    | Compare any selected alternative offers side by side.                                                                          |
| Tax results                | Calculate annual tax liability and payroll withholding; show them separately.                                                  |
| Gross and after-tax values | Always calculate both, including hourly rates and commute-time valuations. Selecting a basis must not remove the other result. |
| Commuting-time valuation   | Enabled by default in new comparisons; users can disable it.                                                                   |

Supported financial years: **2025–26 and 2026–27**, with **2026–27 selected by default**.
Initially accept monetary inputs in **Australian dollars only**; no foreign-currency entry or
conversion-rate feature is approved. Monetary outputs remain AUD.
Comparisons model **normal full-year scenarios only**, without job start/end-date comparisons.
Personal tax settings are **shared across offers**, with explicit per-offer overrides.
Initial tax calculations cover **full-year Australian tax residents**. All employee types
remain in scope. The user selected **sole-trader contracting initially**, deferring
contracting through their own company, partnership or trust. Employee wages paid by a company
are not excluded, and independently relevant other-income inputs remain separate. Special tax
circumstances still require their own verified rules.
New packages default to **editable fortnightly pay** and **four weeks of annual leave where
employment rules permit**. Entitlement is separate from leave taken; pay frequency alone does
not establish pay dates or the number of deposits.

Commuting time uses **salary-derived hourly rates only**. The user's 23 October clarification
supersedes the earlier custom-rate option; no custom value or scope choice remains pending.
The implemented arithmetic and supported tax boundaries are recorded in [IMPLEMENTATION.md](../IMPLEMENTATION.md).

**Annual salary entry:** the user knows the annual package before the hourly rate. Accept that
annual salary, separately entered annual bonus, each amount's super-inclusion setting, super
terms and weekly hours; derive the hourly views. Do not require an hourly quote first. Base-only
and applicable bonus scenarios remain visible.

**Hourly/daily employee quotes:** annual earnings equal the quoted rate multiplied by explicitly
entered annual paid hours or days. Do not derive those paid quantities from the roster or assume
leave is taken. This is separate from financial-year attendance and commuting. Annual salary
quotes retain their stated annual amount; contractor revenue retains its approved entry methods.

**Super inclusion:** require an explicit includes-super or excludes-super choice for each new
salary and bonus amount. Neither is selected by default. Unknown inclusion must not become
false or support a falsely complete calculation.

**Bonus super control (24 October 2026):** one **Super on this payment** choice replaces the
separate eligibility and inclusion controls. Options: **Cash before tax, plus super**;
**Cash before tax and super combined**; **Cash before tax, no super applies**. The last option
records a confirmed exception, so an inclusion choice is unnecessary. New quote choices remain
unanswered. Existing saved facts and partial drafts survive; clearing the control makes both facts
unknown. Calculations, employer limits and the storage schema stay unchanged.

**Employer-super default:** new employee offers start with the selected financial year's
statutory minimum, with higher contributions editable. Check eligibility, earnings bases and
limits separately. This setting does not select includes/excludes-super for quoted amounts.

**After-tax commute-time rate (updated 26 October 2026):** use annual cash after estimated tax
plus super after ordinary contribution tax, divided by standard paid hours. Exclude personal
perks from this rate. Apply incremental offer-tax attribution and count personal transfers once.
Keep cash-only and representative payslip rates separately visible. This monetary time value
is an economic convention, not lost cash or a tax deduction. It supersedes the cash-only rate.
Salary-derived time valuations use **each offer's own rates**. Selecting a baseline controls
comparison differences; it does not substitute that offer's rates into the other offers.

**Value breakdown:** show full remuneration and where amounts go: bank cash, super and tax,
with corresponding hourly views throughout sal. The user clarified that bank cash means the
amount after relevant deductions, not gross ordinary cash pay. Annual assessed liability and
payroll withholding remain separate. The later incremental-tax and component-estimate approvals
govern the annual cash result. The user selected **remuneration only:
pay, super and benefits**. Exclude employer-only costs such as payroll tax and workers'
compensation; remuneration is not the business's complete employment cost.

**Combined after-tax package value:** the user selected a combined value from annual cash after
assessed tax, super after applicable contribution taxes and personal perk values, with all
components visible. Job costs and travel-time adjustments appear separately. Preserve the
distinction between cash before other payroll outflows and cash remaining after them; the full
remuneration reconciliation retains those destinations. A transfer is not automatically lost
value. Detailed accounting and tax evidence remain subject to the specialist boundaries.

**Travel-time measures:** show cash after job costs divided by work-plus-travel hours separately
from package value after subtracting a monetary travel-time cost. Do not apply both adjustments
to a single measure by default.

**Personal package priorities (25 October 2026):** the user approved leading with annual after-tax
package after job costs, then that value per worked-plus-commute hour. Keep annual cash after costs
and the monetary-time-adjusted package alongside them. The package includes assessment-adjusted
cash, supported net super and additive personal perk values; it is not spendable bank cash.
The hourly denominator uses roster work and commuting, excluding unpaid breaks. Its numerator
does not also deduct monetary travel-time value. Keep gross counterparts and all existing scenarios.
These are complementary comparisons, not a universal personal-value score. Leave entitlement and
unused balances remain separate information; only entered absences affect worked hours.

**Commuting-cost starting method:** entered fuel/energy and other expenses. The sourced ATO
kilometre-rate comparison estimate remains available as an alternative. It does not establish
actual expenditure or tax deductibility; do not add overlapping costs from both methods.

**Shared vehicle settings:** fuel/energy prices and vehicle consumption are shared across offers,
with explicit per-offer overrides. Identify which values are inherited; changes to shared values
recalculate dependent comparisons without replacing overrides.

**Commute entry:** start with total return-trip distance and time. Offer separate outward and
return entries as an alternative. Make the input basis explicit and count each quantity once.

**Entered vehicle costs:** running costs and trip charges only. The user declined an allocated
share of insurance, registration and depreciation. After reviewing the distinction, the user
explicitly retained the ATO-rate alternative as a **broader vehicle-cost estimate**. Label it
accordingly; it is not running-cost-only, and no invented ownership-cost share may be removed
from the published rate. Entered costs remain the default.

**PAYG presentation:** representative pay periods showing each applicable rule period. Do not
invent a pay-date anchor, annual deposit count or full dated payroll schedule.

**Saved comparisons:** automatically recalculate using the latest linked offers and shared
settings. Preserve the input and rule versions used by the current result. A verified tax-rule
correction delivered in a new application version also triggers automatic recalculation, with
the changed rule clearly identified. No historical-snapshot feature has been requested.

**Offer removal:** archive offers and allow restoration. Retain their records and links so
existing saved comparisons continue to work. Archiving is not deletion or a frozen snapshot.

**Hourly and attendance basis:** the user approved both, clearly labelled: a standard
paid-hours hourly rate using an editable 52-week conversion, plus financial-year calendar
calculations for actual work, attendance and commuting. Show worked-hours and work-plus-travel
rates separately. Paid leave does not itself create work or commute hours.

**Work patterns:** repeating rosters with dated exceptions, including rotating shifts. Resolve
attendance and commuting from those entries; do not assume a fixed Monday-to-Friday week.

**Public-holiday attendance:** choose for each offer whether rostered public holidays are
normally worked, then apply dated exceptions. Preserve applicable partial-day intervals and
location. Do not silently choose a worked/not-worked default or create work on an unrostered day.

**Leave taken:** do not assume annual leave is used every year. Entitlement does not reduce
attendance automatically; apply explicitly supplied leave dates. State when no leave dates have
been entered. Do not invent an annual leave-taken estimate or claim missing dates prove zero
actual leave. Attendance projections describe the entered calendar.

**Non-cash perks:** use personal value only; the employer's value is not expected to be known.
Do not require employer-value estimates for comparison. Clearly identify personal valuation in
package totals and keep tax/reporting amounts separate where calculations require them. An
unknown required tax amount must not be replaced with the personal value.

The user further clarified that perks are **additions only**. There are no perk salary
deductions, employee contributions, funding splits or related deduction calculations. Earlier
salary-sacrifice/perk-funding examples were explanations, not approved product behavior.
The entered personal value adds to the comparison; it does not determine statutory tax treatment.

**Money display:** salary and comparison totals use dollars and cents. The user explicitly
permits unit prices, such as fuel per litre and electricity per kWh, to retain entered precision
beyond two decimals. Do not round stored rates to match total-display precision. Preserve each
calculation's required precision and rounding independently of presentation.

**Backup conflicts:** preview differences when imported records already exist, and let the user
choose which version to keep before applying changes. Preserve the existing complete-import
validation and atomicity requirements. Do not silently overwrite or import duplicates as a
default conflict resolution.

**Incomplete offers:** permit saving drafts, flag missing inputs and show affected results as
unavailable. Unknown values are not zero; independently supported results remain available.

**Tax-free-threshold declaration:** let users specify which applicable employer/payer claims
the threshold within each alternative scenario. This affects withholding inputs; it does not
assign separate annual thresholds or itself attribute annual assessed tax to an offer.

**Annual tax attribution:** the user selected incremental tax: total annual tax with the offer
minus total annual tax without it. Recompute the valid counterfactual's eligibility, deductions
and linked circumstances. Keep total personal tax and representative payroll cash separate.
Unknown counterfactual inputs block the affected attribution rather than becoming zero.

**Uncertain earnings:** show guaranteed and target bonus/commission scenarios separately.
Do not invent a probability or treat target earnings as guaranteed income.

**One-off amounts:** show payments and costs, such as sign-on bonuses and initial equipment,
separately from recurring annual totals. Do not repeat them automatically or silently include
them in recurring figures. The requirement for gross and after-tax views still applies.
The user selected **itemised gross amounts and a combined after-tax result** for the one-off
group. No per-item allocation of annual tax is required or approved.

**Comparison interface:** a side-by-side table with expandable breakdowns. Show differences
against one baseline offer explicitly selected by the user.
On phones, keep the table horizontally scrollable with metric labels visible; preserve
accessible navigation and the same breakdowns.
The user selected **compact, spreadsheet-like spacing** to show more at once. Keep readable
labels, keyboard operation and focus visibility; the accessibility target remains unchanged.

**Offer entry:** one form with expandable sections for pay, benefits, work patterns and costs.
The approved autosave and draft-completeness behavior applies across those sections.

**Saving:** automatically save offer and settings edits, with clear saving, saved and error
status. A persistence failure must not be represented as a successful save.

**Invalid edits:** show a validation error and keep the last valid saved value. Do not persist
the invalid text or label the invalid edit saved. This does not remove support for incomplete
but valid drafts; missing required inputs still leave affected results unavailable.
Other valid edits continue to autosave when the resulting stored offer remains consistent.
Validate the proposed stored record, including related fields and retained values. A saved
status for those edits must not imply that the invalid field was saved.

**Conflicting edits:** when two browser tabs edit the same offer, show both versions and let
the user resolve the conflict. Do not silently replace one version with the other.

**Application updates:** notify the user when an update is ready. Let them reload after changes
are saved; do not automatically reload or discard unsaved edits. Once the updated app is active,
the approved rule-correction recalculation behavior still applies.

**Storage protection:** request browser persistent storage after the first successful save.
Report the actual result; a request is not a grant, and protection does not replace JSON backups.

**Contractor revenue:** support an explicit annual revenue estimate or a rate multiplied by
entered billable hours/days. These are alternative ways to supply revenue, not additive amounts.
Do not substitute employee paid hours for billable capacity or infer planned personal super.

**Appearance:** follow the system light/dark setting by default, with a manual switch. Persist
preferences in IndexedDB under the approved browser-storage boundary.

These decisions refine the [expanded case requirements](case-requirements.md). Remaining
calculation definitions, rounding, validation, storage and interface
decisions still gate their corresponding salary-feature implementations.

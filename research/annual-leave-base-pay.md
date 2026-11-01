# Annual leave and base-pay investigation

Checked 25 October 2026. The user subsequently approved implementation and multiple independent
accuracy reviews. The investigation below describes the pre-change application; implemented behavior
is recorded separately here. The original export and live browser data were not changed.

## Implemented behavior

The later [comparison redesign](comparison-redesign-2026-10-26.md) merges leave into the main
table and adds a separately labelled hypothetical net cash-out of annual entitlement. The
statements below about a separate table and unavailable net payouts describe the earlier milestone;
actual cash-out eligibility and termination calculations remain unsupported.
- **Base pay only · recurring** recomputes supported tax from isolated base remuneration. Existing
  guaranteed/target and one-off scenarios remain available. Recurring perks, costs and entered fixed
  contributions remain in the scenario; separate bonuses and commissions are removed.
- Five new rows expose annual base cash, base super, selected bonus cash/super and base cash per
  standard paid hour. Embedded/unknown quote composition and capped allocations remain guarded.
- **Paid annual leave** follows the work pattern in the offer editor. The comparison has a separate
  side-by-side leave table and recursively linked equations. The original model capped ordinary
  hours at 38. The [26 October correction](leave-value-2026-10-26.md#employer-leave-terms-fresh-review-and-confirmed-update)
  instead accepts employer-confirmed paid hours per leave week, separate from comparison hours.
- The original salary confirmation was replaced on 26 October by the user-approved shared default:
  an editable normal-base-salary estimate using 52 weeks. Explicit choices and blanks are preserved.
  Other pay bases use a confirmed hourly rate. Loading supports none, a confirmed percentage of
  calculated base leave pay, or an established hourly amount; award rules are not inferred.
- An unused balance requires entered hours and an effective date. Blank is unknown; an explicit
  zero is retained. Balances do not accrue automatically and are valued at the currently entered
  rate, not an assumed historical or future termination rate.
- Leave values do not enter remuneration, attendance, annual tax, super or bank receipts. Net
  cash-out/termination payouts remain unavailable. Salary already funding leave is not counted twice;
  hourly/daily earnings retain their explicitly entered annual paid quantities.
- Base-only tax does not reuse a full-offer taxable-income override, non-single HELP-family answer
  or potentially bonus-linked reportable super as established base-only facts. Independent supported
  components remain visible. Final assessed-tax precision remains unavailable.
- Existing schema-2 backups remain readable. New leave facts have no invented defaults. Export rule
  metadata is `2026-10-25.1`; calculation history identifies `2026-10-25-components-1`.

Independent review passes found and corrected stale scenario-specific tax facts, a null-comparison
error in capped base-super allocation, loss of independently known zero base super, below-minimum
NES weeks, indistinguishable offer names in leave equations, and disclosure state lost during edit
navigation. Numeric substitutions now mark display rounding with `≈`; exact equations stay unchanged.
Verification results are recorded in [IMPLEMENTATION.md](../IMPLEMENTATION.md).

## Finding

Keep the current scenario-average hourly calculations. Add an explicit base-pay comparison and a
separate paid-annual-leave summary. A bonus-inclusive hourly average is not the annual-leave pay
rate. Four weeks of entitlement does not establish leave taken, an unused balance or an annual
cash payout.

Three fresh-context specialists independently reviewed employment entitlements, ATO treatment,
and the calculation/UI implementation. The parent validated the user's export and reproduced
current calculations with controlled, in-memory variations. Prior research documents were not
treated as proof of current behavior.

## Export and reproduced amounts

The inspected file was `C:/Users/brandon.lepore/Downloads/output.json`, exported at
`2026-10-25T02:26:19.179Z`, schema 2, rule metadata `2026-10-23.2`.
It contains a comparison, two offers and vehicle settings. It has no saved profile/preferences
records. Under the current fallback defaults, `ekg` resolves to full-time, 52 conversion weeks,
four weeks of annual leave and 12% statutory employer super. These inherited values are not
explicitly stored on that offer. Restoring into different shared settings can change inheritance.

Explicit `ekg` facts:
- Base quote: AUD 105,000, including super; 40 standard paid hours weekly.
- Additional earnings: AUD 10,000, including super; guaranteed, recurring, ordinary taxable,
  employer-super eligible, additional to the base quote. The saved label is "$10,000 annual salary".
- Five eight-hour remote roster days; no entered leave dates or leave balance.

Current model arithmetic, using its 12% split below the applicable contribution limit:

| Quantity                                        | Calculation              |     Result |
| ----------------------------------------------- | ------------------------ | ---------: |
| Annual base cash, before tax                    | 105,000 / 1.12           | $93,750.00 |
| Annual additional bonus cash                    | 10,000 / 1.12            |  $8,928.57 |
| Standard paid hours                             | 40 × 52                  |      2,080 |
| Base cash per standard paid hour                | 93,750 / 2,080           |     $45.07 |
| Salary and bonus cash per standard paid hour    | (115,000 / 1.12) / 2,080 |     $49.36 |
| Salary and bonus package per standard paid hour | 115,000 / 2,080          |     $55.29 |

These are comparison conversions. Neither the entered 40 hours nor the base quote establishes the
legal ordinary-hours salary composition. The base cash is before salary sacrifice and tax, not bank
cash. Using a pre-tax salary does not mean adding employer super to the amount paid for leave.

The current representative ordinary payroll independently produces $3,605.77 gross base cash per
fortnight and $45.07 per allocated standard paid hour. Its cent-rounded period conversion is not a
legal leave-rate calculation.

Controlled checks passed:

| Variation                                      | Observed current result                                                                                |
| ---------------------------------------------- | ------------------------------------------------------------------------------------------------------ |
| Guaranteed versus target                       | Identical metrics: this bonus is guaranteed in both scenarios.                                         |
| Remove the separate bonus in memory            | Base cash hourly conversion becomes $45.07; stored offer is untouched.                                 |
| Change entitlement from four to six weeks      | Every comparison metric remains unchanged.                                                             |
| Add a zero-work leave exception on 1 July 2026 | Modelled calendar hours fall from 2,016 to 2,008; salary and 2,080 standard paid hours stay unchanged. |

The baseline calendar is a roster projection with no leave dates entered. It is not proof that
2,016 hours will actually be worked or that no leave will be taken.

## What the application exposed before implementation

- [Comparison metrics](../src/lib/calculations/comparison-metrics.ts): package and gross-cash hourly
  values divide the selected scenario's totals by standard paid hours. They include this bonus.
- [Scenarios](../src/lib/components/comparison.svelte): guaranteed/target and recurring/including
  one-offs; no base-only scenario. Guaranteed does not mean salary only. The approved base-only
  requirement in AGENTS.md is therefore incompletely exposed.
- [Remuneration](../src/lib/calculations/remuneration.ts): separate `baseCash` supplies representative
  payroll. Embedded extras and capped inclusive quotes require care; this value alone is not proof
  of a legal ordinary rate. The internal `baseHourly()` helper actually divides combined remuneration
  by paid hours; it is used only by tests, not the visible comparison.
- [Tax breakdown](../src/lib/components/tax-breakdown.svelte): "Representative ordinary payroll"
  shows "Gross base cash per fortnight". "Representative payroll per standard paid hour" contains
  "Gross cash per hour". That is the existing $45.07 route, but its label needs base-pay context.
- [Equation graph](../src/lib/explanations/pay-sections.ts): current popups expose selected base and
  bonus inputs. They explain the aggregate; they cannot establish missing leave entitlement facts.
- [Work pattern](../src/lib/components/work-pattern.svelte) → "Public holidays and leave" exposes
  entitlement and dated exceptions. Shared entitlement is in Defaults → Work pattern. Source bindings
  and engine results were checked; this investigation did not verify those paths in a browser.
- [Calendar](../src/lib/calculations/calendar.ts): dated exceptions affect attendance. Entitlement
  itself affects neither attendance nor pay. A `leave` exception is not a paid-annual-leave ledger:
  it lacks specific leave category and paid/unpaid status, accrual, opening balance, loading and
  payout data.

## Employment and tax evidence

The SA private-sector preset normally belongs to the national Fair Work system. The export does
not establish the employer's sector, award or agreement. [SA Legal Services Commission](https://lsc.sa.gov.au/handbook/ch18s04s01.php).

The ordinary NES leave-payment basis excludes bonuses. Awards or agreements may require other
payments or loading; a guaranteed bonus or the app's "ordinary taxable" classification does not
establish that basis. A salary can also cover other entitlements, so all base-quote cash cannot
automatically be classified as ordinary-hours pay. [Fair Work payment guidance](https://www.fairwork.gov.au/leave/annual-leave/payment-for-annual-leave),
[annualised salaries](https://www.fairwork.gov.au/pay-and-wages/minimum-wages/annualised-wages-and-salaries),
[Fair Work Act, ss16 and 90](https://www.legislation.gov.au/C2009A00028/2026-07-07/2026-07-07/text/original/epub/OEBPS/document_1/document_1.html).

Fair Work's NES guidance distinguishes ordinary hours from additional work. Its five-eight-hour-day
example has 38 ordinary hours plus two overtime hours. This does not establish a universal cap on
paid leave hours: the current AFP award specifies 38 ordinary hours plus at least two additional
hours and four weeks as 160 leave hours (clauses 7.1 and 15.1). Do not derive either 152 or 160 leave
hours solely from this dump's 40 comparison hours. Use confirmed employer leave terms and preserve
the comparison denominator. The user approved this correction on 26 October 2026.
Qualifying shiftworkers can receive five weeks; casual employees do not receive NES paid annual
leave. [Annual-leave fact sheet](https://www.fairwork.gov.au/tools-and-resources/fact-sheets/minimum-workplace-entitlements/annual-leave),
[paid leave and ordinary hours](https://library.fairwork.gov.au/viewer/?es_p=10038547&krn=K600382),
[AFP award, consolidated 1 July 2026](https://awards.fairwork.gov.au/MA000142.html).

Entitlement accumulates and unused balances carry forward. Termination generally requires paying
the unused balance at the applicable leave-payment amount, including applicable loading; transfer
of employment can instead preserve the entitlement. In-service cash-out has separate conditions;
it is not an automatic yearly payment. [Annual leave](https://www.fairwork.gov.au/leave/annual-leave),
[payment on termination](https://www.fairwork.gov.au/leave/annual-leave/payment-for-annual-leave),
[cash-out conditions](https://www.fairwork.gov.au/leave/annual-leave/cashing-out-annual-leave),
[Fair Work Act, ss90–94](https://www.legislation.gov.au/C2009A00028/2026-07-07/2026-07-07/text/original/epub/OEBPS/document_1/document_1.html).

Leave taken, leave loading, in-service cash-out and termination payout need distinct tax/super
treatment. The ATO specialist directly checked the 2026 withholding instrument: Schedule 7 handles
termination unused leave, with accrual-date and termination-reason distinctions. It must not be
silently routed through the ordinary-bonus calculation. [Instrument, Schedules 1, 5 and 7](https://www.legislation.gov.au/F2026L00716/asmade/2026-06-12/text/original/pdf).

The specialist also checked the July 2026 SGAA definition of qualifying earnings. OTE is only one
pathway; an OTE exclusion alone must not be generalised to every expanded employee category.
Direct current ATO Table 13 retrieval was blocked, so universal termination-leave QE treatment is
not recorded as verified. This does not block clearer comparison labels; it blocks unsupported
payout calculations. [SGAA, ss6 and 10A](https://www.legislation.gov.au/C2004A04402/2026-07-01/2026-07-01/text/original/pdf).

## Strict recommendation

These are proposed changes requiring implementation approval, not changes made by this investigation.
1. Preserve aggregate hourly metrics and identify their selected earnings scenario. Add **Base cash
   per standard paid hour**, a salary/bonus/super breakdown, and a true base-only comparison. Do not
   substitute guaranteed for base-only. An inclusive quote containing other payments requires a
   verified decomposition; deleting bonus rows alone does not isolate its base salary. Recompute
   annual tax and linked deductions for the base-only scenario, retaining gross/net views; never
   prorate a bonus-inclusive net result or substitute representative payroll withholding.
2. Add a compact **Paid annual leave** summary near pay/work information and in comparison breakdowns:
   entitlement weeks; established ordinary weekly hours; applicable ordinary cash rate; loading
   status/basis; and optional unused-balance hours with an effective date. Reuse existing entitlement
   and shared-default controls. Missing legal pay basis, balance or loading must stay unknown.
   Apply NES leave only to eligible employee arrangements; use part-time employees' own ordinary
   hours. Casual and sole-trader offers must not inherit NES paid leave. Separately established
   contractual benefits require their own basis.
3. Separate the comparison conversion from legal leave pay. Use the existing 40-hour field for the
   comparison; establish ordinary hours/rate independently for leave. Do not automatically classify
   overtime, RDO hours, allowances, super or bonuses as ordinary leave pay. Do not default loading
   to 17.5% or infer that loading is absent because no amount was entered.
4. Show an optional **Nominal salary value of annual entitlement** only under an explicit, supported
   ordinary-salary model. If $93,750 is wholly ordinary annual cash pay, four weeks corresponds to
   `93,750 × 4 / 52 = $7,211.54`, excluding the bonus. This is an illustration of the entitlement's
   salary value, not a verified accrued balance or additional annual cash. Never mix a 40-hour pay
   divisor with 152 leave hours without establishing the salary components.
5. Keep leave valuation outside additive annual package/cash totals. Salary already funds paid leave
   when taken. Do not add four weeks again, change the paid-hours divisor from 52 to 48, assume all
   entitlement is taken, or infer a zero unused balance from missing dates. Different entitlements
   should remain visible even when no leave dates are known.
6. Preserve dated attendance exceptions, but require their leave type/payment meaning before using
   them in an annual-leave balance. Public holidays and other leave cannot automatically consume
   annual leave. A future balance ledger must handle applicable accrual, opening balance, taken leave,
   cash-out, adjustments and effective dates; the smallest initial feature can use an explicitly
   supplied current balance instead of inventing a ledger history.
7. Show a known unused balance's gross value separately, using its established current pay/loading
   basis. It is not automatically current-year income. Cash-out and termination are distinct optional
   events, outside the existing normal-full-year comparison; implement their after-tax/super results
   only after their inputs, rules and product scope are approved. Until then, show affected net values
   as unavailable, not a flat percentage of an unrelated annual take-home rate.
8. Extend the existing clickable equations and source links. Keep meaningful names such as
   `annual_base_cash`, `base_cash_per_standard_paid_hour`, `ordinary_weekly_hours`,
   `ordinary_base_cash_per_hour`, `annual_leave_entitlement_weeks`, `unused_annual_leave_hours`
   and `annual_leave_loading_amount`. Renaming the test-only `baseHourly()` helper is optional
   cleanup, not a prerequisite for the visible improvements.

## Required implementation checks

- Verify the salary/bonus/super splits and all three hourly values above independently.
- A bonus change changes the aggregate but not an established separate base or leave rate.
- Target/one-off/embedded bonuses, mixed quote bases and capped super cannot fabricate a base-only split.
- Base-only net results recompute tax and linked deductions; they are not proportional allocations.
- Four/six weeks change entitlement information without adding salary or assuming leave dates.
- Employment eligibility and part-time ordinary hours govern leave; casual/contractor defaults cannot create NES entitlements.
- The 40-standard-hour case must not silently establish 160 NES leave hours or rewrite saved hours.
- Unknown balance/rate/loading remain unavailable; explicit zero remains distinct.
- Leave taken, public holidays, unpaid absence and other leave retain separate effects.
- Cashed-out/termination amounts never become recurring ordinary bonuses or automatic annual income.
- New fields preserve strict imports, inherited defaults, existing saved values and offline operation.
- Keyboard-accessible equations explain units, exclusions and source context for every new result.

## Verification and cleanup

Windows x64, Bun 1.4.4. The temporary `research:leave-audit` task validated the actual backup and ran
independent cent-level amount checks plus entitlement/scenario/dated-absence comparisons. Its
initial exact floating-point equality was corrected to compare the independently expected currency
amount at cent precision; the financial engine was unchanged. Scoped Biome and tooling type checks
passed. The independent product reviewer ran three existing focused calculation tests with eleven
assertions, all passing.

The temporary task and script were removed. The original export was never edited, uploaded or
imported into browser storage. No test server or browser was started. Only this research record and
its index entry remain. No production/UI changes, deployment, full-suite rerun or contract/payslip
verification occurred. The exact legal rate, actual balance and payout remain unverified.

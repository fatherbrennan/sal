# Tax review of the case guide

Reviewed 23 October 2026, Australia/Adelaide; clock observation `2026-10-22 20:41:14 UTC`.
Scope: the original [case.md](../../case.md), existing [tax facts](facts.md), and targeted primary
research. This supplements the guide; it does not approve salary-feature implementation or defaults.
No personal financial data was submitted.

Later decisions on 23 October: normal full-year alternative offers, shared personal tax settings
with explicit offer overrides, representative pay periods for each applicable rule period, and
editable fortnightly pay. Four-week annual leave defaults apply only where permitted. Remuneration
includes pay, super and benefits; employer-only payroll tax/workers' compensation are excluded.
Show bank, super and tax destinations/rates separately, retaining loan and gross/net fund-flow
distinctions. Show travel-inclusive hourly value separately from a monetary travel-time deduction.
These decisions supersede payroll-calendar candidates below; [year readiness](year-readiness.md) and
[ordinary evidence](ordinary-calculation-evidence.md) retain unresolved numerical definitions.
Standard paid-hours rates use an editable 52-week conversion alongside labelled financial-year
calendar calculations for work/attendance/commuting. Saved comparisons recalculate from linked
offers/settings. Later confirmed: new application versions auto-recalculate saved comparisons
for verified tax-rule corrections and identify the changed rule. Guaranteed and target
bonus/commission scenarios remain separate. Initial calculations use full-year residents and
approved incremental annual attribution; see [attribution](annual-cash-and-tax-attribution.md).

## Confirmed findings

### CG01 — The 2026–27 kilometre rate is available

The published rate is **AUD 0.91/km**, for **1 July 2026–30 June 2027**. The current determination's
body and in-force/latest-version status were retrieved again. This confirms existing F13/T31–T32;
no replacement rate or future-year assumption is needed. [Determination, s6][rate]
[Register status][rate-status]

The ATO explanatory statement describes a car-expense deduction method using eligible business
kilometres, limited to 5,000 km under that method. Its rate reflects average operating costs including
fuel, registration and maintenance. It is neither a measured fuel price nor a dollar-for-dollar tax
refund. The statement identifies a temporary uplift confined to 2026–27; a later rate must be verified
separately. [ATO explanatory statement, paragraphs 2, 6–13][rate-es]

Three quantities therefore need separate representations:

| Quantity                                   | Proposed representation                                                                 | Boundary                                                                                                                          |
| ------------------------------------------ | --------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| Actual or forecast commuting cost          | Distance, consumption and expense components with their units                           | A personal economic estimate; no deduction follows from entering it.                                                              |
| Economic estimate using the published rate | Distance multiplied by a labelled selected-year proxy                                   | A proposed comparison convention, not measured expenditure. The tax-method kilometre cap does not establish an economic-cost cap. |
| Car-expense tax deduction                  | Separately eligible business kilometres, vehicle/method eligibility and applicable rate | Requires legal eligibility and evidence; it must not inherit commuting kilometres automatically.                                  |

The manual guide needs fuel consumption to derive AUD/km from AUD/litre. Direct AUD/km and a
litres-based estimate are alternative representations of the same fuel cost, not two amounts to add.
Combining a whole-vehicle proxy with fuel or maintenance already represented by that proxy would
double count. These are dimensional/accounting observations, not tax eligibility decisions.

**Scope resolved 23 October 2026:** entered running costs/trip charges remain the default,
excluding allocated insurance, registration and depreciation. The user expressly retained the
ATO proxy as a **clearly labelled broader estimate**. The current Act's s28-25(5) note includes
those fixed costs in the operating-cost basis, alongside fuel/maintenance.
[ITAA 1997, C268, s28-25][car-basis]
This BODY evidence means the full ATO proxy cannot be described as running-cost-only. No verified
ownership-cost component split was obtained; do not invent one. No vehicle-method preference
remains pending. AUD-only input is confirmed. Tax deductibility remains separate from either
economic-cost method.

The guide's line 13 describes **distance in hours**. Distance needs a length unit such as kilometres;
duration needs a time unit. Both entries currently describe a return journey, so a second automatic
doubling would be incorrect for those stated inputs.

### CG02 — Super-inclusive quotes require a breakdown

The current SG Act remains compilation C78, effective 1 July 2026. Sections 6, 10A and 17A establish
OTE, qualifying earnings, salary-sacrifice adjustments, no duplicate counting, an annual
employer-specific maximum base and the 12% charge percentage. The retrieved HTML includes the
formula descriptions. [SG Act][sg] [Current register][sg-status]

An `includes super` flag describes a quote. It does not determine whether each bonus/payment belongs
in qualifying earnings, the employer's contractual contribution basis, or how a cap affects that
quote. The bonus's purpose, ordinary-hours relationship, payment date and contract evidence remain
necessary. Detailed bonus classification remains unresolved; search-index summaries were not
accepted as a current ruling.

**Conditional algebra only:** if a quote contains exactly cash `C` plus employer super `S`, and its
confirmed terms are `S = C × r`, then `C = quote ÷ (1 + r)` and `S = quote − C`. This is an accounting
identity, not a universal SG algorithm. Caps, excluded components, fixed super amounts, benefits and
different contribution bases invalidate that simplified premise. Apply it independently to a salary
or bonus only when that component satisfies the premises.

Payday Super applies using the relevant payment/QE day from 1 July 2026, including payment for earlier
work; old quarters have transitional rules. Keep employer obligation, employer payment and fund
receipt distinct. Complete timing exceptions remain in R06. [Existing F07/T16–T18](facts.md#f07--employer-super-and-contractors)

### CG03 — Annual liability is not the bank-deposit total

The 2026 PAYG instrument commences 1 July 2026. Schedule 1 has its own periodic formulas and rounding,
and explicitly addresses years containing **27 fortnightly payments**. Schedule 5 covers qualifying
bonus/commission/arrears payments; a single-pay-period payment and WHM payments can require different
schedule treatment. [PAYG instrument, Schedules 1 and 5][payg]

Proposed output boundaries:
- **Annual liability estimate:** the supported year's income tax, offsets and levies, with loan
  repayments and additional super taxes shown separately rather than hidden inside “tax”.
- **Payroll net cash:** representative period cash less modelled withholding and applicable payroll
  deductions, with reimbursements and other cash adjustments separately classified.
- **Actual annual bank-pay total:** would require the dated payroll cash flows. The selected
  representative-period model does not establish that total or an actual payment count.
- **Annual reconciliation:** a separate refund/additional-payment estimate where sufficient inputs
  exist. Withholding and assessed liability must not both be deducted from the same cash total.
- **Employer super and economic/time value:** separate from bank pay.

Declaration settings, other income, applicable rule periods, salary sacrifice, loan withholding,
deductions and reconciliation scope still need explicit values. Alternative offers are not summed
as concurrent jobs. Existing F05/F06/F08/F10 explain why one salary figure cannot supply the tax
context. Withheld tax is part of gross cash, not another remuneration amount to add.

### CG04 — Four weeks is conditional

Fair Work's national-system guidance gives full-time and part-time employees four weeks based on
ordinary hours; casual employees do not receive that NES entitlement. Awards/agreements can provide
more, and qualifying shiftworkers can receive additional leave. Accrual and leave actually taken are
separate. [Fair Work: annual leave][leave]

The guide's four-week suggestion cannot establish an entitlement for every supported employment
type or jurisdiction. Required context includes employee/contractor status, applicable employment
system, award/agreement, ordinary hours and additional entitlements. The existing [E07 evidence](../sources/employment-and-costs.md#e07--annual-leave)
remains applicable.

For comparisons, entitlement, opening balance, accrued leave, planned leave taken, unpaid absence,
cash-out and termination payout are separate candidate fields. Commuting frequency follows actual
attendance assumptions, not automatically annual leave entitlement. Where an annual cash salary
already pays for leave periods, adding the same paid leave as extra cash would double count.

## Additional fields to retain as candidates

These refine [fields.md](fields.md); they are proposed representations, not an approved schema.

| Area                        | Candidate fields needed to resolve the guide                                                                                                                                                                                                                           |
| --------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Rule selection              | Australian income year, effective payment dates, rule version, source, verification status; explicit handling when a requested year's rate is unavailable.                                                                                                             |
| Each salary/bonus component | Quote amount/unit, inclusive/exclusive/unknown super treatment, cash/super breakdown, purpose, entitlement/payment period, payment dates, guaranteed/contingent status, QE/OTE classification and evidence.                                                            |
| Employer super              | Statutory versus contractual amount/basis, contribution rate or fixed amount, year-to-date employer QE/base usage, eligibility/exemptions, sacrificed amount, employer payment and fund receipt dates.                                                                 |
| Payroll                     | Applicable rule period, pay frequency, representative period gross cash, declaration/schedule settings, loan withholding, extra withholding, pre/post-tax deductions, reimbursements and reconciliation inputs. Full dated payroll calendar is outside selected scope. |
| Travel                      | Mode/vehicle, return versus one-way, distance km, duration hours, attendance dates, litres/100 km or km/litre, AUD/litre or direct AUD/km, maintenance/other cost components, source and inclusions.                                                                   |
| Tax travel                  | Separately eligible business kilometres, purpose/evidence, ownership/lease status, method/year and complete eligibility; no automatic link from commute cost to deduction.                                                                                             |
| Leave/attendance            | Employment system/type, instrument, ordinary-hours pattern, entitlement, actual/planned paid and unpaid absence, public holidays, location and changes during the year.                                                                                                |
| Effective hourly values     | Editable 52-week paid-hours conversion and financial-year work/attendance calendar, with separately labelled work-plus-travel and monetary-time measures. Numerator definitions and valuation precision still need resolution.                                         |

## Required future verification cases

These are test requirements, not executed tests. No salary calculation implementation was added.
Expected numeric fixtures must be independently checked after applicable scope and rounding are
settled, using the mandatory write-tests skill.

| ID / level                    | Inputs or boundary                                                                             | Observable requirement / remaining dependency                                                                                                            |
| ----------------------------- | ---------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- |
| CG-T01 / unit                 | 2026–27 versus a year with no verified rate                                                    | Select 0.91 AUD/km only for its verified year; no silent carry-forward. Unsupported-year presentation needs an approved policy.                          |
| CG-T02 / unit and integration | Eligible business km around 5,000; separately identical commute km                             | Enforce the tax-method limit without treating it as an economic distance cap or granting commute eligibility. Full method eligibility remains R11.       |
| CG-T03 / unit                 | Direct AUD/km versus the same fuel cost derived from consumption; return-trip inputs           | Preserve units; do not count equivalent fuel inputs or return legs twice. Input-mode conflict handling needs approval.                                   |
| CG-T04 / unit                 | Inclusive/exclusive quotes under the stated simple premises                                    | Cash plus super reconstructs the same quote. Capped, fixed, mixed or unclassified quotes must not use that simple rule silently.                         |
| CG-T05 / unit                 | Employer annual base before/at/after its limit; overlapping QE categories; sacrificed super    | Verify the statutory cap, single counting and sacrifice treatment independently. Test contractual extra super separately.                                |
| CG-T06 / unit and integration | Applicable representative rule periods; single-period and multi-period bonuses; WHM            | Choose the evidenced schedule. Do not promise 26 actual deposits or treat annual liability divided by frequency as verified withholding.                 |
| CG-T07 / unit                 | Otherwise matching full-time, part-time, casual, contractor and qualifying shiftworker records | Apply only verified entitlement rules; preserve ordinary hours and applicable instrument. Unsupported regimes remain explicit.                           |
| CG-T08 / integration          | Entitlement unchanged but leave taken/attendance changes                                       | Alter attendance-driven costs without duplicating paid salary or treating unused entitlement as time absent. Approved calendar semantics still required. |

## Evidence and remaining gaps

- Reused current local F07/F10/F13 and E07; freshly retrieved the rate, explanatory statement,
  Fair Work body, current SG Act and PAYG instrument above.
- The ATO transport ruling's [print endpoint][transport] still returned HTTP 403. Detailed commute
  exceptions and method eligibility remain unresolved; selecting an economic proxy proves neither.
- The ATO course pages for [QE calculation][qe-course] and [extended due dates][due-course] returned
  video wrappers. Search snippets contained more detail than the retrieved pages; that additional text
  is not body-verified and was excluded.
- Remaining decisions: supported tax/withholding regimes, quote breakdown rules,
  exact annualisation/rounding, treatment of an unavailable year and effective-hourly definitions.
  Selected years, representative PAYG and conditional frequency/leave defaults are recorded above;
  they do not settle those remaining dependencies.
- Project reads and status inspection used named `bun run` scripts. Only ATO research documents
  were changed. No temporary fixtures, processes, personal records or application behavior were
  created. Remaining research blockers continue in [blockers.md](blockers.md).

[rate]: https://www.legislation.gov.au/F2026L00785/asmade/2026-06-23/text/original/epub/OEBPS/document_1/document_1.html
[rate-status]: https://www.legislation.gov.au/F2026L00785/asmade
[rate-es]: https://www.legislation.gov.au/F2026L00785/asmade/2026-06-23/es/original/pdf
[car-basis]: https://www.legislation.gov.au/C2004A05138/2026-10-01/2026-10-01/text/original/epub/OEBPS/document_1/document_1.html
[sg]: https://www.legislation.gov.au/C2004A04402/2026-07-01/2026-07-01/text/original/epub/OEBPS/document_1/document_1.html
[sg-status]: https://www.legislation.gov.au/C2004A04402/latest/text
[payg]: https://www.legislation.gov.au/F2026L00716/asmade/2026-06-12/text/original/epub/OEBPS/document_1/document_1.html
[leave]: https://www.fairwork.gov.au/leave/annual-leave
[transport]: https://www.ato.gov.au/law/view/print?DocID=TXR%2FTR20211%2FNAT%2FATO%2F00001
[qe-course]: https://smallbusiness.taxsuperandyou.gov.au/super-guarantee-employer-obligations/how-to-calculate-super-guarantee
[due-course]: https://smallbusiness.taxsuperandyou.gov.au/super-guarantee-employer-obligations/extended-due-dates

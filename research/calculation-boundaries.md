# Calculation boundaries

Status: proposed model constraints, not an approved schema or implemented calculator. Read with [confirmed decisions](product-decisions.md), [comparison fields](comparison-fields.md), [ATO research](ato/README.md), and [employment evidence](sources/employment-and-costs.md). Original source review: 22 October 2026; aligned with confirmed user decisions on 23 October 2026.

## Distinct results

| Result                         | Intended meaning                                                                               | Required boundary                                                                                                          |
| ------------------------------ | ---------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------- |
| Quoted package                 | What the employer or client says the offer includes.                                           | Preserve the quote and its inclusions; do not infer that every component is additional.                                    |
| Gross cash earnings            | Cash remuneration before tax withholding, with sacrifice and inclusions explicitly reconciled. | Separate contracted earnings, amounts redirected by sacrifice, and resulting cash payable.                                 |
| Employer super                 | Contributions attributable to the engagement under the applicable rule and contract.           | Identify contributions included in a headline package versus additional contributions; separate employee-funded sacrifice. |
| Non-cash benefits              | Benefits provided, valued using the user's personal value.                                     | Do not require or assume employer value. Keep independently required tax/reporting values separate.                        |
| Estimated annual tax outcome   | Applicable assessment liabilities and offsets for the taxpayer and income year.                | Keep tax, levies, loan repayments, fund taxes, and withholding reconciliation individually visible.                        |
| Cash available after job costs | Cash received less the applicable cash liabilities and incremental cash outlays.               | Do not subtract both tax withholding and the same final annual liability.                                                  |
| Time cost                      | Explicit time quantity multiplied by the selected valuation rate.                              | It changes the economic comparison, not the bank balance or taxable income automatically.                                  |
| Economic comparison value      | A disclosed combination of cash, selected non-cash values, and time costs.                     | State all included terms and prevent duplicate benefits or expenses.                                                       |
| Effective hourly value         | A selected numerator divided by explicitly defined hours.                                      | Disclose whether hours are paid, worked, billable, commuting, or otherwise constrained.                                    |

An all-in quoted package is a source input. A calculated total requires a component reconciliation. If the quote does not explain whether super, loading, allowances, or bonuses are included, the result is unresolved rather than guessed. E03–E04 establish why packaging and annualised wage inclusions need explicit treatment.

## Alternatives and simultaneous income

Comparing alternative offers and combining concurrent jobs are different operations. A pairwise comparison may hold the same taxpayer circumstances constant and substitute one offer. A concurrent-work scenario must aggregate the relevant income and costs for that taxpayer before applying applicable annual tax rules. Summing isolated take-home estimates is not an acceptable substitute for an aggregate assessment.

The user approved incremental package-attributable tax: calculate total annual tax with the offer minus tax without it, recomputing linked eligibility and deductions in both valid scenarios. Disclose that this is a comparison convention, not a separate ATO assessment for that job. A standalone result must disclose included other income and circumstances. Never assume other income is zero because it was not entered.

The user selected side-by-side comparison of alternative offers. Concurrent-job portfolios and household comparisons are not part of this selected comparison mode. Other income still forms part of the relevant taxpayer's tax circumstances; do not silently aggregate people or treat alternative offers as simultaneous earnings.

## Dates, intervals, and amounts

- Preserve each amount's currency, unit, frequency, applicable rule period, relevant payment timing, and whether it is gross, net, inclusive, or exclusive of a stated component. The approved comparison is a normal full year, not a job start/end-date comparison.
- Keep actual receipts for a selected period distinct from an annualised run rate. A one-off joining bonus must not recur automatically.
- Annual employee salary quotes retain their stated annual amount. Hourly/daily employee quotes use the rate multiplied by explicitly entered annual paid hours/days; attendance and leave entitlement do not supply those quantities. Contractor revenue retains its approved annual-estimate or rate-times-billable-quantity alternatives.
- Preserve relevant within-year FBT, roster, price and rule boundaries. Do not use one global year label for incompatible calendars or infer a full dated payroll schedule from representative pay periods.
- Derive commuting and working quantities from the applicable schedule and attendance assumptions. Do not silently multiply every week by 52 or assume every weekday is worked.
- Keep entitlement accrual, leave taken, unused balance, and cash payout distinct. Paid leave already included in annual salary is not another salary payment. E07–E10 and E18 identify relevant conditions.
- Define money precision and rule-specific rounding before implementation. Presentation rounding must not determine tax rounding or conceal an unreconciled total.
- Show guaranteed and target bonus/commission scenarios separately. Do not invent probabilities or treat contingent target earnings as guaranteed income.

## Expense and benefit reconciliation

Every expense requires an identity, payer, recipient, period and inclusion relationship. A
reimbursement may offset a related expense; it must not also be counted as an independent
saving. Perks follow the user's later, simpler rule: entered personal values are additions only.

Personal value may be replacement cost, a separately stated willingness to pay, or another explicit method. A benefit valued through avoided spending must not also reduce that same spending a second time. Use personal value for the approved comparison; keep any independently required tax/reporting value separate. Do not require or invent the employer's cost.

Do not implement perk salary deductions, employee contributions or funding calculations. Earlier
research on salary packaging remains factual context, not permission to add that behavior to
perks. Any separate super contribution or statutory tax input retains its own verified treatment;
an additive personal value does not establish a tax exemption. Employer-only costs remain outside
the confirmed remuneration scope.

Entered vehicle comparison expenses are limited to running costs and trip charges. The user
excluded allocated insurance, registration and depreciation. The ATO-rate alternative is
explicitly retained as a broader vehicle-cost estimate. Label it accordingly; do not invent
a running-cost-only share. A tax deduction method or rate is not evidence of actual expenditure.

## Commute arithmetic specimen

These are synthetic inputs solely to expose units. They are not defaults, typical Australian prices, a tax deduction, or a verified quote.

| Input                                | Synthetic value |
| ------------------------------------ | --------------- |
| Return commuting trips in the period | 100             |
| Total distance per return trip       | 40 km           |
| Fuel use                             | 8 L per 100 km  |
| Fuel price                           | AUD 2 per L     |
| Total time per return trip           | 1 hour          |
| Annual gross full remuneration       | AUD 80,000      |
| Annual assessment-adjusted cash      | AUD 60,000      |
| Annual standard paid hours           | 2,000 hours     |

Distance: `100 × 40 = 4,000 km`.

Fuel volume: `4,000 × 8 / 100 = 320 L`.

Fuel cost: `320 × 2 = AUD 640`.

Travel time: `100 × 1 = 100 hours`.

Salary-derived gross rate: `80,000 / 2,000 = AUD 40 per hour`.

Salary-derived after-tax cash rate: `60,000 / 2,000 = AUD 30 per hour`. These annual amounts are supplied synthetic inputs, not a verified tax calculation or assumed relationship between gross and net.

Optional time costs: gross `100 × 40 = AUD 4,000`; after-tax cash basis `100 × 30 = AUD 3,000`. Both use this offer's own rates; there is no custom-rate input.

Combined fuel and time costs: gross basis `640 + 4,000 = AUD 4,640`; after-tax cash basis `640 + 3,000 = AUD 3,640`. Only AUD 640 is a cash expense in this specimen. Parking, fares, maintenance, charging and other applicable running costs are absent from the specimen, not asserted to be zero for a real user. Ownership allocations are outside the selected comparison scope. Disabling time valuation leaves the fuel expense unchanged.

The arithmetic was independently checked by direct calculation during research. No application or executable test exists yet. E20–E21 support the need for real vehicle and energy inputs rather than adopting illustrative defaults.

## Completeness and uncertainty

### Annual-package hourly specimen

The user supplied a hypothetical AUD 100,000 super-inclusive salary, AUD 10,000 super-inclusive
annual bonus and 40 hours per week. This is a requirements example, not a stored personal offer.
Using the approved 52-week conversion gives `40 × 52 = 2,080` standard paid hours.
The base inclusive-package rate is `100,000 / 2,080 = AUD 48.08/hour`; including the full stated
bonus gives `110,000 / 2,080 = AUD 52.88/hour`, rounded for display.

Only if each quote contains exactly cash plus employer super at 12% of all that cash, with
eligibility established and no limiting cap, the inclusive cash split is `quote / 1.12`.
The resulting base cash/super hourly amounts are AUD 42.93/AUD 5.15; including the full bonus,
AUD 47.22/AUD 5.67. These are pre-tax cash and gross super contributions. The specialist
verified the 12% standard percentage for both selected years; the [case-guide review](ato/case-guide-review.md#cg02--super-inclusive-quotes-require-a-breakdown)
records the split's limits. The arithmetic was checked independently of application code.
Calculate from unrounded values; independently rounded displayed components can differ by a cent.
Bonus payment frequency does not supply missing guarantee, tax or SG classification, and
after-tax cash still needs a valid tax profile. No complete tax fixture is claimed.

### Availability

Unknown, not applicable, measured zero, estimated, and verified values are distinct states. An unknown cost cannot become zero during aggregation. A result with unresolved material inputs must identify them and state whether the displayed amount is partial, a bounded scenario, or unavailable.

Compare packages using the same selected period, taxpayer baseline, currency basis, time-valuation method, and treatment of one-off items unless the user deliberately changes and can inspect those choices. Changes to assumptions or rule data must invalidate dependent cached results.

Preserve input evidence and calculation explanations. Saved comparisons automatically recalculate from the latest linked offers and settings; verified rule corrections also trigger recalculation and identify the changed rule. Retain the input and rule versions used by the current result. Do not present a stale result as current or infer a historical-snapshot feature.

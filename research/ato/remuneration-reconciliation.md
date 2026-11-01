# Employee remuneration reconciliation

Research checked **23 October 2026**; scope revision clock **2026-10-23 02:07:55 UTC**.
Perks are approved as simple additions at personal value. The user also approved a combined
after-tax cash/super/perk value with each component shown and job costs/time adjustments separate.
The detailed accounting equations and optional transfer inputs below remain proposals using known
amounts, not a new tax engine or blanket approval of every input/output feature.
The [confirmed decisions](../product-decisions.md) control over older research wording.
Scope: ordinary employee scenarios in 2025–26/2026–27. Initial product coverage retains all
employee types and sole-trader contracting; own-entity contracting models are deferred.

## RR01 — Evidence boundaries

- **BODY, T53 refreshed:** valid salary-sacrificed super is employer-contributed, additional to
  SG, excluded from employee assessable pay/PAYG, and reportable. Personal contributions are
  separate; their deduction needs eligibility and a valid acknowledged notice. See the
  [ATO contribution guide, pp5–8](https://caat-p-001.sitecorecontenthub.cloud/api/public/content/0-7350b1a9-c870-4d9b-b4dc-1506974b918e), salary-sacrifice section dated 21 April 2026.
- **Research-only packaging evidence, BODY T25:** packaging must precede earning the income. Its current benefit
  discussion also identifies the 1 April 2027 change; do not apply one historical exemption
  throughout 2026–27. [ASIC salary packaging](https://moneysmart.gov.au/work-and-tax/salary-packaging),
  with enacted application already recorded in T07/F09. Detailed salary packaging is outside
  the confirmed additive-perks behavior; it does not create perk funding fields or deductions.
- **BODY, current ITAA 1936 C193, 1 October 2026:** s23L excludes qualifying fringe benefits
  from assessable income. Section 51AH restricts deductions for qualifying reimbursed expenses,
  with specific conditions/exceptions. Neither provision makes every payment labelled a perk or
  reimbursement tax-free. [Sections 23L and 51AH](https://www.legislation.gov.au/C1936A00027/2026-10-01/2026-10-01/text/original/epub/OEBPS/document_1/document_1.html).
- **Existing bounded evidence:** [super flows](super-money-flows.md) separate entitlement,
  receipt, fund contribution tax and fund-paid personal tax; [annual attribution](annual-cash-and-tax-attribution.md)
  separates approved incremental assessment from withholding. Their unresolved eligibility,
  timing and precision limits still apply. Personal benefit value cannot supply an unknown tax
  value, reportable amount or fund-tax adjustment.

ATO TR 92/15 and the employer FBT guide returned HTTP403 on this follow-up. Their indexed
summaries were not used as verified classification instructions. No complete reimbursement,
FBT or sacrifice classifier is asserted here.

## RR02 — Additive perks and proposed monetary inputs

Every amount needs currency, period, scenario, source and inclusion links. Annual amounts and
representative-period amounts are separate inputs. A known zero differs from unknown.

**Confirmed perks rule:** add the user's personal perk value once. The perks section does not
calculate funding, salary sacrifice, employee contributions, fees or deductions. No funding
choice remains pending. Adding a perk does not change cash pay, super or payroll deductions.

Statutory taxable/reportable amounts, where required, belong to the separately evidenced tax
profile. Never derive them from personal value or automatically add V to taxable income.
The economic addition does not establish tax-free treatment. Missing required tax inputs can
leave affected tax/net outputs unavailable while the independently known gross value remains usable.

| Symbol       | Meaning                                                                                                                                                                                                                                              |
| ------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `G`          | Cash remuneration before valid super sacrifice and withholding, excluding employer super, additive non-cash perks and separately recorded reimbursements. Preserve base, allowance and guaranteed/target earnings components.                        |
| `S`          | Known cash remuneration validly redirected to super.                                                                                                                                                                                                 |
| `E`          | Employer-funded super, statutory and contractual amounts distinguished; excludes S. Known inclusive-package amounts are split once, not added again.                                                                                                 |
| `D_s`, `D_o` | Explicit after-tax personal-super transfer and other non-perk payroll outflows, respectively. Preserve their destinations; tax deductibility is a separate question.                                                                                 |
| `V`          | Total entered personal value of additive non-cash perks for the matching period, counted once. No funding or deduction calculation applies.                                                                                                          |
| `R`, `J`     | Separately funded work-expense reimbursement paid to the employee and linked employee-paid job expenses. J excludes costs already removed in D. Tax treatment is separately established.                                                             |
| `J_o`        | The independently identified job-cost portion already paid through D_o. This is a bookkeeping subset, not another cost, a tax deduction or an assumption that every payroll outflow is a job expense.                                                |
| `T`          | Signed incremental annual personal liability from the valid with/without-offer assessments, with income tax, levies and loan repayments visible separately. No inference from a marginal rate.                                                       |
| `W`          | Verified representative payroll withholding for that rule period, with its components; not T divided by pay periods.                                                                                                                                 |
| `F`, `U`     | Where established on a matching basis: fund contribution tax/adjustments F, and the signed fund-payment allocation U of incremental personal liability T. F excludes U. Missing payment-source or fund facts block dependent net cash/super outputs. |

An after-tax deduction is a cash destination, not automatically lost remuneration. `D_s` moves
value to super; `D_o` may move cash to savings. Record these destinations rather than hiding
them in tax or subtracting them from full remuneration. Add an external personal contribution to this bridge
only if expressly included, with its cash destination recorded once.

This R/J branch covers separately funded work-expense reimbursements. Salary-packaged personal
bills, direct employer settlement and mixed arrangements are outside this bounded branch.
They do not create an additive reimbursement or a perk-funding calculation here.

## RR03 — Reconciliation and proposed numerators

Set `C = G − S`, `D = D_s + D_o`, and `S_g = E + S + D_s`.
These are amount identities after classification, not formulas for taxable income or SG.

**Confirmed display/composition, 23 October:** show annual cash remaining after assessed
liabilities + matched net super + personal perk value, and show each component. In this proposed
ledger that chosen sum is `A + S_n + V`. Where D_o exists it is the value **after those other
payroll outflows**, not full net remuneration. Preserve the prior full-worth reconciliation
separately as `(A + D_o) + S_n + V`. Transfers are destinations, not automatically value lost.
This decision does not approve a new transfer-entry feature or resolve tax/fund eligibility.

| Output                                                         | Proposed formula and label                                                                                                                                                                                        |
| -------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Gross cash payable                                             | `C`; show G and the separate super redirection S.                                                                                                                                                                 |
| Gross super allocation                                         | `S_g`, with E/S/D_s separate. Allocation does not establish fund receipt in the same year.                                                                                                                        |
| Gross full remuneration at personal value                      | `P_g = G + E + V = C + E + S + V`. Add personal perk value once. Neither D_s nor D_o reduces this gross numerator.                                                                                                |
| Before-tax value after specified other payroll outflows        | `P_adj = P_g − D_o = C − D + S_g + V`. D_o is disclosed by destination; it may be a savings transfer, not an economic loss. Keep this adjusted value separate from full remuneration.                             |
| Annual assessment-adjusted cash remaining                      | `A = C − D − (T − U)`. After recorded payroll outflows, including any J_o already within D_o; excludes R and further costs J. U must be established or explicitly not applicable. This is not a deposit forecast. |
| Annual assessment-adjusted cash before other personal outflows | `A + D_o`. Restores other non-super payroll destinations for the full-worth reconciliation; personal super D_s remains in super. This is not bank cash or an additional receipt.                                  |
| Matched estimated net super allocation                         | `S_n = S_g − F − U`, only with a supported, matching contribution/tax basis. Keep actual receipt-year super separately.                                                                                           |
| Net full remuneration at personal value                        | `P_net = (A + D_o) + S_n + V = P_g − T − F`. Preserve other payroll outflows as separate destinations. This includes super and perks; it is not after-tax cash. Unknown F blocks this fully net result.           |
| Combined after-tax value after other payroll outflows          | `P_adj_net = A + S_n + V = P_adj − T − F`. Represents the approved cash/super/perk sum in this ledger. Where D_o exists, distinguish it from full net remuneration. Unknown F blocks this fully net result.       |
| Annual cash after job expenses                                 | `A + R − J`. Equivalently deduct linked unreimbursed costs `J − R` from A, but never do both.                                                                                                                     |
| Representative bank receipt                                    | `C_p − D_p − W_p + R_p`, using that period's actual or explicit modelled amounts. A reimbursement paid outside payroll is a separate receipt, not part of the payroll deposit.                                    |

For a fully specified annual allocation, `P_g = A + S_n + V + D_o + T + F`. This is a **personal-value
identity**, not proof that the employer spent P_g. Personal perk value is not employer cost.
The original inclusive quote remains a separate source amount; do not force it
to match by inventing employer perk cost or inserting tax a second time.

Shared other income affects T; it supplies no additional offer cash. Do not put spouse income
into A. Funding a personal liability from super changes cash/super allocation, not the total
liability. Unknown U can leave A/S_n unavailable even where `P_g − T − F` is independently known.
U must use the same valid with/without-offer attribution basis as T; an actual fund release from
one scenario cannot stand in for that difference. R and J also need matching periods and scope.

Gross/net package views must show benefits alongside bank, super and tax; those three monetary
destinations alone cannot represent non-cash personal value. Actual bank cash can include R,
but R is not remuneration in this bounded branch. An avoided expense valued in V must not also
appear as a separate saving or reimbursement. Do not deduct a payroll-funded cost again in J.

**Cost bookkeeping:** full remuneration restores D_o, so its job-cost adjustment must remove
`J + J_o` once. Cash A and the chosen combined value P_adj_net already remove J_o through D_o;
their further cost adjustment removes only J. Thus full net value after job costs is
`P_net + R − J − J_o`, whereas the chosen combined value after further job costs is
`P_adj_net + R − J`; cash remains `A + R − J`. Savings transfers are not J_o. Show which costs
were already deducted and link each reimbursement/cost once. These identities neither establish
tax deductibility nor authorise extra input features. Unknown cost classification stays unknown.

## RR04 — Hourly and commute interface

Each numerator retains its name and period when divided by hours. The approved denominators
remain distinct: standard paid hours from the editable weekly-hours × 52-week conversion;
worked hours from the entered repeating roster and dated exceptions; and worked plus commute
hours. The week multiplier is editable. Missing/zero denominators cannot produce a valid rate.

The user selected **both** salary-derived travel-time rates: gross full remuneration including
super and personally valued perks, and after-tax cash excluding super. Do not reopen that
choice or substitute net full remuneration for cash. Under the confirmed additive-perks rule,
the proposed gross numerator is `P_g = G + E + V`. Super sacrifice changes a destination;
perks add personal value without a funding deduction. P_adj remains a separate adjusted row.

| Rate                                 | Formula and selected use                                                                                                                                                                             |
| ------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Gross full-remuneration rate         | `P_g / H_paid`, using annual standard paid hours. D_o does not reduce it.                                                                                                                            |
| Annual assessment-adjusted cash rate | `A / H_paid`. The user selected this after-tax CASH rate for commute-time valuation.                                                                                                                 |
| Representative payroll cash rate     | `(C_p − D_p − W_p) / H_paid,p`, using matching standard period hours and that period's applicable withholding rules. Keep separately visible; it does not drive the selected commute-time valuation. |

Neither cash numerator includes super, non-cash perks or expense repayments. A bank deposit
containing R_p remains visible separately. P_net/P_adj_net may have their own clearly labelled
package rates, but neither can supply the after-tax cash rate. Never invent a deposit count.

Keep cash after job costs per work-plus-travel hour
`(A + R − J) / (H_work + H_travel)` separate from monetary time deductions. Calculate gross
and cash-based time costs using their respective annual rates × matching annual travel hours.
The user selected each offer's **own** salary-derived rates. Derive both rates from that offer's
amounts and standard paid hours; do not substitute the baseline offer's rates. Representative
payroll results retain each applicable rule period separately.

The proposed gross package after job costs and monetary time cost is
`P_g + R − J − J_o − gross_time_cost`.
A net full-package counterpart may use `P_net + R − J − J_o − cash_time_cost`, explicitly including
super and perks; its time rate still comes from cash. A cash-only counterpart uses
`A + R − J − cash_time_cost`. Do not also divide these time-deducted values by work-plus-travel
hours by default. Entitled leave creates neither extra salary nor commute hours.

## RR05 — Independent arithmetic checks and remaining scope

Synthetic annual amounts: `G=100,000; S=5,000; E=12,000; D_s=1,000; D_o=200;
V=4,500; T=20,000; U=0; R=600; J=1,600`. T/E/U are stipulated component inputs,
not calculated tax/SG findings. Independently checked: C **95,000**, D **1,200**, gross super
**18,000**, P_g **116,500**, P_adj **116,300**, A **73,800**, cash after job expenses **72,800**.
The perk adds 4,500 without reducing pay; the unrelated 200 payroll outflow remains its own
destination. It does not reduce full remuneration. Unknown F leaves fully net super/package unavailable.
No contribution receipt date or tax value is inferred.

Separate representative specimen: `G_p=4,000; S_p=200; D_s,p=40;
D_o,p=10; W_p=700; R_p=60`, all R paid with this payroll. C_p **3,800**, D_p **50**, bank
receipt **3,110**. W is a supplied arithmetic input, not a verified payslip at that gross amount.
Representative remuneration cash excludes the 60 expense repayment: **3,050**. This specimen
has no assumed connection to the annual one or annual deposit count.

Only this reconciliation and its arithmetic were reviewed. Any separately required statutory
tax-profile amounts, payment-source allocation and complete net-super treatment remain factual
dependencies, not perk funding questions. Additive personal-value perks and combined after-tax
cash/super/perk display with components are confirmed; job costs/time remain separate. Both rate
bases and their origin are resolved: each offer's gross full remuneration
and annual assessment-adjusted cash, divided by its standard paid hours. The detailed accounting
conventions and connected equations above remain proposals for review. No app, tests or tooling changed.

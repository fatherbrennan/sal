# Annual cash and tax attribution

Decision recorded **23 October 2026**: the user approved incremental annual tax attribution and
initial calculations for full-year Australian tax residents. Preserve gross/net, bank/super/tax and annual/PAYG
views. [Medicare evidence](medicare-and-mls-evidence.md) shows why shared income and spouse
circumstances can change an offer scenario's assessed tax without becoming cash from that offer.

## Verified boundaries

[T02 ss4-10/15][assessment] calculates income tax from the person's annual taxable income and
offsets. It does not assign the entire ordinary liability to one salary package. [T22 Schedule 1][payg]
calculates periodic withholding from payment/declaration inputs. [T46][mls] distinguishes annual
MLS from employer withholding. These support separate outputs; they do not prescribe sal's
package-attribution convention.

**Confirmed user requirement, 23 October:** let the user choose which income/payer claims the
tax-free threshold. This is a payer-specific **PAYG declaration setting**. [T52, NAT 3093 Q5][declaration]
describes its effect on withholding and generally permits one payer, with a low-total-income
exception. T22 uses different claim/no-claim scales. Under T02 ss4-10/15 and T01's resident
rates, annual assessment combines assessable income and deductions; the annual threshold is not
separately assigned to each payer. This choice therefore does **not** select incremental,
proportional or another annual tax-attribution convention. Alternative offers remain separate
scenarios; a threshold choice in each alternative does not mean concurrent claims.

Incomplete drafts are approved: flag missing inputs and leave affected results unavailable.
Whole-person cash summaries remain optional proposals. The separate annual choice is incremental
tax attribution; payer-specific threshold selection does not replace it. Initial scope covers
all employee types and sole-trader contracting, subject to verified treatment. Own-entity
contracting models are deferred; resident status does not resolve special regimes.

| Quantity                           | Defensible meaning and required inputs                                                                                                                                                                                                                                                                                               |
| ---------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Representative payroll bank cash   | Cash payable for that period after modelled PAYG, valid salary sacrifice and other payroll deductions, plus separately classified reimbursements/adjustments. Gross cash must be reduced by sacrifice only once. It excludes shared other income, employer SG and noncash benefits. It is an estimate, not proof of actual deposits. |
| Whole-person annual assessed tax   | All supported personal income/deduction/offset/levy inputs in that alternative-offer scenario; separate income tax, Medicare, MLS, loan obligations and additional super taxes. Spouse income affects relevant tests without becoming the employee's taxable income.                                                                 |
| Proposed whole-person cash summary | Optional proposal, not approved functionality: annual personal cash receipts less defined annual liabilities and cash outflows. Taxable income cannot establish cash receipts; reinvestment, noncash assessable amounts and deductible expenses can make them differ.                                                                |
| Offer-attributable annual cash     | Uses the approved incremental-tax convention, with valid counterfactuals and separately classified cash flows. Subtracting all personal tax from offer cash misattributes tax on shared other income. This must never be called payroll bank cash.                                                                                   |
| Remuneration and economic value    | Employer pay, super and benefits; job costs/time adjustments separately. Other personal income and spouse income are not employer remuneration. Noncash benefits and super are not bank receipts.                                                                                                                                    |

An annual assessment view must not subtract both annual liability and PAYG from the same cash.
PAYG is a payment/credit towards assessment; a separate reconciliation compares the supported
liability with relevant credits. The representative-period model cannot establish a real year's
deposit total, all credits, or a timed refund. See [CG03](case-guide-review.md#cg03--annual-liability-is-not-the-bank-deposit-total).

**Combined display approved, 23 October:** show annual cash after assessed liabilities + net
super + entered personal perk value, with all components and separate job-cost/time adjustments.
Under [RR03's proposed ledger](remuneration-reconciliation.md#rr03--reconciliation-and-proposed-numerators),
this is `A + S_n + V`, the value after other payroll outflows when D_o exists. Preserve full
net remuneration separately as `(A + D_o) + S_n + V`; label A as cash remaining and A + D_o as
cash value before those other personal outflows. Neither is representative bank receipts.
Restoring a savings transfer for full worth does not create extra income. Voluntary super and
fund-paid personal tax stay allocated once across cash/super; reimbursements remain separate.
Job costs already paid through D_o are removed once from restored full value, but not removed
again from A-based results. This approves the combined display/composition, not new transfer
features, every RR03 equation or an assumed tax/fund amount. Perks remain additions only.

## Approved incremental convention

Let `S` be a complete shared personal context and `J` one alternative offer. Let `T(S + J)` be
the supported annual assessed tax vector, with each component shown separately. `T(S without J)`
must be a valid counterfactual, not the same taxable income minus one gross salary number.

`Incremental tax from offer J = T(S + J) − T(S without J)`.

Recompute deductions, offsets, standard-work-deduction eligibility, levy/MLS tiers and other
dependencies in both scenarios. Removing a job can remove linked deductions or other conditions.
Unknown counterfactual inputs make attribution unavailable; they do not become zero.

Under the **approved** convention, annual incremental offer cash starts with offer cash and
subtracts its incremental annual tax, with salary sacrifice, loan repayment and other cash
deductions separately classified. It is an annual comparison measure, not the employer's
withholding or a statutory allocation of tax. An offer can change a tax charge on other income
when it crosses a threshold; multiplying offer cash by one marginal bracket rate is insufficient.

Each liability or contribution is applied once. If a displayed liability vector includes a loan
repayment or additional super tax, its separate breakdown is not another deduction. A super-funded
tax payment must not also reduce bank cash. [Super money flows](super-money-flows.md) preserves
the payment-source and gross/net contribution distinctions; their missing inputs cannot be inferred.

Preserve the personal annual tax context alongside required offer gross/net and bank/super/tax
views. A whole-person cash summary and cash bridge remain **optional proposals**, not approved
requirements. If approved, a bridge could reconcile shared-baseline cash with the offer's
incremental contribution, **only when both cash definitions and all baseline inputs reconcile**.
Other taxable income alone does not establish baseline cash; never assume equal cash receipts.

Comparing offers A and B can also show `T(S + B) − T(S + A)`, with each complete scenario
recomputed. This difference does not require labelling either offer's absolute tax allocation.
If personal overrides differ, label it a scenario difference. A change to the spouse's own levy
or MLS is a separate household consequence; do not silently add it to employee tax or bank cash.

## One-off amounts — confirmed display and proposed assessment decomposition

**Decision, 23 October 2026:** show one-off payments/costs separately from recurring annual
totals, with **itemised gross amounts and a combined after-tax result**. Inputs are AUD only.
Keep guaranteed and target scenarios separate. No per-item tax allocation is required.
The following decomposition is a technical proposal, not a statutory allocation rule or a
verified complete assessment engine.

**Primary evidence refreshed, 23 October:** T02 ss4-10/15 determines income tax using annual
income, deductions and offsets. Sections 8-1/5/10 distinguish eligible deductions, exclude
capital/private amounts from the general deduction and prevent duplicate deductions. A cash
equipment purchase therefore cannot automatically become an immediate deduction. Section
25-130 also makes the standard deduction depend on specified other deductions; its 2026–27
application is established by T07/F02. These are BODY findings, not one-off classifications.
[ITAA 1997, C268][assessment] [Existing effective-date evidence](facts.md#f02--deductions-and-the-standard-work-deduction)

### Proposed bounded input contract

- Preserve each item's identifier, offer, guaranteed/target scenario, full AUD amount and
  cash-in/cash-out/noncash classification. A display category does not determine tax treatment.
- Identify whether the item is included in the selected year's scenario. Keep cash timing,
  income/deduction attribution and contribution receipt-year facts distinct where material;
  this does not introduce job-start/end-date comparisons or a full payroll calendar.
- Link each tax, super, reimbursement or expense component to its source item and existing
  recurring entries. Represent the amount once; do not re-enter a sign-on payment already
  included in an annual quote. Preserve independently required tax/reporting values.
- Retain eligibility, applicable rule period and known/unknown classification. Missing tax or
  super treatment blocks dependent net results, not the known gross item. No automatic SG
  classification follows from the label “sign-on bonus”; see [EC04](employee-earnings-classification.md).

### Proposed combined calculation

For one selected year and scenario, let `R` be the recurring offer, `O` the included one-off
set, and `S` the same shared context. Recompute three valid assessments:

| Quantity                                              | Proposed calculation          |
| ----------------------------------------------------- | ----------------------------- |
| Shared baseline                                       | `T0 = T(S without the offer)` |
| Recurring scenario                                    | `Tr = T(S + R)`               |
| Scenario including one-offs                           | `TrO = T(S + R + O)`          |
| Recurring offer-attributable liability                | `Tr − T0`                     |
| Combined one-off liability impact                     | `TrO − Tr`                    |
| Total offer-attributable liability for reconciliation | `TrO − T0`                    |

Each T is the same supported liability vector, not taxable income or withholding. Recompute
linked eligibility, deductions, offsets, levy/MLS and loan obligations in each scenario. Never
estimate the impact as the one-off total multiplied by a marginal rate. Preserve signed
component differences, including decreases. The accounting identity is
`(Tr − T0) + (TrO − Tr) = TrO − T0`, before display rounding. It proves decomposition only,
not the underlying tax values or their unresolved precision.

For **cash**, derive the combined one-off effect by subtracting the recurring-only annual
assessment-adjusted cash-after-job-costs measure from the same measure including O. Use the
matching [RR03 cash definition](remuneration-reconciliation.md#rr03--reconciliation-and-proposed-numerators):
cash payments/outflows, reimbursements and job costs once, with the incremental personal
liability and its established payment source once. A deduction's effect belongs inside the
recomputed assessment; do not subtract the expense twice or add a second “tax saving”.

Keep super, personal-value perks and cash destinations visible. A combined net full-value
measure also needs its independently supported net-super/tax components; it must not be
labelled cash. Unknown fund facts cannot become zero. The combined display is approved; the
detailed employee RR03 accounting contracts remain proposals. All employee types and sole-trader
contracting need their own verified cash/tax contracts. Own-entity contracting models are deferred;
relevant shared personal income is not
excluded. This note does not establish distribution, termination or employee-share rules.

Recurring annual/hourly rows must remain identifiable and must not silently absorb one-offs.
The reconciliation total above explains the tax difference; it does not approve an additional
first-year package or hourly-rate presentation. Separate gross itemisation and combined net
presentation avoid an arbitrary per-item order: independently calculated item-only impacts
need not sum to the joint impact.

### PAYG and verification limits

The annual difference is not payroll withholding. As one verified example, T22's 2026
Schedule 5 distinguishes multi/undefined-period bonus payments from single-period payments
using the regular table. Its methods require additional payment/pay-history inputs.
[PAYG instrument, Schedule 5][payg] Earlier rule periods retain T33/T34's separate applicability.
Do not spread annual assessed tax over an assumed deposit count or deduct both PAYG and
annual tax from this combined annual result.

No final-tax numeric fixture, application code or tests were created. Future verification must
cover an empty O set, duplicate source links, multiple interacting items, guaranteed/target
separation, expense/reimbursement matching, eligibility changes and missing classifications.
The identity above supplies an accounting invariant, not an independent assessment fixture.
R02–R05 precision/composition and applicable R06/R10/R11/R14 classifications still govern
availability. The user has resolved display granularity; no per-item tax-allocation choice
remains pending.

## Remaining product and evidence boundaries

Do not ask again which annual allocation to use: incremental attribution is approved.
The component/cash definitions, treatment of special tax circumstances and hourly/travel-time
formulas still need their own evidence and decisions. An approved convention cannot supply
missing income, deductions or counterfactual eligibility. Preserve independent gross/payroll
outputs while dependent annual results are unavailable. Do not substitute proportional tax.

## Future verification requirements

Derive expectations independently from the approved convention; no tests were authored:
- Shared taxable income changes assessed tax but never silently increases employer remuneration
  or representative payroll cash.
- Noncash other income and spouse income do not become employee cash receipts.
- Equal tax/cash scenarios reconcile; changing only PAYG changes representative cash, not annual
  assessed liability. Avoid double subtraction at reconciliation.
- Counterfactual removal recomputes eligibility; missing baseline facts block only dependent
  measures, not already-supported gross or payroll outputs.
- Threshold crossing, negative incremental components and per-offer personal overrides remain
  explicitly labelled. Do not clamp a tax difference merely to make a display positive.

[assessment]: https://www.legislation.gov.au/C2004A05138/2026-10-01/2026-10-01/text/original/epub/OEBPS/document_1/document_1.html
[payg]: https://www.legislation.gov.au/F2026L00716/asmade/2026-06-12/text/original/epub/OEBPS/document_1/document_1.html
[mls]: https://caat-p-001.sitecorecontenthub.cloud/api/public/content/0-4e489bec-c4cd-49d2-af19-118adbd52d38
[declaration]: https://caat-p-001.sitecorecontenthub.cloud/api/public/content/fbcafb1f-944b-45d1-bf46-9376da50282c_895748f7_9e80_43fc_8090_46e8d3f9995c_pdf

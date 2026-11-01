# Sole trader comparison boundary

Verified **23 October 2026**; clock observed **2026-10-23 00:56:24 UTC**. Research only;
no application, tax return, BAS, payroll service or tests were implemented. This narrows R12.
**Scope confirmed on 23 October:** initial contractor calculations cover sole traders only;
all employee types remain supported. Own company, partnership and trust contracting calculations
are deferred. Their retained research is not an initial-release blocker. This does not exclude
ordinary wages from a company or separately relevant entity-derived shared personal tax inputs.

The smallest coherent component is an **annual service-business revenue, expense and super
bridge into the individual's tax calculation**. It accepts evidenced classifications; it is
not an automatic legal-classification engine. The proposed contract below can preserve useful
gross results while dependent assessment or cash results remain unavailable.

## ST01 — Verified facts and year boundaries

| Topic                     | Verified rule and applicability                                                                                                                                                                                                                                                                                                                                                                                                         | Evidence                                                                                                                                                                                                                                                                                                   |
| ------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Taxpayer                  | A sole trader's business income belongs in their individual tax calculation. A company has its own return; company profit is not automatically its owner's income or bank cash.                                                                                                                                                                                                                                                         | T24, refreshed body; [government comparison](https://business.gov.au/planning/business-structures-and-types/business-structures/tax-differences-between-a-sole-trader-and-a-company). Its old example tax year is not used as a selected-year rate source.                                                 |
| Ordinary taxable supplies | GST is 10% of GST-exclusive value; for a wholly taxable GST-inclusive price, value is price × 10/11. Registered-or-required status and supply character matter. A quote's inclusive/exclusive label alone cannot establish GST liability.                                                                                                                                                                                               | T74; [GST Act ss9-5, 9-70, 9-75](https://www.legislation.gov.au/C2004A00446/2026-01-01/2026-01-01/text/original/epub/OEBPS/document_1/document_1.html). Historical C94/C95 bodies also checked.                                                                                                            |
| Credits and precision     | Creditability requires the statutory conditions; private use and input-taxed supplies restrict credits. Full credits equal supplier GST; partial credits require apportionment. Single-supply invoice GST rounds to nearest cent, half upwards; multi-item invoices have statutory alternatives.                                                                                                                                        | T74 ss9-90, 11-5, 11-15, 11-25, 11-30. Do not replace an invoice-derived annual GST total with annual receipts ÷ 11.                                                                                                                                                                                       |
| Income-tax expenses       | GST payable on supplies is excluded from assessable income. Recoverable input tax credits are excluded from ordinary deductions. Section 8-1 excludes capital/private expenditure and remains subject to other restrictions; cash expense does not itself establish a current deduction.                                                                                                                                                | T76; [ITAA 1997 ss8-1, 17-5, 27-5](https://www.legislation.gov.au/C2004A05138/2026-10-01/2026-10-01/text/original/epub/OEBPS/document_1/document_1.html); July 2025 body also checked. Capital allowances have separate GST rules.                                                                         |
| Standard deduction        | The 2026–27 standard deduction depends on the listed withholding-payment categories in s25-130(4). Ordinary sole trader invoices, voluntary-agreement payments under s12-55 and labour-hire payments under s12-60 are not listed merely because they reward labour.                                                                                                                                                                     | T76 s25-130; T07 application from 2026–27; F02. Shared employment income can separately qualify. Do not give every contractor $1,000.                                                                                                                                                                      |
| PSI                       | Income mainly rewarding an individual's efforts/skills can be PSI even when paid through another entity. PSI status does not establish employee status. Non-PSB PSI attracts Division 85 deduction restrictions.                                                                                                                                                                                                                        | T75; [ITAA 1997 Divisions 84–87](https://www.legislation.gov.au/C2004A05138/2026-10-01/2026-10-01/text/original/epub/OEBPS/document_3/document_3.html); July 2025 body also checked.                                                                                                                       |
| PSB dependencies          | The results test needs its three conditions for at least 75% of relevant PSI. At 80% or more from one entity and associates, failure of that test prevents self-assessment through the other tests without the applicable determination. Government/agent exceptions exist.                                                                                                                                                             | T75 ss87-15, 87-18; this is a dependency summary, not a complete classifier for ss87-20–87-40.                                                                                                                                                                                                             |
| Small business offset     | For an eligible adult with positive taxable income, raw offset is `min(1000, 0.16 × min(N, TI) / TI × B)`: N is eligible total net small business income, TI taxable income, B basic income tax liability. The special $5 million threshold applies through s328-110's entity tests. Non-PSB PSI and net capital gains are excluded from N; personal-super deductions, tax-related expenses and gifts are not subtracted in deriving N. | T77; [ITAA 1997 ss328-355–328-370](https://www.legislation.gov.au/C2004A05138/2026-10-01/2026-10-01/text/original/epub/OEBPS/document_7/document_7.html). July 2025 body confirms the same 16%/$1,000 provisions; do not use obsolete phased rates. Final offset composition/precision is not closed here. |
| SG classification         | An individual working under a wholly/principally personal-labour contract can be an SG employee. ABN, PSI and the word contractor are not substitutes for that classification. Contracting with a company/trust/partnership changes the counterparty analysis.                                                                                                                                                                          | T19, T37/T15 s12; [ATO contractor education](https://smallbusiness.taxsuperandyou.gov.au/super-guarantee-employer-obligations/independent-contractors).                                                                                                                                                    |
| 2025–26 SG base           | Existing ordinary OTE/quarterly-base evidence applies where the worker is an eligible SG employee. Establish labour, ordinary hours, paid overtime, materials and reimbursements separately. Do not calculate 12% of an undifferentiated invoice.                                                                                                                                                                                       | T37 and [employee earnings evidence](employee-earnings-classification.md); historical contractor-specific ATO presentation remains blocked in T79.                                                                                                                                                         |
| 2026–27 SG base           | Section 10A(1)(d) includes all labour payments under s12(3), subject to exclusions and the employer-specific annual base. The former OTE-only contractor overtime exclusion cannot simply be carried forward. GST/materials/equipment/reimbursements are distinguished from labour.                                                                                                                                                     | T15 [ss10A, 12, 17A](https://www.legislation.gov.au/C2004A04402/2026-07-01/2026-07-01/text/original/epub/OEBPS/document_1/document_1.html); T16 payment-day application; T78 official guide.                                                                                                               |
| Super destination         | Hirer-funded super goes to the fund, not the invoice bank receipt. Personal contributions use the individual's cash; they are not an additional hirer benefit. Gross contribution, deductible amount and estimated fund-tax result remain separate.                                                                                                                                                                                     | T78 [Creative Workplaces guide](https://creativeworkplaces.gov.au/contracts-and-payment/superannuation/getting-super/independent-contractor-guide); [super money flows](super-money-flows.md). The guide's abbreviated payment deadline does not replace T15 exceptions.                                   |

The ordinary GST arithmetic was checked in C94 (15 February–31 October 2025), C95
(1 November–31 December 2025) and current C96 (1 January 2026). Current GST attribution
ss29-5/29-10 distinguish cash/non-cash accounting and invoice/receipt timing. This review does
not specify BAS reporting, optional delayed-credit elections or historical transition handling.
Income-tax recognition is a separate classification; selecting GST cash accounting does not
establish income-tax recognition. [T74](sources.md#sole-trader-component-review)

## ST02 — Proposed smallest input contract

For an adult full-year Australian resident in either selected year, this bounded branch covers
an established sole trader providing ordinary domestic services, with no employees, stock,
capital-allowance calculations, business losses or business-level foreign/entity flows. Those
are explicit branch conditions, not defaults or removal of other required sole-trader cases.
They do not exclude independently classified shared personal income from the tax context.

| Required group              | Minimum information and reason                                                                                                                                                                                                                                                                                                                                                                              |
| --------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Identity and classification | Financial year; sole trader versus other legal arrangement; contract counterparty; established employee/contractor, SG and PSI/PSB classifications, each with evidence and effective period. Unknown classifications block affected results.                                                                                                                                                                |
| Revenue                     | Quote amount and unit; GST-inclusive/exclusive/not-applicable status; billable quantities or an explicit annual revenue estimate; guaranteed/target scenario; ordinary taxable/GST-free/input-taxed classification; invoice GST totals or declared estimation method; independently established annual assessable revenue. Do not turn standard paid hours or leave entitlement into assumed billable work. |
| GST context                 | Registered, required to register, or neither, with periods; validated supply/credit classifications. T24's $75,000 general threshold is not an automatic registration test based on one offer's profit or annual quote. Turnover windows and exceptions require their own classifier.                                                                                                                       |
| Each cost                   | Amount/unit; actual/estimated payment; business/private portion; reimbursed or borne by the worker; GST and credit entitlement; current-year allowable deduction; PSI restrictions; inclusion in economic job costs. Preserve separate cash, GST and deduction amounts.                                                                                                                                     |
| Super                       | Hirer statutory versus additional contractual contributions; quote's super inclusion; eligible earnings/base allocation by relevant quarter or payment year; personal contributions and deductible/non-deductible split; fund receipt year and existing cap inputs. No automatic equalisation with an employee offer.                                                                                       |
| Annual personal tax         | Shared settings with offer overrides; other taxable components; applicable offsets/levies/loans; eligible N for the small business offset; separately identified personal-super/tax-related deductions. Recompute both approved incremental-tax scenarios.                                                                                                                                                  |
| Offer cash evidence         | Actual or explicit estimated customer settlements, expense payments, GST remittances/refunds, withholding, PAYG instalments, assessment settlements and personal contributions, with scope/period. Identify whether receipts are before or after payer withholding. Receivables, payables and retained operating cash must not silently disappear.                                                          |

No TFN, bank account number or personal document upload is required by this proposed contract.
Evidence can be a source/status/date reference; a user choice cannot legalise an ineligible
deduction or reclassify an employment relationship.

## ST03 — Output contract and calculation limits

Given complete, validated annual components:
- **Revenue excluding GST**: customer consideration less applicable supply GST; keep invoice
  cash and hirer-funded super separate. This is the contractor fee comparison, before expenses.
- **Taxable business contribution**: annual assessable business revenue less current allowable
  business deductions, after GST and PSI treatment. This bounded branch requires a non-negative
  result; negative results go to the unresolved loss branch. Personal-super deductions remain
  separately identified for their other income-test and offset effects.
- **Economic business result before personal tax**: revenue excluding GST less explicitly
  modelled economic costs. It can differ from taxable business contribution. Personal perk
  values and monetary travel-time deductions are separate comparison layers.
- **Incremental annual tax**: the approved personal assessment difference with/without the
  offer, recomputing deductions, offsets and other dependencies. A positive cost is not deducted
  twice because it also creates a tax deduction. Existing R02–R05 limits still govern the
  assessment components; this supplement does not manufacture final rounded liabilities.
- **Annual after-tax economic result**: the preceding economic result less incremental annual
  tax and any explicitly included personal-super cash contribution. Label its convention;
  it is not bank receipts. Add a personal contribution only to the super destination, not again
  to the hirer-funded remuneration total.
- **Bank flow**: only with the cash inputs above, customer settlements before payer withholding
  minus that withholding, paid costs, actual/estimated GST settlements, other tax payments and
  personal contributions. If the input is already a net receipt, do not subtract withholding
  again. Annual assessed tax and its prepayments are not both subtracted. Distinguish aggregate
  business cash movement from deposits to a particular personal account or money retained for
  operating costs. Missing cash inputs make this required view unavailable, not optional. A
  full-year comparison does not establish a BAS/payment calendar or 26 contractor deposits.
- **Super flow**: hirer contributions and personal contributions separately, gross versus the
  bounded fund-tax estimate already specified. This does not establish account growth or access.

For ordinary self-employment, PAYG instalments are separate from employee withholding. Labour
hire, voluntary agreements and no-ABN withholding need their own verified branches; do not
silently feed a contractor invoice into Schedule 1. T24 verifies the instalment distinction;
amounts, entry rules and payment scheduling remain R12/R14.

## ST04 — Independent component checks

Pure arithmetic was checked independently of application code. These do not assert an actual
contract, tax assessment, GST classification or fund receipt.

| Case                            | Explicit conditions                                                                                                                                 | Checked result                                                                                                                                                                                |
| ------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Published GST example           | T74 s9-75: wholly taxable supply priced $22,000 including GST                                                                                       | Value $20,000; GST $2,000. Statutory independent example, not salary income.                                                                                                                  |
| Inclusive/exclusive equivalence | Ordinary taxable service: $100,000 exclusive versus $110,000 inclusive; amounts have no fractional-cent issue                                       | Both yield fee $100,000 and GST $10,000. GST is not $11,000 on the inclusive quote.                                                                                                           |
| Invoice precision               | Eleven separate single-supply invoices of $1.11 including GST; s9-90(1)                                                                             | Each GST $0.10; sum $1.10. Extracting 1/11 from annual $12.21 gives $1.11 and is not equivalent. Integer-cent arithmetic checked.                                                             |
| Settled operating flows         | $110,000 customer receipts; $11,000 wholly deductible/creditable current service costs, all attributed and settled in the same year; no other flows | Sales GST $10,000 less credit $1,000 gives $9,000. Settled operating cash and taxable business result both $90,000 in this deliberately restricted case. Neither is after personal tax/super. |
| Deduction versus cash           | Previous case plus a $500 private economic cost, no GST credit or deduction                                                                         | Economic cash falls to $89,500; taxable business contribution remains $90,000. An app cost entry cannot create a tax deduction.                                                               |
| Offset ratio/cap                | Eligible adult, positive TI; stipulated component inputs `N=40,000`, `TI=80,000`, `B=10,000`                                                        | Raw offset $800. For `N=100,000` with same TI/B, clipped ratio gives $1,600 before the $1,000 cap. B is a supplied mathematical input, not an asserted selected-year tax bill at TI $80,000.  |
| PSI commute                     | T75 s85-10 statutory Ruth example: non-PSB architect, home office and travel to the engaging firm's premises                                        | The ordinary home-to-firm expense is not deductible merely because she is a contractor or has a home office. Economic travel cost can still be recorded.                                      |

Boundary obligations for a future implementation include missing GST/PSI/SG status, mixed
creditability, differing invoice aggregation, a cost with no deduction, personal-super effects
on TI versus N, relevant quarterly/annual SG caps, unsupported loss/entity branches and a
counterfactual that changes PSB eligibility. These are research requirements, not authored tests.

## ST05 — Remaining blockers and product preferences

- **R12a — Classification:** complete registration/turnover, supply/credit and PSI/PSB
  classifiers; fact-specific worker/SG analysis. The verified branch can accept established
  results with provenance, but must not claim that a checkbox proves those classifications.
- **R12b — Tax composition:** full small-business-offset eligibility, zero-taxable-income
  handling and interaction/order/precision; non-commercial losses, depreciation, prepayments,
  stock, recoupments and business-specific deductions. Simple positive annual arithmetic is
  specified; these are not presumed zero outside its explicit boundary.
- **R12c — Cash/withholding:** income recognition, receivables/payables, BAS transitions and
  payment timing, PAYG instalments/voluntary agreements/no-ABN/labour-hire branches. No actual
  bank balance or cash schedule is inferred from annual profit.
- **R12d — Deferred own-entity contracting:** deriving personal outcomes from a contracting
  company, partnership or trust, including retained profit, extraction and entity PSI attribution,
  is outside initial scope. Preserve its research; it is not an initial-release blocker.
  Ordinary employee wages from a company remain in scope. Independently received salary/fees,
  dividends or distributions may still affect shared personal tax; this deferral does not remove
  their required classification or treat unknown income as zero.
- **R06 contractor extension:** classification and contractual inclusive-super reconciliation
  require evidence. Post-July-2026 all-labour QE must not inherit the old overtime exclusion.

The user confirmed **both** revenue entry methods: an explicit annual estimate or rate × entered
billable hours/days. They are alternatives, not amounts to add together. Billable capacity must
be entered rather than inherited from employee paid hours. Planned personal super still needs
an explicit amount/choice; neither zero nor matching employee SG is approved as a default.
That missing-input dependency is distinct from tax-law gaps. The approved incremental-tax
convention remains unchanged.

## Provenance

[T74–T79 in the source register](sources.md#sole-trader-component-review) record exact current
and historical bodies, inspected provisions and blocked leads. Existing F02/F07/F08/F11,
T15–T19/T24/T37 and the linked component references supply the previously verified boundaries.
Review did not access PayCalculator controls, protected ATO services or personal financial data.

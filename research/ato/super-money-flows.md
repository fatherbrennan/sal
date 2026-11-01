# Super and remuneration money flows

Checked **23 October 2026 Australia/Adelaide**; clock `2026-10-22 23:18:25 UTC`.
Scope: ordinary full-year resident employee comparisons for 2025–26 and 2026–27. Initial product
coverage retains all employee types and sole-trader contracting; own-entity contracting models
are deferred. This evidence does not make every in-scope arrangement calculable.
Amounts below are AUD. Sources and access limits are registered as T01/T05/T15–T18/T37/T41
and T53–T59 in [sources.md](sources.md). No application code or tests were written.

## S01 — Employer obligation and receipt are different

| Component                         | 2025–26                                                                                             | 2026–27                                                                            |
| --------------------------------- | --------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------- |
| Ordinary minimum SG               | 12% of eligible OTE, including relevant sacrificed OTE; quarterly maximum base $62,500 per employer | 12% of QE; annual maximum base $270,830 per employer                               |
| Basic individual concessional cap | $30,000                                                                                             | $32,500                                                                            |
| Ordinary timing                   | Fund receipt by quarterly due date; contractual timing may be earlier                               | Receipt generally by seventh business day after QE day; statutory exceptions apply |

The amounts are established by [T41's selected-year tables][rates]; historical rules by
[T37 ss6/15/19/23][old-sg]. [T59][quarterly] gives quarterly due dates, including 28 July for
the June quarter. Do not equate the employee's annual cap with an employer's earnings base.

[T15 ss6/10A/17A/18A/18C][sg] includes OTE, all commissions and specified extended-employee
payments in QE, without duplicate counting. Relevant salary sacrificed to super remains in QE;
sacrificed contributions cannot discharge the employer's compulsory amount. Annual-base usage is
employer-specific. A valid exemption certificate is a separate branch. [T16 item182][transition]
applies the new system to QE days from 1 July 2026, including earlier work paid then.

[T55 regs11–12][regs] excludes specified employees/payments, including parental-leave payments,
fringe benefits and specified overseas employment. Annual/sick/long-service leave exceptions to
community-service/Defence-absence exclusions require classification. Tax residency alone does not
establish SG eligibility. Government parental-leave super is a separate regime, not ordinary SG.

[T56 ss2/5][out-cycle] permits specified allowances, bonuses, commissions, loadings, advances and
back pay to qualify as out-of-cycle earnings only under its established-pay-pattern and subsequent
regular-payment conditions. Combined with T15 s18C, this affects receipt timing; it does not make
every bonus exempt from a seven-business-day deadline.

## S02 — Classify each component before splitting a quote

An inclusive quote is an accounting description, not an earnings classification. Keep cash,
compulsory employer super, additional employer super, sacrificed super and benefits distinct.
Record the contribution basis and whether an employer promises more than the statutory minimum.

Conditional identity: `quote = cash + employer super`, with `employer super = cash × r`, gives
`cash = quote ÷ (1 + r)` **only when those premises actually hold**. A capped contribution, fixed
amount, different earnings base, benefit or mixed bonus invalidates that shortcut. See
[CG02](case-guide-review.md#cg02--super-inclusive-quotes-require-a-breakdown).

The user confirmed **guaranteed and target bonus/commission scenarios separately**. Neither
certainty nor a percentage target decides tax, OTE/QE classification or payment timing. The ATO's
detailed QE page remained HTTP403; its course returned a video wrapper. Indexed payment matrices
and the indexed Kylie example were excluded from verified fixtures (T58). The statutory OTE/QE
categories are verified, but a complete bonus/overtime/allowance matrix remains R06/R10.
The [classification follow-up](employee-earnings-classification.md) narrows those gaps and supplies
historical leave-exclusion evidence; it does not make every payment category calculable.

## S03 — Contribution categories and income bases

[T53, pp3–10][contributions] distinguishes salary sacrifice from personal contributions. Valid
sacrificed super is employer-contributed, additional to SG, excluded from employee assessable pay
and PAYG, but reportable. Personal contributions can be deductible or nondeductible; a deduction
requires eligibility and an acknowledged valid notice. Do not deduct salary sacrifice again as a
personal contribution. A personal deduction is whole dollars; residual contributed cents remain
nondeductible. Reportable super includes deductible personal contributions and influenced employer
amounts; compulsory SG is excluded. Keep these reportable amounts separate from gross fund receipts.

[T05 ss290-150/155/165/170/175 and 295-160/190][itaa] establish deduction conditions and fund
assessment treatment. A notice alone does not prove all eligibility. Age/work-test modifications,
fund status, notice timing/validity and the deduction limit remain R07. [T25][packaging] requires
salary packaging to be arranged before income is earned; an already-earned bonus cannot simply be
relabeled as sacrifice.

**Receipt-year boundary:** [T54 pp9–10][caps] states that contributions count in the year the fund receives
them. All funds/employers and relevant personal contributions feed the person's cap. Annual
remuneration entitlement therefore does not prove the same year's fund receipts or remaining cap.
Keep prior-year receipts, current-year amounts received later and evidenced carry-forward amounts
separate. [T05 ss291-15/20/25][itaa] supplies excess/carry-forward rules; no cap headroom is assumed.

## S04 — Gross super is not net account growth

[T01 s26][fund-rate] taxes a complying fund's low-tax component at 15%; different components/fund
statuses have other treatment. [T57][tax-super] confirms ordinary employer/sacrificed contribution
tax and flags no-TFN treatment. This supports a **conditional contribution-tax estimate**, not a
universal deduction from every contribution or an observed account credit.

[T54 pp46–49][caps] separates Division 293 from fund tax: its income base and low-tax contributions
determine the lesser taxable amount above $250,000; the rate is 15% (T05/T29). Its Jan example
has income $240,000 and relevant contributions $15,000: taxable excess $5,000, tax **$750**.
The taxpayer may pay personally or elect fund release. Do not automatically deduct it from both
bank cash and super, or charge 30% on all contributions.

Proposed output representation, derived from those distinctions:

| Output                                        | Boundary                                                                                                                                     |
| --------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| Remuneration super entitlement                | Employer obligation/offer value; not a dated receipt                                                                                         |
| Gross contributions received                  | Amount and source, before fund tax; receipt-year basis                                                                                       |
| Estimated contribution tax / net contribution | Separately labelled, conditional on verified fund/contribution treatment                                                                     |
| Division 293                                  | Separate personal liability; payment source unknown until specified                                                                          |
| Account change                                | Requires actual opening/closing balances, fees, insurance, returns, transfers, withdrawals and credits; outside a bare contribution estimate |

LISTO, co-contribution, excess-contribution release, non-concessional/bring-forward eligibility,
defined-benefit/untaxed/constitutionally protected funds, no-TFN adjustments and Division 296 remain
R07/R08. A missing fact leaves affected net-super results unavailable; it is not a zero adjustment.

## S05 — Independently recalculated specimens

These are bounded research arithmetic, not implementation tests or personal estimates. Integer-cent
calculations checked the identities; examples deliberately avoid unresolved fractional-SG rounding.

**S05-A — representative fortnightly flow, both years.** Synthetic ordinary resident employee,
TFN provided, threshold claimed, no loan/variation/extra withholding. Gross cash before valid
sacrifice $2,200; sacrifice $200; eligible OTE/QE $2,200; employer SG $264; neither earnings cap
reached. Assume a complying taxed accumulation fund, TFN supplied to it, receipt in the modelled
period, ordinary 15% contribution tax and no other contribution/fund adjustments. These are fixture
premises, not defaults. Taxable payroll cash is $2,000; use the independently checked
[Y03 Schedule 1 withholding](year-readiness.md#independent-component-examples).

| Destination                                                                | 2025–26   | 2026–27   |
| -------------------------------------------------------------------------- | --------- | --------- |
| Payroll bank cash                                                          | $1,714.00 | $1,724.00 |
| PAYG withholding                                                           | $286.00   | $276.00   |
| Gross super: $264 employer + $200 sacrifice                                | $464.00   | $464.00   |
| Conditional contribution tax                                               | $69.60    | $69.60    |
| Conditional net contribution                                               | $394.40   | $394.40   |
| Reconciled remuneration: bank + PAYG + contribution tax + net contribution | $2,464.00 | $2,464.00 |

Do not add gross super again to the final row, subtract employer SG from the $2,200 cash quote,
subtract sacrifice twice, or replace PAYG with annual incremental tax. This does not predict actual
deposit dates, annual deposits or account growth.

**S05-B — cap boundaries.** Ordinary statutory minimum only, no exemption or contractual extra:

| Year/base period                | Eligible earnings              | Raw minimum SG                       |
| ------------------------------- | ------------------------------ | ------------------------------------ |
| 2025–26, one quarter            | $62,499 / $62,500 / $62,501    | $7,499.88 / $7,500.00 / $7,500.00    |
| 2026–27, full year per employer | $270,829 / $270,830 / $270,831 | $32,499.48 / $32,499.60 / $32,499.60 |

Sources T37/T15/T41. The last amount is **$32,499.60**, not the individual's $32,500 basic cap.
Actual receipt-year totals and contractual contributions can differ.

**S05-C — inclusive reconciliation.** Under the exact simple premises in S02, a $112,000 quote
with 12% employer super gives $100,000 cash plus $12,000 super. A different synthetic 2026–27
quote of $350,000, containing only cash that is entirely QE and capped statutory SG, gives $317,500.40 cash plus
$32,499.60 super: the cash exceeds the annual earnings base, so the capped premise is consistent.
Dividing that quote by 1.12 would be wrong. No employee annual tax/net-cash result is inferred.

**S05-D — published independent example.** T54's Jan result above was recalculated:
`15% × min(15,000, 240,000 + 15,000 − 250,000) = $750`. This validates only that supplied
Division 293 component, not whether arbitrary gross income equals the required income base.

## Required fields and remaining verification

Candidate fields, not an approved schema: component cash/benefit/super split and classification
evidence; compulsory/contractual/sacrificed/personal source; contribution basis/rate/cap treatment;
quarterly versus annual employer base usage; fund type/complying status and TFN-provided flag
(never the TFN); receipt-year amounts; personal deduction eligibility/notice; reportable amounts;
other contributions/carry-forward evidence; fund-tax adjustments and Division 293 payment source.
Unknown and not-applicable are distinct from zero.

Future checks require independent expectations for sacrifice/no-sacrifice, above-cap contracts,
commissions counted once, included/excluded pay, receipt crossing 30 June, multiple employers,
personal deduction cents, Div293 threshold/cap/payment source and both guaranteed/target scenarios.
No application tests were authored. Full classification, historical eligibility changes, special
fund regimes, rounding, deadlines/transitions and complete annual-tax interactions remain unresolved.
Representative payroll does not authorise inventing contribution dates or an annual receipt total.

[rates]: https://caat-p-001.sitecorecontenthub.cloud/api/public/content/0-af5a46ad-7287-431c-be8e-4a0c9bbc5fc1
[old-sg]: https://www.legislation.gov.au/C2004A04402/2026-03-27/2026-03-27/text/original/epub/OEBPS/document_1/document_1.html
[sg]: https://www.legislation.gov.au/C2004A04402/2026-07-01/2026-07-01/text/original/epub/OEBPS/document_1/document_1.html
[transition]: https://www.legislation.gov.au/C2025A00057/asmade/2025-11-06/text/original/epub/OEBPS/document_1/document_1.html
[regs]: https://www.legislation.gov.au/F2018L01289/2026-07-01/2026-07-01/text/original/epub/OEBPS/document_1/document_1.html
[out-cycle]: https://www.legislation.gov.au/F2026L00784/asmade/2026-06-24/text/original/epub/OEBPS/document_1/document_1.html
[contributions]: https://caat-p-001.sitecorecontenthub.cloud/api/public/content/0-7350b1a9-c870-4d9b-b4dc-1506974b918e
[itaa]: https://www.legislation.gov.au/C2004A05138/2026-10-01/2026-10-01/text/original/epub/OEBPS/document_6/document_6.html
[packaging]: https://moneysmart.gov.au/work-and-tax/salary-packaging
[fund-rate]: https://www.legislation.gov.au/C2004A03348/2026-07-01/2026-07-01/text/original/epub/OEBPS/document_1/document_1.html
[caps]: https://caat-p-001.sitecorecontenthub.cloud/api/public/content/0-6c3220ce-b973-4514-84e0-0f9f28c4d0a7
[tax-super]: https://moneysmart.gov.au/how-super-works/tax-and-super
[quarterly]: https://caat-p-001.sitecorecontenthub.cloud/api/public/content/0-1cca4d23-4e4a-4642-96f8-eb229b882fb3

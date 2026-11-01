# Ordinary employee earnings classification

Checked **23 October 2026 Australia/Adelaide**; clock `2026-10-22 23:30:08 UTC`.
Scope: 2025–26 and 2026–27, ordinary adult employees working in Australia. This supplement
narrows R06/R10; it does not certify a complete employee calculator. Initial product scope
retains all employee types and sole-trader contracting; own-entity contracting models are deferred.
Sources T60–T65 are registered in [sources.md](sources.md).
The overtime branch excludes payments independently included by T15 s10A(1)(c)–(g), such as
specified director, public-office and labour-contract payments.

## EC01 — The classification and its evidence are separate inputs

[T37 s6][old-sg] and [T15 ss6/10A][sg] retain earnings for ordinary hours and specified
over-award/shift/commission categories. From 1 July 2026, QE separately includes all commissions
and the other statutory categories, counted once. Classification precedes the applicable earnings
cap. The existing [super money-flow reference](super-money-flows.md) covers amounts and timing.

[T63's Federal Court report, printed p153][court-report] records that _Bluescope_ distinguished
ordinary hours under the relevant instrument/contract from regularly worked additional hours.
It also describes the fallback where no such distinction exists. Its final sentence about the
appeal's disposition is inconsistent with its preceding description; no procedural outcome is
relied on here. The judgment body itself was inaccessible. Do not turn this case's hours or
public-holiday treatment into universal defaults.

[T62 *Target*, paragraphs 10–16, 22–32 and 89–99][target] distinguishes ordinary hours from
ordinary rates and confines the agreement's super definition to its context. This was an annual
leave entitlement dispute. It is not primary proof of a universal SG leave-loading rule.

Proposed fields: applicable instrument/contract reference and version; defined ordinary hours;
separately identified additional hours and payment basis; each component's legal category,
ordinary-hours connection and supporting evidence. Labels such as salary, bonus or allowance,
and an editable hours-per-week conversion, cannot supply that evidence.

## EC02 — Selected-year classification matrix

“Supported” below means the stated component can be classified once its premises are established.
It does not mean eligibility, contractual super, annual tax or payroll withholding are complete.

| Component and exact premise                                                                     | 2025–26 minimum-SG base                              | 2026–27 minimum-SG base                          | Evidence and readiness                                                                                                                                         |
| ----------------------------------------------------------------------------------------------- | ---------------------------------------------------- | ------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Base cash earned for established ordinary hours                                                 | OTE                                                  | OTE within QE                                    | Supported by T37/T15 s6; subject to employee/payment exclusions.                                                                                               |
| Ordinary-hours over-award pay, shift loading or commission                                      | Included                                             | Included, without double counting                | Express statutory categories; do not infer an ordinary-hours classification from a higher rate alone.                                                          |
| Genuine commission outside the established ordinary-hours component                             | Do not infer the historical result from the new rule | Included in QE, subject to exclusions            | T15 s10A(1)(b) is express. Historical boundary remains EC04-A.                                                                                                 |
| Separate cash bonus proven to remunerate only ordinary-hours services                           | Within the ordinary-hours definition                 | Within OTE/QE                                    | Direct application of T37/T15; mixed, retention, sign-on and personal-gift characterisation remain EC04-A.                                                     |
| Separately evidenced overtime wages solely for non-ordinary hours; no other statutory inclusion | Outside OTE                                          | Outside OTE/QE for this ordinary employee branch | Conditional application of T37/T15, corroborated by T63. A blanket overtime label is insufficient. Extended-employee payments can have different QE treatment. |
| Paid annual, personal or long-service leave; public holidays, RDO/TOIL and leave loading        | Detailed generic classification not completed        | Detailed generic classification not completed    | T37/T15 exclude specified unused-leave termination lump sums. That does not establish every other leave payment. EC04-A/B remain.                              |
| Allowance or reimbursement, including expense/cents-per-kilometre payment                       | Detailed generic classification not completed        | Detailed generic classification not completed    | T61 explicitly says an allowance is not always QE. Purpose, entitlement, ordinary-hours link and expense substantiation are required; EC04-A.                  |
| A payment already established to be a fringe benefit under FBT law                              | Excluded from salary/wages by T37 s11(3)             | Excluded from QE by T55 r12(1)(f)                | Exclusion verified; FBT characterisation/valuation remains R09. Personal perk value cannot establish it.                                                       |

[T61 paragraphs 38–49][out-cycle-es] confirms that commission can be remuneration based on
sales volume or similar criteria, including the entire remuneration. It describes bonuses and
loadings generally, but requires the payment to qualify independently before its timing concession
applies. Neither the category list nor guaranteed/target status proves that a particular payment
is QE. This official explanatory statement supports interpretation; T15/T56 remain the enacted rules.

## EC03 — Historical leave exclusions now have body evidence

[T60 C07][old-regs] is expressly effective through 30 June 2026; [T55 C08][regs] starts
1 July 2026. Their r5 definitions include maternity, paternity, adoption/pre-adoption and specified
early safe-job leave within parental leave. C07 r12(1)(a), applied through T37 ss27/23(12), and
C08 r12(1)(a) exclude the relevant parental-leave payments from the statutory base.
This does not prohibit contractual super or describe the separate government parental-leave scheme.

Both versions also exclude relevant usual-employer payments during eligible community-service or
Defence absence, with conditions. Annual/sick/long-service-leave payments during those absences
are exceptions to those exclusions: C07 r12(4), C08 r12(3). Removing an exclusion does not by
itself prove every payment is OTE/QE. Keep the activity, payer, absence and payment category distinct.

The linked definition is [T65 Fair Work Act s109][fw]: required jury service, qualifying voluntary
emergency activity or prescribed activity. Emergency activity has voluntary participation,
recognised-body and request/reasonably-expected-request conditions. The current body was inspected;
the full historical definition/regulation chain was not. Do not classify every volunteering absence
as eligible community service.

## EC04 — Exact remaining gaps

| ID     | Gap type                                | Required evidence before automatic classification                                                                                                                                                                                                                                                                                        |
| ------ | --------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| EC04-A | Source access                           | Current, complete SGR2009/2 and detailed ATO OTE/QE payment guidance, including ordinary-hours fallback, mixed/overtime-only bonuses, commission boundary, paid leave/loadings, on-call pay, expense allowances and reimbursements. T64 records blocked URLs and indexed paragraph leads. Index text is not an accepted rule or fixture. |
| EC04-B | Source/version and legal-context review | Reconcile current paid-leave/loading guidance with applicable instruments and case law; verify historical applicability. T62's agreement-specific interpretation cannot settle statutory SG generally. No finding of legal conflict is made merely because a page is blocked.                                                            |
| EC04-C | Offer-specific facts                    | Actual ordinary-hours terms, component purpose, bonus terms, expense treatment and any contractual super above the minimum. These require supplied evidence, not a tax-table default.                                                                                                                                                    |
| EC04-D | Other calculation rules                 | PAYG Schedule 5/other irregular-pay branches, tax derivation/deductions/FBT, contribution precision/receipt timing and excluded employee/fund regimes. SG classification does not resolve R07–R10/R14.                                                                                                                                   |

The narrow supported branches in EC02 can inform a component classifier. **No complete end-to-end
salary scenario becomes implementation-ready from this supplement alone.** Existing annual-tax,
PAYG, precision and eligibility blockers still apply. Unsupported components must leave dependent
results unavailable rather than silently contribute zero.

Future verification needs paired cases for ordinary versus additional hours, commission counted
once, bonus certainty versus tax character, each leave exclusion/exception and each rule period.
The source-access gaps currently prevent accepting the indexed Tamara/Robert bonus and Kylie
pay examples as independent fixtures. No new arithmetic, application code or tests were authored.

[old-sg]: https://www.legislation.gov.au/C2004A04402/2026-03-27/2026-03-27/text/original/epub/OEBPS/document_1/document_1.html
[sg]: https://www.legislation.gov.au/C2004A04402/2026-07-01/2026-07-01/text/original/epub/OEBPS/document_1/document_1.html
[old-regs]: https://www.legislation.gov.au/F2018L01289/2022-10-18/2022-10-18/text/original/epub/OEBPS/document_1/document_1.html
[regs]: https://www.legislation.gov.au/F2018L01289/2026-07-01/2026-07-01/text/original/epub/OEBPS/document_1/document_1.html
[out-cycle-es]: https://www.legislation.gov.au/F2026L00784/asmade/2026-06-24/es/original/pdf
[target]: https://www.judgments.fedcourt.gov.au/judgments/Judgments/fca/full/2023/2023fcafc0066
[court-report]: https://www.fedcourt.gov.au/__data/assets/pdf_file/0005/59639/AR2018-19.pdf
[fw]: https://www.legislation.gov.au/C2009A00028/2026-07-07/2026-07-07/text/original/epub/OEBPS/document_1/document_1.html

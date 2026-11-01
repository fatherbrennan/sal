# Decisions, gaps and blockers

Guidelines and tooling were approved on 23 October 2026. Tax research can proceed independently;
salary-feature implementation remains dependent on unresolved product rules and evidence below.
The selected years and modes are recorded in [year-readiness.md](year-readiness.md).

## Product decisions still required

| ID  | Decision                                                                                                                                                                                    | Why it changes the result                                                                                                                                                                                                          |
| --- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| D01 | Resolved: 2025–26 and 2026–27, default 2026–27; new application versions auto-recalculate saved comparisons using verified rule corrections and identify the changed rule                   | Retain applicable dates, sources and version provenance; no runtime external tax service.                                                                                                                                          |
| D02 | Resolved initial scope: full-year Australian tax residents; all employee types and sole-trader contracting                                                                                  | Confirm residency inputs and special resident circumstances. Foreign-resident, WHM and part-year calculations are outside the initial selection; do not silently classify a person.                                                |
| D03 | Resolved: annual liability and payroll withholding separately; gross and after-tax views, with incomplete drafts flagged and affected results unavailable                                   | Component definitions and year-specific evidence still need resolution; do not fabricate missing results.                                                                                                                          |
| D04 | Full personal/household tax context versus bounded package-only estimate                                                                                                                    | Other income, family status, deductions and reportable amounts affect results. Unknowns need explicit handling.                                                                                                                    |
| D05 | Resolved on 23 October: initial contractor calculations cover sole traders only; all employee types remain supported                                                                        | Own company/partnership/trust contracting calculations are deferred, not an initial-support decision or blocker. This does not exclude ordinary company-paid wages or relevant shared entity-derived personal income.              |
| D06 | Normal full-year alternatives, shared settings/overrides and representative PAYG confirmed; editable 52-week paid-hours conversion plus financial-year work/attendance calendar confirmed   | No job start/end-date comparison or full payroll calendar. Fortnightly pay does not establish actual deposit counts; leave entitlement does not establish leave taken. Component annualisation/precision still require definition. |
| D07 | Remuneration-only scope, bank/super/tax views, additive personal-value perks and combined after-tax cash/super/perk display with components confirmed; detailed accounting remains proposed | Job costs/time remain separate. Preserve full worth versus value after other payroll outflows. Excludes employer-only payroll tax/workers' compensation; personal perk value supplies no tax/reporting value.                      |
| D08 | Optional/manual overrides and evidence disclosure                                                                                                                                           | User-entered estimates must remain distinguishable from verified calculations.                                                                                                                                                     |

**D09 — incremental annual offer attribution approved on 23 October.** Shared other taxable income does
not establish cash receipts. Whole-person annual tax, representative payroll cash and tax
attributable to an offer must remain separate. [The incremental convention](annual-cash-and-tax-attribution.md)
is approved: annual tax with the offer minus annual tax without it, recomputing both valid
scenarios. Required package gross/net and bank/super/tax views retain the relevant
personal tax context. A whole-person cash summary is an optional proposal, not approved scope.
The user confirmed payer-specific threshold selection and saving incomplete drafts with missing
inputs flagged/affected results unavailable. Threshold selection affects PAYG; it does not select
the annual attribution convention. Full-year Australian tax residents are the confirmed initial
calculation scope; all employee types and sole-trader contracting require their distinct verified
treatment. Own company/partnership/trust contracting calculations are deferred under D05.

## Research blockers

| ID  | Gap                                                                                                                                                                                | Consequence                                                                                                                                                                                                                                              |
| --- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| R01 | Full residency tests, temporary-resident exemptions, treaty/NDA WHM cases, foreign income/tax credits                                                                              | No universal resident/foreign/WHM classifier or final result.                                                                                                                                                                                            |
| R02 | Input construction, LITO half-cent/$66,667 handling, combined liability boundaries and final-assessment fixtures                                                                   | [AT01–AT04](annual-tax-component-boundaries.md) separates R02a–d: basic tax on established whole-dollar income is specified; 2025–26 paper-field truncation is verified. Remaining gaps block dependent final results, not unrelated bounded components. |
| R03 | Medicare prescribed-person/full/half exemptions, SAPTO eligibility, dependant definitions and complete family allocation                                                           | Ordinary levy and MLS tables alone are insufficient.                                                                                                                                                                                                     |
| R04 | Complete MLS adjustments, household changes, low-income spouse cases, lump-sum arrears and cover exceptions                                                                        | Do not apply a tier rate to one undifferentiated income number.                                                                                                                                                                                          |
| R05 | All study-loan schemes, debt ordering, indexation, voluntary-payment/debt timing, overseas assessment, final rounding and occupation/location benefits under T12 Divisions 142/144 | HELP component evidence does not establish every study-loan calculation or teacher/health-practitioner concession.                                                                                                                                       |
| R06 | Full qualifying-earnings classification, SG exceptions, multiple-employer certificates, contribution receipt timing and Norfolk Island transition under T16 item 189               | No universal 12%-of-package algorithm. Old quarterly bases cannot be carried into July 2026 onward.                                                                                                                                                      |
| R07 | Valid salary-sacrifice arrangements; deductible personal-super age/work-test/notice conditions and remedial modifications                                                          | No automatic deduction merely because a contribution is labelled pre-tax.                                                                                                                                                                                |
| R08 | Non-concessional/bring-forward caps; fund contribution tax, LISTO/co-contribution, defined benefits and Division 296                                                               | Super net value and additional personal/fund tax remain incomplete. T29 current-status access gap was resolved; this does not resolve these separate calculations.                                                                                       |
| R09 | Full FBT valuation, employer exemption/rebate caps, reportable exclusions, novated leases and electric-vehicle transition rules                                                    | Benefit prices cannot determine tax or reportable value without classification.                                                                                                                                                                          |
| R10 | Bonus/commission/arrears/termination annual tax; redundancy and ETP caps; ESS deferred/start-up rules and CGT                                                                      | Irregular remuneration cannot safely be treated as ordinary annual cash in every case.                                                                                                                                                                   |
| R11 | Detailed commuting exceptions, WFH methods/rates, complete car methods/records, 2027–28 car rate and other expense categories                                                      | F13/T31–T32 verify 91 cents/km for 2026–27 only, checked 23 October 2026. No 2027–28 rate verified. Transport/WFH access and eligibility gaps remain; economic costs stay separate.                                                                      |
| R12 | Initial sole-trader GST treatment/credits, PSI/PSB tests, deductions, personal-tax composition and cash timing; other-entity contracting deferred under R12d                       | Invoice turnover is not personal take-home. Deferred own-entity contracting models do not block initial release; relevant shared personal income still needs its own tax treatment.                                                                      |
| R13 | Full 2026 capital-gains/property reforms and other income interactions                                                                                                             | Salary comparisons with investments require more than ordinary brackets.                                                                                                                                                                                 |
| R14 | Complete PAYG selection and branches beyond the bounded ordinary scale-2 evidence; variations, irregular pay, no-TFN cases and cash-flow integration                               | O03 verifies ordinary conversion/rounding with independent published sample checks. A periodic share of annual tax is not a validated payslip estimate.                                                                                                  |
| R15 | Interactive PayCalculator controls/settings, formulas and disclaimers                                                                                                              | Only descriptive text was retrievable. Parent's 23 October browser attempt reported no enabled browser/apps. No controls/calculations observed, data submitted or parity/default claim made.                                                             |

The [sole trader supplement](sole-trader-component-boundaries.md) narrows **R12** into
classification (**R12a**), tax composition and non-ordinary business items (**R12b**),
cash/withholding timing (**R12c**) and deferred own-entity contracting models (**R12d**).
R12d is outside initial calculation scope, not an initial-release blocker. This deferral does
not remove employee wages or shared personal tax-profile inputs arising from entities.
GST normalisation, positive annual operating arithmetic and the personal-tax bridge have bounded contracts;
small-business-offset and PSI dependencies are explicit. This does not establish a complete
contractor calculator. R06 also retains contractor classification/inclusive-super evidence;
2026–27 labour-contract QE must not reuse a historical OTE-only overtime exclusion.

**Perks scope is resolved:** add entered personal value only; no perk funding, contribution or
salary-deduction calculations. R09 retains statutory tax/reporting and detailed packaging research,
not a pending perk preference. It does not block a known personal-value addition. Missing required
tax-profile evidence affects the dependent tax/net result without inventing tax-free treatment.

**Combined after-tax display is resolved:** show the total and cash/super/personal-perk
components. [RR03](remuneration-reconciliation.md#rr03--reconciliation-and-proposed-numerators)
retains the chosen `A + S_n + V` sum and separately reconciles full worth by restoring D_o.
Transfers are not automatically losses. Its J_o subset prevents payroll-funded job costs being
omitted from restored full-value adjustments or deducted twice from cash remaining. These are
proposed bookkeeping contracts, not newly approved transfer inputs or tax eligibility. R02–R09
and missing payment-source/fund facts still govern dependent results; the display decision does
not resolve them.

The [Medicare follow-up](medicare-and-mls-evidence.md) and
[bounded contracts](medicare-component-boundaries.md) narrow **R03/R04**. Ordinary single and
stable full-year-spouse raw components are specified, including allocation/excess transfer;
current Angie/Tom, general Matthew and explicitly historical Trevor examples were body-checked.
**R03a** retains child ATI/notional-offset/maintenance eligibility; **R03b** retains selected-year
external family-transfer fixtures and precision despite the specified statutory ordering.
**R03c/R04a** retain final/intermediate assessment aggregation with R02; **R04b** retains current
published partial-cover/full-year-spouse assessed-dollar fixtures. SAPTO, exemptions, household
changes and special income/cover remain separate unsupported branches. Neither blocker is fully
resolved; those branches do not prevent review of the bounded raw components.

The [AT05 precision follow-up](annual-tax-component-boundaries.md#at05--current-law-precision-follow-up)
rechecks current LITO and liability provisions and records the 2000 replacement of s16B.
It does not close **R02b–d/R03c/R04a**: intermediate half-cent handling, the $66,667 endpoint,
final liability/credit composition and independent final-assessment fixtures remain missing.
T81 verifies SBR release metadata only; its linked DOCX bodies were not readable through the
web tool, and the 2027 release is explicitly Draft. No rounding convention is inferred from that lead.

The [HELP follow-up](help-and-withholding-evidence.md) narrows **R05/R14**: statutory debt timing,
annual/PAYG distinction, published multi-scheme priority and nine payroll examples are verified.
R05 now explicitly includes T51's unresolved 2026–27 **$9,028 versus $9,028.35** base discrepancy
and inconsistent annual examples. [H05a](help-and-withholding-evidence.md#h05a--precision-follow-up-23-october-2026)
narrows the raw-component contract: s154-25(3) rounds indexed income thresholds, not the first
percentage component. Preserve the statutory $9,028.35 raw amount; no verified correction or
final-assessment precision rule reconciles T51. Other schemes' detailed statutory allocation, debt histories,
concessions and final rounding remain open. R14 retains full combined-scale verification and
coherent component breakdown: separately rounded ordinary/loan amounts can differ from the
published combined formula. Do not conceal that difference or treat it as immediate debt credit.

The [super follow-up](super-money-flows.md) narrows **R06–R08**: statutory QE/sacrifice treatment,
selected-year caps, ordinary receipt rules, out-of-cycle conditions, personal-deduction boundaries,
conditional fund tax and the published Div293 example are verified. Complete pay classification,
historical eligibility, contribution/fund adjustments, precision and special regimes remain open.
The user confirmed separate guaranteed/target bonus scenarios; uncertainty classification does
not resolve tax/QE treatment. Accrued super, fund receipts and net contribution value are distinct.

The [earnings-classification follow-up](employee-earnings-classification.md) further narrows
**R06/R10**: ordinary-hours statutory branches, all-commission QE treatment and historical
parental/community/Defence leave exclusions have body evidence. EC04-A/B distinguish inaccessible
detailed ATO guidance from unresolved legal-context review; EC04-C records missing offer facts.
Mixed bonuses, detailed paid-leave/loading and allowance/reimbursement classification remain open.
No end-to-end salary calculation is declared ready on this evidence alone.

## Resolved selected-year amount gap

**R16 — exact amounts resolved on 23 October 2026:** T41's directly retrieved ATO content-host
PDF verifies the 2025–26 $30,000 general concessional cap and $62,500 quarterly maximum
contributions base, with $7,500 ordinary SG at that maximum. It also confirms the distinct
2026–27 amounts. See [O01](ordinary-calculation-evidence.md#o01--historical-super-amounts-resolved).
T38's main-site HTTP 403 history and T39's conflicting ASIC label remain recorded. A complete
historical AWOTE reconstruction was not needed to verify the explicit ATO year table and was
not performed. R06–R08 still block universal super calculations.

## Validity limits

Every numeric fact in [facts.md](facts.md) is tied to retrieved text and a stated period or explicitly limited historical status. Not every cross-reference, exemption or rule interaction has been verified. Unsupported additions belong in this register, not in confirmed tables.

The broad inventory in [fields.md](fields.md) is not exhaustive. It separates evidenced dependencies from proposed representation and research candidates. No application, calculation library, test suite or browser workflow has been implemented or certified by this work.

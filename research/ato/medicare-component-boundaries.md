# Ordinary Medicare component boundaries

Checked **23 October 2026**, Australia/Adelaide; clock observed **2026-10-23 00:21:39 UTC**.
This supplements [M01–M06](medicare-and-mls-evidence.md), using current primary bodies and
independent arithmetic. It specifies bounded **raw components**, not a final assessment or an
implemented calculator. No application code, tests or personal data were used.
All monetary amounts are AUD.

## MC01 — Component scope and inputs

Both selected years use the ordinary levy parameters in M02 under [T09 Schedule 5 item 14][amendment].
The amendment applies to 2025–26 assessments onward; its 1 July 2026 commencement is not the
start of its assessment-year application. No future 2026–27 threshold increase is assumed.
MLS uses each year's distinct M04 table. Refresh legislation before release.

The bounded adult resident case excludes SAPTO entitlement, prescribed-person/full/half
exemptions, special trust/foreign/FHSS/super-lump income, arrears concessions and relevant foreign
tax offsets. An unknown eligibility answer is not interchangeable with an established
absence. The normal full-year comparison does not establish full-year household or cover facts.

| Independently specifiable component                                                 | Established inputs                                                                                          | Output / remaining boundary                                                     |
| ----------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------- |
| Single ordinary levy, no family entitlement                                         | Applicable year; nonnegative established taxable income; exclusion flags resolved                           | M02 individual amount, before assessment rounding                               |
| Stable full-year spouses, neither exempt nor SAPTO-eligible, no qualifying children | Both established taxable incomes; qualifying spouse relationship throughout year                            | MC02 paired raw amounts; current external precision fixture remains absent      |
| Same spouses with children                                                          | Above plus independently established ordinary-levy qualifying count                                         | MC02 arithmetic only; this does not establish child/notional-offset eligibility |
| Single without MLS dependants, or stable full-year spouses                          | Separate M04 income bases; appropriate year/household tier; qualifying cover days for every required person | MC03 raw taxable-income and RFBA charges; final rounding unresolved             |

The inputs are already established tax amounts, not annual salary divided by pay periods.
Spouse income affects eligibility/allocation; it is not the employee's income or bank cash.
The personal levy is not an employee-only tax: [T47 s251S][itaa36] identifies the assessed person;
producing taxable income for a sole trader or other arrangement remains a separate component.

## MC02 — Couple allocation and phase-in

Use `L(x)` from M02 for each spouse first. Let `x` and `y` be their taxable incomes, `F = x + y`,
`H = 47,238 + 4,338n`. Neither spouse has the special adjustments excluded above, and `n` is
the same independently established qualifying count. [T08 ss6–8][levy] gives this raw contract:
- `F ≤ H`: both amounts are zero.
- Otherwise `R = max(0, 0.02H − 0.08(F − H))`.
- If neither spouse's `L` is positive, both amounts remain zero.
- If only one spouse's `L` is positive, that spouse receives the full reduction, limited by their
  levy; the other remains zero.
- If both are positive, initial shares are `rx = R × x/F`, `ry = R × y/F`. Final raw amounts are
  `max(0, L(x) − rx − max(0, ry − L(y)))` and the symmetric expression for `y`.

The last expression is an algebraic transcription of s8(3)'s allocation and s8(4)'s excess
transfer, not an additional tax rule. It avoids division when `F = 0`. Preserve exact fractions
at this stage; contemporary intermediate precision is not established.

**The summary gate is unsafe.** T45 says family relief requires individual income above the
individual upper limit. Section 7(2) expressly calculates its amount before ss8/9, and s8 adds
no such gate. [T70's historical ATO worksheet][historical] also takes the phase-in amount into
the family calculation and transfers excess relief. Thus the statutory ordering is specified;
the current guide discrepancy and absence of a selected-year external couple fixture remain
recorded. Do not silently insert the guide's gate.

**Do not construct the reduction from an upper-threshold table.** For example, established
`n = 2` gives `H = 55,914`; the reduction reaches zero at `1.25H = 69,892.50`.
It is $0.04 at whole-dollar family income $69,892 and zero at $69,893. Adding the guide's rounded
$5,423 child increments to $59,047 gives $69,893; that table endpoint cannot replace the formula.

## MC03 — MLS is a separate day-based component

For the stable ordinary case, retain the definitions and tier tables in M04. The family uses
combined surcharge-test income; each spouse's own surcharge-test income must exceed $28,011.
This is not an ordinary-levy phase-in test. [T08 s8D][levy], [T11 ss14–16][fringe] and T09
establish the selected-year own-income condition.

Let `d` be days on which the statutory uncovered-person condition holds, after eligibility is
established. Both selected years have 365 days. The two raw charges are:
- Taxable-income charge: `taxable income × applicable rate × d/365`.
- Reportable-benefit charge: `reportable fringe benefits total × applicable rate × d/365`.

These combine algebraically before rounding in the ordinary case. Keep their legal origins
separate until final assessment aggregation is verified. Reportable super and net investment
losses enter the tier test, not either charge base. Use full-year income to select the tier;
do not divide that income by the covered/uncovered fraction.

For stable dependants, `d` counts the union of uncovered days across all required people.
Ten overlapping uncovered days are ten days, not twenty. Qualifying coverage is assessed per
person and day; an employee-only policy does not establish a spouse's cover. A policy's covered
day total alone cannot determine the union of different family members' coverage intervals.
M05 retains the policy requirements, suspensions and separate dependency tests.

## MC04 — Precision and assessment boundaries

[T42 s16B][rounding] decreases an assessed tax-related liability to a multiple of five cents.
Newly body-checked [T72 Schedule 1 s90-1][administration] applies income-tax administration to
Medicare levy and the fringe-benefit surcharge. [T47 ss251R(7), 251S(2), 251X][itaa36] establishes
their administration and combined notice presentation. These provisions do **not** supply a
verified instruction to round every raw component independently, or to round a combined
income-tax/levy/MLS/loan total once.

Keep R02/R03/R04 open for that final aggregation and intermediate precision. A two-decimal
example does not establish a universal rounding method. Historical worksheet T70 prints
intermediate cents but does not establish the convention for either selected year.

The later [AT05 precision review](annual-tax-component-boundaries.md#at05--current-law-precision-follow-up)
checks s16B's replacement history and the current statutory index of separate income-tax/study-loan
liabilities. It adds no verified Medicare intermediate rounding or combined-assessment algorithm;
R03c/R04a remain open. SBR publication metadata is not calculation-body evidence.

## MC05 — Published evidence and independent arithmetic

Published amounts were read before recalculation. Synthetic specimens below use exact integer
or rational arithmetic; repeating decimals are explanatory only, not chosen assessed amounts.

| ID    | Evidence / established circumstances                                                                                                                                                               | Checked result                                                                                                                                                                       |
| ----- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| MC-A1 | [T71 Matthew][general], guide dated 12 June 2025; single, no dependants/reduction/exemption, assessable income 76,000 and allowable deductions 1,000                                               | Taxable income 75,000; ordinary levy **1,500**, matching the published amount. The example does not identify a financial year or establish deduction eligibility.                    |
| MC-A2 | T45 Angie 2025–26 and T46 Tom 2026–27                                                                                                                                                              | Existing M-A1/M-A2 remain body-verified: ordinary levy **98.90**, MLS **1,170**.                                                                                                     |
| MC-H1 | T70 Trevor **2007–08 only**, not a selected-year fixture; spouses 21,000/17,500, two qualifying children, historical family reduction 184.60                                                       | Published basic levies 315/19.10; spouse excess transfer leaves Trevor **149.50**, spouse zero. Independently, `315 + 19.10 − 184.60 = 149.50`. Old rates/thresholds are not reused. |
| MC-B1 | Either selected year; ordinary full-year spouses, no qualifying children, taxable incomes 29,000/0                                                                                                 | Raw levy **0/0** by family threshold, despite individual amount 98.90 before family relief.                                                                                          |
| MC-B2 | Same scope, incomes 40,000/10,000                                                                                                                                                                  | Family reduction 723.80; raw levies **76.20/0**.                                                                                                                                     |
| MC-B3 | Same scope, incomes 30,000/28,012                                                                                                                                                                  | Basic amounts 198.90/0.10; family reduction 82.84. Excess transfer yields **116.16/0**.                                                                                              |
| MC-B4 | Same scope, incomes 30,000/28,500                                                                                                                                                                  | Raw levies **22,937/130** and **3,583/130** dollars, approximately 176.438462/27.561538; sum **204**. Final cent/five-cent allocation is not asserted.                               |
| MC-B5 | Both years; full-year spouses, no children/exemptions; own taxable income 109,500, reportable super 20,000; spouse taxable income 100,000; no other adjustments; exactly 100 statutory liable days | Combined test income 229,500 selects tier 1; own charge base 109,500; own raw MLS **300**. Charging reportable super or spouse income would be wrong.                                |

MC-B1–B5 are statutory-derived, not independently published ATO outputs. M-B1–B7 retain the
single thresholds, family zero-reduction boundary, tier thresholds and low-income spouse jump.
No contemporary body-verified family-transfer or part-cover assessed-dollar example was found.
The [2026 M2 page][m2] returned 403; the full 2026 instructions exceed the web reader's size
limit. Secondary reproductions of Michelle/Jacinta are **not verified fixtures**.

## Remaining bounded blockers

- **R03a:** derive ordinary-levy child/notional-offset eligibility and ATI, including maintenance
  and sole-care cases. No-child couples do not depend on this branch.
- **R03b:** obtain a selected-year independent family/phase-in/transfer fixture and precision
  convention; the statutory raw sequence above is now specified.
- **R03c/R04a:** intermediate and final assessment precision/aggregation, cross-linked to R02.
- **R04b:** published independent part-cover and full-year-spouse assessed-dollar fixtures.
- **Separate regimes:** SAPTO, prescribed persons/half exemptions/family agreements, household
  changes, special income, arrears and grandfathered cover remain outside these bounded contracts.

The [ATO software thresholds page][dsp] is body-readable but directs detailed amounts to a DSP
hub that redirects to a login page. No protected material, calculation service or user account
was accessed. Unknown branches remain unavailable; they do not prevent independently specified
raw components from being reviewed or later implemented within their explicit scope.

[amendment]: https://www.legislation.gov.au/C2026A00058/asmade/2026-06-30/text/original/pdf
[levy]: https://www.legislation.gov.au/C2004A03351/2026-07-01/2026-07-01/text/original/epub/OEBPS/document_1/document_1.html
[fringe]: https://www.legislation.gov.au/C2004A00412/2026-07-01/2026-07-01/text/original/epub/OEBPS/document_1/document_1.html
[itaa36]: https://www.legislation.gov.au/C1936A00027/2026-10-01/2026-10-01/text/original/epub/OEBPS/document_4/document_4.html
[rounding]: https://www.legislation.gov.au/C1953A00001/2026-10-01/2026-10-01/text/original/epub/OEBPS/document_1/document_1.html
[administration]: https://www.legislation.gov.au/C1953A00001/2026-10-01/2026-10-01/text/original/epub/OEBPS/document_2/document_2.html
[historical]: https://caat-p-001.sitecorecontenthub.cloud/api/public/content/4b8bd208-9d94-440e-94b9-2757634aa9e0_616e78ce_61d0_43eb_ba00_76121ded1b64_pdf
[general]: https://caat-p-001.sitecorecontenthub.cloud/api/public/content/0-98f170ca-1848-4079-a77c-2bace5ba0c8c
[m2]: https://www.ato.gov.au/forms-and-instructions/individual-tax-return-2026-instructions/medicare-levy-questions-m1-m2-individual-tax-return-2026/m2-medicare-levy-surcharge-2026
[dsp]: https://softwaredevelopers.ato.gov.au/Medicarelevythresholds

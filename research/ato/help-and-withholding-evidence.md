# HELP assessment and study-loan withholding

Checked **23 October 2026**, Australia/Adelaide; clock **2026-10-22 23:09:21 UTC**.
Sources were retrieved as primary bodies. This narrows R05/R14 for ordinary resident employees;
it does not certify an implementation or resolve every loan scheme. No application code or tests
were written. Findings follow confirmed facts, conflicts, then remaining verification.

## H01 — annual eligibility, income and debt

[T12 ss154-1/5/15/20][hesa] establishes these separate dependencies:
- Repayment income: taxable income disregarding assessable FHSS releases, plus total net investment
  loss, applicable reportable fringe benefits, reportable super contributions and defined exempt
  foreign employment income. The latter is net income exempt under ss23AF/23AG, not all foreign
  receipts. Salary, repayment income and MLS income are not interchangeable.
- Liability requires income above the applicable minimum and accumulated HELP debt on **1 June
  immediately before assessment**. A generic current balance or 30 June balance is insufficient.
- The statutory debt cap subtracts amounts already paid or assessed against that debt, including
  amended assessments. Voluntary payments can reduce this cap; they do not directly offset the
  income-based formula. PAYG withholding is not a voluntary debt payment.
- A Medicare Levy Act **s8** family reduction/exemption removes the liability. This is not an
  exemption for everyone who pays no Medicare levy for any reason.

The annual formula and year thresholds remain in [year readiness](year-readiness.md). It applies
throughout 2025–26, rather than splitting at the September payroll change. [T35 Schedule 2][change]

**Current-status check:** [T49 register history and amendment][history] identifies an uncompiled
17 October 2026 amendment after T12 C104's end date. [C2026A00097][amendment] concerns higher
education funding, places and administration; the inspected amendments do not change Division
154's repayment provisions. T12's body remains evidence for those provisions, but C104 must not
be described as a compilation covering dates after 16 October. Its endnotes trace the relevant
annual threshold/formula changes to T35.

## H02 — PAYG cash and debt-credit timing

[T50 ATO loan guide][loans], pp13–20, distinguishes withholding from repayment: payroll amounts
form part of PAYG and are applied to the loan after return processing and compulsory assessment,
not after each payday. Other income can make employer withholding insufficient. A refund is
conditional on the total assessment and other debts; it is not guaranteed from one component.

Full repayment changes the declaration state; a projected balance obtained by subtracting
withholding does not establish payoff. Voluntary repayments must be credited before the relevant
assessment to affect the outstanding debt considered there. Their receipt/indexation timing
remains relevant. Future indexation, new debts and concessions cannot be assumed away.

For business/investment income, PAYG **instalments** may account for study loans. This is distinct
from employee Schedule 1/8 withholding. Do not apply employee payroll tables to invoice revenue.

## H03 — representative payroll rule periods

Ordinary bounded path: resident employee, TFN supplied, threshold claimed, loan declared, no
s8 low-family-income variation, additional declared offset, irregular payment or other variation.
No TFN is stored; only declaration status is needed. Full-year comparison does not erase periods.

| Payment period                          | Source                    | Weekly STSL threshold, AUD | Verified formula boundary                                                              |
| --------------------------------------- | ------------------------- | -------------------------: | -------------------------------------------------------------------------------------- |
| 1 July–23 September 2025                | [T33 Schedule 8][early]   |                      1,079 | `a × x`; historical whole-income percentage bands, not the new annual marginal formula |
| 24 September 2025–30 June 2026          | [T34 Schedule 8][late]    |                      1,288 | Marginal coefficients below                                                            |
| 1 July 2026 onward, checked for 2026–27 | [T22 Schedule 8][current] |                      1,337 | Indexed marginal coefficients below                                                    |

For each row, weekly-equivalent `x = floor(earnings) + 0.99`. Fortnightly earnings are divided by
2 first. Monthly conversion adds $0.01 if monthly earnings end in $0.33, then multiplies by 3/13;
quarterly divides by 13. Relevant taxable allowances are included. Bonuses/commissions covering
multiple or undefined periods require Schedule 5's additional-payment method; do not apply that
method to a single-period payment. Lump-sum termination payments do not attract the Schedule 8
component. Without a TFN, Schedule 8 does not apply. [T33][early], [T22 Schedule 5][current]

Standalone weekly STSL component `y = a × x − b`; upper bounds are exclusive:

| Source | x below, AUD |    a |   b, AUD |
| ------ | -----------: | ---: | -------: |
| T34    |        1,288 |    0 |        0 |
| T34    |        2,403 | 0.15 | 193.2692 |
| T34    |        3,447 | 0.17 | 241.3462 |
| T34    |    Otherwise | 0.10 |        0 |
| T22    |        1,337 |    0 |        0 |
| T22    |        2,494 | 0.15 | 200.5615 |
| T22    |        3,577 | 0.17 | 250.4527 |
| T22    |    Otherwise | 0.10 |        0 |

The original bodies contain the historical percentage bands and the **combined** Schedule 1+8
scales. Use the applicable published coefficients; adding rounded component amounts does not
reproduce every combined-scale result. T22's combined scale-2 `b = 382.2935` in the relevant band
also differs from summing its two standalone constants (`181.7319 + 200.5615 = 382.2934`).

Round directly to whole dollars, half up, with no preliminary cent rounding. For fortnightly
payments, round weekly then multiply by 2; monthly, multiply rounded weekly by 13/3 and round
again; quarterly, multiply rounded weekly by 13. Additional offsets/Medicare adjustments need
their separate rules. The instruments accept formula/table differences due to component
rounding. [T34][late], [T22][current]

**Output implication:** combined withholding already includes STSL. Never add the standalone
loan amount again. A displayed tax/loan breakdown must disclose any rounding difference rather
than claim its components are separately credited debt payments. A coherent method and breakdown
remain to be specified; none is selected here.

## H04 — independently checked published payroll examples

Source examples were read first; arithmetic was then recalculated using exact scaled integers
and rational period conversion, independently of salary code. All nine published STSL amounts
matched. Values below are AUD; monthly examples marked _no threshold_ are diagnostic cases
outside the bounded threshold-claimed path.

| Source/example               | Period earnings |        x | Raw weekly STSL | Published and recalculated period STSL |
| ---------------------------- | --------------: | -------: | --------------: | -------------------------------------: |
| T33/1, weekly                |        1,095.84 | 1,095.99 |         10.9599 |                                     11 |
| T33/2, fortnightly           |        2,455.78 | 1,227.99 |         12.2799 |                                     24 |
| T33/3, monthly               |        5,688.45 | 1,312.99 |         26.2598 |                                    113 |
| T34/1, weekly                |        2,608.36 | 2,608.99 |        202.1821 |                                    202 |
| T34/2, fortnightly           |        4,409.75 | 2,204.99 |        137.4793 |                                    274 |
| T34/3, monthly, no threshold |       10,627.88 | 2,452.99 |        235.1621 |                                  1,018 |
| T22/1, weekly                |        2,608.36 | 2,608.99 |        193.0756 |                                    193 |
| T22/2, fortnightly           |        4,409.75 | 2,204.99 |        130.1870 |                                    260 |
| T22/3, monthly, no threshold |       10,627.88 | 2,452.99 |        226.0556 |                                    979 |

Additional synthetic cases, using the bounded ordinary assumptions:
- **Combination order:** T33 fortnightly $2,455.78 gives combined raw weekly $228.513773,
  hence $458. Separately rounded ordinary $432 plus STSL $24 totals $456. Neither equals an
  annual HELP obligation; the $2 difference must not be silently lost or labelled loan credit.
- **Premature cent rounding:** T34 fortnightly $4,409.75 gives combined weekly $666.4991,
  hence $1,332. Rounding to cents first incorrectly gives $1,334. T22 gives $1,308.
- **September boundary:** at $1,200 weekly, standalone STSL changes from $12 to $0 on
  24 September 2025. The full-year annual method does not change on that day. See Y04.

These are research arithmetic checks, not executed Bun tests or actual payroll observations.

## H05 — other schemes and annual source conflicts

[T51 ATO rate guide][rates], pp1–2, explicitly covers HELP, VSL, SFSS, SSL, ABSTUDY SSL and
AASL (formerly TSL), with common annual rates and repayment priority in that order. Schedule 8
calls the financial-supplement category **FS** and groups ABSTUDY SSL with SSL. This verifies
the published scope/order, not every scheme's statutory debt definition, exception or allocation.
Do not charge a complete income-based repayment independently for each simultaneous loan.

**Verified annual example:** T50's Grace has 2025–26 repayment income $80,000; the published
$1,950 matches `15% × (80,000 − 67,000)`, assuming sufficient repayable debt and no exemption.
Its approximate fortnightly saving is not a payroll-table fixture or a promise of 26 deposits.

**Conflicts, excluded from accepted expected results:** T51 is body-verified, updated
30 June 2026, but pp2–5 contain these inconsistencies:

| Evidence                                                  | Independently checked discrepancy                                                                                                                                                                             |
| --------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 2026–27 table/Barry uses second-band base $9,028          | T12/T13 give `15% × (129,717 − 69,528) = 9,028.35`. At RI $137,064, statutory raw arithmetic is $10,277.34; the guide gives $10,276.99. No verified rounding rule resolves the 35-cent difference.            |
| Christina lists taxable income $60,470, then adds $60,720 | Listed components total $86,380 only with $60,470; the displayed sum using $60,720 totals $86,630. The published RI $86,380 and repayment $2,527.80 agree with the listed inputs, not the displayed addition. |
| Priya's 2026–27 example cites threshold $179,286          | This is the prior year's breakpoint. Her RI $254,780 and $25,478 repayment agree with the 10% cap, but the stated year/threshold explanation is unreliable.                                                   |

The statute's raw 2026–27 cap boundary gives $18,604.96 at RI $186,050 and $18,605.10 at
$186,051, before any applicable final-assessment rounding. Preserve this distinction from
the guide's rounded-base table. No final 2026–27 assessment fixture is accepted from the
conflicted second-band example. [T12][hesa], [T13][gazette]

### H05a — precision follow-up, 23 October 2026

Clock **2026-10-23 03:44:41 UTC**. Fresh BODY reads of T12 ss154-20/25, T13 and T51
narrow the issue without reconciling the sources. T51 still bears **30 June 2026** and retains
all three inconsistencies above. Targeted ATO/Department searches found no dated correction;
that search result is not proof that no correction exists. H01's compilation-date caveat remains.

**Verified distinction:** s154-25(3) rounds the indexed **income thresholds** from s154-25(2)
down to whole dollars. It does not instruct rounding the s154-20(2)(a) repayment component.
The gazetted thresholds therefore give the raw first-band amount
`15% × (129,717 − 69,528) = $9,028.35`. Retain this statutory expression; do not replace it
with T51's $9,028 constant. This specifies raw component arithmetic, not final assessment
precision. [T12 ss154-20(1)–(2), 154-25(1)–(3)][hesa] [T13][gazette]

Independent integer-cent recalculation, with liability eligibility established and debt/10%
caps not limiting, shows the discrepancy at the immediate whole-dollar boundary:

| Repayment income, AUD | Statutory raw amount, AUD | T51 table expression, AUD |
| --------------------- | ------------------------: | ------------------------: |
| 129,717               |                  9,028.35 |                  9,028.35 |
| 129,718               |                  9,028.52 |                  9,028.17 |
| 137,064               |                 10,277.34 |                 10,276.99 |

The T51 expression decreases by $0.18 at the first boundary; the statutory expression
increases by $0.17. This is a diagnostic calculation, not a published assessment fixture.
No inspected authority permits solving it by dropping the first band's cents. Final liability
precision, input grouping and an independently verified 2026–27 assessment remain open.
The contradictory evidence above is preserved, not silently corrected or accepted for testing.

## H06 — required evidence and future verification

Proposed fields, derived from verified dependencies, are not approved interface requirements:

| Dependency       | Necessary information                                                                                                                                  |
| ---------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Annual income    | Separate RI ingredients/FHSS exclusion; validated definitions, year and personal overrides                                                             |
| Debt cap         | Scheme balances, provenance/date, relevant June debt, payments/prior assessments and concessions; unknown cap must not become an assumed large balance |
| Family exception | Whether the actual s8 reduction/exemption applies; generic Medicare-exempt status is insufficient                                                      |
| Payroll          | Rule period, taxable earnings, frequency, declaration states, payment class, variations and chosen coherent rounding method                            |
| Cash flow        | PAYG withheld, assessed loan obligation and voluntary repayment kept separate; no automatic per-pay reduction of loan balance                          |

Future verification must cover each coefficient boundary and cent-bearing input; the monthly
33-cent adjustment; combined versus separate rounding; declaration/exemption transitions; annual
thresholds and 10%/debt caps; missing debt evidence; voluntary-payment timing; multiple schemes;
and other income changing annual RI without becoming employer cash or payroll earnings.

**R05 remains:** resolve T51's precision conflict and final assessment rounding; verify complete
debt/indexation/reduction histories, other schemes' statutory allocation and exemptions, overseas
assessment, hardship deferral and occupational/location benefits. **R14 remains:** additional
offsets/Medicare variations, irregular pay and other scales/regimes, plus complete independent
combined-scale fixtures. Representative payroll does not establish annual deposits or payoff dates.

The [approved incremental annual attribution](annual-cash-and-tax-attribution.md) retains relevant personal
tax context. A whole-person cash summary remains optional and unapproved; it is not added to the
user's required package, bank, super and tax views by this research.

[hesa]: https://www.legislation.gov.au/C2004A01234/2026-07-01/2026-07-01/text/original/epub/OEBPS/document_1/document_1.html
[change]: https://www.legislation.gov.au/C2025A00030/asmade/2025-08-02/text/original/epub/OEBPS/document_1/document_1.html
[history]: https://www.legislation.gov.au/C2004A01234/latest/versions
[amendment]: https://www.legislation.gov.au/C2026A00097/asmade/2026-10-16/text/original/epub/OEBPS/document_1/document_1.html
[gazette]: https://www.legislation.gov.au/C2026G00249/asmade/2026-04-20/text/original/epub/OEBPS/document_1/document_1.html
[loans]: https://caat-p-001.sitecorecontenthub.cloud/api/public/content/0-736963d7-4616-49dd-bfbe-9dab124707a2
[rates]: https://caat-p-001.sitecorecontenthub.cloud/api/public/content/0-541493af-7e73-48ae-aeac-89705f225c09
[early]: https://www.legislation.gov.au/F2025L00647/asmade/2025-06-04/text/original/epub/OEBPS/document_1/document_1.html
[late]: https://www.legislation.gov.au/F2025L01016/asmade/2025-09-01/text/original/epub/OEBPS/document_1/document_1.html
[current]: https://www.legislation.gov.au/F2026L00716/asmade/2026-06-12/text/original/epub/OEBPS/document_1/document_1.html

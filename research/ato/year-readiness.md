# Tax readiness: 2025–26 and 2026–27

Checked **23 October 2026 Australia/Adelaide**; clock observations `2026-10-22 22:27:34 UTC`
and `2026-10-22 22:42:21 UTC`. The [ordinary-calculation follow-up](ordinary-calculation-evidence.md)
resolves R16's historical amounts and narrows annual/PAYG rounding gaps.
This supplements [facts](facts.md), [inputs](fields.md), [sources](sources.md) and
[blockers](blockers.md). No salary implementation was written.

The user selected both years, default **2026–27**, annual liability and payroll withholding
shown separately, alternative offers side by side, and both gross and after-tax results.
Initial calculations are confirmed for full-year Australian tax residents, all employee types
and sole-trader contracting. Own company/partnership/trust contracting models are deferred.
Ordinary company-paid wages and relevant entity-derived shared personal tax inputs are not
excluded. Actual residency, deduction eligibility and household circumstances require inputs.

Comparisons model a normal full year, without job start/end-date comparisons. Personal tax
settings are shared, with explicit per-offer overrides. Pay frequency defaults to editable
fortnightly; four weeks of annual leave applies only where employment rules permit. Full-year
comparison does not itself prove tax residency or eliminate within-year rule changes.
PAYG uses representative pay periods for each applicable rule period, not a full dated payroll
calendar. Do not invent a payment date or imply 26 actual deposits. Standard paid-hours rates
use an editable 52-week conversion; financial-year calendar calculations cover actual work,
attendance and commuting. Remuneration includes pay, super and benefits; employer-only payroll tax and workers'
compensation are excluded. Show bank, super and tax destinations/rates separately, preserving
loan repayments and gross/net fund inflows. Travel-inclusive hourly value and a monetary
travel-time deduction are separate measures.
Saved comparisons recalculate from linked offers/shared settings. New application versions also
recalculate them for verified tax-rule corrections and identify the changed rule. Component-specific
annualisation and final cash/hourly precision still need definition.

**Component verified** means the stated value/date has primary body evidence. **Incomplete**
means eligibility, calculation details or validation still prevent a supported result.
**Unavailable** means evidence has not established the required implementation value. No row
certifies a complete calculator. The unfinished 2026–27 income year needs a legislative refresh
before release or an assessment-year claim.

## Annual assessment matrix

All money is AUD. Income years run 1 July–30 June. Rates apply marginally to annual ordinary
taxable income, not gross package value. Every integrated calculation remains incomplete.

| Component                                                  | 2025–26                                                                                                                | 2026–27                                                                                                  | Evidence and remaining dependency                                                                                                                                                                                                                                                                                                                                                                                                                                               |
| ---------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Ordinary full-year resident brackets                       | $0–18,200: 0%; above $18,200–45,000: 16%; above $45,000–135,000: 30%; above $135,000–190,000: 37%; above $190,000: 45% | Same boundaries; first taxable band becomes 15%                                                          | Component verified: [T01 Schedule 7](https://www.legislation.gov.au/C2004A03348/2026-07-01/2026-07-01/text/original/epub/OEBPS/document_1/document_1.html). Residency, special income, deductions, offsets and annual rounding: R01/R02.                                                                                                                                                                                                                                        |
| Nonresident / WHM / part-year                              | Ordinary nonresident and WHM bands in F01                                                                              | Same ordinary bands in retrieved law                                                                     | T01 components verified; classification incomplete. Treaty, temporary-resident, part-year and overseas rules cannot be inferred from nationality or offer location: R01.                                                                                                                                                                                                                                                                                                        |
| LITO / other offsets                                       | F03 LITO component applies                                                                                             | Same F03 component                                                                                       | [T03 ss61-110/115 and 63-10](https://www.legislation.gov.au/C2004A05138/2026-10-01/2026-10-01/text/original/epub/OEBPS/document_2/document_2.html). O02 verifies ordinary LITO ordering and non-refundable liability limit; eligibility, other offsets and sub-cent/$66,667 handling remain incomplete. T07's working Australians offset starts 2027–28, outside both years.                                                                                                    |
| Standard work deduction                                    | New s25-130 deduction does not apply                                                                                   | Additional deduction: `max(0, min(1000, assessable labour income) − specified deductions)`               | [T02 s25-130](https://www.legislation.gov.au/C2004A05138/2026-10-01/2026-10-01/text/original/epub/OEBPS/document_1/document_1.html), [T07 Schedule 4 item 17](https://www.legislation.gov.au/C2026A00049/asmade/2026-06-26/text/original/epub/OEBPS/document_1/document_1.html). Resident-at-some-time and statutory labour-income tests apply. F02 defines expense interactions. Not an automatic extra $1,000 beside all actual deductions or universal contractor deduction. |
| Medicare levy, ordinary individual                         | 2%; low-income threshold $28,011; phase-in limit $35,013                                                               | Same amounts under currently retrieved law; no later increase assumed                                    | [T08 ss3/6/7](https://www.legislation.gov.au/C2004A03351/2026-07-01/2026-07-01/text/original/epub/OEBPS/document_1/document_1.html), [T09 Schedule 5 item 14](https://www.legislation.gov.au/C2026A00058/asmade/2026-06-30/text/original/epub/OEBPS/document_1/document_1.html): 2025–26 assessments onward. Phase-in caps levy at 10% of excess through the statutory limit. SAPTO/family/exemption/day rules: F04, R03.                                                       |
| MLS tier boundaries                                        | Single: $101,000 / $118,000 / $158,000; family: $202,000 / $236,000 / $316,000                                         | Single: $105,000 / $123,000 / $164,000; family: $210,000 / $246,000 / $328,000                           | [T10 dated tables](https://privatehealth.gov.au/health_insurance/surcharges_incentives/medicare_levy.htm): rates 0%, 1%, 1.25%, 1.5%; each boundary is that tier's inclusive upper end. Source publishes whole-dollar ranges. Child adjustment, qualifying cover/days and distinct tier-test/charge bases: F05, R04.                                                                                                                                                            |
| Annual HELP                                                | Minimum `L = 67,000`; upper `U = 125,000`                                                                              | `L = 69,528`; `U = 129,717`                                                                              | [T35 Schedule 2 items 5/6/33/34](https://www.legislation.gov.au/C2025A00030/asmade/2025-08-02/text/original/epub/OEBPS/document_1/document_1.html), [T13](https://www.legislation.gov.au/C2026G00249/asmade/2026-04-20/text/original/epub/OEBPS/document_1/document_1.html). New annual method applies throughout 2025–26 despite later payroll change. Eligibility, debt timing, overseas and other loan schemes: R05.                                                         |
| Eligible car deduction rate                                | 88 cents/km                                                                                                            | 91 cents/km                                                                                              | [T36 s6](https://www.legislation.gov.au/F2024L00697/asmade/2024-06-17/text/original/epub/OEBPS/document_1/document_1.html), [T31 ss2/6 and repeal](https://www.legislation.gov.au/F2026L00785/asmade/2026-06-23/text/original/epub/OEBPS/document_1/document_1.html). Components verified. Commuting distance is not automatically deductible business distance. Eligibility, records and method interactions: R11.                                                             |
| Other deductions, packaging, ESS, termination, investments | Classification required                                                                                                | Classification required; salary-packaged work-item exemption changes for FBT years starting 1 April 2027 | F02/F09–F12; T07 Schedule 4 Part 2. FBT and income years differ. R07/R09–R13 remain open.                                                                                                                                                                                                                                                                                                                                                                                       |

Packaging entries in this matrix retain research findings, not approved perk calculations.
Perks add entered personal value only, without funding or salary/contribution deductions.
Required statutory tax-profile amounts remain separate and independently evidenced; a personal
value does not establish taxable/reportable value or tax-free treatment.

HELP component, subject to [T12 ss154-1/5/15/20](https://www.legislation.gov.au/C2004A01234/2026-07-01/2026-07-01/text/original/epub/OEBPS/document_1/document_1.html):
`min(0.15 × max(0, min(RI, U) − L) + 0.17 × max(0, RI − U), 0.10 × RI, repayable debt)`.
`RI` is statutory repayment income, not salary. Exemptions, location-sensitive teacher/health
practitioner measures and final rounding are not resolved by this formula.

[HELP follow-up H01–H06](help-and-withholding-evidence.md) verifies debt/assessment timing and
published scheme priority. It records a **2026–27 annual-guide conflict**: T51's $9,028 second-band
base differs from the statute's raw $9,028.35. Y02 remains raw arithmetic, not final-assessment
validation. Nine published Schedule 8 examples match independent arithmetic; combined and
separately rounded PAYG components can differ. R05/R14 remain open.

The [Medicare supplement](medicare-and-mls-evidence.md) verifies further ordinary family and
MLS components, sources a corrected low-income-spouse amount, and checks published examples.
R03/R04 remain incomplete. [Annual cash attribution](annual-cash-and-tax-attribution.md) keeps
shared personal tax, offer-attributable annual values and representative payroll cash distinct;
the incremental convention is approved: tax with the offer minus tax without it, with both valid
scenarios recomputed. A whole-person cash summary remains an optional proposal.

## Payroll withholding matrix

| Payment date                                 | Retrieved instrument                                                                                                                | Evidence status                                                                                                                                                        |
| -------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1 July–23 September 2025                     | [T33 F2025L00647](https://www.legislation.gov.au/F2025L00647/asmade/2025-06-04/text/original/epub/OEBPS/document_1/document_1.html) | BODY; section 2 commencement; Schedule 8 whole-income percentage bands. Historical, now repealed.                                                                      |
| 24 September 2025–30 June 2026               | [T34 F2025L01016](https://www.legislation.gov.au/F2025L01016/asmade/2025-09-01/text/original/epub/OEBPS/document_1/document_1.html) | BODY; sections 2/5 commencement/repeal; revised marginal loan coefficients. Registration on 1 September is not commencement.                                           |
| From 1 July 2026, including selected 2026–27 | [T22 F2026L00716](https://www.legislation.gov.au/F2026L00716/asmade/2026-06-12/text/original/epub/OEBPS/document_1/document_1.html) | BODY; section 2, Schedules 1/8; [register](https://www.legislation.gov.au/F2026L00716/asmade) confirms latest/in force at retrieval. Future amendments require review. |

Each instrument separates ordinary pay (Schedule 1), horticulture/shearing (2), entertainers (3),
return-to-work (4), irregular pay (5), annuities (6), unused leave (7), loans (8), seniors (9),
voluntary agreements (10), ETPs (11), super payments (12/13), extra withholding (14), WHM (15).
A contractor is not automatically a Schedule 1 employee. T33/T34/T22; R14.

The 2025 Schedule 1 Medicare parameters differ from final 2025–26 assessment law. Replacing
coefficients with annual levy thresholds would alter historical withholding. Historical examples
can retain earlier years: T33/T34 Schedule 11 labels some caps 2024–25. Those figures do not
establish 2025–26 indexed termination caps.

Proposed application inputs: applicable rule period/frequency, taxable components, declaration status/effective
date, threshold claim, residency/WHM status, loan declaration, Medicare variation, claimed offsets,
authorised variations/extra withholding, prior irregular payments and applicable year-to-date
amounts. These represent schedule dependencies, not approval of an interface or data schema.
Record whether a TFN was provided; do not collect the actual TFN.

Annual tax divided by 26 is not fortnightly withholding. Schedule 1 uses weekly-equivalent
earnings, prescribed rounding and conversion; 27-pay years have extra-withholding considerations.
Bank cash also depends on salary sacrifice, reimbursements and post-tax deductions. Final
assessment reconciliation is separate from a past bank deposit. F10/T14; complete schedule
fixtures and cash definitions remain unresolved.

## Super and employment boundary

The [money-flow supplement](super-money-flows.md) adds verified contribution categories,
receipt-year boundaries, ordinary timing/out-of-cycle conditions and bounded reconciliation
specimens. Gross contributions are not automatically final account growth. R06–R08 remain open.

| Area                                      | 2025–26                                                                                                                                   | 2026–27                                                                                 | Readiness / required inputs                                                                                                                                                                                                                                                                                                                                                        |
| ----------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Ordinary SG                               | 12%; quarterly OTE basis including relevant sacrificed OTE                                                                                | 12%; QE, annual base and Payday Super                                                   | [T37 historical ss6/15/19/23](https://www.legislation.gov.au/C2004A04402/2026-03-27/2026-03-27/text/original/epub/OEBPS/document_1/document_1.html), [T15 ss10A/17A](https://www.legislation.gov.au/C2004A04402/2026-07-01/2026-07-01/text/original/epub/OEBPS/document_1/document_1.html). Classify pay components, eligibility, salary sacrifice and employer/year-to-date base. |
| Base/cap amounts                          | General concessional cap $30,000; quarterly maximum contributions base $62,500 per employer; ordinary SG $7,500 at that quarterly maximum | Basic concessional cap $32,500; annual maximum contributions base $270,830 per employer | [T41 ATO PDF, Tables 1.1/23/24](https://caat-p-001.sitecorecontenthub.cloud/api/public/content/0-af5a46ad-7287-431c-be8e-4a0c9bbc5fc1), T18/T37. Exact amount gap R16 resolved; R06–R08 remain. Individual cap, carry-forward, receipt timing and employer SG base differ. Do not import an annual base into 2025–26.                                                              |
| Transition                                | Historical quarters governed by saved rules                                                                                               | QE payment days from 1 July 2026, including earlier work                                | [T16 Schedule 1 item 182](https://www.legislation.gov.au/C2025A00057/asmade/2025-11-06/text/original/epub/OEBPS/document_1/document_1.html). Receipt exceptions and Norfolk Island transition incomplete.                                                                                                                                                                          |
| Inclusive salary/bonus quote              | Establish components and OTE treatment                                                                                                    | Establish components and QE treatment                                                   | [Case review](case-guide-review.md). Includes-super describes the quote; it does not classify a bonus, establish contractual entitlement or override caps.                                                                                                                                                                                                                         |
| Individual labour contractor              | SG employee extension may apply                                                                                                           | SG employee extension may apply                                                         | T37/T15 s12; F07. Contract facts and counterparty matter, not label alone.                                                                                                                                                                                                                                                                                                         |
| Sole-trader contracting                   | Initial contractor branch; personal/business treatment required                                                                           | Same boundary                                                                           | F11, T04/T24. GST, PAYG instalments, PSI, deductions and cash timing need verified treatment. Invoice value is not personal net pay: R12a–c.                                                                                                                                                                                                                                       |
| Own company/partnership/trust contracting | Deferred outside initial calculations                                                                                                     | Same boundary                                                                           | R12d research is retained, not an initial-release blocker. Ordinary wages paid by these entities and relevant shared personal tax inputs remain separate from this deferral.                                                                                                                                                                                                       |

## Independent component examples

Synthetic arithmetic was recalculated separately from any application code. These are future
fixture candidates, not executed application tests. Unstated components are excluded.

**Y01 — raw resident basic tax.** Full-year ordinary resident; input is already-established
taxable income. No offsets, Medicare, loans or special income. T01:

| Taxable income | 2025–26 raw tax | 2026–27 raw tax |
| -------------- | --------------- | --------------- |
| $18,200        | $0.00           | $0.00           |
| $18,201        | $0.16           | $0.15           |
| $45,000        | $4,288.00       | $4,020.00       |
| $45,001        | $4,288.30       | $4,020.30       |
| $135,000       | $31,288.00      | $31,020.00      |
| $190,000       | $51,638.00      | $51,370.00      |

**Y02 — raw HELP component.** Eligible HELP debtor, no exemption, sufficient statutory debt
unless capped below. T12/T13/T35; assessed rounding remains unresolved:

| Year    | RI → calculated amount                                                    |
| ------- | ------------------------------------------------------------------------- |
| 2025–26 | $67,000 → $0; $67,001 → $0.15; $125,000 → $8,700; $125,001 → $8,700.17    |
| 2026–27 | $69,528 → $0; $69,529 → $0.15; $129,717 → $9,028.35; $129,718 → $9,028.52 |
| Both    | RI $200,000, debt at least $20,000 → $20,000 after 10%-of-RI cap          |
| Both    | RI $100,000, statutory repayable debt $100 → $100                         |

**Y03 — ordinary fortnightly PAYG.** Resident, TFN provided, threshold claimed, Schedule 1
scale 2, $2,000 taxable fortnightly pay, no loan, additional declared tax offset, Medicare
variation or extra withholding.
Weekly equivalent: $1,000.99. T33/T34 give
`0.3227 × 1000.99 − 180.0385 = 142.980973`; weekly rounding and doubling give **$286**.
T22 gives `0.3227 × 1000.99 − 185.1935 = 137.825973`, producing **$276**.
These are withholding amounts, not annual tax or complete bank deposits.

**Y04 — September payroll boundary.** Employee with TFN provided, a declared HELP debt and
threshold claimed; ordinary $1,200 weekly earnings, no low-family-income Medicare variation.
Unchanged circumstances across both dates. Schedule 8 component only:
23 September 2025 → `1200.99 × 1% = 12.0099`, rounded **$12** (T33);
24 September 2025 → **$0**, below revised $1,288 weekly threshold (T34).
This does not split the annual HELP assessment method.

**Y05 — kilometre method.** Assuming independently established eligibility, method requirements
and 5,000 business kilometres: **$4,400** for 2025–26; **$4,550** for 2026–27 (T36/T31/T32).
These are deduction components, not tax saved or established commuting expenses. Additional
distance does not increase this method's deduction limit; economic distance is not capped by it.

## Outstanding evidence and acceptance

[MC01–MC05](medicare-component-boundaries.md) specifies ordinary single and stable full-year-spouse
raw levy/MLS components, including family excess transfer and distinct income/charge bases.
Current assessment precision and external family/day fixtures remain open; unrelated SAPTO,
exemption and household-change branches do not block those bounded raw contracts.

[AT01–AT04](annual-tax-component-boundaries.md) narrows R02 into input construction,
LITO precision, liability boundaries and external assessment fixtures. Basic resident tax
on established whole-dollar taxable income is independently specifiable; unrelated special
regimes do not block that component. It is not a complete offer-level after-tax result.
- **Ordinary annual results:** R01–R05 cover regime/eligibility, income/deduction precision,
  remaining rounding/offset rules, Medicare/family/MLS and debt rules. O02 verifies ordinary LITO
  ordering and the assessed-liability five-cent rule without resolving the full sequence. The annual Medicare
  phase-in endpoint follows statute; payroll explanatory wording is not a substitute. No complete
  final-assessment expected dataset exists.
- **Payroll:** O03 independently checks 32 published ordinary scale-2 weekly samples and six
  period-conversion samples, plus targeted rounding candidates. R14 remains for other supported
  branches, declarations, irregular pay and integrated cash flows. Representative periods do not
  establish an actual annual deposit count. Historical dates/amounts require individual checks.
- **All employee types and sole-trader contracting:** R06–R13 cover applicable SG,
  contribution/benefit taxes, GST/PSI, equity/termination, expenses and other personal income.
  Own-entity contracting/extraction models under R12d are deferred, not initial-release blockers.
  R16's exact 2025–26 cap/base gap is resolved by T41; the conflicting ASIC year label remains recorded.
- **Proposed boundary coverage:** below/at/above income thresholds; 23/24 September 2025;
  30 June/1 July 2026; 31 March/1 April 2027 for relevant FBT; unknown eligibility, missing
  declarations, negative/non-finite input, cents/rounding ties, low/zero debt, capped SG and
  eligible/ineligible expenses. Expected outcomes must be sourced independently of implementation.
- **Product decisions:** remaining supported special circumstances, component-specific annualisation,
  precision and after-tax cash/hourly definitions. Incomplete drafts are approved: flag missing
  inputs and leave dependent results unavailable. Initial full-year residents, incremental tax
  attribution, guaranteed/target bonus scenarios and shared settings with explicit overrides are
  confirmed. New application versions auto-recalculate saved comparisons for verified tax-rule
  corrections and identify the changed rule.
  Gross/after-tax availability does not authorise invented tax values when evidence or inputs
  are missing.

No personal data was submitted. PayCalculator remains unvalidated (R15). These narrow arithmetic
checks provide no browser, persistence or implementation proof.

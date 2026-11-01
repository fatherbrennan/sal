# Ordinary tax evidence: follow-up

Checked **23 October 2026 Australia/Adelaide**; clock `2026-10-22 22:42:21 UTC`.
This closes the historical super-amount gap and narrows R02/R14. It supplements
[year readiness](year-readiness.md); it does not establish a complete assessment or payroll engine.
References T01–T44 are in [sources.md](sources.md).

The selected model is a normal full-year alternative offer, with representative pay periods for
each applicable rule period. It does not promise a dated pay calendar or 26 actual deposits.
Shared personal settings allow explicit offer overrides. Remuneration includes pay, super and
benefits; employer-only payroll tax and workers' compensation are outside the selected scope.
Bank cash, gross/net super inflows, taxes and loan repayments need separate destinations and rates.
Travel-inclusive hourly value and a monetary travel-time deduction remain separate measures.
Standard paid-hours rates use an editable 52-week conversion; financial-year calendar calculations
cover actual work, attendance and commuting. These are labelled separately from representative
PAYG. Saved comparisons recalculate from linked offers/settings. Later confirmed: verified tax-rule
corrections in new application versions also recalculate saved comparisons and identify the changed rule.

## O01 — Historical super amounts resolved

The retrieved [ATO content-host PDF, T41][super] identifies the same asset as blocked T38 and
credits the Australian Taxation Office on PDF page 74. Its section dates differ: contribution
caps updated 11 September 2026; SG updated 17 April 2026. The cover's older date is not a
publication date for every section.

| Component                                 | 2025–26                | 2026–27                          | Body location             |
| ----------------------------------------- | ---------------------- | -------------------------------- | ------------------------- |
| General annual concessional cap, AUD      | 30,000                 | 32,500                           | PDF p3, Table 1.1         |
| Employer SG maximum earnings base, AUD    | 62,500 **per quarter** | 270,830 **per year**             | PDF pp43–44, Tables 23–24 |
| Ordinary SG at the quarterly maximum, AUD | 7,500                  | Quarterly maximum does not apply | PDF p44, Table 24         |

T37 supplies the historical quarterly statutory framework; T15/T16 supply the July 2026
transition. Independent arithmetic: `62,500 × 12% = 7,500` and
`floor((32,500 ÷ 12%) ÷ 10) × 10 = 270,830`. These verify stated amount relationships, not
an independently reconstructed historical AWOTE series. T41's explicit year table establishes
the historical amount. R16 is resolved for those figures.

The personal cap aggregates contributions; an employer's SG base is a different constraint.
Quarterly caps cannot be replaced with an annual cap for uneven 2025–26 earnings. Contractual
extra super, eligibility, sacrifice, contribution receipt and special regimes remain R06–R08.
T39's inconsistent ASIC year label remains recorded; it does not override the dated ATO table.

## O02 — Annual ordering and rounding: partial resolution

The later [AT01–AT04 review](annual-tax-component-boundaries.md) verifies a bounded
paper-field aggregation example and separates the specified basic-tax component from
remaining LITO precision and complete-assessment gaps.

[T02 s4-10][core] calculates basic income tax before subtracting offsets.
[T03 s63-10][offset-law] orders offsets and determines treatment of unused amounts. Ordinary
LITO falls within item 20: it cannot create a refund, transfer or carry-forward. It reduces
basic income tax, not Medicare levy. This does not generalise to every offset: the table
expressly provides different treatment for foreign-income and refundable offsets. LITO's
resident-at-some-time and under-18 restrictions in ss61-110/115 still apply. The current
[ATO LITO explanation, T43][offset-guide], PDF pp33–34, corroborates the formula.

[T42 s16B][rounding-law], current compilation C227 effective 1 October 2026, reduces a
tax-related liability assessed by the Commissioner, or arising as a penalty, to a multiple
of five cents by rounding downward. It excludes an RBA deficit and general interest charge.
The July 2026 compilation was also inspected. This is not authority to round each intermediate
formula, every offset, or one combined tax/Medicare/loan total indiscriminately. The applicable
liability boundaries and full assessment precision still need verification.

[T44, official 2026 paper return][return] covers **1 July 2025–30 June 2026**. Pages 2–4
instruct income entries without cents and show whole-dollar deduction/taxable-income fields.
Other fields, such as TFN withholding from interest, permit cents. This confirms field-specific
precision, not a universal rounding instruction for sal. The complete instructions PDF could
not be retrieved: the tool rejected its 16,988,116-byte content as too large. No 2027 return
precision or final assessment specification was verified.

Independent raw LITO calculations from T03, before unresolved assessment rounding:

| Established taxable income, AUD | Raw statutory expression, AUD |
| ------------------------------- | ----------------------------- |
| 37,500                          | 700                           |
| 37,501                          | 699.95                        |
| 45,000                          | 325                           |
| 45,001                          | 324.985                       |
| 66,666                          | 0.01                          |
| 66,667                          | −0.005                        |

The final row exposes the unresolved endpoint; it is **not a negative offset to implement**.
Neither the retrieved ATO guide nor the statutory table states its final precision handling.
Do not silently choose an endpoint clamp or rounding sequence. For an eligible adult with
established taxable income of $20,000 and no other offsets, the 2025–26 raw basic tax is
`(20,000 − 18,200) × 16% = 288`; LITO reduces this component to zero, without refunding its
unused $412. This excludes Medicare, loans and all other assessment components.

## O03 — Ordinary PAYG rules and independent checks

Scope: Schedule 1 **scale 2**, Australian-resident ordinary payee, TFN provided and tax-free
threshold claimed; no loan, additional declared offset, Medicare variation, authorised variation,
extra withholding or irregular-payment treatment. This is a bounded employee-payroll example,
not a contractor default. Medicare is already incorporated in this scale.

[T33][payg-early] applies 1 July–23 September 2025; [T34][payg-late] applies
24 September 2025–30 June 2026. Their ordinary scale-2 coefficients and the sampled outputs
match; loan schedules differ. [T22][payg-current] applies from 1 July 2026.

Schedule 1 body evidence establishes:
- Weekly-equivalent earnings discard cents and add $0.99. Use the matching strict `less than`
  band in `y = ax − b`; the last band includes its lower bound.
- Round formula withholding directly to the nearest dollar, with half-dollar ties upward;
  **no preliminary cent rounding**. The no-TFN scale uses a different rule.
- Fortnightly: divide earnings by two before deriving the weekly equivalent; double the rounded
  weekly withholding. Monthly: add $0.01 when period earnings end in $0.33, then multiply by
  `3/13`; convert rounded weekly withholding by `13/3` and round to a whole dollar.
- Formula and lookup-table outputs can differ slightly through component rounding; the
  instruments accept either method. A future implementation must identify its method.

Published Schedule 1 sample outputs were compared with separate integer arithmetic using the
retrieved coefficients. Each pair below is **weekly earnings → whole-dollar withholding**, AUD.
All 32 checks matched. The 2025 samples were checked in both instruments.

| Boundary                   | 2025–26: T33/T34             | 2026–27: T22                 |
| -------------------------- | ---------------------------- | ---------------------------- |
| First taxable coefficient  | 360 → 0; 361 → 0             | 361 → 0; 362 → 0             |
| First Medicare transition  | 499 → 22; 500 → 22           | 537 → 26; 538 → 27           |
| Second Medicare transition | 624 → 55; 625 → 55           | 672 → 60; 673 → 60           |
| 721                        | 720 → 72; 721 → 72           | 720 → 68; 721 → 68           |
| 865                        | 864 → 99; 865 → 99           | 864 → 94; 865 → 94           |
| 1,282                      | 1,281 → 234; 1,282 → 234     | 1,281 → 229; 1,282 → 229     |
| 2,596                      | 2,595 → 654; 2,596 → 655     | 2,595 → 649; 2,596 → 649     |
| 3,653                      | 3,652 → 1,066; 3,653 → 1,067 | 3,652 → 1,061; 3,653 → 1,062 |

The six conversion samples below also matched the published Schedule 1 sample tables and
independent arithmetic. They retain the same stated scope.

| Period earnings    | 2025–26 withholding | 2026–27 withholding |
| ------------------ | ------------------- | ------------------- |
| Fortnightly $1,440 | $144                | $136                |
| Monthly $2,227.33  | $113                | $100                |
| Monthly $3,120     | $312                | $295                |

Additional independently derived regression candidates:
- **No premature rounding:** 2025 weekly $983 gives
  `0.3227 × 983.99 − 180.0385 = 137.495073` → **$137**. 2026 weekly $968 gives
  `0.3227 × 968.99 − 185.1935 = 127.499573` → **$127**. Rounding to cents first
  incorrectly increases each result by $1.
- **Monthly 33-cent boundary:** 2026 monthly $2,331.33 becomes $2,331.34 before conversion;
  weekly equivalent $538.99 gives $26.534 → $27; monthly withholding **$117**.
  T22's sample table independently agrees. Omitting the extra cent selects $537.99 and gives
  $113, exposing the error.

These are research arithmetic checks, not Bun tests or implementation proof. Formula arithmetic
used integers scaled to preserve the published decimals; expected sample outputs were taken
from the source before recalculation. Other scales, declarations, irregular payments, combined
loan withholding and complete cash-flow integration remain R14.

## Remaining blockers and fields

- **R02:** per-field income/deduction aggregation and precision, sub-cent LITO handling including
  $66,667, per-liability five-cent reduction and a complete final-assessment expected dataset.
- **R14:** complete schedule selection and independently checked branches beyond the stated
  scale-2 case. Store the applicable rule period and method, not an invented payment date.
- **R06–R08:** payment classification, eligibility, employer obligation versus fund receipt,
  gross contribution versus fund tax/net inflow, and contribution-limit interactions.
- **Output contract:** gross cash already contains the money later withheld as tax; adding that
  tax again overstates remuneration. Employer SG is separate from cash sacrificed into super.
  Annual assessed liability and PAYG are alternative tax-flow views, never two deductions from
  the same cash. Loan repayment is a separate destination, not income tax or immediately
  reduced debt merely because payroll withheld it. These boundaries follow F07/F08/F10 and
  [CG03](case-guide-review.md#cg03--annual-liability-is-not-the-bank-deposit-total).
- **R15:** parent browser inspection on 23 October found no enabled browser/apps; PayCalculator
  controls and calculations remain unobserved. No data was submitted or parity claim made.

[super]: https://caat-p-001.sitecorecontenthub.cloud/api/public/content/0-af5a46ad-7287-431c-be8e-4a0c9bbc5fc1
[core]: https://www.legislation.gov.au/C2004A05138/2026-10-01/2026-10-01/text/original/epub/OEBPS/document_1/document_1.html
[offset-law]: https://www.legislation.gov.au/C2004A05138/2026-10-01/2026-10-01/text/original/epub/OEBPS/document_2/document_2.html
[rounding-law]: https://www.legislation.gov.au/C1953A00001/2026-10-01/2026-10-01/text/original/epub/OEBPS/document_1/document_1.html
[offset-guide]: https://caat-p-001.sitecorecontenthub.cloud/api/public/content/0-2319183b-9958-4848-88f9-ea9dc64b121e
[return]: https://iorder.com.au/publication/Download.aspx?ProdID=2541-6.2026
[payg-early]: https://www.legislation.gov.au/F2025L00647/asmade/2025-06-04/text/original/epub/OEBPS/document_1/document_1.html
[payg-late]: https://www.legislation.gov.au/F2025L01016/asmade/2025-09-01/text/original/epub/OEBPS/document_1/document_1.html
[payg-current]: https://www.legislation.gov.au/F2026L00716/asmade/2026-06-12/text/original/epub/OEBPS/document_1/document_1.html

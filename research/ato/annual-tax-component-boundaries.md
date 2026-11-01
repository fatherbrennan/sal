# Ordinary annual tax: component boundaries

Checked **23 October 2026 Australia/Adelaide**; initial clock `2026-10-22 23:46:13 UTC`;
precision follow-up clock `2026-10-23 02:00:32 UTC`.
This narrows R02 for **2025–26 and 2026–27**. It supplements
[O02](ordinary-calculation-evidence.md#o02--annual-ordering-and-rounding-partial-resolution).
References are registered in [sources.md](sources.md). No salary code or tests were written.

## AT01 — What is sufficiently specified

The ordinary resident **basic income-tax component** can be specified independently of a
complete assessment. Its inputs are the selected financial year and an already-established,
non-negative whole-dollar taxable-income amount, with ordinary full-year resident treatment
confirmed. T01 supplies the year-specific bands; T02 s4-10 supplies the calculation order.
This contract calculates exact basic tax before offsets, Medicare, MLS and study-loan charges.
It neither determines residency nor converts a package quote into taxable income.

For an eligible adult with no other offsets, T03 specifies exact LITO expressions and its
non-refundable application. Preserve the raw expression and applied reduction separately.
At taxable income through $66,666, the positive expression is defined; above $66,667 there
is no entitlement under s61-110. **The exact $66,667 endpoint remains unavailable for a
final LITO output**: the literal expression is negative half a cent. Do not silently clamp
or round it. Intermediate half-cent amounts can be represented exactly without deciding how
the ATO displays or rounds the final assessment. [T03/T67][offset]

These are bounded calculation contracts, not approval to label their output total tax,
after-tax package income, bank cash or an ATO assessment. Other-offset, minor, foreign,
part-year, averaging and special-income regimes do not block this ordinary component;
they require explicit routing outside its domain. Initial scope covers all employee types and
sole-trader contracting; business income/deductions, PSI and relevant shared personal income
need their own upstream rules. Own company/partnership/trust contracting models are deferred.

## AT02 — Whole dollars apply at identified form fields

T66 Schedule 1 s388-85 requires truncation when an approved form requires whole dollars.
The same wording was read in C220, 3 August 2025, and C227, 1 October 2026. Its statutory
example converts $8,496.73 to $8,496. This is a form-reporting rule, not a universal
per-payment or per-transaction rounding rule. [T66][form-law]

T44's **2026 paper return**, covering 1 July 2025–30 June 2026, requires salary/wage and
interest income fields without cents; page 3 adds the reported income fields; page 4 adds
deduction fields and subtracts their total, then deals with prior-year losses separately.
Some withholding fields retain cents. [T44 pp2–4][return]

Independent example, limited to those paper fields: an established salary field of $25,000.75
and an established gross-interest field of $100.40 report $25,000 and $100, totalling
**$25,100** before deductions. Truncating only their unreported combined $25,101.15 gives
$25,101 and does not reproduce that form. This does not establish how multiple records
must be grouped into each field, electronic-return precision, or the 2027 form.

T02 s4-15 aggregates assessable income and deductions; deductions equal to or exceeding
assessable income leave no taxable income. A tax loss is a separate question. A zero input
to the bounded component must not discard upstream loss information. [T02/T67][core]

**Required integration evidence:** retain original monetary amounts, tax category, year and
the grouping/precision rule used to derive each assessed input. Do not change cash receipts,
super contributions or expense payments merely because a return field omits cents. No
generic `truncate(sum(all cash) − sum(all expenses))` contract is established.

The old ITAA 1936 s170B cents rule found in a 1999 search result was rejected: the current
register assigns s170B to a different subject. It is not current authority for sal. [T66][old-section]

## AT03 — Assessment rounding is a separate operation

T42 s16B decreases a qualifying assessed tax-related liability to a five-cent multiple.
It does not specify LITO intermediate rounding or authorise rounding an arbitrary combined
income-tax/Medicare/loan/refund figure. In this supplement, the operation is only applied
to an isolated non-negative assessed liability whose component boundary is established.
No rule to round every intermediate amount to cents or dollars was found. [T42][assessment-rounding]

For the following **independently derived, synthetic cases**, assume established taxable
income, ordinary full-year resident adult treatment, LITO only, no study-loan or other
charges/credits, and ordinary Medicare treatment with income below its $28,011 threshold.
Medicare is therefore zero (T08/T09), leaving only income tax. Amounts are AUD. These are
statutory arithmetic specimens, **not published ATO expected results or implementation tests**.

| Year    | Taxable income | Basic tax | LITO applied | Income tax before s16B | Isolated liability after s16B |
| ------- | -------------: | --------: | -----------: | ---------------------: | ----------------------------: |
| 2025–26 |         22,575 |    700.00 |       700.00 |                   0.00 |                          0.00 |
| 2025–26 |         22,576 |    700.16 |       700.00 |                   0.16 |                          0.15 |
| 2026–27 |         22,866 |    699.90 |       699.90 |                   0.00 |                          0.00 |
| 2026–27 |         22,867 |    700.05 |       700.00 |                   0.05 |                          0.05 |

These inputs are **taxable income, not salary**; any valid 2026–27 standard deduction has
already been accounted for upstream. The $700 maximum is not an automatic $700 refund.

Additional exact component checks use T01/T03, before unresolved final-assessment handling:

| Taxable income, AUD |  Raw LITO, AUD | Basic tax less applicable LITO: 2025–26 / 2026–27, AUD |
| ------------------: | -------------: | -----------------------------------------------------: |
|              37,501 |         699.95 |                                    2,388.21 / 2,195.20 |
|              45,000 |         325.00 |                                    3,963.00 / 3,695.00 |
|              45,001 |        324.985 |                                  3,963.315 / 3,695.315 |
|              45,003 |        324.955 |                                  3,963.945 / 3,695.945 |
|              66,665 |          0.025 |                                10,787.475 / 10,519.475 |
|              66,666 |           0.01 |                                  10,787.79 / 10,519.79 |
|              66,668 | No entitlement |                                  10,788.40 / 10,520.40 |

Arithmetic was recalculated with integer thousandths of a dollar. For $45,003 in 2025–26,
subtracting exact LITO gives $3,963.945; truncating LITO to $324.95 first gives $3,963.95.
Reducing these hypothetical isolated liabilities under s16B gives $3,963.90 and $3,963.95.
This demonstrates a five-cent sensitivity; it does **not** verify which intermediate
convention the ATO uses. Whole-dollar SAPTO rules cannot be imported into LITO.

## AT04 — Remaining evidence, precisely bounded

| R02 branch                      | Status and consequence                                                                                                                                                                                                 |
| ------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| R02a: input construction        | 2025–26 paper-field truncation and summation verified. Record-to-field grouping, electronic returns and 2026–27 return precision remain open; established whole-dollar input can be accepted by an isolated component. |
| R02b: LITO precision            | Exact positive formulas and non-refundable limit verified. Half-cent assessment handling and $66,667 remain open. Do not claim a complete final LITO line.                                                             |
| R02c: assessed liabilities      | Five-cent reduction verified. The isolated zero-Medicare examples above are derived; combined assessment boundaries and refund/credit ordering are not independently validated.                                        |
| R02d: external expected results | No body-verified published final-assessment fixture for either selected year or the precision endpoints was retrieved. Existing rate checks and this arithmetic are component evidence only.                           |

T68's ATO software-services page describes retrieving assessment outcomes; it supplies no
calculation algorithm. Its ASMT link currently resolves to Lodgment Management, not an annual
tax specification. T69's smaller 2026 salary instructions returned 403; the known full
instructions retain their size-limit blocker. The multiple-jobs page's Sue/Pierre examples
were indexed only and expressly concern **2024–25**; they were not promoted into a verified
selected-year fixture. The readable jobs PDF contains a different Sue example about a
withholding variation; it did not supply the multiple-jobs final-assessment tables.

Next evidence needed is narrow: a body-readable annual calculation specification or primary
endpoint examples, plus the applicable return-field instructions. Unrelated tax regimes need
not be completed before building a separately tested, properly labelled basic-tax component.
No unavailable branch may silently produce a complete offer-level after-tax result.

## AT05 — Current-law precision follow-up

Current C268 ss61-110/115 and s63-10 were read again. The $66,667 inclusion and 1.5% taper
remain literal statutory text; no intermediate cent-rounding or endpoint instruction was found
in those sections. This confirms the raw expressions, not a complete assessed LITO result. [T03][offset]

The replacement history matters: [T80 Schedule 2 item 81][replacement] replaced s16B in 2000.
Its [revised explanatory memorandum, paragraphs 3.49–3.58][rounding-em] distinguishes approved-form
truncation from reduction of qualifying assessed/penalty liabilities. Its historical discussion
of GST and old s170B is not adopted as current law. [Indexed 1995 commentary][old-rounding-em] about the balance
after credits predates that replacement and was not accepted as today's assessment algorithm.

Current [T72 Schedule 1 s250-10(2)][liability-index] lists compulsory HELP, other specified study
repayments and income tax separately. This supports retaining their identities; it does not
establish a complete cent-rounding/credit-allocation sequence. MC04's Medicare administration
and notice provisions likewise do not establish one universal combined rounding operation.

| Stage                         | Supported contract                                                                 | Still unavailable                                          |
| ----------------------------- | ---------------------------------------------------------------------------------- | ---------------------------------------------------------- |
| Return inputs                 | Apply the verified field's whole-dollar rule; preserve original cash amounts       | Electronic grouping/precision and 2027 field specification |
| Basic tax and LITO expression | Exact year-specific basic tax; raw LITO and non-refundable application within AT01 | Assessed half-cent handling and $66,667 endpoint           |
| Medicare/MLS                  | Preserve MC02/MC03 raw amounts and their separate bases                            | Current intermediate precision and final aggregation       |
| Assessed liability            | Apply s16B only after establishing the qualifying liability's boundary             | Universal income-tax/levy/MLS/loan/refund composition      |

**Specification lead, not verified calculation evidence:** [T81's SBR listing][iitr] identifies
the 2026 package v1.6 as Final (23 July 2026), its business implementation guide v1.0 as Final
(11 June 2026), and the 2027 package v0.1 as Draft (15 October 2026). The linked DOCX bodies
were rejected by the web reader. Publication metadata does not establish their fields,
rounding rules or examples; the draft is not a final 2026–27 calculation specification.

No additional primary published final-assessment fixture, with or without HELP/MLS, was
body-verified in this follow-up. AT03's specimens remain derived component checks. R02b–d,
R03c and R04a remain open; no new default precision rule has been selected.

[offset]: https://www.legislation.gov.au/C2004A05138/2026-10-01/2026-10-01/text/original/epub/OEBPS/document_2/document_2.html
[core]: https://www.legislation.gov.au/C2004A05138/2026-07-01/2026-07-01/text/original/epub/OEBPS/document_1/document_1.html
[form-law]: https://www.legislation.gov.au/C1953A00001/2026-10-01/2026-10-01/text/original/epub/OEBPS/document_3/document_3.html
[return]: https://iorder.com.au/publication/Download.aspx?ProdID=2541-6.2026
[old-section]: https://www.legislation.gov.au/C1936A00027/latest/text
[assessment-rounding]: https://www.legislation.gov.au/C1953A00001/2026-10-01/2026-10-01/text/original/epub/OEBPS/document_1/document_1.html
[replacement]: https://www.legislation.gov.au/C2004A00670/2000-07-01/2000-07-01/text/original/pdf
[rounding-em]: https://www.legislation.gov.au/bills/C2004B00704REM_1.pdf
[old-rounding-em]: https://www.ato.gov.au/law/view/print?DocID=NEM%2FEM95016%2FNAT%2FATO%2F00015
[liability-index]: https://www.legislation.gov.au/C1953A00001/2026-10-01/2026-10-01/text/original/epub/OEBPS/document_2/document_2.html
[iitr]: https://www.sbr.gov.au/individual-income-tax-returns-iitr

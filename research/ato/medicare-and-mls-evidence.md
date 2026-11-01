# Medicare levy and surcharge: ordinary employee evidence

Checked **23 October 2026 Australia/Adelaide**; clock `2026-10-22 22:51:59 UTC`.
Uses [sources T06/T08–T11/T45–T48](sources.md). This narrows R03/R04; it is not a complete
assessment specification. All amounts are AUD. Examples use established tax inputs, not gross
salary. No application code, calculator submission or personal data was used.

## M01 — Scope and effective years

The bounded case is an adult Australian resident throughout the income year, with ordinary
individual taxable income, no SAPTO entitlement, prescribed-person exemption, special trust
income, foreign-employment adjustment, FHSS release, super lump sum or arrears concession.
Single, sole-parent and married cases require their separate eligibility inputs below. These
exclusions limit this evidence, not sal's intended employment coverage.

[T09 Schedule 5 items 1–14][amendment] applies the amended levy thresholds and low-income-spouse
MLS limit to **2025–26 assessments onward**. Current [T08 register][levy-status] identifies C53,
1 July 2026, as latest/in force. Therefore the retrieved ordinary levy amounts below apply to
both selected years; no later 2026–27 indexation is assumed. That year is unfinished and needs
a release-time refresh. MLS tier thresholds are separately published for each selected year.

## M02 — Ordinary levy and family reduction

[T08 ss6–9][levy] establishes these components, before final assessment rounding:

| Component                | Verified expression or rule                                                                                                                                      |
| ------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Individual amount `L(x)` | `0` where taxable income `x ≤ 28,011`; `min(0.02x, 0.10(x − 28,011))` where `28,011 < x ≤ 35,013`; `0.02x` above `35,013`                                        |
| Family threshold `H`     | `47,238 + 4,338n`, where `n` is the legally qualifying child count, not a generic household count                                                                |
| Family income `F`        | Taxable income of the person plus their year-end spouse; otherwise the person's taxable income, subject to the statutory relationship rules                      |
| Eligible family, `F ≤ H` | No ordinary levy                                                                                                                                                 |
| Eligible family, `F > H` | Reduction amount `R = max(0, 0.02H − 0.08(F − H))`                                                                                                               |
| Married allocation       | If the spouse would otherwise owe levy before ss8/9, reduce `R` by the spouse's taxable-income proportion of `F`; s8(4) transfers excess reduction to the spouse |
| Exemption days           | Section 9 reduces the ordinary levy after the preceding rules by the prescribed-person day fraction; it expressly excludes MLS                                   |

Family eligibility under s8 is year-end marriage, specified child invalid/carer-offset entitlement,
or the sole-parent notional offset. Separation, death and de facto rules matter. No negative levy
or refundable family reduction follows from this expression. [MC02](medicare-component-boundaries.md#mc02--couple-allocation-and-phase-in)
now specifies the ordinary coupled raw allocation and excess transfer; current precision,
external family fixtures and exemption branches remain unresolved.

[T45 ATO reduction guide][reduction] corroborates the ordinary thresholds and family amounts for
2025–26. Its rounded upper-family thresholds are guidance, not a substitute for the statutory
reduction expression. Its family-eligibility summary says individual income must exceed the
individual upper threshold; s8 itself has no such express gate. Do not introduce that gate without
resolving the interaction with ss6/7. MC02 establishes statutory ordering and historical ATO
corroboration; the current summary discrepancy remains recorded rather than adopted as a gate.

Private hospital cover does not remove the ordinary levy. LITO does not reduce it: see
[O02](ordinary-calculation-evidence.md#o02--annual-ordering-and-rounding-partial-resolution).

## M03 — Two different dependant tests

| Question         | Ordinary levy family reduction                                                                                                                                                | MLS                                                                                                                                                                                           |
| ---------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Child dependency | T08 s8 refers to ITAA 1997 Subdivision 961-A; age/student status, maintenance and the notional-offset income test matter                                                      | T47 ss251R/251V: maintained Australian-resident child under 21, or under 25 receiving full-time school/college/university education; the specified ordinary-levy restrictions are disregarded |
| Child income     | T45 publishes full-year ATI limits below $1,786 for a student/first non-student child, and below $1,410 for another non-student child; partial maintenance has separate rules | Child income does not impose those ordinary-levy limits; T46 family section expressly distinguishes this                                                                                      |
| Sole parent      | Sole care/notional-offset eligibility; child uplift additionally requires FTB payable for that child under T08 s8(6)                                                          | A maintained qualifying child can make the person a family member; ordinary-levy FTB/shared-care exclusions are not reused                                                                    |
| Spouse           | Year-end status and both taxable incomes affect family reduction                                                                                                              | Relationship periods, combined surcharge income where applicable, each person's own low-income test and all relevant cover matter                                                             |

[T06 Division 961][definitions] verifies the notional-offset dependency chain and discretionary
apportionment for partial/shared maintenance. Its `adjusted taxable income for offsets` refers
through [T47 s6][itaa36-core] to Family Assistance Act Schedule 3 with specified clauses disregarded.
That complete ATI computation, partial maintenance and shared-care allocation remain unresolved;
do not substitute taxable income or automatically calculate `n` from ages alone.

[T47 ss251R/251V][itaa36] and [T46 family guidance][mls-guide] support separate MLS dependency
periods. A 21st/25th birthday, student-status change, birth/adoption, maintenance or relationship
change can affect days even in a normal full-year job comparison. A foster child is excluded by
T46's MLS guidance. Insurance-policy dependant status is not itself the tax-law dependant test.

## M04 — MLS income, tiers and charged amounts

Keep three separate bases, for the employee and relevant spouse:

| Base                     | Bounded definition / source                                                                                                                                                                               |
| ------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Ordinary levy            | Taxable income, subject to its own adjustments: T08/T47                                                                                                                                                   |
| MLS tier-test income `I` | T06 s995-1: taxable income with specified FHSS/trust adjustments, reportable fringe benefits, reportable super contributions and total net investment loss, less the specified super amount if applicable |
| MLS charge base          | Taxable-income component under T08 plus reportable-fringe-benefits component under T11; special trust/foreign/arrears adjustments are outside this bounded formula                                        |

Within the bounded case, `I = taxable income + reportable fringe benefits + reportable super +
net investment loss`. The charge base is `taxable income + reportable fringe benefits`.
Reportable super and investment losses can change the tier without being added to the ordinary
charge base. Spouse income selects applicable household tests; it is not charged as the employee's
income. Sources: [T06][definitions], [T08][levy], [T11][fringe], [T46][mls-guide].

| Income year | Singles: base/tier-1/tier-2 upper boundaries | Families before child uplift |
| ----------- | -------------------------------------------- | ---------------------------- |
| 2025–26     | 101,000 / 118,000 / 158,000                  | 202,000 / 236,000 / 316,000  |
| 2026–27     | 105,000 / 123,000 / 164,000                  | 210,000 / 246,000 / 328,000  |

Rates are **0%, 1%, 1.25%, 1.5%**. Each boundary is inclusive for the lower tier; the next tier
requires income exceeding it. This is a rate on the charge base, not only the threshold excess.
[T10 dated tables][tiers] and [T48 ss22-30–45][phi] establish the tiers and
`1,500 × max(0, qualifying MLS child count − 1)` uplift to all family boundaries.

For stable full-year relationship/dependant circumstances, no prescribed persons and no special
income adjustments, T08 ss8B–8D and T11 ss12–16 establish:
- Single without dependants: test the person's `I` against the singles base boundary.
- Single with dependants: test the person's `I` against the family base boundary.
- Married throughout the year: test combined `I` against the family base boundary, and each
  person's own `I` must exceed **$28,011** for that person to owe MLS.
- For each liable person, raw MLS is `rate × own charge base × liable days / year days`.
  Both selected income years contain 365 days. Complete coverage gives zero liable days.

The annual income/rate is not prorated to the months without cover; the liability uses eligible
days. T11 preserves separate taxable-income and reportable-benefit legal charges. Do not choose
their final rounding/aggregation sequence before R02 is resolved.

Relationship changes require separate statutory branches: T08 s8D(4) and T11 s16 distinguish
married-all-year from married-part-year. Tier-2/3 classification also uses T48 s22-30 as modified
by T08 s3A/T11 s6. The stable-household shortcut above must not handle those cases silently.

**Resolved source conflict:** T46's section dated 5 May 2026 still prints $27,222 for a full-year
spouse's low-income exclusion. T09 Schedule 5 items 1, 10, 11 and 14 expressly replace it with
$28,011 for 2025–26 onward. Use the verified amendment; retain the outdated text as evidence of
why a section's update date matters. The newer tier tables in the same PDF remain corroborated.

## M05 — Hospital cover and days

[T48 s45-1][phi] permits excess of at most **$750** in a 12-month period for a policy insuring
one person, or **$1,500** for another policy. T08 s3(5)/T11 s4 also require a complying policy
covering hospital treatment. [T10][tiers] excludes extras-only, overseas visitor/student cover
and unregistered/international cover; suspended cover does not exempt the suspended days.

Under [T08 ss8C/8D][levy] and [T11 ss13/14][fringe], ordinary non-exempt families require
qualifying cover for each relevant person. Count the **union of days** when the employee or a
required dependant lacks cover; overlapping gaps are not added
twice. This union is a direct consequence of the statutory “person or at least one dependant”
condition. The person-specific condition also does not require one shared policy. These are
inferences from the retrieved statutory condition. Prescribed-person exceptions and grandfathered
policies remain outside the verified ordinary case.

Required evidenced inputs are listed below. Their proposed storage form is not approved:

| Input group       | Required distinction                                                                                                                                      |
| ----------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Year and regime   | Selected year; full-year resident adult; SAPTO/prescribed-person/special-income flags, with unknown distinct from no                                      |
| Annual amounts    | Employee and spouse taxable income, surcharge income components and reportable benefits separately; child ATI for ordinary levy, not MLS                  |
| Relationship      | Spouse/de facto status and intervals, year-end status, death/separation; full-year job scope does not fix household status                                |
| Each child        | Legal relationship, age/student intervals, residency, maintenance/sole-care periods, ordinary notional-offset/FTB eligibility, separate MLS qualification |
| Cover per person  | Qualified hospital policy/excess, commencement/end and suspended intervals; overlapping policies/gaps; evidence that required dependants were covered     |
| Calculation audit | Rule/version, statutory branch, charge bases, year days and liable days, unresolved special-case flag; no TFN or policy number needed for arithmetic      |

## M06 — Independent examples and boundaries

Published expectations were captured before separate integer/rational arithmetic. Final assessed
rounding is excluded unless the published example states the amount. No Bun/application tests ran.

| ID   | Inputs / source                                                                                                                                                                         | Independent result                                                                                           |
| ---- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------ |
| M-A1 | T45 2025–26 Angie: taxable income 29,000, single, no SAPTO/exemption                                                                                                                    | `10% × (29,000 − 28,011) = 98.90`, matching ATO                                                              |
| M-A2 | T46 2026–27 Tom: taxable income 90,000, reportable benefits 27,000, single, no cover                                                                                                    | `117,000 × 1% = 1,170`, matching ATO                                                                         |
| M-A3 | T45 Ashton, **outside ordinary scope**: verified source assumes SAPTO eligibility; married but living apart due to illness; taxable income 49,700, spouse 21,700, no children/exemption | Individual 543.20 less family reduction 450.30 = 92.90, matching ATO; this does not verify SAPTO eligibility |
| M-B1 | Ordinary individual, no family reduction/exemption; both years; incomes 28,011 / 28,012 / 35,013 / 35,014                                                                               | Raw levy 0 / 0.10 / 700.20 / 700.28                                                                          |
| M-B2 | Eligible married one-earner family, spouse income 0, no children/exemptions; employee 47,238 / 47,239 / 59,047 / 59,048                                                                 | Raw levy 0 / 0.10 / 1,180.90 / 1,180.96; do not round a reduction before applying it                         |
| M-B3 | Single all year, no cover/add-backs; 2025–26 taxable income 101,000 / 101,001 / 118,000 / 118,001                                                                                       | Raw MLS 0 / 1,010.01 / 1,180 / 1,475.0125                                                                    |
| M-B4 | Same case, 2026–27 taxable income 105,000 / 105,001 / 123,000 / 123,001                                                                                                                 | Raw MLS 0 / 1,050.01 / 1,230 / 1,537.5125                                                                    |
| M-B5 | Single, no cover, taxable income 100,000 plus reportable super 20,000; no other adjustments                                                                                             | Tier-test income 120,000; charge base 100,000; raw MLS 1,250 in 2025–26 and 1,000 in 2026–27                 |
| M-B6 | Single, taxable income 109,500, no add-backs; exactly 100 liable days; either selected year                                                                                             | `109,500 × 1% × 100/365 = 300`; full qualifying cover gives 0                                                |
| M-B7 | Married all year, no children/cover; spouse `I = 200,000`; employee `I = charge base = 28,011`, then 28,012                                                                             | Combined income is tier 1 in both years; employee raw MLS 0, then 280.12. Spouse liability is separate       |

M-B1–B7 are source-derived synthetic boundaries, not published ATO outputs. Published examples
verify three component paths, not the full engine. Child uplift examples: 0/1/2/3 qualifying
children add 0/0/1,500/3,000. Invalid day counts, unknown eligibility, overlapping cover and
threshold pennies need independently approved validation expectations before future tests.

## Remaining R03/R04 evidence

- **R03:** complete child ATI/partial-maintenance/notional-offset calculation; contemporary
  external fixtures/precision for the coupled raw sequence now specified in MC02; exemptions,
  half-days, family agreements, SAPTO and special income.
- **R04:** independently validated household-change cases; dependency-count timing; special
  trust/foreign/FHSS/super/arrears treatment; prescribed-person and grandfathered cover branches;
  final component rounding. Private-health rebate reconciliation is a separate calculation.
- A normal full-year job comparison still needs insurance/dependant dates or a confirmed full-year
  state. Representative PAYG does not replace those annual-assessment facts. T46 states standard
  employer withholding does not cover MLS; authorised extra withholding remains separate.

[amendment]: https://www.legislation.gov.au/C2026A00058/asmade/2026-06-30/text/original/pdf
[levy]: https://www.legislation.gov.au/C2004A03351/2026-07-01/2026-07-01/text/original/epub/OEBPS/document_1/document_1.html
[levy-status]: https://www.legislation.gov.au/C2004A03351/latest
[fringe]: https://www.legislation.gov.au/C2004A00412/2026-07-01/2026-07-01/text/original/epub/OEBPS/document_1/document_1.html
[definitions]: https://www.legislation.gov.au/C2004A05138/2026-10-01/2026-10-01/text/original/epub/OEBPS/document_10/document_10.html
[itaa36]: https://www.legislation.gov.au/C1936A00027/2026-10-01/2026-10-01/text/original/epub/OEBPS/document_4/document_4.html
[itaa36-core]: https://www.legislation.gov.au/C1936A00027/2026-10-01/2026-10-01/text/original/epub/OEBPS/document_1/document_1.html
[phi]: https://www.legislation.gov.au/C2007A00031/2026-09-19/2026-09-19/text/original/epub/OEBPS/document_1/document_1.html
[tiers]: https://privatehealth.gov.au/health_insurance/surcharges_incentives/medicare_levy.htm
[reduction]: https://caat-p-001.sitecorecontenthub.cloud/api/public/content/0-84b78b72-05b1-4767-afb4-8ef24dd9a5b2
[mls-guide]: https://caat-p-001.sitecorecontenthub.cloud/api/public/content/0-4e489bec-c4cd-49d2-af19-118adbd52d38

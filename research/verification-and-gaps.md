# Verification and remaining gaps

Source checks below were performed on 22 October 2026 (UTC). Product and tooling status aligned
with the user's decisions on 23 October 2026. This is a research record, not proof of a working
salary calculator or complete tax coverage. Later specialist checks retain their own dates.

## Completed checks

| Check                                             | Evidence and result                                                                                                                                                                                                   |
| ------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Primary employment and cost material              | Inspected the bodies of government sources recorded as E01–E24 in [employment and costs](sources/employment-and-costs.md). Notes identify the claim, source section, date, and scope limitation.                      |
| Tax specialist research                           | Delegated to the requested ATO specialist. Its [research pack](ato/README.md) distinguishes retrieved facts from unresolved rules and inaccessible material.                                                          |
| Independent review of date-sensitive tax findings | The root agent directly retrieved the legislation listed below and checked application provisions against the specialist's findings.                                                                                  |
| Illustrative commute arithmetic                   | Recalculated the synthetic example in [calculation boundaries](calculation-boundaries.md): 4,000 km, 320 L, AUD 640 fuel, 100 hours, AUD 4,000 selected time value.                                                   |
| Actual user circumstances                         | None inferred. No salary offers, employment contracts, personal tax records, routes, tariffs, insurance quotes, or household records were supplied for valuation.                                                     |
| Implementation                                    | The original research introduced no application code. Approved tooling is now established and checked; see [tooling acceptance](../tooling/README.md). Salary features remain gated by their unresolved requirements. |

## Independent legislative cross-check

1. [Treasury Laws Amendment (Tax Reform No. 1) Act 2026, as made](https://www.legislation.gov.au/C2026A00049/asmade/2026-06-26/text/original/epub/OEBPS/document_1/document_1.html): inspected Schedule 4 section 25-130 and item 17, Schedule 3 item 4, and Schedule 4 items 18–20. The standard deduction applies from 2026–27 assessments; the working Australians offset from 2027–28; the inspected FBT amendments from FBT years beginning 1 April 2027. These dates must not be collapsed into the Act's commencement date.
2. [Treasury Laws Amendment (Payday Superannuation) Act 2025, as made](https://www.legislation.gov.au/C2025A00057/asmade/2025-11-06/text/original/epub/OEBPS/document_1/document_1.html): inspected Schedule 1 item 182. Its new-law application turns on qualifying-earnings payment days from 1 July 2026 and includes payments for earlier work; earlier quarters have saving provisions. Item 189 identifies an additional Norfolk Island transition that requires separate handling if applicable.
3. [Superannuation Guarantee (Administration) Act 1992, compilation 1 July 2026](https://www.legislation.gov.au/C2004A04402/2026-07-01/2026-07-01/text/original/pdf): inspected section 10A's qualifying-earnings inclusions, overlap exclusion, and annual per-employer contribution-base treatment. The PDF's text extraction omitted a formula and the screenshot facility failed; the root agent did not verify that formula visually. See the specialist's source and formula evidence before using it.

4. [Income Tax Rates Act 1986, compilation 1 July 2026](https://www.legislation.gov.au/C2004A03348/2026-07-01/2026-07-01/text/original/epub/OEBPS/document_1/document_1.html): checked the tax-free threshold and Schedule 7 ordinary resident tables, including the distinct 2026–27 and 2027–28 rates. Recalculated the specialist's six basic-tax boundary specimens. These exclude offsets, levies, and special income treatment.
5. [Medicare Levy Act 1986, compilation 1 July 2026](https://www.legislation.gov.au/C2004A03351/2026-07-01/2026-07-01/text/original/epub/OEBPS/document_1/document_1.html): checked the ordinary and SAPTO threshold and phase-in literals in section 3 and the rate and low-income rule in sections 6–7. The amendment's separate application URL was inaccessible to the root agent; its application-date evidence remains the specialist's recorded inspection.
6. [PrivateHealth.gov.au MLS guidance](https://privatehealth.gov.au/health_insurance/surcharges_incentives/medicare_levy.htm): checked the dated 2026–27 single and family tiers, dependent-child adjustment, qualifying hospital cover, and partial-year coverage requirements against the specialist's table.
7. [Higher Education Support Act 2003, compilation 1 July 2026](https://www.legislation.gov.au/C2004A01234/2026-07-01/2026-07-01/text/original/epub/OEBPS/document_1/document_1.html), sections 154-1, 154-5, 154-15, 154-20 and 154-25, plus the [2026–27 threshold notification](https://www.legislation.gov.au/C2026G00249/asmade/2026-04-20/text/original/epub/OEBPS/document_1/document_1.html): checked the repayment-income definition, marginal formula, repayment-income and debt caps, and indexed thresholds. Recalculated the specialist's raw boundary specimens; final assessment rounding and complete eligibility remain separate requirements.
8. [ATO maximum contributions base course](https://smallbusiness.taxsuperandyou.gov.au/maximum-contributions-base): checked the published 2026–27 cap and annual base, then independently recalculated the base and contribution arithmetic. This supplies readable formula evidence in addition to the statutory PDF reviewed above.

This review confirms the cited provisions and their limited implications. It does not validate a complete tax calculation, all interacting provisions, subsequent instruments, or every taxpayer's eligibility. Arithmetic checks used calculation-tool expressions; they were not project commands or application tests.

## Access and completeness limits

- Some ATO general-public pages returned access errors. The specialist records which facts were verified through accessible ATO material or enacted legislation and which remain unresolved. An inaccessible page is not evidence that a rule is absent.
- PayCalculator's fetched page did not expose its interactive controls or calculation behaviour. No rendered browser comparison, input inspection, or result agreement was established. It must not be described as a validated oracle.
- A browsed page may change after retrieval. Local notes preserve the checked claim and source location, not a complete downloaded snapshot or a cryptographic record of the original document.
- National employment guidance does not determine every state-system, award, agreement, contractor, or individual-contract entitlement. The applicable instrument and jurisdiction must be established for a real offer.
- Household benefits, child support, business entities, equity, termination, cross-border income, and special taxpayer regimes need their own complete rules before the application can claim to calculate them. Listing their fields does not implement those rules.
- Search-result snippets were discovery aids only. Any such lead without a retrieved authoritative body remains unverified and must be labelled accordingly.

## Product definitions and remaining boundaries

The [confirmed decisions](product-decisions.md) supersede the original open questions. Do not
ask the user to select these again. Remaining evidence and preferences gate only their dependent work.

| Definition                                     | Consequence if unresolved                                                                                                                                                                                                                                                      |
| ---------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Supported income years and special regimes     | Confirmed: 2025–26 and 2026–27, default 2026–27, initially full-year residents. Complete evidence for each employment and special-tax path is still required.                                                                                                                  |
| Annual tax estimate versus payroll withholding | Confirmed: both, separately; withholding uses representative periods for each applicable rule period. Final rule-specific precision remains unresolved.                                                                                                                        |
| Many-to-many semantics                         | Confirmed: selected alternative offers side by side, compared with one selected baseline. Concurrent-job groups are outside this selected mode.                                                                                                                                |
| Salary-derived travel-time rate                | Confirmed: gross full remuneration and after-tax cash views, distinct paid/worked/work-plus-travel denominators. Precise numerator and time-valuation conventions are being resolved.                                                                                          |
| Annualisation, calendars, and rounding         | Confirmed: normal full-year scope, editable 52-week paid-hours conversion, repeating rosters and dated exceptions, no assumed leave taken. Monetary precision and complete calendar rules remain.                                                                              |
| Personal benefit values and certainty          | Confirmed: personal value only; separate tax/reporting values. Guaranteed and target earnings remain separate, with no invented probabilities.                                                                                                                                 |
| Import conflicts and saved-result versions     | Confirmed: preview conflicts and choose versions; atomic validation; automatic recalculation with current input/rule versions and identified rule corrections. Schema and migration contracts remain.                                                                          |
| Interaction and presentation                   | Confirmed: one offer form with expandable sections, comparison table with expandable breakdowns, autosave, drafts, archive/restore, tab-conflict resolution, and system/manual appearance. Detailed validation and accessibility behavior still need implementation contracts. |

All employee types and sole-trader contracting remain required. The user explicitly deferred
contracting through their own company, partnership or trust. That decision does not exclude
employee wages paid by companies or independently relevant other-income inputs. Complexity
does not permit silently excluding a type within the selected scope.

## Required verification when implemented

The following are acceptance requirements, not test results. Tooling checks are recorded in the
tooling acceptance report. Application cases must follow the confirmed full-year comparison scope;
broader research examples do not authorise extra product features.

| Area                       | Required cases                                                                                                                                                                                                                                                                                                                    |
| -------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Tax rules                  | Immediately below, at, and above every threshold; relevant rounding; offsets and their limits; household and residency conditions; supported-year transitions; partial-year and exemption periods; applicable loan balance limits. Expected results must come from inspected primary rules and independently calculated fixtures. |
| Super                      | Inclusive and exclusive packages; qualifying components; duplicate-category prevention; sacrifice; eligibility exceptions; annual per-employer cap; multiple employers; historical and transition dates; contractual contributions above a statutory minimum.                                                                     |
| Pay components             | Annual, hourly, daily, and irregular quotations; part-time and casual loading; bonuses; commissions; allowances; included overtime; one-off and clawback terms; negative or inconsistent entries rejected where invalid.                                                                                                          |
| Costs and benefits         | Remote, hybrid, and on-site schedules; return versus one-way distance; fuel and EV units; public transport; reimbursements; benefit replacement value; optional time cost; duplicate component detection.                                                                                                                         |
| Time and leave             | Paid versus worked versus billable time; leave and public holidays; changing rosters; overnight shifts; part-year work; no universal assumptions about working weeks or award-specific entitlements.                                                                                                                              |
| Scenario comparisons       | Identical packages produce identical results; comparison order does not alter a package; common circumstances stay common; concurrent-income tax is calculated on the relevant aggregate; unresolved material inputs remain visible.                                                                                              |
| Storage and import         | IndexedDB migrations; aborted writes; denied or full storage; unsupported import versions; invalid numbers, dates and references; duplicate identifiers; interrupted import; preserve existing data on validation failure; export/import round-trip.                                                                              |
| Offline operation          | Successful initial asset load, then offline reload and navigation; lazy assets and rule data available; interrupted service-worker update; existing records preserved; no external network dependencies during normal use.                                                                                                        |
| Privacy                    | No user financial inputs in external requests, telemetry, URLs, or unnecessary logs; no required TFN, bank details, or precise home address for a comparison.                                                                                                                                                                     |
| Accessibility and browsers | Current supported Windows browsers; keyboard operation, focus recovery, validation announcements, zoom/reflow, contrast, and available screen-reader checks. Safari testing is excluded by the user's direction; emulation must not be reported as real-device verification.                                                      |
| Tooling controls           | Explicit configuration-property inventory; schema compatibility; format and lint failures detected; strict type failures detected; coverage failures detected; static build and production-asset smoke checks.                                                                                                                    |

Use the user's required coverage thresholds, but do not treat percentage coverage as proof of rule correctness. Unavailable checks must remain explicitly incomplete.

## Project-command boundary

The user requires every project command, including inspection and Git checks, to run through a
named package.json script. The approved bootstrap has established those tasks. Current commands
use `bun run <script-name>`; direct file-edit tooling remains the way to add a missing task before
executing it. No salary-feature implementation is implied by successful tooling checks.

Source-body inspection, local document checks, tooling tests and application behavior are distinct
evidence. Report each at its actual scope.

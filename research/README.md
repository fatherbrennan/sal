# sal research reference pack

The [compact UX implementation](compact-ux-2026-10-28.md) records the interface changes and checks.
The [earned leave and cash-out extension](leave-value-2026-10-26.md) records the leave overview,
gross base-pay-plus-super leave value and combined after-tax cash-out breakdown.
The [earlier comparison redesign](comparison-redesign-2026-10-26.md) records its annual-tax model.

The [24 October defaults investigation](defaults-investigation.md) contains fresh code/source
checks and the user's replacement defaults. Its [tax audit](defaults-tax-fresh-2026-10-24.md)
identifies freshly verified rules and remaining limits. Earlier documents below were not treated
as evidence for that investigation.

The [work-pattern editor](work-pattern-editor.md) records the implemented weekly/custom roster
interface and its verification.
The [interface order](interface-order.md) records the approved form, defaults and comparison ordering
and the final integrated verification.
The [equation popups](equation-popups.md) document clickable derivations across calculation surfaces.
The [annual-leave and base-pay investigation](annual-leave-base-pay.md) records the implemented
base-only comparison, separate leave values, verified sources and independent review corrections.
Leave values remain outside annual package totals; unsupported payouts remain unavailable.

Checked: 23 October 2026 (Australia/Adelaide). Status: evidence for the implemented bounded calculator; unresolved rules remain explicit.

This pack records the authorised investigation. It contains local factual summaries, their remote sources, proposed comparison inputs, and explicit verification limits. The user approved the guidelines, implementation and labelled component estimates on 23 October 2026. See the implementation record for supported calculations; proposals in earlier research are not automatically implemented requirements.

## Read in this order

| File                                                                     | Purpose                                                                                                                    |
| ------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------- |
| [Confirmed product decisions](product-decisions.md)                      | User-approved comparison, calculation scope, storage and interface choices.                                                |
| [Comparison fields](comparison-fields.md)                                | Catalogue of inputs affecting salary packages, employment costs, time, and conditional household outcomes.                 |
| [Implemented field simplification](field-simplification.md)              | Current field-by-field disposition, standard estimate scope and saved-data compatibility.                                  |
| [Expanded case requirements](case-requirements.md)                       | Expansion of the user's case guide: inputs, small calculation responsibilities, metrics, validation, and acceptance cases. |
| [Attendance and calendar evidence](attendance-calendar.md)               | Paid/worked/travel distinctions, verified holiday-source boundaries and remaining calendar gaps.                           |
| [Browser storage and offline boundaries](browser-storage-and-offline.md) | Platform sources for save commitment, backups, upgrade blocking and offline verification.                                  |
| [ATO research](ato/README.md)                                            | Tax specialist's dated source register, rule findings, calculation inputs, examples, and remaining gaps.                   |
| [Employment and cost evidence](sources/employment-and-costs.md)          | Body-checked government sources E01–E24 supporting employment and expense distinctions.                                    |
| [Calculation boundaries](calculation-boundaries.md)                      | Proposed accounting boundaries, units, attribution, and safeguards against double-counting.                                |
| [Verification and gaps](verification-and-gaps.md)                        | What was checked, what remains unproved, and requirements for later implementation checks.                                 |
| [Project guidelines](../AGENTS.md)                                       | Approved guidelines; tooling setup authorised.                                                                             |
| [ATO specialist remit](../agents/ato-specialist.md)                      | Instructions for continuing specialist research.                                                                           |

## Evidence meanings

- **Verified source fact:** the cited primary source's body was retrieved and inspected. Its stated scope and effective dates limit the claim. A search-result snippet alone is insufficient.
- **User requirement:** a direction supplied in this conversation. It is a product requirement, not evidence of a tax or employment rule.
- **Proposed model:** an input, accounting boundary, or validation requirement inferred from the problem and source facts. It is labelled as a design proposal, not a government rule or an agreed database schema.
- **Synthetic example:** deliberately invented inputs for arithmetic or future verification. They are not the user's circumstances, typical market prices, or application defaults.
- **Unverified:** inaccessible material, missing figures, incomplete special rules, or a calculation that has not been independently validated. These cannot silently become defaults or working support claims.

## Source handling

The local references are concise evidence notes, not full archives of government websites. Each evidence record identifies the remote source and inspected section; dated legislation links preserve the particular version inspected. A retrieval date does not establish a rule's commencement, application date, or continued validity.

Use ATO material and enacted legislation for tax rules; the relevant government authority for employment, benefits, and jurisdictional rules. PayCalculator is a secondary comparison candidate. Its output cannot establish the legal rule, and its interactive behaviour has not been verified in this research run.

Before implementing any rule, resolve all gaps for that rule and inspect its current primary source again. Preserve the source version, applicable dates, units, thresholds, exceptions, and independently checked examples with the implementation. Never apply today's rule retrospectively to a different income year.

## Confirmed product boundaries

- Compare saved Australian packages one-to-many and many-to-many, across all employee types and sole-trader contracting initially. Contracting through the user's own company, partnership or trust is explicitly deferred.
- Show gross package value and estimated take-home pay; quantify benefits and job-related costs separately.
- Enable optional commute-time valuation by default, using each offer's salary-derived gross and after-tax rates only. The user removed custom rates; detailed accounting definitions remain under review. See [confirmed decisions](product-decisions.md).
- Store user data locally in IndexedDB; supply validated JSON import and export.
- Load application assets online initially, then support offline operation without external calculation, tracking, location, or financial-data services.
- Use Bun, Biome, TypeScript, and statically built SvelteKit as required in AGENTS.md.

The catalogue does not assert that every Australian tax, award, enterprise agreement, business structure, or household benefit is already supported. It identifies conditional fields and the evidence needed to avoid producing a misleading result. Missing information must remain visible and must prevent a falsely complete estimate.

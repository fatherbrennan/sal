# Fresh defaults investigation — 24 October 2026

Status: confirmed defaults implemented; automated acceptance passed. Earlier documentation was not
used as evidence. The initial code observations below describe the pre-change application; the
decision ledger and implementation section record the replacements. The user permits incompatible
alpha schemas and reported completing the storage reset themselves.

## Evidence boundary

- Read current constructors, field definitions, editor projections, validation, storage, calculation
  callers, calendar and cost modules. The [fresh tax audit](defaults-tax-fresh-2026-10-24.md)
  separately records the specialist's source checks and remaining gaps.
- [Code-derived inventory](defaults-code-inventory.md): 102 record fields and 65 row fields,
  including 33 repeated personal-tax override definitions. These are existing behaviors, not approvals.
- Fresh baseline: 327 calculation tests and 12 data tests passed on Windows, Bun 1.4.4.
  Existing test expectations do not independently establish legal correctness.
- The first application-browser run timed out after repeated generated-manifest page reloads.
  With root and specialist file writes paused, the unchanged test passed in 19 seconds without
  those reloads. File-watch interference is supported; the exact writer was not identified.
- Browser control exposed no connected tabs. The user subsequently reported that they had handled
  the storage reset. No agent deletion or independent verification of that reset occurred.

## Execution path before these changes

1. `src/routes/+layout.ts` disables SSR and enables client rendering and prerendering.
2. `Workspace.open` opens IndexedDB database `sal`, version 1, object store `records`. There is no
   seeded offer dataset. Missing profile/vehicle/preferences records are constructed in memory by
   `Workspace.settings`; merely reading them does not persist them.
3. `newRecord` supplies constructor defaults. `Workspace.create` saves a new offer/comparison;
   new comparisons copy the currently selected preferences year.
4. `fields/editor.ts` projects schema fields into the normal form. Some accepted stored fields are
   hidden or shown only as saved exceptions. Visible controls are not a complete default inventory.
5. `FieldInput` holds unsaved text, validates on change, and calls `Workspace.edit`. Stored data is
   validated again. Successful IndexedDB transaction completion precedes a saved status.
6. `calculateComparison` resolves offer conventions, shared profile overrides and profile conventions,
   then computes remuneration, attendance, commuting, perks, costs and tax components. Results are
   derived from records; comparison records store selections/settings, not a frozen calculated result.
7. Vehicle price/consumption inherit shared values when the offer value is empty. Personal-tax
   overrides use nonblank values only. These differ from standard-mode fallback rules, which fill
   absent keys but preserve explicit blanks.
8. JSON backups contain validated records and schema/rule versions. Import validates references and
   conflicts. Service-worker caches named `sal-assets-<version>` contain application assets, separately
   from IndexedDB records. Clearing records and clearing cached application code are different actions.

Mechanical record defaults: empty name, revision 0 before first persistence, archived=false, empty
field/item maps before constructors, generated UUID for offers/comparisons and current timestamp.
The first successful save increments revision to 1. Fixed settings identities are profile, vehicle
and preferences. These are data mechanics, separate from new-offer financial defaults.

## Defaults and gaps observed before these changes

| Area                | Observed behavior                                                                                                                        | Decision implication                                                                               |
| ------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------- |
| New offer           | Annual quote; 52 weeks; fortnightly pay; 12% super; statutory cap; 7-day roster cycle; return-trip entry; entered running costs          | Each is an existing choice, not evidence of a universal standard.                                  |
| Required pay facts  | Employment type, salary, super inclusion and weekly hours start unspecified                                                              | Decide which fields should be prefilled and which must remain offer-specific.                      |
| Extra amounts       | New optional tax/super/business amounts start at zero                                                                                    | Decide the zero baseline as a group; it does not establish personal circumstances.                 |
| Shared profile      | Other income, deductions and reporting extras start at zero; household, cover and loan answers are unspecified                           | Personal defaults need user choices.                                                               |
| Hidden model        | Standard mode injects tax, fund and payroll conventions at calculation time                                                              | Replace invisible premises with explicit approved defaults or clearly named model limits.          |
| Leave               | No new annual-leave default exists; saved entitlement fields do not reduce calendar attendance                                           | Decide entitlement display separately from leave actually taken.                                   |
| Calendar            | No roster rows or holiday dates are generated; completion answers and anchor are unspecified                                             | SA holidays and an approved starting roster are needed for useful new-offer attendance.            |
| Location            | Accepted schema fields `location` and `calendarSource` are absent from the normal projection and unused by calendar calculation          | The current app does not select a jurisdictional calendar from location.                           |
| Vehicle inheritance | Shared price and consumption have no stored energy-unit type                                                                             | A fuel price can be inherited by an electric offer; the shared model needs an explicit unit basis. |
| Weekly costs/perks  | Weekly entries multiply by a fixed 52, independently of the editable offer weeks                                                         | Confirm this annualisation convention.                                                             |
| Empty extras        | Missing row collections read as empty; summing an empty collection returns zero                                                          | No bonus, perk or cost rows means none entered, rather than an unknown row amount.                 |
| New rows            | Earnings rows set `included=no`, `taxClass=ordinary`; other fields and row types start unspecified                                       | Decide row presets, including recurring/one-off and guaranteed/target.                             |
| Comparison          | Preferences year is copied at creation; time valuation starts on; displayed scenario starts guaranteed recurring; baseline is unselected | Default selection and later inheritance behavior require separate choices.                         |
| Interface           | Offers opens first; no selected record; archived offers hidden; first ordinary form section open; system appearance                      | UI defaults are distinct from statutory/personal defaults.                                         |
| Display             | `en-AU` formatting; AUD totals show two decimal places; ordinary numbers show up to two; absent/non-finite results show “Unavailable”    | Display precision is separate from stored unit prices and calculation rounding.                    |

Sources for observed behavior: `src/lib/data/schema.ts`, `src/lib/workspace.svelte.ts`,
`src/lib/fields/editor.ts`, `src/lib/components/record-editor.svelte`,
`src/lib/components/comparison.svelte`, `src/lib/calculations/inputs.ts`,
`src/lib/calculations/costs.ts`, `src/lib/calculations/calendar.ts`,
`src/lib/calculations/comparison.ts`, `src/lib/calculations/tax/standard.ts`, `src/lib/format.ts`.

## Fresh jurisdiction evidence

- SA private-sector employment is in the national system; SA public-sector/local-government
  employment is in the state system. SA-first source selection cannot replace checking which law
  applies. [SafeWork SA](https://www.safework.sa.gov.au/workers/wages-and-conditions/industrial-relations)
- Under the NES, a full-time employee's maximum weekly hours are 38 unless additional hours are
  reasonable. This does not establish an individual offer's ordinary paid hours or roster.
  [Fair Work Ombudsman](https://www.fairwork.gov.au/employment-conditions/hours-of-work-breaks-and-rosters/hours-of-work)
- Full-time and part-time employees generally receive four weeks of annual leave; qualifying
  shiftworker provisions can give more. Entitlement does not establish dates taken.
  [Fair Work Ombudsman](https://www.fairwork.gov.au/leave/annual-leave)
- Pay frequency depends on the applicable award/agreement; where unspecified, payment must be at
  least monthly. Fortnightly is a selectable product default, not a universal legal frequency.
  [Fair Work Ombudsman](https://www.fairwork.gov.au/pay-and-wages/paying-wages/frequency-of-pay)
- SafeWork SA publishes 2025–2027 statewide dates, including 19:00–24:00 holidays on Christmas Eve
  and New Year's Eve. Its page states no substitute/additional ANZAC Day holiday for weekends.
  School holidays on that page are not public holidays.
  [SafeWork SA](https://www.safework.sa.gov.au/resources/public-holidays)

These pages were fetched afresh on 24 October 2026. The specialist's fresh audit identifies
ordinary taxed-fund treatment, reportable-super derivation and broad employment-based deduction
eligibility as material default risks. It does not certify every tax coefficient or final-assessment
rounding. No previous research document establishes a fact.

## Investigation coverage

1. Employment baseline and whether approved defaults are inherited or copied.
2. Ordinary weekly hours, roster, holidays and leave.
3. Salary quote basis, super inclusion, pay frequency, contributions and bonus presets.
4. Personal tax/fund facts and explicit calculation conventions.
5. Commute units, vehicle values, costs and perk presets.
6. Comparison, year and interface defaults; fields that must stay blank.
7. Apply confirmed defaults and validate their inheritance. The user has handled the storage reset.

## Decisions confirmed during this investigation

| Decision                                | User's answer                                                                                          | Scope                                                                                                                     |
| --------------------------------------- | ------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------- |
| Storage reset                           | “Thats okay, I have sorted it already”                                                                 | User handled storage; do not perform another deletion.                                                                    |
| New-offer employment baseline           | South Australian private-sector, full-time employee                                                    | Starting preset only; preserve other employment types.                                                                    |
| Personal defaults                       | Shared defaults with per-offer overrides                                                               | Inherit approved values and identify overrides; do not silently replace overrides when shared defaults change.            |
| Standard paid weekly hours              | 38                                                                                                     | Starting denominator; calendar work and travel hours remain distinct.                                                     |
| Base salary super inclusion             | Choose explicitly for each offer                                                                       | No includes/excludes default; dependent splits remain unavailable until answered.                                         |
| Pay frequency                           | Fortnightly                                                                                            | Editable starting convention, not a universal contractual rule.                                                           |
| Starting work week                      | Monday–Friday; divide weekly hours equally                                                             | At 38 hours, 7 hours 36 minutes of work per weekday.                                                                      |
| Holiday calendar                        | Load verified SA holidays; normally do not work them                                                   | Preserve partial-day intervals and dated exceptions; do not add school holidays or invented substitute days.              |
| Starting attendance                     | On site                                                                                                | Other attendance patterns remain available through overrides.                                                             |
| Daily start                             | 09:00                                                                                                  | Use local calendar wall time.                                                                                             |
| Unpaid break                            | 12:30–13:00                                                                                            | Preserve 7 hours 36 minutes of work; derived finishing time is 17:06.                                                     |
| Annual-leave entitlement                | 4 weeks; no leave dates assumed                                                                        | Entitlement is separate from leave taken and attendance.                                                                  |
| Salary entry and standard annualisation | Annual salary and 52 weeks                                                                             | 38 × 52 = 1,976 standard paid hours; financial-year attendance remains separate.                                          |
| Fund treatment                          | Ordinary taxed accumulation fund                                                                       | Use the supported model; special funds and other contribution-tax conditions remain distinct.                             |
| Employer super                          | Statutory minimum, including its earnings limit                                                        | User confirmed after the earnings-base limit was distinguished from the personal contribution cap and contractual extras. |
| Ordinary calculation model              | Full-year Australian-resident adult employee; ordinary Medicare and payroll treatment                  | Explicit estimate scope. Household, cover and loan settings remain separate; this is not a personal eligibility finding.  |
| Optional extra amounts                  | Start at $0                                                                                            | Includes other income, deductions, salary sacrifice, additional super and extra job costs; all editable.                  |
| Household                               | Single, no dependants                                                                                  | Shared full-year starting profile; dependent child/family values follow this explicit choice.                             |
| Hospital cover                          | No qualifying private hospital cover                                                                   | Shared starting scenario; cover changes and partial-year cover must remain distinguishable.                               |
| Study loan                              | No repayable study loan                                                                                | Loan-specific inputs remain conditional, not guessed.                                                                     |
| Payer threshold claim                   | Claim from this alternative offer's employer                                                           | Withholding setting only; annual tax still has one applicable threshold.                                                  |
| Automatic bonus                         | None                                                                                                   | Do not create bonus rows for new offers. No certainty/recurrence preset was approved.                                     |
| Explicitly added bonus                  | Ordinary taxable bonus for ordinary-hours work, additional to base quote, with employer super applying | Amount, super inclusion, certainty and recurrence remain explicit; other payment types require their own classification.  |
| Commute cost method                     | Entered fuel/energy, running costs and trip charges                                                    | Retain the verified broader ATO-rate alternative separately from running costs and tax deductions.                        |
| Shared vehicle energy                   | Fuel, measured in litres                                                                               | Shared values need an explicit unit basis; do not inherit litre-based values into an electricity override.                |
| On-site commute                         | One home → work → home round trip per actual on-site workday                                           | Unpaid breaks do not add a journey; absence and remote work do not create one.                                            |
| Commute input basis                     | Combined distance and time for both directions                                                         | Do not double the entered totals. Separate-leg entry remains available.                                                   |
| Commuting-time valuation                | Enabled by default                                                                                     | Separate gross and after-tax time-adjusted comparison values; bank pay, tax and actual costs stay distinct.               |
| Shared fuel price and consumption       | Blank until entered once in vehicle settings                                                           | Do not manufacture a statutory price/consumption or substitute zero for unknown.                                          |
| Offer-specific details                  | Name, salary amount, commute distance and commute time start blank                                     | Require actual offer inputs; preserve independently available results.                                                    |
| Explicitly added perks and costs        | Annual recurring values                                                                                | No rows are created automatically; one-off and other-frequency entries remain selectable.                                 |
| Financial year                          | 2026–27                                                                                                | New comparisons use the selected shared year; 2025–26 remains available.                                                  |
| Initial comparison view                 | Guaranteed recurring earnings; no automatically selected offers or baseline                            | Other scenarios remain available.                                                                                         |
| Interface startup                       | Offers; archives hidden; system light/dark; AUD with cents                                             | Existing slate/teal theme and sharp corners remain.                                                                       |

## Implementation and verification

The subsequent approved bonus control combines eligibility and quote inclusion into **Super on this
payment**. Its options describe cash plus super, cash and super combined, or cash with no applicable
super. New rows retain the approved eligibility preset but show no completed choice until the quote
basis is selected. Existing partial answers remain intact. See the [field audit](field-simplification.md#bonus-and-commission-super-control).
- Existing preferences now hold editable shared offer defaults, exposed as **defaults** in navigation.
  New offers store only explicit overrides. The editor identifies inherited values and offers a
  restore-inheritance control. Comparisons resolve current shared defaults before calculating.
- Shared profile and vehicle settings use the confirmed starting values. Vehicle energy units are
  explicit; fuel inputs cannot be inherited into an electric override. Explicit blanks remain unknown.
- Personal tax overrides show inherited profile values and provide a per-field restore control.
  Clearing an override leaves it unknown; restoring inheritance removes the override. A regression
  test reproduced the former blank-to-shared fallback before it was removed.
- The default roster derives five weekdays from weekly hours, preserving the configured unpaid
  break. Breaks extend elapsed attendance but do not add work hours or journeys. Inconsistent known
  break/work combinations fail validation; incomplete inputs remain drafts.
- Both supported years' statewide SA holidays are bundled from the freshly retrieved source.
  Four partial holidays retain their 19:00–24:00 intervals. Custom calendar edits require their
  completeness answer; restoring the verified calendar restores its inherited status.
- Schema-2 JSON backups preserve raw overrides and shared settings. Schema-1 imports are rejected;
  no automatic storage deletion was added.
- Final `bun run check` passed: configuration completeness, Biome, TypeScript/Svelte checking,
  411 Bun tests (including 329 calculation and 21 data tests), application-browser coverage,
  coverage enforcement, static build, 22 production-browser tests and Git whitespace checking.
  The checkout is untracked, so Git whitespace checking alone does not inspect these source files;
  Biome checked all 277 files in its configured scope.
- Coverage passed for all 65 measured authored TypeScript/Svelte files: calculation/data modules
  meet 100% line/function coverage and the overall 90% gates remain enforced. The Chrome application
  test verifies saved defaults, reload, preserved overrides, explicit blanks and restoration of
  inherited offer fields, personal tax fields, rosters and calendars.
- Browser evidence: Windows x64, Bun 1.4.4, headless Chrome 156.0.8078.48, Edge 155.0.4283.62 and
  Playwright Firefox 157.0. Production tests covered desktop (1280×800), phone-sized (390×844) and
  narrow (320×800) layout viewports, offline reload/reopen, update activation, keyboard interactions,
  sharp corners and palette contrast. These are desktop-browser viewports, not physical devices.
- Inspected generated screenshots of the desktop/narrow Defaults form and desktop offer form.
  Browser version/diagnostic JSON and screenshots are in ignored `test-results/`.
- Unverified: macOS, Linux, physical mobile devices and screen-reader operation. Safari testing is
  excluded by the user on this Windows laptop. These checks do not establish full WCAG conformance
  or certify every tax rule/final-assessment rounding gap recorded in the fresh tax audit.

## Temporary changes

- A read-only Bun inventory task generated the field catalogue. Its script and temporary
  `package.json` entry were removed immediately afterwards.
- Test browsers/servers use the existing test cleanup. No personal data was sent to a website.

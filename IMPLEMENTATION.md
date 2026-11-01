# Implementation record

The user authorised the full application on 23 October 2026. Confirmed behavior is in AGENTS.md
and research/product-decisions.md. Financial evidence gaps remain explicit; unavailable results
must not become invented amounts. No publishing or new dependencies are authorised.

## Verification contract

### Consistent metric names, 27 October 2026

Applied the approved names to 88 main metrics and ten comparison insights, shared by the
comparison, offer summaries, baseline differences and equation details. Group names, payslip
labels, hints and accessible names follow the same vocabulary. Employee pay and contractor
revenue retain distinct labels, including their own sources in mixed-offer difference equations.
Cash, super, personal perk value, job costs, hourly denominators and hypothetical leave cash-out
remain explicit. Component signs are separate from metric names.

Calculation identifiers, formulas, financial expectations and saved inputs are unchanged.
Regression checks for employment-specific labels failed against the former behavior and pass
with the change. Existing browser selectors now use the approved names.

Configuration verification, Biome and all TypeScript/Svelte checks passed on Windows x64 with
Bun 1.4.4. The native coverage run passed 784 tests; three tooling tests failed because an existing
server occupies `::1:2000`. Calculation/data modules retain 100% line and function coverage.
The fresh build, browser workflows and combined coverage gate remain incomplete while that
port is occupied. The existing server was preserved. No browser, screen-reader, physical-device
or macOS/Linux acceptance is claimed; Safari remains excluded on this laptop.

### Combined hypothetical leave cash-out value, 27 October 2026

Added **Real-world value including hypothetical leave cash-out** to the always-visible cash-out
group. It adds the existing headline and extra cash-plus-net-super payout, retaining the original
commuting expenses and travel-time valuation. Both components must be available. The normal
headline remains separate; earned leave is not added again. The overview has fourteen rows and
88 main metrics, with baseline differences and scoped equation links through both components.

No tax rules, stored inputs, dependencies or persistence behavior changed. Regression checks cover
both financial years, commuting with time valuation enabled/disabled, unavailable components,
contribution-screen blockers, and recursive equations. The new assertions failed before implementation.

Verification passed 460 calculation tests, 232 data/equation tests, configuration checks, Biome,
all TypeScript/Svelte checks, and Git whitespace checking on Windows x64 with Bun 1.4.4. The
aggregate check stopped at three tooling failures because an existing Vite preview occupied
`::1:2000`. Native calculation/data coverage reached 100% lines and functions, but the combined
coverage gate, fresh static build and browser workflows remain incomplete pending release of that
port. The existing preview was preserved. No browser, screen-reader or physical-device acceptance
is claimed for this change; Safari remains excluded on this laptop.

### Employer-confirmed leave terms, 26 October 2026

Implemented the user's six choices in the
[fresh leave review](research/leave-value-2026-10-26.md#employer-leave-terms-fresh-review-and-confirmed-update).
The editor accepts weeks multiplied by employer-confirmed paid hours per leave week, including
values above 38. Salary-based leave pay is the shared default for unanswered offers; explicit
saved choices and blanks remain unchanged. Users can instead enter a confirmed hourly rate.
Loading supports none, a percentage of the calculated base leave pay, or dollars per leave hour.
The optional unused balance and date stay in Paid annual leave.

The former 38-hour limit described NES ordinary hours but incorrectly constrained more generous
leave terms. Current Fair Work guidance and the AFP award establish that distinction: the award
specifies four weeks as 160 paid leave hours. This does not establish another employer's terms.
The salary option is a labelled annual-base-cash / 52 estimate; loading remains unknown until
selected. Existing tax, super and hypothetical cash-out boundaries remain enforced. The ATO
specialist reviewed the financial effects and the parent checked the primary sources.

Version `2026-10-26-components-5` identifies the changed model. Saved field identifiers and values
are preserved; no storage reset, dependency, tax-rate or runtime network change was made.
Regression checks cover 40-hour leave weeks, percentage loading, explicit blanks, inherited
defaults, inactive-field preservation, invalid inputs, overflow and linked equations. The browser
coverage test now separates the existing financial, equation-sweep, navigation and comparison
workflows; assertions and the 60-second per-test limit are retained.

The aggregate `bun run check` passed, including all 93 production/browser cases, before the final
comparison-label correction from ordinary hours to paid hours per leave week. After that correction,
verification again passed 711 native tests, all eight Chrome browser-coverage workflows, the combined
131-file coverage gate, Biome, full Svelte/TypeScript checks and a fresh static build. All six focused
leave browser cases passed, including the displayed 40-hour value, invalid-input handling,
percentage loading, recalculation, backup export and reload. Calculation/data line and function
coverage is 100%; the 90% overall gate remains enforced. The full 93-case matrix was not repeated
after the label-only correction. Final Git whitespace verification passed.

Browsers: Chrome 156.0.8078.48, Edge 156.0.4314.42 and Playwright Firefox 157.0, Windows x64,
Bun 1.4.4. Leave editor and light/dark comparison screenshots were inspected. Automated viewport
checks are not physical-device evidence. Screen-reader, physical-device and macOS/Linux execution
remain unverified; Safari is excluded on this laptop. Tests use isolated contexts; user data was
preserved. No commit or publication was made. The repository remains untracked, limiting the
evidence provided by Git whitespace verification alone. Cash-out remains hypothetical and salary
leave pay remains an editable estimate, not a determination of employment terms or final tax.

### Earned leave and cash-plus-super cash-out, 26 October 2026

Implemented the [confirmed leave extension](research/leave-value-2026-10-26.md). The overview now
shows thirteen rows, including earned weeks/hours and gross ordinary base pay plus allocated
employer super. A separate cash-out section shows combined after-tax value, extra cash kept and
extra net super. All 87 main metrics remain available once, with linked equations and baseline
differences. Leave values do not inflate normal remuneration or the real-world headline.

The hypothetical additional payment and contribution fall in the selected financial year. The
calculation applies statutory SG headroom and screens modelled concessional contributions and
Division 293 before showing ordinary net results. Unknown contractual reporting, loading
eligibility or fund treatment remains explicit. Independent components stay available where their
inputs and guards are established. No stored-input schema, dependency or runtime network change.

The dedicated specialist reviewed source evidence and implementation twice. Corrections preserve
known zero SG at exhausted headroom and reject a stale annual-salary super allocation after an
offer switches to hourly/daily pay. A further regression preserves independently calculable net
super when the extra cash hits an unsupported income-tax endpoint. Independent fixtures cover
both financial years, four versus six weeks, bonus exclusion, cap boundaries and data preservation.

The full aggregate run passed all 93 production/browser cases, configuration checks and Git
whitespace verification. After the final narrow guard and zero-headroom equation corrections,
verification passed 703 native tests, all five Chrome coverage workflows, the combined 131-file
coverage gate, Svelte/TypeScript checks, a fresh production build and all six annual-leave workflows
in Chrome, Edge and Firefox at desktop and phone widths. The full 93-case matrix was not repeated
after those corrections. Calculation/data line and function coverage remains 100%; the 90% overall
gate remains enforced. Final Biome and whitespace checks passed.

Actual browsers: Chrome 156.0.8078.48, Edge 155.0.4283.62 and Playwright Firefox 157.0, Windows x64,
Bun 1.4.4. Light/dark comparison screenshots were inspected. The full suite covered 1280×800,
390×844 and 320-pixel viewports, keyboard interaction, contrast, layout, storage and offline reload.
Screen-reader, physical-device and macOS/Linux execution remain unverified; Safari is excluded on
this laptop. Tests used isolated browser contexts and closed their servers. User data was preserved;
no commit or publication was made. Git remains untracked, so its whitespace check alone does not
prove file contents. Tax and contribution results retain the documented component-estimate limits.

### Unified comparison and hypothetical leave cash-out, 26 October 2026

Implemented the [approved redesign](research/comparison-redesign-2026-10-26.md). One table leads
with **Real-world value per year**, its cash/super/perk/commuting/time components, the cash-plus-super
hourly rate and three annual-leave rows. Six expandable groups retain all 80 main metrics and
conditional context. Leave shares the offer columns; baseline differences and recursive equations
remain available. Section counts were removed because conditional detail made them misleading.
Muted, normal-weight hints distinguish explanation from values and row labels.

The hypothetical leave result adds one year's established gross entitlement to the selected
annual earnings, recomputes supported annual taxes and HELP, and subtracts the additional liability
from the extra gross cash. It recalculates eligible labour-income deductions and preserves negative
threshold effects. Missing facts, saved taxable-income overrides and unsupported HELP-family cases
remain unavailable. Normal package totals, stored records, tax rates and schemas remain unchanged.
This is a component estimate, not actual cash-out eligibility, final assessed tax or termination pay.

The dedicated ATO specialist reviewed financial logic and source boundaries in multiple passes.
Corrections preserved original-mode single profiles and fixed the extra-income equation's link to
gross leave. Independent regressions cover both financial years, tax-band and surcharge crossings,
HELP, labour-limited deductions, unknown inputs, overflow and input preservation. The final source
review found no remaining concrete issue within this scope.

Native verification passed 675 tests; all five Chrome browser-coverage workflows passed. The combined
gate verified 126 authored TypeScript/Svelte files, enforcing 100% calculation/data line and function
coverage and 90% overall. The aggregate `bun run check` passed, including all 93 production/browser
checks, configuration inventories, Biome, full type checking, the production build and Git whitespace
checks. No unresolved diagnostics remained. Browser checks include all metric equations, keyboard
navigation, contrast, field alignment, comparison scrolling, backups, persistence and offline reload.

Fresh light/dark desktop and phone-width screenshots were inspected. Production workflows and
scrolling checks passed in Chrome 156.0.8078.48, Edge 155.0.4283.62 and Playwright
Firefox 157.0, Windows x64 with Bun 1.4.4. These are automated viewport checks, not physical devices.
Screen-reader, physical mobile-device and macOS/Linux verification remain unavailable; Safari is
explicitly excluded on this laptop. An earlier browser run was invalidated by concurrent Svelte
generation; final acceptance ran sequentially without concurrent source or build changes. Test servers
closed, saved user data was preserved, and no commit or publication was made. The repository remains
untracked, so the Git whitespace check alone does not establish the file contents.

### Package priorities and commute-time basis, 26 October 2026

The later user instruction replaces the headline order with package before tax/costs, package
after tax, cash plus net super, that financial value per standard paid hour, package after
commuting costs, and package after commuting costs and monetary time. Commuting includes
fuel/electricity, maintenance, parking, tolls and fares, or the labelled broader ATO estimate.
Extra job-cost rows remain separate. Contractor operating costs remain deducted from cash once.

The after-tax monetary time rate now uses cash plus super after ordinary contribution tax,
excluding perks. Personal after-tax super transfers leave this rate unchanged. A negative or
unknown combined rate remains unavailable; disabled valuation or zero commute time gives zero.
Cash plus personal perk value is a supporting subtotal. Consistent labels cover comparison,
offer summary, baseline differences and linked equations. The six previous headline measures
remain in **After all job costs**; work-plus-travel rates do not also deduct monetary time.

Visible notes retain component-estimate, ordinary-super and personal-perk boundaries. No tax
rate, saved input, schema, dependency or network boundary changed. Rule versions identify the
new economic convention. The ATO reviewer confirmed the formulas and identified two wording
corrections, both applied.

Verification passed 653 native tests and five Chrome coverage workflows. The coverage gate
verified 117 authored TypeScript/Svelte files, requiring 100% calculation/data line and function
coverage and 90% overall. The final source-freshness check also passed. Tests cover all commuting
charges, personal-super transfer neutrality, unknown components, negative time rates and all
67 metric equations. Configuration inventories, Biome, full type checking and the static build
passed, with zero compiler or Svelte diagnostics.

The full browser run passed 76 of 78 cases; two combined Firefox workflows exceeded their
60-second whole-test limit while progressing through comparison checks. Comparison, offline
update/reload and offline work-pattern checks now have separate cases. All 18 replacement cases
passed, alongside the 66 unchanged cases from the full run: all 84 current scenarios were verified
across those runs. Equation workflows use the existing 60-second complex-workflow allowance;
per-action deadlines remain five seconds. No assertions were removed. Coverage comparison and
storage workflows were also separated to keep each within its existing deadline.

Earlier runs detected a concurrent asset rebuild and source edits. The static fixture now captures
immutable asset contents before serving them, and coverage was recollected against the updated
sources. Separate comparison-difference edits were preserved. Browser evidence records Windows,
Bun 1.4.4, Chrome 156.0.8078.48, Edge 155.0.4283.62 and Playwright Firefox 157.0, headless at
1280-, 390- and 320-pixel widths as applicable. Keyboard, contrast, layout, storage and offline
checks passed; desktop and narrow screenshots were inspected. Physical mobile devices, screen
readers, macOS and Linux remain unverified; Safari remains explicitly excluded on this laptop.

### Financial comparison selection, 26 October 2026

Implemented the [accepted comparison selection](research/comparison-decisions-2026-10-26.md):
six headline values separate cash, cash plus net super, and package value including personal perks,
annually and per work-plus-travel hour. Supporting detail includes full unreimbursed costs,
reimbursements, employee super transfers, conditional cash/time trade-offs, contingent net-cash
share, contractor operating surplus and the existing persisted offer-conditions notes.
Monetary time deductions have their own group. Every new amount has a linked equation.

Cash plus super is independent of unknown perks. Business costs enter contractor totals once.
A negative cash rate no longer creates a travel-time gain; direct and recursively linked equations
share the same guard. Known zero commute time or disabled valuation remains zero. Dedicated ATO
review corrected a contractor label, preserved known reimbursements in incomplete cost drafts,
and qualified the hourly footnote. The follow-up source review found no remaining defect in scope.
No tax rate, dependency, schema, stored input or runtime network boundary changed.

The final native run passed 643 tests. Browser coverage passed all four workflows and verified
117 authored TypeScript/Svelte files, including 100% calculation/data line and function coverage
and the required 90% overall gate. Configuration completeness, Biome and all Svelte/TypeScript
checks passed. The aggregate run passed all 78 production/browser checks and Git whitespace checks.
Its production build preceded the final tooltip-only distinction between cash and net-package
variable names. After that refinement, all 643 native tests, Biome, Svelte/TypeScript checks, a fresh
build, all four browser-coverage workflows and the coverage gate passed again. Fresh complete metric
equation sweeps passed in Chrome desktop and Firefox phone-sized viewports. The complete 78-case
suite was not repeated after that naming-only change.

Verified on Windows x64 with Bun 1.4.4, Chrome 156.0.8078.48, Edge 155.0.4283.62 and Playwright
Firefox 157.0. The full suite covered 1280×800, 390×844 and 320-pixel layouts, keyboard operation,
contrast, persistence, backups and offline reload. Fresh comparison screenshots were inspected.
Earlier Biome and Firefox startup attempts timed out; repeated and final runs passed without
changing timeout or coverage limits. Test servers closed, and all 102 catalogue IDs remain unique.
Screen-reader, physical-device and macOS/Linux checks remain unverified; Safari remains excluded.
The repository is untracked, so Git diff checks alone do not verify its contents. Financial results
remain supported component estimates; deferred models are not silently implemented.

### Comparison overview, 25 October 2026

Comparisons now lead with annual cash after tax and job costs, annual package after costs, and their
respective work-plus-travel hourly values. Time/cost and package-component groups start expanded.
Representative ordinary bank deposits, annual-leave weeks and contingent target cash upside are
visible without expanding the detailed breakdowns. Existing gross, tax, standard-hour, time-value
and leave-balance results remain accessible, with baseline differences and linked equations.

Recurring annual cash also shows an average month, calculated as annual cash divided by twelve;
scenarios including one-offs omit that average. It is not a payroll forecast. Bank estimates reuse
isolated base pay and every applicable withholding-rule period. No tax, super, leave, stored-data
or backup-schema rule changed. Personal super, other payroll outflows, personal perk valuations,
the broader ATO vehicle-cost basis, roster-hour differences and unentered leave dates stay explicit.
Calendar notices appear in a normal table row below the key values, keeping sticky offer headers
compact. The broader ATO-cost warning also appears beside the cash estimate when applicable.

The headline-order regression failed against the previous ordering. A new keyboard workflow also
reproduced focus being lost after closing a linked variable definition. The shared equation popup
now restores its trigger when closing leaves focus in the popup or on the document body, without
replacing focus already moved to another control.

The aggregate `bun run check` passed: 627 native tests, four browser-coverage workflows and 78
production/browser checks, plus configuration, Biome, Svelte/TypeScript, build and Git whitespace
checks. A subsequent phone-layout assertion reproduced the fourth headline being clipped by tall
sticky headers. After moving the notices, a fresh build and all six salary-decision workflows
passed on desktop and phone-sized viewports across Chrome, Edge and Firefox. Configuration,
Biome and type checks passed on that final source. Refreshed browser coverage passed all four
workflows; the combined gate verified 115 authored TypeScript/Svelte files, 100% calculation/data
line and function coverage, and the required 90% overall threshold. The full 78-check browser suite
was not repeated after the final notice-layout refinement.

Actual environment: Windows x64, Bun 1.4.4, Chrome 156.0.8078.48, Edge 155.0.4283.62 and Playwright
Firefox 157.0. Fresh 1280×800 and 390×844 comparison screenshots were inspected; the full suite also
checked 320-pixel layouts. These are headless viewport checks, not physical devices. Safari remains
excluded. Screen-reader, physical mobile-device and macOS/Linux execution remain unverified. Tax
results retain their supported component-estimate limits. Test servers closed; user data was not
reset. The repository remains untracked, so Git whitespace checks do not establish file contents.

### Package value after costs, 25 October 2026

This milestone introduced after-tax package after job costs and that value per worked-plus-commute
hour in comparisons and the live offer summary. The overview ordering was subsequently refined
above. Gross counterparts, scenario selection, baseline differences and recursively linked equations
remain available.

Annual net value subtracts commute and other job costs from assessment-adjusted cash, supported net
super and personal perk value. Hourly value divides that result by roster work plus commute hours,
excluding unpaid breaks; it does not subtract monetary time value. Missing costs or net-super facts
remain unavailable. Zero or missing hours block only dependent hourly values. Leave balances and
entitlements do not add remuneration or establish leave taken.

Gross after-cost values now deduct sole-trader business cash costs once, including the existing
gross monetary-time-adjusted measure. Net cash already deducts those expenses. Business tax
deductions remain independent inputs. Calculation version `2026-10-25-components-2` and record rule
version `2026-10-25.2` identify the change without changing tax rates or the backup schema.

Two independent review rounds used fresh calculation and ATO specialists; the first also included
a UI/equation specialist. Review corrected contradictory time-deduction wording in a shared hours
explanation and reproduced an infinite hourly ratio from a schema-valid subnormal work duration.
The shared division helper now returns unavailable for non-finite results while preserving annual
values. A third fresh precision review traced every quotient caller, passed 22 focused tests and
found no remaining issue in scope. Regression tests failed before both corrections and passed after
them. A temporary reversal of the contractor expense correction also failed its expected-value test
and was restored.

ATO review rechecked [resident rates and ordinary fund tax](https://www.legislation.gov.au/C2004A03348/2026-07-01/2026-07-01/text/original/epub/OEBPS/document_1/document_1.html),
[Medicare](https://www.legislation.gov.au/C2004A03351/2026-07-01/2026-07-01/text/original/epub/OEBPS/document_1/document_1.html)
and [GST income treatment](https://smallbusiness.taxsuperandyou.gov.au/goods-and-services-tax/income-and-gst).
The runtime source register now also includes the verified [2026 kilometre instrument](https://www.legislation.gov.au/F2026L00785/asmade/2026-06-23/text/original/epub/OEBPS/document_1/document_1.html)
and [2024 kilometre instrument](https://www.legislation.gov.au/F2024L00697/asmade/2024-06-17/text/original/epub/OEBPS/document_1/document_1.html).
Their rates do not establish commuting deductibility or actual expenditure. Several direct ATO
pages returned 403; accessible government and legislative sources supplied corroboration.

Independent fixture: $100,000 employee cash plus $12,000 employer super, $200 personal perks and
$800 net job costs gives $87,080 after tax under the test's ordinary 2026–27 circumstances. Dividing
by 424 worked plus 53 commute hours gives $182.55765199/hour, displayed as $182.56. Gross values are
$111,400 and $233.54/hour. A $110,000 GST-inclusive contractor quote with $10,000 business cash costs
and separately entered $10,000 deductions gives $70,680 net and $90,000 gross after costs. These are
supported component estimates; net value includes super and perks, not just spendable cash.

The aggregate `bun run check` passed, including 78 production/browser checks. The finite-division
correction was completed during that run. Final-source verification then passed configuration,
Biome, Svelte/TypeScript, 623 native tests and a fresh static build. All six salary-decision flows
passed again on rebuilt assets across Chrome, Edge and Firefox at desktop and phone-sized viewports,
including the new overflow import/equation regression. That regression first failed against the
earlier production build, proving the browser check detects the exposed failure.

Actual versions: Windows x64, Bun 1.4.4, Chrome 156.0.8078.48, Edge 155.0.4283.62 and Playwright
Firefox 157.0. Desktop and phone-sized screenshots were inspected; narrow layouts and keyboard
workflows were checked by the full suite. These are headless viewport checks, not physical devices.
Safari remains excluded. Screen-reader, physical mobile-device and macOS/Linux execution remain
unverified. Reviews establish the supported model boundaries, not final-assessment certification.

Final browser coverage passed all four checks. The combined gate verified 110 authored files,
100% calculation/data line and function coverage, and the required 90% overall threshold using
native Bun and Chrome source-mapped coverage without counting a source twice. `git diff --check`
passed; because the repository files remain untracked, it does not prove their contents. Biome,
type checks, source review and the tests cover the edited files. Temporary mutations were restored,
test servers closed, and no user data was reset.

### Base pay and paid annual leave, 25 October 2026

The approved [leave recommendation](research/annual-leave-base-pay.md) is implemented. Comparisons
now separate base cash/super from selected bonuses and include a base-only scenario with fresh tax
calculation. Paid annual leave has separate ordinary-hours, rate, loading and dated-balance inputs,
an informational comparison table and recursively linked equations. No leave value is added to
annual salary, tax, super or attendance. Saved data and the original private export remain unchanged.

Independent passes corrected capped-super allocation boundaries, stale base-only tax inputs,
below-minimum NES entitlement weeks and equation/field navigation. Browser investigation reproduced
programmatic disclosure state being reset by a subsequent render; navigation now synchronises the
bound open state. Rounded numeric substitutions use `≈`, while exact formulas remain unchanged.

The fixed illustrative example is $105,000 base plus $10,000 bonus, both including 12% super:
$45.07 base cash/hour versus $49.36 aggregate cash/hour at 2,080 standard hours. Only after explicit
confirmation of $93,750 wholly ordinary annual cash and 38 ordinary weekly hours, four weeks
correspond to 152 leave hours and $7,211.54 base value. Loading and balances are independent facts;
cash-out/termination net payments and final assessed-tax precision remain unavailable.

Final `bun run check` passed on Windows x64 with Bun 1.4.4: 608 native tests, four application
coverage workflows and 78 production/browser checks. Calculation/data modules have 100% line and
function coverage; the overall 90% gate passed across 109 authored TypeScript/Svelte files.
Configuration inventories, Biome, Svelte/TypeScript, static build and `git diff --check` passed.

Actual browser versions: Chrome 156.0.8078.48, Edge 155.0.4283.62 and Playwright Firefox 157.0.
Headless desktop, 390-pixel phone and 320-pixel narrow viewports were checked where specified by
the suite; these are not physical-device tests. New leave workflows verify both hourly views,
base-only tax, guarded ordinary hours, precise entitlement value, explicit zero/date, equation offer
identity, keyboard scrolling, edit focus, JSON export and reopening persisted inputs. Desktop and
phone screenshots were visually inspected. Negative controls rejected a 48-week leave divisor and
disabled base-only selection, then were restored before final acceptance.

Safari remains explicitly excluded on this Windows laptop. Actual screen-reader, physical mobile
device and macOS/Linux execution checks remain unverified. ATO/Fair Work review establishes the
documented model boundaries, not individual award entitlements or final-assessment certification.

Port update, 25 October 2026: development, preview and application test servers use port 2000.
Strict startup rejects occupied ports, and the resolved Vite configuration rejects alternate-port
and fallback overrides. Documentation and configuration inventories match. Stored data is untouched.

Verified on Windows x64, Bun 1.4.4 and Chrome 156.0.8078.48: the initial 10 server checks passed,
including HTTP/WebSocket ports, occupied-port failures and CLI overrides. The final focused run
passed 16 configuration/port checks. Configuration checks and scoped lint passed. The native suite
passed 447 tests, with 100% line/function coverage for the Vite configuration.

At the end of the port task, full verification was incomplete. Browser coverage timed out;
investigation found a Svelte
compile overlay at `src/lib/components/equation-popup.svelte:63` (invalid `{@const}` placement).
The production build then failed at the same location, preventing production-browser verification
and a fresh preview check. Final tooling type checking reported eight index-signature access errors
in `src/lib/explanations/comparison.ts` and `src/lib/explanations/tax-context.ts`. Those application
files were not changed by the port task. macOS/Linux, physical mobile devices and screen readers
were not tested; Safari remains excluded. The later equation-readability verification below resolved
the application diagnostics and completed the aggregate checks.

| Requirement           | Independent expected behavior                                                                                      | Verification                                                                 |
| --------------------- | ------------------------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------- |
| Annual package entry  | 100,000 inclusive / 2,080 paid hours = 48.076923… gross package/hour; bonus-inclusive 110,000 / 2,080 = 52.884615… | Bun calculation tests                                                        |
| Attendance            | Only rostered on-site attendance creates journeys; dated absence removes overlapping work once                     | Calendar boundary tests                                                      |
| Entered commute costs | 4,000 km at 8 L/100 km and AUD 2/L costs AUD 640; 100 travel hours remain separate                                 | Bun calculation tests                                                        |
| Data validation       | Unknown differs from zero; invalid edits do not replace stored valid values                                        | Schema tests and actual browser edits                                        |
| IndexedDB             | Successful transaction completion precedes saved status; stale revisions return both versions                      | Real-browser persistence/conflict tests                                      |
| Backups               | Invalid schemas/references leave existing data unchanged; conflicts require choices                                | Unit validation and browser import/export                                    |
| Comparisons           | Baseline differences are independent of order; archived linked offers remain usable                                | Unit and browser workflows                                                   |
| Offline               | A cached production app reloads and edits records without network                                                  | Production browser tests                                                     |
| Accessibility         | Named controls, keyboard navigation, visible focus, errors and status announcements                                | Svelte diagnostics and browser checks; actual screen-reader check separately |
| Coverage              | Calculation/data modules 100% lines/functions; overall 90%, including untested sources                             | Existing combined Bun/Chrome gate                                            |

Implemented: validated records and arithmetic; IndexedDB persistence and conflict resolution;
backup previews and atomic imports; compact offer forms and comparison tables; and the offline
cache/update lifecycle. The dedicated ATO specialist implemented and reviewed the bounded tax
components against the local source catalogue.

Temporary processes and fixtures must be closed or removed. Generated browser evidence belongs
under test-results; no personal financial examples are prepopulated or transmitted.
## Annual estimate approval

On 23 October 2026 the user approved clearly labelled estimates from verified tax components.
Final assessed tax remains unavailable until the remaining assessment precision rules are verified.

## Calculation contract

- Standard paid hours equal entered weekly paid hours multiplied by the editable annual weeks.
  Annual salary quotes retain their amount; hourly/daily quotes use explicitly entered paid units.
- Gross package value combines quoted cash, employer super and additive personal perk values.
  Inclusive/exclusive super choices, eligible bases and applicable caps are resolved before splitting
  cash and super. Independently known quoted totals survive an unavailable split.
- Annual offer-attributed tax is the difference between supported with-offer and without-offer
  component estimates. Cash subtracts valid salary sacrifice, personal super and that tax estimate;
  contractor cash also subtracts entered business expenses without deducting them twice for tax.
- Combined net value is that cash plus supported net super contributions and personal perks.
  A personal-super transfer is retained in super; it is not destroyed package value.
- Gross commute-time value uses gross package per standard paid hour. The net view uses annual
  cash after the component estimate per standard paid hour. Each offer uses its own rates.
- Cash after job costs per work-plus-travel hour is a separate metric. It does not also subtract
  monetary travel-time value. Running-cost and broader ATO-rate methods remain distinct.
- A roster must be explicitly complete before attendance is available. Dated exceptions override
  their calendar date; only dates identified as leave are described as leave. Unentered leave
  entitlement never removes journeys. Public-holiday coverage must also be confirmed.

## Derived comparison measures, 25 October 2026

The comparison now shows relative baseline percentages, remote worked hours and share, total
work-plus-travel hours, commute share, cost per return journey, combined after-tax package per
standard paid hour, and the four offer-attributed tax components separately.

The expandable **Decision measures** group adds cash after tax and job costs per additional
work-plus-travel hour, plus target-minus-guaranteed cash, super and package values in gross and
after-tax views. Target upside compares complete scenarios with matching one-off inclusion; it
is contingent income. The extra-hour ratio requires strictly more hours than the selected baseline
and does not also deduct a monetary value for travel time.

Remote hours follow the same roster, unpaid-break, holiday, exception and financial-year clipping
rules as worked hours. Remote shares have neutral comparison colours. Relative percentages require
a positive baseline; percentage-valued rows show absolute differences in percentage points.
Missing inputs remain unavailable, as do ratios with zero or negative denominators. A missing tax
component leaves that component unavailable without hiding independently supported components.
Tax results retain their existing estimate limits. No financial rules, dependencies or stored
record fields changed.

Verified on Windows x64 with Bun 1.4.4: 540 native tests, all three application-coverage cases,
the 101-file coverage gate, configuration checks, Biome, Svelte/TypeScript and the static build
passed. Calculation/data coverage remains 100% lines/functions; the overall 90% gate remains
active. The ATO specialist reviewed the component attribution and target-scenario subtraction
without findings. Desktop and phone-width comparison captures were visually inspected.

The full browser run passed 62 cases and timed out on one Firefox equation sweep. The expanded
sweep was split into metric and navigation cases without removing assertions or changing the
30-second timeout. After the final percentage-point popup correction, the production rebuild
passed all 18 equation cases at 1280x800, 390x844 and 320x800 in headless Chrome 156.0.8078.48,
Edge 155.0.4283.62 and Playwright Firefox 157.0. The other 54 browser cases, including production
editing and offline reload, passed in the full run; they were not repeated after that label-only
correction. Final application coverage, native coverage, lint and type checks also passed.
Physical mobile devices, screen readers and macOS/Linux remain unverified; Safari is excluded.

## Rules, records and updates

The IndexedDB database version is 1 and the current backup schema is 2; unsupported backup versions
are rejected before mutation. Old backup compatibility is not required. Future schema changes require explicit,
tested migrations that preserve existing records; the open-database version-change handler closes
older connections. Records have revision checks, imports validate the complete merged reference
graph, and aborted transactions preserve the previous data.

Comparisons derive results from current saved records rather than stale persisted totals. The UI
identifies the offer, shared-setting, comparison and rule revisions. `TAX_RULE_HISTORY` contains
the initial rule release; every future correction must add its specific changed rule and version.
Reloading an approved update recomputes saved comparisons and exposes that history.

## Bonus super control, 24 October 2026

**Super on this payment** replaces the two bonus eligibility/inclusion controls. Its options are
**Cash before tax, plus super**, **Cash before tax and super combined**, and **Cash before tax, no
super applies**. Confirmed exceptions remain available; employer limits are calculated separately.
Saved eligibility/inclusion fields and partial drafts remain intact. A selection saves both answers
in one revision; clearing it makes both unknown. No migration, tax-rule change or dependency was added.

The regression test first failed because the old eligibility control was still present. Native tests
cover completed and partial states, invalid selections, clearing, unchanged inputs and independently
specified cash/super totals. Production-browser tests cover all choices, atomic saves, unchanged
partial backup records, keyboard operation and reopening.

Verified on Windows with Bun 1.4.4: 430 native tests passed, including all bonus-control cases;
the new projection module has 100% Bun line/function coverage. Type checking and scoped lint passed.
All six bonus-control production checks passed in headless Chrome 156.0.8078.48, Edge 155.0.4283.62
and Playwright Firefox 157.0, at 1280×800 and 390×844. Desktop and phone-viewport screenshots were
inspected; bonus fields were widened to keep descriptive options readable. Evidence is under
`test-results/bonus-super-*`.

The final aggregate run passed configuration, Biome, type checking, all native tests, the application
workflow and combined coverage across 71 authored files. Its production-browser stage had 27 passes
and one Firefox phone-viewport keyboard-focus failure in `accessibility-flow.ts`. An isolated rerun
stopped earlier at work-pattern invalid-edit visibility in `work-pattern-flow.ts`, during concurrent
work-pattern edits. The whole-project check remains incomplete; all six bonus-control browser cases
passed. A subsequent lint pass flagged a debugging literal added to `accessibility-flow.ts` by the
concurrent work. No thresholds or checks were weakened. Screen-reader, physical-device and
macOS/Linux checks remain unverified; Safari is excluded.

## Verification limits

The field simplification audit covers every original record and row field. Normal entry removes
unused metadata and technical declarations; applicable details are conditional. New optional
amounts start at zero. Existing values, explicit blanks, backup validation and original calculation
conventions are preserved. Legacy leave validation remains repairable through saved leave settings.
Independent tests verify the ordinary $100,000 cash salary example produces $77,800 annual cash
after the 2026–27 component estimate; the old explicitly ineligible-deduction example retains
$77,480. Final assessment precision remains unavailable in both cases.

Automated acceptance on 24 October 2026: `bun run check` passed on Windows x64,
Bun 1.4.4. This includes 10,211 Biome configuration records, 7,003 other configuration
records, zero Biome/Svelte/TypeScript diagnostics, 400 native tests, one application browser
coverage workflow, 13 browser tests, the static production build and Git whitespace checking.

The combined coverage gate verified all 61 authored TypeScript/Svelte files: calculation and
data modules meet 100% line/function coverage; overall line/function coverage meets the 90%
minimum. Native Bun and original-source Chrome measurements are kept distinct. Deliberately
under-covered fixtures and omitted configuration properties correctly fail their gates.

Production tests ran in headless Chrome 156.0.8078.48, Edge 155.0.4283.62 and Playwright Firefox
157.0, at 1280×800 and 390×844 viewports. They passed without page errors, console warnings/errors,
failed requests or external runtime requests. Covered behavior includes financial comparisons,
keyboard entry, focus and contrast, update/reload protection, offline reload and fresh offline
opening. Separate application workflows cover autosave errors, latest-input recalculation,
archives, backups and multi-tab conflicts. Root visually inspected the generated desktop and
phone comparison layouts and the simplified offer/profile forms. The simplified new-record
salary/profile-to-comparison flow was exercised in Chrome; production comparison, editing and
offline workflows ran in all three browsers. Generated records and screenshots are under ignored
`test-results/`.

The [UI/UX audit](research/ui-ux-audit.md) records the separate clean-context review and alignment
and save-feedback corrections. Browser regressions verify wrapped-label alignment, sticky header
visibility, pending and invalid edits, field-review focus, local-only revert and backup access
during persistent storage failure. The phone-sized invalid-save screenshot was visually inspected.
The user selected slate and teal for light and dark appearances. Teal identifies primary actions
and selections; softer decorative dividers reduce competing outlines while input boundaries retain
their stronger contrast. Manual appearance also sets the native color scheme. Comparison screenshots
cover both palettes at desktop and phone viewport sizes.
All authored UI corners are square; browser checks enforce zero border radii, including controls,
containers, save indicators and the file-picker button. After the final file-picker styling edit,
Biome, tooling/test type checking, the production rebuild and all 13 browser checks passed again.
The independent theme source review found no concrete regressions; root visually inspected the
refreshed dark desktop comparison, light phone comparison, profile and global-save error layouts.

Safari testing is excluded by the user. macOS/Linux execution, physical mobile devices and an
actual screen-reader session are unavailable in this environment. WCAG 2.2 AA conformance is
therefore not claimed. Unsupported tax circumstances and final assessed-tax precision remain
explicitly unavailable; supported component estimates are not universal tax-return calculations.

No commit, remote, deployment or publication was created. A hosting target and its route/cache
behavior still need verification before any authorised deployment.

## Compact shared fields — 24 October 2026

`FieldFrame` puts each label and control inside one square border. `FieldInput` retains validation,
autosave, errors and inheritance. The baseline, backup picker and work-pattern selector use the
same frame. `ChoiceInput` and `ChoiceGroup` share checkbox/radio rendering; the user selected one
box per group with inline choices. These components cover every native form control in `src`.

Empty help rows no longer render. Labels, padding, row spacing and support buttons are compact;
help text stays visible. Browser checks require a single-line field height of at most 48px and
control/choice targets of at least 24px, alongside focus, labels, wrapping and error recovery.
The inspected desktop pay section fell from 559px to 441px with the same content.

The new enclosing-border check failed against the previous layout. Touching-edge assertions now
use the existing 1px alignment tolerance: Firefox reported rounding differences below 0.0001px.
Separate source/dependency snapshots isolate verification from concurrent builds. Temporary
diagnostic output and snapshot helpers are removed after verification; screenshots and source
hashes remain under ignored `test-results/field-verification`.

Verification passed configuration, lint, Svelte/TypeScript, 430 native tests and the combined
71-file coverage gate. The isolated production run passed 27 of 28 browser cases; the remaining
Firefox phone-width case passed after correcting the test's fixed Tab-count assumption. Firefox
also focuses the overflowing offer list; the test now checks its scrollability and visible focus
before continuing to New offer. Application keyboard behavior is unchanged by that correction.

All nine layout cases passed at 1280px, 390px and 320px widths in headless Chrome 156.0.8078.48,
Edge 155.0.4283.62 and Playwright Firefox 157.0 on Windows with Bun 1.4.4. Desktop and narrow-field
screenshots were visually inspected. These are browser viewports, not physical devices; the
screen-reader, platform and Safari verification limits above still apply.

## Baseline difference colors — 24 October 2026

Comparison deltas use theme-matched green for favorable changes and red for unfavorable changes.
Higher remuneration, cash, super and personal value are favorable; lower tax, costs, work and
commute time are favorable. Equal and unavailable differences retain the existing grey. Signed
amounts and metric labels remain visible. Calculations and stored records are unchanged.

The regression first failed on a higher tax difference rendered grey. All six production comparison
flows then passed in headless Chrome 156.0.8078.48, Edge 155.0.4283.62 and Playwright Firefox 157.0
on Windows/Bun 1.4.4, at 1280×800 and 390×844. Checks cover both palettes, system appearance,
baseline changes, expense reversals, equal and unavailable values, and no baseline. Text-contrast
checks include the new green; light/dark desktop screenshots were inspected.

The final aggregate attempt passed configuration, Biome, type checking and 433 native tests;
calculation/data modules retained 100% native line/function coverage. Browser coverage stopped at
the concurrent calendar-default test's ambiguous `Use shared default` locator. The separate full
browser run passed 19 cases, including all six comparison flows, and failed nine layout cases using
the former pay-section label. Combined coverage and whole-suite acceptance remain incomplete.
Physical-device, screen-reader and macOS/Linux verification remain unavailable; Safari is excluded.

## Interface order — 24 October 2026

The approved [interface ordering](research/interface-order.md) is implemented. Final integrated
verification passed on an unchanged source snapshot: 433 native tests, the application workflow,
the 72-file coverage gate and all 34 browser tests. Configuration, lint, type checking and the
static build also passed. The linked record identifies browser versions, evidence and limits.

## Equation popups — 24 October 2026

Clickable calculation labels now show current values, complete derivations, understandable
`snake_case` variables and unavailable-result reasons. Coverage includes every comparison metric,
baseline difference, tax/payroll breakdown, hourly value, one-off effect and work summary.
The [equation record](research/equation-popups.md) contains the scope and ATO review.

The aggregate run passed 441 native tests, the application workflow, the 83-file coverage gate
and all 43 browser tests. The final Close-button style adjustment was followed by fresh type checks,
application coverage, the coverage gate, a production rebuild and all nine equation-browser cases.
Calculation engines, saved schemas and financial evidence boundaries were unchanged by this work.

## Equation readability — 25 October 2026

Popups now emphasize the result, main equation and immediate inputs. Teal variables, amber values
and stronger numeric weight establish hierarchy in both appearances. Named disclosures retain the
complete applicable derivations, exact inputs and sources. An offer selector avoids repeating the
whole method for each offer. Duplicate notes and inactive rule context were removed; unavailable
results retain their blockers. No financial calculation, stored schema or dependency changed.

The [equation record](research/equation-popups.md) documents the investigation and regression proof.
Final `bun run check` passed configuration, Biome, Svelte/TypeScript, 464 native tests, three
application-coverage stages, the 88-file coverage gate, the static build and all 51 browser tests.
The coverage walkthrough was split into editing, comparison/persistence and source-map tests after
exceeding its single-test budget; assertions, timeouts and thresholds remain intact.

Verified on Windows x64 / Bun 1.4.4, with headless Chrome 156.0.8078.48, Edge 155.0.4283.62 and
Playwright Firefox 157.0. All nine popup cases passed at 1280×800, 390×844 and 320×800; fresh light/dark
screenshots were inspected. Physical devices, screen readers and macOS/Linux remain unverified;
Safari is excluded. The repository remains untracked, so Biome supplies authored-file checks beyond
Git's tracked-file whitespace check. No user process was stopped, and no commit or publication occurred.

## Equation names and navigation — 25 October 2026

Equation names now distinguish annual, pay-period, weekly and shift quantities consistently.
Annual quote inputs retain their meaningful names; redundant component/quote aliases are removed.
Clickable variables lead recursively to defining equations, pay items, rule values or entered-input
sources. Offer, tax-scenario and one-off contexts retain their own values. Back restores focus and
open disclosures; changing offers resets navigation. The financial arithmetic, stored schemas and
dependencies are unchanged.

The required fresh-context second pass identified and corrected missed commute branches, stale
trip inputs, nested input provenance, contractor billable quantities, money formatting, cleared
clock values and existing income-rejection conditions. Independent rechecking found no remaining
actionable issues in that scope. The [investigation record](research/equation-navigation.md)
documents the audit, regression failures and corrections.

Final `bun run check` passed configuration, Biome, Svelte/TypeScript, 523 native tests, three
application-coverage stages, the 94-file coverage gate, the static build and all 57 browser tests.
The production/offline and offline-work-pattern walkthroughs were split after the combined Firefox
case reached its 30-second budget. Assertions, diagnostics and timeouts remain intact. Offline
checks include recursive variable navigation after reload and opening a fresh page.

Verified on Windows x64 / Bun 1.4.4 with headless Chrome 156.0.8078.48, Edge 155.0.4283.62 and
Playwright Firefox 157.0. All nine equation cases passed at 1280×800, 390×844 and 320×800. Fresh
light/dark desktop and narrow screenshots were inspected. Screen readers, physical devices and
macOS/Linux remain unverified; Safari is excluded. No commit or publication occurred.

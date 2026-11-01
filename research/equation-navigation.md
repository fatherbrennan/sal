# Equation names and navigation

Requested 25 October 2026: audit every equation family, remove redundant aliases, use consistent
names, implement variable navigation, then perform a fresh-context second pass and fix omissions.

Verification contract:
- A name denotes the same quantity, unit and period wherever used. Context identifies the offer,
  scenario, pay item or rule period. Equal numeric values do not establish equal meanings.
- Annual quote entry uses its annual name directly. Hour/day entry retains its actual conversion.
  Base pay, bonuses, total cash, payroll cash, tax bases and personal value remain distinct.
- Every variable leads to its defining equation or an identified input/rule/collection source.
  Functions and explanatory prose must not become invented financial variables.
- Links stay inside the selected context. Explicit references cross with/without-offer and
  recurring/one-off boundaries. Back restores the prior view and focus; changing offers resets it.
- Preserve precision, unavailable reasons, financial results, stored records and offline operation.
- Native checks cover naming and reference completeness, duplicate names, missing values and scope.
  Browser checks cover multi-level navigation, Back, offer changes, keyboard focus and narrow layouts.

Initial evidence: 67 data tests pass. `component_quote = annual_quote` is a generic base/bonus
template alias; `base_component_cash` adds another unnecessary base-pay name. The same displayed
`return_journeys` currently denotes both one shift and a whole financial year. PAYG intermediate
names also mix ordinary and combined-loan calculations. These require explicit distinctions.

No financial rule changes are authorised by this presentation work. Source inputs and existing
engine results supply the explanations; navigation must not evaluate formula text.

## Implementation

| Quantity                        | Canonical naming                                                                                           |
| ------------------------------- | ---------------------------------------------------------------------------------------------------------- |
| Entered salary and bonus quotes | `annual_base_pay_quote`, `annual_bonus_quote`; no generic quote aliases                                    |
| Hour/day annualisation          | Employee `annual_paid_hours`/`annual_paid_days`; contractor `annual_billable_hours`/`annual_billable_days` |
| Cash, package and super totals  | Explicit `annual_` names; base cash, total cash and before-cap amounts remain distinct                     |
| Payroll                         | `period_` amounts; ordinary and total PAYG have separate coefficient names                                 |
| Attendance                      | `shift_`, `normal_week_` and `annual_` quantities stay distinct                                            |
| Scenario differences            | Qualified operands link directly to the same canonical quantity in the relevant offer/scenario             |

Perks, costs and bonuses have separate item contexts. Collections link to their actual members.
Tax with/without-offer and recurring/including-one-offs contexts retain separate values and sources.
Input leaves identify their source; intermediate values are not invented by evaluating formula text.
Buttons navigate inside the existing popup. Back restores focus and scroll position; main-view
disclosures remain open. Selecting another offer resets the trail. No dependency or storage migration
was introduced. The existing trip-basis helper is reused for explanation values.

## Fresh-context second pass

A new agent independently read every explanation module, popup caller and corresponding calculation
path after the first implementation. It identified these missed cases:
- No-energy, unanswered-energy and zero-journey explanations needed their actual selected branches.
- Separate-leg entry displayed stale combined-trip inputs instead of the selected sums.
- Nested comparison and one-off contexts lost locally owned input values when resolving shared source descriptions.
- Contractor hour/day quotes required billable-quantity names and provenance.
- Monetary comparison differences needed the metric's currency formatting.
- Cleared shift starts needed two unknown clock parts, not an empty-string hour.
- Recursive assessable-income explanations needed the calculator's existing rejection conditions.

The commuting, nested-value, billable-quantity, blank-clock and tax-income regressions failed before
their fixes. A deliberately reverted currency-unit choice failed its regression and passed after
restoration. Package cash also preserves the calculator's rejection of sacrifice above cash pay.
The fresh-context reviewer rechecked all corrections and independently passed 126 data tests with
1,006 assertions. No actionable findings remained in its reviewed scope.

Native completeness checks enumerate every comparison metric, annual component, payroll output,
work explanation and nested difference across quote, year, scenario, household and loan branches.
They check source resolution and scenario isolation; separate value assertions catch stale operands.
Browser tests traverse package → cash → selected pay items → base quote, verify keyboard focus and
Back restoration, and reset navigation when the offer changes. All nine equation cases passed in
Chrome, Edge and Firefox at 1280px, 390px and 320px widths. Fresh desktop and narrow source views
were visually inspected. Offline navigation follows two definitions and returns with Back after
an offline reload and a fresh offline page.

The broader offline check retained an old formula-name assertion; it now uses the canonical names.
The reviewer checked that correction and searched remaining tests and callers for stale names.
Firefox then exceeded the combined walkthrough's 30-second budget during work-pattern editing.
Production/update/offline and offline-work-pattern flows now run as separate cases. All assertions,
diagnostics, accessibility checks, cleanup and time limits remain. Work patterns follow initial
caching; update-to-offline behavior remains in the production flow. All 12 focused cases passed.

Final `bun run check` passed configuration, Biome, Svelte/TypeScript, 523 native tests, three
application-coverage stages, the static build, all 57 browser tests and Git whitespace checking.
Combined coverage passed across 94 authored TypeScript/Svelte files: calculation/data modules
retain 100% line/function coverage and overall coverage meets the 90% minimum. Actual browser
evidence records Windows x64, Bun 1.4.4, headless Chrome 156.0.8078.48, Edge 155.0.4283.62 and
Playwright Firefox 157.0. The repository remains untracked; Biome checks authored files beyond
Git's tracked-file whitespace scope. Test servers and browsers closed after execution.
Physical devices, screen readers and macOS/Linux remain unverified; Safari is excluded.

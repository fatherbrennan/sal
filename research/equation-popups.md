# Equation popups

The user requested clickable calculation text showing complete equations, with understandable
`snake_case` variables. Scope: comparison metrics and baseline differences, annual tax and taxable
income, representative payroll and hourly amounts, one-off changes, and work-pattern summaries.

Verification contract:
- Every calculated label opens its equation; current values belong to the displayed offer/scenario.
- Explain each input, conditional method, annualisation, denominator and rounding. Missing inputs
  remain unknown; unsupported results retain their reason. Do not change financial calculations.
- Use a native click/touch/keyboard popup, with Close, Escape and outside-click dismissal. Keep
  focus visible, sharp corners and content within 320px-wide viewports in both themes.
- Check independently known examples, complete metric coverage, live recalculation, unavailable
  results and offline use. Existing calculation expectations remain unchanged.

Native popup behavior follows the [Popover API](https://developer.mozilla.org/en-US/docs/Web/API/Popover_API/Using).
The [ATO equation review](ato/equation-context.md) traces tax and super content to current code and
verified sources. PAYG explanations read the calculator's coefficient tables directly. Explanations
show existing outputs; they do not introduce a second financial calculator or change stored records.

Implemented surfaces: all 33 comparison metrics, signed baseline differences, annual components
and taxable-income construction in both scenarios, representative payroll and hourly amounts,
combined one-off cash effects, weekly/calendar summaries, paid-hour formatting and shift finishes.
The main equation precedes its derivation. Current values retain calculation precision and use
`snake_case`; unknown inputs and unsupported tax results retain their limitations.

Native checks cover the complete metric catalogue, unknown versus zero, inherited unit-price
precision, contractor methods, HELP inputs, PAYG tables, roster quantities and one-off differences.
Browser checks open every calculation label, verify focus/dismissal and popup bounds, change the
selected earnings scenario, and exercise cached popups after reopening offline.

Verified on 24 October 2026, Windows x64 / Bun 1.4.4: the aggregate check passed configuration,
Biome, Svelte/TypeScript, 441 native tests, one application workflow, the 83-file coverage gate,
the static build and all 43 browser tests. Calculation/data modules retain 100% line/function
coverage; the overall 90% gate remains enforced. Bun and Chrome coverage providers stay distinct.

After the final Close-button wrapping correction, type checking, application coverage, the combined
coverage gate, the production rebuild and all nine equation-browser cases passed again.
The repository remains untracked; Biome checks the authored files independently of Git's
tracked-file whitespace check.

Browser evidence: headless Chrome 156.0.8078.48, Edge 155.0.4283.62 and Playwright Firefox 157.0;
popup viewports 1280×800, 390×844 and 320×800. Desktop, phone and narrow screenshots were visually
inspected in light/dark appearances, including the sticky Close button after scrolling. Artifacts
are under ignored `test-results/equations-*`; offline workflows are in `static-*`.

Physical devices, actual screen readers and macOS/Linux execution remain unverified. Safari testing
is excluded by the user. WCAG conformance is not claimed. Final assessed-tax precision and unsupported
financial circumstances remain explicitly unavailable; the popups do not expand calculation scope.

## Readability update — 25 October 2026

The original popup gave formulas, comments and raw inputs similar visual weight, and repeated full
derivations for every offer. The replacement shows one selected offer, its scenario and result,
the main equation, and only that equation's immediate inputs. Values follow expression order.

Variables use teal; values use amber and stronger weight. Labels, spacing and typography also
distinguish their roles, following [Use of Color](https://www.w3.org/WAI/WCAG22/Understanding/use-of-color.html).
Rendered light/dark text is checked against the 4.5:1 minimum described in
[Contrast (Minimum)](https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html).
The existing Svelte renderer uses escaped text spans; no highlighting dependency or HTML injection
was introduced.

Long calculations use named, expandable derivations. The after-tax adjusted package starts with
`net_package - total_job_costs - after_tax_time_value`, then exposes net package, job costs,
travel time, pay, super and annual-tax details. Tax/payroll explanations select applicable years
and branches. Unsupported inputs retain their blockers. The complete applicable method remains
available; no financial engine or saved schema changed.

Repeated notes and inactive context were removed. Necessary conditions, precision rules and sources
remain in readable prose or the Inputs and sources disclosure. Human-readable summary values retain
AUD cents; exact values remain available separately. Display rounding never feeds the calculation.

The new offer-selector regression failed against the previous production build. Focused checks then
passed in all three accessible browsers at desktop, phone and 320px widths. Checks cover opening every
calculation, keyboard disclosures, offer changes, focus/dismissal, bounds, contrast and offline use.
Screenshots include the complex popup collapsed and expanded in both appearances.

The application coverage walkthrough exceeded its original single-test 60-second budget. Its
existing sequence now has three tests: editing, comparison/persistence and source-map collection.
They share the same browser session and retain every assertion, action timeout and coverage gate.

Final verification on 25 October 2026: `bun run check` passed configuration completeness, Biome,
Svelte/TypeScript, 464 native tests, all three application-coverage stages, the 88-file combined
coverage gate, the static production build and all 51 browser tests. Calculation/data modules retain
100% line/function coverage; the overall 90% gate remains active. Browser versions and platform are
the Windows/Bun and Chrome/Edge/Firefox versions listed above. Fresh desktop and phone screenshots
were inspected after the final source changes. Physical-device, screen-reader and macOS/Linux
verification remain incomplete; Safari is excluded. No user server needed stopping.

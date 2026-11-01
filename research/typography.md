# Typography

Status: native font stacks confirmed in `src/typography.css`, 31 October 2026. Earlier verification
below covers the previous IBM Plex palette; browser verification of the native palette is pending.

## Purpose and findings

Keep SAL compact and readable across offer editing, shared settings, comparisons, calculation
inspectors, backup/import conflicts, status messages and offline/update notices. The source audit
covered every Svelte component, global CSS and the HTML shell. Existing text uses a 14px root,
local sizes from 10.5px to 23.1px, weights from 400 to 750, browser-default code fonts and a separate
system-font tooltip. Supporting comparison text is often 11.2px. No calculation or stored-data
change is needed.

## Palette

Two native font stacks, defined in `src/typography.css`:
- **Sans** (`--font-ui`): `system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Arial, sans-serif`
  for interface and prose.
- **Mono** (`--font-data`): `ui-monospace, "SFMono-Regular", "SF Mono", monospace` for numeric values,
  numeric entry, symbols and formulas.

The selected typeface depends on the platform and installed fonts. Neither stack requires downloaded
fonts or a runtime font service. Both roles use upright 400, 600 and 700. No thin, condensed, italic,
synthetic or intermediate weights. Decorative symbols inherit the interface stack with platform
glyph fallback. Retained IBM Plex assets are no longer referenced by the typography stylesheet.

Keep the root at 87.5% of the browser default (normally 14px), preserving existing rem-based layout
dimensions while respecting user font preferences. Define every size, weight, line height and
tracking value once in `src/typography.css`, imported by `src/app.css`. Component declarations must
reference these tokens or inherit.

| Role                                                        | Default size | Weight | Line height | Family     |
| ----------------------------------------------------------- | -----------: | -----: | ----------: | ---------- |
| App title                                                   |         22px |    700 |        1.25 | Sans       |
| Page and dialog title                                       |         18px |    600 |        1.25 | Sans       |
| Section heading                                             |         16px |    600 |        1.35 | Sans       |
| Subheading, disclosure, navigation, button                  |         14px |    600 |         1.4 | Sans       |
| Body, table label, choice text                              |         14px |    400 |         1.5 | Sans       |
| Field label                                                 |         13px |    600 |         1.4 | Sans       |
| Help, source, error, status, tooltip, difference annotation |         13px |    400 |         1.5 | Sans       |
| Normal numeric value                                        |         14px |    400 |         1.5 | Mono       |
| Numeric entry                                               |         14px |    400 |         1.4 | Mono       |
| Headline and combined hypothetical comparison total         |         16px |    600 |         1.5 | Mono       |
| Offer summary result                                        |         18px |    600 |        1.35 | Mono       |
| Selected inspector result                                   |         16px |    600 |        1.35 | Mono       |
| Inspector title                                             |         16px |    600 |        1.25 | Sans       |
| Inspector value name and section heading                    |         14px |    600 |         1.4 | Sans       |
| Inspector details and input rows                            |         13px |    400 |         1.4 | By content |
| Inspector formula                                           |         13px |    400 |         1.5 | Mono       |
| Numeric difference and secondary amount                     |         13px |    400 |         1.5 | Mono       |
| Formula block                                               |         14px |    400 |        1.75 | Mono       |
| Inline code, unrounded value, calculator history            | 13px or 14px |    400 |     inherit | Mono       |
| Touch text/select entry                                     |         16px |    400 |         1.5 | By content |

## Strict usage rules

- Inspector breadcrumb symbols and input variable names use 12px, following the user's request
  for smaller symbols on 31 October 2026. Input symbols stay on a separate line below their names.
- Other readable text remains at least 13px at default browser settings. No reduction of status,
  errors or annotations. Use spacing and hierarchy for density.
- Use the Sans family for complete sentences, labels, names, date descriptions, unavailable states,
  assumptions, warnings and errors. A number in a sentence does not make the sentence numeric.
- Unavailable and formula-only results use Sans at body size, even in a headline/result container.
  Numeric entry is determined by field metadata, not `type="text"`. ISO date entry uses Mono;
  prose dates stay Sans. Existing time fields follow their numeric/time semantics.
- Use Mono only on the value or formula, not on an entire mixed-content table cell. Numeric values
  use lining tabular figures; keep decimals, signs, percentages and currency symbols together where
  space allows. Values may wrap in narrow inspectors; never clip or hide them.
- Keep comparison amounts intact and horizontally scroll the table. Allow the difference layout
  to grow to fit 13px Mono, large values and unavailable percentages. Only the main headline and
  combined hypothetical total receive headline emphasis; their component rows use ordinary values.
- Body, controls, tables, `small`, headings h1–h6, `strong`, `em`, `code`, `pre`, `kbd` and `samp`
  have explicit global defaults. No browser-default small-text shrinking or code-size shrinking.
- Formula variables retain their semantic colours, keyboard controls and visible focus. Explanatory
  paragraphs alongside formulas stay Sans. Tooltips always reset to Sans, even inside code.
- Heading and field-label weights establish hierarchy; reserve 700 for app identity and `strong`.
  `em` uses upright 600. Do not bold whole tables. Tracking tokens are normal `0`, title `-0.02em`
  and uppercase eyebrow `0.04em`. Size tokens use rem; table pixels are default-setting references.
- The same roles apply in light and dark modes. Preserve existing colours and their meanings.
- Human-readable inspector names are primary 14px Sans headings; their code symbols are secondary
  13px Mono. The compact inspector uses 13px details and formulas, 14px subheadings and unavailable
  selected values, and a 16px panel title and selected numeric result. Search entry retains shared
  control sizing. This density adjustment follows the user's feedback on 28 October 2026.
  Numeric search results, related inputs and unavailable text follow the same value-state
  rules as the selected result. Captions, legends and column/group headings use 600; row labels use
  400. Placeholder size matches its control. Available tax/payroll amounts align right, prose left.
- Use minimum heights for text-bearing controls and breadcrumbs so enlarged text can grow. Wrap
  formulas at existing whitespace first, then within oversized tokens; do not change formula text.
- Text inputs and selects use 16px on narrow or coarse-pointer layouts. Buttons remain 14px unless
  they are inline controls inheriting their surrounding text role. Preserve existing hit targets.
- Use native fonts through the shared stacks; do not require downloaded fonts. Offline verification
  must check readable Sans and Mono roles after reload.
- Maintain horizontal comparison scrolling, wrapping labels, keyboard access and visible focus.
  Check increased text size and WCAG text-spacing overrides; do not solve overflow by shrinking text.

## Surface coverage

| Surface                                         | Mapping                                                                      |
| ----------------------------------------------- | ---------------------------------------------------------------------------- |
| Header, navigation, pickers, offer list, footer | Title, control, body, supporting text                                        |
| Offer editor and every shared-settings group    | Section/subheading, field label, content-aware entry, support/error          |
| Work roster and dated exceptions                | Same controls; numeric hours and time entry use Mono                         |
| Offer summary and readiness                     | Numeric summary, Sans labels, supporting notes and actionable missing inputs |
| Comparison setup and every metric category      | Sans headings/labels, Mono amounts/deltas, Sans context/basis/tradeoffs      |
| One-offs, tax, payroll and leave detail         | Same body/table roles; numeric spans and values use Mono                     |
| Equation popup and recursive equation content   | Dialog/section title, selected result, Mono formula, Sans explanation        |
| Inspector workspace, search, breadcrumbs, nodes | Section title, body, support, numeric result, code/formula                   |
| Backups, import previews and tab conflicts      | Body, headings, support/error; mixed saved field text stays Sans             |
| Save, persistence, offline and update notices   | Supporting text and explicit status; no tiny mobile variant                  |
| Searchable comboboxes and quick calculator      | Shared control/support roles; numeric calculator output, entry and history   |

## Evidence and verification plan

Current font stacks are recorded in `src/typography.css`. Retained IBM Plex assets and their licence
are documented in `static/fonts/README.md`; they belong to the previous palette.
Accessibility checks are based on [WCAG 2.2](https://www.w3.org/TR/WCAG22/): text resizing,
spacing, reflow, focus and contrast. Font choice and sizes are design decisions, not a claim that
one family guarantees accessibility.

Use the existing browser workflows for forms, comparison scrolling, inspector interaction,
backup/import, offline operation and keyboard controls. Add a focused browser typography check:
native Sans and Mono stacks; role sizes; documented size exceptions; numeric versus prose separation;
both themes; 320px reflow; enlarged text and spacing; readable native fonts after offline reload.
The existing typography workflow still asserts IBM Plex families and font loading; it needs a
separate update before it can verify the native palette. The old styles must fail the new
role checks. Record browser versions and screenshots. Actual mobile hardware and screen-reader
acceptance remain separate from viewport emulation; Safari testing is excluded on this machine.

Baseline build was blocked by an existing browser-test process on port 2000. It was left running.
All repository files were already untracked; the audit snapshot is in ignored test artifacts.

First independent review retained the two-family palette and scale. It clarified headline versus
component hierarchy, amount wrapping, typed numeric styling, unavailable-state sizing, date entry,
upright emphasis and exact tracking. Add populated long-name, large-amount, difference-grid,
unavailable-node and native-control checks to visual acceptance.

Second independent review retained the palette and scale and added human-readable inspector
headings, explicit caption/table/placeholder roles, value-state handling in search and input rows,
financial alignment, growing text controls and formula wrapping. Current metric groups already
separate the headline from its components; preserve that grouping and disclosure behaviour.

## Verification results

These results predate the native-font change and do not verify the current font stacks.
- Biome: 455 files checked without diagnostics. Svelte, application TypeScript, tooling TypeScript
  and service-worker type checks passed. Configuration inventories passed.
- Browser checks passed on Windows: Chrome 156.0.8078.48, Edge 156.0.4314.42 and Firefox 157.0.
  Covered both themes, 1440px and 320px viewports, all main sections, numeric/prose roles, large
  amounts, long names, unavailable results and six local font faces after an offline reload.
- The 200% text-size and increased-spacing check found an offer-editor grid overflow. A CSS fix
  passed in all three browsers and is now in source. That run injected the fix into the served
  build; a fresh build and the committed typography suite must verify the persisted fix.
- The source guard rejects component-local typography values; browser checks also verify that
  an intentionally invalid font family and size are detected. Screenshots and browser metadata
  are saved under ignored `test-results/typography-*` paths.
- The final build and port-dependent checks are blocked by another active SAL browser-test process
  on port 2000. Five tooling checks failed with `EADDRINUSE`; the process was preserved. The latest
  native coverage run reported 790 passing tests and those five failures, so it is not an aggregate
  verification pass. Preview restoration remains pending.
- Actual mobile devices, screen readers and macOS/Linux were not tested. Viewport emulation does
  not establish mobile-device or full WCAG conformance. Safari testing remains explicitly excluded.

### Inspector density follow-up — 28 October 2026

The user found the inspector oversized. Rendered measurements confirmed an 18px title, 16px value
name, 22px result and 14px formula with 24.5px line spacing. The revised roles above use existing
tokens, reduce margins and panel padding, and preserve controls, explanations and value states.
The same desktop example uses about 100px less vertical space.

Verified against the running development app in Chrome 156.0.8078.48, Edge 156.0.4314.42 and
Firefox 157.0 on Windows: light/dark, 1440px/320px layouts, numeric/prose roles, large values,
unavailable results and keyboard drill-down/back navigation. The updated assertion rejects the
old 22px result. Temporary probes were removed. Production rebuild remains blocked by the existing
development server on port 2000; these results verify the served development source.
Type checks, the shared-token guard and scoped Biome checks passed. Full-project Biome reported
`useExportsLast` in the concurrently edited `src/lib/keybindings.ts`; it was left unchanged.

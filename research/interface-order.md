# Interface order

The user approved the ordering investigation's recommendations on 24 October 2026.

Implemented order:
- Offer entry keeps Pay details → Work pattern → Commuting costs. Quote units precede amounts;
  basic pay frequency and employer-super settings stay with pay. Bonuses are a collapsed pay
  subsection. Perks and job costs precede advanced contributions, tax reporting, and overrides.
  Browser checks verify rendered order and keyboard focus without changing the entered values.
- Shared defaults follow pay/work/commuting order, with financial year first and appearance last.
  Projection tests verify order, unique fields, and unchanged records.
- Roster and holiday confirmations follow their respective rows. Browser checks inspect both groups.
- Saved offers sort by name. Comparison setup selects offers before choosing a baseline. The chosen
  baseline is the first column; remaining offers retain selection order. Browser cases use deliberately
  conflicting record-ID/name/selection orders and verify baseline removal, reselection, and reload.
- Headline gross/net totals and cash after job costs precede detailed components. Calculation tests
  verify the output order while existing independent numeric examples retain their expectations.

This is presentation ordering, not a change to financial rules, storage schemas, or defaults.

Verification on 24 October 2026:
- The new field-order, metric-order and saved-offer tests first failed against the previous order.
- `bun run check` passed: configuration inventory, Biome, Svelte/TypeScript, 433 native tests,
  the application workflow, coverage across 72 authored files, the static build and 34 browser tests.
  Calculation/data coverage remains 100% for lines/functions; the overall 90% gate remains active.
- Browser runs used Windows, Bun 1.4.4, headless Chrome 156.0.8078.48, Edge 155.0.4283.62 and
  Playwright Firefox 157.0. Ordering was checked at 1280×800 and 390×844; layout also at 320×800.
- Existing alignment and navigation checks now target the regrouped controls. The holiday restore
  locator targets the list's button, separate from the newly relocated confirmation's reset button.
  Assertions still verify restored holiday values, keyboard focus, persistence and invalid edits.
- Offer, shared-default and phone comparison screenshots were visually inspected. Production checks
  also cover offline reload, keyboard interaction and the existing bonus control.

Verification used a byte-checked isolated copy because another process was rewriting generated
files in the working directory. Source hashes stayed unchanged throughout the successful run.
Logs, hashes and screenshots are under ignored `test-results/order-verification`. The temporary
copy and verification helper were removed afterward; existing processes were preserved.

Physical-device, screen-reader and macOS/Linux checks remain unverified. Safari is excluded by the
user. These checks do not establish full WCAG conformance or final tax-assessment precision.

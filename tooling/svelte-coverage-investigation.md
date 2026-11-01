# Svelte coverage investigation

Checked 23 October 2026 on Windows x64: Bun 1.4.4, Svelte 5.57.2,
Playwright 1.64.1 and installed Chrome 156.0.8078.48.

## Requirement and scope

AGENTS.md requires 100% calculation/data line and function coverage, 90% overall,
untested-file discovery and Bun as the runner. Interactive Svelte scripts must not
silently escape that scope. No salary application code was changed.

Probe expectations were defined before execution: an unused component export must
remain uncovered; executing it must increase coverage; original-source line numbers
must stay within the component; a real button click must change visible state and
change its handler's browser execution count from zero to one.

## Observed

- The [Bun Svelte guide](https://bun.com/guides/test/svelte-test) targets Svelte 4
  and uses a DOM simulation. Its loader does not supply a source map.
- An isolated loader used the installed Svelte 5 compiler, both client and server
  output, and an inline compiler source map. Bun ran the exported-function assertions
  successfully and rejected coverage below the existing thresholds.
- The original component had 15 content lines. Client LCOV reported lines through 29;
  server LCOV reported lines through 18. These reports cannot be accepted as original
  Svelte line coverage. This establishes a failure of this loader approach, not a claim
  that every possible Bun integration has been exhausted.
- With one/two exports exercised, client function coverage was 33.33%/66.67%; client
  line coverage was 38.10%/42.86%. The component itself was not mounted in Bun.
  Server compilation retained the named handler; no server-rendering test was run.
- A separate client bundle ran in actual Chrome using the installed Playwright library.
  Initial button text was `0`; clicking changed it to `1`. Raw browser coverage recorded
  the uniquely named authored handler with count `0` without a click and `1` after a
  click. Neither page emitted a page error. Source-map conversion was not tested.
- The initial browser probe matched a framework function with the same generic name.
  A unique fixture-handler name removed that ambiguity; both independent cases passed.

## Approved integration and verification

The user approved this approach on 23 October 2026, conditional on source-mapping
and threshold-enforcement verification before adoption.

The integration now uses Playwright's Chrome coverage API under Bun tests and the pinned,
development-only `v8-to-istanbul` 9.3.0 converter, following the API described in
[Playwright's coverage documentation](https://playwright.dev/docs/api/class-coverage).
`@jridgewell/trace-mapping` 0.3.31 was already in the lockfile; its direct pin supports
inspection of original executable mappings. No DOM simulation was introduced.

Verified by the retained fixtures and full project checks:
- Real Svelte button interactions change state; IndexedDB rejects a write through a readonly
  transaction. The omitted failure handlers have count zero at their authored lines
  (`counter-fixture.svelte:17`, `storage.ts:5`) and fail the required coverage gates. Exercising them
  changes both counts to one and passes. Both browser runs reject page errors.
- A handwritten identity-map fixture independently specifies six executable lines and two
  functions, including an anonymous arrow. It reports three hit lines and one hit function;
  the blank line and module wrapper do not inflate those totals.
- Missing, stale, empty and multi-source maps fail conversion. Browser reports carry source
  hashes, which the aggregate gate checks against the current authored files.
- Discovery includes unvisited `.svelte` files. Temporarily restoring the old TypeScript-only
  glob made the missing-component regression fail because it incorrectly accepted the report;
  restoring Svelte discovery passed. The temporary mutation was removed.
- Native Bun measurements take precedence for TypeScript reported by both providers. A perfect
  browser result cannot hide a native shortfall. Browser-only data modules still require 100%.
- The actual home page is measured separately from fixtures: its four mapped Svelte lines are
  covered. The current placeholder has no script block; component-script evidence comes from
  the interactive fixture, not an implemented salary interface.

`bun run check` passed all configuration/type checks, native coverage, browser application
coverage, static build and Chrome/Edge/Firefox checks. Native Bun coverage remains distinct
from browser coverage. The existing 100% calculation/data and 90% overall gates remain active.

This API is Chromium-only. Chrome/Edge/Firefox behavior checks remain required;
browser coverage percentages do not establish compatibility or accessibility.
Conversion currently requires one original source per Vite development module. It does not
claim coverage of bundled production modules or workers; add and verify those contexts when
they enter the application. Production build behavior is tested separately.

## Cleanup

The original temporary package task and probe source were removed. Each run removed its
validated temporary fixture directory. The Chrome instance and local Bun server were
closed in `finally` blocks. Existing coverage reports and application files were not
overwritten by the original probe. The retained browser tests close their Vite servers and
browser instances in `finally` blocks. Normal application coverage now writes the ignored
`coverage/browser.lcov` report; compatibility fixtures do not supply application coverage.

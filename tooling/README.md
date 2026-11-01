# Tooling evidence

Verification environment: Windows x64 with Bun 1.4.4. Financial results are bounded component
estimates, with [separate evidence and limitations](../research/ato/implementation-status.md).
Automated accessibility checks do not establish WCAG conformance.

## Configuration records

- [Biome inventory](biome-inventory/) covers 10,211 property records, including inherited
  overrides, explicit rule options, inactive variants and individually recorded exclusions.
  [Disabled-rule reasons](biome-exclusions.json) accompany the pinned native schema. The
  `noExcessiveLinesPerFile` authored-file limit is set to 350 lines.
- [Tool inventory](config-inventory/) covers 7,003 records from the pinned SvelteKit,
  static adapter, Vite, Rolldown, transformer and TypeScript declarations. Browser and
  build-time server environments have separate records where their defaults differ.
- [File configurations](file-configurations.json) records both Bun configurations and the
  application, tooling and worker TypeScript projects, including exclusions and their reasons.
- [Source fingerprints](config-sources.json) bind the inventory to exact dependency pins,
  declaration files, Bun documentation and the inspected Bun parser. Changes fail checks
  and require a fresh review; refreshing value locations does not approve an upgrade.

The source catalogue is a reviewed snapshot. Its declaration hashes detect drift; it is
not a claim that an arbitrary future plugin or dependency is automatically understood.
Optional callbacks, inactive feature variants, credentials and framework-owned internals
are individually excluded. Their absence is intentional and documented.

The TypeScript AST audit follows the selected configuration objects, shared bindings,
spreads and environment inheritance. Unsupported restructuring must be reviewed before
refreshing the records. It verifies every required recorded setting and checks the
catalogue's complete path set. Tests remove actual Biome and Vite settings and a Bun
coverage threshold to verify failure rather than merely checking valid syntax.

`config:inventory:biome` and `config:inventory:tools` refresh values/locations after a
reviewed edit. Both fail on missing required settings. `config:check` performs read-only
verification. TypeScript checks and native builds validate the actual configurations.

Playwright is a library under Bun tests, with no Playwright Test configuration or runner.
Browser launch, viewport, navigation and screenshot arguments are test cases in
`tests/browser`; the recorded results identify the actual browsers used. Svelte-check and
TypeScript CLI configuration is selected by the explicit project paths in package tasks.

## Sources and decisions

- Biome 2.6.2: installed `configuration_schema.json`; source tag
  `@biomejs/biome@2.6.2`, commit `0d9aef6a5adf794118be3b9920189b33a413dd96`.
  [Rule-source notes](evidence/biome-rule-evidence.json) preserve default-option findings.
- [Type catalogue](evidence/type-catalog.json) records exact declaration paths, lines,
  documentation and default tags. The exploratory catalogue/audit source is preserved
  as `.ts.txt` evidence; package checks do not execute or depend on investigation caches.
- [Bun parser](evidence/bun/src/bunfig/bunfig.rs) and
  [install options](evidence/bun/src/install/PackageManager/PackageManagerOptions.rs)
  were retrieved from [Bun's pinned source tag](https://github.com/oven-sh/bun/tree/bun-v1.4.4).
  The upstream [licence](evidence/bun/LICENSE.md) is retained.
- SvelteKit's installed `src/exports/vite/utils.js` defines enforced framework options;
  its plugin owns generated paths, entries and module formats. The static adapter's native
  strict build validates the produced route output.
- Vite's installed `dist/node/chunks/node.js` supplies resolved development/build defaults,
  optimizer overrides and environment inheritance. Explicit watcher exclusions keep
  cached research sources out of development scans. The observed Chrome development
  test fell from approximately 29 seconds to 2 seconds after this correction.
- `preview.cors.preflightContinue=true` satisfies the pinned SvelteKit native warning and
  the approved zero-warning policy. Vite and Svelte warning handlers fail the build.
- Development and preview share port 2000 with
  [`strictPort=true`](https://vite.dev/config/server-options#server-strictport), as requested on 25 October 2026.
  The resolved-configuration hook rejects port and fallback overrides before either server binds.
  Vite reuses its HTTP listener for development WebSockets. Application test servers also use 2000.
- TypeScript's installed parser does not inherit `typeAcquisition` or project references;
  all projects specify them. Compiler options inherit through the explicitly selected
  base, except documented tooling and worker overrides.
- TypeScript remains 6.0.3 because the selected framework peer ranges do not admit the
  available TypeScript 7 line. Direct pins and Bun are checked on every aggregate run.
- Bun's install cache explicitly uses `.cache/bun/install`, covered by the existing generated
  directory exclusions. A configured `~/.bun/install/cache` created a literal project `~`
  directory on Windows. This stricter path prevents dependency caches entering authored-file
  checks; it is not the native global-cache default.

Defaults in type comments are checked against runtime behavior where overrides matter.
For example, Vite's dynamic-import exclusion is `/node_modules/`, and server minification
differs from browser minification. CSS uses the pinned baseline's explicit browser targets because
the CSS transformer does not accept Vite's baseline alias.

The worker is checked separately against WebWorker rather than DOM globals. The pinned Kit
`$app/types` declarations pull DOM definitions into the worker project and produce conflicting
library declarations. `src/service-worker/framework.d.ts` declares only the consumed, inspected
Kit exports: version, asset manifests and the worker global. The application project still checks
the full framework types; neither project skips library checking. Framework upgrades require
rechecking this boundary against the installed exports.

## Verification

The aggregate task checks configuration, formatting/lint/assists, Svelte and TypeScript,
native tests, original-source browser coverage, the static build, production-browser workflows
and Git whitespace. Final run results are recorded in [IMPLEMENTATION.md](../IMPLEMENTATION.md).

Coverage discovery rejects unimported authored TypeScript and Svelte files. Calculation modules must
live under `src/lib/calculations/`, and persistence/import/schema modules under `src/lib/data/`;
both require 100% line and function coverage. Other authored code requires 90% overall.
Tests, declaration-only files, dependencies, generated output and research cache files are
excluded by purpose. Svelte scripts and mapped template execution use Chrome coverage
converted by pinned development-only `v8-to-istanbul` 9.3.0. Its existing mapping dependency,
`@jridgewell/trace-mapping` 0.3.31, is a direct pin because the converter checks executable
source mappings. Unmapped padding does not increase coverage.

`coverage:collect` runs native Bun tests, then browser application tests. Native measurements
take precedence for shared TypeScript; browser-only sources use Chrome measurements. Each
source contributes once. `coverage:check` rejects missing files, duplicate records, invalid
counts, unexpected browser paths and changed or absent browser source hashes. Collection
clears its browser report before starting; hashes do not replace running the tests.

The [Svelte coverage investigation](svelte-coverage-investigation.md) records original-line
mapping and deliberately missed-handler checks. Application coverage uses single-source
Vite development modules; production behavior is checked separately in actual browsers.
Worker lifecycle tests execute the authored worker under Bun with controlled cache, event and
manifest fixtures. Production tests independently exercise the real worker in supported browsers.

The `research:read:sbr` task downloads two allowlisted official DOCX references using Bun.
It retains the original bytes, selected Word XML parts and source/hash metadata under
ignored `.cache/research/sbr`. It reuses the pinned Playwright bundle's ZIP reader; an upgrade
requires checking that API. Four tests verify extraction, size limits, source selection,
provenance and preservation of prior evidence when a download or document is invalid.
Both actual SBR downloads timed out on 23 October 2026. Their contents remain unverified;
the task's tests establish helper behavior, not successful retrieval or rendered-page accuracy.

Bun's explicit `test.coverage=false` takes precedence over a CLI `--coverage` flag in the
pinned runtime. `bunfig.coverage.toml` therefore repeats the complete configuration with
coverage enabled. A test requires both files to match except for that activation setting.
An independently created under-covered fixture fails Bun's native threshold, while its
fully tested control passes. Bun accepts but does not enforce a statements threshold;
the required line/function thresholds remain active.

Browser records and screenshots are generated under ignored `test-results/`:

| Browser            | Verified version | Scope                                                                                        |
| ------------------ | ---------------- | -------------------------------------------------------------------------------------------- |
| Installed Chrome   | 156.0.8078.48    | Headless keyboard check; production desktop/mobile viewports; development and preview entry. |
| Installed Edge     | 155.0.4283.62    | Headless keyboard check; production desktop/mobile viewports.                                |
| Playwright Firefox | 157.0            | Headless keyboard check; production desktop/mobile viewports.                                |

Production checks reject page errors, warning/error console messages, failed requests and external
requests. They verify comparison results, updates that wait for saved valid edits, preservation
after reload, offline reload and a fresh offline tab. Application checks also cover autosave,
invalid-field preservation, archives, current-input recalculation, concurrent conflicts, validated
backup choices, and real IndexedDB persistence. Controlled fault injection separately exercises
blocked, failed, aborted and corrupt-storage paths; it is not a claim of real disk failure.

Keyboard checks exercise creation and editing through named controls, visible focus, accessible
names and horizontal comparison controls. Both palettes are checked for text contrast of at least
4.5:1 and input boundaries of at least 3:1 against the relevant WCAG 2.2 criteria:
[text](https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html) and
[controls](https://www.w3.org/WAI/WCAG22/Understanding/non-text-contrast.html).
Mobile dimensions are browser viewports, not physical-device evidence.

Settings verification on 28 October 2026 passed against a fresh static build in Windows headless
Chrome 156.0.8078.48, Edge 156.0.4314.42 and Playwright Firefox 157.0. The focused
`test:browser:settings` workflow checks Preferences persistence, backup validation, searchable
shortcut descriptions, navigation guards, chord cancellation, modifier handling and Escape priority
across tooltips, comboboxes, the inspector and calculator. Screenshots cover 1280px and 320px
viewports. The same browser set also passed the existing calculator workflow on the development
server. These focused results do not establish an aggregate coverage or accessibility pass.

The aggregate run passed configuration, Biome, type checks and all 795 Bun tests. Browser
measurement then failed on existing comparison labels/markup; an open inspector from one failed
case blocked later navigation. Concurrent edits also invalidated the source-map fingerprint while
coverage was being collected. Aggregate coverage remains unverified. A defective-version replay
was not performed against these concurrently edited, uncommitted sources.

The additional full-browser run passed calculator, multiselect, comparison-offer selection,
preference transfer and inspector-navigation workflows in all three browsers. It was stopped after
repeated comparison-resize failures and a Firefox inspector-button sizing failure; the remaining
cases were not run. A later repository-wide lint check also found concurrent calculator-related
edits outside this change. The Settings and keyboard files passed their scoped Biome check.

macOS/Linux execution, actual mobile devices and screen-reader verification remain
unavailable. Safari testing is explicitly excluded. Screen-reader conformance remains incomplete;
automated names, keyboard, focus and contrast checks do not replace that verification.

Git is local and uncommitted. `git diff --check` cannot inspect untracked files; Biome and
the native checks provide the current authored-file validation. No acceptance claim relies
on an empty Git diff.

## macOS portability review — 31 October 2026

The install, Vite, inspection, configuration and coverage scripts use Bun and portable paths.
The lockfile contains macOS arm64 native dependencies. The new `browsers:install:all` task
selects Chrome, Edge and pinned Playwright Firefox; its CLI arguments passed a Windows dry run.
Browser artifacts now report the host platform and architecture instead of assuming Windows.
Git checkout rules enforce LF for text; macOS Finder metadata is ignored.

The macOS workflow selects `macos-15` (arm64), installs pinned Bun and browsers, runs `check`,
and retains verification artifacts. It does not deploy. It has not been executed here.

Windows x64 checks passed Biome, Svelte/TypeScript, configuration inventories, static build,
calculation/data tests and Git whitespace. Calculator and combobox browser checks passed in
headless Chrome 156.0.8078.80, Edge 156.0.4314.56 and Playwright Firefox 157.0.
All 18 server checks passed, including actual dev/preview startup, occupied-port protection,
override rejection, offline preview reload and fresh-asset reloads in all three browsers.
The aggregate check stops because installed Bun is 1.4.4 while the repository pins 1.4.4.
The broader browser run was stopped after repeated compact-layout, inspector and comparison
layout failures outside the changed behavior. Full browser and coverage acceptance remain
incomplete. No macOS/Linux, physical-device or screen-reader execution was available;
Safari remains excluded on this Windows machine.

# sal

For manual static publishing, see [GitHub Pages setup](tooling/github-pages.md).

Australian salary-package comparisons, calculated entirely in your browser. Compare saved offers
side by side against a selected baseline, with gross remuneration, cash, super, tax, personal perks,
job costs and commuting time shown separately.

The application supports annual, hourly and daily quotes; employee arrangements and sole-trader
contracting; guaranteed and target earnings; and separate recurring and one-off scenarios. Roster
calendars use explicitly entered holidays and dated exceptions. Leave entitlement is never treated
as leave taken. Missing information leaves the affected result unavailable while preserving known
components.

New offers show the relevant pay fields first. Contractor, family, loan and commute details appear
only where applicable. Optional monetary extras start at $0; required personal facts remain
unanswered. Standard estimates disclose their ordinary-tax and payroll scope. Existing saved
amounts, blanks and exceptions are preserved; see the [field audit](research/field-simplification.md).

Bonuses and commissions use one **Super on this payment** choice: **Cash before tax, plus super**,
**Cash before tax and super combined**, or **Cash before tax, no super applies**. The final option
is for confirmed exceptions. Unanswered treatment stays unknown; employer limits apply automatically.

Offers, settings and comparisons save to IndexedDB. JSON backups have validated previews and
explicit conflict choices. Concurrent edits require resolution. The production build caches its
assets for offline reopening; updates wait for an explicit reload after valid edits are saved.

Local UI state separately remembers the active tab, selected offer and comparison, Settings section,
archive filter and each comparison's earnings scenario. It is excluded from JSON backups. Missing or
invalid state uses defaults; missing or hidden archived selections are cleared. Other open tabs keep
their current view, and UI-state storage failures do not block financial-data saves.
Selections are revalidated when records load or change. Comparisons with deleted offers remain
available for repair without rewriting their saved links; missing baselines are not replaced.
Saved selections are checked on reload and after successful saves; external deletions are not polled.

**Settings** contains **Preferences**, **Backups** and a searchable **Keyboard shortcuts** reference.
Each shortcut lists its action and active context, following
[VS Code's keybindings reference](https://code.visualstudio.com/docs/configure/keybindings).
**Ctrl+,** opens Preferences;
**Ctrl+K Ctrl+S** opens the reference (use Command on macOS). Local controls handle Escape first,
so closing a dropdown or tooltip does not also close the inspector or clear the calculator.

The desktop calculator previews the number and source while an operator is held. Numeric clicks
use displayed precision; history records the source and exact previous total for undo. Decimal
arithmetic retains exact fractions, with `≈` marking displays rounded to 15 significant digits.
Calculator history is session-only and clears on reload.

Tax results cover bounded 2025–26 and 2026–27 components. Annual incremental estimates and
representative payroll withholding are separate. Final assessed-tax precision and unsupported
special circumstances remain unavailable; see [tax implementation and limits](research/ato/implementation-status.md).

Read [AGENTS.md](AGENTS.md) before changing the project. The user's [case guide](case.md)
has a separate [researched expansion](research/case-requirements.md) and
[ATO review](research/ato/case-guide-review.md).

All commands use named package tasks. Bun 1.4.4, Git and ripgrep must be available;
browser checks require installed Chrome and Edge and the pinned Playwright Firefox binary.

Development uses the same Bun tasks on Windows, macOS Apple Silicon and Linux. On Apple Silicon,
use native arm64 Bun 1.4.4. Install dependencies on each machine with
`bun run dependencies:install`; do not copy Windows `node_modules`, `.cache`, `.svelte-kit` or
`build` directories to the Mac. The lockfile includes the native macOS arm64 binaries.
No PowerShell, Windows drive paths, Rosetta or separate Node runtime is required by project tasks.

With Bun, Git and ripgrep available, run `bun run dependencies:install`, then `bun run dev`.
For browser checks, `bun run browsers:install` installs Firefox when Chrome and Edge are already
installed. On a fresh machine, `bun run browsers:install:all` installs all three; the macOS Edge
installer may request administrator access. Stop the development server before `bun run check`.
These commands have been inspected for portability; execution on macOS remains unverified.

The non-deploying [macOS workflow](.github/workflows/macos.yml) runs the full check on pull requests
and manual dispatch, using GitHub's
[macos-15 arm64 runner](https://docs.github.com/en/actions/reference/runners/github-hosted-runners).
It installs the pinned Bun version and retains browser and coverage artifacts. A configured
workflow is not evidence of a successful Mac run.

Development and preview use **http://localhost:2000** only. An occupied port causes startup to
fail; alternate-port and automatic-fallback overrides are rejected. Browser tests also use port
2000. Startup checks both IPv4 and IPv6 loopback addresses so development and preview cannot
serve different versions through `localhost`. Builds also require the port to be free: replacing
files beneath a running preview can leave its asset index pointing at an older build.
Existing IndexedDB records remain at their original browser origin; changing ports does not
migrate or delete them.

| Task                           | Outcome                                                                                         |
| ------------------------------ | ----------------------------------------------------------------------------------------------- |
| `bun run dependencies:install` | Reproduce `bun.lock`; calculate the approved install concurrency.                               |
| `bun run browsers:install`     | Install the pinned Firefox automation browser.                                                  |
| `bun run browsers:install:all` | Install Chrome, Edge and the pinned Firefox automation browser.                                 |
| `bun run dev`                  | Start the local Bun/Vite development server.                                                    |
| `bun run check`                | Check configuration, Biome, types, coverage, browser behavior, static build and Git whitespace. |
| `bun run format`               | Apply formatting; review changes afterward.                                                     |
| `bun run build`                | Generate static files in `build/`.                                                              |
| `bun run preview`              | Serve the generated production output locally.                                                  |
| `bun run git:status`           | Inspect local repository changes.                                                               |

Open the local address printed by `bun run dev`. Create an offer, enter shared personal tax and
vehicle settings, then create a comparison and select its offers and baseline. Blank inputs mean
unknown; new optional amounts start at zero and remain editable. Expand the comparison breakdowns for tax
components, representative bank receipts, input revisions and calculation-rule history.

`bun run preview` serves the production build for offline use. Development mode does not install
the offline worker. Wait for the app's offline-ready message before disconnecting. Export JSON
backups from **Settings → Backups**; clearing browser site data removes locally stored records.

Verification evidence and platform limits are recorded in [tooling/README.md](tooling/README.md)
and the [implementation record](IMPLEMENTATION.md). macOS/Linux execution, physical mobile
devices and screen-reader verification remain unverified. Safari testing is excluded by the user.

No repository commit, remote or deployment has been created.

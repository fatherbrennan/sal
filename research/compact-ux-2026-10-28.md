# Compact UX implementation — 28 October 2026

The user approved implementation after the design review, with a checkpoint first and headless
browser verification only. Checkpoint: `c9fe205f247dd4440318d6989fffa78ac90049d9`.

## Implemented

- Compact desktop navigation and save status; three primary offer-summary values with the remaining
  values and estimate scope in a disclosure.
- Baseline, commute-time valuation and scenario controls outside comparison setup. Metric/section
  search, persistent baseline context, signed differences and an explicit zero-baseline percentage
  state. All fourteen overview rows remain available.
- Narrow comparison columns retain sticky metric labels and horizontal navigation. Supporting text
  retains the existing typography tokens and 13px minimum.
- Missing-result review retains the selected offer and metric. Leave results link to an established
  blocking input; other results expose their existing dependency explanations. Unrelated unanswered
  inputs are labelled separately. Input repair provides a return-to-comparison control.
- Shared values are shown alongside overridden fields. Offer defaults have their own Settings tab.
- Row removal has an undo action that restores the original row and preserves intervening edits.
- Section expansion and scroll positions persist per offer, comparison and settings surface in the
  separate UI-state database. Financial records and exported backups retain their existing schema.
- Weekday work-pattern fields form a compact desktop matrix. Inspector labels lead with readable
  names; exact values and nested scenario context remain available through disclosures.
- Backup application stays disabled until record conflicts have a selected resolution.
- Tooltip opening waits for the current native popover transition, avoiding a reproduced Firefox
  warning. Toolbar size updates run on the next animation frame. Payslip period labels use
  "per week/fortnight/month/quarter" consistently.

No calculation module or financial rule was changed. Saved blanks, explicit zeroes, overrides,
tax/withholding distinctions, and hypothetical leave-cash-out boundaries remain intact.

## Review passes

1. Source and behavior review checked the comparison, offer editor, shared settings, inspector,
   backups and navigation against the compact product requirements.
2. Headless workflow checks found and corrected the initially hidden baseline control, narrow
   baseline wrapping, repeated inspector context and verbose zero-baseline differences. Checks
   cover input repair, undo after another edit, independent disclosure state and scroll restoration.
3. Broader regression checks exercise selection, scenarios, calculation inspection, keyboard
   interactions, typography enlargement and long labels. Existing tests were updated where they
   assumed disclosures always reset, used obsolete metric names, or required exact floating-point
   equality for Firefox geometry. Financial expected values were retained.

## Verification

Windows, Bun 1.4.4. Headless Chrome 156.0.8078.48, Edge 156.0.4314.50 and Playwright Firefox 157.0.
Every run uses isolated browser contexts, not the user's browser profile.
- Production build passed after the user approved temporarily stopping the existing port-2000
  development process.
- Bun calculation, data and tooling coverage run: 840 tests passed, zero failures.
- New compact workflows passed on the production build in all three browsers.
- Full production browser suite: 149 tests passed, zero failures. This includes offline reloads,
  cached local fonts, update handling, import/export, keyboard interaction, field alignment,
  comparison scrolling, inspector navigation and enlarged-text/long-label checks.
- Development checks for Settings and persisted UI state passed in all three browsers.
- Configuration inventory, Biome and full TypeScript/Svelte checks passed.
- Final browser coverage workflow: ten tests passed, including editing, shared defaults, comparison
  equations, imports, conflicting edits, leave and keyboard shortcuts. The coverage gate passed for
  all 170 authored TypeScript/Svelte files: 100% calculation/data line and function coverage, with
  at least 90% overall line and function coverage.
- The development server was restored on port 2000; the compact workflow passed against it in
  headless Chrome.

Actual mobile devices and screen-reader operation were not tested. Narrow browser viewports are
emulation. Safari testing is excluded on this Windows laptop. These checks do not establish full
WCAG 2.2 AA conformance.

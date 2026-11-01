# UI/UX investigation — 24 October 2026

Scope: alignment across forms and comparison controls, a separate clean-context design review,
a refreshed light/dark theme, and globally visible save feedback. Calculations and persisted
record schemas are outside this change.

## Confirmed defects

- Each field sized its label independently. Wrapped labels pushed neighbouring controls out of
  alignment. The profile's hospital-cover field and comparison controls demonstrated the problem.
- The header scrolled out of view. Local invalid text never reached the workspace save status,
  so “Saved locally” could appear while an invalid edit remained unsaved.
- Accordion margins and parent gaps compounded vertical spacing. All actions and borders had
  similar emphasis, obscuring primary actions and selected records.
- Navigation discarded the selected record; comparison headings disappeared while scrolling.
- Manual appearance changed palette variables without setting the native `color-scheme`.
- Backup version choices were hidden inside collapsed records without a completion count.

The independent reviewer received no prior conversation or proposed solution. It inspected the
current components and desktop/mobile screenshots. A second review identified three recovery
risks: silent blocked navigation, misleading partial-save wording, and a revert action that
incorrectly required a working database. Each was corrected before acceptance.
The final independent source, regression-test and screenshot review found no remaining concrete
issues in the alignment and save-state changes. The reviewer did not rerun browser sessions.

## Implemented behavior

- Shared label/control/help rows align responsive field grids. Subgrid is feature-gated; ordinary
  stacked controls remain usable if unavailable. Current supported-browser behavior is tested.
- A sticky header keeps navigation and save feedback visible. Unsaved typing, saving, saved,
  invalid edits, storage failures and conflicts have distinct feedback. Invalid-state text does
  not claim that other pending edits have already persisted.
- Review changes opens the affected section and focuses its field, or focuses the global conflict
  or error area. Revert discards only local text/error and never requires persistence.
- Navigation waits for an in-flight field save. Unsaved invalid fields direct focus back to the
  problem; valid saved records remain accessible after a failed edit is reverted. Selection is
  retained independently for Offers and Comparisons.
- Saved-record lists, settings panels and actions use consistent spacing. Primary actions have
  clear emphasis. Date text fields show the accepted format.
- Comparison headers and metric labels remain visible within the scroll region. The baseline is
  labelled and the delta meaning is explained. Compact arrow buttons retain keyboard scrolling
  and descriptive accessible names. All financial metrics remain available.
- Backup previews show outstanding choices and the selected version on collapsed summaries.
- Manual light/dark appearance also controls native form controls and scrollbars.
- The user-selected slate-and-teal palette distinguishes primary actions, selections and global
  save feedback. Decorative dividers are separate from the stronger input-boundary color.
- All authored UI corners and status indicators are square, as explicitly required by the user.
  Browser checks reject non-zero computed border radii. This exposed Chrome's native radio rounding;
  square checkbox/radio styling preserves the native inputs and keyboard behavior.

## Verification contract

The new browser regression failed against the previous UI for four independent assertions:
wrapped-label alignment, sticky-header visibility, unsaved typing feedback and invalid-edit
feedback. After correction it passed. Additional browser cases exercise field review, local
revert, blocked-navigation focus, unload protection, persistent storage failure and access to
JSON backup during that failure. The test-only storage fault is restored in `finally`.

The existing financial, import, conflict, persistence and offline checks remain active. The save
test helper now waits for an edit to settle; an invalid-state result is not labelled a successful
save. Independent persistence and reload assertions still establish saved values.

Temporary changes: test browsers and servers are closed by their existing cleanup handlers;
the synthetic storage fault is restored. Generated screenshots and coverage remain under the
project's ignored evidence directories. No user records, credentials or external services were used.

Final acceptance evidence and platform limits are recorded in IMPLEMENTATION.md.

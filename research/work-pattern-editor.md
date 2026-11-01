# Work-pattern editor

Implemented on 24 October 2026 after the user approved the independently investigated recommendation.

The offer form now orders Pay details, Work pattern, then Commuting costs. Work pattern combines the
roster, holiday policy, leave entitlement, and dated work/leave exceptions.
- A weekly view maps the saved cycle anchor to named weekdays. Each day offers Off, On site, or
  Remote, with expandable times and breaks. Common times apply to all working days.
- Finish times include the unpaid break. The approved 09:00 start, 7 hours 36 minutes of work, and
  30-minute break finish at 17:06. Existing break inputs already supported this without split rows.
- Custom patterns retain their cycle, overnight blocks, multiple blocks, and trip counts. Switching
  views does not convert or replace their data. The weekly view is unavailable when it cannot
  represent a pattern without changing it.
- Remote changes save zero trips atomically. Returning to on-site attendance starts at one trip;
  zero-hour days retain zero trips, and existing on-site custom trip counts otherwise remain
  unchanged. The fully remote shortcut preserves times, holidays, and dated office visits.
- Weekly work/trip totals, standard paid hours, and financial-year attendance remain separate.
  A fully remote calendar needs no commuting inputs. Entered dated office visits still create trips.
- Editing inherited rosters creates an offer override. Restoring the shared pattern preserves dated
  exceptions and holidays. Invalid edits remain visible and prevent editor changes that would hide
  them; other consistent valid edits can still save.

Verification covers weekday mapping, custom-pattern preservation, independent time arithmetic,
remote trip counts, inheritance, invalid edits, dated office visits, reloads, and offline production
workflows. Regression tests reproduced hidden invalid fields during an overnight transition and
an incorrect trip after changing a zero-hour day to on-site attendance; both now pass.

Final `bun run check` passed: configuration validation, Biome, all type checks, 430 Bun tests,
the application coverage workflow, 28 browser tests, and Git whitespace checks. Coverage gates
passed across 71 authored TypeScript/Svelte files, enforcing 100% calculation/data line and
function coverage and the 90% overall minimum.

Production/offline and keyboard workflows passed on Windows with Bun 1.4.4, headless Chrome
156.0.8078.48, Edge 155.0.4283.62, and Playwright Firefox 157.0. Viewports were 1280×800 and
390×844; field-layout checks also covered 320×800. Weekly and custom screenshots were visually
reviewed. Screen-reader, physical-mobile, macOS, and Linux verification remains incomplete.
Safari testing is excluded on this Windows laptop. These checks do not establish full WCAG conformance.

This change adds no dependency and changes neither the storage schema nor financial rules.

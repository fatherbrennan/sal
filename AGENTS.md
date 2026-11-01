# sal

The user has authorised autonomous research and local reference documents while away. Use the
[research index](research/README.md), [comparison field catalogue](research/comparison-fields.md),
and [ATO evidence](research/ato/README.md). Treat verified facts, proposed models, and unresolved
rules as distinct. On 23 October 2026 the user explicitly instructed implementation of the entire
application. Implement the confirmed product behavior; do not manufacture unresolved financial rules.

Status: IMPLEMENTATION AUTHORISED by the user on 23 October 2026. Tooling and confirmed salary
features are authorised. Preserve the evidence boundaries for unsupported financial results.

Tooling was established first. The confirmed product decisions now authorise implementation.
On 23 October 2026 the user also approved labelled estimates from verified tax components while
final assessed-tax precision remains unavailable. Preserve that distinction in every output.

On 24 October 2026 the user required a fresh code/source investigation, treating earlier research
documents as unverified. Use the [fresh defaults investigation](research/defaults-investigation.md)
and its confirmed decision ledger for the new SA private-sector full-time preset. Offer defaults
are shared and inherited; preserve explicit per-offer overrides and distinguish blank from zero.
The user handled the alpha storage reset. Do not clear storage again. Old backup compatibility is
not required; do not weaken validation to accept an earlier schema.

## Mandatory skills and communication

- Use [$concise](C:/Users/brandon.lepore/.codex/skills/concise/SKILL.md) in **all output contexts**, including conversation, questions, documentation, file content, code comments, reviews, and change summaries. Accuracy and completeness precede brevity.
- Use [$investigate](C:/Users/brandon.lepore/.codex/skills/investigate/SKILL.md) in **all research contexts** to understand the relevant context before drawing conclusions or proposing changes.
- Delegate Australian tax research and tax questions to the dedicated [ATO specialist](agents/ato-specialist.md). Its findings require verified sources; delegation does not remove the need to review evidence.
- Use [verified-procedures](C:/Users/brandon.lepore/.codex/skills/verified-procedures/SKILL.md) for every method, process, procedure, instruction, how-to, walkthrough, checklist, or runbook, including corrections. Choose the reporting flow before investigating or drafting; verify the complete outcome.
- Use [$write-tests](C:/Users/brandon.lepore/.codex/skills/write-tests/SKILL.md) when designing, adding, or changing tests. Derive expectations independently from requirements and verified examples.
- Ask simple questions with selectable options when a project decision is missing. Allow a custom answer. A recommendation is not an approved decision.
- Make no assumptions. Resolve factual unknowns through evidence and preference unknowns through the user. Stop dependent work until resolved; continue independent authorized work.
- Do not silently weaken, bypass, reinterpret, or make exceptions to these rules. Report conflicts and obtain an explicit decision before dependent implementation.

## Required stack

- Use port 2000 only for development, preview and application test servers. Fail if it is occupied;
  do not fall back to another port or allow port overrides. The user confirmed this on 25 October 2026.
- Name the project and package `sal`.
- Use Bun for the development runtime, build tooling execution, scripts, dependency management, and tests. The deployed application runs in the browser.
- Run JavaScript and TypeScript tooling with Bun. Verify runtime compatibility; do not silently fall back to another runtime.
- Use SvelteKit with TypeScript and `@sveltejs/adapter-static`. Application behavior is client-only; do not introduce a production application server or server-dependent features.
- Use Biome for formatting and linting.
- Use TypeScript for authored code, scripts, tests, and configuration whenever the consuming tool supports a `.ts` configuration. Use TypeScript inside Svelte script blocks. Retain required formats such as `package.json`; do not invent unsupported TypeScript equivalents.
- Use `bun install`, `bun.lock`, and the npm registry. Do not introduce another package manager or lockfile.
- Each install task must read the machine's available thread count and set lifecycle-script concurrency to `max(1, floor(threads × 0.8))`. The user approved the 80% share, rounding down, and minimum of one.
- Pin direct dependencies and the Bun toolchain to exact stable versions. Review every upgrade; do not use version ranges or silently upgrade dependencies.
- Use IndexedDB for persistent application data. Do not substitute localStorage, sessionStorage, cookies, a remote database, or a server filesystem.
- Use Bun, Biome, SvelteKit, and browser platform capabilities before considering another technology. Establish a concrete unmet requirement and obtain approval before adding another technology.
- Framework support tooling required by this stack includes Svelte, Vite, the TypeScript compiler, Svelte type checking, and Bun type definitions. Keep versions compatible and exact. This does not authorize unrelated libraries.

## Confirmed application purpose

- The user requested removal of irrelevant form questions on 23 October 2026. Use the
  [field audit](research/field-simplification.md) for the implemented editor projection. Keep
  legacy schema fields for backup compatibility; removing a control is not permission to discard data.
- New optional income, deduction and extra-super amounts start at editable $0, as explicitly approved.
  Preserve existing saved amounts and blanks. Required salary, super-inclusion, household, cover,
  loan and threshold facts remain explicit. Clearing an amount retains its unknown state.
- The simplified standard estimate states its modelling scope instead of requesting technical
  declarations. Do not claim those conventions establish personal, employer or fund facts.
  Preserve original-mode calculations and existing overrides; keep unknowns repairable.

- Compare Australian salary packages one-to-many and many-to-many.
- Initially accept and display monetary amounts in Australian dollars only. Do not add foreign-currency inputs or conversion rates.
- Many-to-many means comparing any selected alternative offers side by side. Concurrent-job group comparisons are not part of this selected comparison mode.
- Store salary packages in IndexedDB for reuse in comparisons.
- Include quantifiable perks and additional costs when assessing package value.
- Account for remote, hybrid, and on-site arrangements, including commuting distance, travel time, and fuel costs.
- Default commuting costs to entered fuel/energy and other expenses. Keep the sourced ATO kilometre-rate comparison estimate as an alternative, separate from tax-deduction eligibility and actual expenditure.
- Share fuel/energy prices and vehicle consumption across offers, with explicit per-offer overrides. Identify inherited versus overridden values; shared changes recalculate dependent comparisons without replacing overrides.
- Start commute entry with total return-trip distance and time, allowing separate outward and return entries. Keep the input basis explicit; do not double a return total or add it to its component legs.
- Limit entered vehicle comparison costs to running costs and trip charges. Exclude allocated insurance, registration and depreciation. The user explicitly retained the ATO-rate alternative as a broader vehicle-cost estimate; label that distinction and do not invent a running-cost-only share of the published rate.
- Make travel-time valuation optional for each comparison, enabled by default, using each offer's salary-derived hourly rates. The gross rate uses gross remuneration plus personal perk value. On 26 October 2026 the user changed the after-tax rate to annual cash plus super after ordinary contribution tax, excluding personal perks, divided by standard paid hours. Multiply each rate by that offer's commute hours. The custom hourly-rate option remains removed.
- Derive annual cash using the approved incremental offer-tax attribution, after personal super transfers. Adding net super counts those transfers once. Keep cash-only and representative payslip hourly rates separately visible; do not substitute withholding for annual tax. Monetary commute-time value is a modelling convention, not a cash expense or tax deduction. Unknown or negative combined rates leave time value unavailable, except when disabled or commute hours are known to be zero.
- Lead with **Package value after tax, commute costs and commute time value**: cash after estimated annual tax + net super + personal perks − all commuting expenses − commute hours × cash-plus-net-super per standard paid hour. Show fourteen overview rows: headline, its five components, the time-valuation hourly rate; earned leave weeks, hours and gross base-pay-plus-super value; package value including hypothetical leave cash-out, cash-out total, cash kept and net super. The combined hypothetical total adds the existing headline and cash-out total, retains the original commuting costs and time valuation, and requires both values to be available. Group remaining values into Pay, super and package value; Work and commuting; Job costs and adjusted values; Bonuses, commissions and one-offs; Annual leave details; and Tax estimates and assumptions. Preserve current baseline differences and recursive equations. Commuting includes fuel/energy, maintenance, parking, tolls and fares, or the labelled broader ATO estimate. Other job costs remain separate. Perks are personal values, not independently calculated after-tax amounts.
- On 27 October 2026 the user approved consistent display names for all comparison metrics. Use the shared names in comparison rows, summaries, differences and equation details. Keep existing metric identifiers and calculations. Distinguish employee cash pay from contractor revenue excluding GST, annual offer-attributed tax from representative payroll withholding, and standard paid, work, and work + commute hours.
- Use each offer's own salary-derived hourly rates to value its commuting time. The selected baseline determines comparison differences, not a shared time-valuation rate.
- Show gross package value and estimated take-home pay. Keep tax calculations distinct from the economic value of perks, personal time, and expenses.
- Calculate both annual tax liability and payroll withholding, displaying them separately. Do not relabel annual tax divided by pay periods as payroll withholding.
- Present payroll withholding as representative pay periods for each applicable rule period, not an assumed full year's dated deposit schedule.
- Always calculate both gross and after-tax monetary results, including hourly-rate and commute-time valuations. A selected display or comparison basis must not remove the other calculations.
- Show a combined after-tax package value from annual assessment-adjusted cash, supported net super contributions and additive personal perk values, with each component visible. Show job costs and travel-time adjustments separately. Distinguish values before and after other payroll outflows; preserve those destinations in full-remuneration reconciliation rather than treating every transfer as lost value. Unknown super-tax inputs must not become zero.
- Show the full remuneration package and the breakdown to cash in the bank, super and tax, with corresponding hourly views throughout the application. Distinguish before-tax cash pay from bank receipts and annual assessed tax from payroll withholding. Use the confirmed standard paid-hours denominator; show calendar work and work-plus-travel denominators separately.
- Accept annual salary and separately entered annual bonuses with their own super-inclusion settings; derive hourly views from those amounts and the entered weekly hours. Do not require an hourly-rate input when the annual package is known. Keep base-only and applicable bonus scenarios visible, and verify the cash/super split independently of the directly calculable inclusive-package hourly value.
- Keep isolated base cash and base/bonus super visible alongside aggregate hourly rates. A base-only scenario removes separate earnings and recomputes tax; it must not reuse scenario-specific taxable-income, HELP-family or bonus-linked reportable-super facts without an established basis. Embedded or capped allocations remain unavailable when they cannot be isolated safely.
- On 26 October 2026 the user replaced the NES-only leave-hours cap with confirmed employer leave terms: weeks per year multiplied by paid hours per leave week, including confirmed values above 38. Keep these separate from statutory ordinary hours, comparison hours and TOIL. The full-year non-casual model still requires at least four entitlement weeks. Default leave pay to the editable assumption that normal base salary continues during leave, using annual base cash / 52 / paid hours per leave week; offer a confirmed hourly rate for other pay bases. This is a shared default for unanswered existing and new offers; preserve explicit choices and cleared values. Loading supports none, a confirmed percentage of the calculated base leave pay, or an established hourly amount. Keep loading unknown until selected; do not assume 17.5% or zero. Keep optional unused balance and date in the main Paid annual leave section.
- Leave entitlement and a dated, entered unused balance are distinct informational values, outside normal annual cash, tax, super and package totals. The user approved a separate hypothetical cash-out of one year's entitlement, paid on top of the selected annual earnings while still employed. Net cash equals gross leave pay minus the change in supported annual income tax, offsets, Medicare, surcharge and loan repayments. Rebuild assessable and labour income and linked deductions; preserve negative threshold effects. Do not reuse saved taxable-income overrides or income-dependent HELP-family answers. Employer super is not cash. This illustration does not establish actual cash-out eligibility; termination payouts remain unsupported. Preserve saved inputs and unknowns.
- Value earned gross leave using ordinary base cash plus allocated base employer super per leave hour, excluding bonuses, perks and loading. Require a common established annual-salary basis for the super allocation. The user confirmed a combined hypothetical cash-out of extra cash plus extra net super, with both components visible and received in the selected financial year. Apply statutory SG headroom to the additional payment; screen modelled concessional caps and Division 293 before presenting ordinary net values. Unknown loading eligibility, contractual contribution/reporting treatment, special-fund or cap circumstances must not become invented net amounts. Keep these separate from existing annual remuneration; see [leave valuation evidence](research/leave-value-2026-10-26.md).
- For employee offers quoted hourly or daily, calculate annual earnings as the quoted rate multiplied by explicitly entered annual paid hours or days. Do not infer those paid quantities from attendance, leave entitlement or the financial-year roster. Annual salary quotes retain their stated annual amount.
- Require an explicit includes-super or excludes-super choice for each new salary and bonus amount. Do not default either state or treat an unanswered setting as false; keep dependent results unavailable until the inclusion is known.
- For bonus and commission entry, use one **Super on this payment** control: **Cash before tax, plus super**, **Cash before tax and super combined**, or **Cash before tax, no super applies**. The third option is for confirmed exceptions and makes the quote basis immaterial. Preserve stored eligibility/inclusion facts and incomplete drafts; save both answers together when the choice changes. Clearing it makes both unknown. This control was approved on 24 October 2026.
- Default a new employee offer's employer-super setting to the selected financial year's statutory minimum, allowing higher contributions. Apply independently verified eligibility, earnings bases and limits; this default does not settle whether a salary or bonus quote includes super.
- Limit the employer package total to remuneration: pay, super and benefits. Exclude employer-only costs such as payroll tax and workers' compensation; do not label remuneration as the business's complete employment cost.
- Value non-cash perks using the user's personal value only; do not require or assume employer value for comparison. Label totals containing personal perk valuations accordingly. Keep any required tax/reporting values separate and independently evidenced; personal value is not a substitute.
- Treat perks as additive personal values only. Do not implement perk salary reductions, employee contributions, funding splits or other deduction calculations. This explicit clarification supersedes the proposed perk-funding model; it does not establish a tax exemption or a taxable/reportable amount.
- Display salary and comparison totals in dollars and cents. Preserve entered unit-price precision beyond two decimals, including fuel per litre and electricity per kWh; do not round the stored rate to match total-display precision. Display precision must not replace independently verified calculation and rounding rules.
- Show cash after job costs per work-plus-travel hour separately from package value after a monetary travel-time deduction. Do not combine both time adjustments into one measure by default.
- Show a standard paid-hours hourly rate using an editable 52-week conversion, alongside financial-year calendar calculations for actual work, attendance and commuting. Keep paid, worked and work-plus-travel denominators labelled and distinct; only actual or explicitly estimated attendance creates commute journeys.
- Enter work patterns as repeating rosters with dated exceptions, including rotating shifts. Use the entered roster and exceptions for attendance and commuting; do not assume a fixed Monday-to-Friday week.
- Initially support financial years 2025–26 and 2026–27, selecting 2026–27 by default. Apply each year's verified rules and effective dates separately.
- Initially calculate for full-year Australian tax residents. This does not narrow the approved employment-type coverage or imply that every resident's special tax circumstances are already verified.
- Compare normal full-year scenarios only; do not implement job start/end-date comparisons. Preserve applicable within-year tax-rule changes.
- Share personal tax settings across offers, with explicit per-offer overrides. Keep offer earnings, benefits and job costs separate from those personal settings.
- Let users specify tax-free-threshold claims for the applicable employer/payer in each alternative scenario's withholding inputs. Do not treat a payer declaration as a separate annual tax-free threshold or as approval of an annual tax-allocation convention.
- Attribute annual assessed tax to an offer using the incremental convention: total annual tax with that offer minus total annual tax without it. Recompute eligibility and linked deductions in both valid scenarios. Keep this comparison amount distinct from withholding, total personal tax and representative bank receipts.
- Allow incomplete offers to be saved as drafts. Flag missing inputs and mark affected results unavailable; preserve independent results that can be calculated correctly. Do not fill missing inputs with assumed values.
- Automatically recalculate saved comparisons when their linked offers or shared settings change. A new application version's verified tax-rule correction also triggers recalculation and must clearly identify the changed rule. Retain the input and rule versions used by the current result; do not present an old result as current.
- Show guaranteed and target bonus/commission scenarios separately. Do not invent probabilities or present contingent target earnings as guaranteed cash.
- Show one-off payments and costs separately from recurring annual totals. Do not silently repeat or fold them into recurring remuneration or expenses. Retain required gross and after-tax views.
- Itemise gross one-off amounts and show their combined after-tax result. Do not invent a per-item allocation of annual tax.
- Use a side-by-side comparison table with expandable breakdowns. Preserve access to the required gross/net, bank/super/tax and time views.
- Use compact, spreadsheet-like spacing to show more information at once. Preserve readable labels, keyboard operation, focus visibility and the required accessibility target; density does not permit hiding required controls or information.
- Enter each offer in one form with expandable sections for pay, benefits, work patterns and costs. Preserve automatic saving and visible missing-input states across sections.
- Show differences against one baseline offer explicitly selected by the user.
- On phones, retain the side-by-side comparison table with horizontal scrolling and metric labels kept visible. Preserve accessible navigation and expandable breakdowns.
- Removing an offer archives it and permits restoration. Preserve the offer and its links so existing saved comparisons continue to work; archiving must not silently delete their inputs.
- Save offer and settings edits automatically, with clear saving, saved and error states. Do not report a save as successful before persistence succeeds.
- For invalid entries, show a validation error and retain the last valid saved value. Do not persist invalid text or report the invalid edit as saved. Incomplete but valid drafts remain allowed.
- Continue autosaving other valid edits while a field is invalid, provided the resulting stored offer passes validation and remains consistent. Validate related fields together; do not persist a contradictory combination or hide the unsaved field's error behind a general saved status.
- If edits to the same offer conflict across browser tabs, show both versions and let the user resolve the conflict. Do not silently overwrite either version.
- Follow the system light/dark preference by default and provide a manual appearance switch. Store persistent appearance preferences in IndexedDB.
- Default new packages to editable fortnightly pay and four weeks of annual leave only where the employment rules permit. Leave entitlement does not establish leave taken; pay frequency does not establish actual pay dates or payment counts.
- Do not assume leave is taken each year or subtract entitlement from attendance. Apply explicitly entered leave dates to work and commuting; disclose when no leave dates have been entered instead of claiming actual leave taken is zero.
- Require each offer to specify whether rostered public holidays are normally worked, with dated exceptions. Apply the relevant holiday interval and location; do not assume every public holiday removes a whole day of work or commuting.
- Support all employee types and initially calculate sole-trader contracting. The user explicitly deferred contracting through their own company, partnership or trust on 23 October 2026. Verify each included arrangement's tax and remuneration treatment; do not apply an employee formula to a contractor. This does not exclude employee wages paid by a company or independently relevant other-income inputs.
- For contractor revenue, support both an explicit annual estimate and a rate multiplied by entered billable hours or days. Treat these as alternative input methods; do not infer billable capacity from employee paid hours or add both revenue estimates together.

## Formatting baseline

- Use 2 spaces, double quotes, semicolons, a 100-column line-width setting, and LF line endings where supported by the file format.
- This baseline does not replace the requirement to explicitly configure every supported Biome property.
- For remaining formatting settings, use the pinned Biome version's defaults and write their values explicitly. Do not replace the user's chosen baseline with defaults.

## Browser and styling requirements

- Target current Chrome, Edge, Firefox, and Safari on desktop and mobile where those browsers are available. Safari testing is explicitly excluded on this Windows laptop by the user; retain that limit in verification reports.
- The agent performs all testing; do not assign manual verification to the user. Record actual browser versions, platforms, devices, and assistive technologies tested. Browser emulation and Playwright WebKit are not proof of actual mobile-device or Safari behavior.
- Require [WCAG 2.2 AA](https://www.w3.org/TR/WCAG22/), including keyboard and screen-reader verification. Automated accessibility checks alone do not establish conformance. Report unavailable verification accurately.
- Use Svelte component CSS and shared CSS custom properties. Do not introduce a styling framework or component library without approval.
- Follow [the typography palette](research/typography.md). Define typography values only in
  `src/typography.css`; components use its tokens or inherit. Use its native system UI stack for
  interface/prose and native monospace stack for numeric values/formulas. Supporting text is at least 13px
  at default browser settings. Preserve numeric versus unavailable/prose states.
- Use sharp corners throughout the UI, including buttons, containers, boxes and status indicators. Do not introduce non-zero border radii. The user explicitly required this on 24 October 2026.
- Package scripts must support Windows, macOS, and Linux. Test on accessible platforms and report unavailable-platform verification; portable syntax alone does not prove execution on another operating system.

## Test tooling

- Use Bun as the test runner. The Playwright browser automation library is approved, subject to a compatibility check with the pinned Bun and Playwright versions. Do not replace Bun's test runner with Playwright Test.
- Automate browser workflows and perform actual-browser checks on accessible supported browsers. Cover storage persistence, import/export, offline operation, and financial results when those features are implemented.
- Do not skip required checks because this laptop lacks a capability. Record the blocker and leave the corresponding verification incomplete. The user's explicit Safari-testing exclusion remains valid.
- Enforce at least 100% line and function coverage for calculation and data modules, and 90% overall across measurable authored TypeScript, including Svelte scripts. Include untested modules in the measured scope. Document exclusions; do not exclude code to meet a threshold.
- Use native Bun coverage for code exercised in Bun. The user approved Chrome/Playwright coverage for browser-only Svelte and IndexedDB code, with an exactly pinned development-only `v8-to-istanbul` converter, on 23 October 2026. Bun remains the runner. Verify original-source mapping and deliberate threshold failures before adopting this integration; identify each coverage provider accurately and do not count a source twice.
- Verify threshold enforcement with a deliberately failing, temporary coverage fixture. Keep threshold checks active in the selected reporter configuration. Coverage percentages do not replace boundary, invalid-input, failure-path, and regression tests.

## Privacy and network boundary

- Keep calculations and financial data local. During application use, load only application assets; do not call external APIs, send telemetry, or load third-party runtime resources.
- ATO and PayCalculator are development research references, not runtime services. Ship verified tax rules with the application and identify their applicable financial years.
- Do not embed secrets or credentials in the static application.

## Offline operation and backups

- Require an initial successful online load. Cache all assets and calculation resources required to operate offline, and keep persistent application data in IndexedDB.
- Verify complete offline use and reload after caching. Do not claim offline support merely because calculations work in an already-open tab.
- Notify the user when an application update is ready and let them choose when to reload after changes are saved. Do not automatically reload or discard unsaved edits to activate an update.
- Support JSON export and import of packages and comparisons. Validate the complete import, schema version, and references before changing stored data; failed imports must preserve existing data.
- Preview differences for backup records that already exist and let the user choose which version to keep before applying the import. Do not silently overwrite a newer local offer with a backup version.
- Keep backup files user-controlled. Do not automatically upload exports or claim that browser storage is a backup.
- Request browser persistent-storage protection after the first successful save. Report the actual grant, denial or failure; requesting protection does not establish that it was granted or replace JSON backups.

## Configuration

- Explicitly configure every supported property in every tool configuration, including defaults. Enumerate the pinned versions' schemas and documented configuration surfaces. For Biome, include nested properties, formatter settings, lint rules, rule options, and assist settings; do not rely on an implicit preset as a substitute.
- Verify every configuration property and value against the selected version. Do not copy settings from another version or invent unsupported properties.
- Maintain a configuration inventory identifying every supported property, its explicit value and configuration location, or its exclusion and reason. Identify conflicting, deprecated, conditional, or non-applicable properties before implementation. The user permits documented exclusions for incompatible or non-applicable properties; explicitly configure every valid option.
- Do not enable unrelated features, invent array entries, or create invalid values to populate configuration. Enumerate supported option names; validate chosen variants against the pinned tool. A preference that determines a conflicting setting still requires a user decision.
- Review configuration completeness when upgrading any tool. Newly available properties require an explicit decision.
- Record unresolved configuration values as decisions pending approval; do not present them as settled.
- For settings not otherwise specified, use the pinned tool's documented defaults explicitly, tightening them where approved rules require it. The user authorised this policy on 23 October 2026; record each choice in the configuration inventory.
- Enable Biome's experimental full Svelte support explicitly. Pin the version and verify formatting and linting against representative Svelte examples before accepting the configuration or an upgrade. Treat unsupported syntax or incorrect transformations as blockers, not reasons to silently bypass checks.
- Enable every applicable stable, compatible Biome lint rule at error severity. Explicitly configure every rule and document why each disabled rule is disabled. Do not enable experimental lint rules merely because experimental Svelte parsing is approved.
- Limit CSS selectors to three class selectors, as approved by the user.

## Type safety and diagnostics

- Enable TypeScript `strict` and explicitly enable its constituent checks. Also enable `noUncheckedIndexedAccess` and `exactOptionalPropertyTypes`.
- Type-check authored application code, Svelte components, scripts, tests, and TypeScript configurations. Transpilation and a successful build do not replace type checking.
- Use `unknown` and runtime validation at untrusted boundaries. Do not use `any`, non-null assertions, unsafe casts, `@ts-ignore`, or `@ts-nocheck` to avoid proving correctness.
- Require zero unresolved formatting, lint, compiler, Svelte, and accessibility diagnostics in the checked scope. Investigate tool defects or dependency diagnostics; do not silently suppress them.

## Project tasks

- Expose every project command through a named `package.json` script, including read-only file searches, inspection, Git status, and Git diff. Create a missing script before running its command.
- Invoke project tasks through `bun run <script-name>`. Do not bypass scripts with ad hoc package, build, format, lint, test, maintenance, or verification commands.
- Implement task logic in TypeScript executed by Bun. Use Bun APIs, Bun Shell, or `Bun.spawn` for process and filesystem work as appropriate.
- Do not add PowerShell, batch, or platform-shell scripts. Do not assume platform-specific commands are portable merely because Bun launches them.
- Make scripts fail on errors and propagate child-process failures. Verify paths before destructive filesystem operations.
- Bootstrap through file edits: create `package.json` and its required scripts before executing any project command. Bootstrap is not permission for direct command-line scaffolding, installation, or inspection.
- Keep each script's purpose specific and reviewable. Do not create a generic shell-command passthrough to bypass the named-task requirement.
- Create task scripts when required; do not create placeholders that report success without doing their work. Verify commands against the pinned tools before execution.

## Tooling acceptance

- Expose formatting verification, linting, type checking, unit and integration tests, coverage, browser tests, configuration completeness, and the static production build through specific package scripts.
- Provide an aggregate `check` script that runs the applicable automated acceptance checks and fails when any required check fails. Document any checks that require a separate accessible browser, device, or assistive technology.
- Verify configuration against the pinned schema or tool types and native validators. Verify the completeness inventory also detects an omitted required setting; valid syntax alone does not establish completeness.
- Verify the static output works when served as production assets. Do not claim production behavior solely from the development server.
- Keep live tax rates, salary calculations, persistent salary schemas, and designed application screens out of the tooling milestone until their requirements are settled.
- Review the final files and required checks after the last relevant edit. Report passed checks, actual environments, and any blocked checks separately. A blocked or undiscovered test is not a pass.

## Git

- Initialize a local Git repository during the approved tooling setup, through a named package script.
- Do not commit, push, add a remote, or publish unless requested. Preserve unrelated changes and do not alter global Git configuration.
- Exclude installed dependencies, generated build output, test artifacts, local financial data, backups, and credentials from version control.

## Change discipline

- Inspect the relevant code and trace affected callers, tests, fixtures, configuration, and exports before changing behavior.
- Implement only the approved scope. Reuse existing project and platform capabilities before adding code or dependencies.
- Preserve unrelated user work and processes. Track and remove temporary investigation changes and processes.
- Validate untrusted input and stored data. Preserve error handling and safeguards against data loss.
- Add focused tests for non-trivial behavior and regression fixes. Test observable requirements, including relevant failure paths.
- Do not disable checks, lower thresholds, suppress diagnostics, or edit test expectations merely to obtain a passing result.
- Report what changed, what was verified, and what remains unverified. Never present Bun tests as proof of real-browser behavior.

## Decisions before salary-feature implementation

- Confirm the exact employment classifications and tax circumstances within the approved all-employee-types and sole-trader scope; do not narrow that scope without approval. Other-entity contracting is deferred by the user's explicit decision.
- Verify complete annual-assessment and payroll-withholding rules for the selected financial years 2025–26 and 2026–27 before implementing the corresponding calculations.
- Confirm financial components, superannuation treatment, units, annualisation, rounding, and independently verified calculation examples.
- Confirm salary-derived hourly-rate formulas, travel inputs, working days, and treatment of perks and costs. Travel-time valuation starts enabled and remains optional.
- Confirm comparison behavior, saved scenarios, interface requirements, storage migrations, and import conflict handling.
- Confirm the static hosting target and route fallback before deployment. Do not deploy or publish without authorization.

These decisions may follow the tooling setup. They block the corresponding feature or deployment work, not independent approved tooling work.

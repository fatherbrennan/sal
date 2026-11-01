# Australian tax research for sal

Status: research reference; detailed salary-feature rules remain unresolved. Tooling setup was approved on 23 October 2026. This is AI research, not an ATO service, individual tax advice, or certification of a calculator.

Initial verification: **22 October 2026**, with dated follow-ups on **23 October 2026**,
Australia/Adelaide. Clock observations are recorded in the source register and supplements.
Each source records the version actually retrieved; a retrieval date does not establish an
income year's applicability.
- [Source register](sources.md): exact remote references, versions, retrieval status and inspected provisions.
- [Verified facts](facts.md): dated calculation components and their limits.
- [Tax input inventory](fields.md): evidenced dependencies separated from proposed application fields.
- [Independent arithmetic checks](checks.md): synthetic component examples, with explicit exclusions.
- [Open decisions and research blockers](blockers.md): matters that prevent a complete supported calculation.
- [Case guide review](case-guide-review.md): 23 October 2026 supplement covering kilometre costs, super-inclusive quotes, payroll cash and leave applicability.
- [Year readiness](year-readiness.md): selected 2025–26 and 2026–27 rules, dated PAYG instruments, component examples and unresolved implementation evidence; checked 23 October 2026.
- [Ordinary calculation evidence](ordinary-calculation-evidence.md): 23 October follow-up resolving historical super amounts, narrowing LITO/assessment rounding gaps and independently checking ordinary PAYG samples.
- [Medicare and MLS evidence](medicare-and-mls-evidence.md): ordinary levy/family formulas, separate dependant and income tests, cover days, source conflicts and independently checked examples.
- [Annual cash and tax attribution](annual-cash-and-tax-attribution.md): approved incremental-tax convention, separate payer threshold settings, itemised gross/combined net one-off display with proposed assessment decomposition, and optional whole-person cash summary.
- [HELP and withholding evidence](help-and-withholding-evidence.md): debt/assessment timing, three payroll rule periods, nine checked published examples, combined-rounding differences and unresolved annual-guide conflicts.
- [Super money flows](super-money-flows.md): employer versus sacrificed/personal contributions, receipt-year boundaries, inclusive quotes, capped SG and bank/super/tax reconciliation specimens.
- [Employee earnings classification](employee-earnings-classification.md): bounded ordinary-pay/commission/overtime branches, historical leave exclusions and precise ATO access gaps for bonuses, allowances and paid leave.
- [Annual tax component boundaries](annual-tax-component-boundaries.md): specified basic-tax inputs, verified paper-field truncation, isolated assessment-rounding specimens and the remaining LITO precision gap.
- [Medicare component boundaries](medicare-component-boundaries.md): ordinary single/couple raw contracts, spouse excess-reduction transfer, statutory phase-in ordering, historical versus current fixtures and remaining assessment precision.
- [Sole trader component boundaries](sole-trader-component-boundaries.md): initial contractor scope, GST/expense/PSI classifications, annual revenue-to-personal-tax bridge, contractor super, cash gaps and deferred entity-contracting research.
- [Employee remuneration reconciliation](remuneration-reconciliation.md): confirmed additive personal-value perks; proposed cash/super allocation, separate payroll destinations, reimbursement matching and annual versus representative cash/hourly views.

## Evidence boundaries

`BODY` means relevant text was retrieved and inspected. `PARTIAL` means only limited content was accessible. `BLOCKED` means retrieval failed. `INDEX` means only search-index text was available. Only `BODY` evidence supports confirmed rules here. It does not mean the entire source or all related law was reviewed.

These files preserve concise source paraphrases and links, not complete copyrighted publications. Named facts `F01` onward link to source IDs `T01` onward. Proposed fields are design candidates, not approved requirements or asserted statutory form fields.

Current legislation was checked through the Federal Register. The ITAA 1997 compilation inspected is **C268, effective 1 October 2026**. Earlier 27 August 2026 copies encountered during discovery were replaced by current references. Some standard ATO pages returned HTTP 403; available legislation, ATO software guidance and official government education pages supplied alternate evidence. Blocked ATO content is not treated as verified.

The initial 22 October research selected no financial year, residency, household circumstances, withholding mode or defaults, submitted no personal information, and ran no project commands. The user subsequently selected 2025–26 and 2026–27 (default 2026–27), annual liability and payroll withholding separately, alternative offers side by side, and both gross and after-tax results. Supplements distinguish those decisions from unresolved inputs and use named package scripts for local inspection.

## Consequences for scope

The user confirmed initial calculations for **full-year Australian tax residents**, **all employee
types and sole-trader contracting only**, and **incremental annual tax attribution**: tax with
an offer minus tax without it, with both scenarios recomputed. This does not verify every resident circumstance or turn
payer-specific withholding declarations into separate annual thresholds.

The 23 October contractor decision defers calculations for the user's own company, partnership
or trust contracting arrangement. Retained research for those branches is not an initial-release
blocker. Ordinary wages paid by a company remain in scope; entity-derived shared personal tax
inputs are not excluded by this contracting boundary and still need verified treatment.

The user also confirmed separate guaranteed/target bonus scenarios and automatic recalculation
when a new application version includes a verified tax-rule correction, with the changed rule
identified. This does not authorise runtime research or unverified rule updates.

Perks are confirmed as additions at entered personal value, without perk funding, contribution
or salary-deduction calculations. Salary-packaging findings are retained as research-only.
Separately required statutory tax/reporting inputs remain evidenced independently; personal value
does not establish them or make a perk tax-free. Super contributions remain a separate subject.

The retrieved rules contain date boundaries for Payday Super, a standard work-expense deduction, individual rates, study-loan repayments and future salary-packaging treatment. A single undated tax table cannot represent these rules. Gross cash, employer super, taxable income, annual liability, payroll withholding, spendable cash and economic package value need distinct definitions.

The corpus is substantial but not exhaustive. Verified components and bounded payroll samples do
not establish a complete calculator: eligibility, exceptions, rounding, annualisation and
cross-rule interactions still require the checks in [blockers.md](blockers.md).

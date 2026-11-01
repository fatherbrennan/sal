# Tax input inventory

This is a candidate field inventory, not an approved schema, form, collection policy or promise to calculate every case. Entries identify dependencies supported by [facts.md](facts.md), or explicitly mark research still required. Missing values must remain unknown; zero, no, resident, single and full-year are not interchangeable with unknown.

**Initial scope confirmed on 23 October:** all employee types and sole-trader contracting.
Own company/partnership/trust contracting models are deferred. Company-paid wages and relevant
entity-derived shared personal tax inputs are not excluded. Broader entity research below is
retained with that boundary; it is not a promise of initial own-entity contracting calculations.

Evidence classes:
- **C**: confirmed product decision, not a tax-law conclusion.
- **V**: the named dependency is supported by retrieved primary text. Full calculation coverage may still be incomplete.
- **P**: proposed application representation or comparison convention requiring approval.
- **R**: plausible scope requiring additional primary verification before affecting a calculated tax result.

## Identity, dates and comparison unit

| Candidate input/group                                                    | Class | Why it may be needed; evidence boundary                                                                                                                                                                           |
| ------------------------------------------------------------------------ | ----- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Income year; effective rule-set ID; calculation date                     | V/P   | Rates, thresholds and application dates differ: F01–F10. Persisting a version identifier is a proposed reproducibility measure.                                                                                   |
| Actual-year versus hypothetical annualised comparison                    | P     | A $100,000 annual rate is not evidence that $100,000 was earned in the selected year. Calendar, partial-year and projected calculations need separate approved definitions.                                       |
| Arrangement start/end; pay dates; earnings period; dates of changes      | V/P   | Payday SG and PAYG are date-sensitive; residency and insurance can change within a year: F01, F05, F07, F10.                                                                                                      |
| Package alternatives versus concurrently earned jobs/businesses          | P     | Proposed comparison grouping; prevents treating mutually exclusive offers as simultaneous income. Annual tax inputs need the full selected income scenario.                                                       |
| Tax residency category and effective periods                             | V     | Resident/nonresident/part-year and WHM rates differ: F01. Legal residency classification itself remains R.                                                                                                        |
| WHM visa/status, treaty circumstance, nationality where legally relevant | V/R   | WHM schedule exists; treaty exception determination is unresolved. These are conditional fields, not blanket collection requirements.                                                                             |
| Age/category and relevant birthday/year-end status                       | V/R   | Under-18 SG and offset rules are evidenced: F03/F07. SAPTO and other age-linked tests need fuller review. Full date of birth is not necessarily required.                                                         |
| Worker's arrangement and employer/hirer counterparty                     | V/C   | F07/F11 distinguish taxpayers and PSI/SG analysis. Initial own-contracting scope is sole trader; an employer/hirer may still be a company or other entity. A label alone does not establish legal classification. |
| Currency; conversion date/rate/source for foreign amounts                | V/P   | Overseas HELP provisions exist: F06. A generic conversion policy for all tax regimes is not yet verified.                                                                                                         |

## Earnings and personal income

Shared other-income tax inputs do not establish other cash receipts or spouse cash belonging to
the employee. Proposed counterfactual/attribution fields and output limits are in
[annual cash and tax attribution](annual-cash-and-tax-attribution.md). Incremental annual tax
attribution is approved; a whole-person cash summary remains optional and proposed.

| Candidate input/group                                                                                               | Class | Why it may be needed; evidence boundary                                                                                                                               |
| ------------------------------------------------------------------------------------------------------------------- | ----- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Base cash remuneration; amount unit; pay frequency                                                                  | V/P   | PAYG schedule and gross-cash representation: F10. Hourly/daily/weekly/annual conversion policy is proposed.                                                           |
| Original offer quote; separate cash remuneration and employer super amounts                                         | P     | Interpret known inclusions once. Perks are added at entered personal value; the quote does not create perk funding deductions or establish employer perk cost.        |
| Earnings component type; amount; date; ordinary-hours/QE/OTE classification                                         | V/P   | F07/F10 distinguish payment types. Classification needs evidence; no universal rule that every bonus/overtime/allowance has identical treatment.                      |
| Overtime, penalties, shift/casual loading, commissions, bonuses, allowances                                         | V/R   | Separate SG/payroll classifications can matter. Detailed per-component eligibility is not fully verified.                                                             |
| Guaranteed versus contingent income; guaranteed minimum; probability/scenario                                       | P     | Economic comparison policy, not tax rates. A probability-weighted amount is not automatically taxable income.                                                         |
| Arrears/backpay periods; return-to-work amounts; unused leave; ETP category; redundancy circumstances               | V/R   | Distinct PAYG schedules and standard-deduction definition: F02/F10. Complete annual taxation/caps remain R.                                                           |
| Other employment/business income in the same year                                                                   | V/P   | Annual taxable and repayment income are broader than one package: F01/F06/F11. App representation remains proposed.                                                   |
| Interest, dividends/franking, rent, capital gains/losses, pensions, foreign income, partnership/trust distributions | R     | Candidate categories needed to avoid assuming salary is the whole tax situation. Detailed assessment, offsets and 2026 CGT/property changes require further evidence. |
| Taxable income; statutory assessable labour income; net labour income                                               | V/P   | Distinct definitions for F01–F03. Proposed calculated outputs or explicitly sourced manual inputs, not interchangeable values.                                        |
| Net investment loss components                                                                                      | V     | Added back in specific HELP/MLS definitions: F05/F06. Exact underlying classification remains to be validated.                                                        |
| Defined exempt foreign income; FHSS assessable released amount                                                      | V     | Special treatment in F05/F06; do not apply one generic adjusted-income formula to every regime.                                                                       |
| Other assessable adjustments and losses, with legal category/year                                                   | R     | Generic amounts cannot safely substitute for verified tax treatments.                                                                                                 |

## Deductions and job costs

| Candidate input/group                                                                                                       | Class | Why it may be needed; evidence boundary                                                                                                                                      |
| --------------------------------------------------------------------------------------------------------------------------- | ----- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Expense category; amount paid; payer; reimbursement; private/work allocation; timing; evidence                              | V/P   | F02 verifies general eligibility and no double deduction. These field shapes are proposed.                                                                                   |
| Statutory standard-deduction eligibility and specified deductions                                                           | V     | F02 formula requires separate categories; not a flat extra $1,000 for every worker.                                                                                          |
| Insurance premium type and association membership deductions                                                                | V     | Specific F02 exceptions to the standard-deduction reduction. Actual deduction eligibility still needs validation.                                                            |
| Self-education, clothing/tools, licences, professional fees, donations, tax-agent expenses                                  | R     | Candidate costs; each deduction requires category-specific verification. No automatic claim from a job-cost entry.                                                           |
| Car ownership/lease arrangement; work kilometres; total kilometres; logbook; vehicle costs; reimbursement                   | R/P   | Candidate inputs; F13 verifies the 2026–27 rate. Full method and trip eligibility remain unresolved; no 2027–28 rate verified.                                               |
| Trip purpose; home/usual/alternate workplace; journey legs; employer requirement; bulky equipment facts                     | R/P   | Relevant investigation fields for transport exceptions; not evidence that a commute is deductible.                                                                           |
| WFH hours; incremental expenses; shared/private use; assets; reimbursement; records; method/year                            | R/P   | Current administrative rates and required records remain unverified: F12.                                                                                                    |
| Economic commuting/WFH expense and separately substantiated deductible amount                                               | P     | Proposed explicit separation. A cost can reduce economic package value while its tax deduction remains zero or unknown.                                                      |
| Travel time; each offer's salary-derived gross and after-tax cash hourly rates; one-way/return definition; workday calendar | C/P   | Optional valuation starts enabled; custom rates were removed. No tax deduction follows from valuing time. Detailed accounting/annualisation definitions remain under review. |

## Medicare, offsets and family dependencies

The [23 October Medicare supplement](medicare-and-mls-evidence.md) refines these dependencies.
Keep ordinary-levy child qualification separate from MLS dependency; keep taxable income,
MLS tier income and MLS charge bases separate for each person. Stable full-year household
examples do not establish relationship-change or exemption branches.

| Candidate input/group                                                                | Class | Why it may be needed; evidence boundary                                                                                                 |
| ------------------------------------------------------------------------------------ | ----- | --------------------------------------------------------------------------------------------------------------------------------------- |
| Medicare exemption category; full/half exemption; applicable days; evidence          | V/R   | F04 contains prescribed-person/day rules; complete qualifying categories remain unresolved.                                             |
| Spouse/partner periods; relevant year-end relationship; death/separation changes     | V     | F04/F05 depend on relationship definitions and timing.                                                                                  |
| Spouse taxable income and separately defined surcharge income                        | V     | Levy family reduction and MLS use different bases: F04/F05.                                                                             |
| Dependant count, age/student category, maintenance/care periods                      | V/R   | F05 family thresholds/cover; detailed family levy eligibility remains R.                                                                |
| Qualifying hospital cover for each relevant person; covered days; suspension; excess | V     | F05. A single private-insurance checkbox is insufficient.                                                                               |
| SAPTO entitlement and applicable income/status category                              | V/R   | F04 has different low-income thresholds; complete entitlement calculation remains R.                                                    |
| LITO eligibility; relevant minor-income classification                               | V     | F03; automatic assumption from salary alone is unsafe for all supported employment types.                                               |
| Private health rebate, foreign tax offsets, small-business offset, other offsets     | R     | Candidate extensions; no full eligibility/rate corpus established.                                                                      |
| Household benefits, child support and other adjusted-income regimes                  | R/P   | Parent research covers Services Australia dependencies. These must not reuse HELP or MLS income definitions without separate authority. |

## Study loans

| Candidate input/group                                                                                      | Class | Why it may be needed; evidence boundary                                                                                                                      |
| ---------------------------------------------------------------------------------------------------------- | ----- | ------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Loan scheme(s), relevant debt balance/date and statutory repayable amount                                  | V/R   | HELP debt limit/date requirements: F06. Other schemes, repayment priority and indexation remain R.                                                           |
| Reportable employer super, deductible personal super and reportable-benefit amounts                        | V/R   | Reportable totals affect F06; exact reportable-super composition needs category verification.                                                                |
| Defined repayment-income components and Medicare-family reduction eligibility                              | V     | F06. Ordinary taxable income alone cannot determine liability.                                                                                               |
| Overseas debtor status/worldwide income; foreign currency and deductions                                   | V/R   | Separate F06 regime exists; detailed method remains R.                                                                                                       |
| Teacher/health-practitioner qualification and registration; service location/dates; qualifying course/debt | V/R/P | T12 Divisions 142/144 identify location-sensitive loan measures. Proposed conditional fields; complete guidelines, eligibility and amounts require research. |
| PAYG loan withholding, voluntary repayments, assessment payments and dates                                 | V/P   | Separate cash-flow/debt concepts: F06/F10. Proposed ledger must not deduct the same repayment twice.                                                         |

## Superannuation and benefits

**Confirmed perks scope:** add entered personal value only. Do not calculate perk funding,
salary deductions, employee contributions or packaging fees. The statutory tax-profile
dependencies below are separate: personal value neither establishes taxable/reportable value
nor proves tax-free treatment. Detailed packaging remains research-only.

| Candidate input/group                                                                                  | Class | Why it may be needed; evidence boundary                                                                                                              |
| ------------------------------------------------------------------------------------------------------ | ----- | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| SG eligibility; labour-contract counterparty; under-18 weekly hours; exclusions                        | V/R   | F07; exemptions beyond verified cases require research.                                                                                              |
| Norfolk Island residence/work/payment circumstances and dates                                          | V/R/P | T16 Schedule 1 item 189 identifies a 2026–27 transition. Proposed conditional fields; full treatment is unresolved.                                  |
| Qualifying earnings by payday; annual employer-specific base already used                              | V/P   | F07 post-July-2026 rules. Proposed aggregation must distinguish employers.                                                                           |
| Employer statutory super and additional contractual super                                              | P     | Proposed separate amounts preserve employer obligation versus negotiated benefit. Contractual contributions need their own documented basis.         |
| Salary-sacrificed super; personal deductible contribution; after-tax contribution; receipt date        | V/R   | F02/F06/F07/F08 interactions. Valid sacrifice/deduction and receipt-year rules are not fully verified.                                               |
| Contributions across all employers/funds; unused caps by year; prior-year total super balance          | V     | F08 carry-forward and personal cap, distinct from each employer's SG base.                                                                           |
| Defined-benefit interest/notional contributions; untaxed scheme; public-sector conditions              | V/R   | Modifications identified in F08; full computation unresolved.                                                                                        |
| Division 293 income components, low-tax contributions and payment source                               | V/P   | F08; whether a tax liability is paid from cash or released from super is a separate proposed cash-flow setting.                                      |
| Super fees/insurance/investment growth, preservation and access                                        | R/P   | Economic value extensions, not established by employer contribution amount alone.                                                                    |
| Perk description; entered personal value and amount unit                                               | C     | Simple economic addition, counted once. No employer-cost or funding/contribution calculation is required.                                            |
| Employer FBT category; exemption/concession; FBT year; benefit provision date                          | V/R   | Separate statutory tax-profile research under F09; exact caps and valuation regimes need evidence. These are not economic perk-funding inputs.       |
| Taxable benefit value; reporting inclusion; reportable amount; employer/FBT year                       | V/P   | Separately evidenced statutory tax inputs under F09. Exempt does not necessarily mean unreportable; personal perk value cannot supply these amounts. |
| Novated lease/vehicle facts, EV eligibility, commitment dates, operating costs, residual/liability     | R     | Research-only packaging/tax classification; no verified engine or approved perk-funding behavior.                                                    |
| ESS grant/acquisition/vesting/disposal dates; instrument, cost/discount, scheme class, foreign service | V/R   | F10 establishes timing distinctions; concessions, deferred taxing points and later CGT need verification.                                            |

## Contractor/entity and payroll branches

The [bounded sole trader supplement](sole-trader-component-boundaries.md) specifies proposed
annual inputs/outputs after evidenced GST, PSI/PSB and SG classification. It separates invoice
cash, revenue, current deductions, economic costs, personal contributions and eligible small
business offset income. BAS/PAYG cash timing remains an initial sole-trader dependency under R12c.
Own company/trust/partnership contracting and extraction models under R12d are deferred research,
not initial-release blockers. Relevant personal income from entities retains its separate tax
classification; it is not excluded or automatically verified by the contracting decision.

| Candidate input/group                                                                         | Class | Why it may be needed; evidence boundary                                                                                                                                                                                                      |
| --------------------------------------------------------------------------------------------- | ----- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Invoice rate; GST inclusive/exclusive; turnover; GST registration/exception                   | V/P   | F11; GST collected is not proposed as remuneration. Detailed GST credits/timing remains R.                                                                                                                                                   |
| Business expenses, billable capacity, unpaid downtime/leave, insurance and administration     | P     | Parent's economic inventory covers these. Tax deductibility is a separate question.                                                                                                                                                          |
| PSI/PSB status and supporting contract/customer facts                                         | V/R   | F11; full results, unrelated-client, employment and premises tests remain unresolved.                                                                                                                                                        |
| Entity earnings versus salary/director fee/dividend/distribution; retained amount             | V/R   | F11 separates taxpayers. Own-entity contracting/extraction models are deferred; independently received wages/fees/distributions may still require shared personal tax inputs. Their detailed treatment is not validated by the scope choice. |
| PAYG instalments versus employee withholding                                                  | R/P   | Separate proposed payment channels; instalment mechanics need research.                                                                                                                                                                      |
| Payroll period; current pay; year-to-date pay; applicable schedule; pay dates                 | V     | F10; annualised net estimates cannot prove a specific payslip.                                                                                                                                                                               |
| Tax-free-threshold declaration; TFN declaration status; loan declaration; variations; offsets | V/R   | F10 schedules distinguish declaration cases. Store status only if needed; no TFN number is required for comparison research.                                                                                                                 |
| Additional withholding; deductions after tax; garnishments; payroll rounding                  | V/P   | Withholding and spendable cash need distinct inputs; specific treatment must be supported.                                                                                                                                                   |

## Proposed outputs and data quality

Proposed separate outputs: gross cash, noncash benefit value, employer super, gross package value, taxable income, statutory income-test bases, basic tax, each offset/levy/loan liability, annual net cash, payroll net cash, reconciliation difference, super received, economic costs, optional time value and final economic comparison.

Every entered or derived amount could carry unit, period, inclusive/exclusive flags, source, evidence date, effective dates, certainty, user override reason and rule version. These are proposals for review, not approved defaults. Sensitive identifiers, tax-file numbers, bank details and exact addresses are not needed for this research inventory.

# Tax equation popup catalogue

Code reviewed 24 October 2026; primary-source checks at **2026-10-24 07:12:09 UTC**.
This catalogue describes the **current implementation**, including its unavailable branches.
It does not certify a final assessment or change any calculation. Amounts are AUD unless labelled
as hours, days, percentages or rates. Presentation uses the existing engine result, never a second
calculation made from displayed rounded values.

## Binding and precision contract

Source: [tax-breakdown.svelte](../../src/lib/components/tax-breakdown.svelte),
[tax types](../../src/lib/calculations/tax/types.d.ts),
[common.ts](../../src/lib/calculations/tax/common.ts), [format.ts](../../src/lib/format.ts).
- Each annual popup identifies `with_offer` or `without_offer`, selected financial year and the
  effective profile/offer inputs. The without-offer scenario is **not** the selected comparison
  baseline offer. Shared other income and spouse facts remain in that scenario.
- A `TaxAmount` supplies either its amount/basis/sources or its unavailable code/reason/sources.
  Preserve `missing-input`, `invalid-input`, `unsupported-regime` and `unverified-rule`. None means
  zero. An unavailable popup can show the symbolic equation plus the actual blocker.
- `round_to_cent(x) = Math.round(100 × x) / 100`; `round_to_dollar(x) = floor(x + 0.5)` for the
  non-negative amounts used here. `floor` means round downward. Do not insert either into raw
  annual formulas unless specified below.
- Input money must be finite, non-negative and at most $1 billion per checked input. Core annual
  taxable income, spouse income, MLS add-backs, child/day counts and HELP repayment income require
  whole integers. HELP debt and explicit payroll deductions permit whole cents, checked with a
  `0.000001` tolerance on their cent representation. Raw income/deduction construction accepts
  sub-cent values; its displayed result is not its precision contract.
- Currency display is `Intl.NumberFormat("en-AU")` with two fraction digits. Other numbers display
  at most two. This is presentation rounding. For example, a raw LITO of $324.985 is retained by
  the engine even when the cell shows two decimals.

## Annual rows: exact label and result mapping

`scenario` below means either `result.tax.withOffer` or `result.tax.withoutOffer`.

| Displayed label                           | Result key                                             | Equation block                       |
| ----------------------------------------- | ------------------------------------------------------ | ------------------------------------ |
| Basic income tax                          | `scenario.annual.basicIncomeTax`                       | A02                                  |
| Low income tax offset                     | `scenario.annual.lito`                                 | A03; this is the **applied** offset  |
| Income tax after LITO                     | `scenario.annual.incomeTaxAfterLito`                   | A03                                  |
| Medicare levy                             | `scenario.annual.medicare`                             | A04                                  |
| Medicare levy surcharge                   | `scenario.annual.mls`                                  | A05                                  |
| HELP repayment                            | `scenario.annual.help`                                 | A06                                  |
| Personal annual component subtotal        | `scenario.annual.rawComponentSubtotal`                 | A07                                  |
| Final assessed tax                        | `scenario.annual.finalAssessment`                      | A07; always unavailable              |
| Employee standard deduction               | `scenario.standardDeduction`                           | A01                                  |
| Derived taxable income                    | `scenario.derivedTaxableIncome`                        | A01; raw derived amount              |
| Taxable income used for estimate          | `scenario.taxableInput`                                | A01; override or estimate conversion |
| Incremental annual tax component estimate | `result.tax.incrementalTax` / comparison `assignedTax` | A07; signed difference               |

### A01 — Income, deductions and taxable input

Source: [comparison.ts:43](../../src/lib/calculations/comparison.ts:43),
[profile.ts:96](../../src/lib/calculations/tax/profile.ts:96),
[profile-inputs.ts:51](../../src/lib/calculations/tax/profile-inputs.ts:51),
[deduction.ts](../../src/lib/calculations/tax/deduction.ts). Statutory context: [P02].

```text
assessable_income = shared_other_income + offer_assessable_income
established_deductions = shared_other_deductions + offer_deductions
assessable_labour_income = shared_other_labour_income + offer_labour_income
specified_work_deductions = shared_other_specified_deductions + offer_specified_deductions

standard_deduction = 0                                  [2025–26, or eligibility = no]
standard_deduction = max(0, min(1000, assessable_labour_income)
                           - specified_work_deductions) [2026–27, eligibility = yes]

derived_taxable_income = max(0, assessable_income
                               - established_deductions - standard_deduction)
taxable_income = established_scenario_override            [when entered and valid]
taxable_income = floor(round_to_cent(derived_taxable_income)) [otherwise]
```

The last line is sal's disclosed estimate convention, **not verified final ATO precision**.
The override is `taxableWithOffer` or `taxableWithoutOffer`; a blank override uses the derivation.
A valid override can establish annual taxable input even if the separate derivation is unavailable.
Its popup must show that override, not pretend it came from the derived formula.

Inputs bind as follows:

| Equation variable                                         | Current field / calculation                                   |
| --------------------------------------------------------- | ------------------------------------------------------------- |
| `shared_other_income`                                     | profile `otherIncome`                                         |
| `shared_other_deductions`                                 | profile `deductions`                                          |
| `shared_other_labour_income`                              | profile `otherLabourIncome`                                   |
| `shared_other_specified_deductions`                       | profile `otherSpecifiedDeductions`                            |
| Employee `offer_assessable_income`, `offer_labour_income` | cash excluding employer super, less annual valid `sacrifice`  |
| Employee `offer_deductions`, `offer_specified_deductions` | effective profile `workDeductions`, `specifiedWorkDeductions` |
| Sole-trader `offer_assessable_income`                     | revenue excluding GST, before cash business costs             |
| Sole-trader deduction/labour/specified subset             | `businessDeductions`, `eligibleLabour`, `specifiedDeductions` |

All offer-specific amounts above, plus offer reportable super/benefits, become zero without the offer; shared amounts
remain. Recompute the standard deduction in each scenario. Labour cannot exceed assessable income;
specified deductions cannot exceed total deductions. In 2026–27 these missing/invalid subsets block
an eligible standard deduction. Unknown eligibility blocks that branch. The 2025–26 zero does not
require labour/subset inputs. Sole-trader deductions exceeding revenue, or selected non-ordinary
earnings, make the offer's assessable amount unavailable. Personal non-deducted super, economic job
costs, travel-time values and personal perk values do not enter this taxable-income equation.

### A02 — Basic income tax

Source: [income.ts:28](../../src/lib/calculations/tax/income.ts:28); primary [P01].
Requires ordinary full-year resident adult treatment and valid whole-dollar `taxable_income`.

```text
first_rate = 0.16 [2025–26] or 0.15 [2026–27]
basic_income_tax =
    first_rate × min(max(taxable_income - 18200, 0), 26800)
  + 0.30 × min(max(taxable_income - 45000, 0), 90000)
  + 0.37 × min(max(taxable_income - 135000, 0), 55000)
  + 0.45 × max(taxable_income - 190000, 0)
```

These are marginal bands. A payer's threshold declaration does not change this annual formula.
No additional rounding is applied to the raw component.

### A03 — Applied low-income offset and income tax after offset

Source: [income.ts:40](../../src/lib/calculations/tax/income.ts:40),
[tax.ts:9](../../src/lib/calculations/tax.ts:9). Research context: [annual component boundaries].

```text
raw_lito = 700                                  [taxable_income <= 37500]
raw_lito = 700 - 0.05 × (taxable_income - 37500)  [37500 < taxable_income <= 45000]
raw_lito = 325 - 0.015 × (taxable_income - 45000) [45000 < taxable_income < 66667]
raw_lito = 0                                    [taxable_income > 66667]
applied_lito = min(basic_income_tax, raw_lito)
income_tax_after_lito = basic_income_tax - applied_lito
```

At exactly `taxable_income = 66667`, applied LITO and income tax after LITO are **unavailable**:
`R02b: LITO at AUD 66,667 is unresolved.` Basic tax remains available. The code calculates the
offset in thousandths of a dollar before division by 1,000; there is no intermediate cent clamp.
The offset cannot make this income-tax component negative and is not subtracted from Medicare.
The current code's [T03 source URL][P03] was inaccessible in this review; no new legal resolution
of its recorded endpoint/precision gap is claimed.

### A04 — Ordinary Medicare levy

Source: [medicare.ts](../../src/lib/calculations/tax/medicare.ts),
[profile-family.ts:28](../../src/lib/calculations/tax/profile-family.ts:28).
Primary context [P04]; detailed derivation [Medicare boundaries]. Both selected years currently
use the following constants; no intermediate rounding occurs.

```text
own_initial_levy = min(0.02 × taxable_income, 0.10 × max(0, taxable_income - 28011))
medicare_levy = own_initial_levy                 [single, no family-reduction branch]

family_income = taxable_income + spouse_taxable_income
family_threshold = 47238 + 4338 × levy_qualifying_children
spouse_initial_levy = min(0.02 × spouse_taxable_income,
                         0.10 × max(0, spouse_taxable_income - 28011))
family_reduction = max(0, 0.10 × family_threshold - 0.08 × family_income)

medicare_levy = 0                               [family_income <= family_threshold]
medicare_levy = max(0, own_initial_levy - family_reduction)
    [family_income > family_threshold; either initial levy is zero]

own_reduction_share = family_reduction × taxable_income / family_income
spouse_reduction_share = family_reduction × spouse_taxable_income / family_income
medicare_levy = max(0, own_initial_levy - own_reduction_share
                      - max(0, spouse_reduction_share - spouse_initial_levy))
    [family_income > family_threshold; both initial levies are positive]
```

Family formulas require the supported full-year-spouse branch, `spouseTaxableIncome` and
`levyChildren`. Single-with-dependants uses the individual branch only when `levyFamilyRelief=no`;
unknown relief is missing input and `yes` is currently unsupported. Exempt, SAPTO/special or
changing-household cases are not represented by a zero. Do not replace this phase-in expression
with an independently rounded upper-threshold table or divide by zero at zero family income.

### A05 — Medicare levy surcharge

Source: [mls.ts](../../src/lib/calculations/tax/mls.ts),
[profile-family.ts:64](../../src/lib/calculations/tax/profile-family.ts:64).
Primary context [P04], [P05], [P06].

```text
reportable_benefits = shared_reportable_benefits + offer_reportable_benefits
reportable_super = shared_reportable_super + offer_reportable_super
own_mls_test_income = taxable_income + reportable_benefits
                     + reportable_super + net_investment_loss
mls_charge_base = taxable_income + reportable_benefits

test_income = own_mls_test_income                         [single or single with dependants]
test_income = own_mls_test_income + spouse_mls_income     [full-year spouse]
threshold_multiplier = 1 [single] or 2 [either supported family branch]
child_uplift = 0 [single] or 1500 × max(0, mls_qualifying_children - 1)
effective_threshold = single_threshold × threshold_multiplier + child_uplift
```

| Financial year | First single threshold | Second |  Third |
| -------------- | ---------------------: | -----: | -----: |
| 2025–26        |                 101000 | 118000 | 158000 |
| 2026–27        |                 105000 | 123000 | 164000 |

```text
mls_rate = 0       [test_income <= first_effective_threshold]
mls_rate = 0.01    [first < test_income <= second_effective_threshold]
mls_rate = 0.0125  [second < test_income <= third_effective_threshold]
mls_rate = 0.015   [test_income > third_effective_threshold]
mls_rate = 0       [full-year spouse AND own_mls_test_income <= 28011]
medicare_levy_surcharge = mls_charge_base × mls_rate × liable_days / 365
```

`hospitalCover=yes` forces `liable_days=0`; otherwise the entered `mlsLiableDays` is used.
Shared reportable amounts bind to profile `reportableBenefits` and `reportableSuper`; offer amounts
bind to `reportableBenefitsOffer` and `reportableSuperOffer`. `net_investment_loss` is
`investmentLoss`; spouse income is `spouseMlsIncome`; the family count is `mlsChildren`.
Days must be an established integer from 0 to 365. Family counts and spouse MLS income are separate
from levy inputs. Even zero liable days do not bypass the implementation's eligibility, income and
household validation. No intermediate rounding; reportable super/losses select the tier but are
not added to the charge base. Unsupported household/eligibility is unavailable, not zero.

### A06 — HELP annual component

Source: [help.ts](../../src/lib/calculations/tax/help.ts),
[profile.ts:142](../../src/lib/calculations/tax/profile.ts:142),
[profile-family.ts:85](../../src/lib/calculations/tax/profile-family.ts:85).
Primary [P07], [P08]; existing conflict record [HELP evidence].

```text
repayment_income = taxable_income + reportable_benefits + reportable_super
                   + net_investment_loss + exempt_foreign_employment_income
```

| Financial year | `lower_threshold` | `upper_threshold` |
| -------------- | ----------------: | ----------------: |
| 2025–26        |             67000 |            125000 |
| 2026–27        |             69528 |            129717 |

```text
raw_help = 0.15 × max(0, min(repayment_income, upper_threshold) - lower_threshold)
           + 0.17 × max(0, repayment_income - upper_threshold)
help_repayment = min(raw_help, 0.10 × repayment_income, established_repayable_debt)
help_repayment = 0 [studyLoan=no, or established section_8_family_exemption=yes]
```

No separate rounded $9,028 constant is used: the 2026–27 first-band total is
`0.15 × (129717 - 69528) = 9028.35`. This is raw statutory arithmetic, not resolution of the
recorded ATO-guide/final-precision discrepancy. Annual `other-or-multiple` schemes are unsupported.
Unknown scheme/eligibility/family exception/debt/income blocks the relevant branch. The foreign-income
add-back is profile `foreignIncome`; the other add-backs are those defined in A05. `loanDebt`
is established repayable debt, not automatically the displayed current balance. `helpFamilyOffer`
and `helpFamilyBase` are separate; single/no-dependants forces the exception to false. No-loan and
family-exempt branches return zero before income/debt validation. The ordinary-resident-adult gate
still applies. FHSS and other unmodelled assessment items are outside the declared ordinary scope.

### A07 — Subtotal, offer attribution and final assessment

Source: [tax.ts:29](../../src/lib/calculations/tax.ts:29),
[profile.ts:177](../../src/lib/calculations/tax/profile.ts:177),
[reporting.ts](../../src/lib/calculations/tax/reporting.ts).

```text
annual_component_subtotal = income_tax_after_lito + medicare_levy
                            + medicare_levy_surcharge + help_repayment
incremental_offer_tax = with_offer_annual_component_subtotal
                        - without_offer_annual_component_subtotal
```

The subtotal requires each component and `assessmentComplete=yes`; the latter contributes zero
arithmetically but is an eligibility gate. The signed difference is not clamped to zero.
Final assessed tax is always unavailable because final precision/assessment composition is not
verified. No popup may equate a raw subtotal with final assessed liability or a bank receipt.

If an employee's sacrifice is confirmed reportable in the same year but `reportableSuperOffer`
is smaller than `sacrifice`, the reporting guard replaces with-offer HELP, MLS, subtotal and
incremental tax with the inconsistency reason. Basic tax/LITO/levy and without-offer components
remain independently visible. An invalid derived/override taxable input similarly replaces its
income-tax/levy/MLS/subtotal results; independent HELP/no-loan zero may survive.

## Representative payroll

Source: [payroll.ts](../../src/lib/calculations/tax/payroll.ts),
[payg.ts](../../src/lib/calculations/tax/payg.ts),
[payg-tables.ts](../../src/lib/calculations/tax/payg-tables.ts).

### P01 — Period cash inputs and rendered labels

| Period      | `representative_period_count` | PAYG weekly divisor/conversion |
| ----------- | ----------------------------: | ------------------------------ |
| weekly      |                            52 | unchanged                      |
| fortnightly |                            26 | divide by 2                    |
| monthly     |                            12 | adjusted earnings × 3 / 13     |
| quarterly   |                             4 | divide by 13                   |

The representative period count is a sal annual-to-period convention, not a forecast of deposit
counts. Quarterly is not four-weekly. Bonuses/commissions/one-offs do not enter representative base
pay. Eligible earnings classification and the base-cash split are described in R01 below.

| Displayed label / result key                                   | Self-contained equation                                                                              |
| -------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------- |
| Gross base cash per period / `payroll.grossBaseCash`           | `period_gross_cash = round_to_cent(annual_base_cash / representative_period_count)`                  |
| Salary sacrifice to super / `payroll.salarySacrifice`          | `period_salary_sacrifice = entered_period_sacrifice`                                                 |
| Cash subject to payroll withholding / `payroll.taxablePay`     | `period_taxable_pay = (round(100 × period_gross_cash) - round(100 × period_salary_sacrifice)) / 100` |
| Personal super deducted after tax / `payroll.personalSuper`    | `period_personal_super = entered_period_personal_super`                                              |
| Other payroll deductions after tax / `payroll.otherDeductions` | `period_other_deductions = entered_period_other_deductions`                                          |

If absent in standard mode, period sacrifice may be derived as
`round_to_cent(annual_salary_sacrifice / representative_period_count)`; an existing blank/value
is preserved by that helper. Personal-super period deductions are never derived from annual
personal-super contributions. These are values from the effective payer fields, not necessarily
directly stored offer fields. Salary sacrifice affects PAYG; post-tax deductions do not. [P12]

Gross conversion requires supported frequency, equal ordinary base pay and known valid annual base
cash; sole-trader fees are unsupported. Each deduction must be known, non-negative whole cents.
Salary sacrifice exceeding period gross makes taxable pay unavailable. Unknown post-tax deductions
block bank cash, while independently known withholding remains visible.

### P02 — Rule-period and table selection

- `2025-july`: 1 July–23 September 2025. Ordinary O25C / O25N; combined E25C. The no-threshold loan table is unavailable. [P09]
- `2025-september`: 24 September 2025–30 June 2026. Ordinary O25C / O25N; combined C25C / C25N. [P10]
- `2026-july`: 1 July 2026–30 June 2027 in the selected-year UI. Ordinary O26C / O26N; combined C26C / C26N. [P11]

`C` means threshold claimed; `N` means not claimed. These are payer choices, separate from annual
tax bands. Withholding requires ordinary resident employee payroll, supplied TFN and no special
adjustments. False is unsupported, null is missing. Actual TFN digits are not used. Missing threshold
blocks ordinary withholding. Missing loan declaration blocks combined/loan results but preserves
ordinary withholding. `studyLoan=no` sets combined equal to ordinary, so loan increment is zero.
Annual HELP debt/eligibility does not set payroll withholding or cap it at the debt balance.

### P03 — Exact coefficient calculation

The following block applies separately to the selected ordinary and combined tables. It explains
the existing formula implementation, not annual tax divided by periods. [P09]–[P11]

```text
pay_cents = round(100 × period_taxable_pay)
adjusted_monthly_pay_cents = pay_cents + 1 [if monthly AND pay_cents mod 100 = 33]
adjusted_monthly_pay_cents = pay_cents     [otherwise]

weekly_whole_dollars = floor(pay_cents / 100)                  [weekly]
weekly_whole_dollars = floor(pay_cents / 200)                  [fortnightly]
weekly_whole_dollars = floor(3 × adjusted_monthly_pay_cents / 1300) [monthly]
weekly_whole_dollars = floor(pay_cents / 1300)                 [quarterly]
weekly_formula_earnings = weekly_whole_dollars + 0.99

weekly_raw_withholding = coefficient_a × weekly_formula_earnings - coefficient_b
weekly_withholding = floor(weekly_raw_withholding + 0.5)
period_withholding = weekly_withholding                      [weekly]
period_withholding = 2 × weekly_withholding                  [fortnightly]
period_withholding = floor(13 × weekly_withholding / 3 + 0.5) [monthly]
period_withholding = 13 × weekly_withholding                 [quarterly]
```

Choose the **first** table row for which `weekly_formula_earnings < upper_bound`; otherwise use
the top row. At a bound use the next row. Display the selected table, interval, `coefficient_a`
and `coefficient_b`, including a negative `b` where present. The implementation represents `a`
and `b` at scale 10,000 and earnings in cents, then rounds the resulting millionths directly to
whole dollars. There is **no preliminary cent rounding of weekly_raw_withholding**.

### P04 — Per-rule results and cash destinations

For each `payroll.rulePeriods[]` entry:

| Displayed label / result key                                                | Equation                                                                                                                                         |
| --------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| Ordinary PAYG withholding / `withholding.ordinary`                          | P03 using selected ordinary table                                                                                                                |
| Combined PAYG withholding / `withholding.combined`                          | P03 using selected combined table when loan declared; otherwise ordinary withholding                                                             |
| Study-loan withholding increment / `withholding.loanIncrement`              | `loan_withholding_increment = combined_payg - ordinary_payg`                                                                                     |
| Cash after withholding, before post-tax deductions / `cashAfterWithholding` | `cash_after_withholding = (round(100 × period_taxable_pay) - round(100 × combined_payg)) / 100`                                                  |
| Estimated bank deposit after deductions / `bankEstimate`                    | `period_bank_estimate = (round(100 × cash_after_withholding) - round(100 × period_personal_super) - round(100 × period_other_deductions)) / 100` |

Loan increment is the difference of two already-calculated period withholding results. It is not
a separately rounded standalone Schedule 8 amount, final HELP liability or immediate debt credit.
If required withholding/outflows are unknown, retain their reason. Negative remaining cash is an
invalid-input result, not a negative bank estimate. Ordinary withholding already incorporates its
applicable levy treatment; do not add annual Medicare again.

### P05 — Every payroll hourly row

Source: [payroll-hourly.ts](../../src/lib/calculations/tax/payroll-hourly.ts).

```text
annual_standard_paid_hours = weekly_paid_hours × conversion_weeks
allocated_period_paid_hours = annual_standard_paid_hours / representative_period_count
hourly_amount = matching_period_amount / allocated_period_paid_hours
```

`hourly.allocatedPeriodHours` is the rendered “Allocated standard paid hours in this period”.
All following keys preserve P01/P04's value and divide by that same denominator, with **no extra
calculation rounding**:

| Hourly displayed label                     | Matching period key                       |
| ------------------------------------------ | ----------------------------------------- |
| Gross cash per hour                        | `grossBaseCash`                           |
| Salary sacrifice to super per hour         | `salarySacrifice`                         |
| Cash subject to withholding per hour       | `taxablePay`                              |
| Personal super deducted after tax per hour | `personalSuper`                           |
| Other payroll deductions per hour          | `otherDeductions`                         |
| Ordinary PAYG per hour                     | `rulePeriods[].withholding.ordinary`      |
| Study-loan withholding increment per hour  | `rulePeriods[].withholding.loanIncrement` |
| Combined PAYG per hour                     | `rulePeriods[].withholding.combined`      |
| Cash after withholding per hour            | `rulePeriods[].cashAfterWithholding`      |
| Estimated bank deposit per hour            | `rulePeriods[].bankEstimate`              |

Missing frequency/hours/weeks means missing input; non-positive or non-finite hours mean invalid
input. Preserve an existing amount's unavailable reason before applying a denominator error.
These rates use allocated paid hours, not actual calendar work, attendance or commute hours.

## R01 — Upstream cash/super and tax-linked comparison amounts

Source: [remuneration.ts](../../src/lib/calculations/remuneration.ts),
[comparison.ts:76](../../src/lib/calculations/comparison.ts:76). These are model equations,
with statutory inputs separately established; [fresh defaults audit] records their limits.

```text
annual_base_quote = entered_annual_amount                         [annual quote]
annual_base_quote = entered_rate × entered_annual_paid_units      [hour/day quote]
super_fraction = entered_super_percent / 100 [eligible] or 0 [ineligible]
cash_component = quoted_component / (1 + super_fraction)          [includes super]
cash_component = quoted_component                                [excludes super]
employer_super_component = cash_component × super_fraction
gross_component = cash_component + employer_super_component
```

Inclusive gross retains the original quote exactly. Unknown inclusion/eligibility/rate blocks the
dependent split but can preserve known inclusive gross or exclusive cash. Active bonus components
use their own inclusion/eligibility and the offer rate. Already-in-base rows are not added again;
excluded target/one-off rows are not recurring guaranteed pay. A row both included in base and
excluded by the selected scenario makes the split unavailable.

```text
eligible_base_limit = 270830                           [2026–27]
eligible_base_limit = 4 × 62500                        [2025–26, even quarters established]
statutory_capped_employer_super = 0.12 × eligible_base_limit
cash = total_inclusive_quote - statutory_capped_employer_super [consistent inclusive quotes]
gross = total_exclusive_cash + statutory_capped_employer_super [consistent exclusive quotes]
```

The cap is applied only above the eligible base limit with 12% and a consistent quote basis.
FY2025–26 without even allocation uses $62,500 as a **conservative single-quarter guard**, not an
annual earnings cap; exceeding it leaves the split unavailable. Higher/mixed cases need additional
evidence when a capped split is required; the uncapped amount remains supported below the applicable
guard. `superLimit=uncapped` uses the percentage on all entered eligible cash.
Missing limit preserves only independently known amounts. The 12% minimum guard is enforced for
statutory mode. Personal contribution caps are separate.

`annual_base_cash` for payroll is the base-only cash split. If an inclusive capped total also has
eligible bonus components, the current engine leaves the base allocation unknown. It does not
spread the cap across bonuses to invent a base payslip.

```text
sole_trader_revenue = entered_annual_revenue / 1.1 [GST-inclusive ordinary taxable quote]
sole_trader_revenue = entered_annual_revenue       [GST-exclusive or no GST]
contractor_gross = sole_trader_revenue + entered_hirer_super
```

Unknown GST basis blocks the revenue split. Employee earnings rows on a sole-trader offer are
unsupported. No GST or super eligibility is inferred from the business label.

| Comparison label / internal value                                   | Equation                                                                                                                                                                                                 |
| ------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Cash pay / revenue before deductions / `quote.cash`                 | Sum of selected employee cash components, or sole-trader revenue above                                                                                                                                   |
| Employer / hirer super / `quote.super`                              | Sum of selected employer amounts after the cap branch, or entered hirer super                                                                                                                            |
| Incremental annual tax component estimate / `assignedTax`           | A07                                                                                                                                                                                                      |
| Gross contributions to super / `superGross`                         | `employer_super + annual_salary_sacrifice + non_deducted_personal_super`                                                                                                                                 |
| Super contributions after ordinary fund tax / `superNet`            | `0.85 × (employer_super + annual_salary_sacrifice) + non_deducted_personal_super`                                                                                                                        |
| Ordinary tax on super contributions                                 | `superGross - superNet`                                                                                                                                                                                  |
| Annual cash after estimated tax and personal super / `assessedCash` | Employee: `quote_cash - annual_salary_sacrifice - non_deducted_personal_super - incremental_offer_tax`; sole trader: `revenue - business_cash_costs - contractor_personal_super - incremental_offer_tax` |
| Combined after-tax package estimate / `netPackage`                  | `assessedCash + superNet + personal_perk_value`                                                                                                                                                          |
| Tax per standard paid hour                                          | `incremental_offer_tax / annual_standard_paid_hours`                                                                                                                                                     |
| Net/gross super per standard paid hour                              | `superNet / annual_standard_paid_hours`; `superGross / annual_standard_paid_hours`                                                                                                                       |
| Fund contribution tax per standard paid hour                        | `(superGross - superNet) / annual_standard_paid_hours`                                                                                                                                                   |
| After-tax cash per standard paid hour                               | `assessedCash / annual_standard_paid_hours`                                                                                                                                                              |

Sole-trader salary sacrifice is zero in these model equations; personal super uses
`contractorPersonalSuper`. Net super requires `ordinaryFund=yes`, whose documented ordinary taxed
fund/cap/adjustment exclusions still apply: supplied TFN and matching-year conditions; no excess-cap,
Division 293, fund-release, LISTO, co-contribution or special-fund adjustments. The estimate excludes
fees, insurance and investment returns. No assumed account growth or unknown fund tax of zero.
Annual `assessedCash` does not subtract representative `periodOtherDeductions`; those are payroll
destinations, not inferred annual losses. Reimbursements offset entered job costs separately.

## Complete current PAYG coefficient catalogue

Source: [payg-tables.ts](../../src/lib/calculations/tax/payg-tables.ts). Entries below are
`upper_bound : (coefficient_a, coefficient_b)`; each bound is strict `<`; `top` is the remaining
range. The catalogue transcribes current source, not a claim of a new exhaustive statutory table
audit. Each popup needs only its selected table/interval and coefficients, plus P03.

```text
O25C — ordinary2025Claimed
361:(0,0); 500:(0.16,57.8462); 625:(0.26,107.8462); 721:(0.18,57.8462)
865:(0.189,64.3365); 1282:(0.3227,180.0385); 2596:(0.32,176.5769)
3653:(0.39,358.3077); top:(0.47,650.6154)

O26C — ordinary2026Claimed
362:(0,0); 538:(0.15,54.3462); 673:(0.25,108.2135); 721:(0.17,54.3473)
865:(0.179,60.8377); 1282:(0.3227,185.1935); 2596:(0.32,181.7319)
3653:(0.39,363.4627); top:(0.47,655.7704)

O25N — ordinary2025Unclaimed
150:(0.16,0.16); 371:(0.2117,7.755); 515:(0.189,-0.6702)
932:(0.3227,68.2367); 2246:(0.32,65.7202); 3303:(0.39,222.951)
top:(0.47,487.2587)

O26N — ordinary2026Unclaimed
188:(0.15,0.15); 371:(0.2084,11.0185); 515:(0.179,0.1066)
932:(0.3227,74.1674); 2246:(0.32,71.6508); 3303:(0.39,228.8816)
top:(0.47,493.1893)

E25C — combinedEarlyClaimed
361:(0,0); 500:(0.16,57.8462); 625:(0.26,107.8462); 721:(0.18,57.8462)
865:(0.189,64.3365); 1079:(0.3227,180.0385); 1246:(0.3327,180.0385)
1282:(0.3427,180.0385); 1321:(0.34,176.5769); 1401:(0.345,176.5769)
1485:(0.35,176.5769); 1574:(0.355,176.5769); 1668:(0.36,176.5769)
1768:(0.365,176.5769); 1874:(0.37,176.5769); 1987:(0.375,176.5769)
2106:(0.38,176.5769); 2233:(0.385,176.5769); 2366:(0.39,176.5769)
2508:(0.395,176.5769); 2596:(0.4,176.5769); 2659:(0.47,358.3077)
2819:(0.475,358.3077); 2988:(0.48,358.3077); 3167:(0.485,358.3077)
3653:(0.49,358.3077); top:(0.57,650.6154)

C25C — combined2025Claimed
361:(0,0); 500:(0.16,57.8462); 625:(0.26,107.8462); 721:(0.18,57.8462)
865:(0.189,64.3365); 1282:(0.3227,180.0385); 1288:(0.32,176.5769)
2403:(0.47,369.8462); 2596:(0.49,417.9231); 3447:(0.56,599.6538)
3653:(0.49,358.3077); top:(0.57,650.6154)

C26C — combined2026Claimed
362:(0,0); 538:(0.15,54.3462); 673:(0.25,108.2135); 721:(0.17,54.3473)
865:(0.179,60.8377); 1282:(0.3227,185.1935); 1337:(0.32,181.7319)
2494:(0.47,382.2935); 2596:(0.49,432.1846); 3577:(0.56,613.9154)
3653:(0.49,363.4627); top:(0.57,655.7704)

C25N — combined2025Unclaimed
150:(0.16,0.16); 371:(0.2117,7.755); 515:(0.189,-0.6702)
932:(0.3227,68.2367); 938:(0.32,65.7202); 2053:(0.47,206.4894)
2246:(0.49,247.5663); 2597:(0.56,404.7971); 3303:(0.49,222.951)
top:(0.57,487.2587)

C26N — combined2026Unclaimed
188:(0.15,0.15); 371:(0.2084,11.0185); 515:(0.179,0.1066)
932:(0.3227,74.1674); 987:(0.32,71.6508); 2144:(0.47,219.7124)
2246:(0.49,262.6035); 2727:(0.56,419.8343); 3303:(0.49,228.8816)
top:(0.57,493.1893)
```

## Evidence, inconsistencies and integration limits

- The primary HELP statute and 2026–27 indexed thresholds were body-read again in this review:
  [P07] ss 154-1/5/20/25 and [P08]. P03's withholding structure, direct whole-dollar rounding and
  monthly conversion were checked against the body of [P11]; [P10] also explicitly distinguishes
  combined formula withholding from separately rounded components. No complete new final-assessment
  fixture or coefficient-by-coefficient verification was performed.
- [Fresh defaults audit] contains separately retrieved primary bodies for the selected-year tax,
  SG, Medicare/MLS, GST and contribution limits. Older component notes supply context and disclose
  gaps; they are not independent evidence that the current implementation is correct.
- Current `TAX_RULE_VERSION` is `2026-10-23-components-2`. The old implementation-status note names
  `components-1`; use the running code's version. `TaxAmount` currently has no operand/branch trace.
  Formula presentation must bind to effective inherited/overridden/standard-prepared inputs and
  selected scenario, not presume that raw saved fields equal the values used.
- `tax.ts` returns only applied LITO; do not label it a full refundable entitlement. Its subtotal
  is a raw estimate. All final-assessment precision, LITO $66,667 and early no-threshold loan
  withholding limitations remain active; an equation popup must not hide them.
- The HELP guide discrepancy is still recorded in [HELP evidence]; the current code uses the
  statutory $9,028.35 base expression. It does not implement the guide's rounded $9,028 base.
- The source register exposed in the UI lacks `T24`, although sole-trader payroll's unavailable
  result cites that ID. Do not create a fabricated link. Existing result provenance is not a
  guarantee that every linked page is currently accessible; [P03] was inaccessible in this pass.
- The annual comparison does not model arbitrary annual other-payroll transfers or exact super-fund
  net credits. Representative payroll does not show employer SG per pay period. Do not invent those
  flows while explaining the rendered amounts. Personal perks remain additive only.
- The first review of `explanations/rules.ts` found its remuneration equations aligned with the
  engine. Its contractor-row wording needed to say that any employee earnings row makes contractor
  remuneration unavailable, rather than suggesting the rows are ignored. Its net-super description
  needed the complete ordinary-model exclusions above. These are presentation findings; this task
  did not edit that application file or verify its eventual corrected version.
- The initial `explanations/tax-rules.ts` review found matching arithmetic. Required wording fixes
  were explicit lower bounds for LITO, positive-family-income branches after the Medicare zero
  case, the supported single-with-dependants/no-family-relief branch, and the implemented
  `hospitalCover=yes` day override. The catalogue above contains those distinctions. Final popup
  integration must retain each active rule period, selected table and unavailable reason.
- No application, tests or configuration changed. This document is source inspection and bounded
  research, not a browser-popup, formatting, coverage or financial-engine acceptance result.

## Primary and local references

[P01]: https://www.legislation.gov.au/C2004A03348/2026-07-01/2026-07-01/text/original/epub/OEBPS/document_1/document_1.html
[P02]: https://www.legislation.gov.au/C2026A00049/asmade/2026-06-26/text/original/epub/OEBPS/document_1/document_1.html
[P03]: https://www.legislation.gov.au/C2004A05138/2026-10-01/2026-10-01/text/original/epub/OEBPS/document_2/document_2.html
[P04]: https://www.legislation.gov.au/C2004A03351/2026-07-01/2026-07-01/text/original/epub/OEBPS/document_1/document_1.html
[P05]: https://privatehealth.gov.au/health_insurance/surcharges_incentives/medicare_levy.htm
[P06]: https://www.legislation.gov.au/C2004A00412/2026-07-01/2026-07-01/text/original/epub/OEBPS/document_1/document_1.html
[P07]: https://www.legislation.gov.au/C2004A01234/2026-07-01/2026-07-01/text/original/epub/OEBPS/document_1/document_1.html
[P08]: https://www.legislation.gov.au/C2026G00249/asmade/2026-04-20/text/original/epub/OEBPS/document_1/document_1.html
[P09]: https://www.legislation.gov.au/F2025L00647/asmade/2025-06-04/text/original/epub/OEBPS/document_1/document_1.html
[P10]: https://www.legislation.gov.au/F2025L01016/asmade/2025-09-01/text/original/epub/OEBPS/document_1/document_1.html
[P11]: https://www.legislation.gov.au/F2026L00716/asmade/2026-06-12/text/original/epub/OEBPS/document_1/document_1.html
[P12]: https://caat-p-001.sitecorecontenthub.cloud/api/public/content/0-7350b1a9-c870-4d9b-b4dc-1506974b918e
[annual component boundaries]: annual-tax-component-boundaries.md
[Medicare boundaries]: medicare-component-boundaries.md
[HELP evidence]: help-and-withholding-evidence.md
[fresh defaults audit]: ../defaults-tax-fresh-2026-10-24.md

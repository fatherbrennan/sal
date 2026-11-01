# Tax implementation status

23 October 2026. The user authorised application implementation and explicitly approved clearly
labelled component-based annual estimates while final assessed tax remains unavailable. This
changes the implementation gate; it does not resolve the factual precision gaps below.

## Implemented contract

Current rule version: `2026-10-25-components-1`. All amounts are AUD. Runtime calculations are local;
source links are provenance, not runtime API dependencies.

The 25 October [base-pay and annual-leave update](../annual-leave-base-pay.md) adds isolated base-pay
scenarios and guards scenario-specific taxable-income, HELP-family and reportable-super facts.
Informational leave values never enter tax, payroll or super totals. Cash-out/termination remain
unsupported events; no general 2026 QE treatment is inferred from the OTE exclusion alone.

| Entry point                                         | Bounded result                                                                                                                                                                                                                                             |
| --------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `src/lib/calculations/tax.ts`: `calculateAnnualTax` | Raw ordinary resident basic tax, applicable non-refundable LITO, Medicare, MLS and HELP components for 2025–26/2026–27. Subtotal requires every relevant component and explicit absence of other assessment items. Final assessment is always unavailable. |
| `tax/deduction.ts`: `calculateStandardDeduction`    | Separately established 2026–27 standard deduction; eligible labour income and the specified deduction subset are inputs. Apply once upstream. No 2025–26 deduction under this provision.                                                                   |
| `tax/payg.ts`: `calculatePayg`                      | Representative ordinary employee withholding by July 2025, September 2025 and July 2026 rule period, separate from annual liability. Ordinary and published combined loan coefficients are separate outputs.                                               |
| `tax/payroll-hourly.ts`: `calculatePayrollHourly`   | Divides representative payroll amounts by allocated standard paid hours for the selected pay frequency. Preserves unknown components; does not predict annual deposits or actual period work.                                                              |
| `tax/profile.ts`: `calculateProfileTax`             | Recomputes the with-offer and without-offer contexts, including the standard deduction; returns their signed raw-subtotal difference when both are available. Shared other income is assessable income before deductions, not bank receipts.               |
| `tax/profile.ts`: `buildPaygInput`                  | Converts explicit payer declarations and provided representative earnings into payroll inputs. It does not choose a pay date, derive annual deposits or substitute annual tax divided by periods.                                                          |
| `tax/types.d.ts`, `tax/sources.ts`                  | Typed result states, rule version and source-ID-to-URL mapping. Missing, invalid, unsupported and unverified states remain distinct from a supported zero.                                                                                                 |

The profile adapter exposes the [MC02–MC03](medicare-component-boundaries.md) ordinary single
and full-year-spouse branches, with separate spouse taxable/MLS incomes and levy/MLS child counts.
Single-with-dependants MLS is available; its ordinary levy requires an established absence of
family relief. Sole-parent levy relief, changing households, SAPTO, exemptions, other offsets
and other loan schemes remain separate unsupported branches. HELP family-exemption inputs are
established separately for the with-offer and without-offer scenarios; spouse income is never
added to the employee's cash or taxable income.

## Approved estimate convention

Core annual calculations require an established non-negative whole-dollar taxable-income input.
The profile adapter preserves raw derived income separately. Without an explicit established
override, it normalises derived income to the nearest cent, then rounds down to whole dollars
for the **sal component estimate**. This is an approved estimation convention, not a claim about
ATO field grouping or final-assessment precision. Nearest-cent normalisation avoids treating binary
division residue, such as `112000 / 1.12`, as an intentional one-dollar difference.

The derivation subtracts established shared/offer deductions and the recomputed standard deduction
once. Reportable benefits, reportable super, net investment losses and exempt foreign employment
income enter only their supported tests; they are not automatically added as taxable cash.
Salary sacrifice, business expenses and personal-super deductions must be classified upstream.
The adapter does not establish deductibility, PSI/PSB, GST, SG eligibility or loss treatment.

An established taxable-income override is specific to its assessment scenario. Reusing one
with-offer override across different offers, target earnings or one-off variants is not valid
without separately establishing that applicability. A UI must not imply otherwise.

## Evidence and limits

`tax/payroll.ts`: `calculateRepresentativePayroll` derives representative base gross cash only
after equal-pay confirmation. Its separately labelled sal convention divides annual base cash by
52/26/12/4 for weekly/fortnightly/monthly/quarterly periods and rounds to cents, with half cents up.
It does not predict actual annual deposit counts or prescribe employer payslip precision.
The API is declared in `tax/payroll-types.d.ts`; quarterly is not four-weekly pay.

Explicit valid period salary sacrifice is removed before PAYG. Personal super and other post-tax
outflows are removed afterwards in cents. Unknown sacrifice blocks withholding; unknown post-tax
outflows block the bank estimate while preserving independently available withholding. Outflows
exceeding available period cash are invalid. Sole-trader fees and irregular/bonus payments are
outside this ordinary base-pay component; reimbursements and super-fund receipts are not inferred.

The [2026 withholding instrument, Schedule 1](https://www.legislation.gov.au/F2026L00716/asmade/2026-06-12/text/original/epub/OEBPS/document_1/document_1.html)
was body-read again on 23 October: the later PAYG conversion and whole-dollar rounding are distinct
from the salary-to-period estimate. Tests retain its monthly 33-cent adjustment and the existing
year-specific sample fixtures. The [ATO contribution guide, pp5–8](https://caat-p-001.sitecorecontenthub.cloud/api/public/content/0-7350b1a9-c870-4d9b-b4dc-1506974b918e)
was also body-read again: valid sacrificed super is outside employee assessable pay/PAYG;
personal contributions are separate, with deduction/cap conditions and possible government credits.
The [ATO caps guide, pp46–49](https://caat-p-001.sitecorecontenthub.cloud/api/public/content/0-6c3220ce-b973-4514-84e0-0f9f28c4d0a7)
retains separate Division 293 liability and cash/fund payment choices. The ordinary-fund UI help
therefore requires established cap headroom and absence of those unmodelled adjustments; it does
not turn the contribution estimate into account growth.
- [AT01–AT05](annual-tax-component-boundaries.md), T01–T03/T42/T66: basic-tax bands, raw LITO,
  non-refundability and separate input/final precision. The exact $66,667 LITO endpoint is
  unavailable; intermediate sub-cent amounts are preserved elsewhere. The isolated five-cent
  liability rule does not establish universal tax/levy/loan aggregation.
- [MC02–MC04](medicare-component-boundaries.md), T08–T11/T70–T72: ordinary levy and MLS raw
  formulas, separate income bases, spouse/family allocation and liable days. A supplied qualifying
  child count or liable-day count is an established input, not an inferred eligibility finding.
- [HELP evidence](help-and-withholding-evidence.md), T12/T13/T50/T51: statutory HELP formula,
  established debt cap and explicit exemption conditions. The 2026–27 raw statutory base retains
  $9,028.35; contradictory guide examples are not adopted as a corrected final assessment.
- [PAYG evidence](ordinary-calculation-evidence.md), T22/T33/T34: prescribed period conversion,
  whole-dollar rounding and published combined coefficients. `loanIncrement` is combined minus
  ordinary withholding; it is not a separately rounded Schedule 8 amount or a debt-account credit.
  The July–September 2025 no-threshold plus loan branch remains unavailable. Irregular payments,
  missing TFN, variations and special payroll regimes require separate supported branches.
- [Sole-trader boundary](sole-trader-component-boundaries.md): ordinary personal-tax components
  do not establish complete contractor tax. Small-business offsets, PSI restrictions, losses,
  deductible personal super and other relevant adjustments must be established or routed outside
  the available subtotal. Own-company/partnership/trust contracting remains deferred as approved.

R02, R03c and R04a final precision/composition evidence remains unresolved. Existing SBR metadata,
failed body retrieval and local download timeouts do not supply a calculation specification.
No new body-verified final-assessment fixture was found during this implementation. Published
component samples and independently derived statutory boundary fixtures are identified separately
in the tests; neither is described as a published final take-home result.

## Verification

On Windows x64, Bun 1.4.4:
- The native suite passed 363 tests, including tax missing/invalid/unsupported states,
  income and loan boundaries, debt caps, family allocation, day/tier tests, PAYG transitions,
  combined-rounding differences, counterfactual recomputation, estimate/override behavior,
  family inputs, reporting-year consistency, representative salary-sacrifice/post-tax payroll
  flows and hourly allocation for each supported pay frequency.
- Native Bun coverage measured 100% lines and functions in every executable tax module.
  Declaration-only `.d.ts` files have no runtime to exercise.
- Biome, Svelte, application/tooling TypeScript and the separate worker type check passed.
  The earlier worker-test typing errors were corrected and no longer block the checked scope.

These results verify the bounded implementation against its fixtures. They are not real-browser,
ATO-service, PayCalculator, final-assessment or universal-employment verification. Root application
integration, persistence and production-browser results are recorded in [the implementation
record](../../IMPLEMENTATION.md).

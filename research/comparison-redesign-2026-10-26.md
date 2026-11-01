# Comparison redesign and hypothetical leave cash-out

The later [earned leave and cash-out extension](leave-value-2026-10-26.md) adds visible weeks,
super-inclusive gross leave and combined cash-plus-super payout. The ten-row/cash-only description
below records the earlier milestone. The 27 October combined hypothetical total brings the current
overview to fourteen rows and 88 main metrics.

Implemented after the user's one-at-a-time decisions on 26 October 2026. This record supersedes
the display order in [the earlier selection](comparison-decisions-2026-10-26.md), retaining its
financial boundaries and complete metric catalogue. Verification is in
[IMPLEMENTATION.md](../IMPLEMENTATION.md).

## Approved presentation

One side-by-side table starts with ten rows:
1. Real-world value per year.
2. Cash after tax.
3. Super after tax.
4. Perks, using personal value.
5. Commuting expenses.
6. Travel-time value.
7. Cash plus super per standard paid hour.
8. Annual leave hours.
9. Gross annual leave value.
10. Extra cash after tax from a hypothetical cash-out of that entitlement.

The headline is cash plus net super plus personal perks, less commuting expenses and monetary
travel-time value. The time rate is cash plus net super divided by standard paid hours. Perks
have no invented tax conversion. Super is retirement value, not spendable cash. All commuting
charges remain included, with the broader ATO kilometre estimate labelled when selected.

Six expandable groups retain pay/super, work/commuting, other job costs, bonuses/one-offs,
leave details and tax/assumptions. All 80 main metrics appear once; conditional trade-offs,
target upside, representative payroll and one-off effects remain accessible. Baseline differences,
their direction and recursive equations remain unchanged. Leave now shares the main table and
offer columns. Expanding details does not hide the ten overview rows.

The short labels are presentation mappings; saved records and calculation metric keys are retained.
No dependency, input schema, browser storage or runtime network boundary changes.

## Leave calculation

The user selected a hypothetical payment of one year's entitlement **on top of the selected annual
earnings, while still employed**. This is distinct from taking leave, a recorded unused balance,
termination, actual cash-out eligibility and representative payroll withholding.

```text
additional_annual_tax_from_leave = annual_tax_with_leave - annual_tax_without_leave
hypothetical_annual_leave_cash_after_tax = annual_leave_entitlement_gross_value - additional_annual_tax_from_leave
```

Both tax scenarios contain the same selected offer and personal circumstances. The second adds
gross leave to assessable income and assessable labour income, recalculating linked deductions,
income tax after offsets, Medicare levy, Medicare levy surcharge and supported HELP repayments.
It does not use the without-job baseline or prorate an existing net hourly rate. The gross amount
uses established ordinary base pay and loading, excluding bonuses and employer super.

Normal remuneration and package totals remain unchanged. No extra personal contribution is
assumed. Employer super is not cash and is outside this illustration. A threshold can make the
net change negative; the result is not clamped to zero. All results remain component estimates,
not final-assessment precision or a promise of an actual bank payment.

Missing leave facts, unavailable tax components, saved taxable-income overrides and unsupported
new tax circumstances remain unavailable with a reason. Non-single HELP cases need their family
exemption re-established after the income change; the saved answer is not reused. The resolved
household is checked, preserving supported original-mode single-person profiles.

## Verified source boundaries

The dedicated ATO specialist checked the sources and reviewed the calculation and equation
callers. The parent inspected the Fair Work guidance and income-tax legislation and reviewed the
specialist's evidence. Retrieval was on 26 October 2026; effective years remain source-specific.
- Entitlement and unused balances are distinct. Actual cash-out has agreement and retained-leave
  conditions; most awards also limit cash-out to two weeks in twelve months. A full-year
  illustration does not establish permission to cash out that amount.
  [Fair Work annual leave](https://www.fairwork.gov.au/leave/annual-leave),
  [cash-out conditions](https://www.fairwork.gov.au/leave/annual-leave/cashing-out-annual-leave).
- Leave pay uses the applicable ordinary pay basis and any established loading, rather than a
  bonus-inclusive comparison average.
  [Fair Work payment guidance](https://www.fairwork.gov.au/leave/annual-leave/payment-for-annual-leave).
- Resident rates are year-specific. The extra payment must be assessed with existing annual
  income rather than against a fresh tax-free threshold.
  [Income Tax Rates Act, Schedule 7](https://www.legislation.gov.au/C2004A03348/2026-07-01/2026-07-01/text/original/epub/OEBPS/document_1/document_1.html).
- Medicare and surcharge thresholds remain part of the annual calculation.
  [Medicare Levy Act](https://www.legislation.gov.au/C2004A03351/2026-07-01/2026-07-01/text/original/epub/OEBPS/document_1/document_1.html),
  [both years' surcharge thresholds](https://privatehealth.gov.au/health_insurance/surcharges_incentives/medicare_levy.htm).
- The 2026–27 standard deduction is linked to eligible labour income. Increasing only total
  assessable income would omit its required recalculation.
  [Enacted standard deduction, section 25-130](https://www.legislation.gov.au/C2026A00049/asmade/2026-06-26/text/original/epub/OEBPS/document_1/document_1.html).
- HELP includes income-dependent family exemptions and indexed repayment rules.
  [Higher Education Support Act, sections 154-1, 154-20 and 154-25](https://www.legislation.gov.au/C2004A01234/2026-07-01/2026-07-01/text/original/epub/OEBPS/document_1/document_1.html),
  [2026–27 indexed amounts](https://www.legislation.gov.au/C2026G00249/asmade/2026-04-20/text/original/epub/OEBPS/document_1/document_1.html).

## Independent synthetic checks

These examples are fixtures, not user data or legal cash-out entitlements. Resident adult, single,
no hospital cover, full-year surcharge exposure, no HELP unless stated, supported ordinary inputs.
The 2026–27 eligible standard deduction applies.

| Year    | Cash before leave | Extra gross leave | Extra income tax | Extra Medicare | Extra surcharge | Net extra cash |
| ------- | ----------------: | ----------------: | ---------------: | -------------: | --------------: | -------------: |
| 2025–26 |          $100,000 |           $10,000 |           $3,000 |           $200 |          $1,100 |         $5,700 |
| 2026–27 |          $100,000 |           $10,000 |           $3,000 |           $200 |          $1,090 |         $5,710 |
| 2025–26 |          $130,000 |           $10,000 |           $3,350 |           $200 |            $125 |         $6,325 |
| 2026–27 |          $130,000 |           $10,000 |           $3,280 |           $200 |            $125 |         $6,395 |

With a $50,000 HELP debt, the last two net results become $4,625 and $4,709.34. Surcharge-cliff
fixtures preserve negative net changes. A labour-income-limited deduction fixture verifies that
the extra leave changes the deduction as well as income. Tests also cover unsupported endpoints,
saved overrides, legacy household resolution, non-finite input and unchanged original records.

Equation tests traverse every variable, including the after-leave income link back to gross leave.
Review corrected a relative scope reference and a raw-household check before final verification.
Calculation version `2026-10-26-components-3` and backup rule metadata `2026-10-26.3` identify the
new result. Neither changes the stored-input schema or retrospectively adds leave to remuneration.

# Earned leave and hypothetical cash-out value

The user confirmed ordinary base pay plus employer super, excluding bonuses/perks, and a
combined after-tax cash-plus-super cash-out with both destinations visible. Both the cash payment
and extra super are received in the selected financial year. These are comparison conventions,
not a determination that an employer or employment instrument permits cashing out all leave.

## Presentation and accounting

The comparison keeps the seven headline/component rows and shows seven leave rows:
- Earned leave: weeks, hours, and gross ordinary base-pay-plus-super value.
- Hypothetical cash-out: combined cash plus net super, extra cash kept, and extra net super.
- Added on 27 October: real-world value including hypothetical leave cash-out, equal to the existing
  headline plus the cash-out total. It retains the original commuting expenses and time valuation,
  assumes cash-out permission, and remains unavailable when either component is unavailable.

Six expandable detail groups retain the remaining figures. All 88 main metrics appear once.
Gross cash, loading, allocated base super, the super-inclusive leave hourly rate, extra cash-out
super and contribution tax remain available in Leave details. Each amount has a linked equation.

```text
ordinary_base_cash_per_hour = annual_base_cash / (paid_hours_per_leave_week * 52)
ordinary_base_super_per_hour = annual_base_employer_super / (paid_hours_per_leave_week * 52)
annual_leave_entitlement_hours = annual_leave_entitlement_weeks * paid_hours_per_leave_week
annual_leave_base_pay_plus_super = annual_leave_entitlement_hours * (ordinary_base_cash_per_hour + ordinary_base_super_per_hour)

additional_annual_tax_from_leave = annual_tax_with_leave - annual_tax_without_leave
hypothetical_annual_leave_cash_after_tax = annual_leave_entitlement_gross_value - additional_annual_tax_from_leave
leave_cash_out_net_super = leave_cash_out_employer_super - leave_cash_out_fund_tax
leave_cash_out_net_total = hypothetical_annual_leave_cash_after_tax + leave_cash_out_net_super
```

Earned value allocates existing salary and base super; it is not extra annual remuneration.
An independently entered cash hourly rate does not establish its corresponding super allocation.
Gross earned base-pay-plus-super excludes loading; the hypothetical gross cash payment includes
established loading. Neither earned value nor cash-out is added to the real-world headline.

The extra cash calculation retains the [previously verified annual-tax model](comparison-redesign-2026-10-26.md).
Selected bonuses affect annual tax but do not inflate ordinary leave pay. Unknown reportable
cash-out contributions also prevent a supported net-cash result.

## Verified source boundaries

Sources and relevant bodies were reviewed on 26 October 2026 by the dedicated ATO specialist;
the parent reviewed the findings and retrieved Fair Work and ATO source bodies independently.
- Ordinary leave pay excludes bonuses and overtime; cash-out has agreement and retained-leave
  conditions. This application illustrates value assuming permission, not eligibility.
  [Fair Work annual-leave facts](https://www.fairwork.gov.au/tools-and-resources/fact-sheets/minimum-workplace-entitlements/annual-leave),
  [cash-out conditions](https://www.fairwork.gov.au/leave/annual-leave/cashing-out-annual-leave).
- In-service cashed-out ordinary leave is super-eligible. Loading replacing overtime needs
  separate treatment; termination leave payments are a different category.
  [ATO STP Phase 2 guide, pages 50–52, updated 23 October 2026](https://caat-p-001.sitecorecontenthub.cloud/api/public/content/0-2f417730-27cf-4825-8b51-ee53bfe00358).
- Statutory SG is 12%. The 2025–26 maximum base is $62,500 per quarter. The 2026–27 base is
  $270,830 annually. An additional lump payment uses remaining headroom in its payment period.
  [ATO rates and thresholds, updated 11 September 2026](https://caat-p-001.sitecorecontenthub.cloud/api/public/content/0-af5a46ad-7287-431c-be8e-4a0c9bbc5fc1),
  [ATO maximum contributions base](https://smallbusiness.taxsuperandyou.gov.au/maximum-contributions-base),
  [enacted Payday Super rules](https://www.legislation.gov.au/C2025A00057/asmade/2025-11-06/text/original/epub/OEBPS/document_1/document_1.html).
- General concessional caps are $30,000 for 2025–26 and $32,500 for 2026–27. The ordinary fund
  contribution-tax estimate is 15%; Division 293 has a $250,000 income-plus-contributions threshold.
  Receipt year matters. Carry-forward and special-fund treatment require further facts.
  [ATO contribution caps and Division 293, pages 8–9 and 47–49, updated 24 August 2026](https://caat-p-001.sitecorecontenthub.cloud/api/public/content/0-6c3220ce-b973-4514-84e0-0f9f28c4d0a7).
- Contributions above the statutory minimum may have reportable-super consequences.
  [ATO reportable employer super guidance, pages 11–12](https://caat-p-001.sitecorecontenthub.cloud/api/public/content/0-b1369c56-31c8-43e2-85a6-1554f47db48f).

For 2025–26, established equal quarters divide existing eligible earnings by four; the cash-out
itself remains in one quarter. Without that allocation, total annual earnings establish full
headroom only if the additional payment still fits below $62,500. Otherwise extra SG is unknown.
For 2026–27, the additional payment uses annual remaining headroom. Exhausted statutory headroom
establishes zero extra SG even when loading classification is unknown.

The contribution screen adds employer super, sacrifice, other reportable super and extra SG once.
The Division 293 screen adds post-payment taxable income, reportable benefits, investment loss
and those modelled contributions. It does not double-count offer reportable super or add
non-deducted personal contributions. Above-cap or possible Division 293 cases withhold affected
net cash and super; they are not approximated as ordinary 15% fund tax. A zero extra SG amount
does not bypass screening because extra cash can change tax on existing contributions.

These screens cover modelled ordinary inputs, not a complete personal super assessment. They do
not establish unentered contributions, carry-forward capacity, special-fund adjustments, LISTO,
co-contributions or special Division 293 adjustments. Final assessed-tax precision remains outside
the approved component estimate. Gross independent figures remain available when possible.

## Independent synthetic checks

Base cash $130,000, four weeks at 38 ordinary hours, 52-week conversion, 12% statutory super,
no loading, resident adult, single, no hospital cover, full-year surcharge exposure, no HELP,
no other income/deductions/contributions; 2026–27 standard deduction applies:

| Year    | Leave hours | Gross base + super | Extra cash kept | Extra net super | Combined cash-out |
| ------- | ----------: | -----------------: | --------------: | --------------: | ----------------: |
| 2025–26 |         152 |         $11,200.00 |       $6,325.00 |       $1,020.00 |         $7,345.00 |
| 2026–27 |         152 |         $11,200.00 |       $6,395.00 |       $1,020.00 |         $7,415.00 |

Extra gross cash is $10,000; extra SG is $1,200; ordinary fund tax is $180.
Normal annual gross remuneration remains $145,600. Tests also cover bonus independence,
quarterly/annual headroom, loading, cap boundaries, Division 293, unknown funds, incomplete inputs,
non-finite values, recursive equations and unchanged source records.

The independent second review corrected a stale salary-basis case: switching an offer to hourly
or daily pay now withholds the annual-salary super allocation as well as the ordinary cash rate.
Its regression failed before the correction and passed afterwards. Separate tests verify that
six weeks earns more leave value than four weeks without changing normal package totals.

Calculation version `2026-10-26-components-4` and backup rule metadata `2026-10-26.4` identify this
extension. Stored-input schema, user data, dependencies and runtime network behavior are unchanged.
Execution results are recorded in [IMPLEMENTATION.md](../IMPLEMENTATION.md).

## Employer leave terms: fresh review and confirmed update

The user chose each item separately on 26 October 2026:
- Use confirmed employer leave terms, including entitlements above the NES minimum.
- Enter weeks per year multiplied by paid hours per leave week.
- Offer salary-based pay and a confirmed hourly rate. Default to normal base salary continuing
  during leave, as a shared editable estimate for unanswered existing and new offers. Preserve
  explicit saved choices and cleared values.
- Offer no loading, a percentage of base leave pay, or dollars per leave hour. Loading stays
  unknown until selected; no percentage is assumed.
- Keep the optional unused balance and its date in the main Paid annual leave section.

Fair Work's annual-leave fact sheet limits NES ordinary hours to 38. That is not a universal cap
on paid leave hours under more generous terms. The current AFP award provides a concrete example:
38 ordinary hours plus at least two additional hours (7.1), and four weeks as 160 annual-leave
hours (15.1). Its super clause separately refers to super legislation (12.2). These clauses do not
establish another employer's terms. A 40-hour working week alone establishes neither 152 nor 160
annual-leave hours. [Fair Work fact sheet](https://www.fairwork.gov.au/tools-and-resources/fact-sheets/minimum-workplace-entitlements/annual-leave),
[AFP award, consolidated 1 July 2026](https://awards.fairwork.gov.au/MA000142.html).

Fair Work Act sections 55, 62, 87 and 90 distinguish supplementary entitlements, reasonable
additional working hours, leave accrual, and leave payment. SAL records employer-confirmed leave
terms; it does not determine award coverage or legal compliance.
[Current Act, compilation 7 July 2026](https://www.legislation.gov.au/C2009A00028/2026-07-07/2026-07-07/text/original/epub/OEBPS/document_1/document_1.html).

Under the salary estimate, one entered leave week receives annual base cash / 52. Four weeks of
$130,000 annual base cash is $10,000 whether a leave week contains 38 or 40 paid hours. At 40,
the hourly value is $62.50 and entitlement is 160 hours. A different employer payment basis needs
the confirmed hourly-rate option. Allocated existing super uses the same salary-week basis and
does not create extra annual remuneration.

Percentage loading applies only to the base leave pay calculated here. Some awards instead use
a minimum award rate or a higher-of test; those need an established hourly amount. For a
synthetic 160-hour entitlement at $50/hour, confirmed 17.5% loading adds $1,400 to $8,000 base pay.
[Fair Work loading example](https://www.fairwork.gov.au/leave/annual-leave/payment-for-annual-leave).

The dedicated ATO specialist freshly reviewed in-service cash-out, SG headroom, reporting and
contribution screens against the sources above. The parent independently checked the current ATO
STP guide's cash-out and overtime classifications (pages 50–52). A leave week above 38 hours does
not itself classify earnings as overtime or settle super eligibility. Existing loading, fund,
contract, reporting and cap guards remain applicable; TOIL is a separate category. Cash-out
permission and termination treatment remain outside this illustration.
[ATO STP guide](https://caat-p-001.sitecorecontenthub.cloud/api/public/content/0-2f417730-27cf-4825-8b51-ee53bfe00358).

Calculation version `2026-10-26-components-5` and backup rule metadata `2026-10-26.5` identify the
update. Existing field identifiers and stored values are retained; the optional percentage field
uses current-schema validation. Explicit blanks remain unknown. No storage reset is required.

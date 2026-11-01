# Verified tax components

Initial verification: 22 October 2026; F03–F05/F07/F13 include follow-ups checked 23 October 2026,
Australia/Adelaide. AUD throughout. These are bounded research findings, not a complete tax
algorithm. Source IDs and access limits are in [sources.md](sources.md). Eligibility, special
cases and rounding can prevent direct use of an otherwise verified rate.

## F01 — Ordinary individual income-tax bands

[T01, Schedule 7](https://www.legislation.gov.au/C2004A03348/2026-07-01/2026-07-01/text/original/epub/OEBPS/document_1/document_1.html). Marginal rates apply to the income portion within each band. Annual taxable income; excludes Medicare, offsets and special-income treatment.

| Full-year ordinary resident band | 2024–25 / 2025–26 | 2026–27 | 2027–28 onward under retrieved law |
| -------------------------------- | ----------------- | ------- | ---------------------------------- |
| $0–18,200                        | 0%                | 0%      | 0%                                 |
| Above $18,200–45,000             | 16%               | 15%     | 14%                                |
| Above $45,000–135,000            | 30%               | 30%     | 30%                                |
| Above $135,000–190,000           | 37%               | 37%     | 37%                                |
| Above $190,000                   | 45%               | 45%     | 45%                                |

| Ordinary nonresident band, 2024–25 onward | Rate |
| ----------------------------------------- | ---- |
| $0–135,000                                | 30%  |
| Above $135,000–190,000                    | 37%  |
| Above $190,000                            | 45%  |

Working-holiday-maker schedule: $0–45,000 at 15%; then the resident table's 30%, 37%, 45% bands. Treaty/resident exceptions remain unresolved. Part-year residency has a separate threshold calculation under ss18–20; the full threshold cannot simply be assumed.

## F02 — Deductions and the standard work deduction

[T02, ss8-1, 8-10, 25-130](https://www.legislation.gov.au/C2004A05138/2026-10-01/2026-10-01/text/original/epub/OEBPS/document_1/document_1.html). General deductions require an income-producing/business connection; private, domestic, capital and exempt-income exclusions apply. The same amount is not deductible twice.

The standard deduction requires an individual resident at some time in the year with statutory assessable labour income. It is `max(0, min($1,000, assessable labour income) − specified deductions)`. Specified deductions cover relevant general work expenses, car expenses, workplace travel, repairs, depreciation/balancing adjustments and COVID tests. Qualifying insurance premiums and trade/business/professional association memberships are excluded from the reduction.

Assessable labour income is defined through specified withholding provisions: employee, director, office-holder, religious-practitioner, return-to-work, retirement/termination and parental-leave payments. Ordinary sole-trader receipts are not automatically included in that definition.

Application: **2026–27 onward**, [T07, Schedule 4 item 17](https://www.legislation.gov.au/C2026A00049/asmade/2026-06-26/text/original/epub/OEBPS/document_1/document_1.html).

## F03 — Offsets

[T03, ss61-110/115](https://www.legislation.gov.au/C2004A05138/2026-10-01/2026-10-01/text/original/epub/OEBPS/document_2/document_2.html): LITO for eligible resident individuals, 2020–21 onward:

| Taxable income       | Statutory amount before unresolved endpoint/rounding handling |
| -------------------- | ------------------------------------------------------------- |
| Up to $37,500        | $700                                                          |
| Above $37,500–45,000 | $700 − 5% of excess above $37,500                             |
| Above $45,000–66,667 | $325 − 1.5% of excess above $45,000                           |

Special rules restrict certain under-18 income. The 23 October follow-up verifies ordinary
LITO ordering and its non-refundable liability limit under T03 s63-10; sub-cent and $66,667
endpoint handling remain unresolved. See [O02](ordinary-calculation-evidence.md#o02--annual-ordering-and-rounding-partial-resolution).

T03 ss61-155/160 provide a working Australians offset: eligible residents with net labour income exceeding the tax-free threshold; lesser of $250 and basic income tax attributable to that net labour income. Its labour-income definition includes categories beyond F02, including qualifying individual business income, PSI and specified ESS/labour-hire amounts. Application is **2027–28 onward**, [T07 Schedule 3 item 4](https://www.legislation.gov.au/C2026A00049/asmade/2026-06-26/text/original/epub/OEBPS/document_1/document_1.html).

## F04 — Medicare levy

[T08, ss3, 6–9A](https://www.legislation.gov.au/C2004A03351/2026-07-01/2026-07-01/text/original/epub/OEBPS/document_1/document_1.html): ordinary rate 2% of taxable income. Ordinary individual low-income threshold $28,011; phase-in limit $35,013. Corresponding SAPTO-category figures are $44,268/$55,335. Within the phase-in band, levy is limited to 10% of income above the threshold. Family reductions and prescribed-person/day rules are separate.

The threshold amendments apply to **2025–26 assessments onward**, not merely from the compilation date: [T09, Schedule 5 item 14](https://www.legislation.gov.au/C2026A00058/asmade/2026-06-30/text/original/epub/OEBPS/document_1/document_1.html). Later indexation cannot be assumed. Full exemption eligibility and family allocation remain blockers.

## F05 — Medicare levy surcharge

The [23 October supplement](medicare-and-mls-evidence.md) adds the ordinary family-reduction
formula, distinct dependency tests, selected-year MLS charge bases, cover days and verified
examples. It narrows F04/F05 gaps without establishing a complete assessment.

[T10, official government table](https://privatehealth.gov.au/health_insurance/surcharges_incentives/medicare_levy.htm): annual thresholds for **2026–27**.

| Income tier | Single           | Family, before child adjustment | Rate  |
| ----------- | ---------------- | ------------------------------- | ----- |
| Base        | Up to $105,000   | Up to $210,000                  | 0%    |
| 1           | $105,001–123,000 | $210,001–246,000                | 1%    |
| 2           | $123,001–164,000 | $246,001–328,000                | 1.25% |
| 3           | $164,001+        | $328,001+                       | 1.5%  |

These are the source's whole-dollar published ranges; input precision and final rounding remain unresolved. Family thresholds increase $1,500 for each dependent child after the first. Hospital cover must qualify and cover the relevant dependants/days; extras-only, overseas visitor/student cover and foreign insurance are not equivalent. Dependant and relationship rules require date-sensitive treatment.

[T06, s995-1](https://www.legislation.gov.au/C2004A05138/2026-10-01/2026-10-01/text/original/epub/OEBPS/document_10/document_10.html): tier-test income includes taxable income with specified adjustments, reportable benefits, reportable super and total net investment loss; specified super benefits are subtracted. It is not just salary.

The charge base differs from that test. [T08 ss8B–8D](https://www.legislation.gov.au/C2004A03351/2026-07-01/2026-07-01/text/original/epub/OEBPS/document_1/document_1.html) charge taxable income, subject to statutory adjustments/exceptions; [T11 ss12–16](https://www.legislation.gov.au/C2004A00412/2026-07-01/2026-07-01/text/original/epub/OEBPS/document_1/document_1.html) separately charge reportable fringe benefits. Partial-year liability uses applicable days/year days. No complete MLS result is validated here.

## F06 — HELP repayment income and marginal repayment

[T12, Division 154](https://www.legislation.gov.au/C2004A01234/2026-07-01/2026-07-01/text/original/epub/OEBPS/document_1/document_1.html): repayment income comprises taxable income excluding assessable FHSS releases, net investment loss, reportable fringe benefits, defined exempt foreign income and reportable super. It differs from F05's income definition.

For 2026–27, minimum `L = $69,528`, upper threshold `U = $129,717`: [T13, indexed-amounts notice](https://www.legislation.gov.au/C2026G00249/asmade/2026-04-20/text/original/epub/OEBPS/document_1/document_1.html).

T12 s154-20 specifies the lesser of:
- `15% × max(0, min(RI, U) − L) + 17% × max(0, RI − U)`;
- `10% × RI`;
- statutory repayable debt.

Liability also depends on debt/timing and s154-1 eligibility. Certain family Medicare reductions remove liability; this is not a blanket rule for every Medicare exemption. Overseas debtors have separate worldwide-income provisions. Divisions 142/144 contain location-sensitive teacher/health-practitioner measures; full eligibility remains unresolved. Other study-loan schemes and debt priority need verification.

[T14](https://www.studyassist.gov.au/managing-and-repaying-your-loan/loan-repayments) distinguishes payroll withholding, annual assessment and voluntary repayment. Withheld cash is not an immediate loan-balance reduction for comparison purposes.

23 October follow-up: [H01–H06](help-and-withholding-evidence.md) verifies the statutory June/assessment
debt timing and published other-scheme priority. Other schemes' complete statutory allocation
remains unverified. **T51's 2026–27 guide uses $9,028 where the statutory raw calculation gives
$9,028.35** and contains inconsistent examples. The formula above is raw statutory evidence,
not a resolved final-assessment fixture. T12 C104 ends 16 October 2026; T49's subsequent
amendment was checked and does not change the inspected Division 154 repayment provisions.

## F07 — Employer super and contractors

[T15, ss10A, 12, 17A](https://www.legislation.gov.au/C2004A04402/2026-07-01/2026-07-01/text/original/pdf): current SG uses **12% of qualifying earnings**, subject to eligibility/base rules. Qualifying earnings include OTE, commissions and specified extended-employee payments, with salary-sacrifice adjustments. OTE is not a safe synonym for every gross payment.

[T16, commencement and Schedule 1 item 182](https://www.legislation.gov.au/C2025A00057/asmade/2025-11-06/text/original/epub/OEBPS/document_1/document_1.html): relevant qualifying-earnings days from **1 July 2026** use the new rules, including work performed earlier. Item 189 separately adjusts qualifying earnings for specified Norfolk Island circumstances in 2026–27; full treatment remains a scope-specific gap. [T17](https://softwaredevelopers.ato.gov.au/PaydaySuper) describes payday contributions and generally seven-business-day fund receipt; exceptions require further verification.

[T18](https://smallbusiness.taxsuperandyou.gov.au/maximum-contributions-base): **2026–27** basic concessional cap $32,500; annual maximum contributions base $270,830. Formula: basic cap × 100 ÷ 12, rounded down to $10. The SG base is per employer; the individual's contribution cap is a different constraint.

Follow-up checked 23 October: [T41 ATO PDF](https://caat-p-001.sitecorecontenthub.cloud/api/public/content/0-af5a46ad-7287-431c-be8e-4a0c9bbc5fc1), Tables 1.1/24, verifies **2025–26** general concessional cap $30,000 and quarterly maximum contributions base $62,500, with ordinary SG $7,500 at that quarterly maximum. Historical T37 governs that period; [O01](ordinary-calculation-evidence.md#o01--historical-super-amounts-resolved) records scope and remaining exceptions.

[T19](https://smallbusiness.taxsuperandyou.gov.au/super-guarantee-employer-obligations/independent-contractors): a labour contractor may be an employee for SG; contracting with a company/trust/partnership changes the counterparty analysis. [T20](https://smallbusiness.taxsuperandyou.gov.au/super-guarantee-employer-obligations/employees-under-18): under-18 SG eligibility includes working more than 30 hours in a week.

## F08 — Contribution limits and additional super tax

[T05, ss291-15/20, 293-20](https://www.legislation.gov.au/C2004A05138/2026-10-01/2026-10-01/text/original/epub/OEBPS/document_6/document_6.html): unused concessional cap can carry forward from the previous five years where the statutory conditions hold, including total super balance below $500,000 immediately before the year. Excess concessional contributions are assessable with a 15% offset, subject to the specified rules.

Division 293 taxable contributions are generally the lesser of low-tax contributions and the amount by which adjusted surcharge income plus low-tax contributions exceeds $250,000. Reportable super is removed from that income limb; excess concessional contributions are treated separately. Defined-benefit and other modifications exist.

The Division 293 rate is **15% of statutory taxable contributions**, [T29 s5](https://www.legislation.gov.au/C2013A00087/asmade/2013-06-28/text/original/epub/OEBPS/document_1/document_1.html). The [retrieved register page](https://www.legislation.gov.au/C2013A00087/asmade/text) confirms that enacted version remains latest and in force; this resolves the initial metadata-access gap. Personal deductible contributions, non-concessional caps, Division 296 and fund-tax detail remain incomplete.

## F09 — Salary packaging and reportable benefits

**Product boundary:** perks are simple additions at entered personal value. The findings below
remain statutory tax/reporting and salary-packaging research; they do not authorise perk funding,
employee-contribution or salary-deduction calculations. Any required tax-profile amounts remain
separate and cannot be inferred from personal value.

[T21, ss135N–135Q](https://www.legislation.gov.au/C2004A03280/2026-07-01/2026-07-01/text/original/epub/OEBPS/document_2/document_2.html): the reportable amount depends on each employer's individual fringe-benefits amount exceeding $2,000 for the relevant FBT year ending 31 March. The statutory reporting gross-up divides by `1 − FBT rate`. Total reporting aggregates employers. Certain exempt electric-car benefits remain reportable. A benefit's market value, employee cost, taxable value and reportable amount are distinct quantities.

[T07, Schedule 4 Part 2](https://www.legislation.gov.au/C2026A00049/asmade/2026-06-26/text/original/epub/OEBPS/document_1/document_1.html): from FBT years starting **1 April 2027**, salary-packaged work-related items lose the s58X exemption; related otherwise-deductible reductions are restricted for specified expense-payment benefits. [T25](https://moneysmart.gov.au/work-and-tax/salary-packaging) independently describes the change. This does not establish every benefit's valuation, exemption or employer cap.

## F10 — PAYG, irregular pay and equity

[T22](https://www.legislation.gov.au/F2026L00716/asmade/2026-06-12/text/original/epub/OEBPS/document_1/document_1.html), effective **1 July 2026**, has distinct schedules for ordinary pay, bonuses/commissions/backpay, unused leave, study loans, seniors, voluntary agreements, ETPs and WHM. Schedule 1 generally rounds withholding to whole dollars, with 50 cents upwards; the no-TFN scale has a different cents rule. Annual liability must not inherit payroll rounding automatically.

[T23](https://softwaredevelopers.ato.gov.au/2025-pay-you-go-payg-withholding-tax-tables) documents a historical midyear HELP withholding change applied prospectively, illustrating why pay dates and table versions matter.

[T04, ss83A-20/25](https://www.legislation.gov.au/C2004A05138/2026-10-01/2026-10-01/text/original/epub/OEBPS/document_3/document_3.html): ESS discounts can enter assessable income at acquisition; deferred schemes and start-up concessions have separate rules. Grant value, vesting, cash proceeds and taxable amount cannot be conflated.

## F11 — Business structure boundary

[T24](https://business.gov.au/planning/business-structures-and-types/business-structures/tax-differences-between-a-sole-trader-and-a-company): sole-trader business income is reported personally; a company is a separate tax-return entity. General GST registration uses a $75,000 turnover trigger, with exceptions including taxi/limousine/ride-sourcing regardless of turnover. Turnover is not profit.

[T04, Divisions 84–87](https://www.legislation.gov.au/C2004A05138/2026-10-01/2026-10-01/text/original/epub/OEBPS/document_3/document_3.html): PSI depends on income mainly rewarding an individual's efforts or skills, including income received through another entity. PSI classification does not itself establish employee status. Attribution, deduction restrictions and personal-services-business exceptions need separate analysis.

## F12 — Commuting and working from home

Economic comparison costs do not establish tax deductibility. F02 is the verified general statutory boundary. Detailed transport exceptions and current WFH administrative methods remain blocked at [T26](https://www.ato.gov.au/law/view/pdf/pbr/tr2021-001.pdf) and [T27](https://www.ato.gov.au/law/view/document?DocID=COG%2FPCG20231%2FNAT%2FATO%2F00001&PiT=99991231235958). No commute deduction, WFH hourly rate or automatic deduction for monetised travel time is established by this research. F13 now establishes the 2026–27 car kilometre rate; it does not establish trip eligibility.

## F13 — Cents-per-kilometre car expense deduction

Checked **23 October 2026** by the ATO specialist and independently reviewed by the parent agent.
Previously tracked as an unverified rate in F12 and R11.

| Australian financial year         | Rate                          | Verified scope                     |
| --------------------------------- | ----------------------------- | ---------------------------------- |
| 2026–27: 1 July 2026–30 June 2027 | **91 cents/km (AUD 0.91/km)** | T31 section 6 sets this year only. |

[T31, determination section 6](https://www.legislation.gov.au/F2026L00785/asmade/2026-06-23/text/original/epub/OEBPS/document_1/document_1.html)
sets the current rate. Its register entry identifies it as the latest version and in force.

[T32, ATO explanatory statement](https://www.legislation.gov.au/F2026L00785/asmade/2026-06-23/es/original/pdf)
explains the 89-cent base plus a temporary 2-cent uplift for 2026–27 only.

T32 paragraphs 6–10 describe a deduction for eligible work-related car expenses, limited to 5,000
business kilometres under this method, with a record of how those kilometres were calculated.
The rate reflects average car operating costs, including fuel, registration and maintenance;
it is not a measured fuel cost or a dollar-for-dollar tax refund.

Trip eligibility, commuting exceptions, full method requirements and tax interactions remain
unresolved. No application default or calculation has been implemented.

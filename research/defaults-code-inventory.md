# Pre-change defaults: code-derived inventory

Generated 2026-10-24T03:12:38.512Z from the source before the defaults changes, without relying on
project documentation. See [the decision ledger and implementation](defaults-investigation.md)
for the approved replacements.

This records existing behavior, not approved replacements or independently verified legal rules.
Unspecified is different from an explicit blank or zero. Synthetic probes below expose conditional defaults; they do not describe the user.

## offer

| Field                   | Label                                                                          | Stored constructor default |
| ----------------------- | ------------------------------------------------------------------------------ | -------------------------- |
| estimateMode            | Calculation model                                                              | "standard"                 |
| employment              | Employment type                                                                | Unspecified                |
| employer                | Employer or client                                                             | Unspecified                |
| role                    | Role                                                                           | Unspecified                |
| amount                  | Base salary or revenue (AUD)                                                   | Unspecified                |
| unit                    | Quoted unit                                                                    | "annual"                   |
| paidUnits               | Annual paid / billable hours or days                                           | Unspecified                |
| inclusion               | Base amount includes super?                                                    | Unspecified                |
| weeklyHours             | Standard paid hours per week                                                   | Unspecified                |
| weeks                   | Standard weeks per year                                                        | "52"                       |
| payFrequency            | Pay frequency                                                                  | "fortnightly"              |
| threshold               | Claim the tax-free threshold from this payer?                                  | Unspecified                |
| tfnProvided             | TFN supplied to this payer?                                                    | Unspecified                |
| noPaygAdjustments       | Ordinary payroll, with no withholding variations or adjustments?               | Unspecified                |
| regularPay              | Base cash is paid in equal ordinary pay periods?                               | Unspecified                |
| ordinaryPayroll         | Ordinary employee withholding rules apply?                                     | Unspecified                |
| periodSacrifice         | Representative pay period: salary sacrifice to super (AUD)                     | Unspecified                |
| periodPersonalSuper     | Representative pay period: personal super deducted (AUD)                       | "0"                        |
| periodOtherDeductions   | Representative pay period: other payroll deductions (AUD)                      | "0"                        |
| reportableBenefitsOffer | Reportable fringe benefits from this offer (AUD)                               | "0"                        |
| reportableSuperOffer    | Reportable super from this offer for the selected income year (AUD)            | Unspecified                |
| reportableSuperSameYear | All entered annual salary sacrifice is reportable in the selected income year? | Unspecified                |
| annualLeave             | Annual leave entitlement (weeks)                                               | Unspecified                |
| ordinaryLeave           | Ordinary 4-week annual leave entitlement confirmed?                            | Unspecified                |
| terms                   | Contract / classification notes                                                | Unspecified                |
| superRate               | Employer super (%)                                                             | "12"                       |
| superEligible           | Base cash eligible for employer super?                                         | Unspecified                |
| superLimit              | Employer contribution limit                                                    | "statutory"                |
| sacrifice               | Annual salary sacrificed to super (AUD)                                        | "0"                        |
| personalSuper           | Annual non-deducted personal super (AUD)                                       | "0"                        |
| evenSuper               | 2025–26 eligible earnings are evenly allocated across all four quarters?       | Unspecified                |
| ordinaryFund            | Ordinary 15% taxed-fund contribution conditions confirmed?                     | Unspecified                |
| gst                     | Revenue GST basis                                                              | Unspecified                |
| businessCosts           | Annual business cash costs, excluding recoverable GST (AUD)                    | "0"                        |
| businessDeductions      | Established annual business deductions (AUD)                                   | "0"                        |
| eligibleLabour          | Established eligible labour income, included in revenue (AUD)                  | Unspecified                |
| specifiedDeductions     | Specified work deductions included in business deductions (AUD)                | Unspecified                |
| contractorSuper         | Annual hirer-funded super, additional to fees (AUD)                            | "0"                        |
| contractorPersonalSuper | Annual non-deducted personal super contribution (AUD)                          | "0"                        |
| contractorNotes         | GST, PSI/PSB and tax classification evidence                                   | Unspecified                |
| rosterAnchor            | Roster cycle starts                                                            | Unspecified                |
| cycleDays               | Days in repeating cycle                                                        | "7"                        |
| rosterComplete          | Repeating roster is complete?                                                  | Unspecified                |
| holidaysWorked          | Normally work rostered public holidays?                                        | Unspecified                |
| location                | Work-base state and locality                                                   | Unspecified                |
| calendarComplete        | Applicable holiday dates below have been checked?                              | Unspecified                |
| calendarSource          | Holiday calendar source / verification note                                    | Unspecified                |
| tripBasis               | Journey entry                                                                  | "return"                   |
| distance                | Return distance (km)                                                           | Unspecified                |
| minutes                 | Return travel time (minutes)                                                   | Unspecified                |
| outDistance             | Outward distance (km)                                                          | Unspecified                |
| backDistance            | Return-leg distance (km)                                                       | Unspecified                |
| outMinutes              | Outward time (minutes)                                                         | Unspecified                |
| backMinutes             | Return-leg time (minutes)                                                      | Unspecified                |
| costMethod              | Vehicle cost method                                                            | "entered"                  |
| energy                  | Energy units                                                                   | Unspecified                |
| energyPrice             | Override energy price (AUD per litre / kWh)                                    | Unspecified                |
| consumption             | Override consumption per 100 km                                                | Unspecified                |
| maintenance             | Running maintenance per km (AUD)                                               | Unspecified                |
| tripCharges             | Parking, tolls, fares per return journey (AUD)                                 | Unspecified                |
| commuteNotes            | Route, fares and estimate evidence                                             | Unspecified                |

## profile

| Field                    | Label                                                                            | Stored constructor default |
| ------------------------ | -------------------------------------------------------------------------------- | -------------------------- |
| estimateMode             | Calculation model                                                                | "standard"                 |
| resident                 | Full-year Australian tax resident?                                               | Unspecified                |
| adult                    | Adult, ordinary tax treatment (no SAPTO or special rates)?                       | Unspecified                |
| otherIncome              | Other annual assessable income before deductions (AUD)                           | "0"                        |
| otherLabourIncome        | Other eligible labour income, included above (AUD)                               | Unspecified                |
| deductions               | Established other annual deductions (AUD)                                        | "0"                        |
| otherSpecifiedDeductions | Specified work deductions included in other deductions (AUD)                     | Unspecified                |
| workDeductions           | Established employee work deductions (AUD)                                       | "0"                        |
| specifiedWorkDeductions  | Specified deductions included in employee work deductions (AUD)                  | Unspecified                |
| standardDeduction        | Eligible for the 2026–27 employee standard deduction?                            | Unspecified                |
| medicare                 | Medicare circumstances                                                           | Unspecified                |
| hospitalCover            | Appropriate hospital cover for every required family member for the entire year? | Unspecified                |
| single                   | Single with no dependants for the full year?                                     | Unspecified                |
| household                | Established full-year household                                                  | Unspecified                |
| spouseTaxableIncome      | Established spouse taxable income (whole AUD)                                    | Unspecified                |
| spouseMlsIncome          | Established spouse income for Medicare surcharge (whole AUD)                     | Unspecified                |
| levyChildren             | Ordinary levy qualifying child count                                             | Unspecified                |
| mlsChildren              | Medicare surcharge qualifying child count                                        | Unspecified                |
| levyFamilyRelief         | Single with dependants: entitled to ordinary levy family reduction?              | Unspecified                |
| helpFamilyOffer          | HELP section-8 family exception established with this offer?                     | Unspecified                |
| helpFamilyBase           | HELP section-8 family exception established without this offer?                  | Unspecified                |
| assessmentComplete       | No other offsets, charges, special income or assessment adjustments?             | Unspecified                |
| ordinaryMls              | Ordinary Medicare surcharge treatment, without special exclusions?               | Unspecified                |
| mlsLiableDays            | Established Medicare surcharge liable days (0–365)                               | Unspecified                |
| reportableBenefits       | Other reportable fringe benefits, excluding this offer (AUD)                     | "0"                        |
| reportableSuper          | Other reportable super contributions, excluding this offer (AUD)                 | "0"                        |
| investmentLoss           | Net investment losses (AUD)                                                      | "0"                        |
| foreignIncome            | Exempt foreign employment income (AUD)                                           | "0"                        |
| studyLoan                | Repayable study loan?                                                            | Unspecified                |
| loanScheme               | Study loan scheme                                                                | Unspecified                |
| helpEligible             | Ordinary HELP liability and debt conditions established?                         | Unspecified                |
| loanDebt                 | Applicable repayable loan balance (AUD)                                          | Unspecified                |
| taxNotes                 | Special circumstances and source notes                                           | Unspecified                |

## vehicle

| Field       | Label                              | Stored constructor default |
| ----------- | ---------------------------------- | -------------------------- |
| energyPrice | Energy price (AUD per litre / kWh) | Unspecified                |
| consumption | Consumption per 100 km             | Unspecified                |
| source      | Price / consumption evidence       | Unspecified                |

## preferences

| Field      | Label          | Stored constructor default |
| ---------- | -------------- | -------------------------- |
| appearance | Appearance     | "system"                   |
| year       | Financial year | "2026-27"                  |

## comparison

| Field     | Label                                   | Stored constructor default |
| --------- | --------------------------------------- | -------------------------- |
| year      | Financial year                          | "2026-27"                  |
| timeValue | Include monetary travel-time valuation? | "yes"                      |
| baseline  | Baseline offer ID                       | Unspecified                |

## Row: earnings

| Field      | Label                           |
| ---------- | ------------------------------- |
| label      | Description                     |
| amount     | Annual amount (AUD)             |
| inclusion  | Includes super?                 |
| eligible   | Eligible for super?             |
| included   | Already included in base quote? |
| certainty  | Certainty                       |
| recurrence | Recurrence                      |
| taxClass   | Tax character                   |

## Row: perks

| Field     | Label                |
| --------- | -------------------- |
| label     | Perk                 |
| amount    | Personal value (AUD) |
| frequency | Value frequency      |

## Row: costs

| Field         | Label                       |
| ------------- | --------------------------- |
| label         | Cost                        |
| amount        | Cash paid (AUD)             |
| reimbursement | Separately reimbursed (AUD) |
| frequency     | Cost frequency              |
| recurrence    | Recurrence                  |

## Row: roster

| Field    | Label                                                       |
| -------- | ----------------------------------------------------------- |
| day      | Cycle day (starts at 1)                                     |
| start    | Start time (HH:MM)                                          |
| hours    | Continuous worked hours (split blocks around unpaid breaks) |
| place    | Attendance                                                  |
| journeys | Return journeys                                             |

## Row: exceptions

| Field    | Label                     |
| -------- | ------------------------- |
| date     | Date                      |
| kind     | Exception type            |
| hours    | Worked hours on this date |
| place    | Attendance                |
| journeys | Return journeys           |
| label    | Reason / leave            |

## Row: holidays

| Field | Label                    |
| ----- | ------------------------ |
| date  | Holiday date             |
| start | Starts (HH:MM)           |
| hours | Holiday duration (hours) |
| label | Holiday and locality     |

## Row: offers

| Field   | Label    |
| ------- | -------- |
| offerId | Offer ID |

## Row: taxOverride

| Field                    | Label                                                                            |
| ------------------------ | -------------------------------------------------------------------------------- |
| estimateMode             | Calculation model                                                                |
| resident                 | Full-year Australian tax resident?                                               |
| adult                    | Adult, ordinary tax treatment (no SAPTO or special rates)?                       |
| otherIncome              | Other annual assessable income before deductions (AUD)                           |
| otherLabourIncome        | Other eligible labour income, included above (AUD)                               |
| deductions               | Established other annual deductions (AUD)                                        |
| otherSpecifiedDeductions | Specified work deductions included in other deductions (AUD)                     |
| workDeductions           | Established employee work deductions (AUD)                                       |
| specifiedWorkDeductions  | Specified deductions included in employee work deductions (AUD)                  |
| standardDeduction        | Eligible for the 2026–27 employee standard deduction?                            |
| medicare                 | Medicare circumstances                                                           |
| hospitalCover            | Appropriate hospital cover for every required family member for the entire year? |
| single                   | Single with no dependants for the full year?                                     |
| household                | Established full-year household                                                  |
| spouseTaxableIncome      | Established spouse taxable income (whole AUD)                                    |
| spouseMlsIncome          | Established spouse income for Medicare surcharge (whole AUD)                     |
| levyChildren             | Ordinary levy qualifying child count                                             |
| mlsChildren              | Medicare surcharge qualifying child count                                        |
| levyFamilyRelief         | Single with dependants: entitled to ordinary levy family reduction?              |
| helpFamilyOffer          | HELP section-8 family exception established with this offer?                     |
| helpFamilyBase           | HELP section-8 family exception established without this offer?                  |
| assessmentComplete       | No other offsets, charges, special income or assessment adjustments?             |
| ordinaryMls              | Ordinary Medicare surcharge treatment, without special exclusions?               |
| mlsLiableDays            | Established Medicare surcharge liable days (0–365)                               |
| reportableBenefits       | Other reportable fringe benefits, excluding this offer (AUD)                     |
| reportableSuper          | Other reportable super contributions, excluding this offer (AUD)                 |
| investmentLoss           | Net investment losses (AUD)                                                      |
| foreignIncome            | Exempt foreign employment income (AUD)                                           |
| studyLoan                | Repayable study loan?                                                            |
| loanScheme               | Study loan scheme                                                                |
| helpEligible             | Ordinary HELP liability and debt conditions established?                         |
| loanDebt                 | Applicable repayable loan balance (AUD)                                          |
| taxNotes                 | Special circumstances and source notes                                           |

## Calculation-time additions

Source: src/lib/calculations/tax/standard.ts. Explicit existing values, including blanks, take precedence.

### Offer: unanswered; 2025-26; no bonus rows

```json
{
  "ordinaryFund": "yes",
  "specifiedDeductions": "0"
}
```

### Offer: unanswered; 2026-27; no bonus rows

```json
{
  "ordinaryFund": "yes",
  "specifiedDeductions": "0"
}
```

### Offer: full-time; 2025-26; no bonus rows

```json
{
  "evenSuper": "yes",
  "tfnProvided": "yes",
  "ordinaryPayroll": "yes",
  "noPaygAdjustments": "yes",
  "regularPay": "yes",
  "superEligible": "yes",
  "reportableSuperSameYear": "yes",
  "ordinaryFund": "yes",
  "reportableSuperOffer": "0",
  "periodSacrifice": "0",
  "specifiedDeductions": "0"
}
```

### Offer: full-time; 2026-27; no bonus rows

```json
{
  "tfnProvided": "yes",
  "ordinaryPayroll": "yes",
  "noPaygAdjustments": "yes",
  "regularPay": "yes",
  "superEligible": "yes",
  "reportableSuperSameYear": "yes",
  "ordinaryFund": "yes",
  "reportableSuperOffer": "0",
  "periodSacrifice": "0",
  "specifiedDeductions": "0"
}
```

### Offer: sole-trader; 2025-26; no bonus rows

```json
{
  "ordinaryFund": "yes",
  "specifiedDeductions": "0"
}
```

### Offer: sole-trader; 2026-27; no bonus rows

```json
{
  "ordinaryFund": "yes",
  "specifiedDeductions": "0"
}
```

### Profile: household unanswered; employee offer

```json
{
  "standardDeduction": "yes",
  "resident": "yes",
  "adult": "yes",
  "assessmentComplete": "yes",
  "medicare": "ordinary",
  "ordinaryMls": "yes",
  "helpEligible": "yes",
  "otherLabourIncome": "0",
  "otherSpecifiedDeductions": "0",
  "specifiedWorkDeductions": "0"
}
```

### Profile: household single; employee offer

```json
{
  "standardDeduction": "yes",
  "single": "yes",
  "levyChildren": "0",
  "mlsChildren": "0",
  "helpFamilyOffer": "no",
  "helpFamilyBase": "no",
  "resident": "yes",
  "adult": "yes",
  "assessmentComplete": "yes",
  "medicare": "ordinary",
  "ordinaryMls": "yes",
  "helpEligible": "yes",
  "otherLabourIncome": "0",
  "otherSpecifiedDeductions": "0",
  "specifiedWorkDeductions": "0"
}
```

### Profile: household full-year-spouse; employee offer

```json
{
  "standardDeduction": "yes",
  "single": "no",
  "resident": "yes",
  "adult": "yes",
  "assessmentComplete": "yes",
  "medicare": "ordinary",
  "ordinaryMls": "yes",
  "helpEligible": "yes",
  "otherLabourIncome": "0",
  "otherSpecifiedDeductions": "0",
  "specifiedWorkDeductions": "0"
}
```

### Profile: household single-with-dependants; employee offer

```json
{
  "standardDeduction": "yes",
  "single": "no",
  "resident": "yes",
  "adult": "yes",
  "assessmentComplete": "yes",
  "medicare": "ordinary",
  "ordinaryMls": "yes",
  "helpEligible": "yes",
  "otherLabourIncome": "0",
  "otherSpecifiedDeductions": "0",
  "specifiedWorkDeductions": "0"
}
```

### Profile: household other; employee offer

```json
{
  "standardDeduction": "yes",
  "single": "no",
  "resident": "yes",
  "adult": "yes",
  "assessmentComplete": "yes",
  "medicare": "ordinary",
  "ordinaryMls": "yes",
  "helpEligible": "yes",
  "otherLabourIncome": "0",
  "otherSpecifiedDeductions": "0",
  "specifiedWorkDeductions": "0"
}
```

### Profile: full-year appropriate hospital cover entered

```json
{
  "mlsLiableDays": "0",
  "standardDeduction": "yes",
  "resident": "yes",
  "adult": "yes",
  "assessmentComplete": "yes",
  "medicare": "ordinary",
  "ordinaryMls": "yes",
  "helpEligible": "yes",
  "otherLabourIncome": "0",
  "otherSpecifiedDeductions": "0",
  "specifiedWorkDeductions": "0"
}
```

## Scope notes

- Constructor source: src/lib/data/schema.ts:newRecord. All item collections start absent and read as empty arrays.
- Row construction source: src/lib/components/record-editor.svelte:add. Earnings rows start with included=no and taxClass=ordinary; every other row field is unspecified.
- These probes list additions for the named contexts only. All conditional branches and callers require the accompanying manual audit.

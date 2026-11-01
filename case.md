# Case guide

Research expansion: [fields, calculations, metrics and acceptance cases](research/case-requirements.md),
with a separate [ATO review](research/ato/case-guide-review.md). The original guide follows.

This is purely a guide and is not to be strict in any way for the salary calculator, you are to determine all of the fields, calculations, and values for the salary calculator. You are to determine other fields and calculations that are not listed here that are relevant for comparisons. The rule of thumb is that you should track every single type of variable so that all calculations are possible via passing in relevant variables to small functions.

## Fields

Requires at least a field for:
- Salary (boolean for if includes superannuation)
- Bonuses (boolean for if includes superannuation) (all things like frequency, amount, etc.)
- Weekly hours
- Remote days per week
- Travel duration a day (time it takes to travel to and from work in hours)
- Travel distance a day (distance it takes to travel to and from work in hours)
- Travel cost:
  - Manual:
    - Fuel cost per litre
    - Fuel cost per 1 km
    - Travel maintenance cost per 1 km
  - ATO cents-per-kilometre rate (use dropdown of fiscal year rates; default to `2026-2027`)
- Pay frequency (default to fortnightly)
- Weeks paid annual leave (default to `4`)

## Calculations

There are to be calculations for all areas including a complete package value which includes extras like:
- Total annual superannuation contribution
- Total annual tax contribution
- Total annual after-tax amount (amount that is paid to the employee bank account)
- Total annual travel direct cost (`Travel cost` section)
- Effective totals like hourly rate, etc.
- Total annual travel indirect cost (hourly rate * travel duration)

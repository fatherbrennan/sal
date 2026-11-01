# Independent component arithmetic

Checked with ordinary JavaScript arithmetic through the research tool on 2026-10-22. No project commands, application code, Bun tests or personal data were used. These calculations verify arithmetic against identified inputs, not statutory eligibility, final assessed rounding, full tax liability, payroll or browser behavior.

## Ordinary resident bands

Synthetic full-year resident ordinary taxable income; 2026–27 bands from [F01 / T01](facts.md#f01--ordinary-individual-income-tax-bands). Results exclude deductions, offsets, Medicare, loans and all special-income treatment.

| Taxable income | Raw basic band tax |
| -------------- | ------------------ |
| $18,200        | $0                 |
| $18,201        | $0.15              |
| $45,000        | $4,020             |
| $45,001        | $4,020.30          |
| $135,000       | $31,020            |
| $190,000       | $51,370            |

Independent band-sum check at $135,000: `$26,800 × 0.15 + $90,000 × 0.30 = $31,020`. No final take-home figure follows from this table.

## HELP marginal bands

Synthetic 2026–27 repayment income; eligible HELP case, sufficient statutory debt, no relevant family exemption. Formula/threshold evidence: [F06 / T12–T13](facts.md#f06--help-repayment-income-and-marginal-repayment). Figures are before unverified assessment rounding.

| Repayment income | Raw formula amount after 10% ceiling |
| ---------------- | ------------------------------------ |
| $69,528          | $0                                   |
| $69,529          | $0.15                                |
| $129,717         | $9,028.35                            |
| $129,718         | $9,028.52                            |

Upper-bound continuity: `(129,717 − 69,528) × 0.15 = 9,028.35`; the next dollar adds $0.17, not $0.32. For repayment income $100,000 and statutory repayable debt $100, the debt-limited raw result is $100. This is not a claim about an arbitrary bank/app loan balance.

## Super base and standard deduction

From [F07 / T18](facts.md#f07--employer-super-and-contractors), `floor((32,500 × 100 ÷ 12) ÷ 10) × 10 = 270,830`. Multiplying that rounded base by 12% gives $32,499.60. A personal concessional cap and employer-specific base are not interchangeable.

From [F02 / T02–T07](facts.md#f02--deductions-and-the-standard-work-deduction), for an eligible synthetic person with $50,000 assessable labour income and $600 of specified deductions, the additional standard deduction is $400. With $1,200 specified deductions it is $0. These examples do not establish eligibility of an expense or the person's full deductions.

## Deliberately not validated

No full take-home calculation, PayCalculator comparison, tax-return rounding, special regime, family MLS case, payroll schedule implementation or application test has been validated. Future tests need independent expected results, supported dates, all required inputs and documented exclusions. Test authoring remains subject to the project's approved task scripts and mandatory write-tests skill.

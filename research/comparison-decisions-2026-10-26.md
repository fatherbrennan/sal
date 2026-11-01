# Accepted comparison selection — 26 October 2026

Display order and the separate leave presentation below were subsequently superseded by the
[approved comparison redesign](comparison-redesign-2026-10-26.md). This remains the historical
selection record; its calculation boundaries still apply except where that later record says otherwise.

The user approved implementation of the reviewed recommendations from
[COMPARISON_NOTES.md](../COMPARISON_NOTES.md). That catalogue retains all 102 candidates.
This record distinguishes the implemented selection from deferred models.

## Primary comparison

The user's subsequent order supersedes the earlier A2/A5/A7/H4/H5/H6 headline selection:
1. Package value before tax and costs.
2. Package value after tax.
3. Cash + super after tax.
4. Cash + super after tax per paid hour.
5. Package value after tax and commuting costs.
6. Package value after tax, commuting costs and time.

All after-tax values are component estimates. Perks retain personal values without a generic
tax conversion. The user explicitly included fuel/electricity, maintenance, parking, tolls and
fares in commuting costs. The broader ATO alternative remains labelled. Other job costs stay
outside the last two headline totals; all six previous headlines remain in **After all job costs**.
Baseline differences and recursively linked equations remain available.

Cash plus super is calculated directly. An unknown perk value cannot block that financial total.
Super is restricted retirement value, includes employee-directed contributions, and estimates net
contributions rather than account growth. Personal transfers do not become extra employer reward.

## Supporting and conditional detail

- Cash after tax plus personal perks is now a separate pay subtotal. Contractor operating costs
  remain deducted from cash before personal tax; commuting-only does not reverse those expenses.
  H2 provides cash plus net super per standard paid hour. Existing worked/paid hourly
  variants remain accessible without adding every possible numerator/denominator permutation.
- C1–C6 show commuting, other and total unreimbursed costs, the cost share, per-trip cost and
  reimbursements. Total costs include contractor business costs, deducted from net cash only once.
  Reimbursement coverage concerns extra-cost rows only. A known reimbursement remains available
  in an incomplete expense draft; unknown expenses still block net costs and coverage. Mixed ATO
  broader estimates and entered running costs receive an explicit comparison warning.
- T1–T3/T6/T7 show worked hours, commute hours, combined hours, remote share and on-site days.
  T4 and trip counts remain detail. These hours exclude unpaid breaks; they are not a complete
  measure of constrained availability or unpaid additional work unless the roster records it.
- A8/A9/T10 remain in **Time valuation**. The after-tax time rate now includes net super and
  excludes personal perks. Personal after-tax transfers cannot change this combined rate.
  A negative or unknown combined rate leaves monetary time value unavailable; disabled valuation
  or known zero commute hours gives zero. Negative cash remains visible. Gross time value retains
  its existing gross-package basis. Paid and worked-plus-commute denominators remain separate.
- D1–D6 remain inline deltas. D7/D8 require strictly positive extra hours; negative reward remains
  negative. D9 requires both cash surrendered and hours saved. A conditional summary names cash
  and work-plus-travel directions, without declaring an overall winner (D14).
- B1–B6/B8 retain remuneration destinations and representative payroll detail; HELP remains
  distinct from income tax. B7 is in tax detail. No annual/withholding double deduction is added.
- S1–S3/S6 retain scenario controls; S4 shows contingent cash upside. S5 shows contingent **net cash**
  as a share of positive target cash, with no probability assumption. A share can exceed 100% when
  guaranteed cash is negative. Zero, negative or unknown target cash leaves the share unavailable.
- L1 stays visible; L2–L4 remain in the separate leave breakdown. Leave entitlement is neither
  extra salary nor assumed leave taken. No new leave payout or tax rule is introduced.
- Q1–Q8 and practical contract/leave considerations use the existing persisted `terms` field,
  now exposed as **Offer conditions and fit** and shown beside offers. Users can record schedule,
  workload, team, career, role, travel reliability, benefit usefulness and restrictions. These are
  unscored notes, not verified facts inferred from a salary or a new monetary model.
- X9 shows sole-trader revenue excluding GST less business cash costs before personal tax.
  It is not taxable profit or a receipt forecast. X10's net work-hour view uses the existing roster;
  users must include non-billable work for a complete denominator. Billable utilisation is not inferred.

## Deferred or excluded

C7 receives no new stand-alone tax-saving credit: supported deductions already affect recalculated
tax. C8 allocated vehicle ownership costs remain excluded from entered costs; the approved broader
ATO alternative remains explicit. A10 debt-inclusive accounting is deferred; HELP is still visible.

D10–D13 break-even solvers, S7–S10 uncertainty/sensitivity models, B9/B10 dated cash flows,
household models X1–X3, transition/equity/future/capacity models X4–X8/X11–X13 and X14 fund-cost
allocations require additional inputs or independently verified rules. Further time, availability,
leave and hourly variants remain candidate detail rather than invented calculations. Notes can
record qualitative context without pretending to measure these models.

## Evidence and compatibility

No tax rate, withholding formula, dependency, storage schema or network boundary changed.
Calculation version `2026-10-26-components-2` and backup rule version `2026-10-26.2` identify the
derived-result changes. Saved inputs and unknowns remain intact. The dedicated ATO reviewer checked
money destinations, contractor costs, reimbursements, time guards and directional trade-offs;
its concrete corrections were applied and regression-tested. Existing component-estimate limits
remain; this review does not certify a complete tax assessment or every special fund circumstance.

Verification results are recorded in [IMPLEMENTATION.md](../IMPLEMENTATION.md).

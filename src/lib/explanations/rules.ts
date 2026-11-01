const payRuleSections = {
  cappedSuper: "employer_super_earnings_limit * 12 / 100",
  totals: "annual_eligible_cash_before_cap = sum(selected_pay_item_eligible_cash_before_cap)",
  bonuses: `Only selected guaranteed/target and recurring/one-off payments are included. A bonus already
inside the base quote is not added again. If the base contains excluded target/one-off pay, the
dependent split is unavailable; the calculator cannot silently remove that unknown share.`,
  cap: `A capped split requires established quarterly allocation in 2025–26, the minimum 12% rate and a common quote basis among eligible components. Explicitly ineligible components contribute zero eligible earnings and remain in total cash and remuneration.
Mixed eligible quote bases or higher contractual rates remain unavailable when the cap changes the split. Independent all-inclusive remuneration or all-exclusive cash remains available when established; unknown inputs never become zero.`,
};

const calendarRules = `milliseconds_per_hour = 3600000
milliseconds_per_day = 24 * milliseconds_per_hour
days_since_roster_anchor = round((calendar_date_ms - roster_anchor_ms) / milliseconds_per_day)
cycle_day = ((days_since_roster_anchor % days_in_cycle + days_in_cycle) % days_in_cycle) + 1
shift_start_ms = calendar_date_ms + (shift_start_hour + shift_start_minute / 60) * milliseconds_per_hour
shift_end_ms = shift_start_ms + (shift_worked_hours + shift_unpaid_break_minutes / 60) * milliseconds_per_hour
break_start_ms = calendar_date_ms + (shift_break_start_hour + shift_break_start_minute / 60) * milliseconds_per_hour
If break_start_ms < shift_start_ms, add milliseconds_per_day to break_start_ms.
break_end_ms = break_start_ms + shift_unpaid_break_minutes / 60 * milliseconds_per_hour
retained_work_intervals = roster_shift_intervals minus union(unpaid_breaks, excluded_holidays,
  calendar_dates_replaced_by_exceptions)
annual_work_hours = sum(hours_in_financial_year(retained_work_intervals))
  + sum(exception_work_hours_in_financial_year)
annual_remote_work_hours = sum(remote_hours_in_financial_year)
hours_in_financial_year(interval) = max(0, min(financial_year_end_ms, interval_end_ms)
  - max(financial_year_start_ms, interval_start_ms)) / milliseconds_per_hour
annual_on_site_days = count(distinct_retained_on_site_shift_start_dates_in_financial_year)
  + count(on_site_exception_dates_with_positive_hours_in_financial_year)
annual_return_journeys = sum(journeys_of_retained_shifts_starting_in_financial_year)
  + sum(exception_journeys_in_financial_year)

Calendar timestamps encode entered civil dates/times on fixed 24-hour days, not daylight-saving
elapsed time. round means nearest integer, with a half toward positive infinity.
The financial year is 1 July through 30 June. Clip work intervals to those boundaries, including
overnight work. Count each interval overlap only once. Breaks do not create another journey.
When holidays are normally worked, do not remove holiday intervals. Each dated exception replaces
the roster on its calendar date; a replacement start date also removes that shift's original trips.
Count a retained shift's trips once when some work remains, including after a partial holiday.
Remote shifts have zero trips. Leave entitlement alone removes no work or trips.
Overlapping shifts, incomplete roster/holiday confirmation or incomplete entries block totals.`;

const recurringRules = `annual_personal_perk_value = sum(annual_personal_perk_values)
annual_other_job_costs = sum(included_net_job_costs)
annual_other_job_cost_reimbursements = sum(included_job_cost_reimbursements)

Each item retains its own frequency and entered values. One-off costs enter only an including-one-offs scenario, once, without annual multiplication. Reimbursements cannot exceed their own cost. Perks are additive personal values, not bank deposits or automatic tax deductions. Empty lists total zero.`;

const superRules = `annual_super_contributions = annual_employer_super + annual_salary_sacrifice + annual_personal_super_contribution
annual_net_super_contributions = (annual_employer_super + annual_salary_sacrifice) * (1 - 15 / 100) + annual_personal_super_contribution
annual_super_contribution_tax = annual_super_contributions - annual_net_super_contributions

This requires the ordinary taxed-accumulation contribution model. Non-deducted personal super is
a transfer, not another 15%-taxed contribution here. Special fund, excess-cap and Division 293
adjustments, LISTO/other offsets and fund fees/earnings are outside this model. This is a net
contribution estimate, not actual account growth. Unknown fund treatment leaves net super unavailable.`;

export { calendarRules, payRuleSections, recurringRules, superRules };

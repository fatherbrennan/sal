const variableOrigins: Readonly<Record<string, string>> = Object.fromEntries([
  [
    "remote_hours_in_financial_year",
    "Retained remote roster work after removing breaks, holidays and replaced dates, clipped to the financial year, plus remote exception worked hours. Zero-hour leave is not remote work.",
  ],
  [
    "annual_salary_sacrifice",
    "Offer → Pay details → annual pre-tax salary sacrifice. Sole-trader scenarios use zero salary sacrifice.",
  ],
  [
    "annual_personal_super_contribution",
    "Offer → annual personal super payment from after-tax cash. Sole-traders use their separately entered personal contribution.",
  ],
  [
    "annual_business_cash_costs",
    "Contractor offer → entered annual business cash costs, deducted from revenue before the personal-tax comparison.",
  ],
  [
    "standard_paid_hours_per_week",
    "Offer → Pay details → standard paid hours per week. This is independent of roster attendance.",
  ],
  ["standard_weeks_per_year", "Offer → Pay details → entered annual conversion weeks."],
  [
    "return_distance_km",
    "Offer → Commuting costs → total distance for home → work → home, in kilometres. Separate-leg entry uses the outward plus homeward equation.",
  ],
  [
    "return_minutes",
    "Offer → Commuting costs → total minutes for home → work → home. Separate-leg entry uses the outward plus homeward equation.",
  ],
  ["outward_distance_km", "Offer → Commuting costs → outward distance, in kilometres."],
  ["homeward_distance_km", "Offer → Commuting costs → homeward distance, in kilometres."],
  ["outward_minutes", "Offer → Commuting costs → outward travel time, in minutes."],
  ["homeward_minutes", "Offer → Commuting costs → homeward travel time, in minutes."],
  ["maintenance_per_km", "Offer → Commuting costs → running maintenance amount per kilometre."],
  [
    "charges_per_return_trip",
    "Offer → Commuting costs → parking, tolls and other charges per complete return trip.",
  ],
  ["days_in_cycle", "Offer → Work pattern → number of days in the repeating roster cycle."],
  [
    "roster_anchor_ms",
    "Offer → Work pattern → cycle start date, encoded as midnight UTC milliseconds for civil-date arithmetic.",
  ],
  [
    "calendar_date_ms",
    "The civil date being expanded from the repeating roster, encoded as midnight UTC milliseconds. Expansion includes the day before the financial year for overnight work.",
  ],
  [
    "financial_year_start_ms",
    "Midnight at 1 July starting the selected financial year, encoded as UTC milliseconds.",
  ],
  [
    "financial_year_end_ms",
    "Midnight at the following 1 July, the exclusive end of the selected financial year, encoded as UTC milliseconds.",
  ],
  ["shift_start_hour", "The hour part of this roster row's entered start time."],
  ["shift_start_minute", "The minute part of this roster row's entered start time."],
  ["shift_worked_hours", "This roster row's entered worked hours, excluding its unpaid break."],
  [
    "shift_unpaid_break_minutes",
    "This roster row's entered unpaid break length in minutes. Rows without a break use zero.",
  ],
  ["shift_break_start_hour", "The hour part of this roster row's entered unpaid-break start time."],
  [
    "shift_break_start_minute",
    "The minute part of this roster row's entered unpaid-break start time.",
  ],
  [
    "shift_return_journeys",
    "This roster row's entered complete home → work → home trips. Remote or zero-work rows require zero trips.",
  ],
  [
    "roster_worked_hours",
    "The worked-hours entries from the repeating roster rows. A normal-week total requires a representable seven-day pattern.",
  ],
  [
    "roster_rows_with_positive_worked_hours",
    "Roster rows whose entered worked hours exceed zero; the weekly presentation requires one row per weekday.",
  ],
  [
    "on_site_roster_rows_with_positive_worked_hours",
    "Roster rows with on-site attendance and entered worked hours greater than zero.",
  ],
  [
    "journeys_for_roster_rows_with_positive_worked_hours",
    "The journey counts entered against roster rows whose worked hours exceed zero.",
  ],
  [
    "roster_shift_intervals",
    "Each matching cycle day's roster rows expanded to [shift_start_ms, shift_end_ms]. Rows are matched using cycle_day, then sorted by start time. Overlap makes the calendar unavailable.",
  ],
  [
    "unpaid_breaks",
    "For each expanded shift, its [break_start_ms, break_end_ms] interval. No interval is removed when the unpaid break is zero.",
  ],
  [
    "excluded_holidays",
    "Confirmed holiday intervals from the offer's calendar when holidays are not normally worked; otherwise an empty list. Each interval uses its entered date, start time and duration.",
  ],
  [
    "calendar_dates_replaced_by_exceptions",
    "The complete civil-day intervals [date, date + milliseconds_per_day] for entered dated exceptions. They replace roster work even when the replacement has zero hours.",
  ],
  [
    "interval",
    "One interval in retained_work_intervals, after subtracting breaks, applicable holidays and replacement dates.",
  ],
  [
    "interval_start_ms",
    "The starting timestamp of the retained interval currently being clipped to the financial year.",
  ],
  [
    "interval_end_ms",
    "The ending timestamp of the retained interval currently being clipped to the financial year.",
  ],
  [
    "exception_work_hours_in_financial_year",
    "Entered worked hours of dated exceptions whose dates fall within the financial year. Each exception replaces that date's roster.",
  ],
  [
    "exception_journeys_in_financial_year",
    "Entered return journeys of dated exceptions whose dates fall within the financial year.",
  ],
  [
    "distinct_retained_on_site_shift_start_dates_in_financial_year",
    "Unique on-site shift start dates within the financial year, excluding replaced start dates and shifts with no work remaining after interval removal.",
  ],
  [
    "on_site_exception_dates_with_positive_hours_in_financial_year",
    "Dated exceptions within the financial year with on-site attendance and entered worked hours greater than zero.",
  ],
  [
    "journeys_of_retained_shifts_starting_in_financial_year",
    "Entered journeys counted once per shift starting within the financial year, only when some work remains and its start date has not been replaced by an exception.",
  ],
]);

export { variableOrigins };

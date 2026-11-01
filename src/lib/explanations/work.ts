import { attendance, type CalendarResult } from "../calculations/calendar.ts";
import { rows, value } from "../calculations/inputs.ts";
import type { Fields, SalRecord } from "../data/model.d.ts";
import { numeric } from "../data/numeric.ts";
import { finishTime } from "../data/work-pattern.ts";
import { type Equation, explanation } from "./model.ts";
import { calendarRules } from "./rules.ts";

function durationRule(hours: string): string {
  return `displayed_duration_minutes = floor(${hours} * 60 + 0.5)
displayed_whole_hours = floor(displayed_duration_minutes / 60)
displayed_remaining_minutes = displayed_duration_minutes % 60
Display duration in hours/minutes; retain the original hours for calculations.`;
}

function patternEquation(record: SalRecord, year: string): Equation {
  let calendar: CalendarResult | null = null;
  if (year === "2025-26" || year === "2026-27") {
    calendar = attendance(record, year);
  }
  const roster = rows(record, "roster");
  const equation = explanation(
    "Repeating pattern and financial-year calendar",
    `normal_week_hours = sum(roster_worked_hours)
normal_week_workdays = count(roster_rows_with_positive_worked_hours)
normal_week_on_site_days = count(on_site_roster_rows_with_positive_worked_hours)
normal_week_return_journeys = sum(journeys_for_roster_rows_with_positive_worked_hours)
These weekly formulas require a complete, representable seven-day pattern. Custom cycles are
labelled by cycle length and are not silently scaled to a normal week.`,
    {
      rosterWorkedHours: roster.map(({ fields }) => numeric(fields, "hours")),
      journeysForRosterRowsWithPositiveWorkedHours: roster
        .filter(({ fields }) => (numeric(fields, "hours") ?? 0) > 0)
        .map(({ fields }) => numeric(fields, "journeys")),
      daysInCycle: numeric(record.fields, "cycleDays"),
      annualWorkHours: calendar?.hours ?? null,
      annualOnSiteDays: calendar?.onsiteDays ?? null,
      annualReturnJourneys: calendar?.journeys ?? null,
    },
    [`Selected financial year: ${year || "unknown"}.`, ...(calendar?.notes ?? [])],
  );
  return {
    ...equation,
    sections: [
      {
        title: "Financial-year calendar",
        formula: calendarRules,
        values: Object.fromEntries([
          ["annual_work_hours", calendar?.hours ?? null],
          ["annual_on_site_days", calendar?.onsiteDays ?? null],
          ["annual_return_journeys", calendar?.journeys ?? null],
          ["days_in_cycle", numeric(record.fields, "cycleDays")],
        ]),
      },
      {
        title: "Weekly duration display",
        scope: "weekly_duration",
        formula: durationRule("normal_week_hours"),
      },
      {
        title: "Annual duration display",
        scope: "annual_duration",
        formula: durationRule("annual_work_hours"),
      },
    ],
  };
}

function shiftEquation(fields: Fields, day: string): Equation {
  let breakMinutes: number | null = 0;
  if (Object.hasOwn(fields, "breakMinutes")) {
    breakMinutes = numeric(fields, "breakMinutes");
  }
  return {
    ...explanation(
      `${day} work and finish time`,
      `shift_start_minutes = shift_start_hour * 60 + shift_start_minute
shift_finish_minutes = floor(shift_start_minutes + shift_worked_hours * 60 + shift_unpaid_break_minutes + 0.5)
shift_clock_minutes = shift_finish_minutes % 1440
shift_finish_hour = floor(shift_clock_minutes / 60)
shift_finish_minute = shift_clock_minutes % 60
If shift_finish_minutes >= 1440, label the time "next day". Display clock parts with two digits.`,
      {
        shiftStartHour: value(fields, "start").split(":")[0] || null,
        shiftStartMinute: value(fields, "start").split(":")[1] || null,
        shiftWorkedHours: numeric(fields, "hours"),
        shiftUnpaidBreakMinutes: breakMinutes,
        shiftReturnJourneys: numeric(fields, "journeys"),
        displayedResult: finishTime(fields),
      },
    ),
    sections: [
      { title: "Shift duration display", formula: durationRule("shift_worked_hours") },
      {
        title: "Shift journeys",
        formula: "",
        values: Object.fromEntries([["shift_return_journeys", numeric(fields, "journeys")]]),
        notes: [
          "An unpaid break does not add a trip. Remote or zero-work shifts have zero journeys.",
        ],
      },
    ],
  };
}

function paidHoursEquation(hours: number | null): Equation {
  return explanation(
    "Standard paid hours per week",
    durationRule("standard_paid_hours_per_week"),
    { standardPaidHoursPerWeek: hours },
    ["This formats the entered paid-hours value. It does not derive paid hours from the roster."],
  );
}

export { paidHoursEquation, patternEquation, shiftEquation };

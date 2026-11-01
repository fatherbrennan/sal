import type { Item, SalRecord } from "../data/model.d.ts";
import { numeric } from "../data/numeric.ts";
import { validDate } from "../data/validation.ts";
import { rows, value } from "./inputs.ts";
import type { TaxYear } from "./tax/types.d.ts";

interface CalendarResult {
  hours: number | null;
  remoteHours: number | null;
  journeys: number | null;
  onsiteDays: number | null;
  notes: string[];
}
type Interval = readonly [number, number];
interface Shift {
  interval: Interval;
  breaks: readonly Interval[];
  journeys: number;
  onsite: boolean;
}
const dayHours = 24;
const hourMs = 3_600_000;
const dayMs = dayHours * hourMs;
const minutesPerHour = 60;
const yearDigits = 4;
const unavailable: CalendarResult = {
  hours: null,
  remoteHours: null,
  journeys: null,
  onsiteDays: null,
  notes: ["Complete the roster, dated exceptions and applicable holiday calendar."],
};
function dateTime(date: string): number {
  return Date.parse(`${date}T00:00:00Z`);
}
function clockHours(clock: string): number {
  const [hour, minute] = clock.split(":").map(Number);
  if (hour === undefined || minute === undefined) {
    return Number.NaN;
  }
  return hour + minute / minutesPerHour;
}
function interval(item: Item, day: number): Interval | null {
  const hours = numeric(item.fields, "hours");
  const start = clockHours(value(item.fields, "start"));
  if (hours === null || !Number.isFinite(start)) {
    return null;
  }
  const from = day + start * hourMs;
  return [from, from + hours * hourMs];
}
function subtract(spans: readonly Interval[], removed: Interval): Interval[] {
  const result: Interval[] = [];
  for (const [start, end] of spans) {
    if (removed[1] <= start || removed[0] >= end) {
      result.push([start, end]);
    } else {
      if (removed[0] > start) {
        result.push([start, removed[0]]);
      }
      if (removed[1] < end) {
        result.push([removed[1], end]);
      }
    }
  }
  return result;
}
function holidayIntervals(record: SalRecord): Interval[] | null {
  const result: Interval[] = [];
  for (const item of rows(record, "holidays")) {
    const date = value(item.fields, "date");
    const span = interval(item, dateTime(date));
    if (!validDate(date) || span === null) {
      return null;
    }
    result.push(span);
  }
  return result;
}
function shiftsOn(record: SalRecord, day: number, anchor: number, cycle: number): Shift[] | null {
  const dayIndex = Math.round((day - anchor) / dayMs);
  const cycleDay = (((dayIndex % cycle) + cycle) % cycle) + 1;
  const result: Shift[] = [];
  for (const item of rows(record, "roster")) {
    if (numeric(item.fields, "day") === null) {
      return null;
    }
    if (numeric(item.fields, "day") === cycleDay) {
      const shift = rosterShift(item, day);
      if (shift === null) {
        return null;
      }
      result.push(shift);
    }
  }
  return result;
}
function rosterShift(item: Item, day: number): Shift | null {
  const worked = interval(item, day);
  const journeys = numeric(item.fields, "journeys");
  const place = value(item.fields, "place");
  let minutes: number | null = 0;
  if (Object.hasOwn(item.fields, "breakMinutes")) {
    minutes = numeric(item.fields, "breakMinutes");
  }
  if (
    worked === null ||
    journeys === null ||
    !place ||
    minutes === null ||
    (place === "remote" && journeys !== 0)
  ) {
    return null;
  }
  const span: Interval = [worked[0], worked[1] + (minutes / minutesPerHour) * hourMs];
  if (span[1] - span[0] > dayMs) {
    return null;
  }
  const breaks: Interval[] = [];
  if (minutes > 0) {
    let from = day + clockHours(value(item.fields, "breakStart")) * hourMs;
    if (from < span[0]) {
      from += dayMs;
    }
    const to = from + (minutes / minutesPerHour) * hourMs;
    if (!Number.isFinite(from) || to > span[1]) {
      return null;
    }
    breaks.push([from, to]);
  }
  return { interval: span, breaks, journeys, onsite: place === "onsite" };
}
function exceptions(record: SalRecord): Map<number, Item> | null {
  const result = new Map<number, Item>();
  for (const item of rows(record, "exceptions")) {
    const date = value(item.fields, "date");
    const day = dateTime(date);
    const hours = numeric(item.fields, "hours");
    const journeys = numeric(item.fields, "journeys");
    const place = value(item.fields, "place");
    if (!validDate(date) || hours === null || journeys === null || !place || result.has(day)) {
      return null;
    }
    if ((place === "remote" || hours === 0) && journeys !== 0) {
      return null;
    }
    result.set(day, item);
  }
  return result;
}
function countShifts(
  shifts: readonly Shift[],
  removed: readonly Interval[],
  [start, end]: Interval,
  replaced: ReadonlyMap<number, Item>,
): CalendarResult {
  let hours = 0;
  let remoteHours = 0;
  let journeys = 0;
  const onsite = new Set<number>();
  let previousEnd = Number.NEGATIVE_INFINITY;
  for (const shift of shifts) {
    if (shift.interval[0] < previousEnd) {
      return { ...unavailable, notes: ["Roster work blocks overlap. Correct the roster."] };
    }
    [, previousEnd] = shift.interval;
    let spans: Interval[] = [shift.interval];
    for (const removedSpan of [...shift.breaks, ...removed]) {
      spans = subtract(spans, removedSpan);
    }
    const worked = retainedHours(spans, start, end);
    hours += worked;
    if (!shift.onsite) {
      remoteHours += worked;
    }
    const shiftDay = Math.floor(shift.interval[0] / dayMs) * dayMs;
    if (
      !replaced.has(shiftDay) &&
      shiftDay >= start &&
      shiftDay < end &&
      spans.some(([a, b]) => b > a)
    ) {
      journeys += shift.journeys;
      if (shift.onsite) {
        onsite.add(shiftDay);
      }
    }
  }
  return { hours, remoteHours, journeys, onsiteDays: onsite.size, notes: [] };
}
function retainedHours(spans: readonly Interval[], start: number, end: number): number {
  return spans.reduce(
    (sum, span) => sum + Math.max(0, Math.min(end, span[1]) - Math.max(start, span[0])) / hourMs,
    0,
  );
}
function attendance(record: SalRecord, year: TaxYear): CalendarResult {
  const anchorText = value(record.fields, "rosterAnchor");
  const cycle = numeric(record.fields, "cycleDays");
  const holidaysWorked = value(record.fields, "holidaysWorked");
  const holidays = holidayIntervals(record);
  const dated = exceptions(record);
  if (
    !validDate(anchorText) ||
    cycle === null ||
    cycle < 1 ||
    !holidaysWorked ||
    value(record.fields, "calendarComplete") !== "yes" ||
    value(record.fields, "rosterComplete") !== "yes" ||
    holidays === null ||
    dated === null
  ) {
    return unavailable;
  }
  const firstYear = Number(year.slice(0, yearDigits));
  const start = dateTime(`${firstYear}-07-01`);
  const end = dateTime(`${firstYear + 1}-07-01`);
  const anchor = dateTime(anchorText);
  const shifts: Shift[] = [];
  for (let day = start - dayMs; day < end; day += dayMs) {
    const daily = shiftsOn(record, day, anchor, cycle);
    if (daily === null) {
      return unavailable;
    }
    shifts.push(...daily);
  }
  shifts.sort((a, b) => a.interval[0] - b.interval[0]);
  let removed: Interval[] = [];
  if (holidaysWorked === "no") {
    removed = [...holidays];
  }
  for (const day of dated.keys()) {
    removed.push([day, day + dayMs]);
  }
  const result = countShifts(shifts, removed, [start, end], dated);
  return addExceptions(result, dated, start, end);
}
function addExceptions(
  result: CalendarResult,
  dated: Map<number, Item>,
  start: number,
  end: number,
): CalendarResult {
  if (
    result.hours === null ||
    result.remoteHours === null ||
    result.journeys === null ||
    result.onsiteDays === null
  ) {
    return result;
  }
  for (const [, item] of [...dated].filter(([day]) => day >= start && day < end)) {
    result.hours += numeric(item.fields, "hours") ?? 0;
    if (value(item.fields, "place") === "remote") {
      result.remoteHours += numeric(item.fields, "hours") ?? 0;
    }
    result.journeys += numeric(item.fields, "journeys") ?? 0;
    if (value(item.fields, "place") === "onsite" && (numeric(item.fields, "hours") ?? 0) > 0) {
      result.onsiteDays += 1;
    }
  }
  if (
    ![...dated].some(
      ([day, item]) => day >= start && day < end && value(item.fields, "kind") === "leave",
    )
  ) {
    result.notes.push(
      "No dates are identified as leave in this financial year. Only entered dated exceptions reduce attendance; leave entitlement is not deducted.",
    );
  }
  result.notes.push(
    "Calendar uses your roster and confirmed holiday entries; dated exceptions replace that date's roster.",
  );
  return result;
}

export type { CalendarResult };
export { attendance };

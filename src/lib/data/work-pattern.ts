import { rows, value } from "../calculations/inputs.ts";
import type { Fields, Item, SalRecord } from "./model.d.ts";
import { numeric } from "./numeric.ts";
import { validDate } from "./validation.ts";

const daysPerWeek = 7;
const minutesPerHour = 60;
const minutesPerDay = 1440;
const names = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
interface Weekday {
  name: string;
  day: number;
  item: Item | undefined;
}

function shiftEnd(fields: Fields): number | null {
  const start = value(fields, "start");
  const hours = numeric(fields, "hours");
  let breakMinutes: number | null = 0;
  if (Object.hasOwn(fields, "breakMinutes")) {
    breakMinutes = numeric(fields, "breakMinutes");
  }
  if (start === "" || hours === null || breakMinutes === null) {
    return null;
  }
  const [hour = "", minute = ""] = start.split(":");
  return Number(hour) * minutesPerHour + Number(minute) + hours * minutesPerHour + breakMinutes;
}

function finishTime(fields: Fields): string {
  const end = shiftEnd(fields);
  if (end === null) {
    return "Unavailable";
  }
  const rounded = Math.round(end);
  const clock = rounded % minutesPerDay;
  const hour = String(Math.floor(clock / minutesPerHour)).padStart(2, "0");
  const minute = String(clock % minutesPerHour).padStart(2, "0");
  let suffix = "";
  if (rounded >= minutesPerDay) {
    suffix = " next day";
  }
  return `${hour}:${minute}${suffix}`;
}

function duration(hours: number | null): string {
  if (hours === null) {
    return "Unavailable";
  }
  const minutes = Math.round(hours * minutesPerHour);
  const whole = Math.floor(minutes / minutesPerHour);
  const remainder = minutes % minutesPerHour;
  if (remainder === 0) {
    return `${whole} h`;
  }
  return `${whole} h ${remainder} min`;
}

function weeklyDays(record: SalRecord): Weekday[] | null {
  const anchor = value(record.fields, "rosterAnchor");
  if (numeric(record.fields, "cycleDays") !== daysPerWeek || !validDate(anchor)) {
    return null;
  }
  const byDay = new Map<number, Item>();
  for (const item of rows(record, "roster")) {
    const day = numeric(item.fields, "day");
    const journeys = numeric(item.fields, "journeys");
    const place = value(item.fields, "place");
    const end = shiftEnd(item.fields);
    if (
      day === null ||
      day < 1 ||
      day > daysPerWeek ||
      byDay.has(day) ||
      (end !== null && end >= minutesPerDay) ||
      (journeys !== null &&
        ((place === "onsite" && journeys !== 1) || (place === "remote" && journeys !== 0)))
    ) {
      return null;
    }
    byDay.set(day, item);
  }
  const anchorDay = new Date(`${anchor}T00:00:00Z`).getUTCDay();
  return names.map((name, index) => {
    const day = ((index + 1 - anchorDay + daysPerWeek) % daysPerWeek) + 1;
    return { name, day, item: byDay.get(day) };
  });
}

function changeWorkFields(fields: Fields, key: string, next: string | undefined): Fields {
  const result = { ...fields };
  if (next === undefined) {
    delete result[key];
  } else {
    result[key] = next;
  }
  if (key === "place" && (next === "remote" || numeric(fields, "hours") === 0)) {
    return { ...result, journeys: "0" };
  }
  if (key === "place" && next === "onsite" && value(fields, "place") !== "onsite") {
    return { ...result, journeys: "1" };
  }
  if (key === "hours" && next !== "" && next !== undefined && Number(next) === 0) {
    return { ...result, journeys: "0" };
  }
  if (
    key === "journeys" &&
    Number(next) > 0 &&
    (value(fields, "place") === "remote" || numeric(fields, "hours") === 0)
  ) {
    throw new Error("Remote or non-working days must have zero home–work–home trips.");
  }
  return result;
}

export type { Weekday };
export { changeWorkFields, duration, finishTime, weeklyDays };

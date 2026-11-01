import { choices, type Field, field, select } from "./helpers.ts";

const rosterFields: readonly Field[] = [
  field("day", "Cycle day (starts at 1)"),
  field("start", "Start time (HH:MM)", "text"),
  field("hours", "Work hours, excluding unpaid break"),
  field("breakStart", "Unpaid break starts (HH:MM)", "text"),
  field("breakMinutes", "Unpaid break (minutes)"),
  select(
    "place",
    "Attendance",
    choices([
      ["onsite", "On site"],
      ["remote", "Remote"],
    ]),
  ),
  field("journeys", "Home–work–home trips"),
];

export { rosterFields };

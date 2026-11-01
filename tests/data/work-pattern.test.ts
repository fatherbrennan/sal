import { expect, it } from "bun:test";
import { resolveOffer } from "../../src/lib/data/defaults.ts";
import { newRecord } from "../../src/lib/data/schema.ts";
import {
  changeWorkFields,
  duration,
  finishTime,
  weeklyDays,
} from "../../src/lib/data/work-pattern.ts";

const now = "2026-10-24T00:00:00.000Z";
function offer() {
  return resolveOffer(
    newRecord("offer", "pattern", now),
    newRecord("preferences", "preferences", now).fields,
    {},
  );
}
it("projects named weekdays without changing the anchored roster or its identities", () => {
  const record = offer();
  const snapshot = structuredClone(record);
  expect(
    weeklyDays(record)?.map(({ name, item }) => {
      const { day } = item?.fields ?? {};
      return [name, day];
    }),
  ).toEqual([
    ["Monday", "1"],
    ["Tuesday", "2"],
    ["Wednesday", "3"],
    ["Thursday", "4"],
    ["Friday", "5"],
    ["Saturday", undefined],
    ["Sunday", undefined],
  ]);
  const wednesday = { ...record, fields: { ...record.fields, rosterAnchor: "2026-07-01" } };
  expect(weeklyDays(wednesday)?.[0]).toMatchObject({ name: "Monday", day: 6, item: undefined });
  expect(record).toEqual(snapshot);
});
it("keeps rotating, overnight, multiple-block and unusual-trip patterns in the custom editor", () => {
  const record = offer();
  expect(weeklyDays({ ...record, fields: { ...record.fields, cycleDays: "14" } })).toBeNull();
  expect(weeklyDays({ ...record, fields: { ...record.fields, rosterAnchor: "" } })).toBeNull();
  const { roster } = record.items;
  const row = roster?.[0];
  expect(row).toBeDefined();
  if (row === undefined) {
    throw new Error("Missing approved weekday");
  }
  for (const fields of [
    { day: "" },
    { day: "0" },
    { day: "8" },
    { start: "22:00" },
    { journeys: "2" },
    { place: "remote" },
  ]) {
    expect(
      weeklyDays({
        ...record,
        items: { roster: [{ ...row, fields: { ...row.fields, ...fields } }] },
      }),
    ).toBeNull();
  }
  expect(
    weeklyDays({ ...record, items: { roster: [row, { ...row, id: "second-block" }] } }),
  ).toBeNull();
  expect(
    weeklyDays({ ...record, items: { roster: [{ ...row, fields: { day: "1" } }] } }),
  ).not.toBeNull();
});
it("keeps work duration distinct from elapsed time and displays overnight finishes", () => {
  expect(finishTime({ start: "09:00", hours: "7.6", breakMinutes: "30" })).toBe("17:06");
  expect(finishTime({ start: "22:00", hours: "8" })).toBe("06:00 next day");
  expect(finishTime({ start: "09:00", hours: "8", breakMinutes: "" })).toBe("Unavailable");
  expect(finishTime({})).toBe("Unavailable");
  const workingDay = 7.6;
  const workingWeek = 38;
  expect(duration(workingDay)).toBe("7 h 36 min");
  expect(duration(workingWeek)).toBe("38 h");
  expect(duration(null)).toBe("Unavailable");
});
it("changes attendance and trips together without altering times or extra-trip choices", () => {
  const fields = { place: "onsite", journeys: "2", hours: "8", start: "09:00" };
  const remote = changeWorkFields(fields, "place", "remote");
  expect(remote).toEqual({ ...fields, place: "remote", journeys: "0" });
  expect(changeWorkFields(remote, "place", "onsite")).toEqual({ ...fields, journeys: "1" });
  expect(changeWorkFields({ ...remote, hours: "0" }, "place", "onsite")).toMatchObject({
    place: "onsite",
    journeys: "0",
  });
  expect(changeWorkFields(fields, "place", "onsite")).toEqual(fields);
  expect(changeWorkFields(fields, "hours", "0")).toMatchObject({ hours: "0", journeys: "0" });
  expect(changeWorkFields(fields, "hours", "")).toMatchObject({ hours: "", journeys: "2" });
  expect(changeWorkFields(fields, "start", undefined)).not.toHaveProperty("start");
  expect(() => changeWorkFields(remote, "journeys", "1")).toThrow("zero");
  expect(() => changeWorkFields({ ...fields, hours: "0" }, "journeys", "1")).toThrow("zero");
  expect(changeWorkFields(remote, "journeys", "0")).toEqual(remote);
  expect(fields).toHaveProperty("journeys", "2");
});

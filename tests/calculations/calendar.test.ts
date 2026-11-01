import { expect, it } from "bun:test";
import { attendance } from "../../src/lib/calculations/calendar.ts";
import { offer } from "./package-fixture.ts";

const shift = {
  id: "wednesday",
  fields: { day: "1", start: "09:00", hours: "8", place: "onsite", journeys: "1" },
};
const expected = {
  wednesdayHours: 424,
};

it("removes unpaid break time once and preserves a trip after a partial holiday", () => {
  const record = offer();
  const workday = {
    ...shift,
    fields: { ...shift.fields, hours: "7.6", breakStart: "12:30", breakMinutes: "30" },
  };
  record.items = {
    roster: [workday],
    holidays: [
      {
        id: "morning",
        fields: {
          date: "2026-07-08",
          start: "09:00",
          hours: "4",
        },
      },
    ],
  };
  const expectedHours = 399.3;
  const expectedTrips = 53;
  expect(attendance(record, "2026-27").hours).toBeCloseTo(expectedHours);
  expect(attendance(record, "2026-27").journeys).toBe(expectedTrips);
  record.items = {
    roster: [workday],
    holidays: [
      {
        id: "lunch",
        fields: {
          date: "2026-07-08",
          start: "12:30",
          hours: "0.5",
        },
      },
    ],
  };
  const fullHours = 402.8;
  expect(attendance(record, "2026-27").hours).toBeCloseTo(fullHours);
  for (const fields of [
    { breakMinutes: "" },
    { breakStart: "" },
    { breakStart: "20:00" },
    { hours: "24" },
  ]) {
    record.items = { roster: [{ ...workday, fields: { ...workday.fields, ...fields } }] };
    expect(attendance(record, "2026-27").hours).toBeNull();
  }
  record.fields = { ...record.fields, rosterAnchor: "2026-06-30" };
  record.items = {
    roster: [
      {
        ...workday,
        fields: { ...workday.fields, start: "22:00", hours: "8", breakStart: "02:00" },
      },
    ],
  };
  const overnightHours = 422;
  expect(attendance(record, "2026-27").hours).toBe(overnightHours);
});

it("clips remote overnight work and excludes its unpaid break", () => {
  const record = offer({ rosterAnchor: "2026-06-30" });
  record.items = {
    roster: [
      {
        ...shift,
        fields: {
          ...shift.fields,
          place: "remote",
          journeys: "0",
          start: "22:00",
          hours: "8",
          breakStart: "02:00",
          breakMinutes: "30",
        },
      },
    ],
  };
  const expectedHours = 422;
  expect(attendance(record, "2026-27")).toMatchObject({
    remoteHours: expectedHours,
    hours: expectedHours,
    journeys: 0,
  });
});

it("uses the actual financial-year calendar without deducting leave entitlement", () => {
  const record = offer({ annualLeave: "4" });
  record.items = { roster: [shift] };
  expect(attendance(record, "2026-27")).toMatchObject({ hours: 424, journeys: 53, onsiteDays: 53 });
  expect(attendance(record, "2026-27").notes).toContain(
    "No dates are identified as leave in this financial year. Only entered dated exceptions reduce attendance; leave entitlement is not deducted.",
  );
  record.items = {
    roster: [shift],
    exceptions: [
      {
        id: "leave",
        fields: { date: "2026-07-01", kind: "leave", hours: "0", journeys: "0", place: "remote" },
      },
    ],
  };
  expect(attendance(record, "2026-27")).toMatchObject({ hours: 416, journeys: 52, onsiteDays: 52 });
  expect(attendance(record, "2026-27").notes.some((note) => note.startsWith("No dates"))).toBe(
    false,
  );
});
it("unions overlapping partial holidays and retains a trip for a partially worked shift", () => {
  const record = offer();
  const holiday = { id: "holiday", fields: { date: "2026-07-08", start: "10:00", hours: "4" } };
  record.items = { roster: [shift], holidays: [holiday, { ...holiday, id: "duplicate" }] };
  expect(attendance(record, "2026-27")).toMatchObject({ hours: 420, journeys: 53 });
  record.items = {
    ...record.items,
    holidays: [
      holiday,
      { id: "full", fields: { date: "2026-07-15", start: "00:00", hours: "24" } },
    ],
  };
  expect(attendance(record, "2026-27")).toMatchObject({ hours: 412, journeys: 52 });
  record.fields = { ...record.fields, holidaysWorked: "yes" };
  expect(attendance(record, "2026-27").hours).toBe(expected.wednesdayHours);
});
it("clips overnight work at financial-year boundaries and rejects overlapping work blocks", () => {
  const record = offer({ rosterAnchor: "2026-06-30" });
  record.items = { roster: [{ ...shift, fields: { ...shift.fields, start: "22:00" } }] };
  expect(attendance(record, "2026-27")).toMatchObject({ hours: 422, journeys: 52 });
  record.items = { roster: [shift, { ...shift, id: "overlap" }] };
  expect(attendance(record, "2026-27").hours).toBeNull();
});
it("applies dated remote work and ignores exceptions outside the chosen financial year", () => {
  const record = offer();
  const exception = {
    id: "remote",
    fields: { date: "2026-07-01", hours: "4", journeys: "0", place: "remote" },
  };
  record.items = {
    roster: [shift],
    exceptions: [
      exception,
      { id: "outside", fields: { ...exception.fields, date: "2025-01-01" } },
      { id: "extra", fields: { date: "2026-07-02", hours: "2", journeys: "1", place: "onsite" } },
    ],
  };
  expect(attendance(record, "2026-27")).toMatchObject({ hours: 422, journeys: 53, onsiteDays: 53 });
  expect(attendance(record, "2026-27")).toMatchObject({ remoteHours: 4 });
});
it("keeps incomplete calendar facts unavailable", () => {
  for (const fields of [
    { rosterAnchor: "" },
    { cycleDays: "" },
    { cycleDays: "0" },
    { holidaysWorked: "" },
    { calendarComplete: "no" },
    { rosterComplete: "" },
  ]) {
    expect(attendance(offer(fields), "2026-27")).toMatchObject({ hours: null, remoteHours: null });
  }
  const record = offer();
  for (const fields of [
    { day: "" },
    { start: "" },
    { hours: "" },
    { journeys: "" },
    { place: "" },
    { place: "remote" },
  ]) {
    record.items = { roster: [{ ...shift, fields: { ...shift.fields, ...fields } }] };
    expect(attendance(record, "2026-27").hours).toBeNull();
  }
  record.items = { holidays: [{ id: "bad", fields: { date: "2026-02-30" } }] };
  expect(attendance(record, "2026-27").hours).toBeNull();
});
it("rejects ambiguous dated exceptions and invalid journey counts", () => {
  const record = offer();
  const base = {
    id: "dated",
    fields: { date: "2026-07-01", hours: "8", journeys: "1", place: "onsite" },
  };
  for (const fields of [
    { date: "" },
    { hours: "" },
    { journeys: "" },
    { place: "" },
    { place: "remote" },
    { hours: "0" },
  ]) {
    record.items = { exceptions: [{ ...base, fields: { ...base.fields, ...fields } }] };
    expect(attendance(record, "2026-27").hours).toBeNull();
  }
  record.items = { exceptions: [base, { ...base, id: "duplicate" }] };
  expect(attendance(record, "2026-27").hours).toBeNull();
  record.items = {
    roster: [{ ...shift, fields: { ...shift.fields, place: "remote", journeys: "0" } }],
  };
  expect(attendance(record, "2026-27").journeys).toBe(0);
  expect(attendance(record, "2026-27")).toMatchObject({ remoteHours: 424 });
});
it("replaces journeys on an overnight shift's start date without removing next-day work", () => {
  const record = offer();
  record.items = {
    roster: [{ ...shift, fields: { ...shift.fields, start: "22:00" } }],
    exceptions: [
      { id: "changed", fields: { date: "2026-07-01", hours: "4", journeys: "0", place: "remote" } },
    ],
  };
  expect(attendance(record, "2026-27")).toMatchObject({ hours: 420, journeys: 52, onsiteDays: 52 });
});

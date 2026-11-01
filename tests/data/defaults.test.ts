import { expect, it } from "bun:test";
import { attendance } from "../../src/lib/calculations/calendar.ts";
import { commute } from "../../src/lib/calculations/costs.ts";
import { defaultRoster, newItemFields, resolveOffer } from "../../src/lib/data/defaults.ts";
import { saHolidays } from "../../src/lib/data/sa-holidays.ts";
import { newRecord, readRecord, validateReferences } from "../../src/lib/data/schema.ts";

const now = "2026-10-24T00:00:00.000Z";

it("shared offer defaults use the approved SA full-time starting values", () => {
  const record = newRecord("preferences", "preferences", now);
  expect(record.fields).toMatchObject({
    employment: "full-time",
    weeklyHours: "38",
    weeks: "52",
    unit: "annual",
    payFrequency: "fortnightly",
    threshold: "yes",
    annualLeave: "4",
    superRate: "12",
    superLimit: "statutory",
    ordinaryFund: "yes",
    holidaysWorked: "no",
    tripBasis: "return",
    costMethod: "entered",
    maintenance: "0",
    tripCharges: "0",
    start: "09:00",
    breakStart: "12:30",
    breakMinutes: "30",
    place: "onsite",
    journeys: "1",
  });
  for (const key of ["amount", "inclusion", "distance", "minutes"]) {
    expect(record.fields).not.toHaveProperty(key);
  }
});

it("new offers inherit defaults without storing them as local overrides", () => {
  const offer = newRecord("offer", "new-offer", now);
  expect(offer.name).toBe("");
  expect(offer.fields).toEqual({});
  expect(offer.items).toEqual({});
});

it("shared personal and vehicle defaults retain unknown price and consumption", () => {
  expect(newRecord("profile", "profile", now).fields).toMatchObject({
    household: "single",
    hospitalCover: "no",
    studyLoan: "no",
    mlsLiableDays: "365",
  });
  const vehicle = newRecord("vehicle", "vehicle", now);
  expect(vehicle.fields).toHaveProperty("energy", "fuel");
  expect(vehicle.fields).not.toHaveProperty("energyPrice");
  expect(vehicle.fields).not.toHaveProperty("consumption");
});

it("recalculates inherited defaults while preserving explicit overrides, blanks and source records", () => {
  const defaults = newRecord("preferences", "preferences", now).fields;
  const offer = newRecord("offer", "inherited", now);
  const before = structuredClone({ defaults, offer });
  const vehicle = { energy: "fuel", energyPrice: "1.98765", consumption: "8" };
  const initial = resolveOffer(offer, defaults, vehicle);
  expect(initial.fields).toMatchObject({ weeklyHours: "38", energyPrice: "1.98765" });
  expect(initial.fields).not.toHaveProperty("appearance");
  expect(initial.fields).not.toHaveProperty("year");
  const { roster } = initial.items;
  const weekdays = 5;
  expect(roster).toHaveLength(weekdays);
  expect(roster?.[0]?.fields).toMatchObject({
    hours: "7.6",
    start: "09:00",
    breakStart: "12:30",
    breakMinutes: "30",
    journeys: "1",
  });
  expect(initial.items).not.toHaveProperty("earnings");
  expect(readRecord(initial)).toEqual(initial);
  const changed = { ...defaults, weeklyHours: "40" };
  const { roster: changedRoster } = resolveOffer(offer, changed, vehicle).items;
  expect(changedRoster?.[0]?.fields).toHaveProperty("hours", "8");
  const overridden = { ...offer, fields: { weeklyHours: "35", energyPrice: "", sacrifice: "0" } };
  const resolved = resolveOffer(overridden, changed, vehicle);
  expect(resolved.fields).toMatchObject({ weeklyHours: "35", energyPrice: "", sacrifice: "0" });
  const { roster: overriddenRoster } = resolved.items;
  expect(overriddenRoster?.[0]?.fields).toHaveProperty("hours", "7");
  expect({ defaults, offer }).toEqual(before);
  expect(
    resolveOffer({ ...offer, fields: { employment: "casual" } }, defaults, vehicle).fields,
  ).not.toHaveProperty("annualLeave");
  expect(
    resolveOffer({ ...offer, items: { roster: [], holidays: [] } }, defaults, vehicle).items,
  ).toMatchObject({ roster: [], holidays: [] });
  expect(resolveOffer(offer, {}, {}).fields).toHaveProperty("energy", "");
});

it("keeps fuel units separate from electricity overrides and preserves explicit unknown prices", () => {
  const defaults = newRecord("preferences", "preferences", now).fields;
  const vehicle = { energy: "fuel", energyPrice: "2", consumption: "8" };
  const offer = newRecord("offer", "vehicle-override", now);
  offer.fields = { distance: "40", minutes: "60" };
  const resolved = resolveOffer(offer, defaults, vehicle);
  const trips = 100;
  const expectedCost = 640;
  expect(commute(resolved.fields, vehicle, trips, "2026-27").cash).toBe(expectedCost);
  const electric = resolveOffer(
    { ...offer, fields: { ...offer.fields, energy: "electric" } },
    defaults,
    vehicle,
  );
  expect(electric.fields).not.toHaveProperty("energyPrice");
  expect(electric.fields).not.toHaveProperty("consumption");
  expect(commute(electric.fields, vehicle, trips, "2026-27").cash).toBeNull();
  expect(
    commute({ ...resolved.fields, energyPrice: "" }, vehicle, trips, "2026-27").cash,
  ).toBeNull();
  expect(commute({ ...resolved.fields, energyPrice: "0" }, vehicle, trips, "2026-27").cash).toBe(0);
});

it("uses the verified SA calendar without assumed annual leave or extra ANZAC holidays", () => {
  const offer = resolveOffer(
    newRecord("offer", "calendar", now),
    newRecord("preferences", "preferences", now).fields,
    { energy: "fuel" },
  );
  const expected = { weekdays: 261, weekdayHolidays: 9, workdays: 252, workHours: 1915.2 };
  expect(expected.weekdays - expected.weekdayHolidays).toBe(expected.workdays);
  for (const year of ["2025-26", "2026-27"] as const) {
    const calendar = attendance(offer, year);
    expect(calendar.journeys).toBe(expected.workdays);
    expect(calendar.onsiteDays).toBe(expected.workdays);
    expect(calendar.hours).toBeCloseTo(expected.workHours);
  }
  const holidays = saHolidays();
  const expectedHolidayCount = 29;
  expect(holidays).toHaveLength(expectedHolidayCount);
  const partialHolidayCount = 4;
  expect(holidays.filter(({ fields: { start } }) => start === "19:00")).toHaveLength(
    partialHolidayCount,
  );
  expect(holidays.some(({ fields: { date } }) => date === "2026-12-28")).toBe(true);
  expect(
    holidays.some(({ fields: { date = "" } }) => ["2026-04-27", "2027-04-26"].includes(date)),
  ).toBe(false);
  const absent = {
    ...offer,
    items: {
      ...offer.items,
      exceptions: [
        {
          id: "leave",
          fields: {
            date: "2026-07-01",
            kind: "leave",
            hours: "0",
            place: "remote",
            journeys: "0",
          },
        },
      ],
    },
  };
  expect(attendance(absent, "2026-27").journeys).toBe(expected.workdays - 1);
});

it("preserves configured breaks and generates remote weekdays without inventing missing inputs", () => {
  expect(defaultRoster({}, {})[0]?.fields).toMatchObject({ hours: "", start: "", journeys: "" });
  const defaults = newRecord("preferences", "preferences", now).fields;
  expect(defaultRoster({ weeklyHours: "10" }, defaults)[0]?.fields).toMatchObject({
    hours: "2",
    breakMinutes: "30",
  });
  expect(
    defaultRoster({ weeklyHours: "38" }, { ...defaults, place: "remote" })[0]?.fields,
  ).toHaveProperty("journeys", "0");
});

it("creates only explicitly requested extra items with the approved presets", () => {
  expect(newItemFields("earnings")).toEqual({
    eligible: "yes",
    included: "no",
    taxClass: "ordinary",
  });
  expect(newItemFields("perks")).toEqual({ frequency: "annual" });
  expect(newItemFields("costs")).toEqual({
    frequency: "annual",
    recurrence: "recurring",
    reimbursement: "0",
  });
  expect(newItemFields("exceptions")).toEqual({});
});

it("validates breaks and inherited relationships before accepting stored records", () => {
  const offer = newRecord("offer", "validate-defaults", now);
  const row = {
    id: "day",
    fields: {
      day: "1",
      start: "09:00",
      hours: "8",
      breakStart: "12:30",
      breakMinutes: "30",
      place: "onsite",
      journeys: "1",
    },
  };
  for (const fields of [{ hours: "24" }, { breakStart: "20:00" }]) {
    expect(() =>
      readRecord({
        ...offer,
        items: { roster: [{ ...row, fields: { ...row.fields, ...fields } }] },
      }),
    ).toThrow();
  }
  const defaults = newRecord("preferences", "preferences", now);
  const vehicle = newRecord("vehicle", "vehicle", now);
  const draft = readRecord({
    ...offer,
    items: { roster: [{ id: "incomplete-day", fields: { day: "1" } }] },
  });
  expect(
    attendance(resolveOffer(draft, defaults.fields, vehicle.fields), "2026-27").hours,
  ).toBeNull();
  expect(() => validateReferences([defaults, vehicle, offer])).not.toThrow();
  expect(() =>
    readRecord({ ...defaults, fields: { ...defaults.fields, breakStart: "20:00" } }),
  ).toThrow("unpaid break");
  expect(() => validateReferences([{ ...offer, fields: { cycleDays: "3" } }])).toThrow(
    "cycle length",
  );
  const reporting = {
    ...offer,
    fields: { reportableSuperSameYear: "yes", reportableSuperOffer: "0" },
  };
  expect(() =>
    validateReferences([
      { ...defaults, fields: { ...defaults.fields, sacrifice: "1000" } },
      reporting,
    ]),
  ).toThrow();
});

import { sharedKeys } from "../fields/defaults.ts";
import { offerSections } from "../fields/offer.ts";
import type { Fields, Item, SalRecord } from "./model.d.ts";
import { holidaySource, saHolidays } from "./sa-holidays.ts";

const weekdays = 5;
const mondayAnchor = "2025-06-30";
const leavePayDefaults: Readonly<Fields> = { leaveRateBasis: "salary" };
const offerDefaultKeys = new Set([
  ...sharedKeys,
  "rosterAnchor",
  "cycleDays",
  "rosterComplete",
  "calendarComplete",
  "location",
  "calendarSource",
  "energy",
  "energyPrice",
  "consumption",
]);

function defaultRoster(fields: Fields, defaults: Fields): Item[] {
  const { weeklyHours = "" } = fields;
  const { start = "", breakStart = "", breakMinutes = "", place = "", journeys = "" } = defaults;
  let hours = "";
  if (weeklyHours !== "") {
    hours = String(Number(weeklyHours) / weekdays);
  }
  let trips = journeys;
  if (place === "remote") {
    trips = "0";
  }
  return Array.from({ length: weekdays }, (_, index) => ({
    id: `weekday-${index + 1}`,
    fields: {
      day: String(index + 1),
      start,
      hours,
      breakStart,
      breakMinutes,
      place,
      journeys: trips,
    },
  }));
}

function resolveOffer(offer: SalRecord, defaults: Fields, vehicle: Fields): SalRecord {
  const sharedDefaults = { ...leavePayDefaults, ...defaults };
  let shared: Fields = Object.fromEntries(
    offerSections
      .flatMap((section) => section.fields)
      .filter(({ key }) => Object.hasOwn(sharedDefaults, key))
      .map(({ key }) => [key, sharedDefaults[key] ?? ""]),
  );
  const { employment = "" } = { ...shared, ...offer.fields };
  if (["casual", "sole-trader"].includes(employment)) {
    shared = Object.fromEntries(Object.entries(shared).filter(([key]) => key !== "annualLeave"));
  }
  const { energy: sharedEnergy = "" } = vehicle;
  const fields: Fields = {
    rosterAnchor: mondayAnchor,
    cycleDays: "7",
    rosterComplete: "yes",
    calendarComplete: "yes",
    location: "South Australia",
    calendarSource: holidaySource,
    ...shared,
    energy: sharedEnergy,
    ...offer.fields,
  };
  const { energy } = fields;
  if (energy === sharedEnergy) {
    for (const key of ["energyPrice", "consumption"]) {
      if (!Object.hasOwn(offer.fields, key) && Object.hasOwn(vehicle, key)) {
        fields[key] = vehicle[key] ?? "";
      }
    }
  }
  return {
    ...offer,
    fields,
    items: { roster: defaultRoster(fields, defaults), holidays: saHolidays(), ...offer.items },
  };
}

function newItemFields(group: string): Fields {
  if (group === "earnings") {
    return { included: "no", taxClass: "ordinary", eligible: "yes" };
  }
  if (group === "perks") {
    return { frequency: "annual" };
  }
  if (group === "costs") {
    return { frequency: "annual", recurrence: "recurring", reimbursement: "0" };
  }
  return {};
}

export { defaultRoster, leavePayDefaults, newItemFields, offerDefaultKeys, resolveOffer };

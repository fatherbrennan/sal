import { expect, it } from "bun:test";
import { resolveOffer } from "../../src/lib/data/defaults.ts";
import { newRecord } from "../../src/lib/data/schema.ts";
import { editorSections } from "../../src/lib/fields/editor.ts";

const now = "2026-10-24T00:00:00.000Z";
const coreSectionCount = 4;

it("groups quote, super and pay-basis fields before work and commuting without changing data", () => {
  const offer = resolveOffer(
    newRecord("offer", "order", now),
    newRecord("preferences", "preferences", now).fields,
    {},
  );
  const original = structuredClone(offer);
  const sections = editorSections(offer);
  expect(sections[0]?.fields.map(({ key }) => key)).toEqual([
    "employment",
    "unit",
    "amount",
    "inclusion",
    "superRate",
    "superLimit",
    "weeklyHours",
    "weeks",
    "payFrequency",
  ]);
  expect(sections.map(({ title }) => title).slice(0, coreSectionCount)).toEqual([
    "Pay details",
    "Work calendar",
    "Paid annual leave",
    "Commuting costs",
  ]);
  expect(offer).toEqual(original);
});

it("orders shared defaults by pay, work and commuting with year first and font size last", () => {
  const record = newRecord("preferences", "preferences", now);
  const original = structuredClone(record);
  const keys = editorSections(record).flatMap(({ fields }) => fields.map(({ key }) => key));
  expect(keys[0]).toBe("year");
  expect(keys.at(-1)).toBe("fontSize");
  expect(keys.indexOf("weeklyHours")).toBeLessThan(keys.indexOf("start"));
  expect(keys.indexOf("start")).toBeLessThan(keys.indexOf("tripBasis"));
  expect(keys.indexOf("annualLeave")).toBeLessThan(keys.indexOf("tripBasis"));
  expect(keys.indexOf("tripBasis")).toBeLessThan(keys.indexOf("sacrifice"));
  expect(new Set(keys).size).toBe(keys.length);
  expect(record).toEqual(original);
});

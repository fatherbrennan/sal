import { expect, it } from "bun:test";
import { newRecord, readRecord } from "../../src/lib/data/schema.ts";
import { editorSections } from "../../src/lib/fields/editor.ts";

const now = "2026-10-28T00:00:00.000Z";
it("defaults page width to 100% and accepts every five-percent step from 20%", () => {
  const preferences = newRecord("preferences", "preferences", now);
  expect(preferences.fields).toMatchObject({ pageWidth: "100" });
  for (const pageWidth of [
    "20",
    "25",
    "30",
    "35",
    "40",
    "45",
    "50",
    "55",
    "60",
    "65",
    "70",
    "75",
    "80",
    "85",
    "90",
    "95",
    "100",
  ]) {
    expect(
      readRecord({ ...preferences, fields: { ...preferences.fields, pageWidth } }).fields,
    ).toMatchObject({ pageWidth });
  }
  expect(
    editorSections(preferences)
      .flatMap((section) => section.fields)
      .some(({ key }) => key === "pageWidth"),
  ).toBe(false);
});
it("rejects invalid page widths without changing the existing preferences", () => {
  const preferences = newRecord("preferences", "preferences", now);
  for (const pageWidth of ["0", "19", "21", "99", "105", "-20", "NaN", "Infinity", "25.5", "50%"]) {
    expect(() =>
      readRecord({ ...preferences, fields: { ...preferences.fields, pageWidth } }),
    ).toThrow();
  }
  expect(preferences.fields).toMatchObject({ pageWidth: "100" });
});

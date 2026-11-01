import { expect, it } from "bun:test";
import { numeric } from "../../src/lib/data/numeric.ts";
import {
  mergeImport,
  newRecord,
  readBackup,
  readRecord,
  ruleVersion,
  validateReferences,
} from "../../src/lib/data/schema.ts";
import { fieldError, validDate } from "../../src/lib/data/validation.ts";
import { sections } from "../../src/lib/fields.ts";

const now = "2026-10-23T00:00:00.000Z";
const excessiveTextLength = 32_001;
const offer = () => newRecord("offer", "offer-a", now);
const backup = (records: unknown[]) => ({
  schemaVersion: 1,
  exportedAt: now,
  ruleVersion,
  records,
});

it("exports the version-one backup and calculation baseline", () => {
  expect(readBackup(backup([]))).toMatchObject({ schemaVersion: 1, ruleVersion: "1" });
});

it("round-trips the inspector preference with appearance and rejects invalid values", () => {
  const preferences = newRecord("preferences", "preferences", now);
  for (const inspectorPinned of ["yes", "no"]) {
    preferences.fields = { ...preferences.fields, appearance: "dark", inspectorPinned };
    expect(readBackup(backup([preferences])).records[0]?.fields).toMatchObject({
      appearance: "dark",
      inspectorPinned,
    });
  }
  Object.assign(preferences.fields, { inspectorPinned: "sometimes" });
  expect(() => readBackup(backup([preferences]))).toThrow();
});

it("keeps unknown inputs distinct from zero and preserves unit-price precision", () => {
  const record = offer();
  expect(numeric(record.fields, "amount")).toBeNull();
  Object.assign(record.fields, { amount: "0", energyPrice: "1.98765" });
  expect(numeric(readRecord(record).fields, "amount")).toBe(0);
  expect(readRecord(record).fields).toMatchObject({ energyPrice: "1.98765" });
  expect(numeric({ amount: "" }, "amount")).toBeNull();
});
it("validates every field kind without silently coercing invalid input", () => {
  for (const section of sections.offer) {
    for (const definition of section.fields) {
      expect(fieldError(definition, "")).toBeNull();
      expect(fieldError(definition, "x".repeat(excessiveTextLength))).not.toBeNull();
      let valid = "Notes";
      if (definition.type === "decimal") {
        valid = "2";
      }
      if (definition.type === "date") {
        valid = "2026-02-28";
      }
      if (definition.type === "select") {
        valid = definition.options[0]?.value ?? "";
      }
      expect(fieldError(definition, valid)).toBeNull();
    }
  }
  expect(validDate("2025-02-29")).toBe(false);
  expect(validDate("2024-02-29")).toBe(true);
  for (const bad of ["NaN", "Infinity", "-1", "1e6", "9007199254740992"]) {
    expect(() => readRecord({ ...offer(), fields: { amount: bad } })).toThrow();
  }
  expect(() => readRecord({ ...offer(), fields: { rosterAnchor: "2025-02-29" } })).toThrow();
  expect(() => readRecord({ ...offer(), fields: { unit: "minute" } })).toThrow();
  expect(() => readRecord({ ...offer(), fields: { cycleDays: "1.5" } })).toThrow();
  expect(() => readRecord({ ...offer(), fields: { cycleDays: "0" } })).toThrow();
});
it("rejects corrupt metadata, shapes and unsupported backup versions", () => {
  for (const bad of [
    null,
    [],
    1,
    { ...offer(), extra: true },
    { ...offer(), kind: "bad" },
    { ...offer(), name: 1 },
    { ...offer(), revision: -1 },
    { ...offer(), updatedAt: "bad" },
    { ...offer(), id: "!" },
    { ...offer(), fields: { amount: 1 } },
    { ...offer(), fields: { fake: "0" } },
    { ...offer(), items: { fake: [] } },
    { ...offer(), items: { perks: {} } },
  ]) {
    expect(() => readRecord(bad)).toThrow();
  }
  expect(() => readRecord({ ...newRecord("profile", "profile", now), id: "wrong" })).toThrow();
  expect(() => readBackup({ ...backup([]), schemaVersion: 2 })).toThrow();
  expect(() => readBackup({ ...backup([]), records: null })).toThrow();
  expect(readBackup(backup([])).records).toEqual([]);
  for (const kind of ["profile", "vehicle", "preferences", "comparison"] as const) {
    expect(readRecord(newRecord(kind, kind, now)).kind).toBe(kind);
  }
});
it("validates repeating rows, clocks, cycle bounds and duplicate identities", () => {
  const row = {
    id: "row-a",
    fields: { day: "1", start: "09:00", hours: "8", journeys: "1", place: "onsite" },
  };
  const record = { ...offer(), fields: { cycleDays: "7" }, items: { roster: [row] } };
  expect(readRecord(record).items).toMatchObject({ roster: [row] });
  for (const change of [{ day: "8" }, { start: "25:00" }, { hours: "25" }, { journeys: "0.5" }]) {
    expect(() =>
      readRecord({
        ...record,
        items: { roster: [{ ...row, fields: { ...row.fields, ...change } }] },
      }),
    ).toThrow();
  }
  expect(() => readRecord({ ...record, items: { roster: [row, row] } })).toThrow();
  expect(() => readRecord({ ...record, items: { taxOverride: [row, row] } })).toThrow();
  expect(() => readRecord({ ...record, items: { roster: [{ ...row, extra: true }] } })).toThrow();
});
it("validates complete comparison references before importing and requires conflict choices", () => {
  const a = offer();
  const comparison = newRecord("comparison", "compare-a", now);
  Object.assign(comparison.items, { offers: [{ id: "row-a", fields: { offerId: a.id } }] });
  Object.assign(comparison.fields, { baseline: a.id });
  expect(readBackup(backup([a, comparison])).records).toHaveLength(2);
  expect(() => readBackup(backup([comparison]))).toThrow();
  expect(() => validateReferences([a, a])).toThrow();
  expect(() =>
    validateReferences([a, { ...comparison, fields: { baseline: "missing" } }]),
  ).toThrow();
  expect(() =>
    validateReferences([
      a,
      {
        ...comparison,
        items: {
          offers: [
            { id: "a", fields: { offerId: a.id } },
            { id: "b", fields: { offerId: a.id } },
          ],
        },
      },
    ]),
  ).toThrow();
  const imported = { ...a, name: "Changed" };
  expect(() => mergeImport([a], [imported], {})).toThrow();
  expect(mergeImport([a], [imported], { [a.id]: "local" })[0]?.name).toBe("");
  expect(mergeImport([a], [imported], { [a.id]: "import" })[0]?.name).toBe("Changed");
  expect(mergeImport([], [a, comparison], {})).toHaveLength(2);
  expect(() => mergeImport([a], [{ ...comparison, id: a.id }], { [a.id]: "import" })).toThrow();
  expect(validateReferences([newRecord("comparison", "empty", now)])).toBeUndefined();
});

it("allows missing local offers for repair without accepting broken imports or duplicate links", () => {
  const comparison = newRecord("comparison", "compare-a", now);
  comparison.items = { offers: [{ id: "a", fields: { offerId: "deleted" } }] };
  comparison.fields = { baseline: "deleted" };
  expect(() => validateReferences([comparison], true)).not.toThrow();
  expect(() => validateReferences([comparison])).toThrow("missing offers");
  expect(() => readBackup(backup([comparison]))).toThrow("missing offers");
  expect(() => validateReferences([comparison, comparison], true)).toThrow("Duplicate record");
  expect(() =>
    validateReferences([{ ...comparison, fields: { baseline: "unselected" } }], true),
  ).toThrow("baseline");
  expect(() =>
    validateReferences(
      [
        {
          ...comparison,
          items: {
            offers: [
              { id: "a", fields: { offerId: "deleted" } },
              { id: "b", fields: { offerId: "deleted" } },
            ],
          },
        },
      ],
      true,
    ),
  ).toThrow("duplicate or missing offers");
});

it("rejects reimbursements exceeding expenses and incompatible annual leave confirmation", () => {
  const cost = { id: "cost", fields: { amount: "100", reimbursement: "101" } };
  expect(() => readRecord({ ...offer(), items: { costs: [cost] } })).toThrow(
    "Reimbursement exceeds",
  );
  expect(
    readRecord({ ...offer(), items: { costs: [{ ...cost, fields: { reimbursement: "101" } }] } }),
  ).toBeDefined();
  expect(
    readRecord({ ...offer(), items: { costs: [{ ...cost, fields: { amount: "101" } }] } }),
  ).toBeDefined();
  for (const employment of ["casual", "sole-trader"]) {
    expect(() => readRecord({ ...offer(), fields: { employment, ordinaryLeave: "yes" } })).toThrow(
      "annual leave",
    );
  }
  expect(
    readRecord({ ...offer(), fields: { employment: "full-time", ordinaryLeave: "yes" } }),
  ).toBeDefined();
});

it("protects settings identities and requires own conflict choices for every record identifier", () => {
  for (const id of ["profile", "vehicle", "preferences"]) {
    expect(() => readRecord({ ...offer(), id })).toThrow("settings identity");
    expect(() => readRecord({ ...newRecord("comparison", id, now) })).toThrow("settings identity");
  }
  for (const id of ["__proto__", "constructor", "toString"]) {
    const current = { ...offer(), id };
    const incoming = { ...current, name: "Imported" };
    expect(() => mergeImport([current], [incoming], {})).toThrow("Resolve every backup conflict");
    expect(mergeImport([current], [incoming], { [id]: "import" })[0]?.name).toBe("Imported");
  }
});

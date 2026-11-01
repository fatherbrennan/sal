import { expect, it } from "bun:test";
import { calculateComparison } from "../../src/lib/calculations/comparison.ts";
import { resolveOffer } from "../../src/lib/data/defaults.ts";
import { newRecord, readBackup, readRecord } from "../../src/lib/data/schema.ts";
import { leaveFieldVisible } from "../../src/lib/fields/annual-leave.ts";
import { editorSections } from "../../src/lib/fields/editor.ts";
import { missingInputs } from "../../src/lib/result-presentation.ts";
import { bonus, offer, profile } from "../calculations/package-fixture.ts";

const now = "2026-10-25T00:00:00.000Z";

it("preserves existing offers and leaves new legal pay facts and balances unanswered", () => {
  const original = offer();
  const parsed = readBackup({
    schemaVersion: 1,
    ruleVersion: "old",
    exportedAt: now,
    records: [original],
  });
  expect(parsed.records).toEqual([original]);
  const effective = resolveOffer(original, newRecord("preferences", "preferences", now).fields, {});
  expect(effective.fields).toHaveProperty("annualLeave", "4");
  for (const key of [
    "leaveOrdinaryHours",
    "leaveLoadingBasis",
    "leaveBalanceHours",
    "leaveBalanceDate",
  ]) {
    expect(effective.fields).not.toHaveProperty(key);
  }
});

it.each(["0", "invalid", "-1"])("rejects invalid leave hours at import: %s", (hours) => {
  expect(() => readRecord(offer({ leaveOrdinaryHours: hours }))).toThrow();
});

it.each(["38.01", "40", "42"])("round-trips confirmed employer leave hours: %s", (hours) => {
  const record = offer({ leaveOrdinaryHours: hours });
  expect(readRecord(record)).toEqual(record);
});

it("shares the salary leave-pay default without replacing saved choices or explicit blanks", () => {
  const original = offer();
  expect(resolveOffer(original, {}, {}).fields).toHaveProperty("leaveRateBasis", "salary");
  expect(original.fields).not.toHaveProperty("leaveRateBasis");
  for (const basis of ["", "entered", "salary"]) {
    const record = offer({ leaveRateBasis: basis });
    expect(resolveOffer(record, {}, {}).fields).toHaveProperty("leaveRateBasis", basis);
    expect(resolveOffer(original, { leaveRateBasis: basis }, {}).fields).toHaveProperty(
      "leaveRateBasis",
      basis,
    );
  }
});

it("round-trips percentage loading and keeps inactive saved loading inputs", () => {
  const record = offer({
    leaveLoadingBasis: "percent",
    leaveLoadingPercent: "17.5123",
    leaveLoadingHourly: "2.5",
  });
  expect(readRecord(record)).toEqual(record);
  const fields = editorSections(record).flatMap((section) => section.fields);
  expect(fields.some(({ key }) => key === "leaveLoadingPercent")).toBe(true);
  expect(fields.some(({ key }) => key === "leaveLoadingHourly")).toBe(false);
  for (const value of ["-1", "Infinity", "bad"]) {
    expect(() => readRecord(offer({ leaveLoadingPercent: value }))).toThrow();
  }
  expect(readRecord(offer({ leaveLoadingPercent: "" })).fields).toHaveProperty(
    "leaveLoadingPercent",
    "",
  );
});

it("round-trips explicit unknowns, zero balances and precision without changing saved values", () => {
  const record = offer({
    leaveEligible: "",
    leaveOrdinaryHours: "38",
    leaveRateBasis: "entered",
    leaveHourlyRate: "47.4443319838",
    leaveLoadingBasis: "hourly",
    leaveLoadingHourly: "0.123456",
    leaveBalanceHours: "0",
    leaveBalanceDate: "2026-10-25",
  });
  expect(readRecord(record)).toEqual(record);
  expect(() => readRecord(offer({ leaveBalanceDate: "2026-02-30" }))).toThrow();
  expect(() => readRecord(offer({ leaveRateBasis: "guessed" }))).toThrow();
  expect(readRecord(offer({ leaveOrdinaryHours: "" })).fields).toHaveProperty(
    "leaveOrdinaryHours",
    "",
  );
});

it("shows relevant leave controls without deleting saved values when employment or basis changes", () => {
  for (const employment of ["casual", "sole-trader", ""]) {
    expect(leaveFieldVisible("annualLeave", { employment })).toBe(false);
  }
  expect(leaveFieldVisible("annualLeave", {})).toBe(false);
  expect(leaveFieldVisible("leaveEligible", { employment: "full-time" })).toBe(false);
  expect(leaveFieldVisible("leaveEligible", { employment: "part-time", leaveEligible: "no" })).toBe(
    true,
  );
  expect(leaveFieldVisible("leaveEligible", { employment: "fixed-term" })).toBe(true);
  expect(
    leaveFieldVisible("leaveHourlyRate", { employment: "full-time", leaveRateBasis: "salary" }),
  ).toBe(false);
  expect(
    leaveFieldVisible("leaveHourlyRate", { employment: "full-time", leaveRateBasis: "entered" }),
  ).toBe(true);
  expect(
    leaveFieldVisible("leaveLoadingHourly", { employment: "full-time", leaveLoadingBasis: "none" }),
  ).toBe(false);
  expect(
    leaveFieldVisible("leaveLoadingHourly", {
      employment: "full-time",
      leaveLoadingBasis: "hourly",
    }),
  ).toBe(true);
  const original = offer({ leaveHourlyRate: "50", leaveRateBasis: "salary" });
  const keys = editorSections(original).flatMap(({ fields }) => fields.map(({ key }) => key));
  expect(keys).toContain("annualLeave");
  expect(keys).not.toContain("leaveHourlyRate");
  expect(original.fields).toHaveProperty("leaveHourlyRate", "50");
});

it("keeps optional leave facts and excluded bonuses out of salary readiness blockers", () => {
  const source = offer();
  source.items = { earnings: [bonus({ amount: "", taxClass: "" })] };
  const result = calculateComparison({
    offer: source,
    profile,
    vehicle: {},
    year: "2026-27",
    target: false,
    oneOff: false,
    baseOnly: true,
    timeValue: true,
  });
  expect(
    missingInputs(result).some(
      ({ target }) => target.startsWith("leave") || target.startsWith("earnings:"),
    ),
  ).toBe(false);
  source.items = { earnings: [bonus({ included: "", amount: "" })] };
  const unresolved = calculateComparison({
    offer: source,
    profile,
    vehicle: {},
    year: "2026-27",
    target: false,
    oneOff: false,
    baseOnly: true,
    timeValue: true,
  });
  expect(missingInputs(unresolved).some(({ target }) => target.startsWith("earnings:"))).toBe(true);
});

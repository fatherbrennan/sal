import { expect, it } from "bun:test";
import { resolveOffer } from "../../src/lib/data/defaults.ts";
import type { Fields } from "../../src/lib/data/model.d.ts";
import { newRecord, readBackup, readRecord } from "../../src/lib/data/schema.ts";
import { editorItemFields, editorSections } from "../../src/lib/fields/editor.ts";

const now = "2026-10-23T00:00:00.000Z";
function keys(kind: "offer" | "profile", fields: Fields): string[] {
  const record = newRecord(kind, kind, now);
  return editorSections({ ...record, fields }).flatMap((section) =>
    section.fields.map(({ key }) => key),
  );
}

it("keeps unused metadata and explicit exceptions intact in supported backups", () => {
  const record = {
    ...newRecord("offer", "offer", now),
    fields: {
      employer: "Private company",
      role: "Engineer",
      tfnProvided: "no",
      amount: "",
      personalSuper: "",
      terms: "Existing notes",
      ordinaryLeave: "yes",
      annualLeave: "4",
      employment: "full-time",
    },
  };
  const original = structuredClone(record);
  expect(keys("offer", record.fields)).not.toContain("employer");
  expect(keys("offer", record.fields)).not.toContain("role");
  expect(keys("offer", record.fields)).toContain("ordinaryLeave");
  expect(keys("offer", record.fields)).toContain("tfnProvided");
  expect(readRecord(record)).toEqual(original);
  expect(
    readBackup({ schemaVersion: 1, exportedAt: now, ruleVersion: "old", records: [record] })
      .records,
  ).toEqual([original]);
  expect(record).toEqual(original);
});

it("starts only new optional amounts at zero and leaves required facts unknown", () => {
  const offer = resolveOffer(
    newRecord("offer", "offer", now),
    newRecord("preferences", "preferences", now).fields,
    {},
  );
  const profile = newRecord("profile", "profile", now);
  expect(offer.fields).toMatchObject({
    sacrifice: "0",
    personalSuper: "0",
    estimateMode: "standard",
  });
  expect(profile.fields).toMatchObject({ otherIncome: "0", deductions: "0", workDeductions: "0" });
  expect(offer.fields).not.toHaveProperty("inclusion");
  expect(profile.fields).toHaveProperty("studyLoan", "no");
  expect(keys("offer", offer.fields)).not.toContain("tfnProvided");
  expect(keys("offer", offer.fields)).not.toContain("ordinaryLeave");
  expect(keys("profile", profile.fields)).not.toContain("resident");
  expect(readRecord({ ...offer, fields: { personalSuper: "" } }).fields).toEqual({
    personalSuper: "",
  });
});

it("shows only relevant employee, contractor, quote-unit and commute controls without mutating inputs", () => {
  const fields = {
    estimateMode: "standard",
    employment: "full-time",
    unit: "annual",
    tripBasis: "return",
    costMethod: "entered",
    energy: "none",
  };
  const selected = keys("offer", fields);
  expect(selected).toContain("inclusion");
  expect(selected).toContain("distance");
  for (const key of ["gst", "paidUnits", "outDistance", "energyPrice", "consumption"]) {
    expect(selected).not.toContain(key);
  }
  const contractor = keys("offer", {
    ...fields,
    employment: "sole-trader",
    unit: "hour",
    tripBasis: "legs",
    costMethod: "ato",
  });
  for (const key of ["gst", "paidUnits", "outDistance", "backMinutes"]) {
    expect(contractor).toContain(key);
  }
  for (const key of ["inclusion", "distance", "maintenance", "energy"]) {
    expect(contractor).not.toContain(key);
  }
  expect(keys("offer", { ...fields, energy: "fuel" })).toContain("energyPrice");
  expect(fields).toEqual({
    estimateMode: "standard",
    employment: "full-time",
    unit: "annual",
    tripBasis: "return",
    costMethod: "entered",
    energy: "none",
  });
});

it("keeps necessary household and loan facts conditional and saved blanks repairable", () => {
  const fields = {
    estimateMode: "standard",
    household: "single",
    hospitalCover: "yes",
    studyLoan: "no",
    workDeductions: "0",
  };
  const selected = keys("profile", fields);
  for (const key of [
    "single",
    "loanScheme",
    "loanDebt",
    "mlsLiableDays",
    "spouseTaxableIncome",
    "levyChildren",
    "helpFamilyOffer",
    "specifiedWorkDeductions",
  ]) {
    expect(selected).not.toContain(key);
  }
  const family = keys("profile", {
    ...fields,
    household: "full-year-spouse",
    studyLoan: "yes",
    loanScheme: "help",
    hospitalCover: "no",
  });
  for (const key of [
    "loanScheme",
    "loanDebt",
    "mlsLiableDays",
    "spouseTaxableIncome",
    "levyChildren",
    "helpFamilyOffer",
  ]) {
    expect(family).toContain(key);
  }
  expect(keys("profile", { ...fields, household: "single-with-dependants" })).toContain(
    "levyFamilyRelief",
  );
  expect(keys("profile", { ...fields, specifiedWorkDeductions: "" })).toContain(
    "specifiedWorkDeductions",
  );
  expect(keys("profile", { ...fields, estimateMode: "original" })).toContain(
    "specifiedWorkDeductions",
  );
  expect(keys("profile", { ...fields, resident: "" })).toContain("resident");
});

it("retains explicit item exceptions and inherited tax overrides", () => {
  expect(
    editorItemFields("earnings", { included: "no", taxClass: "ordinary" }).map(({ key }) => key),
  ).not.toContain("included");
  expect(
    editorItemFields("earnings", { included: "yes", taxClass: "other" }).map(({ key }) => key),
  ).toContain("included");
  expect(
    editorItemFields("earnings", { included: "", taxClass: "" }).map(({ key }) => key),
  ).toContain("taxClass");
  expect(editorItemFields("taxOverride", {}).map(({ key }) => key)).toContain("loanDebt");
  expect(editorItemFields("unknown", {})).toEqual([]);
  expect(
    editorSections(newRecord("vehicle", "vehicle", now))[0]?.fields.map(({ key }) => key),
  ).toEqual(["energy", "energyPrice", "consumption"]);
});

it("presents bonus super as one choice describing the entered amount", () => {
  const fields = editorItemFields("earnings", { eligible: "yes" });
  expect(fields.map(({ key }) => key)).not.toContain("eligible");
  expect(fields.map(({ key }) => key)).not.toContain("inclusion");
  const treatment = fields.find(({ label }) => label === "Super on this payment");
  expect(treatment?.options.map(({ label }) => label)).toEqual([
    "Cash before tax, plus super",
    "Cash before tax and super combined",
    "Cash before tax, no super applies",
  ]);
});

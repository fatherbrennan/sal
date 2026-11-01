import { reportableSuperError } from "../calculations/tax/reporting.ts";
import { TAX_RULE_VERSION } from "../calculations/tax/sources.ts";
import { standardOfferDefaults, standardProfileDefaults } from "../calculations/tax/standard.ts";
import { itemFields } from "../fields/items.ts";
import { type EntityKind, groups, sections } from "../fields.ts";
import { parseFormula } from "../formulas/parser.ts";
import { validateShortcuts } from "../shortcut-binding.ts";
import { defaultRoster, leavePayDefaults, resolveOffer } from "./defaults.ts";
import { validateFormulaReferences } from "./formulas.ts";
import type { Backup, Fields, Item, SalRecord } from "./model.d.ts";
import { numeric } from "./numeric.ts";
import { exactKeys, maxTextLength, readFields, readId, requireObject } from "./validation.ts";

const schemaVersion = 1;
const ruleVersion = TAX_RULE_VERSION;
function isKind(value: unknown): value is EntityKind {
  return (
    value === "offer" ||
    value === "profile" ||
    value === "vehicle" ||
    value === "preferences" ||
    value === "comparison" ||
    value === "formula"
  );
}
function readRecord(value: unknown): SalRecord {
  requireObject(value);
  exactKeys(value, ["id", "kind", "name", "revision", "updatedAt", "archived", "fields", "items"]);
  const {
    kind,
    name,
    revision,
    updatedAt,
    archived,
    id: rawId,
    fields: rawFields,
    items: rawItems,
  } = value;
  if (
    !isKind(kind) ||
    typeof name !== "string" ||
    name.length > maxTextLength ||
    typeof archived !== "boolean" ||
    typeof revision !== "number" ||
    !Number.isSafeInteger(revision) ||
    revision < 0 ||
    typeof updatedAt !== "string" ||
    !Number.isFinite(Date.parse(updatedAt))
  ) {
    throw new Error("Invalid record metadata.");
  }
  const id = readId(rawId);
  if (
    (kind !== "offer" && kind !== "comparison" && kind !== "formula" && id !== kind) ||
    (["profile", "vehicle", "preferences"].includes(id) && id !== kind)
  ) {
    throw new Error("Invalid settings identity.");
  }
  const fields = readFields(
    rawFields,
    sections[kind].flatMap((section) => section.fields),
  );
  const items = readItems(rawItems, kind);
  if (kind === "formula") {
    const { expression = "" } = fields;
    if (expression.trim()) {
      Object.assign(fields, { expression: parseFormula(expression).source });
    }
  }
  const cycle = numeric(fields, "cycleDays");
  const { roster = [] } = items;
  if (cycle !== null && roster.some((item) => (numeric(item.fields, "day") ?? 0) > cycle)) {
    throw new Error("A roster day exceeds the cycle length.");
  }
  validateRelatedFields(fields, items);
  if (kind === "preferences") {
    validateShortcuts(fields);
    for (const item of defaultRoster(fields, fields)) {
      validateBreak(item.fields);
    }
  }
  return { id, kind, name, revision, updatedAt, archived, fields, items };
}
function validateRelatedFields(fields: Fields, items: Record<string, Item[] | undefined>): void {
  const reportingError = reportableSuperError(fields);
  if (reportingError !== null) {
    throw new Error(reportingError);
  }
  const { costs = [] } = items;
  for (const item of costs) {
    const amount = numeric(item.fields, "amount");
    const reimbursement = numeric(item.fields, "reimbursement");
    if (amount !== null && reimbursement !== null && reimbursement > amount) {
      throw new Error(
        "Reimbursement exceeds the entered expense. Classify excess payments separately.",
      );
    }
  }
  const { ordinaryLeave, employment } = fields;
  if (ordinaryLeave === "yes" && (employment === "casual" || employment === "sole-trader")) {
    throw new Error("Ordinary employee annual leave cannot be confirmed for this employment type.");
  }
  const { roster = [] } = items;
  for (const item of roster) {
    validateBreak(item.fields);
  }
}
function validateBreak(fields: Fields): void {
  const hours = numeric(fields, "hours");
  const minutes = numeric(fields, "breakMinutes") ?? 0;
  const minutesPerHour = 60;
  const dayMinutes = 1440;
  if (hours === null) {
    return;
  }
  const elapsed = hours * minutesPerHour + minutes;
  if (elapsed > dayMinutes) {
    throw new Error("Work and unpaid break cannot span more than 24 hours.");
  }
  const { start = "", breakStart = "" } = fields;
  if (minutes > 0 && start !== "" && breakStart !== "") {
    const clock = (text: string) => {
      const [hour = "", minute = ""] = text.split(":");
      return Number(hour) * minutesPerHour + Number(minute);
    };
    const untilBreak = (clock(breakStart) - clock(start) + dayMinutes) % dayMinutes;
    if (untilBreak + minutes > elapsed) {
      throw new Error("The unpaid break must fall within the workday.");
    }
  }
}
function readItems(rawItems: unknown, kind: EntityKind): Record<string, Item[] | undefined> {
  requireObject(rawItems);
  exactKeys(rawItems, groups[kind]);
  const items: Record<string, Item[] | undefined> = {};
  for (const [group, entries] of Object.entries(rawItems)) {
    const definitions = itemFields[group];
    if (
      !Array.isArray(entries) ||
      definitions === undefined ||
      (group === "taxOverride" && entries.length > 1)
    ) {
      throw new Error("Invalid item collection.");
    }
    const knownIds = new Set<string>();
    items[group] = entries.map((entry: unknown) => {
      requireObject(entry);
      exactKeys(entry, ["id", "fields"]);
      const { id: rawItemId, fields: rawItemFields } = entry;
      const itemId = readId(rawItemId);
      if (knownIds.has(itemId)) {
        throw new Error("Duplicate item identifier.");
      }
      knownIds.add(itemId);
      return { id: itemId, fields: readFields(rawItemFields, definitions) };
    });
  }
  return items;
}
function validateReferences(records: readonly SalRecord[], allowMissingOffers = false): void {
  validateFormulaReferences(records);
  const ids = new Set(records.map((record) => record.id));
  if (ids.size !== records.length) {
    throw new Error("Duplicate record identifiers.");
  }
  const defaults =
    records.find((record) => record.id === "preferences") ??
    newRecord("preferences", "preferences", "2026-10-24T00:00:00.000Z");
  const vehicle =
    records.find((record) => record.id === "vehicle") ??
    newRecord("vehicle", "vehicle", "2026-10-24T00:00:00.000Z");
  for (const record of records.filter((entry) => entry.kind === "offer")) {
    readRecord(resolveOffer(record, defaults.fields, vehicle.fields));
  }
  const offers = new Set(
    records.filter((record) => record.kind === "offer").map((record) => record.id),
  );
  for (const record of records.filter((entry) => entry.kind === "comparison")) {
    const { offers: selectedOffers = [] } = record.items;
    const selected = selectedOffers
      .map((item) => {
        const { offerId = "" } = item.fields;
        return offerId;
      })
      .filter(Boolean);
    if (
      new Set(selected).size !== selected.length ||
      (!allowMissingOffers && selected.some((id) => !offers.has(id)))
    ) {
      throw new Error("A comparison has duplicate or missing offers.");
    }
    const { baseline } = record.fields;
    if (baseline && !selected.includes(baseline)) {
      throw new Error("The baseline must be a selected offer.");
    }
  }
}
function readBackup(value: unknown): Backup {
  requireObject(value);
  exactKeys(value, ["schemaVersion", "exportedAt", "ruleVersion", "records"]);
  const { exportedAt, ruleVersion: rules, records, schemaVersion: version } = value;
  if (
    version !== schemaVersion ||
    typeof exportedAt !== "string" ||
    !Number.isFinite(Date.parse(exportedAt)) ||
    typeof rules !== "string" ||
    !Array.isArray(records)
  ) {
    throw new Error("Unsupported or malformed backup.");
  }
  const parsed = records.map((record: unknown) => readRecord(record));
  validateReferences(parsed);
  return { schemaVersion, exportedAt, ruleVersion: rules, records: parsed };
}
function newRecord(kind: EntityKind, id: string, now: string): SalRecord {
  const fields: Fields = {};
  if (kind === "preferences") {
    Object.assign(fields, {
      ...standardOfferDefaults(),
      ...leavePayDefaults,
      unit: "annual",
      employment: "full-time",
      weeklyHours: "38",
      weeks: "52",
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
  }
  if (kind === "profile") {
    Object.assign(fields, standardProfileDefaults(), {
      household: "single",
      hospitalCover: "no",
      mlsLiableDays: "365",
      studyLoan: "no",
    });
  }
  if (kind === "vehicle") {
    Object.assign(fields, { energy: "fuel" });
  }
  if (kind === "preferences") {
    Object.assign(fields, {
      appearance: "system",
      fontSize: "14",
      year: "2026-27",
      pageWidth: "100",
    });
  }
  if (kind === "comparison") {
    Object.assign(fields, { year: "2026-27", timeValue: "yes" });
  }
  if (kind === "formula") {
    Object.assign(fields, { expression: "", format: "number", direction: "neutral" });
  }
  return { id, kind, name: "", revision: 0, updatedAt: now, archived: false, fields, items: {} };
}
function mergeImport(
  current: readonly SalRecord[],
  incoming: readonly SalRecord[],
  decisions: Record<string, "local" | "import">,
): SalRecord[] {
  const result = new Map(current.map((record) => [record.id, record]));
  for (const record of incoming) {
    const existing = result.get(record.id);
    if (existing !== undefined && existing.kind !== record.kind) {
      throw new Error("An imported identifier changes record type.");
    }
    if (existing !== undefined && !Object.hasOwn(decisions, record.id)) {
      throw new Error("Resolve every backup conflict first.");
    }
    if (existing === undefined || decisions[record.id] === "import") {
      result.set(record.id, record);
    }
  }
  const merged = [...result.values()].map(readRecord);
  validateReferences(merged);
  return merged;
}

export type { Backup, Fields, Item, SalRecord } from "./model.d.ts";
export {
  mergeImport,
  newRecord,
  readBackup,
  readRecord,
  ruleVersion,
  schemaVersion,
  validateReferences,
};

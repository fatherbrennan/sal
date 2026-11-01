import type { ComparisonResult, Metric } from "./calculations/comparison.ts";
import { rows, value } from "./calculations/inputs.ts";

import type { Fields, SalRecord } from "./data/model.d.ts";
import { bonusSuperValue } from "./fields/bonus-super.ts";
import { editorItemFields, editorSections } from "./fields/editor.ts";
import type { Field } from "./fields/helpers.ts";
import { display } from "./format.ts";

interface MissingInput {
  scope: "offer" | "profile";
  target: string;
  section: string;
  label: string;
}

function unanswered(definition: Field, fields: Fields): boolean {
  return (
    (definition.type !== "text" || definition.key === "start") &&
    value(fields, definition.key).trim() === ""
  );
}

function offerMissingInputs(result: ComparisonResult): MissingInput[] {
  const offer = { ...result.offer, fields: result.payer };
  const missing: MissingInput[] = [];
  const noJourneys =
    result.metrics.find(({ label }) => label === "Return commute journeys")?.amount === 0;
  for (const section of editorSections(offer).filter(
    (entry) =>
      entry.title !== "Saved leave settings" &&
      entry.title !== "Paid annual leave" &&
      !(noJourneys && entry.title === "Commuting costs"),
  )) {
    for (const definition of section.fields.filter((field) => unanswered(field, offer.fields))) {
      missing.push({
        scope: "offer",
        target: definition.key,
        section: section.title,
        label: definition.label,
      });
    }
  }
  return missing;
}

function includedItem(group: string, fields: Fields, result: ComparisonResult): boolean {
  if (group === "earnings" && result.scenario.baseOnly) {
    return value(fields, "included") !== "no";
  }
  if (group === "earnings" && value(fields, "included") === "no") {
    return !(
      (!result.scenario.target && value(fields, "certainty") === "target") ||
      (!result.scenario.oneOff && value(fields, "recurrence") === "once")
    );
  }
  return !(group === "costs" && !result.scenario.oneOff && value(fields, "recurrence") === "once");
}

function itemFieldNeeded(group: string, field: Field, fields: Fields): boolean {
  return !(
    (field.key === "frequency" && group === "costs" && value(fields, "recurrence") === "once") ||
    (field.key === "breakMinutes" && !Object.hasOwn(fields, "breakMinutes"))
  );
}

function itemMissingInputs(result: ComparisonResult): MissingInput[] {
  const missing: MissingInput[] = [];
  for (const group of ["earnings", "perks", "costs", "roster", "exceptions", "holidays"]) {
    for (const [index, item] of rows(result.offer, group).entries()) {
      const fields = { ...item.fields, bonusSuper: bonusSuperValue(item.fields) };
      if (includedItem(group, fields, result)) {
        for (const definition of editorItemFields(group, fields).filter(
          (field) => itemFieldNeeded(group, field, fields) && unanswered(field, fields),
        )) {
          missing.push({
            scope: "offer",
            target: `${group}:${item.id}:${definition.key}`,
            section: group,
            label: `${value(item.fields, "label") || `${group} ${index + 1}`}: ${definition.label}`,
          });
        }
      }
    }
  }
  return missing;
}

function profileMissingInputs(result: ComparisonResult): MissingInput[] {
  const missing: MissingInput[] = [];
  const profile: SalRecord = {
    ...result.offer,
    kind: "profile",
    fields: result.profile,
    items: {},
  };
  const [override] = rows(result.offer, "taxOverride");
  for (const section of editorSections(profile)) {
    for (const definition of section.fields.filter((field) => unanswered(field, profile.fields))) {
      const input: MissingInput = {
        scope: "profile",
        target: definition.key,
        section: section.title,
        label: definition.label,
      };
      if (override !== undefined && Object.hasOwn(override.fields, definition.key)) {
        input.scope = "offer";
        input.target = `taxOverride:${override.id}:${definition.key}`;
        input.section = "taxOverride";
      }
      missing.push(input);
    }
  }
  return missing;
}

function missingInputs(result: ComparisonResult): MissingInput[] {
  return [
    ...offerMissingInputs(result),
    ...itemMissingInputs(result),
    ...profileMissingInputs(result),
  ];
}

function differenceLabel(delta: number | null, metric: Metric): string {
  if (delta === null) {
    return "Difference unavailable";
  }
  if (delta === 0) {
    return "No difference";
  }
  let direction = "less";
  let meaning = "worse";
  if (delta > 0) {
    direction = "more";
  }
  if (delta < 0 === metric.lowerIsBetter) {
    meaning = "better";
  }
  let amount = display(Math.abs(delta), metric.unit);
  if (metric.unit === "percent") {
    amount = `${display(Math.abs(delta), "number")} percentage points`;
  }
  if (metric.lowerIsBetter === null) {
    return `${amount} ${direction}`;
  }
  return `${amount} ${direction} · ${meaning}`;
}

export type { MissingInput };

export { differenceLabel, missingInputs, unanswered };

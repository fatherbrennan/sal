import type { Field } from "../fields.ts";
import type { Fields } from "./model.d.ts";

const decimalPattern = /^(?:\d+(?:\.\d*)?|\.\d+)$/u;
const datePattern = /^\d{4}-\d{2}-\d{2}$/u;
const clockPattern = /^(?:[01]\d|2[0-3]):[0-5]\d$/u;
const idPattern = /^[\w-]{1,80}$/u;
const maxTextLength = 32_000;
const dateLength = 10;

function requireObject(value: unknown): asserts value is Record<string, unknown> {
  if (value === null || typeof value !== "object" || Array.isArray(value)) {
    throw new Error("Expected an object.");
  }
}
function exactKeys(value: Record<string, unknown>, keys: readonly string[]): void {
  if (Object.keys(value).some((key) => !keys.includes(key))) {
    throw new Error("Unrecognised property.");
  }
}
function validDate(value: string): boolean {
  const date = new Date(`${value}T00:00:00Z`);
  return (
    datePattern.test(value) &&
    Number.isFinite(date.getTime()) &&
    date.toISOString().slice(0, dateLength) === value
  );
}
function fieldError(definition: Field, value: string): string | null {
  if (value.length > maxTextLength) {
    return "Text is too long.";
  }
  if (value === "") {
    return null;
  }
  if (
    definition.type === "decimal" &&
    !(
      decimalPattern.test(value) &&
      Number.isFinite(Number(value)) &&
      Number(value) <= Number.MAX_SAFE_INTEGER
    )
  ) {
    return "Enter a finite, non-negative decimal number.";
  }
  if (definition.type === "date" && !validDate(value)) {
    return "Enter a valid calendar date.";
  }
  if (
    definition.type === "select" &&
    !definition.options.some((option) => option.value === value)
  ) {
    return "Choose a listed option.";
  }
  return specialisedFieldError(definition, value);
}
function specialisedFieldError(definition: Field, value: string): string | null {
  if (definition.key === "leaveOrdinaryHours" && Number(value) <= 0) {
    return "Enter paid hours per leave week above 0, using the employer's terms.";
  }
  if (["start", "breakStart"].includes(definition.key) && !clockPattern.test(value)) {
    return "Use a 24-hour time, for example 09:00.";
  }
  if (
    ["cycleDays", "day", "journeys"].includes(definition.key) &&
    !Number.isSafeInteger(Number(value))
  ) {
    return "Enter a whole number.";
  }
  if (["cycleDays", "day"].includes(definition.key) && Number(value) < 1) {
    return "Enter at least 1.";
  }
  if (definition.key === "hours" && Number(value) > 24) {
    return "A dated work or holiday interval cannot exceed 24 hours.";
  }
  return null;
}
function readFields(value: unknown, definitions: readonly Field[]): Fields {
  requireObject(value);
  exactKeys(
    value,
    definitions.map((definition) => definition.key),
  );
  const result: Fields = {};
  for (const [key, entry] of Object.entries(value)) {
    const definition = definitions.find((candidate) => candidate.key === key);
    if (definition === undefined || typeof entry !== "string") {
      throw new Error("Invalid field value.");
    }
    const error = fieldError(definition, entry);
    if (error !== null) {
      throw new Error(`${definition.label}: ${error}`);
    }
    result[key] = entry;
  }
  return result;
}
function readId(value: unknown): string {
  if (typeof value !== "string" || !idPattern.test(value)) {
    throw new Error("Invalid record identifier.");
  }
  return value;
}

export { exactKeys, fieldError, maxTextLength, readFields, readId, requireObject, validDate };

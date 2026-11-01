import { expect, it } from "bun:test";
import { remuneration } from "../../src/lib/calculations/remuneration.ts";
import {
  bonusSuperField,
  bonusSuperValue,
  changeBonusSuper,
} from "../../src/lib/fields/bonus-super.ts";
import { bonus, offer } from "../calculations/package-fixture.ts";

it.each([
  { eligible: "yes", inclusion: "includes", choice: "includes" },
  { eligible: "yes", inclusion: "excludes", choice: "excludes" },
  { eligible: "no", inclusion: "includes", choice: "none" },
  { eligible: "no", inclusion: "excludes", choice: "none" },
])("displays completed saved bonus super answers: %j", ({ eligible, inclusion, choice }) => {
  const fields = { eligible, inclusion };
  expect(bonusSuperValue(fields)).toBe(choice);
  expect(bonusSuperField(fields).help).toContain("confirmed exceptions");
  expect(fields).toEqual({ eligible, inclusion });
});

it.each([
  { fields: {}, hint: "confirmed exceptions" },
  { fields: { eligible: "", inclusion: "" }, hint: "confirmed exceptions" },
  { fields: { eligible: "yes" }, hint: "Super applies; choose how the amount is quoted." },
  { fields: { eligible: "no", inclusion: "" }, hint: "Confirm the cash-only option." },
  { fields: { inclusion: "includes" }, hint: "Saved amount includes super" },
  { fields: { eligible: "", inclusion: "excludes" }, hint: "Saved amount excludes super" },
])("preserves incomplete saved bonus super answers: %j", ({ fields, hint }) => {
  const original = structuredClone(fields);
  expect(bonusSuperValue(fields)).toBe("");
  expect(bonusSuperField(fields).help).toContain(hint);
  expect(fields).toEqual(original);
});

it.each([
  { choice: "includes", cash: 110_000, superAmount: 13_200, gross: 123_200 },
  { choice: "excludes", cash: 111_200, superAmount: 13_344, gross: 124_544 },
  { choice: "none", cash: 111_200, superAmount: 12_000, gross: 123_200 },
])("applies one choice to an $11,200 bonus above a $100,000 cash salary: %j", (expected) => {
  const item = bonus();
  const original = structuredClone(item.fields);
  const changed = changeBonusSuper(item.fields, expected.choice);
  const record = offer();
  record.items = { earnings: [{ ...item, fields: changed }] };
  const result = remuneration(record, "2026-27", false, false);
  expect(result.cash).toBeCloseTo(expected.cash);
  expect(result.super).toBeCloseTo(expected.superAmount);
  expect(result.gross).toBeCloseTo(expected.gross);
  const { amount, certainty } = changed;
  expect(amount).toBe("11200");
  expect(certainty).toBe("guaranteed");
  expect(item.fields).toEqual(original);
});

it("clears bonus super to unknown and rejects invalid choices without mutation", () => {
  const { fields } = bonus();
  const original = structuredClone(fields);
  const cleared = changeBonusSuper(fields, "");
  expect(cleared).toEqual({ ...fields, eligible: "", inclusion: "" });
  const record = offer();
  record.items = { earnings: [{ ...bonus(), fields: cleared }] };
  expect(remuneration(record, "2026-27", false, false).cash).toBeNull();
  expect(() => changeBonusSuper(fields, "invalid")).toThrow("Choose a listed super treatment.");
  expect(fields).toEqual(original);
});

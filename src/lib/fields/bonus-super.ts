import type { Fields } from "../data/model.d.ts";
import { choices, type Field, select } from "./helpers.ts";

const superField = select(
  "bonusSuper",
  "Super on this payment",
  choices([
    ["excludes", "Cash before tax, plus super"],
    ["includes", "Cash before tax and super combined"],
    ["none", "Cash before tax, no super applies"],
  ]),
  "“No super applies” is for confirmed exceptions. Employer limits are calculated automatically.",
);
const partialHints: Record<string, string | undefined> = {
  "yes:": "Super applies; choose how the amount is quoted.",
  "no:": "Saved answer: no super applies. Confirm the cash-only option.",
  ":includes": "Saved amount includes super; whether super applies is unknown.",
  ":excludes": "Saved amount excludes super; whether super applies is unknown.",
};

function bonusSuperField(fields: Fields): Field {
  const { eligible = "", inclusion = "" } = fields;
  const hint = partialHints[`${eligible}:${inclusion}`] ?? "";
  return { ...superField, help: `${hint} ${superField.help}`.trim() };
}

function bonusSuperValue(fields: Fields): string {
  const { eligible = "", inclusion = "" } = fields;
  if (!["includes", "excludes"].includes(inclusion)) {
    return "";
  }
  if (eligible === "no") {
    return "none";
  }
  if (eligible === "yes") {
    return inclusion;
  }
  return "";
}

function changeBonusSuper(fields: Fields, next: string): Fields {
  if (!["", "includes", "excludes", "none"].includes(next)) {
    throw new Error("Choose a listed super treatment.");
  }
  if (next === "") {
    return { ...fields, eligible: "", inclusion: "" };
  }
  if (next === "none") {
    return { ...fields, eligible: "no", inclusion: "excludes" };
  }
  return { ...fields, eligible: "yes", inclusion: next };
}

export { bonusSuperField, bonusSuperValue, changeBonusSuper };

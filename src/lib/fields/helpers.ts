interface Choice {
  value: string;
  label: string;
}
interface Field {
  key: string;
  label: string;
  type: "text" | "decimal" | "date" | "select";
  options: readonly Choice[];
  help: string;
}
interface Section {
  title: string;
  fields: readonly Field[];
}
const choices = (entries: readonly (readonly [string, string])[]): Choice[] =>
  entries.map(([value, label]) => ({ value, label }));
const yesNo = choices([
  ["yes", "Yes"],
  ["no", "No"],
]);
const field = (key: string, label: string, type: Field["type"] = "decimal", help = ""): Field => ({
  key,
  label,
  type,
  help,
  options: [],
});
const select = (key: string, label: string, options: readonly Choice[], help = ""): Field => ({
  key,
  label,
  type: "select",
  help,
  options,
});
const answer = (key: string, label: string, help = ""): Field => select(key, label, yesNo, help);
const estimateMode = select(
  "estimateMode",
  "Calculation model",
  choices([
    ["standard", "Standard comparison estimate"],
    ["original", "Use saved declarations only"],
  ]),
);
const inclusion = choices([
  ["includes", "Includes super"],
  ["excludes", "Excludes super"],
]);
const frequency = choices([
  ["annual", "Annual"],
  ["monthly", "Monthly"],
  ["weekly", "Weekly"],
  ["journey", "Per return journey"],
]);

export type { Choice, Field, Section };
export { answer, choices, estimateMode, field, frequency, inclusion, select };

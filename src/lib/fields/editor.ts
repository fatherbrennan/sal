import { value } from "../calculations/inputs.ts";
import type { Fields, SalRecord } from "../data/model.d.ts";
import { sections } from "../fields.ts";
import { leaveFieldVisible } from "./annual-leave.ts";
import { bonusSuperField } from "./bonus-super.ts";
import type { Field, Section } from "./helpers.ts";
import { itemFields } from "./items.ts";
import { offerGroups } from "./order.ts";

const profileGroups = {
  "Personal tax settings": "household hospitalCover mlsLiableDays studyLoan loanScheme loanDebt",
  "Family circumstances":
    "spouseTaxableIncome spouseMlsIncome levyChildren mlsChildren levyFamilyRelief helpFamilyOffer helpFamilyBase",
  "Other income and deductions":
    "otherIncome otherLabourIncome deductions otherSpecifiedDeductions workDeductions specifiedWorkDeductions",
  "Other tax reporting amounts": "reportableBenefits reportableSuper investmentLoss foreignIncome",
};
const offerConventions =
  "tfnProvided noPaygAdjustments regularPay ordinaryPayroll superEligible ordinaryFund periodSacrifice reportableSuperOffer reportableSuperSameYear";
const profileConventions =
  "resident adult standardDeduction medicare assessmentComplete ordinaryMls helpEligible";
const employeeKeys = new Set(
  "inclusion superRate payFrequency threshold superLimit sacrifice personalSuper periodSacrifice periodPersonalSuper periodOtherDeductions evenSuper reportableSuperSameYear".split(
    " ",
  ),
);
const contractorKeys = new Set(offerGroups["Sole-trader costs"].split(" "));
const dependentFields: Record<string, readonly [string, string]> = {
  otherLabourIncome: ["otherIncome", "0"],
  otherSpecifiedDeductions: ["deductions", "0"],
  specifiedWorkDeductions: ["workDeductions", "0"],
  specifiedDeductions: ["businessDeductions", "0"],
};

function offerVisible(key: string, fields: Fields): boolean {
  const employment = value(fields, "employment");
  if (offerGroups["Paid annual leave"].split(" ").includes(key)) {
    return leaveFieldVisible(key, fields);
  }
  if (employeeKeys.has(key) && (!employment || employment === "sole-trader")) {
    return false;
  }
  if (contractorKeys.has(key) && employment !== "sole-trader") {
    return false;
  }
  if (key === "paidUnits") {
    return ["hour", "day"].includes(value(fields, "unit"));
  }
  if (["distance", "minutes"].includes(key)) {
    return value(fields, "tripBasis") === "return";
  }
  if (["outDistance", "backDistance", "outMinutes", "backMinutes"].includes(key)) {
    return value(fields, "tripBasis") === "legs";
  }
  if (["energy", "energyPrice", "consumption", "maintenance"].includes(key)) {
    return (
      value(fields, "costMethod") === "entered" &&
      (!["energyPrice", "consumption"].includes(key) ||
        ["fuel", "electric"].includes(value(fields, "energy")))
    );
  }
  return true;
}

function profileVisible(key: string, fields: Fields): boolean {
  const household = value(fields, "household");
  const help = value(fields, "studyLoan") === "yes" && value(fields, "loanScheme") === "help";
  if (key === "loanScheme") {
    return value(fields, "studyLoan") === "yes";
  }
  if (key === "loanDebt") {
    return help;
  }
  if (key === "mlsLiableDays") {
    return value(fields, "hospitalCover") === "no";
  }
  if (["spouseTaxableIncome", "spouseMlsIncome"].includes(key)) {
    return household === "full-year-spouse";
  }
  if (["levyChildren", "mlsChildren"].includes(key)) {
    return ["full-year-spouse", "single-with-dependants"].includes(household);
  }
  if (key === "levyFamilyRelief") {
    return household === "single-with-dependants";
  }
  if (["helpFamilyOffer", "helpFamilyBase"].includes(key)) {
    return help && household !== "single";
  }
  return true;
}

function visible(key: string, fields: Fields, profile: boolean): boolean {
  const dependent = dependentFields[key];
  if (
    dependent &&
    value(fields, "estimateMode") === "standard" &&
    value(fields, dependent[0]) === dependent[1] &&
    !Object.hasOwn(fields, key)
  ) {
    return false;
  }
  if (profile) {
    return profileVisible(key, fields);
  }
  return offerVisible(key, fields);
}

function project(
  definitions: readonly Field[],
  grouping: Record<string, string>,
  fields: Fields,
  profile: boolean,
): Section[] {
  return Object.entries(grouping)
    .map(([title, keys]) => ({
      title,
      fields: keys
        .split(" ")
        .flatMap((key) =>
          definitions.filter(
            (definition) => definition.key === key && visible(key, fields, profile),
          ),
        ),
    }))
    .filter((section) => section.fields.length > 0);
}

function exceptions(definitions: readonly Field[], fields: Fields, keys: string): Section[] {
  const selected = definitions.filter(
    ({ key }) =>
      keys.split(" ").includes(key) &&
      (value(fields, "estimateMode") !== "standard" ||
        (Object.hasOwn(fields, key) && !["yes", "ordinary"].includes(value(fields, key)))),
  );
  if (selected.length === 0) {
    return [];
  }
  return [{ title: "Saved calculation overrides", fields: selected }];
}

function editorSections(record: SalRecord): readonly Section[] {
  const definitions = sections[record.kind].flatMap((section) => section.fields);
  if (record.kind === "offer") {
    const { earnings } = record.items;
    const applicable = definitions.filter(
      ({ key }) =>
        key !== "evenSuper" ||
        value(record.fields, "estimateMode") !== "standard" ||
        Object.hasOwn(record.fields, key) ||
        (earnings?.length ?? 0) > 0,
    );
    return [
      ...project(applicable, offerGroups, record.fields, false),
      ...exceptions(definitions, record.fields, offerConventions),
      ...project(definitions, { "Saved leave settings": "ordinaryLeave" }, record.fields, false)
        .map((section) => ({
          ...section,
          fields: section.fields.filter(({ key }) => Object.hasOwn(record.fields, key)),
        }))
        .filter((section) => section.fields.length > 0),
    ];
  }
  if (record.kind === "profile") {
    return [
      ...project(definitions, profileGroups, record.fields, true),
      ...exceptions(definitions, record.fields, profileConventions),
    ];
  }
  return sections[record.kind]
    .filter((section) => section.title !== "Keyboard shortcuts")
    .map((section) => ({
      ...section,
      fields: section.fields.filter(
        ({ key }) => !["source", "baseline", "estimateMode", "pageWidth"].includes(key),
      ),
    }));
}

function editorItemFields(group: string, fields: Fields): readonly Field[] {
  const definitions = itemFields[group] ?? [];
  if (group === "taxOverride") {
    const keys =
      `${Object.values(profileGroups).join(" ")} ${profileConventions} estimateMode`.split(" ");
    return definitions.filter(({ key }) => keys.includes(key));
  }
  return definitions.flatMap((definition) => {
    const { key } = definition;
    if (group === "earnings") {
      if (key === "eligible") {
        return [];
      }
      if (key === "inclusion") {
        return [bonusSuperField(fields)];
      }
    }
    if (["included", "taxClass"].includes(key) && ["no", "ordinary"].includes(value(fields, key))) {
      return [];
    }
    return [definition];
  });
}

export { editorItemFields, editorSections };

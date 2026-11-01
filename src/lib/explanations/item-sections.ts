import type { ComparisonInput } from "../calculations/comparison.ts";
import { costValue, recurringValue } from "../calculations/costs.ts";
import { difference, rows, value } from "../calculations/inputs.ts";
import type { Fields, Item } from "../data/model.d.ts";
import { numeric } from "../data/numeric.ts";
import type { EquationSection } from "./model.ts";

const annualPrefix = /^annual_/u;

function recurringInput(fields: Fields, key: string, annualName: string): EquationSection {
  const frequency = value(fields, "frequency");
  const factors: Readonly<Record<string, string>> = {
    monthly: "12",
    weekly: "52",
    journey: "annual_return_journeys",
  };
  if (frequency === "annual") {
    return {
      title: annualName,
      formula: "",
      values: { [annualName]: numeric(fields, key) },
      units: { [annualName]: "money" },
      origins: { [annualName]: "The item's entered annual amount." },
    };
  }
  const factor = factors[frequency];
  if (factor === undefined) {
    return {
      title: annualName,
      formula: `${annualName} = unknown`,
      notes: ["The item's amount frequency is not established."],
    };
  }
  const name = annualName.replace(annualPrefix, `${frequency}_`);
  let unit = frequency;
  if (frequency === "journey") {
    unit = "per-return-journey";
  }
  return {
    title: annualName,
    formula: `${annualName} = ${name} * ${factor}`,
    values: { [name]: numeric(fields, key) },
    units: { [name]: "money" },
    origins: {
      [name]: `The item's entered ${unit} amount.`,
    },
  };
}

function costSection(fields: Fields, oneOff: boolean): EquationSection[] {
  const amount = numeric(fields, "amount");
  const reimbursement = numeric(fields, "reimbursement");
  if (amount !== null && reimbursement !== null && reimbursement > amount) {
    return [
      {
        title: "Net job cost",
        formula: "annual_net_job_cost = unavailable\nannual_job_cost_reimbursement = unavailable",
        notes: ["Reimbursement exceeds its own cost."],
      },
    ];
  }
  const recurrence = value(fields, "recurrence");
  if (recurrence === "once") {
    let formula = "annual_net_job_cost = 0\nannual_job_cost_reimbursement = 0";
    let note = "This scenario excludes one-off costs.";
    if (oneOff) {
      formula =
        "annual_net_job_cost = one_off_job_cost - one_off_reimbursement\nannual_job_cost_reimbursement = one_off_reimbursement";
      note = "Included once in the selected full-year scenario.";
    }
    return [
      {
        title: "One-off job cost",
        formula,
        values: Object.fromEntries([
          ["one_off_job_cost", amount],
          ["one_off_reimbursement", reimbursement],
        ]),
        units: Object.fromEntries([
          ["one_off_job_cost", "money"],
          ["one_off_reimbursement", "money"],
        ]),
        origins: Object.fromEntries([
          ["one_off_job_cost", "This cost item's entered one-off expense."],
          ["one_off_reimbursement", "This cost item's entered one-off reimbursement."],
        ]),
        notes: [note],
      },
    ];
  }
  if (recurrence !== "recurring") {
    return [
      {
        title: "Net job cost",
        formula: "annual_net_job_cost = unknown\nannual_job_cost_reimbursement = unknown",
        notes: ["The cost's recurrence is not established."],
      },
    ];
  }
  return [
    recurringInput(fields, "amount", "annual_job_cost_before_reimbursement"),
    recurringInput(fields, "reimbursement", "annual_job_cost_reimbursement"),
    {
      title: "Net job cost",
      formula:
        "annual_net_job_cost = annual_job_cost_before_reimbursement - annual_job_cost_reimbursement",
    },
  ];
}

function itemSections(input: ComparisonInput, journeys: number | null = null): EquationSection[] {
  return [
    ...rows(input.offer, "perks").map(({ fields }, index) => ({
      title: value(fields, "label") || `Personal perk ${index + 1}`,
      scope: `perk_${index + 1}`,
      formula: "",
      values: Object.fromEntries([
        ["annual_personal_perk_value", recurringValue(fields, "amount", journeys)],
      ]),
      units: Object.fromEntries([["annual_personal_perk_value", "money"]]),
      sections: [recurringInput(fields, "amount", "annual_personal_perk_value")],
    })),
    ...rows(input.offer, "costs").map((item, index) => ({
      title: value(item.fields, "label") || `Job cost ${index + 1}`,
      scope: `cost_${index + 1}`,
      formula: "",
      values: costAmounts(item, journeys, input.oneOff),
      units: Object.fromEntries(
        [
          "annual_net_job_cost",
          "annual_job_cost_before_reimbursement",
          "annual_job_cost_reimbursement",
        ].map((name) => [name, "money"]),
      ),
      sections: costSection(item.fields, input.oneOff),
    })),
  ];
}

function costAmounts(item: Item, journeys: number | null, oneOff: boolean) {
  const amount = costValue(item, journeys, oneOff, "amount");
  const reimbursement = costValue(item, journeys, oneOff, "reimbursement");
  return Object.fromEntries([
    ["annual_net_job_cost", difference(amount, reimbursement)],
    ["annual_job_cost_before_reimbursement", amount],
    ["annual_job_cost_reimbursement", reimbursement],
  ]);
}

export { itemSections };

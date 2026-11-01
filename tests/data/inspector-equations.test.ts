import { expect, it } from "bun:test";
import assert from "node:assert/strict";
import { calculateComparison } from "../../src/lib/calculations/comparison.ts";
import { comparisonEquation } from "../../src/lib/explanations/comparison.ts";
import {
  differenceEquation,
  percentageDifferenceEquation,
} from "../../src/lib/explanations/difference.ts";
import { itemSections } from "../../src/lib/explanations/item-sections.ts";
import { explanation } from "../../src/lib/explanations/model.ts";
import { definitionFor, equationInspection } from "../../src/lib/inspector/equations.ts";
import { nodeAt, nodeValue } from "../../src/lib/inspector/model.ts";
import { currentLocation } from "../../src/lib/inspector/types.ts";
import { bonus, offer, profile } from "../calculations/package-fixture.ts";

const payLabel = "Cash pay / revenue before deductions";
function payEquation(amount = "112000", includeBonus = false) {
  const record = offer({ amount });
  record.name = "Office offer";
  if (includeBonus) {
    record.items = { earnings: [bonus({ label: "Retention", amount: "5600" })] };
  }
  const input = {
    offer: record,
    profile,
    vehicle: {},
    year: "2026-27" as const,
    target: false,
    oneOff: false,
    timeValue: false,
  };
  return comparisonEquation(payLabel, input, calculateComparison(input));
}

it("preserves inspector display precision, missing values and invalid-reference failures", () => {
  const model = equationInspection([payEquation()], payLabel);
  const original = nodeAt(model, model.root);
  expect(nodeValue(original)).toBe("$100,000.00");
  const { valueText, ...node } = original;
  expect(valueText).toBe("$100,000.00");
  expect(nodeValue(node)).toBe("$100,000.00");
  node.symbol = "fuel_price_per_litre";
  const fuelPrice = 1.987;
  node.amount = fuelPrice;
  expect(nodeValue(node)).toBe("$1.987/L");
  node.amount = null;
  expect(nodeValue(node)).toBe("Unavailable");
  expect(() => nodeAt(model, "missing")).toThrow("Unknown inspector node: missing");
  expect(currentLocation(true)).toBe("location");
  expect(currentLocation(false)).toBeUndefined();
});

it("inspector follows selected bonuses to their named inputs and reports intermediate cash", () => {
  const model = equationInspection([payEquation("112000", true)], payLabel);
  expect(model.offer).toBe("Office offer");
  expect(model.scenario).toContain("Guaranteed");
  const root = nodeAt(model, model.root);
  const expectedCash = 105_000;
  expect(root.amount).toBeCloseTo(expectedCash);
  expect(root.formula).toHaveLength(1);
  const collection = nodeAt(model, root.terms[0]?.id ?? "missing");
  expect(collection.kind).toBe("collection");
  expect(collection.terms).toHaveLength(2);
  const bonusNode = [...model.nodes.values()].find(
    (node) => node.symbol === "bonus_1__annual_bonus_cash_before_cap",
  );
  assert(bonusNode);
  const bonusCash = 5000;
  expect(bonusNode.amount).toBeCloseTo(bonusCash);
  expect(bonusNode.label).toContain("Retention");
  expect(bonusNode.source).toContain("Retention");
});

it("inspector shows the actual cap branch once and preserves incomplete input values", () => {
  const capped = equationInspection([payEquation("336000")], payLabel);
  const root = nodeAt(capped, capped.root);
  expect(root.formula?.map((entry) => entry.text)).toEqual([
    "annual_cash_pay = sum(selected_pay_item_remuneration_before_cap) - annual_employer_super",
  ]);
  const earningsLimit = 270_830;
  expect(
    [...capped.nodes.values()].find((node) => node.symbol === "employer_super_earnings_limit")
      ?.amount,
  ).toBe(earningsLimit);
  const missing = equationInspection([payEquation("")], payLabel);
  expect(nodeAt(missing, missing.root).amount).toBeNull();
  expect(
    [...missing.nodes.values()].find((node) => node.symbol === "annual_base_pay_quote")?.amount,
  ).toBeNull();
});

function itemOffer() {
  const record = offer();
  record.items = {
    perks: [
      { id: "gym", fields: { label: "Gym", amount: "25", frequency: "monthly" } },
      { id: "unknown", fields: { label: "Learning budget", amount: "", frequency: "annual" } },
    ],
    costs: [
      {
        id: "parking",
        fields: {
          label: "Parking",
          amount: "10",
          reimbursement: "2",
          frequency: "journey",
          recurrence: "recurring",
        },
      },
    ],
  };
  return record;
}

it("item inspector values reuse the selected annualisation and keep named unknown perks", () => {
  const record = itemOffer();
  const journeys = 100;
  const sections = itemSections(
    {
      offer: record,
      profile,
      vehicle: {},
      year: "2026-27",
      target: false,
      oneOff: false,
      timeValue: false,
    },
    journeys,
  );
  const model = equationInspection(
    [
      {
        ...explanation("Items", "total_value = sum(perk_values) - cost_value"),
        collections: Object.fromEntries([
          [
            "perk_values",
            [
              { scope: "perk_1", name: "annual_personal_perk_value" },
              { scope: "perk_2", name: "annual_personal_perk_value" },
            ],
          ],
        ]),
        references: Object.fromEntries([
          ["cost_value", { scope: "cost_1", name: "annual_net_job_cost" }],
        ]),
        sections,
      },
    ],
    "Items",
  );
  const gym = 300;
  const cost = 800;
  expect(
    [...model.nodes.values()].find((node) => node.symbol === "perk_1__annual_personal_perk_value")
      ?.amount,
  ).toBe(gym);
  const missing = [...model.nodes.values()].find(
    (node) => node.symbol === "perk_2__annual_personal_perk_value",
  );
  expect(missing?.amount).toBeNull();
  expect(missing?.label).toContain("Learning budget");
  expect(
    [...model.nodes.values()].find((node) => node.symbol === "cost_1__annual_net_job_cost")?.amount,
  ).toBe(cost);
});

it("difference sources retain distinct offer values, scoped links and the relative calculation", () => {
  const selected = 200_000;
  const baseline = 100_000;
  const sources = [payEquation("224000"), payEquation("112000")];
  const model = equationInspection(
    [
      differenceEquation("Change", selected, baseline, sources),
      percentageDifferenceEquation("Relative change", selected, baseline, sources),
    ],
    "Change",
  );
  const root = nodeAt(model, model.root);
  expect(root.amount).toBe(baseline);
  expect(nodeAt(model, root.terms[0]?.id ?? "missing").amount).toBeCloseTo(selected);
  expect(nodeAt(model, root.terms[1]?.id ?? "missing").amount).toBeCloseTo(baseline);
  expect(root.terms.map((term) => nodeAt(model, term.id).symbol)).toEqual([
    "offer_0__annual_cash_pay",
    "offer_1__annual_cash_pay",
  ]);
  const percent = 100;
  expect(nodeAt(model, root.related?.[0] ?? "missing").amount).toBe(percent);
  for (const node of model.nodes.values()) {
    for (const term of node.terms) {
      expect(model.nodes.has(term.id)).toBe(true);
    }
  }
});

it("declared empty collections are explicit endpoints and alternative definitions stay separate", () => {
  const model = equationInspection(
    [
      {
        ...explanation("Perks", "total_value = sum(perk_values)"),
        collections: Object.fromEntries([["perk_values", []]]),
      },
    ],
    "Perks",
  );
  const collection = [...model.nodes.values()].find((node) => node.symbol === "perk_values");
  expect(nodeAt(model, model.root).valueText).toBe("Formula only");
  assert(collection);
  expect(collection.kind).toBe("collection");
  expect(collection.amount).toBe(0);
  expect(collection.valueText).toBe("No items");
  expect(
    definitionFor(
      "cash = quote\nsuper_amount = cash * rate\ncash = package - super_amount",
      "cash",
    ),
  ).toBe("cash = quote\ncash = package - super_amount");
  expect(() => equationInspection([], "Empty")).toThrow("No calculation was supplied");
});

it("keeps prose and comments in context while preserving formulas, conditions and links", () => {
  const model = equationInspection(
    [
      {
        ...explanation(
          "Example",
          "total = sum( entries )  # Selected items only.\nThese are personal values.\n  No cash receipt is implied.",
          {},
          ["Existing context."],
        ),
        collections: { entries: [] },
      },
    ],
    "Example",
  );
  const root = nodeAt(model, model.root);
  expect(root.formula?.map((entry) => entry.text)).toEqual(["total = sum(entries)"]);
  expect(root.notes).toEqual(
    expect.arrayContaining([
      "Existing context.",
      "Selected items only.",
      "These are personal values.\n  No cash receipt is implied.",
    ]),
  );
  expect(root.terms.map((term) => nodeAt(model, term.id).symbol)).toEqual(["entries"]);
  expect(
    definitionFor(
      "result = base\n  + extra\nOnly selected entries apply.\nother = 1\nresult = 0 when base = 0",
      "result",
    ),
  ).toBe("result = base\n+ extra\nresult = 0 when base = 0");
  expect(
    definitionFor(
      "amount < 10: multiplier = 2; offset = 1\notherwise: multiplier = 3; offset = 4",
      "offset",
    ),
  ).toBe("amount < 10: multiplier = 2; offset = 1\notherwise: multiplier = 3; offset = 4");
});

it("retains note-only explanations without presenting them as equations", () => {
  const model = equationInspection(
    [explanation("Unavailable", "Choose a supported input.\nNo amount is assumed.")],
    "Unavailable",
  );
  const root = nodeAt(model, model.root);
  expect(root.formula).toEqual([]);
  expect(root.notes).toContain("Choose a supported input.\nNo amount is assumed.");
});

it("retains explanatory paragraphs after the main formula", () => {
  const model = equationInspection(
    [explanation("Value", "total = 1\n\nThis is a separate explanation.")],
    "Value",
  );
  expect(nodeAt(model, model.root).notes).toContain("This is a separate explanation.");
});

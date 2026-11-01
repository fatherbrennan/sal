import { expect, it } from "bun:test";
import {
  type ComparisonInput,
  calculateComparison,
} from "../../src/lib/calculations/comparison.ts";
import { comparisonEquation } from "../../src/lib/explanations/comparison.ts";
import { explanation } from "../../src/lib/explanations/model.ts";
import {
  equationGraph,
  resolveVariable,
  unresolvedVariables,
} from "../../src/lib/explanations/navigation.ts";
import {
  paidHoursEquation,
  patternEquation,
  shiftEquation,
} from "../../src/lib/explanations/work.ts";
import { bonus, offer, profile } from "../calculations/package-fixture.ts";

const withIncome = 100_000;
const withTax = 30_000;
const withoutIncome = 20_000;
const withoutTax = 6000;
const weeklyHours = 38;

it("resolves repeated names only inside their declared scenario and follows explicit references", () => {
  const graph = equationGraph({
    ...explanation("Tax difference", "tax_difference = tax_with - tax_without"),
    references: Object.fromEntries([
      ["tax_with", { scope: "with", name: "tax_total" }],
      ["tax_without", { scope: "without", name: "tax_total" }],
    ]),
    sections: [
      {
        title: "With offer",
        scope: "with",
        formula: "tax_total = taxable_income * 0.3",
        values: Object.fromEntries([
          ["taxable_income", withIncome],
          ["tax_total", withTax],
        ]),
        origins: Object.fromEntries([["taxable_income", "With-offer income"]]),
      },
      {
        title: "Without offer",
        scope: "without",
        formula: "tax_total = taxable_income * 0.3",
        values: Object.fromEntries([
          ["taxable_income", withoutIncome],
          ["tax_total", withoutTax],
        ]),
        origins: Object.fromEntries([["taxable_income", "Without-offer income"]]),
      },
    ],
  });
  expect(resolveVariable(graph, "", "tax_without")?.value).toBe(withoutTax);
  expect(resolveVariable(graph, "without", "taxable_income")?.value).toBe(withoutIncome);
  expect(resolveVariable(graph, "with", "taxable_income")?.value).toBe(withIncome);
  expect(resolveVariable(graph, "", "taxable_income")).toBeNull();
  expect(unresolvedVariables(graph)).toEqual([]);
});

it("retains every conditional definition, explicit zero, unknown and broken-reference failures", () => {
  const graph = equationGraph({
    ...explanation("Branches", "result_value = input_value", { resultValue: 0, inputValue: null }),
    origins: Object.fromEntries([["input_value", "An unanswered offer input"]]),
    sections: [{ title: "Alternative", formula: "result_value = 0 when input_value = 0" }],
    references: Object.fromEntries([
      ["loop_value", { scope: "", name: "loop_value" }],
      ["missing_value", { scope: "absent", name: "result_value" }],
    ]),
  });
  expect(resolveVariable(graph, "", "result_value")?.blocks).toHaveLength(2);
  expect(resolveVariable(graph, "", "result_value")?.value).toBe(0);
  expect(resolveVariable(graph, "", "input_value")?.value).toBeNull();
  expect(resolveVariable(graph, "", "input_value")?.blocks).toEqual([]);
  expect(resolveVariable(graph, "", "loop_value")).toBeNull();
  expect(resolveVariable(graph, "", "missing_value")).toBeNull();
  expect(resolveVariable(graph, "", "not_a_variable")).toBeNull();
});

it("rejects values without provenance and detects broken collection members", () => {
  const graph = equationGraph({
    ...explanation("Invalid source", "total_amount = sum(item_amounts)", { unsupportedAmount: 0 }),
    collections: Object.fromEntries([["item_amounts", [{ scope: "absent", name: "item_amount" }]]]),
  });
  expect(resolveVariable(graph, "", "unsupported_amount")).toBeNull();
  expect(unresolvedVariables(graph)).toEqual(["absent:item_amount"]);
});

it("keeps both parts of a cleared shift start unknown", () => {
  const graph = equationGraph(shiftEquation({ start: "", hours: "8", journeys: "1" }, "Monday"));
  expect(resolveVariable(graph, "", "shift_start_hour")?.value).toBeNull();
  expect(resolveVariable(graph, "", "shift_start_minute")?.value).toBeNull();
});

it("provides a definition or identified source for every comparison and work variable", () => {
  const record = offer();
  Object.assign(record.items, { earnings: [bonus()] });
  const input: ComparisonInput = {
    offer: record,
    profile,
    vehicle: {},
    year: "2026-27",
    target: false,
    oneOff: false,
    timeValue: true,
  };
  const result = calculateComparison(input);
  const equations = result.metrics.map((metric) => comparisonEquation(metric.label, input, result));
  equations.push(
    paidHoursEquation(weeklyHours),
    patternEquation(record, "2026-27"),
    shiftEquation({ start: "09:00", hours: "7.6", breakMinutes: "30", journeys: "1" }, "Monday"),
  );
  const missing = equations.flatMap((equation) => unresolvedVariables(equationGraph(equation)));
  expect([...new Set(missing)].toSorted((left, right) => left.localeCompare(right))).toEqual([]);
});

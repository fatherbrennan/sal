import { expect, it } from "bun:test";
import assert from "node:assert/strict";
import { calculateComparison } from "../../src/lib/calculations/comparison.ts";
import { comparisonEquation } from "../../src/lib/explanations/comparison.ts";
import { differenceEquation } from "../../src/lib/explanations/difference.ts";
import { equationInspection } from "../../src/lib/inspector/equations.ts";
import { offer, profile } from "../calculations/package-fixture.ts";

function source(id: string, target = false) {
  const record = offer();
  record.id = id;
  record.name = "Same name";
  const input = {
    offer: record,
    profile,
    vehicle: {},
    year: "2026-27" as const,
    target,
    oneOff: false,
    timeValue: false,
  };
  return comparisonEquation("Annual leave: base pay plus super", input, calculateComparison(input));
}

it("inspector navigation distinguishes offers, scenarios and nested leave references", () => {
  const first = source("first");
  const second = source("second");
  assert(first.comparison && second.comparison);
  expect(first.comparison.key).not.toBe(second.comparison.key);
  const model = equationInspection(
    [differenceEquation("Difference", 1, 2, [first, second])],
    "Difference",
  );
  const rates = [...model.nodes.values()].filter((node) =>
    node.symbol.endsWith("__ordinary_base_cash_per_hour"),
  );
  expect(rates).toHaveLength(2);
  expect(rates.map((node) => node.reference)).toEqual([
    { key: first.comparison.key, metric: "Ordinary leave base cash per hour" },
    { key: second.comparison.key, metric: "Ordinary leave base cash per hour" },
  ]);
  expect(first.comparison?.key).not.toBe(source("first", true).comparison?.key);
  const intermediate = [...model.nodes.values()].find((node) =>
    node.symbol.endsWith("__ordinary_salary_weeks_per_year"),
  );
  assert(intermediate);
  expect(intermediate.reference).toBeUndefined();
  expect(intermediate.container?.key).toBe(first.comparison?.key);
});

it("inspector navigation never treats a different calculation scope as the visible metric", () => {
  const model = equationInspection(
    [
      {
        ...source("first"),
        formula: "result = nested_value",
        result: { name: "result", value: 1, unit: "money" },
        references: Object.fromEntries([
          ["nested_value", { scope: "hypothetical", name: "annual_base_cash" }],
        ]),
        sections: [
          { scope: "hypothetical", title: "Hypothetical", formula: "annual_base_cash = 1" },
        ],
      },
    ],
    "Scoped",
  );
  const nested = [...model.nodes.values()].find(
    (node) => node.symbol === "hypothetical__annual_base_cash",
  );
  assert(nested);
  expect(nested.reference).toBeUndefined();
  expect(nested.container).toEqual(source("first").comparison);
});

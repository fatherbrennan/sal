import { expect, it } from "bun:test";
import assert from "node:assert/strict";
import {
  type ComparisonInput,
  calculateComparison,
} from "../../src/lib/calculations/comparison.ts";
import { comparisonEquation } from "../../src/lib/explanations/comparison.ts";
import { equationInspection } from "../../src/lib/inspector/equations.ts";
import { type Inspection, type InspectorNode, nodeAt } from "../../src/lib/inspector/model.ts";
import { bonus, offer, profile } from "../calculations/package-fixture.ts";

const directValue = /^[a-z][a-z_0-9]* = (?<source>[a-z][a-z_0-9]*)$/u;
const summedValues = /^[a-z][a-z_0-9]* = sum\((?<source>[a-z][a-z_0-9]*)\)$/u;
const precision = 8;

function linkedValues(model: Inspection, node: InspectorNode) {
  if (node.amount === null) {
    return [];
  }
  const actual = node.amount;
  return (node.formula ?? []).flatMap((formula) => {
    const { source: alias } = directValue.exec(formula.text)?.groups ?? {};
    const { source: collection } = summedValues.exec(formula.text)?.groups ?? {};
    const source = alias ?? collection;
    if (source === undefined || source === "unknown" || source === "unavailable") {
      return [];
    }
    const id = formula.links[source];
    assert(id, `${node.symbol}: missing formula input ${source}`);
    const target = nodeAt(model, id);
    if (alias !== undefined && target.valueText === "Formula only") {
      return [];
    }
    let expected = target.amount;
    if (collection !== undefined) {
      if (target.kind !== "collection") {
        return [];
      }
      expected = target.terms.reduce((sum, term) => {
        const member = nodeAt(model, term.id);
        assert(member.amount !== null, `${node.symbol}: unavailable member ${member.symbol}`);
        return sum + member.amount;
      }, 0);
    }
    assert(expected !== null, `${node.symbol}: unavailable formula input ${source}`);
    return [{ actual, expected, label: `${node.symbol}: ${formula.text}` }];
  });
}

const cases = [
  { name: "inclusive base and bonus", fields: {}, earnings: {}, scenario: {} },
  {
    name: "exclusive base and bonus",
    fields: { inclusion: "excludes" },
    earnings: {},
    scenario: {},
  },
  { name: "capped components", fields: { amount: "400000" }, earnings: {}, scenario: {} },
  {
    name: "capped base only",
    fields: { amount: "400000" },
    earnings: {},
    scenario: { baseOnly: true },
  },
  {
    name: "ineligible capped bonus",
    fields: { amount: "400000" },
    earnings: { eligible: "no" },
    scenario: {},
  },
  {
    name: "higher uncapped rate",
    fields: { superRate: "15", superLimit: "uncapped" },
    earnings: {},
    scenario: {},
  },
  { name: "unknown base quote", fields: { amount: "" }, earnings: {}, scenario: {} },
  {
    name: "target and one-off bonus",
    fields: {},
    earnings: { certainty: "target", recurrence: "once" },
    scenario: { target: true, oneOff: true },
  },
  {
    name: "contractor with business costs",
    fields: {
      employment: "sole-trader",
      amount: "100000",
      gst: "none",
      businessCosts: "3000",
      contractorSuper: "9000",
    },
    earnings: null,
    scenario: {},
  },
];

it.each(cases)(
  "inspector aliases and declared collection sums reconcile across all metrics: $name",
  ({ fields, earnings, scenario }) => {
    const record = offer({
      annualLeave: "4",
      leaveOrdinaryHours: "40",
      leaveRateBasis: "salary",
      leaveLoadingBasis: "none",
      ...fields,
    });
    record.items = { earnings: [] };
    if (earnings !== null) {
      record.items = { earnings: [bonus(earnings)] };
    }
    const input: ComparisonInput = {
      offer: record,
      profile,
      vehicle: {},
      year: "2026-27",
      target: false,
      oneOff: false,
      timeValue: false,
      ...scenario,
    };
    const result = calculateComparison(input);
    const checks = result.metrics.flatMap((metric) => {
      const model = equationInspection(
        [comparisonEquation(metric.label, input, result)],
        metric.label,
      );
      return [...model.nodes.values()].flatMap((node) => linkedValues(model, node));
    });
    expect(checks.length).toBeGreaterThan(0);
    for (const { actual, expected, label } of checks) {
      expect(actual, label).toBeCloseTo(expected, precision);
    }
  },
);

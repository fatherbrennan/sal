import { expect, it } from "bun:test";
import {
  type ComparisonInput,
  calculateComparison,
} from "../../src/lib/calculations/comparison.ts";
import { comparisonEquation } from "../../src/lib/explanations/comparison.ts";
import {
  equationGraph,
  resolveVariable,
  unresolvedVariables,
} from "../../src/lib/explanations/navigation.ts";
import { offer, profile } from "../calculations/package-fixture.ts";

const labels = [
  "Package value after tax and job costs",
  "Package value after tax and costs per work + travel hour",
  "Package value before tax, after job costs",
  "Package value before tax, after costs per work + travel hour",
];
it.each([false, true])("explains package costs once for employee/contractor: %j", (contractor) => {
  const record = offer();
  if (contractor) {
    record.fields = {
      ...record.fields,
      employment: "sole-trader",
      amount: "100000",
      gst: "exclusive",
      businessCosts: "10000",
      businessDeductions: "0",
      eligibleLabour: "0",
      specifiedDeductions: "0",
    };
  }
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
  for (const label of labels) {
    const equation = comparisonEquation(label, input, result);
    const graph = equationGraph(equation);
    expect(unresolvedVariables(graph)).toEqual([]);
    expect(equation.formula).not.toContain("time_value");
    expect(equation.sections?.some(({ title }) => title === "Travel time")).toBe(false);
    expect(equation.context?.includes("not bank cash")).toBe(
      label.startsWith("Package value after tax"),
    );
    expect(equation.context?.includes("excluding unpaid breaks")).toBe(label.endsWith("hour"));
    expect(equation.formula.includes("annual_work_and_travel_hours")).toBe(label.endsWith("hour"));
    expect(
      equation.formula.includes("annual_gross_package_value - annual_business_cash_costs"),
    ).toBe(contractor && label.startsWith("Package value before tax"));
    let expectedBusinessCosts: number | undefined;
    if (contractor) {
      const businessCosts = 10_000;
      expectedBusinessCosts = businessCosts;
    }
    expect(resolveVariable(graph, "", "annual_business_cash_costs")?.value).toBe(
      expectedBusinessCosts,
    );
  }
});

it.each([
  "Package value before tax, after job costs and time",
  "Package value after tax, job costs and time",
  "Package value after tax, commuting costs and time",
])("keeps %s monetary time deductions explicit in their own measure", (basis) => {
  const input: ComparisonInput = {
    offer: offer(),
    profile,
    vehicle: {},
    year: "2026-27",
    target: false,
    oneOff: false,
    timeValue: true,
  };
  const result = calculateComparison(input);
  const equation = comparisonEquation(basis, input, result);
  expect(equation.sections?.some(({ title }) => title === "Travel time")).toBe(true);
  expect(equation.sections?.find(({ title }) => title === "Work and travel hours")?.formula).toBe(
    "annual_work_and_travel_hours = annual_work_hours + annual_commute_hours\nWorked hours exclude unpaid breaks.",
  );
});

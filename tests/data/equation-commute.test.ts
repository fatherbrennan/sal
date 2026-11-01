import { expect, it } from "bun:test";
import {
  type ComparisonInput,
  calculateComparison,
} from "../../src/lib/calculations/comparison.ts";
import type { Fields } from "../../src/lib/data/model.d.ts";
import { comparisonEquation } from "../../src/lib/explanations/comparison.ts";
import { differenceEquation } from "../../src/lib/explanations/difference.ts";
import { equationGraph, resolveVariable } from "../../src/lib/explanations/navigation.ts";
import { offer, profile } from "../calculations/package-fixture.ts";

function equation(fields: Fields, label = "Commute kilometres", commutes = true) {
  const record = offer(fields);
  if (commutes) {
    record.items = {
      roster: [
        {
          id: "shift",
          fields: { day: "1", start: "09:00", hours: "8", journeys: "1", place: "onsite" },
        },
      ],
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
  return comparisonEquation(label, input, calculateComparison(input));
}

it("explains no-energy commuting with zero energy cost and no fuel inputs", () => {
  const detail = equation(
    { energy: "none", energyPrice: "", consumption: "" },
    "Commute cash cost / broader estimate",
  );
  const section = detail.sections?.find(({ title }) => title === "Commuting costs and distance");
  expect(section?.formula).toContain("annual_commute_energy_cost = 0");
  expect(section?.formula).not.toContain("price_per_energy_unit");
  expect(section?.formula).not.toContain("consumption_per_100_km");
});

it("shows zero-journey results without trip inputs and preserves an unselected energy basis", () => {
  const zero = equation(
    { costMethod: "", tripBasis: "", distance: "", minutes: "" },
    "Commute cash cost / broader estimate",
    false,
  );
  expect(zero.result?.value).toBe(0);
  expect(zero.formula).toBe("annual_commuting_cost = 0 when annual_return_journeys = 0");
  const missing = equation(
    { energy: "", energyPrice: "2", consumption: "8" },
    "Commute cash cost / broader estimate",
  );
  const section = missing.sections?.find(({ title }) => title === "Commuting costs and distance");
  expect(missing.result?.value).toBeNull();
  expect(section?.formula).toContain("annual_commute_energy_cost = unknown");
});

it("binds return totals to the selected trip basis and preserves unknown legs", () => {
  const fields = {
    tripBasis: "legs",
    distance: "999",
    minutes: "999",
    outDistance: "10",
    backDistance: "20",
    outMinutes: "15",
    backMinutes: "25",
  };
  const distance = 30;
  const minutes = 40;
  const graph = equationGraph(equation(fields));
  expect(resolveVariable(graph, "", "return_distance_km")?.value).toBe(distance);
  expect(resolveVariable(graph, "", "return_minutes")?.value).toBe(minutes);
  const missing = equationGraph(equation({ ...fields, backDistance: "", backMinutes: "" }));
  expect(resolveVariable(missing, "", "return_distance_km")?.value).toBeNull();
  expect(resolveVariable(missing, "", "return_minutes")?.value).toBeNull();
});

it("keeps raw input values and provenance inside wrapped offer equations", () => {
  const graph = equationGraph(
    differenceEquation("Commute kilometres", null, null, [
      equation({ distance: "20" }),
      equation({ distance: "40" }),
    ]),
  );
  const firstDistance = 20;
  const secondDistance = 40;
  expect(resolveVariable(graph, "offer_0", "return_distance_km")?.scope).toBe("offer_0");
  expect(resolveVariable(graph, "offer_0", "return_distance_km")?.value).toBe(firstDistance);
  expect(resolveVariable(graph, "offer_1", "return_distance_km")?.value).toBe(secondDistance);
});

it("retains the metric unit on difference results and both immediate operands", () => {
  const offerAmount = 50.125;
  const baselineAmount = 40;
  const money = differenceEquation("Cash before tax per paid hour", offerAmount, baselineAmount, [
    equation({}, "Cash before tax per paid hour"),
  ]);
  expect(money.result?.unit).toBe("money");
  expect(Object.entries(money.units ?? {})).toEqual([
    ["offer_value", "money"],
    ["baseline_value", "money"],
  ]);
  const numeric = differenceEquation("Commute kilometres", offerAmount, baselineAmount, [
    equation({}),
  ]);
  expect(numeric.result?.unit).toBe("number");
});

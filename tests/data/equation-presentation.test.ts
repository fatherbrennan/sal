import { expect, it } from "bun:test";
import {
  type ComparisonInput,
  calculateComparison,
} from "../../src/lib/calculations/comparison.ts";
import { comparisonEquation } from "../../src/lib/explanations/comparison.ts";
import { equationValues, explanation } from "../../src/lib/explanations/model.ts";
import {
  displayValue,
  equationSections,
  formattedFormulaTokens,
  formulaDocument,
  formulaParts,
  formulaTokens,
  formulaValues,
  primaryFormula,
  readableFormula,
} from "../../src/lib/explanations/presentation.ts";
import { offer, profile } from "../calculations/package-fixture.ts";

it("keeps unknown input values distinct from zero when rendering exact values", () => {
  expect(
    equationValues(
      explanation("Zero is known", "known_value + unknown_value", {
        knownValue: 0,
        unknownValue: null,
        irrelevant: "omit",
      }).values,
    ),
  ).toBe("known_value = 0\nunknown_value = unknown");
});

it("introduces formulas with readable names and values without changing the exact equation", () => {
  const equation = explanation("Hourly rate", "hourly_rate = annual_cash / paid_hours", {
    annualCash: 100_000,
    paidHours: 2000,
  });
  equation.units = Object.fromEntries([["annual_cash", "money"]]);
  expect(readableFormula(equation)).toBe("hourly rate = annual cash ÷ paid hours");
  expect(readableFormula(equation, true)).toBe("hourly rate = $100,000.00 ÷ 2,000");
  expect(equation.formula).toBe("hourly_rate = annual_cash / paid_hours");
  expect(
    readableFormula(explanation("Unknown", "value = missing * 0", { missing: null }), true),
  ).toBe("value = Unavailable × 0");
  expect(readableFormula(explanation("Units", 'unit = "L/kWh" # entered'))).toBe(
    'unit = "L/kWh" — entered',
  );
});

function sampleInput(): ComparisonInput {
  return {
    offer: offer(),
    profile,
    vehicle: {},
    year: "2026-27",
    target: false,
    oneOff: false,
    timeValue: true,
  };
}

it("marks rounded numeric substitutions as approximate without changing exact formulas or comparisons", () => {
  const equation = explanation("Leave", "leave_value = leave_hours * leave_rate", {
    leaveValue: 7211.538_461_538_462,
    leaveHours: 152,
    leaveRate: 47.444_331_983_805_67,
  });
  equation.units = Object.fromEntries([
    ["leave_value", "money"],
    ["leave_rate", "money"],
  ]);
  expect(readableFormula(equation, true)).toBe("$7,211.54 ≈ 152 × $47.44");
  expect(readableFormula(equation)).toBe("leave value = leave hours × leave rate");
  expect(equation.formula).toBe("leave_value = leave_hours * leave_rate");
  const comparison = explanation("Limit", "rate >= limit", { rate: 1.123_456, limit: 1 });
  expect(readableFormula(comparison, true)).toBe("1.1235 >= 1");
  expect(readableFormula(explanation("Unknown", "rate = missing", { rate: null }), true)).toBe(
    "Unavailable = missing",
  );
});

it("separates the main equation, immediate values and complete methods without losing precision", () => {
  const hourlyRate = 50.607_287_449_392_715;
  const unitPrice = 1.987;
  const cash = 100_000;
  const paidHours = 1976;
  const unrelatedValue = 99;
  const equation = explanation(
    "Hourly rate",
    "hourly_rate = cash / paid_hours\n\ncash = salary + bonus\n\ncash = salary + bonus",
    {
      cash: 100_000,
      paidHours: 1976,
      salary: 90_000,
      bonus: 10_000,
      hourlyRate,
    },
  );
  expect(primaryFormula(equation)).toBe("hourly_rate = cash / paid_hours");
  expect(Object.entries(formulaValues(primaryFormula(equation), equation.values))).toEqual([
    ["cash", cash],
    ["paid_hours", paidHours],
  ]);
  expect(equationSections(equation)).toEqual([{ title: "Cash", formula: "cash = salary + bonus" }]);
  expect(displayValue(hourlyRate)).toBe("50.6073");
  expect(displayValue(hourlyRate, "money")).toBe("$50.61");
  expect(displayValue(0, "money")).toBe("$0.00");
  expect(displayValue(null)).toBe("Unavailable");
  expect(displayValue("17:06")).toBe("17:06");
  expect(displayValue([unitPrice, null, "hours"])).toBe("1.987, Unavailable, hours");
  expect(
    formulaValues(
      "result = cash # unrelated_value",
      Object.fromEntries([
        ["cash", 0],
        ["unrelated_value", unrelatedValue],
      ]),
    ),
  ).toEqual({ cash: 0 });
});

it("highlights names and literals without changing source text or interpreting markup", () => {
  const source = 'hourly_rate = 1.987 * shift_worked_hours # per hour\nlabel = "<img src=x>"';
  const tokens = formulaTokens(source);
  expect(tokens.map((token) => token.text).join("")).toBe(source);
  expect(tokens).toContainEqual({ kind: "variable", text: "hourly_rate" });
  expect(tokens).toContainEqual({ kind: "value", text: "1.987" });
  expect(tokens).toContainEqual({ kind: "value", text: '"<img src=x>"' });
  expect(tokens).toContainEqual({ kind: "comment", text: "# per hour" });
  expect(
    formulaParts("result = base\n  + extra\nOnly entered extras apply.\nNo estimate is invented."),
  ).toEqual([
    { kind: "formula", text: "result = base\n  + extra" },
    { kind: "note", text: "Only entered extras apply.\nNo estimate is invented." },
  ]);
});

it("opens complex package estimates with the three immediate terms and selected scenario details", () => {
  const input = sampleInput();
  const equation = comparisonEquation(
    "Package value after tax, job costs and time",
    input,
    calculateComparison(input),
  );
  expect(equation.formula).toBe(
    "annual_net_package_after_costs_and_time = annual_net_package_value - annual_job_costs - annual_after_tax_travel_time_value",
  );
  const immediateTerms = 3;
  expect(equation.sections?.slice(0, immediateTerms).map((section) => section.title)).toEqual([
    "Net package",
    "Job costs",
    "Travel time",
  ]);
  const formulas = equation.sections?.map((section) => section.formula).join("\n") ?? "";
  expect(formulas).toContain(
    "annual_net_package_value = annual_cash_after_tax + annual_net_super_contributions + annual_personal_perk_value",
  );
  expect(formulas).toContain("annual_after_tax_travel_time_value = 0");
  expect(formulas).not.toContain("annual_gross_travel_time_value");
  expect(formulas).not.toContain("annual_quote / 1.1");
  expect(formulas).not.toContain("earnings_limit = 62500");
  expect(formulas).not.toContain("first_band_rate = 0.16");
  expect(formulas).not.toContain("lower_threshold = 67000");
  expect(equation.context).toContain("2026-27 · Guaranteed · Recurring");
  expect(Object.keys(formulaValues(equation.formula, equation.values))).toEqual(
    expect.arrayContaining([
      "annual_net_package_value",
      "annual_job_costs",
      "annual_after_tax_travel_time_value",
    ]),
  );
  const disabled = { ...input, timeValue: false };
  const withoutTime = comparisonEquation(
    "Package value after tax, job costs and time",
    disabled,
    calculateComparison(disabled),
  );
  expect(
    withoutTime.sections?.find((section) => section.title === "Travel time")?.formula,
  ).toContain("annual_after_tax_travel_time_value = 0");
  expect(withoutTime.context).toContain("Travel-time value off");
});

it("uses the entered annual base quote directly without generic quote aliases", () => {
  const input = sampleInput();
  const equation = comparisonEquation(
    "Cash before tax per paid hour",
    input,
    calculateComparison(input),
  );
  const formulas = [
    equation.formula,
    ...(equation.sections ?? []).map((section) => section.formula),
  ].join("\n");
  expect(formulas).not.toContain("quoted_amount");
  expect(formulas).not.toContain("component_quote");
  expect(formulas).not.toContain("base_component_cash");
  expect(equation.formula).toBe(
    "gross_cash_per_paid_hour = annual_cash_pay / standard_paid_hours_per_year",
  );
});

it("formats formula whitespace once without changing literals, signs or line boundaries", () => {
  const source =
    'result  =  max ( 0,  sum ( entries ) )\n  + ( -extra  /  2 )\nvalues = [ 1,  2 ]\nlabel = "a  ( b ) # literal"';
  expect(
    formattedFormulaTokens(source)
      .map((token) => token.text)
      .join(""),
  ).toBe(
    'result = max(0, sum(entries))\n+ (-extra / 2)\nvalues = [1, 2]\nlabel = "a  ( b ) # literal"',
  );
  expect(
    formulaTokens(source)
      .map((token) => token.text)
      .join(""),
  ).toBe(source);
});

it("preserves escaped quotes and comment markers inside formula literals", () => {
  const literal = JSON.stringify('say "a  ( b ) # literal"');
  const source = `label = ${literal}  # Display label.`;
  expect(formulaDocument(source)).toEqual({
    formula: `label = ${literal}`,
    notes: ["Display label."],
  });
  expect(
    formattedFormulaTokens(`label  =  ${literal}`)
      .map((token) => token.text)
      .join(""),
  ).toBe(`label = ${literal}`);
});

import { expect, it } from "bun:test";
import {
  type ComparisonInput,
  calculateComparison,
} from "../../src/lib/calculations/comparison.ts";
import { calculateRepresentativePayroll } from "../../src/lib/calculations/tax/payroll.ts";
import { calculatePayrollHourly } from "../../src/lib/calculations/tax/payroll-hourly.ts";
import type { Fields } from "../../src/lib/data/model.d.ts";
import { comparisonEquation } from "../../src/lib/explanations/comparison.ts";
import { payrollEquation } from "../../src/lib/explanations/payroll.ts";
import { annualEquation } from "../../src/lib/explanations/tax.ts";
import { equationInspection } from "../../src/lib/inspector/equations.ts";
import { type Inspection, nodeAt } from "../../src/lib/inspector/model.ts";
import { bonus, offer, profile } from "../calculations/package-fixture.ts";

function source(fields: Fields = {}): ComparisonInput {
  return {
    offer: offer(fields),
    profile,
    vehicle: {},
    year: "2026-27",
    target: false,
    oneOff: false,
    timeValue: false,
  };
}

function named(model: Inspection, symbol: string) {
  return [...model.nodes.values()].find((node) => node.symbol === symbol);
}

it.each(["2025-26", "2026-27"] as const)(
  "inspector retains standard-mode cash and super through nested explanations: %s",
  (year) => {
    const input = { ...source(), year };
    const { superEligible: _, ...fields } = input.offer.fields;
    input.offer.fields = fields;
    input.offer.items = { earnings: [bonus()] };
    const saved = structuredClone(input);
    const result = calculateComparison(input);
    const expected = { cash: 110_000, super: 13_200, gross: 123_200 };
    for (const [label, amount] of [
      ["Cash pay / revenue before deductions", expected.cash],
      ["Employer / hirer super", expected.super],
    ] as const) {
      const model = equationInspection([comparisonEquation(label, input, result)], label);
      expect(nodeAt(model, model.root).amount).toBeCloseTo(amount);
      expect(result.metrics.find((metric) => metric.label === label)?.amount).toBe(
        nodeAt(model, model.root).amount,
      );
    }
    const packageModel = equationInspection(
      [comparisonEquation("Package value after tax", input, result)],
      "Package",
    );
    expect(named(packageModel, "annual_cash_pay")?.amount).toBeCloseTo(expected.cash);
    expect(named(packageModel, "annual_employer_super")?.amount).toBeCloseTo(expected.super);
    expect(named(packageModel, "with_offer__annual_cash_pay")?.amount).toBeCloseTo(expected.cash);
    const taxModel = equationInspection(
      [annualEquation("basicIncomeTax", result.tax.withOffer, result, { title: "Tax" })],
      "Tax",
    );
    expect(named(taxModel, "annual_cash_pay")?.amount).toBeCloseTo(expected.cash);
    const gross = equationInspection(
      [comparisonEquation("Package value before tax and costs", input, result)],
      "Gross",
    );
    expect(named(gross, "annual_remuneration")?.amount).toBeCloseTo(expected.gross);
    expect(input).toEqual(saved);
  },
);

it("inspector retains the standard equal-quarter assumption without inventing bonus timing", () => {
  const input: ComparisonInput = { ...source(), year: "2025-26" };
  const { evenSuper: _, ...fields } = input.offer.fields;
  input.offer.fields = fields;
  const result = calculateComparison(input);
  const label = "Employer / hirer super";
  const model = equationInspection([comparisonEquation(label, input, result)], label);
  const expected = 12_000;
  expect(nodeAt(model, model.root).amount).toBeCloseTo(expected);
  input.offer.items = { earnings: [bonus()] };
  const withBonus = calculateComparison(input);
  const unknown = equationInspection([comparisonEquation(label, input, withBonus)], label);
  expect(nodeAt(unknown, unknown.root).amount).toBeNull();
});

it.each([{ superEligible: "" }, { evenSuper: "" }])(
  "inspector keeps explicitly cleared super facts unavailable: %j",
  (fields) => {
    const input: ComparisonInput = { ...source(fields), year: "2025-26" };
    const result = calculateComparison(input);
    for (const label of ["Cash pay / revenue before deductions", "Employer / hirer super"]) {
      const model = equationInspection([comparisonEquation(label, input, result)], label);
      expect(nodeAt(model, model.root).amount).toBeNull();
      expect(result.metrics.find((metric) => metric.label === label)?.amount).toBe(
        nodeAt(model, model.root).amount,
      );
    }
  },
);

it.each([
  { fields: {}, quote: 112_000, cash: 3846.15, hourly: 48.076_875 },
  {
    fields: { unit: "hour", amount: "56", paidUnits: "2000" },
    quote: 112_000,
    cash: 3846.15,
    hourly: 48.076_875,
  },
  {
    fields: { unit: "day", amount: "560", paidUnits: "200" },
    quote: 112_000,
    cash: 3846.15,
    hourly: 48.076_875,
  },
  { fields: { amount: "0" }, quote: 0, cash: 0, hourly: 0 },
  { fields: { amount: "" }, quote: null, cash: null, hourly: null },
])(
  "payslip inspector preserves the annual quote and paid-hour values: %j",
  ({ fields, quote, cash, hourly }) => {
    const input = source(fields);
    const result = calculateComparison(input);
    const payroll = calculateRepresentativePayroll({
      year: input.year,
      annualBaseCash: result.baseCash,
      profile: result.profile,
      payer: result.payer,
    });
    const context = {
      result,
      payroll,
      hourly: calculatePayrollHourly({ payroll, weeklyHours: 40, weeks: 52 }),
    };
    for (const entry of [
      { amount: payroll.grossBaseCash, perHour: false, expected: cash },
      { amount: context.hourly.grossBaseCash, perHour: true, expected: hourly },
    ]) {
      const equation = payrollEquation("grossBaseCash", entry.amount, context, {
        perHour: entry.perHour,
      });
      const model = equationInspection([equation], "Payslip");
      expect(nodeAt(model, model.root).amount).toBe(entry.expected);
      const quoteNode = named(model, "annual_base_pay_quote");
      expect(quoteNode?.amount ?? null).toBe(quote);
    }
  },
);

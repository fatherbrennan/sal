import { expect, it } from "bun:test";
import {
  type ComparisonInput,
  calculateComparison,
} from "../../src/lib/calculations/comparison.ts";
import { leaveMetricKeys, leaveValuationKeys } from "../../src/lib/calculations/leave-metrics.ts";
import { calculateRepresentativePayroll } from "../../src/lib/calculations/tax/payroll.ts";
import { calculatePayrollHourly } from "../../src/lib/calculations/tax/payroll-hourly.ts";
import { comparisonEquation } from "../../src/lib/explanations/comparison.ts";
import { differenceEquation } from "../../src/lib/explanations/difference.ts";
import { metricEquations } from "../../src/lib/explanations/metric-definitions.ts";
import { type EquationSection, equationValues } from "../../src/lib/explanations/model.ts";
import { equationGraph, resolveVariable } from "../../src/lib/explanations/navigation.ts";
import { oneOffEquation } from "../../src/lib/explanations/one-off.ts";
import { paygTables } from "../../src/lib/explanations/payg.ts";
import { allocatedHoursEquation, payrollEquation } from "../../src/lib/explanations/payroll.ts";
import { annualEquation } from "../../src/lib/explanations/tax.ts";
import { annualNames } from "../../src/lib/explanations/tax-context.ts";
import {
  paidHoursEquation,
  patternEquation,
  shiftEquation,
} from "../../src/lib/explanations/work.ts";
import { bonus, offer, profile } from "../calculations/package-fixture.ts";

const snakeCase = /^[a-z][a-z_0-9]*$/u;
function completeFormula(equation: EquationSection): string {
  return [equation.formula, ...(equation.sections ?? []).map(completeFormula)].join("\n");
}

function input(): ComparisonInput {
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

it("explains every comparison metric with current unrounded values and snake_case names", () => {
  const source = input();
  const result = calculateComparison(source);
  expect(
    Object.keys({ ...metricEquations, ...leaveMetricKeys, ...leaveValuationKeys }).toSorted(
      (left, right) => left.localeCompare(right),
    ),
  ).toEqual(
    result.metrics.map(({ label }) => label).toSorted((left, right) => left.localeCompare(right)),
  );
  for (const metric of result.metrics) {
    const equation = comparisonEquation(metric.label, source, result);
    expect(equation.result?.value).toBe(metric.amount);
    expect(
      resolveVariable(equationGraph(equation), "", equation.result?.name ?? ""),
    ).not.toBeNull();
    expect(Object.keys(equation.values).every((key) => snakeCase.test(key))).toBe(true);
  }
  const hourly = comparisonEquation("Package value before tax per paid hour", source, result);
  expect(equationValues(hourly.values)).toContain("annual_gross_package_value = 112000");
  expect(equationValues(hourly.values)).toContain("standard_paid_hours_per_year = 2080");
  expect(completeFormula(hourly)).toContain(
    "annual_gross_package_value = annual_remuneration + annual_personal_perk_value",
  );
  expect(hourly.formula).toContain("annual_gross_package_value / standard_paid_hours_per_year");
  expect(() => comparisonEquation("missing", source, result)).toThrow("Missing equation");
  expect(() =>
    comparisonEquation("Standard paid hours", source, {
      ...result,
      metrics: [
        ...result.metrics,
        { label: "missing", amount: null, unit: "number", lowerIsBetter: true },
      ],
    }),
  ).toThrow("Missing equation");
});

it("keeps unknowns, disabled time, unit prices, alternative commute and contractor methods explicit", () => {
  const source = input();
  source.offer.fields = {
    ...source.offer.fields,
    amount: "",
    energyPrice: "1.987",
    consumption: "8.75",
    costMethod: "ato",
  };
  source.timeValue = false;
  Object.assign(source.offer.items, {
    roster: [
      {
        id: "work",
        fields: { day: "1", start: "09:00", hours: "8", journeys: "1", place: "onsite" },
      },
    ],
  });
  let result = calculateComparison(source);
  const unknownQuote = equationGraph(
    comparisonEquation("Package value before tax per paid hour", source, result),
  );
  expect(resolveVariable(unknownQuote, "", "annual_base_pay_quote")?.value).toBeNull();
  expect(
    comparisonEquation("Commute-time value at package before tax", source, result).formula,
  ).toStartWith("annual_gross_travel_time_value = 0");
  const travel = comparisonEquation("Commute cash cost / broader estimate", source, result);
  expect(travel.formula).toStartWith(
    "annual_commuting_cost = annual_commute_kilometres * kilometre_rate + annual_commute_trip_charges",
  );
  expect(equationValues(travel.values)).not.toContain("price_per_energy_unit");
  expect(completeFormula(travel)).toContain("kilometre_rate = 0.91");
  source.offer.fields = {
    ...source.offer.fields,
    employment: "sole-trader",
    amount: "110000",
    gst: "inclusive",
  };
  result = calculateComparison(source);
  expect(
    comparisonEquation("Cash pay / revenue before deductions", source, result).formula,
  ).toStartWith("annual_cash_pay = annual_base_pay_quote / 1.1");
  expect(comparisonEquation("Employer / hirer super", source, result).formula).toStartWith(
    "annual_employer_super = 0",
  );
  source.offer.fields = { ...source.offer.fields, gst: "exclusive" };
  expect(
    comparisonEquation("Cash pay / revenue before deductions", source, calculateComparison(source))
      .formula,
  ).toStartWith("annual_cash_pay = annual_base_pay_quote");
});

it("explains inherited vehicle values, item context and the entered roster without losing precision", () => {
  const source = input();
  source.vehicle = { energy: "fuel", energyPrice: "1.987", consumption: "8.75" };
  source.offer.items = {
    earnings: [bonus()],
    roster: [
      {
        id: "work",
        fields: { day: "1", start: "09:00", hours: "8", journeys: "1", place: "onsite" },
      },
      {
        id: "off",
        fields: { day: "2", start: "09:00", hours: "0", journeys: "0", place: "onsite" },
      },
    ],
  };
  const result = calculateComparison(source);
  const commute = comparisonEquation("Commute cash cost / broader estimate", source, result);
  expect(equationValues(commute.values)).toContain("price_per_energy_unit = 1.987");
  expect(equationValues(commute.values)).toContain("consumption_per_100_km = 8.75");
  const { price_per_energy_unit: priceOrigin } = commute.origins ?? {};
  expect(priceOrigin).toContain("Vehicle settings");
  expect(commute.notes.join(" ")).not.toContain('{"');
  const roster = equationValues(patternEquation(source.offer, "2026-27").values);
  expect(roster).toContain("roster_worked_hours = [8,0]");
  expect(roster).toContain("journeys_for_roster_rows_with_positive_worked_hours = [1]");
});

it("binds HELP income and debt to the correct annual scenario", () => {
  const source = input();
  source.profile = {
    ...profile,
    studyLoan: "yes",
    loanScheme: "help",
    loanDebt: "24000",
    helpEligible: "yes",
  };
  const result = calculateComparison(source);
  const equation = annualEquation("help", result.tax.withOffer, result, { title: "with offer" });
  const expected = { repayment: 100_000, debt: 24_000, repaymentTax: 4570.8 };
  expect(equationValues(equation.values)).toContain(
    `help_repayment_income = ${expected.repayment}`,
  );
  expect(equationValues(equation.values)).toContain(`help_repayable_debt = ${expected.debt}`);
  expect(
    Object.entries(equation.values).find(([key]) => key === "displayed_result")?.[1],
  ).toBeCloseTo(expected.repaymentTax);
  const without = annualEquation("help", result.tax.withoutOffer, result, {
    title: "without",
    withoutOffer: true,
  });
  expect(completeFormula(without)).toContain("offer_assessable_income = 0");
  expect(equationValues(without.values)).toContain("help_repayment_income = 0");
});

it("explains every annual component and preserves the final-assessment blocker", () => {
  const result = calculateComparison(input());
  for (const key of Object.keys(annualNames)) {
    let expectedContext = "taxable_income";
    if (key === "help") {
      expectedContext = "help_repayment = 0";
    }
    expect(
      completeFormula(annualEquation(key, result.tax.withOffer, result, { title: "with offer" })),
    ).toContain(expectedContext);
    expect(
      annualEquation(key, result.tax.withoutOffer, result, {
        title: "without offer",
        withoutOffer: true,
      }).title,
    ).toContain("without offer");
  }
  const final = annualEquation("finalAssessment", result.tax.withOffer, result, {
    title: "with offer",
  });
  expect(final.warnings?.join(" ")).toContain("Unavailable");
  expect(final.result?.value).toBeNull();
  expect(() => annualEquation("missing", result.tax.withOffer, result, { title: "test" })).toThrow(
    "Missing annual equation",
  );
});

it("explains payroll using period coefficients and a separate paid-hours denominator", () => {
  const result = calculateComparison(input());
  const payroll = calculateRepresentativePayroll({
    year: "2026-27",
    annualBaseCash: result.baseCash,
    profile: result.profile,
    payer: result.payer,
  });
  const hourly = calculatePayrollHourly({ payroll, weeklyHours: 40, weeks: 52 });
  const context = { result, payroll, hourly };
  const gross = payrollEquation("grossBaseCash", payroll.grossBaseCash, context);
  expect(completeFormula(gross)).toContain(
    "round(annual_base_cash * 100 / representative_periods_per_year) / 100",
  );
  const annualCash = 100_000;
  expect(Object.entries(gross.values).find(([key]) => key === "annual_base_cash")?.[1]).toBeCloseTo(
    annualCash,
  );
  for (const pay of payroll.rulePeriods) {
    const net = payrollEquation("bankEstimate", pay.bankEstimate, context, {
      period: pay.rulePeriod,
      perHour: true,
    });
    expect(completeFormula(net)).toContain(
      "ordinary_payg_coefficient_multiplier = 0.32; ordinary_payg_coefficient_offset = 181.7319",
    );
    expect(net.formula).toStartWith(
      "period_bank_cash_estimate_per_hour = period_bank_cash_estimate / allocated_period_paid_hours",
    );
  }
  expect(allocatedHoursEquation(context).formula).toContain(
    "standard_paid_hours_per_year / representative_periods_per_year",
  );
  expect(() => payrollEquation("missing", payroll.grossBaseCash, context)).toThrow(
    "Missing payroll equation",
  );
});

it("keeps each PAYG year, threshold and loan table distinct", () => {
  expect(paygTables("2025-july", "no", "yes")).toContain("unverified");
  expect(paygTables("2025-july", "yes", "yes")).toContain(
    "total_payg_coefficient_multiplier = 0.57; total_payg_coefficient_offset = 650.6154",
  );
  expect(paygTables("2025-september", "no", "yes")).toContain(
    "total_payg_coefficient_multiplier = 0.57; total_payg_coefficient_offset = 487.2587",
  );
  expect(paygTables("2026-july", "yes", "yes")).toContain(
    "total_payg_coefficient_multiplier = 0.57; total_payg_coefficient_offset = 655.7704",
  );
  expect(paygTables("2026-july", "no", "no")).toContain("period_total_payg = period_ordinary_payg");
  expect(paygTables("2026-july", "", "yes")).toContain("Select whether");
  expect(paygTables("2026-july", "yes", "")).toContain("declaration is unknown");
});

it("explains work times, calendar boundaries, differences and the combined one-off effect", () => {
  const source = input();
  const recurring = calculateComparison(source);
  const standardWeeklyHours = 38;
  expect(paidHoursEquation(standardWeeklyHours).formula).toContain(
    "displayed_duration_minutes = floor(standard_paid_hours_per_week * 60 + 0.5)",
  );
  expect(equationValues(paidHoursEquation(null).values)).toContain(
    "standard_paid_hours_per_week = unknown",
  );
  source.offer.items = { earnings: [bonus({ amount: "1120", recurrence: "once" })] };
  source.oneOff = true;
  const combined = calculateComparison(source);
  const once = oneOffEquation(recurring, combined, source);
  expect(once.formula).toContain(
    "annual_cash_after_job_costs_with_one_offs - recurring_annual_cash_after_job_costs",
  );
  expect(completeFormula(patternEquation(source.offer, "2026-27"))).toContain(
    "calendar_dates_replaced_by_exceptions",
  );
  expect(patternEquation(source.offer, "").notes.join(" ")).toContain("unknown");
  const shift = shiftEquation(
    { start: "09:00", hours: "7.6", breakMinutes: "30", journeys: "1" },
    "Monday",
  );
  expect(Object.entries(shift.values)).toContainEqual(["displayed_result", "17:06"]);
  expect(equationValues(shiftEquation({}, "missing").values)).toContain(
    "shift_worked_hours = unknown",
  );
  expect(differenceEquation("difference", null, 0).formula).toBe(
    "difference_from_baseline = offer_value - baseline_value",
  );
});

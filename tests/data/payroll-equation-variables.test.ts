import { expect, it } from "bun:test";
import { calculateComparison } from "../../src/lib/calculations/comparison.ts";
import { calculateRepresentativePayroll } from "../../src/lib/calculations/tax/payroll.ts";
import { calculatePayrollHourly } from "../../src/lib/calculations/tax/payroll-hourly.ts";
import type { Fields, SalRecord } from "../../src/lib/data/model.d.ts";
import { type EquationSection, explanation } from "../../src/lib/explanations/model.ts";
import { equationGraph, resolveVariable } from "../../src/lib/explanations/navigation.ts";
import { payPrimaryFormula, paySections } from "../../src/lib/explanations/pay-sections.ts";
import { payrollEquation } from "../../src/lib/explanations/payroll.ts";
import { bonus, offer, profile } from "../calculations/package-fixture.ts";

function context(record: SalRecord = offer(), edits: Fields = {}) {
  const result = calculateComparison({
    offer: record,
    profile: { ...profile, ...edits },
    vehicle: {},
    year: "2026-27",
    target: false,
    oneOff: false,
    timeValue: false,
  });
  const payroll = calculateRepresentativePayroll({
    year: "2026-27",
    annualBaseCash: result.baseCash,
    profile: result.profile,
    payer: result.payer,
  });
  return {
    result,
    payroll,
    hourly: calculatePayrollHourly({ payroll, weeklyHours: 40, weeks: 52 }),
  };
}

function formulas(section: EquationSection): string {
  return [section.formula, ...(section.sections ?? []).map(formulas)].join("\n");
}

it("payroll equation variables: separate coefficient runs and the actual hourly numerator", () => {
  const input = context(offer({ payFrequency: "monthly", periodPersonalSuper: "10" }), {
    studyLoan: "yes",
    loanScheme: "help",
    helpEligible: "yes",
    loanDebt: "24000",
  });
  const [rule] = input.payroll.rulePeriods;
  if (rule === undefined) {
    throw new Error("Expected the selected payroll rule period.");
  }
  const detail = payrollEquation("combined", rule.withholding.combined, input, {
    period: rule.rulePeriod,
  });
  expect(formulas(detail)).toContain("ordinary_payg_coefficient_multiplier");
  expect(formulas(detail)).toContain("total_payg_coefficient_multiplier");
  expect(formulas(detail)).toContain(
    "monthly_adjusted_payg_earnings_cents = period_payg_earnings_cents + 1 when period_payg_earnings_cents % 100 = 33",
  );
  expect(formulas(detail)).not.toContain("corresponding_period_amount");
  expect(formulas(detail)).not.toContain("period_withholding using");
  const contribution = payrollEquation("personalSuper", input.hourly.personalSuper, input, {
    perHour: true,
  });
  expect(contribution.formula).toBe(
    "period_personal_super_contribution_per_hour = period_personal_super_contribution / allocated_period_paid_hours",
  );
  expect(Object.entries(contribution.origins ?? {})).toContainEqual([
    "period_personal_super_contribution",
    expect.stringContaining("not derived from annual personal super"),
  ]);
});

it("payroll equation variables: preserves the no-loan identity without inventing a loan coefficient run", () => {
  const input = context();
  const [rule] = input.payroll.rulePeriods;
  if (rule === undefined) {
    throw new Error("Expected the selected payroll rule period.");
  }
  const detail = payrollEquation("combined", rule.withholding.combined, input, {
    period: rule.rulePeriod,
  });
  expect(detail.formula).toBe("period_total_payg = period_ordinary_payg");
  expect(formulas(detail)).not.toContain("total_payg_coefficient_multiplier");
  expect(detail.result?.name).toBe("period_total_payg");
});

it("payroll equation variables: distinguishes a derived sacrifice from an explicit period amount", () => {
  const record = offer({ sacrifice: "1000", reportableSuperOffer: "1000" });
  const { periodSacrifice: _, ...fields } = record.fields;
  const derived = context({ ...record, fields });
  const computed = payrollEquation("salarySacrifice", derived.payroll.salarySacrifice, derived);
  expect(computed.formula).toBe("period_salary_sacrifice = 38.46");
  expect(formulas(computed)).toContain(
    "period_salary_sacrifice = round(annual_salary_sacrifice * 100 / representative_periods_per_year) / 100",
  );
  expect(formulas(computed)).not.toContain("entered_period_salary_sacrifice");
  const entered = context(offer({ periodSacrifice: "40" }));
  const explicit = payrollEquation("salarySacrifice", entered.payroll.salarySacrifice, entered);
  expect(explicit.formula).toBe("period_salary_sacrifice = 40");
  expect(formulas(explicit)).not.toContain(
    "period_salary_sacrifice = round(annual_salary_sacrifice",
  );
});

function payGraph(record: SalRecord) {
  const { result } = context(record);
  const detail = {
    ...explanation("Pay", payPrimaryFormula(result, "annual_cash_pay")),
    sections: paySections(result, "2026-27"),
  };
  return { result, detail, graph: equationGraph(detail) };
}

it.each([
  { unit: "hour", amount: "55.25", source: "base_hourly_pay_quote", quantity: "annual_paid_hours" },
  { unit: "day", amount: "442", source: "base_daily_pay_quote", quantity: "annual_paid_days" },
])(
  "pay quote variables: preserve the $unit source instead of overwriting the annual quote",
  ({ unit, amount, source, quantity }) => {
    const { detail, graph } = payGraph(offer({ unit, amount, paidUnits: "2000" }));
    expect(resolveVariable(graph, "", source)?.value).toBe(Number(amount));
    expect(resolveVariable(graph, "", source)?.origin).toContain("base pay amount");
    const paidUnits = 2000;
    expect(formulas(detail)).toContain(`annual_base_pay_quote = ${source} * ${quantity}`);
    expect(resolveVariable(graph, "", "annual_base_pay_quote")?.value).toBe(
      Number(amount) * paidUnits,
    );
    expect(resolveVariable(graph, "", quantity)?.value).toBe(paidUnits);
  },
);

it("pay quote variables: use the annual monetary input directly without a quote alias", () => {
  const annualQuote = 112_000;
  const { detail, graph } = payGraph(offer());
  expect(resolveVariable(graph, "", "annual_base_pay_quote")?.value).toBe(annualQuote);
  expect(resolveVariable(graph, "", "annual_base_pay_quote")?.unit).toBe("money");
  expect(formulas(detail)).not.toContain("annual_base_pay_quote = annual_base_pay_quote");
});

it("pay quote variables: retain known exclusive cash when super facts are unanswered", () => {
  const { result, detail } = payGraph(
    offer({ inclusion: "excludes", superEligible: "", superRate: "" }),
  );
  expect(detail.formula).toBe("annual_cash_pay = sum(selected_pay_item_cash_before_cap)");
  expect(formulas(detail)).toContain("annual_base_cash_before_cap = annual_base_pay_quote");
  expect(formulas(detail)).toContain("annual_base_super_before_cap = unknown");
  expect(payPrimaryFormula(result, "annual_employer_super")).toBe(
    "annual_employer_super = unavailable",
  );
});

it("pay quote variables: retain unknown members and exclude target and embedded bonus additions", () => {
  const record = offer();
  record.items = {
    earnings: [
      bonus(),
      { ...bonus({ certainty: "target" }), id: "target" },
      { ...bonus({ included: "yes" }), id: "embedded" },
      { ...bonus({ certainty: "" }), id: "draft" },
    ],
  };
  const { detail, graph } = payGraph(record);
  const collection = resolveVariable(graph, "", "selected_pay_item_cash_before_cap");
  expect(collection?.members).toEqual([
    { scope: "", name: "annual_base_cash_before_cap" },
    { scope: "bonus_1", name: "annual_bonus_cash_before_cap" },
    { scope: "bonus_4", name: "annual_bonus_cash_before_cap" },
  ]);
  expect(resolveVariable(graph, "bonus_1", "annual_bonus_quote")?.unit).toBe("money");
  expect(formulas(detail)).toContain("annual_bonus_cash_before_cap = unknown");
  expect(detail.formula).toBe("annual_cash_pay = unavailable");
});

it("pay quote variables: include ineligible cash in capped remuneration and keep contractor guards", () => {
  const record = offer({ amount: "336000" });
  record.items = { earnings: [bonus({ amount: "10000", eligible: "no", inclusion: "excludes" })] };
  const capped = payGraph(record);
  expect(
    resolveVariable(capped.graph, "", "selected_pay_item_remuneration_before_cap")?.members,
  ).toHaveLength(2);
  expect(formulas(capped.detail)).toContain(
    "annual_cash_pay = sum(selected_pay_item_remuneration_before_cap) - annual_employer_super",
  );
  const cappedCash = 313_500.4;
  expect(resolveVariable(capped.graph, "", "annual_cash_pay")?.value).toBe(cappedCash);
  const contractor = offer({
    employment: "sole-trader",
    gst: "inclusive",
    amount: "110000",
    contractorSuper: "5000",
  });
  expect(payGraph(contractor).detail.formula).toBe("annual_cash_pay = annual_base_pay_quote / 1.1");
  contractor.items = { earnings: [bonus()] };
  expect(payGraph(contractor).detail.formula).toBe("annual_cash_pay = unavailable");
});

it("pay quote variables: keep unknown amounts unknown and ignore established zero eligible earnings", () => {
  const missing = payGraph(offer({ amount: "", superEligible: "no" }));
  expect(formulas(missing.detail)).toContain("annual_base_super_before_cap = unknown");
  expect(formulas(missing.detail)).not.toContain("annual_base_eligible_cash_before_cap = 0");
  const record = offer({ superLimit: "" });
  record.items = { earnings: [bonus({ amount: "0", inclusion: "excludes" })] };
  const zero = payGraph(record);
  expect(formulas(zero.detail)).toContain(
    "annual_remuneration = sum(selected_pay_item_remuneration_before_cap)",
  );
  expect(formulas(zero.detail)).not.toContain("annual_remuneration = unavailable");
});

it.each([
  {
    unit: "hour",
    source: "base_hourly_pay_quote",
    quantity: "annual_billable_hours",
    employeeQuantity: "annual_paid_hours",
  },
  {
    unit: "day",
    source: "base_daily_pay_quote",
    quantity: "annual_billable_days",
    employeeQuantity: "annual_paid_days",
  },
])(
  "pay quote variables: contractor $unit revenue uses billable quantity and provenance",
  ({ unit, source, quantity, employeeQuantity }) => {
    const billableUnits = 1500;
    const { detail, graph } = payGraph(
      offer({
        employment: "sole-trader",
        unit,
        amount: "100",
        gst: "exclusive",
        paidUnits: String(billableUnits),
      }),
    );
    expect(formulas(detail)).toContain(`annual_base_pay_quote = ${source} * ${quantity}`);
    expect(formulas(detail)).not.toContain(employeeQuantity);
    expect(resolveVariable(graph, "", quantity)?.value).toBe(billableUnits);
    expect(resolveVariable(graph, "", quantity)?.origin).toContain("billable");
    expect(resolveVariable(graph, "", quantity)?.origin).toContain("sole-trader");
    expect(resolveVariable(graph, "", source)?.origin).toContain("revenue");
  },
);

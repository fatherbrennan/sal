import type { ComparisonResult } from "../calculations/comparison.ts";
import {
  division293Threshold,
  ordinaryFundTaxRate,
} from "../calculations/leave-contribution-tax.ts";
import { leaveValuationKeys } from "../calculations/leave-metrics.ts";
import { numeric } from "../data/numeric.ts";
import { leaveCashOutEquation } from "./leave-cash-out.ts";
import type { Equation, EquationSection } from "./model.ts";
import { eligibleQuoteBasis, selectedItems } from "./pay-items.ts";

type ValuationKey = (typeof leaveValuationKeys)[keyof typeof leaveValuationKeys];
const definitions: Readonly<Record<ValuationKey, readonly [string, string]>> = {
  grossHourly: [
    "ordinary_base_pay_plus_super_per_hour",
    "ordinary_base_cash_per_hour + ordinary_base_super_per_hour",
  ],
  earnedSuper: [
    "annual_leave_allocated_base_super",
    "annual_leave_entitlement_hours * ordinary_base_super_per_hour",
  ],
  earnedGross: [
    "annual_leave_base_pay_plus_super",
    "annual_leave_entitlement_hours * ordinary_base_pay_plus_super_per_hour",
  ],
  payoutSuper: [
    "leave_cash_out_employer_super",
    "min(annual_leave_entitlement_gross_value, max(0, cash_out_super_earnings_limit - cash_out_existing_period_earnings)) * employer_super_percent / 100",
  ],
  payoutSuperTax: [
    "leave_cash_out_fund_tax",
    "leave_cash_out_employer_super * ordinary_fund_tax_rate",
  ],
  payoutNetSuper: [
    "leave_cash_out_net_super",
    "leave_cash_out_employer_super - leave_cash_out_fund_tax",
  ],
  payoutTotal: [
    "leave_cash_out_net_total",
    "hypothetical_annual_leave_cash_after_tax + leave_cash_out_net_super",
  ],
  payoutCash: [
    "hypothetical_annual_leave_cash_after_tax",
    "annual_leave_entitlement_gross_value - additional_annual_tax_from_leave",
  ],
};

function valuationValues(result: ComparisonResult): Equation["values"] {
  const valuation = result.leaveValuation;
  const basis = valuation.superBasis;
  return Object.fromEntries([
    ...Object.values(leaveValuationKeys).map((key) => [definitions[key][0], valuation[key].amount]),
    ["ordinary_base_super_per_hour", valuation.superHourly.amount],
    ["annual_base_employer_super", result.baseSuper],
    ["annual_super_eligible_cash", basis.existingEligible],
    ["cash_out_existing_period_earnings", basis.periodEligible],
    ["cash_out_earnings_period_divisor", basis.periodDivisor],
    ["cash_out_super_earnings_limit", basis.limit],
    ["employer_super_percent", basis.rate],
    ["ordinary_fund_tax_rate", ordinaryFundTaxRate],
    ["cash_out_year_concessional_contributions", valuation.screen.contributions],
    ["annual_concessional_cap", valuation.screen.cap],
    ["cash_out_division_293_screen", valuation.screen.division293Income],
    ["division_293_threshold", division293Threshold],
    ["other_reportable_super", numeric(result.profile, "reportableSuper")],
    ["annual_salary_sacrifice", numeric(result.payer, "sacrifice")],
    ["other_reportable_benefits", numeric(result.profile, "reportableBenefits")],
    ["offer_reportable_benefits", numeric(result.payer, "reportableBenefitsOffer")],
    ["net_investment_loss", numeric(result.profile, "investmentLoss")],
    ["taxable_income_with_leave", result.leaveCashOut.after?.input.taxableIncome ?? null],
  ]);
}

function valuationSections(result: ComparisonResult): EquationSection[] {
  let eligible = "annual_eligible_cash_before_cap";
  if (eligibleQuoteBasis(selectedItems(result), result.payer) === "includes") {
    eligible += " + sum(selected_pay_item_super_before_cap) - annual_employer_super";
  }
  if (result.leaveValuation.superBasis.existingEligible === null) {
    eligible = "unavailable";
  }
  return [
    ...Object.entries(definitions).map(([key, [name, formula]]) => ({
      title: name.replaceAll("_", " "),
      formula: `${name} = ${valuationFormula(result, key, formula)}`,
    })),
    {
      title: "Allocate existing base salary super to leave",
      formula:
        "ordinary_base_super_per_hour = annual_base_employer_super / (paid_hours_per_leave_week * ordinary_salary_weeks_per_year)",
    },
    {
      title: "Extra payment's statutory super headroom",
      formula: `annual_super_eligible_cash = ${eligible}\ncash_out_existing_period_earnings = annual_super_eligible_cash / cash_out_earnings_period_divisor`,
      notes: [
        "For 2025–26, the single cash-out belongs to one quarter. Established equal quarters use annual earnings / 4; otherwise total annual earnings provide a safe upper bound only below the quarterly cap. For 2026–27 the earnings base is annual.",
      ],
    },
    {
      title: "Contribution-cap and Division 293 screening",
      formula:
        "cash_out_year_concessional_contributions = annual_employer_super + annual_salary_sacrifice + other_reportable_super + leave_cash_out_employer_super\ncash_out_division_293_screen = taxable_income_with_leave + other_reportable_benefits + offer_reportable_benefits + net_investment_loss + cash_out_year_concessional_contributions",
      notes: [
        "Net values require modelled contributions <= annual_concessional_cap and, when contributions are positive, cash_out_division_293_screen <= division_293_threshold. No carry-forward cap is assumed. Unknown reportable contributions block dependent annual cash tax too.",
      ],
    },
  ];
}

function valuationFormula(result: ComparisonResult, key: string, formula: string): string {
  if (key === "payoutSuper") {
    const { amount } = result.leaveValuation.payoutSuper;
    if (amount === null) {
      return "unavailable";
    }
    if (amount === 0 && result.leave.entitlementGross.amount === 0) {
      return "0 when annual_leave_entitlement_gross_value = 0";
    }
  }
  return formula;
}

const origins = Object.fromEntries([
  [
    "cash_out_earnings_period_divisor",
    "Selected financial year: 4 only for established equal 2025–26 quarters, otherwise 1.",
  ],
  [
    "cash_out_super_earnings_limit",
    "ATO maximum contribution base: $62,500 per quarter in 2025–26; $270,830 annually in 2026–27.",
  ],
  [
    "employer_super_percent",
    "Offer → employer super rate; this cash-out model requires established statutory 12% treatment.",
  ],
  [
    "ordinary_fund_tax_rate",
    "Ordinary taxed accumulation fund contribution tax: 15%; subject to the displayed screening and model limitations.",
  ],
  [
    "annual_concessional_cap",
    "ATO general concessional cap: $30,000 in 2025–26; $32,500 in 2026–27.",
  ],
  ["division_293_threshold", "Division 293 income and contribution threshold: $250,000."],
  [
    "other_reportable_super",
    "Shared tax settings → other reportable super; no repeat of this offer's employer/sacrificed contributions.",
  ],
  [
    "annual_salary_sacrifice",
    "Offer → annual salary-sacrificed super; no extra cash-out sacrifice is assumed.",
  ],
  ["other_reportable_benefits", "Shared tax settings → other reportable fringe benefits."],
  [
    "offer_reportable_benefits",
    "Offer → reportable fringe benefits; distinct from personal perk values.",
  ],
  ["net_investment_loss", "Shared tax settings → net investment loss."],
]);

const valuationReferences = Object.fromEntries([
  ...[
    "ordinary_base_cash_per_hour",
    "paid_hours_per_leave_week",
    "ordinary_salary_weeks_per_year",
    "annual_leave_entitlement_hours",
  ].map((name) => [name, { scope: "leave_entitlement", name }]),
  ...[
    "annual_base_employer_super",
    "annual_eligible_cash_before_cap",
    "selected_pay_item_super_before_cap",
    "annual_employer_super",
  ].map((name) => [name, { scope: "base_super", name }]),
  ["taxable_income_with_leave", { scope: "after_leave", name: "taxable_income" }],
]);

function leaveValuationEquation(
  key: ValuationKey,
  result: ComparisonResult,
  gross: Equation,
  baseSuper: Equation,
): Equation {
  const cash = leaveCashOutEquation(result, gross);
  const [name, formula] = definitions[key];
  const amount = result.leaveValuation[key];
  const values = { ...cash.values, ...valuationValues(result) };
  return {
    ...cash,
    context:
      "One year's earned leave: base pay and allocated super, with a separate hypothetical additional cash-out. Only the separately labelled hypothetical total adds the payout to real-world value.",
    formula: `${name} = ${valuationFormula(result, key, formula)}`,
    values,
    result: { name, value: amount.amount, unit: "money" },
    warnings: [amount.reason].filter(Boolean),
    notes: [
      ...cash.notes.filter((note) => !note.startsWith("Employer super")),
      "Earned base pay plus super allocates existing remuneration; it excludes bonuses, perks and loading. It is not extra annual pay. Cash-out gross cash includes established loading.",
      "Both the cash payment and contribution are received in the selected year. Net super uses the ordinary 15% contribution-tax estimate; it excludes LISTO, co-contributions and special-fund adjustments. The Division 293 check screens modelled inputs, not a complete assessment.",
    ],
    references: { ...cash.references, ...valuationReferences },
    origins,
    sections: [
      ...(cash.sections ?? []),
      ...valuationSections(result),
      { ...baseSuper, scope: "base_super" },
    ],
    units: {
      ...cash.units,
      ...Object.fromEntries(Object.keys(values).map((variable) => [variable, "money"])),
      ...Object.fromEntries([
        ["employer_super_percent", "percent"],
        ["ordinary_fund_tax_rate", "number"],
        ["cash_out_earnings_period_divisor", "number"],
      ]),
    },
  };
}

export { definitions as leaveValuationDefinitions, leaveValuationEquation };

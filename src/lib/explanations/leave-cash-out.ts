import type { ComparisonResult } from "../calculations/comparison.ts";
import type { Equation, EquationSection } from "./model.ts";
import { annualEquation, taxValue } from "./tax.ts";

const grossName = "annual_leave_entitlement_gross_value";
const netName = "hypothetical_annual_leave_cash_after_tax";
const references = Object.fromEntries([
  [grossName, { scope: "leave_entitlement", name: grossName }],
  ["annual_tax_without_leave", { scope: "before_leave", name: "annual_component_subtotal" }],
  ["annual_tax_with_leave", { scope: "after_leave", name: "annual_component_subtotal" }],
]);
const notes = [
  "Component-based annual estimate: income tax after offsets, Medicare levy, surcharge and supported study-loan repayments. Not final assessed tax or payroll withholding.",
  "Recalculates assessable income, labour income, deductions and tax thresholds; a surcharge threshold can make the extra cash negative.",
  "Illustration only: actual cash-out requires eligibility, agreement and retained leave. Cashing out a full year's entitlement may not be permitted.",
  "Employer super is not cash and is excluded from this figure. No extra personal contributions are assumed. Termination payouts are not modelled.",
];

function cashOutSections(result: ComparisonResult, gross: Equation): EquationSection[] {
  const sections: EquationSection[] = [
    { ...gross, scope: "leave_entitlement" },
    {
      ...annualEquation("rawComponentSubtotal", result.tax.withOffer, result, {
        title: "Selected annual scenario before leave",
      }),
      scope: "before_leave",
    },
  ];
  if (result.leaveCashOut.after === null) {
    sections.push({
      title: "Tax with hypothetical leave is unavailable",
      scope: "after_leave",
      formula: "annual_component_subtotal = unavailable\ntaxable_income = unavailable",
      notes: [result.leaveCashOut.net.reason],
    });
  } else {
    sections.push({
      ...annualEquation("rawComponentSubtotal", result.leaveCashOut.after, result, {
        title: "Annual earnings plus leave payment",
        additionalLeave: true,
      }),
      scope: "after_leave",
    });
  }
  return sections;
}

function leaveCashOutEquation(result: ComparisonResult, gross: Equation): Equation {
  const { extraTax, after } = result.leaveCashOut;
  const net = result.leaveValuation.payoutCash;
  let nextTax: number | null = null;
  if (after !== null) {
    nextTax = taxValue(after.annual.rawComponentSubtotal);
  }
  const values = Object.fromEntries([
    [netName, net.amount],
    [grossName, result.leave.entitlementGross.amount],
    ["additional_annual_tax_from_leave", extraTax],
    ["annual_tax_without_leave", taxValue(result.tax.withOffer.annual.rawComponentSubtotal)],
    ["annual_tax_with_leave", nextTax],
  ]);
  return {
    title: result.offer.name || "Untitled offer",
    context:
      "One year's entitlement paid on top of the selected annual earnings while still employed. Separate from real-world value and recorded leave balances.",
    formula: `${netName} = ${grossName} - additional_annual_tax_from_leave`,
    values,
    result: { name: netName, value: net.amount, unit: "money" },
    references,
    units: Object.fromEntries(Object.keys(values).map((key) => [key, "money"])),
    warnings: [net.reason].filter(Boolean),
    notes,
    sections: [
      {
        title: "Additional annual tax and loan repayments",
        formula:
          "additional_annual_tax_from_leave = annual_tax_with_leave - annual_tax_without_leave",
      },
      ...cashOutSections(result, gross),
    ],
  };
}

export { leaveCashOutEquation };

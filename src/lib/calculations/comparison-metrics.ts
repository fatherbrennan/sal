import type { ComparisonValues, Metric } from "./comparison.ts";
import { difference, percentage, quotient, total } from "./inputs.ts";

const attributedTaxComponents = [
  { key: "incomeTaxAfterLito", label: "Offer-attributed income tax after LITO estimate" },
  { key: "medicare", label: "Offer-attributed Medicare levy estimate" },
  { key: "mls", label: "Offer-attributed Medicare levy surcharge estimate" },
  { key: "help", label: "Offer-attributed HELP repayment estimate" },
] as const;
function comparisonMetrics(data: ComparisonValues): Metric[] {
  const metrics: Metric[] = [];
  const money = (label: string, amount: number | null, lowerIsBetter = false): void => {
    metrics.push({ label, amount, unit: "money", lowerIsBetter });
  };
  const count = (label: string, amount: number | null): void => {
    metrics.push({ label, amount, unit: "number", lowerIsBetter: true });
  };
  money("Package value before tax and costs", data.grossPackage);
  money("Package value after tax", data.netPackage);
  money("Cash after tax and personal super", data.assessedCash);
  money("Cash after tax and job costs", difference(data.assessedCash, data.costs));
  metrics.push(...basePayMetrics(data));
  money("Cash pay / revenue before deductions", data.quote.cash);
  money("Employer / hirer super", data.quote.super);
  money("Personal perk value", data.perkValue);
  money("Incremental annual tax component estimate", data.assignedTax, true);
  money("Gross contributions to super", data.superGross);
  money("Super contributions after ordinary fund tax", data.superNet);
  money("Ordinary tax on super contributions", difference(data.superGross, data.superNet), true);
  money("Package value before tax per paid hour", data.grossHourly);
  money("Cash after tax per paid hour", data.cashHourly);
  money("Cash before tax per paid hour", quotient(data.quote.cash, data.quote.paidHours));
  money("Super after ordinary tax per paid hour", quotient(data.superNet, data.quote.paidHours));
  money("Super before tax per paid hour", quotient(data.superGross, data.quote.paidHours));
  money("Tax per paid hour", quotient(data.assignedTax, data.quote.paidHours), true);
  money(
    "Fund contribution tax per paid hour",
    quotient(difference(data.superGross, data.superNet), data.quote.paidHours),
    true,
  );
  count("Standard paid hours", data.quote.paidHours);
  count("Calendar work hours", data.calendar.hours);
  money(
    "Package value before tax per worked hour",
    quotient(data.grossPackage, data.calendar.hours),
  );
  money("Cash after tax per worked hour", quotient(data.assessedCash, data.calendar.hours));
  count("On-site attendance days", data.calendar.onsiteDays);
  count("Return commute journeys", data.calendar.journeys);
  count("Commute kilometres", data.travel.kilometres);
  count("Commute hours", data.travel.hours);
  money("Commute cash cost / broader estimate", data.travel.cash, true);
  money("Other job costs less reimbursements", data.otherCosts, true);
  return [
    ...metrics,
    ...financialMetrics(data),
    ...packageCostMetrics(data),
    ...timeMetrics(data),
    ...derivedMetrics(data),
  ];
}
function financialMetrics(data: ComparisonValues): Metric[] {
  const financial = total([data.assessedCash, data.superNet]);
  const retained = difference(financial, data.costs);
  const expenses = total([data.otherCosts, data.reimbursements]);
  const cashBeforeCosts = total([data.assessedCash, difference(data.grossCosts, data.costs)]);
  const entries: [string, number | null, boolean | null][] = [
    [
      "Cash after tax and costs per work + travel hour",
      quotient(
        difference(data.assessedCash, data.costs),
        total([data.calendar.hours, data.travel.hours]),
      ),
      false,
    ],
    ["Cash + super after tax", financial, false],
    ["Contractor operating surplus before personal tax", data.operatingSurplus, false],
    ["Cash + super after tax and job costs", retained, false],
    ["Cash + super after tax per paid hour", data.financialHourly, false],
    ["Cash after tax + personal perks", total([data.assessedCash, data.perkValue]), false],
    [
      "Cash + super after tax and costs per work + travel hour",
      quotient(retained, total([data.calendar.hours, data.travel.hours])),
      false,
    ],
    ["Total unreimbursed job costs / broader estimate", data.grossCosts, true],
    ["Salary-sacrificed super", data.sacrifice, null],
    ["Personal after-tax super contributions", data.personal, null],
    ["Other job-cost reimbursements", data.reimbursements, null],
    [
      "Cash after tax, job costs and time",
      difference(difference(data.assessedCash, data.costs), data.netTime),
      false,
    ],
  ];
  return [
    ...entries.map(
      ([label, amount, lowerIsBetter]): Metric => ({ label, amount, unit: "money", lowerIsBetter }),
    ),
    {
      label: "Job-cost share of cash before costs",
      amount: percentage(data.grossCosts, cashBeforeCosts),
      unit: "percent",
      lowerIsBetter: true,
    },
    {
      label: "Other job-cost reimbursement coverage",
      amount: percentage(data.reimbursements, expenses),
      unit: "percent",
      lowerIsBetter: null,
    },
  ];
}
function basePayMetrics(data: ComparisonValues): Metric[] {
  const entries: [string, number | null][] = [
    ["Base cash per paid hour", quotient(data.breakdown.cash, data.quote.paidHours)],
    ["Annual base cash before deductions", data.breakdown.cash],
    ["Base employer super", data.breakdown.super],
    ["Selected bonus / commission cash", data.breakdown.bonusCash],
    ["Selected bonus / commission super", data.breakdown.bonusSuper],
  ];
  return entries.map(([label, amount]) => ({ label, amount, unit: "money", lowerIsBetter: false }));
}
function packageCostMetrics(data: ComparisonValues): Metric[] {
  const net = difference(data.netPackage, data.costs);
  const gross = difference(data.grossPackage, data.grossCosts);
  const hours = total([data.calendar.hours, data.travel.hours]);
  const realWorld = difference(difference(data.netPackage, data.travel.cash), data.netTime);
  const entries: [string, number | null][] = [
    ["Package value after tax and commuting costs", difference(data.netPackage, data.travel.cash)],
    ["Package value after tax, commuting costs and time", realWorld],
    [
      "Package value including hypothetical leave cash-out",
      total([realWorld, data.leaveValuation.payoutTotal.amount]),
    ],
    ["Package value after tax and job costs", net],
    ["Package value after tax and costs per work + travel hour", quotient(net, hours)],
    ["Package value before tax, after job costs", gross],
    ["Package value before tax, after costs per work + travel hour", quotient(gross, hours)],
  ];
  return entries.map(([label, amount]) => ({ label, amount, unit: "money", lowerIsBetter: false }));
}
function timeMetrics(data: ComparisonValues): Metric[] {
  return [
    {
      label: "Commute-time value at package before tax",
      amount: data.grossTime,
      unit: "money",
      lowerIsBetter: true,
    },
    {
      label: "Commute-time value at cash + super after tax",
      amount: data.netTime,
      unit: "money",
      lowerIsBetter: true,
    },
    {
      label: "Package value before tax, after job costs and time",
      amount: difference(difference(data.grossPackage, data.grossCosts), data.grossTime),
      unit: "money",
      lowerIsBetter: false,
    },
    {
      label: "Package value after tax, job costs and time",
      amount: difference(difference(data.netPackage, data.costs), data.netTime),
      unit: "money",
      lowerIsBetter: false,
    },
  ];
}

function derivedMetrics(data: ComparisonValues): Metric[] {
  const metrics: Metric[] = [];
  const money = (label: string, amount: number | null, lowerIsBetter = false): void => {
    metrics.push({ label, amount, unit: "money", lowerIsBetter });
  };
  const count = (label: string, amount: number | null): void => {
    metrics.push({ label, amount, unit: "number", lowerIsBetter: true });
  };
  for (const { key, label } of attributedTaxComponents) {
    const withOffer = data.tax.withOffer.annual[key];
    const withoutOffer = data.tax.withoutOffer.annual[key];
    let amount: number | null = null;
    if (withOffer.status === "available" && withoutOffer.status === "available") {
      amount = withOffer.amount - withoutOffer.amount;
    }
    money(label, amount, true);
  }
  money("Package value after tax per paid hour", quotient(data.netPackage, data.quote.paidHours));
  metrics.push(
    {
      label: "Remote worked hours",
      amount: data.calendar.remoteHours,
      unit: "number",
      lowerIsBetter: null,
    },
    {
      label: "Remote share of worked hours",
      amount: percentage(data.calendar.remoteHours, data.calendar.hours),
      unit: "percent",
      lowerIsBetter: null,
    },
  );
  const workAndTravel = total([data.calendar.hours, data.travel.hours]);
  count("Calendar work + travel hours", workAndTravel);
  metrics.push({
    label: "Commute share of work + travel hours",
    amount: percentage(data.travel.hours, workAndTravel),
    unit: "percent",
    lowerIsBetter: true,
  });
  money(
    "Commute cost / broader estimate per return journey",
    quotient(data.travel.cash, data.calendar.journeys),
    true,
  );
  return metrics;
}

export { attributedTaxComponents, comparisonMetrics };

import type { ComparisonResult } from "./calculations/comparison.ts";
import { value } from "./calculations/inputs.ts";
import { comparisonLabels } from "./comparison-labels.ts";
import { leaveFieldVisible } from "./fields/annual-leave.ts";
import type { MissingInput } from "./result-presentation.ts";

const metricGroups = [
  {
    title: "Package value after commuting",
    alwaysVisible: true,
    labels: ["Package value after tax, commuting costs and time"],
  },
  {
    title: "Package components and commute adjustments",
    alwaysVisible: true,
    labels: [
      "Cash after tax and personal super",
      "Super contributions after ordinary fund tax",
      "Personal perk value",
      "Commute cash cost / broader estimate",
      "Commute-time value at cash + super after tax",
      "Cash + super after tax per paid hour",
    ],
  },
  {
    title: "Paid annual leave earned",
    alwaysVisible: true,
    labels: [
      "Annual leave entitlement (weeks)",
      "Annual leave entitlement (hours)",
      "Annual leave: base pay plus super",
    ],
  },
  {
    title: "Hypothetical cash-out of one year’s annual leave",
    alwaysVisible: true,
    labels: [
      "Package value including hypothetical leave cash-out",
      "Hypothetical leave cash-out: net total",
      "Hypothetical annual leave cash-out after tax",
      "Hypothetical leave cash-out: net super",
    ],
  },
  {
    title: "Pay, super and package value",
    alwaysVisible: false,
    labels: [
      "Package value before tax and costs",
      "Package value after tax",
      "Cash + super after tax",
      "Cash after tax + personal perks",
      "Annual base cash before deductions",
      "Cash pay / revenue before deductions",
      "Contractor operating surplus before personal tax",
      "Employer / hirer super",
      "Base employer super",
      "Gross contributions to super",
      "Salary-sacrificed super",
      "Personal after-tax super contributions",
      "Ordinary tax on super contributions",
      "Base cash per paid hour",
      "Package value before tax per paid hour",
      "Package value after tax per paid hour",
      "Cash before tax per paid hour",
      "Cash after tax per paid hour",
      "Super before tax per paid hour",
      "Super after ordinary tax per paid hour",
    ],
  },
  {
    title: "Work and commuting",
    alwaysVisible: false,
    labels: [
      "Standard paid hours",
      "Calendar work hours",
      "On-site attendance days",
      "Remote worked hours",
      "Remote share of worked hours",
      "Return commute journeys",
      "Commute kilometres",
      "Commute hours",
      "Calendar work + travel hours",
      "Commute share of work + travel hours",
      "Commute cost / broader estimate per return journey",
      "Package value after tax and commuting costs",
      "Commute-time value at package before tax",
      "Package value before tax per worked hour",
      "Cash after tax per worked hour",
    ],
  },
  {
    title: "Job costs and adjusted values",
    alwaysVisible: false,
    labels: [
      "Other job costs less reimbursements",
      "Other job-cost reimbursements",
      "Other job-cost reimbursement coverage",
      "Total unreimbursed job costs / broader estimate",
      "Job-cost share of cash before costs",
      "Cash after tax and job costs",
      "Cash + super after tax and job costs",
      "Package value after tax and job costs",
      "Cash after tax and costs per work + travel hour",
      "Cash + super after tax and costs per work + travel hour",
      "Package value after tax and costs per work + travel hour",
      "Package value before tax, after job costs",
      "Package value before tax, after costs per work + travel hour",
      "Cash after tax, job costs and time",
      "Package value before tax, after job costs and time",
      "Package value after tax, job costs and time",
    ],
  },
  {
    title: "Bonuses, commissions and one-offs",
    alwaysVisible: false,
    labels: ["Selected bonus / commission cash", "Selected bonus / commission super"],
  },
  {
    title: "Annual leave details",
    alwaysVisible: false,
    labels: [
      "Ordinary hours per week",
      "Ordinary leave base cash per hour",
      "Ordinary leave base pay plus super per hour",
      "Additional leave loading per hour",
      "Annual entitlement: base cash value",
      "Annual entitlement: loading value",
      "Annual leave: allocated base employer super",
      "Annual entitlement: gross illustrative value",
      "Hypothetical leave cash-out: employer super",
      "Hypothetical leave cash-out: ordinary fund tax",
      "Recorded unused balance (hours)",
      "Recorded balance: base cash value",
      "Recorded balance: loading value",
      "Recorded balance: gross illustrative value",
    ],
  },
  {
    title: "Tax estimates and assumptions",
    alwaysVisible: false,
    labels: [
      "Incremental annual tax component estimate",
      "Offer-attributed income tax after LITO estimate",
      "Offer-attributed Medicare levy estimate",
      "Offer-attributed Medicare levy surcharge estimate",
      "Offer-attributed HELP repayment estimate",
      "Tax per paid hour",
      "Fund contribution tax per paid hour",
    ],
  },
];

function comparisonGroups(contractor: boolean) {
  return metricGroups.map((group) => ({
    ...group,
    labels: group.labels.filter(
      (label) => label !== "Contractor operating surplus before personal tax" || contractor,
    ),
  }));
}

const earningsLabels: Readonly<Record<string, Readonly<Record<string, string>>>> = {
  employee: { "Cash pay / revenue before deductions": "Total cash pay before tax" },
  "sole-trader": {
    "Cash pay / revenue before deductions": "Contract revenue excluding GST",
    "Annual base cash before deductions": "Base contract revenue excluding GST",
    "Base cash per paid hour": "Base contract revenue excluding GST per standard paid hour",
    "Cash before tax per paid hour": "Contract revenue excluding GST per standard paid hour",
  },
};

function comparisonLabel(label: string, employment = "employee"): string {
  let kind = "employee";
  if (employment === "sole-trader" || employment === "mixed") {
    kind = employment;
  }
  return earningsLabels[kind]?.[label] ?? comparisonLabels[label] ?? label;
}

function comparisonEmployment(results: readonly ComparisonResult[]): string {
  const contractors = results.filter(
    (result) => value(result.payer, "employment") === "sole-trader",
  );
  if (contractors.length === 0) {
    return "employee";
  }
  if (contractors.length === results.length) {
    return "sole-trader";
  }
  return "mixed";
}

function leaveEditInput(result: ComparisonResult): MissingInput {
  let target = "annualLeave";
  if (!leaveFieldVisible(target, result.offer.fields)) {
    target = "employment";
  }
  return {
    scope: "offer",
    target,
    section: "Paid annual leave",
    label: "Paid annual leave inputs",
  };
}

export { comparisonEmployment, comparisonGroups, comparisonLabel, leaveEditInput, metricGroups };

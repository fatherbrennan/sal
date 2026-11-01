import { expect, it } from "bun:test";
import { calculateComparison } from "../../src/lib/calculations/comparison.ts";
import { leaveCashOutLabel, leaveReason } from "../../src/lib/calculations/leave-metrics.ts";
import { metricHints } from "../../src/lib/comparison-hints.ts";
import {
  comparisonEmployment,
  comparisonGroups,
  comparisonLabel,
  leaveEditInput,
  metricGroups,
} from "../../src/lib/comparison-presentation.ts";
import { comparisonEquation } from "../../src/lib/explanations/comparison.ts";
import { differenceEquation } from "../../src/lib/explanations/difference.ts";
import { display } from "../../src/lib/format.ts";
import { equationInspection } from "../../src/lib/inspector/equations.ts";
import { differenceLabel, missingInputs } from "../../src/lib/result-presentation.ts";
import { bonus, offer, profile } from "../calculations/package-fixture.ts";

function result(fields: Record<string, string> = {}) {
  return calculateComparison({
    offer: offer(fields),
    profile,
    vehicle: {},
    year: "2026-27",
    target: false,
    oneOff: false,
    timeValue: true,
  });
}

it("keeps every existing comparison metric in exactly one accessible group", () => {
  const metricCount = 88;
  const labels = metricGroups.flatMap((group) => group.labels);
  expect(new Set(labels).size).toBe(metricCount);
  expect(labels.toSorted((left, right) => left.localeCompare(right))).toEqual(
    result()
      .metrics.map(({ label }) => label)
      .toSorted((left, right) => left.localeCompare(right)),
  );
});

it("explains every category metric instead of repeating its label", () => {
  for (const label of metricGroups.flatMap((group) => group.labels)) {
    const hint = metricHints[label];
    expect(hint, label).toBeString();
    expect(hint?.trim(), label).not.toBe("");
    expect(hint, label).not.toBe(label);
    expect(hint, label).not.toBe(comparisonLabel(label));
  }
});

it("shows headline components, earned leave and the separate cash-out breakdown", () => {
  const visible = metricGroups
    .filter((group) => group.alwaysVisible)
    .flatMap((group) => group.labels);
  expect(visible).toEqual([
    "Package value after tax, commuting costs and time",
    "Cash after tax and personal super",
    "Super contributions after ordinary fund tax",
    "Personal perk value",
    "Commute cash cost / broader estimate",
    "Commute-time value at cash + super after tax",
    "Cash + super after tax per paid hour",
    "Annual leave entitlement (weeks)",
    "Annual leave entitlement (hours)",
    "Annual leave: base pay plus super",
    "Package value including hypothetical leave cash-out",
    "Hypothetical leave cash-out: net total",
    "Hypothetical annual leave cash-out after tax",
    "Hypothetical leave cash-out: net super",
  ]);
  expect(metricGroups.filter((group) => !group.alwaysVisible).map((group) => group.title)).toEqual([
    "Pay, super and package value",
    "Work and commuting",
    "Job costs and adjusted values",
    "Bonuses, commissions and one-offs",
    "Annual leave details",
    "Tax estimates and assumptions",
  ]);
});

it("shows contractor profit only when the comparison includes a contractor", () => {
  const label = "Contractor operating surplus before personal tax";
  expect(comparisonGroups(false).flatMap((group) => group.labels)).not.toContain(label);
  expect(comparisonGroups(true).flatMap((group) => group.labels)).toContain(label);
});

it("labels every metric and routes missing leave facts without treating unknown values as zero", () => {
  const calculated = result();
  const labels = calculated.metrics.map(({ label }) => comparisonLabel(label));
  expect(new Set(labels).size).toBe(calculated.metrics.length);
  expect(comparisonLabel("Package value after tax, commuting costs and time")).toBe(
    "Package value after tax, commute costs and commute time value",
  );
  expect(comparisonLabel("Target upside: cash after tax")).toBe("Target increase: cash after tax");
  expect(leaveReason(calculated, "Annual entitlement: gross illustrative value")).toBe(
    calculated.leave.entitlementGross.reason,
  );
  expect(leaveReason(calculated, leaveCashOutLabel)).toBe(
    calculated.leaveValuation.payoutCash.reason,
  );
  expect(leaveReason(calculated, "unknown metric")).toBe("");
  expect(leaveEditInput(calculated).target).toBe("annualLeave");
  expect(leaveEditInput(result({ employment: "sole-trader" })).target).toBe("employment");
});

it("distinguishes employee pay, contractor revenue and mixed comparisons", () => {
  const employee = result();
  const contractor = result({ employment: "sole-trader" });
  expect(comparisonEmployment([])).toBe("employee");
  expect(comparisonEmployment([employee])).toBe("employee");
  expect(comparisonEmployment([contractor])).toBe("sole-trader");
  expect(comparisonEmployment([employee, contractor])).toBe("mixed");
  const label = "Cash pay / revenue before deductions";
  expect(comparisonLabel(label, "employee")).toBe("Total cash pay before tax");
  expect(comparisonLabel(label, "sole-trader")).toBe("Contract revenue excluding GST");
  expect(comparisonLabel(label, "mixed")).toBe("Cash pay / contract revenue");
  expect(comparisonLabel("Annual base cash before deductions", "sole-trader")).toBe(
    "Base contract revenue excluding GST",
  );
  expect(comparisonLabel("Cash before tax per paid hour", "sole-trader")).toBe(
    "Contract revenue excluding GST per standard paid hour",
  );
  expect(comparisonLabel("Cash after tax and personal super", "sole-trader")).toBe(
    "Cash after tax",
  );
  expect(comparisonLabel("Unknown metric")).toBe("Unknown metric");
});

it("describes favorable and unfavorable changes without relying on colour", () => {
  const cash = { label: "Cash", unit: "money", amount: 100, lowerIsBetter: false } as const;
  const change = 20;
  expect(differenceLabel(change, cash)).toBe("$20.00 more · better");
  expect(differenceLabel(-change, cash)).toBe("$20.00 less · worse");
  expect(differenceLabel(change, { ...cash, lowerIsBetter: true })).toBe("$20.00 more · worse");
  expect(differenceLabel(-change, { ...cash, lowerIsBetter: true })).toBe("$20.00 less · better");
  expect(differenceLabel(0, cash)).toBe("No difference");
  expect(differenceLabel(null, cash)).toBe("Difference unavailable");
});

it.each([
  ["Annual leave entitlement (weeks)", false],
  ["Ordinary leave base cash per hour", false],
  ["Additional leave loading per hour", false],
  ["Annual entitlement: base cash value", false],
  ["Annual entitlement: loading value", false],
  ["Annual entitlement: gross illustrative value", false],
  ["Ordinary leave base pay plus super per hour", false],
  ["Annual leave: allocated base employer super", false],
  ["Annual leave: base pay plus super", false],
  ["Hypothetical leave cash-out: employer super", false],
  ["Hypothetical leave cash-out: net super", false],
  ["Hypothetical leave cash-out: net total", false],
  ["Hypothetical annual leave cash-out after tax", false],
  ["Hypothetical leave cash-out: ordinary fund tax", true],
  ["Ordinary hours per week", null],
  ["Annual leave entitlement (hours)", null],
  ["Recorded unused balance (hours)", null],
  ["Recorded balance: base cash value", null],
  ["Recorded balance: loading value", null],
  ["Recorded balance: gross illustrative value", null],
] as const)("assigns the agreed leave difference direction: %s", (label, lowerIsBetter) => {
  expect(result().metrics.find((metric) => metric.label === label)?.lowerIsBetter).toBe(
    lowerIsBetter,
  );
});

it("links unknown salary inputs while retaining explicit zero and independent results", () => {
  expect(missingInputs(result({ amount: "", inclusion: "" }))).toEqual(
    expect.arrayContaining([
      expect.objectContaining({ scope: "offer", target: "amount" }),
      expect.objectContaining({ scope: "offer", target: "inclusion" }),
    ]),
  );
  expect(missingInputs(result({ amount: "0" })).some(({ target }) => target === "amount")).toBe(
    false,
  );
});

it("routes a blank personal override to that offer instead of shared settings", () => {
  const input = offer();
  input.items = {
    ...input.items,
    taxOverride: [{ id: "override", fields: { hospitalCover: "" } }],
  };
  const calculated = calculateComparison({
    offer: input,
    profile,
    vehicle: {},
    year: "2026-27",
    target: false,
    oneOff: false,
    timeValue: true,
  });
  expect(missingInputs(calculated)).toContainEqual(
    expect.objectContaining({ scope: "offer", target: "taxOverride:override:hospitalCover" }),
  );
  expect(missingInputs({ ...calculated, offer: offer() })).toContainEqual(
    expect.objectContaining({ scope: "profile", target: "hospitalCover" }),
  );
});

it("keeps unavailable amounts distinct from zero and labels time differences as numbers", () => {
  const hours = { label: "Commute hours", unit: "number", amount: 0, lowerIsBetter: true } as const;
  expect(differenceLabel(1, hours)).toBe("1 more · worse");
  expect(display(null)).toBe("Unavailable");
  expect(display(0)).toBe("$0.00");
});

it("links incomplete rows in the selected scenario without asking about excluded payments", () => {
  const input = offer();
  input.items = {
    earnings: [
      bonus({ amount: "", certainty: "target", inclusion: "" }),
      { ...bonus({ amount: "", recurrence: "once" }), id: "once" },
    ],
    perks: [{ id: "perk", fields: { label: "Parking", amount: "", frequency: "annual" } }],
    costs: [{ id: "cost", fields: { amount: "", reimbursement: "0", recurrence: "once" } }],
    roster: [
      { id: "shift", fields: { day: "1", start: "", hours: "8", journeys: "1", place: "onsite" } },
    ],
  };
  const base = {
    offer: input,
    profile,
    vehicle: {},
    year: "2026-27",
    target: false,
    oneOff: false,
    timeValue: true,
  } as const;
  const recurring = missingInputs(calculateComparison(base)).map(({ target }) => target);
  expect(recurring).toContain("perks:perk:amount");
  expect(recurring).toContain("roster:shift:start");
  expect(recurring).not.toContain("roster:shift:breakMinutes");
  expect(
    recurring.some((target) => target.startsWith("earnings:") || target.startsWith("costs:")),
  ).toBe(false);
  const combined = missingInputs(calculateComparison({ ...base, target: true, oneOff: true })).map(
    ({ target }) => target,
  );
  expect(combined).toEqual(
    expect.arrayContaining([
      "earnings:bonus:amount",
      "earnings:bonus:bonusSuper",
      "earnings:once:amount",
      "costs:cost:amount",
    ]),
  );
  expect(combined).not.toContain("costs:cost:frequency");
});

it("keeps employee and contractor names attached to their own difference sources", () => {
  const payLabel = "Cash pay / revenue before deductions";
  const amounts = { employee: 100_000, contractor: 112_000 };
  const sources = ["full-time", "sole-trader"].map((employment) => {
    const input = {
      offer: offer({ employment, gst: "exclusive", contractorSuper: "0" }),
      profile,
      vehicle: {},
      year: "2026-27" as const,
      target: false,
      oneOff: false,
      timeValue: false,
    };
    return comparisonEquation(payLabel, input, calculateComparison(input));
  });
  const model = equationInspection(
    [
      differenceEquation(
        "Cash pay / contract revenue difference",
        amounts.employee,
        amounts.contractor,
        sources,
      ),
    ],
    "Cash pay / contract revenue difference",
  );
  const nodes = [...model.nodes.values()];
  expect(nodes.find((node) => node.symbol === "offer_0__annual_cash_pay")?.label).toStartWith(
    "Total cash pay before tax",
  );
  expect(nodes.find((node) => node.symbol === "offer_1__annual_cash_pay")?.label).toStartWith(
    "Contract revenue excluding GST",
  );
});

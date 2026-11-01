import type { ComparisonInput } from "../calculations/comparison.ts";
import { value } from "../calculations/inputs.ts";

function scenarioContext(input: ComparisonInput, name: string): string {
  let earnings = "Guaranteed";
  let recurrence = "Recurring";
  let time = "Travel-time value off";
  if (input.target) {
    earnings = "Target";
  }
  if (input.baseOnly === true) {
    earnings = "Base only; all bonus and commission rows excluded";
  }
  if (input.oneOff) {
    recurrence = "Including one-offs";
  }
  if (input.timeValue) {
    time = "Travel-time value on";
  }
  const parts = [input.year, earnings, recurrence, time];
  if (value(input.offer.fields, "costMethod") === "ato") {
    parts.push("Broader ATO vehicle-cost estimate");
  }
  let context = parts.join(" · ");
  if (name === "annual_contractor_operating_surplus") {
    context +=
      "\nSole-trader revenue excluding GST less entered business cash costs, before personal tax and contributions. This is not taxable profit or an invoice-receipt forecast. Enter all work, including non-billable work, in the roster for meaningful work-hour comparisons.";
  }
  if (name.includes("net_package")) {
    context +=
      "\nEstimate includes annual cash, net super and personal perk values; it is not bank cash.";
  }
  if (name.includes("after_commuting_costs")) {
    context +=
      "\nSubtracts commuting energy, maintenance and trip charges, or the selected broader ATO estimate. Extra job costs are excluded from this subtotal. Contractor operating costs are already reflected in cash.";
  }
  if (name.includes("financial_value")) {
    context +=
      "\nCash plus net super excludes personal perks. Super includes employee-directed contributions; this is not all spendable cash or extra employer reward.";
  }
  if (name.includes("after_costs_per_work_and_travel_hour")) {
    context +=
      "\nUses roster worked hours plus commute hours, excluding unpaid breaks. No monetary time value is deducted; zero or unknown hours leave the rate unavailable.";
  }
  if (["remote_work_percent", "commute_time_percent", "commute_cost_per_journey"].includes(name)) {
    context += "\nA zero or unknown denominator leaves this ratio unavailable.";
  }
  return context;
}

export { scenarioContext };

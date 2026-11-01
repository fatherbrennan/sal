import { expect, it } from "bun:test";
import type { ComparisonInput } from "../../src/lib/calculations/comparison.ts";
import type { Fields } from "../../src/lib/data/model.d.ts";
import { itemSections } from "../../src/lib/explanations/item-sections.ts";
import { offer, profile } from "../calculations/package-fixture.ts";

function items(fields: Fields) {
  const record = offer();
  record.items = { costs: [{ id: "cost", fields }] };
  const input: ComparisonInput = {
    offer: record,
    profile,
    vehicle: {},
    year: "2026-27",
    target: false,
    oneOff: false,
    timeValue: true,
  };
  return itemSections(input)[0]?.sections ?? [];
}

it("does not invent annual costs from an unanswered frequency or recurrence", () => {
  const frequency = items({
    amount: "100",
    reimbursement: "0",
    recurrence: "recurring",
    frequency: "",
  });
  expect(frequency[0]?.formula).toBe("annual_job_cost_before_reimbursement = unknown");
  expect(frequency[1]?.formula).toBe("annual_job_cost_reimbursement = unknown");
  expect(items({ amount: "100", reimbursement: "0", recurrence: "" })[0]?.formula).toBe(
    "annual_net_job_cost = unknown\nannual_job_cost_reimbursement = unknown",
  );
});

it("keeps an invalid reimbursement unavailable rather than describing a negative cost", () => {
  const result = items({
    amount: "100",
    reimbursement: "101",
    recurrence: "recurring",
    frequency: "annual",
  });
  expect(result[0]?.formula).toBe(
    "annual_net_job_cost = unavailable\nannual_job_cost_reimbursement = unavailable",
  );
  expect(result[0]?.notes).toEqual(["Reimbursement exceeds its own cost."]);
});

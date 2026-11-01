import { expect, it } from "bun:test";
import { commute, jobCosts, perks } from "../../src/lib/calculations/costs.ts";
import { offer } from "./package-fixture.ts";

const expected = {
  journeys: 100,
  recurringCost: 150,
  allCosts: 250,
  personalPerks: 524,
  noEnergyCost: 750,
  atoPreviousYear: 2700,
  atoCurrentYear: 2775,
};

it("calculates 4000 km at 8 L/100 km and $2/L as $640", () => {
  const result = commute(
    offer().fields,
    { energy: "fuel", consumption: "8", energyPrice: "2" },
    expected.journeys,
    "2026-27",
  );
  expect(result).toMatchObject({ kilometres: 4000, hours: 100, cash: 640 });
  expect(commute({}, {}, 0, "2026-27").cash).toBe(0);
  expect(commute({}, {}, null, "2026-27").cash).toBeNull();
});
it("supports directional travel, overrides, running charges and broader ATO estimates", () => {
  const fields = {
    costMethod: "entered",
    tripBasis: "legs",
    outDistance: "10",
    backDistance: "15",
    outMinutes: "20",
    backMinutes: "40",
    energy: "electric",
    energyPrice: "0.25",
    consumption: "20",
    maintenance: "0.1",
    tripCharges: "5",
  };
  expect(commute(fields, { energyPrice: "9" }, expected.journeys, "2026-27")).toMatchObject({
    kilometres: 2500,
    hours: 100,
    cash: 875,
  });
  expect(commute({ ...fields, costMethod: "ato" }, {}, expected.journeys, "2025-26").cash).toBe(
    expected.atoPreviousYear,
  );
  expect(commute({ ...fields, costMethod: "ato" }, {}, expected.journeys, "2026-27").cash).toBe(
    expected.atoCurrentYear,
  );
  expect(commute({ ...fields, energy: "none" }, {}, expected.journeys, "2026-27").cash).toBe(
    expected.noEnergyCost,
  );
  expect(commute({ ...fields, costMethod: "" }, {}, expected.journeys, "2026-27").cash).toBeNull();
  expect(
    commute({ ...fields, tripBasis: "" }, {}, expected.journeys, "2026-27").kilometres,
  ).toBeNull();
});
it("values only entered perks and costs and separates one-off cash", () => {
  const record = offer();
  record.items = {
    perks: [
      { id: "p1", fields: { amount: "10", frequency: "monthly" } },
      { id: "p2", fields: { amount: "2", frequency: "weekly" } },
      { id: "p3", fields: { amount: "3", frequency: "journey" } },
    ],
    costs: [
      {
        id: "c1",
        fields: {
          amount: "200",
          reimbursement: "50",
          frequency: "annual",
          recurrence: "recurring",
        },
      },
      { id: "c2", fields: { amount: "100", reimbursement: "0", recurrence: "once" } },
    ],
  };
  expect(perks(record, expected.journeys)).toBe(expected.personalPerks);
  expect(jobCosts(record, expected.journeys, false)).toBe(expected.recurringCost);
  expect(jobCosts(record, expected.journeys, true)).toBe(expected.allCosts);
  record.items = {
    perks: [{ id: "p", fields: { amount: "1" } }],
    costs: [{ id: "c", fields: { amount: "1" } }],
  };
  expect(perks(record, null)).toBeNull();
  expect(jobCosts(record, null, false)).toBeNull();
});

it("leaves excess reimbursements unavailable instead of inventing negative job costs", () => {
  const record = offer();
  record.items = {
    costs: [{ id: "excess", fields: { amount: "10", reimbursement: "11", recurrence: "once" } }],
  };
  expect(jobCosts(record, 0, true)).toBeNull();
});

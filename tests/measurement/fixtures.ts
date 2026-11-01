import { newRecord, ruleVersion, schemaVersion } from "../../src/lib/data/schema.ts";
import { bonus, offer, profile } from "../calculations/package-fixture.ts";

const now = "2026-10-23T00:00:00.000Z";
function backupFixture() {
  const first = offer();
  first.name = "Remote offer";
  first.items = {
    earnings: [
      bonus({ certainty: "target" }),
      { ...bonus({ amount: "1120", label: "Sign-on", recurrence: "once" }), id: "sign-on" },
    ],
    costs: [
      {
        id: "setup",
        fields: { label: "Equipment", amount: "100", reimbursement: "0", recurrence: "once" },
      },
    ],
    roster: [
      {
        id: "remote-wednesday",
        fields: { day: "1", start: "09:00", hours: "8", journeys: "0", place: "remote" },
      },
    ],
  };
  const second = offer({ amount: "123200" });
  second.id = "offer-b";
  second.name = "Office offer";
  second.items = {
    roster: [
      {
        id: "wednesday",
        fields: { day: "1", start: "09:00", hours: "8", journeys: "1", place: "onsite" },
      },
    ],
  };
  const settings = newRecord("profile", "profile", now);
  settings.fields = { ...profile };
  const vehicle = newRecord("vehicle", "vehicle", now);
  vehicle.fields = { energy: "fuel", energyPrice: "2", consumption: "8" };
  const comparison = newRecord("comparison", "compare-a", now);
  comparison.name = "Two offers";
  comparison.fields = { ...comparison.fields, baseline: first.id };
  comparison.items = {
    offers: [
      { id: "a", fields: { offerId: first.id } },
      { id: "b", fields: { offerId: second.id } },
    ],
  };
  return {
    schemaVersion,
    ruleVersion,
    exportedAt: now,
    records: [first, second, settings, vehicle, comparison],
  };
}

export { backupFixture };

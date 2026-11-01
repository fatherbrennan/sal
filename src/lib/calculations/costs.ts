import type { Fields, Item, SalRecord } from "../data/model.d.ts";
import { numeric } from "../data/numeric.ts";
import { difference, inherited, product, rows, total, value } from "./inputs.ts";
import type { TaxYear } from "./tax/types.d.ts";

interface Commute {
  kilometres: number | null;
  hours: number | null;
  cash: number | null;
  note: string;
}
const hundredKm = 100;
const minutesPerHour = 60;
const monthsPerYear = 12;
const defaultWeeks = 52;
const priorYearRate = 0.88;
function tripValue(
  fields: Fields,
  combined: string,
  outward: string,
  inward: string,
): number | null {
  if (value(fields, "tripBasis") === "legs") {
    return total([numeric(fields, outward), numeric(fields, inward)]);
  }
  if (value(fields, "tripBasis") === "return") {
    return numeric(fields, combined);
  }
  return null;
}
function commute(offer: Fields, shared: Fields, journeys: number | null, year: TaxYear): Commute {
  if (journeys === 0) {
    return {
      kilometres: 0,
      hours: 0,
      cash: 0,
      note: "No commute journeys in the entered calendar.",
    };
  }
  const kilometres = product(journeys, tripValue(offer, "distance", "outDistance", "backDistance"));
  const minutes = product(journeys, tripValue(offer, "minutes", "outMinutes", "backMinutes"));
  let hours: number | null = null;
  if (minutes !== null) {
    hours = minutes / minutesPerHour;
  }
  if (value(offer, "costMethod") === "ato") {
    let rate = 0.91;
    if (year === "2025-26") {
      rate = priorYearRate;
    }
    return {
      kilometres,
      hours,
      cash: total([product(kilometres, rate), product(journeys, numeric(offer, "tripCharges"))]),
      note: "Broader ATO vehicle-cost estimate includes ownership costs; entered parking, tolls and fares are added separately. This comparison is not a commuting tax deduction or a running-cost-only estimate.",
    };
  }
  if (value(offer, "costMethod") !== "entered") {
    return { kilometres, hours, cash: null, note: "Choose a commuting-cost method." };
  }
  let energyCost: number | null = null;
  if (value(offer, "energy") === "none") {
    energyCost = 0;
  } else if (["fuel", "electric"].includes(value(offer, "energy"))) {
    let compatible: Fields = {};
    if (value(offer, "energy") === value(shared, "energy")) {
      compatible = shared;
    }
    const units = product(kilometres, inherited(offer, compatible, "consumption"));
    energyCost = product(units, inherited(offer, compatible, "energyPrice"));
    if (energyCost !== null) {
      energyCost /= hundredKm;
    }
  }
  const maintenance = product(kilometres, numeric(offer, "maintenance"));
  const charges = product(journeys, numeric(offer, "tripCharges"));
  return {
    kilometres,
    hours,
    cash: total([energyCost, maintenance, charges]),
    note: "Entered energy, running maintenance and trip charges. Ownership costs are excluded.",
  };
}
function recurringValue(fields: Fields, key: string, journeys: number | null): number | null {
  const amount = numeric(fields, key);
  const frequency = value(fields, "frequency");
  if (frequency === "annual") {
    return amount;
  }
  if (frequency === "monthly") {
    return product(amount, monthsPerYear);
  }
  if (frequency === "weekly") {
    return product(amount, defaultWeeks);
  }
  if (frequency === "journey") {
    return product(amount, journeys);
  }
  return null;
}
function costValue(
  item: Item,
  journeys: number | null,
  oneOff: boolean,
  key: "amount" | "reimbursement",
): number | null {
  const amount = numeric(item.fields, "amount");
  const reimbursement = numeric(item.fields, "reimbursement");
  if (amount !== null && reimbursement !== null && reimbursement > amount) {
    return null;
  }
  const recurrence = value(item.fields, "recurrence");
  if (!recurrence) {
    return null;
  }
  if (recurrence === "once") {
    if (!oneOff) {
      return 0;
    }
    return numeric(item.fields, key);
  }
  return recurringValue(item.fields, key, journeys);
}
function jobCosts(record: SalRecord, journeys: number | null, oneOff: boolean): number | null {
  return total(
    rows(record, "costs").map((item) =>
      difference(
        costValue(item, journeys, oneOff, "amount"),
        costValue(item, journeys, oneOff, "reimbursement"),
      ),
    ),
  );
}
function grossJobCosts(fields: Fields, costs: number | null): number | null {
  if (value(fields, "employment") === "sole-trader") {
    return total([costs, numeric(fields, "businessCosts")]);
  }
  return costs;
}
function perks(record: SalRecord, journeys: number | null): number | null {
  return total(
    rows(record, "perks").map((item) => recurringValue(item.fields, "amount", journeys)),
  );
}

function jobCostReimbursements(record: SalRecord, journeys: number | null, oneOff: boolean) {
  return total(
    rows(record, "costs").map((item) => costValue(item, journeys, oneOff, "reimbursement")),
  );
}

function travelTimeValue(rate: number | null, hours: number | null, enabled: boolean) {
  if (!enabled || hours === 0) {
    return 0;
  }
  if (rate === null || rate < 0) {
    return null;
  }
  return product(rate, hours);
}

export type { Commute };
export {
  commute,
  costValue,
  grossJobCosts,
  jobCostReimbursements,
  jobCosts,
  perks,
  recurringValue,
  travelTimeValue,
  tripValue,
};

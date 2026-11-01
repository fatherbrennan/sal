import type { LeaveAmount } from "./annual-leave.ts";
import { calculateProfileTax } from "./tax/profile.ts";
import { numeric } from "./tax/profile-inputs.ts";
import type { ProfileScenario, ProfileTaxInput } from "./tax/types.d.ts";

interface LeaveCashOut {
  net: LeaveAmount;
  extraTax: number | null;
  after: ProfileScenario | null;
}

function unavailable(reason: string): LeaveCashOut {
  return { net: { amount: null, reason }, extraTax: null, after: null };
}

function leaveCashOut(
  gross: LeaveAmount,
  input: ProfileTaxInput,
  before: ProfileScenario,
): LeaveCashOut {
  if (gross.amount === null) {
    return unavailable(gross.reason);
  }
  if (!Number.isFinite(gross.amount) || gross.amount < 0) {
    return unavailable(
      "The hypothetical gross leave payment must be a finite, non-negative amount.",
    );
  }
  if (numeric(input.profile, "taxableWithOffer") !== null) {
    return unavailable(
      "A saved taxable-income override does not establish taxable income after an extra leave payment.",
    );
  }
  const priorTax = before.annual.rawComponentSubtotal;
  if (priorTax.status === "unavailable") {
    return unavailable(priorTax.reason);
  }
  if (before.input.help?.scheme === "help" && before.input.mls?.household !== "single") {
    return unavailable(
      "The HELP family exemption must be re-established for the extra leave payment; the saved scenario answer cannot be reused.",
    );
  }
  const income = input.offer.assessableIncome;
  const labour = input.offer.assessableLabourIncome;
  if (income === null || labour === null) {
    return unavailable(
      "Establish both assessable income and assessable labour income before adding hypothetical leave pay.",
    );
  }
  if (!(Number.isFinite(income + gross.amount) && Number.isFinite(labour + gross.amount))) {
    return unavailable(
      "Income including the hypothetical leave payment exceeds the supported numeric range.",
    );
  }
  const after = calculateProfileTax({
    ...input,
    offer: {
      ...input.offer,
      assessableIncome: income + gross.amount,
      assessableLabourIncome: labour + gross.amount,
    },
  }).withOffer;
  const nextTax = after.annual.rawComponentSubtotal;
  if (nextTax.status === "unavailable") {
    return { ...unavailable(nextTax.reason), after };
  }
  const extraTax = nextTax.amount - priorTax.amount;
  const amount = gross.amount - extraTax;
  if (!Number.isFinite(amount)) {
    return unavailable(
      "The hypothetical after-tax leave value exceeds the supported numeric range.",
    );
  }
  return { net: { amount, reason: "" }, extraTax, after };
}

export type { LeaveCashOut };
export { leaveCashOut };

import type { Fields } from "../data/model.d.ts";
import {
  type AnnualLeaveResult,
  combined,
  known,
  multiplied,
  ordinarySalaryWeeks,
  unavailable,
} from "./annual-leave.ts";
import { quotient, value } from "./inputs.ts";
import {
  type ContributionInput,
  contributionScreen,
  ordinaryFundTaxRate,
} from "./leave-contribution-tax.ts";
import { cashOutSuper } from "./leave-super.ts";

function earnedLeave(leave: AnnualLeaveResult, fields: Fields, baseSuper: number | null) {
  let superHourly = unavailable(
    "Use the same normal-base-salary estimate before allocating existing employer super to leave. An independently entered cash rate does not establish its super allocation.",
  );
  if (
    value(fields, "leaveRateBasis") === "salary" &&
    value(fields, "unit") === "annual" &&
    leave.ordinaryRate.amount !== null
  ) {
    superHourly = unavailable(
      "Paid hours per leave week and isolated base employer super are not established.",
    );
    const ordinaryHours = multiplied(leave.ordinaryHours, known(ordinarySalaryWeeks));
    if (baseSuper !== null && baseSuper >= 0) {
      const rate = quotient(baseSuper, ordinaryHours.amount);
      if (rate !== null) {
        superHourly = known(rate);
      }
    }
  }
  const grossHourly = combined(leave.ordinaryRate, superHourly);
  return {
    superHourly,
    grossHourly,
    earnedSuper: multiplied(leave.entitlementHours, superHourly),
    earnedGross: multiplied(leave.entitlementHours, grossHourly),
  };
}

function leaveValuation(
  leave: AnnualLeaveResult,
  baseSuper: number | null,
  input: ContributionInput,
) {
  const superBasis = cashOutSuper(leave, input.quote, input.fields, input.year);
  const screen = contributionScreen(input, superBasis.gross.amount);
  let payoutCash = input.cashOut.net;
  let payoutSuperTax = multiplied(superBasis.gross, known(ordinaryFundTaxRate));
  let payoutNetSuper = multiplied(superBasis.gross, known(1 - ordinaryFundTaxRate));
  if (value(input.fields, "ordinaryFund") !== "yes") {
    payoutSuperTax = unavailable(
      "Confirm an ordinary taxed accumulation fund for the cash-out contributions.",
    );
    payoutNetSuper = payoutSuperTax;
  }
  let { reason } = screen;
  if (superBasis.gross.amount === null || !superBasis.reportingKnown) {
    ({ reason } = superBasis.gross);
  }
  if (reason !== "") {
    if (payoutCash.amount !== null) {
      payoutCash = unavailable(reason);
    }
    payoutSuperTax = unavailable(reason);
    payoutNetSuper = unavailable(reason);
  }
  return {
    ...earnedLeave(leave, input.fields, baseSuper),
    superBasis,
    screen,
    payoutCash,
    payoutSuper: superBasis.gross,
    payoutSuperTax,
    payoutNetSuper,
    payoutTotal: combined(payoutCash, payoutNetSuper),
  };
}

type LeaveValuation = ReturnType<typeof leaveValuation>;

export type { LeaveValuation };
export { earnedLeave, leaveValuation };

import type { ComparisonResult } from "./calculations/comparison.ts";
import { value } from "./calculations/inputs.ts";
import { leaveReason } from "./calculations/leave-metrics.ts";
import { validDate } from "./data/validation.ts";
import { editorSections } from "./fields/editor.ts";
import { type MissingInput, missingInputs } from "./result-presentation.ts";

function leaveTarget(result: ComparisonResult, reason: string): string {
  const { leave, payer } = result;
  if (!leave.eligible) {
    if (value(payer, "employment")) {
      return "leaveEligible";
    }
    return "employment";
  }
  if (reason === leave.entitlementWeeks.reason) {
    return "annualLeave";
  }
  if (reason === leave.ordinaryHours.reason) {
    return "leaveOrdinaryHours";
  }
  if (reason === leave.loadingRate.reason) {
    const basis = value(payer, "leaveLoadingBasis");
    return (
      { percent: "leaveLoadingPercent", hourly: "leaveLoadingHourly" }[basis] ?? "leaveLoadingBasis"
    );
  }
  if (reason === leave.balanceHours.reason) {
    if (validDate(value(payer, "leaveBalanceDate"))) {
      return "leaveBalanceHours";
    }
    return "leaveBalanceDate";
  }
  return "";
}
function leaveInput(result: ComparisonResult, label: string): MissingInput | undefined {
  const reason = leaveReason(result, label);
  if (!reason) {
    return undefined;
  }
  const { payer } = result;
  let target = leaveTarget(result, reason);
  if (!target && reason === result.leave.ordinaryRate.reason) {
    target = "leaveRateBasis";
    if (value(payer, "leaveRateBasis") === "entered") {
      target = "leaveHourlyRate";
    } else if (value(payer, "unit") === "annual" && result.baseCash === null) {
      return missingInputs(result).find((input) => input.section === "Pay details");
    }
  }
  for (const section of editorSections({ ...result.offer, fields: payer })) {
    const definition = section.fields.find((field) => field.key === target);
    if (definition) {
      return { scope: "offer", target, section: section.title, label: definition.label };
    }
  }
  return undefined;
}

export { leaveInput };

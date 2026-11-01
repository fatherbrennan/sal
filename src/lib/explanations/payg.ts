import {
  type CoefficientTable,
  combined2025Claimed,
  combined2025Unclaimed,
  combined2026Claimed,
  combined2026Unclaimed,
  combinedEarlyClaimed,
  ordinary2025Claimed,
  ordinary2025Unclaimed,
  ordinary2026Claimed,
  ordinary2026Unclaimed,
} from "../calculations/tax/payg-tables.ts";
import type { PaygRulePeriod } from "../calculations/tax/types.d.ts";

const tables = {
  "2025-july": {
    ordinary: { yes: ordinary2025Claimed, no: ordinary2025Unclaimed },
    combined: { yes: combinedEarlyClaimed, no: null },
  },
  "2025-september": {
    ordinary: { yes: ordinary2025Claimed, no: ordinary2025Unclaimed },
    combined: { yes: combined2025Claimed, no: combined2025Unclaimed },
  },
  "2026-july": {
    ordinary: { yes: ordinary2026Claimed, no: ordinary2026Unclaimed },
    combined: { yes: combined2026Claimed, no: combined2026Unclaimed },
  },
};

function tableText(
  table: CoefficientTable | null,
  label: string,
  role: "ordinary" | "total",
): string {
  if (table === null) {
    return `${label}: unavailable; early 2025 no-threshold combined-loan coefficients are unverified.`;
  }
  const bands = table.bands.map(
    ({ upper, a, b }) =>
      `payg_weekly_earnings_cents < ${upper} * 100: ${role}_payg_coefficient_multiplier = ${a}; ${role}_payg_coefficient_offset = ${b}`,
  );
  return `${label}; choose the first matching row:\n${bands.join("\n")}\notherwise: ${role}_payg_coefficient_multiplier = ${table.top.a}; ${role}_payg_coefficient_offset = ${table.top.b}`;
}

function paygTables(period: PaygRulePeriod, threshold: string, loan: string): string {
  if (threshold !== "yes" && threshold !== "no") {
    return "Select whether this payer's tax-free threshold is claimed to establish coefficients.";
  }
  const selected = tables[period];
  const ordinary = tableText(
    selected.ordinary[threshold],
    `Ordinary coefficients, ${period}`,
    "ordinary",
  );
  if (loan === "yes") {
    return `${ordinary}\n\n${tableText(selected.combined[threshold], `Combined study-loan coefficients, ${period}`, "total")}`;
  }
  if (loan === "no") {
    return `${ordinary}\nNo study loan is declared: period_total_payg = period_ordinary_payg.`;
  }
  return `${ordinary}\nThe study-loan declaration is unknown; combined withholding is unavailable.`;
}

export { paygTables };

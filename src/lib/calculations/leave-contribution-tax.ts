import type { Fields } from "../data/model.d.ts";
import { numeric } from "../data/numeric.ts";
import { total } from "./inputs.ts";
import type { LeaveCashOut } from "./leave-cash-out.ts";
import type { Quote } from "./remuneration.ts";
import type { TaxYear } from "./tax/types.d.ts";

const division293Threshold = 250_000;
const contributionCaps = { "2025-26": 30_000, "2026-27": 32_500 } as const;
const ordinaryFundTaxRate = 0.15;

interface ContributionInput {
  fields: Fields;
  profile: Fields;
  year: TaxYear;
  quote: Quote;
  cashOut: LeaveCashOut;
}

function contributionScreen(input: ContributionInput, extraSuper: number | null) {
  const { fields, profile, quote, cashOut, year } = input;
  const contributions = total([
    quote.super,
    numeric(fields, "sacrifice"),
    numeric(profile, "reportableSuper"),
    extraSuper,
  ]);
  const division293Income = total([
    cashOut.after?.input.taxableIncome ?? null,
    numeric(profile, "reportableBenefits"),
    numeric(fields, "reportableBenefitsOffer"),
    numeric(profile, "investmentLoss"),
    contributions,
  ]);
  const cap = contributionCaps[year];
  let reason = "";
  if (contributions === null || division293Income === null) {
    reason = "Establish contribution-cap and Division 293 screening inputs for the cash-out year.";
  } else if (contributions > cap) {
    reason =
      "Modelled concessional contributions exceed the annual cap. Carry-forward eligibility and excess-contribution tax are not established.";
  } else if (contributions > 0 && division293Income > division293Threshold) {
    reason =
      "Modelled income plus concessional contributions exceeds the Division 293 threshold. Its additional tax and payment destination are not established.";
  }
  return { contributions, cap, division293Income, reason };
}

export type { ContributionInput };
export { contributionScreen, division293Threshold, ordinaryFundTaxRate };

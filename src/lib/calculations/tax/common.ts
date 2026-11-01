import type { TaxAmount, TaxUnavailableCode } from "./types.d.ts";

const amountLimit = 1_000_000_000;
const centsPerDollar = 100;
const centRepresentationTolerance = 0.000_001;
function unavailable(
  code: TaxUnavailableCode,
  reason: string,
  sources: readonly string[],
): TaxAmount {
  return { status: "unavailable", code, reason, sources };
}

function annual(amount: number, sources: readonly string[]): TaxAmount {
  return { status: "available", amount, basis: "raw annual component", sources };
}

function rawInputAmount(value: number | null, name: string): TaxAmount {
  if (value === null) {
    return unavailable("missing-input", `${name} is required.`, []);
  }
  if (!Number.isFinite(value) || value < 0 || value > amountLimit) {
    return unavailable(
      "invalid-input",
      `${name} must be finite, non-negative and at most AUD 1 billion.`,
      [],
    );
  }
  return annual(value, []);
}

function inputAmount(value: number | null, name: string, wholeDollars = true): TaxAmount {
  const checked = rawInputAmount(value, name);
  if (checked.status === "unavailable") {
    return checked;
  }
  const { amount } = checked;
  if (
    (wholeDollars && !Number.isInteger(amount)) ||
    (!wholeDollars &&
      Math.abs(amount * centsPerDollar - Math.round(amount * centsPerDollar)) >
        centRepresentationTolerance)
  ) {
    let precision = "whole cents";
    if (wholeDollars) {
      precision = "established whole dollars";
    }
    return unavailable(
      "invalid-input",
      `${name} must be non-negative, at most AUD 1 billion, and in ${precision}.`,
      [],
    );
  }
  return checked;
}

function eligibility(value: boolean | null, name: string, sources: readonly string[]): TaxAmount {
  if (value === null) {
    return unavailable("missing-input", `${name} must be established.`, sources);
  }
  if (!value) {
    return unavailable("unsupported-regime", `${name} is outside this component.`, sources);
  }
  return annual(0, sources);
}

export { annual, eligibility, inputAmount, rawInputAmount, unavailable };

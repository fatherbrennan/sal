import { unavailable } from "./common.ts";
import { numeric } from "./profile-inputs.ts";
import type { ProfileTaxResult, TaxFields } from "./types.d.ts";

function reportableSuperError(fields: TaxFields): string | null {
  const { reportableSuperSameYear, employment } = fields;
  if (reportableSuperSameYear !== "yes" || employment === "sole-trader") {
    return null;
  }
  const sacrifice = numeric(fields, "sacrifice");
  const reported = numeric(fields, "reportableSuperOffer");
  if (sacrifice !== null && reported !== null && reported < sacrifice) {
    return "Reportable super is below salary sacrifice confirmed reportable in the same income year. Correct the amounts or reporting-year confirmation.";
  }
  return null;
}

function guardReportedSuper(result: ProfileTaxResult, error: string | null): ProfileTaxResult {
  if (error === null) {
    return result;
  }
  const invalid = unavailable("invalid-input", error, ["T53"]);
  return {
    ...result,
    incrementalTax: invalid,
    withOffer: {
      ...result.withOffer,
      annual: {
        ...result.withOffer.annual,
        help: invalid,
        mls: invalid,
        rawComponentSubtotal: invalid,
      },
    },
  };
}

export { guardReportedSuper, reportableSuperError };

import { expect, it } from "bun:test";
import { calculateComparison } from "../../../src/lib/calculations/comparison.ts";
import type { Fields } from "../../../src/lib/data/model.d.ts";
import { readRecord } from "../../../src/lib/data/schema.ts";
import { offer, profile } from "../package-fixture.ts";

function compare(fields: Fields) {
  return calculateComparison({
    offer: offer(fields),
    profile,
    vehicle: {},
    year: "2026-27",
    target: false,
    oneOff: false,
    timeValue: false,
  });
}
const inconsistent = {
  sacrifice: "5000",
  reportableSuperOffer: "4999",
  reportableSuperSameYear: "yes",
};

it("rejects a confirmed reporting-year contradiction at the save/import boundary", () => {
  expect(() => readRecord(offer(inconsistent))).toThrow("Reportable super is below");
});
it("leaves dependent calculations unavailable for a confirmed reporting-year contradiction", () => {
  const result = compare(inconsistent);
  expect(result.tax.incrementalTax).toMatchObject({ status: "unavailable", code: "invalid-input" });
  expect(result.tax.withOffer.annual.rawComponentSubtotal.status).toBe("unavailable");
  expect(result.tax.withOffer.annual.help.status).toBe("unavailable");
  expect(result.tax.withOffer.annual.mls.status).toBe("unavailable");
  expect(result.tax.withOffer.annual.basicIncomeTax.status).toBe("available");
  expect(result.notes.join(" ")).toContain("Reportable super is below");
});
it("does not assume that an unspecified reporting year matches salary sacrifice", () => {
  for (const reportableSuperSameYear of ["", "no"]) {
    const fields = { ...inconsistent, reportableSuperSameYear, reportableSuperOffer: "0" };
    expect(readRecord(offer(fields)).fields).toMatchObject({ reportableSuperOffer: "0" });
    expect(compare(fields).tax.incrementalTax.status).toBe("available");
  }
});
it("accepts equal or additional established reportable super without adding personal transfers", () => {
  for (const reportableSuperOffer of ["5000", "7000"]) {
    const fields = { ...inconsistent, reportableSuperOffer, personalSuper: "1000" };
    expect(readRecord(offer(fields)).fields).toMatchObject({ reportableSuperOffer });
    expect(compare(fields).tax.incrementalTax.status).toBe("available");
  }
});
it("preserves incomplete inputs and ignores a stale employee sacrifice on a sole-trader offer", () => {
  for (const fields of [
    { ...inconsistent, sacrifice: "" },
    { ...inconsistent, reportableSuperOffer: "" },
    { ...inconsistent, employment: "sole-trader" },
  ]) {
    expect(readRecord(offer(fields))).toBeDefined();
  }
});
it("shows fund contribution tax separately from personal assessment tax per paid hour", () => {
  const result = compare({});
  const expectedFundTaxHourly = 0.865_384_615;
  expect(
    result.metrics.find((item) => item.label === "Fund contribution tax per paid hour")?.amount,
  ).toBeCloseTo(expectedFundTaxHourly);
});

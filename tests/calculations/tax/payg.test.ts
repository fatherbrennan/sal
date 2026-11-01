import { expect, it } from "bun:test";
import { calculatePayg } from "../../../src/lib/calculations/tax/payg.ts";
import type { PaygRulePeriod, PayPeriod } from "../../../src/lib/calculations/tax/types.d.ts";
import { amount, checkedDecimalPlaces, paygInput } from "./fixtures.ts";

const expectedAmounts = {
  earlyLoanIncrement: 12,
  monthlyCentAdjustment: 117,
  currentNoPrematureRounding: 127,
  oldNoPrematureRounding: 137,
  currentNoThreshold: 249,
  oldNoThreshold: 255,
  currentTopBand: 2195,
  oldTopBand: 2200,
};

// O03: values captured from the instruments' Schedule 1 sample tables before implementation.
it.each([
  { earnings: 360, old: 0, current: 0 },
  { earnings: 361, old: 0, current: 0 },
  { earnings: 362, old: 0, current: 0 },
  { earnings: 499, old: 22, current: 21 },
  { earnings: 500, old: 22, current: 21 },
  { earnings: 537, old: 32, current: 26 },
  { earnings: 538, old: 32, current: 27 },
  { earnings: 624, old: 55, current: 48 },
  { earnings: 625, old: 55, current: 48 },
  { earnings: 672, old: 63, current: 60 },
  { earnings: 673, old: 63, current: 60 },
  { earnings: 720, old: 72, current: 68 },
  { earnings: 721, old: 72, current: 68 },
  { earnings: 864, old: 99, current: 94 },
  { earnings: 865, old: 99, current: 94 },
  { earnings: 1281, old: 234, current: 229 },
  { earnings: 1282, old: 234, current: 229 },
  { earnings: 2595, old: 654, current: 649 },
  { earnings: 2596, old: 655, current: 649 },
  { earnings: 3652, old: 1066, current: 1061 },
  { earnings: 3653, old: 1067, current: 1062 },
])("matches ordinary weekly sample boundaries: $earnings", ({ earnings, old, current }) => {
  expect(
    amount(calculatePayg(paygInput({ earnings, rulePeriod: "2025-july" })).combined),
  ).toBeCloseTo(old, checkedDecimalPlaces);
  expect(
    amount(calculatePayg(paygInput({ earnings, rulePeriod: "2025-september" })).combined),
  ).toBeCloseTo(old, checkedDecimalPlaces);
  expect(amount(calculatePayg(paygInput({ earnings })).combined)).toBeCloseTo(
    current,
    checkedDecimalPlaces,
  );
});

it.each([
  { period: "fortnightly", earnings: 1440, old: 144, current: 136 },
  { period: "monthly", earnings: 2227.33, old: 113, current: 100 },
  { period: "monthly", earnings: 3120, old: 312, current: 295 },
  { period: "quarterly", earnings: 13_000, old: 1859, current: 1794 },
] satisfies { period: PayPeriod; earnings: number; old: number; current: number }[])(
  "uses the prescribed period conversion: $period/$earnings",
  ({ period, earnings, old, current }) => {
    expect(
      amount(calculatePayg(paygInput({ period, earnings, rulePeriod: "2025-july" })).ordinary),
    ).toBeCloseTo(old, checkedDecimalPlaces);
    expect(amount(calculatePayg(paygInput({ period, earnings })).ordinary)).toBeCloseTo(
      current,
      checkedDecimalPlaces,
    );
  },
);

it("does not round to cents before whole-dollar PAYG or omit the monthly 33-cent adjustment", () => {
  expect(
    amount(calculatePayg(paygInput({ rulePeriod: "2025-july", earnings: 983 })).ordinary),
  ).toBeCloseTo(expectedAmounts.oldNoPrematureRounding, checkedDecimalPlaces);
  expect(amount(calculatePayg(paygInput({ earnings: 968 })).ordinary)).toBeCloseTo(
    expectedAmounts.currentNoPrematureRounding,
    checkedDecimalPlaces,
  );
  expect(
    amount(calculatePayg(paygInput({ period: "monthly", earnings: 2331.33 })).ordinary),
  ).toBeCloseTo(expectedAmounts.monthlyCentAdjustment, checkedDecimalPlaces);
});

// H04 combined-formula specimens; loanIncrement is a reconciliation difference, not a debt credit.
it.each([
  {
    rulePeriod: "2025-july",
    period: "fortnightly",
    earnings: 2455.78,
    ordinary: 432,
    combined: 458,
    increment: 26,
  },
  {
    rulePeriod: "2025-september",
    period: "fortnightly",
    earnings: 4409.75,
    ordinary: 1058,
    combined: 1332,
    increment: 274,
  },
  {
    rulePeriod: "2026-july",
    period: "fortnightly",
    earnings: 4409.75,
    ordinary: 1048,
    combined: 1308,
    increment: 260,
  },
  {
    rulePeriod: "2025-september",
    period: "weekly",
    earnings: 2608.36,
    ordinary: 659,
    combined: 861,
    increment: 202,
  },
  {
    rulePeriod: "2026-july",
    period: "weekly",
    earnings: 2608.36,
    ordinary: 654,
    combined: 847,
    increment: 193,
  },
] satisfies {
  rulePeriod: PaygRulePeriod;
  period: PayPeriod;
  earnings: number;
  ordinary: number;
  combined: number;
  increment: number;
}[])(
  "uses the published combined coefficients without double adding loans: $rulePeriod/$earnings",
  (fixture) => {
    const result = calculatePayg(paygInput({ ...fixture, studyLoanDeclared: true }));
    expect(amount(result.ordinary)).toBeCloseTo(fixture.ordinary, checkedDecimalPlaces);
    expect(amount(result.combined)).toBeCloseTo(fixture.combined, checkedDecimalPlaces);
    expect(amount(result.loanIncrement)).toBeCloseTo(fixture.increment, checkedDecimalPlaces);
    expect(result.combined).toMatchObject({ basis: "representative withholding" });
    expect(result.method).toBe("published combined coefficient formula");
  },
);

it("uses per-payer threshold declarations without modifying annual tax", () => {
  expect(amount(calculatePayg(paygInput({ thresholdClaimed: false })).ordinary)).toBeCloseTo(
    expectedAmounts.currentNoThreshold,
    checkedDecimalPlaces,
  );
  expect(
    amount(calculatePayg(paygInput({ thresholdClaimed: false, rulePeriod: "2025-july" })).ordinary),
  ).toBeCloseTo(expectedAmounts.oldNoThreshold, checkedDecimalPlaces);
  expect(
    amount(calculatePayg(paygInput({ thresholdClaimed: false, earnings: 0 })).ordinary),
  ).toBeCloseTo(0, checkedDecimalPlaces);
});

it.each([
  { rulePeriod: "2025-september", ordinary: 3181, combined: 4199, increment: 1018 },
  { rulePeriod: "2026-july", ordinary: 3155, combined: 4134, increment: 979 },
] satisfies {
  rulePeriod: PaygRulePeriod;
  ordinary: number;
  combined: number;
  increment: number;
}[])("matches the no-threshold monthly loan example: $rulePeriod", (fixture) => {
  const result = calculatePayg(
    paygInput({
      rulePeriod: fixture.rulePeriod,
      period: "monthly",
      earnings: 10_627.88,
      thresholdClaimed: false,
      studyLoanDeclared: true,
    }),
  );
  expect(amount(result.ordinary)).toBeCloseTo(fixture.ordinary, checkedDecimalPlaces);
  expect(amount(result.combined)).toBeCloseTo(fixture.combined, checkedDecimalPlaces);
  expect(amount(result.loanIncrement)).toBeCloseTo(fixture.increment, checkedDecimalPlaces);
});

it("preserves the September 2025 rule-period change", () => {
  const early = calculatePayg(
    paygInput({ rulePeriod: "2025-july", earnings: 1200, studyLoanDeclared: true }),
  );
  const late = calculatePayg(
    paygInput({ rulePeriod: "2025-september", earnings: 1200, studyLoanDeclared: true }),
  );
  expect(amount(early.loanIncrement)).toBeCloseTo(
    expectedAmounts.earlyLoanIncrement,
    checkedDecimalPlaces,
  );
  expect(amount(late.loanIncrement)).toBeCloseTo(0, checkedDecimalPlaces);
});

it("retains ordinary withholding when the loan state or historical combined branch is unavailable", () => {
  const unknown = calculatePayg(paygInput({ studyLoanDeclared: null }));
  expect(unknown.ordinary.status).toBe("available");
  expect(unknown.combined).toMatchObject({ status: "unavailable", code: "missing-input" });
  const historical = calculatePayg(
    paygInput({ rulePeriod: "2025-july", thresholdClaimed: false, studyLoanDeclared: true }),
  );
  expect(historical.ordinary.status).toBe("available");
  expect(historical.combined).toMatchObject({ status: "unavailable", code: "unverified-rule" });
});

it.each([
  { input: paygInput({ ordinaryEmployee: false }) },
  { input: paygInput({ tfnProvided: null }) },
  { input: paygInput({ tfnProvided: false }) },
  { input: paygInput({ noAdjustments: false }) },
  { input: paygInput({ thresholdClaimed: null }) },
  { input: paygInput({ earnings: null }) },
  { input: paygInput({ earnings: -1 }) },
  { input: paygInput({ earnings: 1000.001 }) },
])("rejects missing, invalid and unsupported payroll treatment", ({ input }) => {
  const result = calculatePayg(input);
  expect(result.ordinary.status).toBe("unavailable");
  expect(result.combined).toEqual(result.ordinary);
});

it("uses the top combined band for every supported rule period", () => {
  expect(
    amount(calculatePayg(paygInput({ earnings: 5000, studyLoanDeclared: true })).combined),
  ).toBeCloseTo(expectedAmounts.currentTopBand, checkedDecimalPlaces);
  expect(
    amount(
      calculatePayg(paygInput({ earnings: 5000, rulePeriod: "2025-july", studyLoanDeclared: true }))
        .combined,
    ),
  ).toBeCloseTo(expectedAmounts.oldTopBand, checkedDecimalPlaces);
});

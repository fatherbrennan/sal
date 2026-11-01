import { expect, it } from "bun:test";
import { installConcurrency, installDependencies } from "../../scripts/install.ts";

it.each([
  { threads: 1, expected: 1 },
  { threads: 2, expected: 1 },
  { threads: 3, expected: 2 },
  { threads: 4, expected: 3 },
  { threads: 5, expected: 4 },
  { threads: 8, expected: 6 },
  { threads: 16, expected: 12 },
  { threads: 24, expected: 19 },
])(
  "uses 80 percent of available threads, rounded down with minimum one: %j",
  ({ threads, expected }) => {
    expect(installConcurrency(threads)).toBe(expected);
  },
);

const fractionalThreadCount = 1.5;
it.each([0, -1, fractionalThreadCount, Number.NaN, Number.POSITIVE_INFINITY])(
  "rejects an invalid thread count: %s",
  (threads) => {
    expect(() => installConcurrency(threads)).toThrow(RangeError);
  },
);

it("rejects ambiguous install tasks before running Bun install", async () => {
  await expect(installDependencies([])).rejects.toThrow("Use dependencies:install");
  await expect(installDependencies(["latest"])).rejects.toThrow("Use dependencies:install");
  await expect(installDependencies(["frozen-lockfile", "unexpected"])).rejects.toThrow(
    "without additional arguments",
  );
});

it("can reinstall the exact existing lockfile with the computed concurrency", async () => {
  expect(await installDependencies(["frozen-lockfile"])).toBe(0);
});

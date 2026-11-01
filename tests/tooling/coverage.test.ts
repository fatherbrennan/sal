import { expect, it } from "bun:test";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { checkCoverage, enforceCoverage, parseCoverage } from "../../scripts/coverage.ts";

const passing = "SF:scripts/example.ts\nFNF:10\nFNH:9\nLF:100\nLH:90\nend_of_record\n";

it("discovers authored files from disk and fails when a new file is untested", async () => {
  const directory = await mkdtemp(join(tmpdir(), "sal-coverage-scope-"));
  if (dirname(resolve(directory)) !== resolve(tmpdir())) {
    throw new Error("Refusing a fixture outside the temporary directory.");
  }
  try {
    await Promise.all([
      Bun.write(join(directory, "coverage/lcov.info"), passing),
      Bun.write(join(directory, "scripts/example.ts"), 'export const example = "example";'),
      Bun.write(join(directory, "tests/fixture.test.ts"), 'export const fixture = "fixture";'),
      Bun.write(join(directory, "scripts/types.d.ts"), "export interface Example {}"),
    ]);
    await expect(checkCoverage(directory)).resolves.toBeUndefined();
    await Bun.write(join(directory, "src/unvisited.svelte"), "Unvisited component");
    await expect(checkCoverage(directory)).rejects.toThrow("src/unvisited.svelte");
    await rm(join(directory, "src/unvisited.svelte"));
    await Bun.write(join(directory, "scripts/new.ts"), 'export const newlyAdded = "new";');
    await expect(checkCoverage(directory)).rejects.toThrow("scripts/new.ts");
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});

it("accepts the approved 90 percent boundary", () => {
  expect(() => enforceCoverage(passing, ["scripts/example.ts"])).not.toThrow();
});

it("rejects missing unimported files rather than omitting them from the percentage", () => {
  expect(() => enforceCoverage(passing, ["scripts/example.ts", "scripts/untested.ts"])).toThrow(
    "Untested authored file",
  );
});

it("rejects line and function coverage below their independent thresholds", () => {
  expect(() => enforceCoverage(passing.replace("LH:90", "LH:89"), ["scripts/example.ts"])).toThrow(
    "line coverage",
  );
  expect(() => enforceCoverage(passing.replace("FNH:9", "FNH:8"), ["scripts/example.ts"])).toThrow(
    "function coverage",
  );
});

it.each(["calculations", "data", "formulas"])(
  "requires 100 percent coverage for %s modules",
  (directory) => {
    const path = `src/lib/${directory}/example.ts`;
    const incomplete = passing.replace("scripts/example.ts", path);
    expect(() => enforceCoverage(incomplete, [path])).toThrow("must be 100%");
    expect(() =>
      enforceCoverage(incomplete.replace("FNH:9", "FNH:10").replace("LH:90", "LH:100"), [path]),
    ).not.toThrow();
  },
);

it("rejects missing, malformed, duplicated, and impossible coverage reports", () => {
  expect(() => parseCoverage("")).toThrow("no source files");
  expect(() => parseCoverage("LF:1\nend_of_record")).toThrow("lacks a source");
  expect(() => parseCoverage(passing.replace("FNF:10", "FNF:invalid"))).toThrow("Invalid");
  expect(() => parseCoverage(passing.replace("LH:90", "LH:101"))).toThrow("Impossible");
  expect(() => parseCoverage(passing + passing)).toThrow("Duplicate");
  expect(() => enforceCoverage(passing, [])).toThrow("No authored");
  expect(() =>
    enforceCoverage(passing.replace("LF:100", "LF:0").replace("LH:90", "LH:0"), [
      "scripts/example.ts",
    ]),
  ).toThrow("No measurable");
});

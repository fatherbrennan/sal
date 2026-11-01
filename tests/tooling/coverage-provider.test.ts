import { expect, it } from "bun:test";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { checkCoverage, enforceCoverage } from "../../scripts/coverage.ts";

const native = "SF:scripts/example.ts\nFNF:10\nFNH:9\nLF:100\nLH:90\nend_of_record\n";
const component = await Bun.file("tests/fixtures/browser-coverage.lcov").text();

// The approved provider policy retains native Bun measurements for shared TypeScript;
// a perfect browser result must not hide a native shortfall or count the file twice.
it("keeps native measurements and enforces browser-only data coverage", () => {
  const perfect = native.replace("FNH:9", "FNH:10").replace("LH:90", "LH:100");
  expect(() => enforceCoverage(native, ["scripts/example.ts"], perfect)).not.toThrow();
  expect(() =>
    enforceCoverage(native.replace("LH:90", "LH:89"), ["scripts/example.ts"], perfect),
  ).toThrow("below 90%");
  const storage = perfect.replace("scripts/example.ts", "src/lib/data/store.ts");
  const paths = ["scripts/example.ts", "src/lib/data/store.ts"];
  expect(() => enforceCoverage(native, paths, storage)).not.toThrow();
  expect(() => enforceCoverage(native, paths, storage.replace("LH:100", "LH:99"))).toThrow(
    "must be 100%",
  );
});

it("requires current source hashes and rejects invalid browser source paths", async () => {
  const directory = await mkdtemp(join(tmpdir(), "sal-browser-report-"));
  if (dirname(resolve(directory)) !== resolve(tmpdir())) {
    throw new Error("Refusing a fixture outside the temporary directory.");
  }
  try {
    await Promise.all([
      Bun.write(join(directory, "scripts/example.ts"), "export const value = 1;"),
      Bun.write(join(directory, "src/Page.svelte"), "abc"),
      Bun.write(join(directory, "coverage/lcov.info"), native),
      Bun.write(join(directory, "coverage/browser.lcov"), component),
    ]);
    await expect(checkCoverage(directory)).resolves.toBeUndefined();
    await Bun.write(join(directory, "src/Page.svelte"), "changed");
    await expect(checkCoverage(directory)).rejects.toThrow("Stale or unverified");
    await Bun.write(
      join(directory, "coverage/browser.lcov"),
      component.replace("src/Page.svelte", "../outside.svelte"),
    );
    await expect(checkCoverage(directory)).rejects.toThrow("Unexpected browser coverage source");
    await Bun.write(join(directory, "coverage/browser.lcov"), "");
    await expect(checkCoverage(directory)).rejects.toThrow("no source files");
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});

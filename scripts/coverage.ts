import assert from "node:assert/strict";
import { join, relative, resolve } from "node:path";
import process from "node:process";

interface FileCoverage {
  path: string;
  sourceHash: string | undefined;
  functionsFound: number;
  functionsHit: number;
  linesFound: number;
  linesHit: number;
}

const overallThreshold = 0.9;
const financialModule = /^src\/lib\/(?:calculations|data|formulas)\//u;
const ignoredPaths = new Set([
  ".git",
  ".cache",
  ".svelte-kit",
  "node_modules",
  "build",
  "coverage",
  "test-results",
  "playwright-report",
  "tests",
]);

function coveragePath(path: string): string {
  return relative(process.cwd(), resolve(path)).replaceAll("\\", "/");
}

function parseCoverage(source: string): FileCoverage[] {
  const results: FileCoverage[] = [];
  for (const block of source.split("end_of_record")) {
    const fields = Object.fromEntries(
      block
        .trim()
        .split("\n")
        .map((line) => {
          const separator = line.indexOf(":");
          return [line.slice(0, separator), line.slice(separator + 1).trim()];
        }),
    );
    const { SF, FNF, FNH, LF, LH, SH } = fields;
    if (SF === undefined) {
      assert(block.trim().length === 0, "LCOV record lacks a source file");
    } else {
      const entry = {
        path: coveragePath(SF),
        sourceHash: SH,
        functionsFound: Number(FNF),
        functionsHit: Number(FNH),
        linesFound: Number(LF),
        linesHit: Number(LH),
      };
      for (const count of [
        entry.functionsFound,
        entry.functionsHit,
        entry.linesFound,
        entry.linesHit,
      ]) {
        assert(Number.isSafeInteger(count) && count >= 0, `Invalid LCOV count for ${SF}`);
      }
      assert(
        entry.functionsHit <= entry.functionsFound && entry.linesHit <= entry.linesFound,
        `Impossible LCOV count for ${SF}`,
      );
      assert(
        !results.some((existing) => existing.path === entry.path),
        `Duplicate LCOV file: ${SF}`,
      );
      results.push(entry);
    }
  }
  assert(results.length > 0, "Coverage report contains no source files");
  return results;
}

function enforceCoverage(source: string, authoredPaths: string[], browserSource?: string): void {
  assert(authoredPaths.length > 0, "No authored TypeScript files discovered");
  const measured = new Map(parseCoverage(source).map((entry) => [entry.path, entry]));
  if (browserSource !== undefined) {
    for (const entry of parseCoverage(browserSource)) {
      if (!measured.has(entry.path)) {
        measured.set(entry.path, entry);
      }
    }
  }
  const totals = { functionsFound: 0, functionsHit: 0, linesFound: 0, linesHit: 0 };
  for (const path of authoredPaths) {
    const entry = measured.get(path);
    assert(entry !== undefined, `Untested authored file missing from coverage: ${path}`);
    if (financialModule.test(path)) {
      assert(
        entry.linesHit === entry.linesFound && entry.functionsHit === entry.functionsFound,
        `Calculation/data coverage must be 100%: ${path}`,
      );
    }
    totals.functionsFound += entry.functionsFound;
    totals.functionsHit += entry.functionsHit;
    totals.linesFound += entry.linesFound;
    totals.linesHit += entry.linesHit;
  }
  assert(totals.linesFound > 0, "No measurable authored lines found");
  assert(
    totals.linesHit >= totals.linesFound * overallThreshold,
    "Overall authored line coverage is below 90%",
  );
  assert(
    totals.functionsHit >= totals.functionsFound * overallThreshold,
    "Overall authored function coverage is below 90%",
  );
}

async function checkCoverage(directory = process.cwd()): Promise<void> {
  const paths = [...new Bun.Glob("**/*.{ts,svelte}").scanSync({ cwd: directory, dot: true })]
    .map((path) => path.replaceAll("\\", "/"))
    .filter(
      (path) =>
        !(path.endsWith(".d.ts") || path.split("/").some((segment) => ignoredPaths.has(segment))),
    );
  const browserFile = Bun.file(join(directory, "coverage/browser.lcov"));
  let browserSource: string | undefined;
  if (await browserFile.exists()) {
    browserSource = await browserFile.text();
    await Promise.all(
      parseCoverage(browserSource).map(async (entry) => {
        assert(paths.includes(entry.path), `Unexpected browser coverage source: ${entry.path}`);
        const authored = await Bun.file(join(directory, entry.path)).text();
        const hash = new Bun.CryptoHasher("sha256").update(authored).digest("hex");
        assert.equal(entry.sourceHash, hash, `Stale or unverified browser coverage: ${entry.path}`);
      }),
    );
  }
  const nativeSource = await Bun.file(join(directory, "coverage/lcov.info")).text();
  assert(
    parseCoverage(nativeSource).every((entry) => !entry.path.endsWith(".svelte")),
    "Svelte requires verified browser coverage",
  );
  enforceCoverage(nativeSource, paths, browserSource);
  process.stdout.write(
    `Coverage scope verified: ${paths.length} authored TypeScript/Svelte files.\n`,
  );
}

if (import.meta.main) {
  await checkCoverage();
}

export { checkCoverage, enforceCoverage, parseCoverage };

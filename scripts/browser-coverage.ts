import assert from "node:assert/strict";
import { relative, resolve } from "node:path";
import process from "node:process";
import { eachMapping, TraceMap } from "@jridgewell/trace-mapping";
import type { Page } from "playwright";
import v8ToIstanbul from "v8-to-istanbul";

type BrowserEntry = Awaited<ReturnType<Page["coverage"]["stopJSCoverage"]>>[number];

interface BrowserFileCoverage {
  path: string;
  sourceHash: string;
  lines: Record<string, number>;
  functions: Record<string, number>;
}

const inlineSourceMap =
  /\/\/# sourceMappingURL=data:application\/json(?:;charset=[^;,]+)?;base64,(?<encoded>[A-Za-z0-9+/=]+)/gu;

function mappedLines(generated: string, authored: string): Set<number> {
  const { encoded } = [...generated.matchAll(inlineSourceMap)].at(-1)?.groups ?? {};
  assert(encoded !== undefined, "Browser coverage requires an inline source map");
  const map = new TraceMap(Buffer.from(encoded, "base64").toString("utf8"));
  assert.equal(map.sources.length, 1, "Expected one original source per Vite module");
  assert.equal(map.sourcesContent?.[0], authored, "Browser coverage source is missing or stale");
  const lines = new Set<number>();
  eachMapping(map, (mapping) => {
    if (mapping.originalLine !== null) {
      lines.add(mapping.originalLine);
    }
  });
  assert(lines.size > 0, "No executable source mappings found");
  return lines;
}

async function convertBrowserCoverage(
  entry: BrowserEntry,
  sourcePath: string,
  authored: string,
): Promise<BrowserFileCoverage> {
  assert(entry.source !== undefined, "Browser coverage lacks generated source");
  const lines = mappedLines(entry.source, authored);
  const path = resolve(sourcePath);
  const converter = v8ToIstanbul(path, 0, { source: entry.source }, () => false);
  await converter.load();
  const functions = entry.functions
    .filter((item) => item.functionName !== "" || item.ranges[0]?.startOffset !== 0)
    .map((item) => {
      if (item.functionName === "") {
        return { ...item, functionName: "anonymous" };
      }
      return item;
    });
  converter.applyCoverage(functions);
  const coverage = converter.toIstanbul()[path];
  assert(coverage !== undefined, `Missing original coverage source: ${path}`);
  const result: BrowserFileCoverage = {
    path: relative(process.cwd(), path).replaceAll("\\", "/"),
    sourceHash: new Bun.CryptoHasher("sha256").update(authored).digest("hex"),
    lines: {},
    functions: {},
  };
  for (const [id, statement] of Object.entries(coverage.statementMap)) {
    if (lines.has(statement.start.line)) {
      const count: number | undefined = coverage.s[id];
      assert(count !== undefined, "Missing mapped line count");
      result.lines[statement.start.line] = count;
    }
  }
  assert.equal(Object.keys(result.lines).length, lines.size, "Missing mapped source lines");
  for (const [id, fn] of Object.entries(coverage.fnMap)) {
    const count: number | undefined = coverage.f[id];
    assert(count !== undefined, "Missing mapped function count");
    const { start, end } = fn.loc;
    result.functions[`${fn.name}:${start.line}:${start.column}:${end.line}:${end.column}`] = count;
  }
  return result;
}

function browserLcov(records: BrowserFileCoverage[]): string {
  return records
    .map((record) => {
      const lines = Object.values(record.lines);
      const functions = Object.values(record.functions);
      return `SF:${record.path}\nSH:${record.sourceHash}\nFNF:${functions.length}\nFNH:${functions.filter((count) => count > 0).length}\nLF:${lines.length}\nLH:${lines.filter((count) => count > 0).length}\nend_of_record\n`;
    })
    .join("");
}

export type { BrowserEntry, BrowserFileCoverage };
export { browserLcov, convertBrowserCoverage, mappedLines };

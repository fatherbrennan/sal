import { expect, it } from "bun:test";
import {
  type BrowserEntry,
  browserLcov,
  convertBrowserCoverage,
  mappedLines,
} from "../../scripts/browser-coverage.ts";

const authored = "const run = () => {\n  return 1;\n};\n\nfunction unused() {\n  return 2;\n}\n";
const sourcePath = "tests/fixtures/probe.ts";
const sourceMap = {
  version: 3,
  sources: ["probe.ts"],
  sourcesContent: [authored],
  names: [],
  mappings: "AAAA;AACA;AACA;;AAEA;AACA;AACA",
};

function generated(map = sourceMap): string {
  return `${authored}\n//# sourceMappingURL=data:application/json;base64,${Buffer.from(JSON.stringify(map)).toString("base64")}`;
}

function entry(): BrowserEntry {
  const source = generated();
  return {
    url: "http://127.0.0.1/probe.ts",
    scriptId: "probe",
    source,
    functions: [
      {
        functionName: "",
        isBlockCoverage: true,
        ranges: [{ startOffset: 0, endOffset: source.length, count: 1 }],
      },
      {
        functionName: "",
        isBlockCoverage: true,
        ranges: [
          { startOffset: authored.indexOf("()"), endOffset: authored.indexOf("};") + 1, count: 1 },
        ],
      },
      {
        functionName: "unused",
        isBlockCoverage: false,
        ranges: [
          {
            startOffset: authored.indexOf("function unused"),
            endOffset: authored.lastIndexOf("}") + 1,
            count: 0,
          },
        ],
      },
    ],
  };
}

// Handwritten identity mappings omit blank line four; two real function ranges
// have independent counts, while the module wrapper is not an authored function.
it("counts mapped lines and anonymous functions without padding or module wrappers", async () => {
  const result = await convertBrowserCoverage(entry(), sourcePath, authored);
  expect(Object.keys(result.lines)).toEqual(["1", "2", "3", "5", "6", "7"]);
  expect(Object.values(result.functions).sort()).toEqual([0, 1]);
  expect(Object.keys(result.functions).some((name) => name.startsWith("anonymous:1:"))).toBe(true);
  expect(browserLcov([result])).toContain("\nFNF:2\nFNH:1\nLF:6\nLH:3\nend_of_record\n");
  expect(result.path).toBe(sourcePath);
});

it("rejects absent, stale, empty and multi-source maps", async () => {
  expect(() => mappedLines(authored, authored)).toThrow("inline source map");
  expect(() => mappedLines(generated(), "changed")).toThrow("stale");
  expect(() => mappedLines(generated({ ...sourceMap, mappings: "" }), authored)).toThrow(
    "No executable",
  );
  expect(() => mappedLines(generated({ ...sourceMap, sources: ["a", "b"] }), authored)).toThrow(
    "one original",
  );
  const { source: _source, ...withoutSource } = entry();
  await expect(convertBrowserCoverage(withoutSource, sourcePath, authored)).rejects.toThrow(
    "lacks generated",
  );
  await expect(
    convertBrowserCoverage(entry(), "tests/fixtures/other.ts", authored),
  ).rejects.toThrow("Missing original");
});

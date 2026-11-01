import assert from "node:assert/strict";
import process from "node:process";
import type { Page } from "playwright";
import {
  type BrowserFileCoverage,
  convertBrowserCoverage,
} from "../../scripts/browser-coverage.ts";

const handlers = {
  "src/lib/keybindings.ts": ["localKey", "dialogOwnsKeys", "trapModalTab"],
  "src/lib/components/calculator.svelte": [
    "keydown",
    "sequenceKey",
    "intercept",
    "manual",
    "placementKey",
    "focused",
    "keyup",
    "resetKeys",
  ],
  "src/lib/components/settings-shortcuts.svelte": ["key", "dispatch"],
  "src/lib/components/combobox.svelte": ["key", "move", "choose"],
  "src/lib/components/comparison-table.svelte": ["keyScroll"],
  "src/lib/inspector/workspace.svelte": ["key"],
  "src/lib/inspector/hint.svelte": ["key"],
  "src/lib/components/shortcut-recorder.svelte": ["recordKey", "save"],
  "src/lib/components/page-width.svelte": ["close"],
  "src/lib/components/calculator-snap-grid.svelte": ["keydown"],
};
const minimumLineShare = 0.9;

function requireHandlers(records: Map<string, BrowserFileCoverage>) {
  return Object.entries(handlers).flatMap(([path, names]) => {
    const record = records.get(path);
    assert(record, `Missing measured source: ${path}`);
    return names.map((name) => {
      const functions = Object.entries(record.functions).filter(([key]) =>
        key.startsWith(`${name}:`),
      );
      assert(functions.length > 0, `Missing authored handler: ${path} ${name}`);
      assert(
        functions.every(([, count]) => count > 0),
        `Uncovered handler: ${path} ${name}`,
      );
      const lines = Object.entries(record.lines).filter(([line]) =>
        functions.some(([key]) => {
          const [, first, , last] = key.split(":");
          return Number(line) >= Number(first) && Number(line) <= Number(last);
        }),
      );
      assert(lines.length > 0, `Missing authored handler lines: ${path} ${name}`);
      const covered = lines.filter(([, count]) => count > 0).length;
      const missed = lines.filter(([, count]) => count === 0).map(([line]) => Number(line));
      assert(
        covered / lines.length >= minimumLineShare,
        `Handler line coverage below 90%: ${path} ${name}; missed ${missed.join(", ")}`,
      );
      return {
        path,
        name,
        lines: lines.length,
        covered,
        missed,
      };
    });
  });
}

function verifyGate(records: Map<string, BrowserFileCoverage>): void {
  for (const [kind, message] of [
    ["functions", "Uncovered handler"],
    ["lines", "Handler line coverage below 90%"],
  ] as const) {
    const failing = new Map(
      [...records].map(([path, record]) => [
        path,
        {
          ...record,
          [kind]: Object.fromEntries(Object.keys(record[kind]).map((key) => [key, 0])),
        },
      ]),
    );
    let rejected = false;
    try {
      requireHandlers(failing);
    } catch (error) {
      rejected = error instanceof Error && error.message.includes(message);
    }
    assert(rejected, `Zero ${kind} coverage must fail`);
  }
}

async function shortcutCoverage(page: Page, artifact: string): Promise<void> {
  const records = new Map<string, BrowserFileCoverage>();
  const entries = (await page.coverage.stopJSCoverage()).flatMap((entry) => {
    const url = new URL(entry.url);
    const path = decodeURIComponent(url.pathname).slice(1);
    if (Object.hasOwn(handlers, path) && url.searchParams.get("type") !== "style") {
      return [{ entry, path }];
    }
    return [];
  });
  const converted = await Promise.all(
    entries.map(
      async ({ entry, path }) =>
        await convertBrowserCoverage(entry, path, await Bun.file(path).text()),
    ),
  );
  for (const record of converted) {
    const previous = records.get(record.path);
    if (previous) {
      for (const kind of ["lines", "functions"] as const) {
        for (const [key, count] of Object.entries(record[kind])) {
          previous[kind][key] = (previous[kind][key] ?? 0) + count;
        }
      }
    } else {
      records.set(record.path, record);
    }
  }
  const measured = requireHandlers(records);
  verifyGate(records);
  await Bun.write(
    `${artifact}-coverage.json`,
    JSON.stringify(
      {
        provider: "Chrome V8 mapped through v8-to-istanbul",
        scope: "Shortcut handlers only; not aggregate application coverage",
        handlers: measured,
        files: [...records.values()],
      },
      null,
      2,
    ),
  );
  process.stdout.write(
    `Shortcut coverage: ${measured.length} authored handlers exercised; ${measured.reduce((sum, item) => sum + item.covered, 0)}/${measured.reduce((sum, item) => sum + item.lines, 0)} mapped handler lines.\n`,
  );
}

export { requireHandlers, shortcutCoverage };

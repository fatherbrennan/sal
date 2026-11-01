import { expect, it } from "bun:test";
import process from "node:process";
import { browsers } from "../browser/browsers.ts";
import { formulaLayoutFlow } from "../browser/formula-layout-flow.ts";
import { formulaReferenceFlow } from "../browser/formula-reference-flow.ts";
import { createFormula, formulasFlow } from "../browser/formulas-flow.ts";
import { importFixture } from "../measurement/compare-flow.ts";

const workflowTimeout = 90_000;
const actionTimeout = 10_000;
it.each(browsers)(
  "manages custom formula rows from the table header: $name",
  async (entry) => {
    const browser = await entry.launch();
    try {
      const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
      page.setDefaultTimeout(actionTimeout);
      const errors: string[] = [];
      page.on("pageerror", (error) => errors.push(error.message));
      await page.goto("http://localhost:2000");
      await formulaLayoutFlow(page);
      expect(errors).toEqual([]);
      process.stdout.write(`${entry.name} ${browser.version()} on ${process.platform}\n`);
    } finally {
      await browser.close();
    }
  },
  workflowTimeout,
);
it.each(browsers)(
  "deselects an inspected custom formula without stale reads: $name",
  async (entry) => {
    const browser = await entry.launch();
    try {
      const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
      page.setDefaultTimeout(actionTimeout);
      const diagnostics: string[] = [];
      page.on("pageerror", (error) => diagnostics.push(error.message));
      page.on("console", (message) => {
        if (message.type() === "warning" || message.type() === "error") {
          diagnostics.push(message.text());
        }
      });
      await page.goto("http://localhost:2000");
      await importFixture(page);
      await createFormula(page);
      await formulaReferenceFlow(page);
      expect(diagnostics).toEqual([]);
      process.stdout.write(`${entry.name} ${browser.version()} on ${process.platform}\n`);
    } finally {
      await browser.close();
    }
  },
  workflowTimeout,
);
it.each(browsers)(
  "builds and compares custom formulas in the running development app: $name",
  async (entry) => {
    const browser = await entry.launch();
    try {
      const context = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
      const page = await context.newPage();
      page.setDefaultTimeout(actionTimeout);
      const errors: string[] = [];
      page.on("pageerror", (error) => errors.push(error.message));
      await page.goto("http://localhost:2000");
      await formulasFlow(page, `test-results/formulas-dev-${entry.name}`);
      expect(errors).toEqual([]);
      process.stdout.write(`${entry.name} ${browser.version()} on ${process.platform}\n`);
    } finally {
      await browser.close();
    }
  },
  workflowTimeout,
);

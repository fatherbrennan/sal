import { afterAll, beforeAll, expect, it } from "bun:test";
import assert from "node:assert/strict";
import { resolve } from "node:path";
import { type Browser, chromium, type Page } from "playwright";
import { createServer, type ViteDevServer } from "vite";
import { browserLcov, convertBrowserCoverage } from "../../scripts/browser-coverage.ts";
import { calculatorFlow } from "../browser/calculator-flow.ts";
import { comparisonInspectorFlow } from "../browser/comparison-inspector-flow.ts";
import { formulasFlow } from "../browser/formulas-flow.ts";
import { inspectorNavigationFlow } from "../browser/inspector-navigation-flow.ts";
import { shortcutReferenceFlow } from "../browser/settings-flow.ts";
import { calculatorAudit } from "../browser/shortcut-audit-calculator.ts";
import { controlAudit } from "../browser/shortcut-audit-controls.ts";
import { requireHandlers } from "../browser/shortcut-audit-coverage.ts";
import { dialogAudit } from "../browser/shortcut-audit-dialogs.ts";
import { shortcutAuditTable } from "../browser/shortcut-audit-table.ts";
import { shortcutContextFlow } from "../browser/shortcut-context-flow.ts";
import { annualLeaveFlow } from "./annual-leave-flow.ts";
import { bonusSuperFlow } from "./bonus-super-flow.ts";
import { backupFlow, comparisonDetailsFlow, importFixture } from "./compare-flow.ts";
import { conflictFlow, importChoiceFlow } from "./conflict-flow.ts";
import { defaultsFlow } from "./defaults-flow.ts";
import { editFlow } from "./edit-flow.ts";
import { comparisonEquations, equationFlow } from "./equation-flow.ts";
import { orderFlow } from "./order-flow.ts";
import { simplifiedFlow } from "./simplified-flow.ts";
import { uiFlow } from "./ui-flow.ts";
import { uxFlow } from "./ux-flow.ts";
import { workPatternFlow } from "./work-pattern-flow.ts";

const authoredModule = /^\/src\/.*\.(?:ts|svelte)$/u;
const actionTimeout = 5000;
const applicationTimeout = 60_000;
let server: ViteDevServer;
let browser: Browser;
let page: Page;
const errors: string[] = [];

beforeAll(async () => {
  await Bun.write("coverage/browser.lcov", "");
  server = await createServer({
    configFile: resolve("vite.config.ts"),
    server: { host: "127.0.0.1", open: false, fs: { allow: [resolve(".")] } },
  });
  await server.listen();
  const address = server.httpServer?.address();
  assert(address !== null && typeof address === "object");
  browser = await chromium.launch({ channel: "chrome", headless: true });
  const context = await browser.newContext();
  context.setDefaultTimeout(actionTimeout);
  page = await context.newPage();
  page.on("pageerror", (error) => errors.push(error.message));
  await page.coverage.startJSCoverage({
    reportAnonymousScripts: false,
    resetOnNavigation: true,
  });
  await page.goto(`http://127.0.0.1:${address.port}`, { waitUntil: "load" });
  await page.getByRole("heading", { name: "sal", exact: true }).waitFor();
}, applicationTimeout);

afterAll(async () => {
  await browser?.close();
  await server?.close();
});

it(
  "measures offer editing, shared defaults and work patterns",
  async () => {
    expect(await page.title()).toBe("sal");
    await orderFlow(page);
    await simplifiedFlow(page);
    await uiFlow(page);
    await defaultsFlow(page);
    await workPatternFlow(page, "test-results/work-pattern-development");
    await bonusSuperFlow(page);
    await editFlow(page);
  },
  applicationTimeout,
);

it(
  "measures comparison financial priorities",
  async () => {
    await uxFlow(page, "test-results/ux-measured");
    expect(errors).toEqual([]);
  },
  applicationTimeout,
);

it(
  "measures comparison equations",
  async () => {
    await importFixture(page);
    await page.getByRole("button", { name: "comparisons", exact: true }).click();
    await page
      .getByLabel("Saved comparison", { exact: true })
      .selectOption({ label: "Two offers" });
    await comparisonEquations(page);
    expect(errors).toEqual([]);
  },
  applicationTimeout,
);

it(
  "measures equation navigation and breakdowns",
  async () => {
    await equationFlow(page);
    await page.setViewportSize({ width: 1920, height: 1080 });
    await comparisonInspectorFlow(page, "test-results/comparison-inspector-measured");
    await page.setViewportSize({ width: 1280, height: 720 });
    expect(errors).toEqual([]);
  },
  applicationTimeout,
);

it(
  "measures navigation between inspector and comparison",
  async () => {
    await page.setViewportSize({ width: 1920, height: 1080 });
    await inspectorNavigationFlow(page);
    await page.setViewportSize({ width: 1280, height: 720 });
    expect(errors).toEqual([]);
  },
  applicationTimeout,
);

it(
  "measures comparison scenarios and differences",
  async () => {
    await comparisonDetailsFlow(page);
    expect(errors).toEqual([]);
  },
  applicationTimeout,
);

it(
  "measures backups and persistence conflicts",
  async () => {
    await backupFlow(page);
    await conflictFlow(page);
    await importChoiceFlow(page);
    await page.evaluate(async () => {
      const path = "/tests/measurement/database-fixture.ts";
      const fixture: typeof import("./database-fixture.ts") = await import(path);
      await fixture.databaseChecks();
    });
    expect(errors).toEqual([]);
  },
  applicationTimeout,
);

it(
  "measures independent base pay and annual leave values",
  async () => {
    await annualLeaveFlow(page);
    expect(errors).toEqual([]);
  },
  applicationTimeout,
);

it(
  "measures click-to-calculate and keyboard shortcuts",
  async () => {
    await calculatorFlow(page, "test-results/calculator-measured");
    await shortcutReferenceFlow(page, "test-results/settings-measured");
    await shortcutAuditTable(page);
    expect(errors).toEqual([]);
  },
  applicationTimeout,
);

it(
  "measures shortcut scopes, enabling states and control navigation",
  async () => {
    await shortcutContextFlow(page);
    await calculatorAudit(page);
    await dialogAudit(page);
    await page.locator("header").getByRole("button", { name: "Calculator", exact: true }).click();
    await controlAudit(page);
    expect(errors).toEqual([]);
  },
  applicationTimeout,
);

it(
  "measures formula editing, comparison rows and persistence",
  async () => {
    await page.setViewportSize({ width: 1440, height: 1000 });
    await formulasFlow(page, "test-results/formulas-measured", false);
    expect(errors).toEqual([]);
  },
  applicationTimeout,
);

it(
  "maps collected coverage to original application sources",
  async () => {
    const entries = (await page.coverage.stopJSCoverage()).filter((entry) => {
      const url = new URL(entry.url);
      return authoredModule.test(url.pathname) && url.searchParams.get("type") !== "style";
    });
    const records = await Promise.all(
      entries.map(async (entry) => {
        const path = decodeURIComponent(new URL(entry.url).pathname).slice(1);
        return await convertBrowserCoverage(entry, path, await Bun.file(path).text());
      }),
    );
    expect(records.some((record) => record.path === "src/routes/+page.svelte")).toBe(true);
    await Bun.write("coverage/browser.lcov", browserLcov(records));
    requireHandlers(new Map(records.map((record) => [record.path, record])));
  },
  applicationTimeout,
);

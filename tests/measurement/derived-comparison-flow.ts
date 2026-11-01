import assert from "node:assert/strict";
import type { Page } from "playwright";
import { deltaColor } from "./comparison-colors.ts";
import { saveSettled } from "./edit-flow.ts";
import { closeInspector } from "./inspector-flow.ts";
import { selectScenario } from "./navigation.ts";

const decisionLabel = /Work and commuting/u;
const whitespace = /\s+/gu;

async function derivedComparisonFlow(page: Page): Promise<void> {
  const table = page.getByRole("region", { name: "Salary comparison" });
  const row = (label: string) =>
    table
      .getByRole("row")
      .filter({ has: page.getByRole("rowheader", { name: label, exact: true }) });
  const decision = table.getByRole("button", { name: decisionLabel });
  if ((await decision.getAttribute("aria-expanded")) === "false") {
    await decision.focus();
    await decision.press("Enter");
  }
  assert((await decision.getAttribute("aria-expanded")) === "true");
  await derivedRows(page);
  await targetUpsideFlow(page);
  await row("Change in cash after tax and job costs per extra work + commute hour")
    .getByRole("cell")
    .nth(1)
    .getByRole("button")
    .click();
  assert(
    (await page.getByRole("dialog").textContent())?.includes("strictly more work + commute hours"),
  );
  await closeInspector(page);
  await derivedBaselineFlow(page);
  await page.screenshot({ path: "test-results/derived-comparison.png", fullPage: true });
  await decision.press("Enter");
  assert((await decision.getAttribute("aria-expanded")) === "false");
}

async function derivedBaselineFlow(page: Page): Promise<void> {
  const table = page.getByRole("region", { name: "Salary comparison" });
  const ratio = table.getByRole("row").filter({
    has: page.getByRole("rowheader", {
      name: "Change in cash after tax and job costs per extra work + commute hour",
      exact: true,
    }),
  });
  await page.getByLabel("Baseline offer", { exact: true }).selectOption("offer-b");
  await saveSettled(page);
  assert(
    (await ratio.getByRole("cell").allTextContents()).every(
      (text) => text.trim() === "Unavailable",
    ),
  );
  await page.getByLabel("Baseline offer", { exact: true }).selectOption("");
  await saveSettled(page);
  assert(
    (await ratio.getByRole("cell").allTextContents()).every(
      (text) => text.trim() === "Unavailable",
    ),
  );
  await page.getByLabel("Baseline offer", { exact: true }).selectOption("offer-a");
  await selectScenario(page, "Target · including one-offs");
  const upside = table.getByRole("row").filter({
    has: page.getByRole("rowheader", { name: "Target increase: cash after tax", exact: true }),
  });
  assert((await upside.getByRole("cell").first().textContent())?.includes("$6,800.00"));
  await selectScenario(page, "Guaranteed · recurring");
}

async function derivedRows(page: Page): Promise<void> {
  const table = page.getByRole("region", { name: "Salary comparison" });
  const row = (label: string) =>
    table
      .getByRole("row")
      .filter({ has: page.getByRole("rowheader", { name: label, exact: true }) });
  assert(
    (
      await row("Package value before tax").locator("small .equation-trigger").textContent()
    )?.includes("10%"),
  );
  assert(
    (
      await row("Package value after tax per standard paid hour")
        .getByRole("cell")
        .first()
        .textContent()
    )?.includes("$42.15"),
  );
  assert(
    (await row("Remote share of work hours (%)").locator("small .equation-trigger").textContent())
      ?.replace(whitespace, " ")
      .includes("100 pp"),
  );
  await deltaColor(page, "Remote share of work hours (%)", "muted");
  assert(
    (await row("Commute costs per return trip").getByRole("cell").nth(1).textContent())?.includes(
      "$6.40",
    ),
  );
  assert(
    (
      await row("Commute share of work + commute hours (%)").getByRole("cell").nth(1).textContent()
    )?.includes("11.11%"),
  );
  assert(
    (
      await row("Change in cash after tax and job costs per extra work + commute hour")
        .getByRole("cell")
        .nth(1)
        .textContent()
    )?.includes("$121.90"),
  );
}

async function targetUpsideFlow(page: Page): Promise<void> {
  const table = page.getByRole("region", { name: "Salary comparison" });
  const row = (label: string) =>
    table
      .getByRole("row")
      .filter({ has: page.getByRole("rowheader", { name: label, exact: true }) });
  await [
    ["Target increase: cash pay before tax", "$10,000.00"],
    ["Target increase: total super contributions", "$1,200.00"],
    ["Target increase: package value before tax", "$11,200.00"],
    ["Target increase: cash after tax", "$6,800.00"],
    ["Target increase: super contributions after contribution tax", "$1,020.00"],
    ["Target increase: package value after tax", "$7,820.00"],
  ].reduce(async (previous, [label, expected]) => {
    await previous;
    assert(label !== undefined && expected !== undefined);
    assert((await row(label).getByRole("cell").first().textContent())?.includes(expected));
    await row(label).getByRole("cell").first().getByRole("button").click();
    assert((await page.getByRole("dialog").textContent())?.includes("Contingent target upside"));
    await closeInspector(page);
  }, Promise.resolve());
}

export { derivedComparisonFlow };

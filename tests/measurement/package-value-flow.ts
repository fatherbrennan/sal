import assert from "node:assert/strict";
import type { Page } from "playwright";
import { importFixture } from "./compare-flow.ts";
import { deltaColor } from "./comparison-colors.ts";
import { saveSettled } from "./edit-flow.ts";
import { backupFixture } from "./fixtures.ts";
import { amountButton, closeInspector } from "./inspector-flow.ts";

const annual = "Package value after tax and all job costs";
const hourly = "Package value after tax and all job costs per work + commute hour";

async function priorityValues(page: Page): Promise<void> {
  const table = page.getByRole("region", { name: "Salary comparison" });
  const expected = [
    "Package value after tax, commute costs and commute time value",
    "Cash after tax",
    "Super contributions after contribution tax",
    "Personal perk value",
    "Commute costs",
    "Commute time value",
    "Cash + super after tax per standard paid hour",
    "Annual leave earned (weeks)",
    "Annual leave earned (hours)",
    "Annual leave value before tax (base pay + super)",
    "Package value including hypothetical leave cash-out",
    "Hypothetical leave cash-out: cash + super after tax",
    "Hypothetical leave cash-out: cash after tax",
    "Hypothetical leave cash-out: super after contribution tax",
  ];
  assert((await table.locator(".overview-result:visible").count()) === expected.length);
  const actual = (await table.getByRole("rowheader").getByRole("button").allTextContents())
    .slice(0, expected.length)
    .map((label) => label.trim());
  assert(JSON.stringify(actual) === JSON.stringify(expected), JSON.stringify(actual));
  const amounts = [["$87,680.00", "$92,727.39"]];
  const texts = await table.locator(".key-result td").allTextContents();
  const expectedValues = amounts.flat();
  assert(texts.length === expectedValues.length);
  for (const [index, value] of expectedValues.entries()) {
    assert(texts[index]?.includes(value));
  }
}

async function packageValueFlow(page: Page): Promise<void> {
  await priorityValues(page);
  const table = page.getByRole("region", { name: "Salary comparison" });
  const costs = table.getByRole("button", { name: "Job costs and adjusted values", exact: true });
  if ((await costs.getAttribute("aria-expanded")) === "false") {
    await costs.click();
  }
  const row = (label: string) =>
    table
      .getByRole("row")
      .filter({ has: page.getByRole("rowheader", { name: label, exact: true }) });
  const annualText = (await row(annual).getByRole("cell").first().textContent()) ?? "";
  assert(annualText.includes("$87,680.00"), annualText);
  assert((await row(annual).getByRole("cell").nth(1).textContent())?.includes("$95,160.80"));
  assert((await row(hourly).getByRole("cell").first().textContent())?.includes("$206.79"));
  assert((await row(hourly).getByRole("cell").nth(1).textContent())?.includes("$199.50"));
  await deltaColor(page, annual, "success");
  await deltaColor(page, hourly, "danger");
  await amountButton(page, hourly).click();
  assert(
    (await page.getByRole("dialog").textContent())?.includes("No monetary time value is deducted"),
  );
  await closeInspector(page);
  const setup = page.locator(".comparison-setup");
  await setup.locator(":scope > summary").click();
  const time = page.getByLabel("Include monetary commute time valuation?", { exact: true });
  await time.selectOption("no");
  await saveSettled(page);
  assert((await row(hourly).getByRole("cell").nth(1).textContent())?.includes("$199.50"));
  assert(
    (
      await row("Package value after tax, all job costs and commute time value")
        .getByRole("cell")
        .nth(1)
        .textContent()
    )?.includes("$95,160.80"),
  );
  await time.selectOption("yes");
  await saveSettled(page);
  await setup.locator(":scope > summary").click();
}

async function packageOverflowFlow(page: Page): Promise<void> {
  const fixture = backupFixture();
  const record = fixture.records.find((entry) => entry.id === "offer-a");
  assert(record !== undefined);
  const zeroPlaces = 323;
  record.items = {
    roster: [],
    exceptions: [
      {
        id: "tiny-work",
        fields: {
          date: "2026-07-01",
          hours: `0.${"0".repeat(zeroPlaces)}5`,
          journeys: "0",
          place: "remote",
          kind: "work",
        },
      },
    ],
  };
  await importFixture(page, fixture);
  await page.getByRole("button", { name: "comparisons", exact: true }).click();
  await page.getByLabel("Saved comparison", { exact: true }).selectOption({ label: "Two offers" });
  const table = page.getByRole("region", { name: "Salary comparison" });
  const costs = table.getByRole("button", { name: "Job costs and adjusted values", exact: true });
  if ((await costs.getAttribute("aria-expanded")) === "false") {
    await costs.click();
  }
  const row = (label: string) =>
    table.getByRole("row").filter({
      has: page.getByRole("rowheader", { name: label, exact: true }),
    });
  const annualText = (await row(annual).getByRole("cell").first().textContent()) ?? "";
  assert(annualText.includes("$87,680.00"), annualText);
  assert((await row(hourly).getByRole("cell").first().textContent())?.includes("Unavailable"));
  await amountButton(page, hourly).click();
  const text = (await page.getByRole("dialog").textContent()) ?? "";
  assert(text.includes("Unavailable"));
  assert(!(text.includes("∞") || text.includes("Infinity")));
  await closeInspector(page);
}

export { packageOverflowFlow, packageValueFlow };

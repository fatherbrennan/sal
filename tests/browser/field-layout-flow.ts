import assert from "node:assert/strict";
import type { Page } from "playwright";
import { editorSection, saveSettled, textField } from "../measurement/edit-flow.ts";
import { backupFixture } from "../measurement/fixtures.ts";
import { navigateTo } from "../measurement/navigation.ts";
import { fieldAlignment } from "./field-alignment.ts";

async function expandFields(page: Page): Promise<void> {
  await (await page.locator(".editor details").all()).reduce(async (previous, panel) => {
    await previous;
    if ((await panel.getAttribute("open")) === null) {
      await panel.locator(":scope > summary").click();
    }
  }, Promise.resolve());
  await fieldAlignment(page);
}

function layoutFixture() {
  const fixture = backupFixture();
  const offer = fixture.records.find((record) => record.id === "offer-b");
  assert(offer);
  offer.name = "An offer with a long name that wraps onto multiple lines in the comparison choices";
  offer.archived = true;
  offer.items = Object.fromEntries(
    ["earnings", "perks", "costs", "roster", "exceptions", "holidays", "taxOverride"].map(
      (group) => [group, [{ id: group, fields: {} }]],
    ),
  );
  return { fixture, offer };
}

async function comparisonFields(page: Page, artifact: string): Promise<void> {
  const { fixture } = layoutFixture();
  await navigateTo(page, "Backups");
  await page.getByLabel("Preview a JSON backup").setInputFiles({
    name: "layout.json",
    mimeType: "application/json",
    buffer: Buffer.from(JSON.stringify(fixture)),
  });
  await page.getByRole("button", { name: "Apply selected import", exact: true }).click();
  await saveSettled(page);
  await page.getByRole("button", { name: "comparisons", exact: true }).click();
  await page.getByLabel("Saved comparison", { exact: true }).selectOption({ label: "Two offers" });
  await page.locator(".comparison-setup > summary").click();
  const offers = page.getByRole("combobox", { name: "Offers to compare", exact: true });
  const options = page.getByRole("listbox", { name: "Offers to compare", exact: true });
  await offers.fill("Remote offer");
  await options.getByRole("option", { name: "Remote offer", exact: true, selected: true }).click();
  await saveSettled(page);
  await offers.press("Escape");
  await page.screenshot({ path: `${artifact}-comparison.png`, fullPage: true });
  await fieldAlignment(page);
  await offers.focus();
  await offers.press("ArrowDown");
  await offers.press("Enter");
  await saveSettled(page);
  await options
    .getByRole("option", { name: "Remote offer", exact: true, selected: true })
    .waitFor();
  await offers.press("Escape");
  await fieldAlignment(page);
  const scenario = page.getByRole("combobox", { name: "Earnings scenario", exact: true });
  await scenario.fill("Target · recurring");
  await scenario.press("ArrowDown");
  await scenario.press("Enter");
  assert((await scenario.inputValue()) === "Target · recurring");
  await fieldAlignment(page);
}

async function offerFields(page: Page, artifact: string): Promise<void> {
  // A 13px label, 24px control and frame spacing occupy about 48.4px.
  const maximumSingleLineHeight = 49;
  const { offer } = layoutFixture();
  await page.getByRole("button", { name: "offers", exact: true }).click();
  await page.getByLabel("Show archived", { exact: true }).check();
  await page.getByRole("button", { name: `${offer.name} · archived`, exact: true }).click();
  const name = page.getByLabel("Name", { exact: true });
  await name.focus();
  assert(
    await name.evaluate((control) => {
      const frame = control.parentElement;
      return frame !== null && Number.parseFloat(getComputedStyle(frame).outlineWidth) >= 2;
    }),
    "Keyboard focus must outline the shared field frame",
  );
  const nameBox = await name.locator("..").boundingBox();
  assert(
    nameBox !== null && nameBox.height <= maximumSingleLineHeight,
    "A single-line field must stay compact",
  );
  await expandFields(page);
  await page.evaluate(() => globalThis.scrollTo(0, 0));
  await page.screenshot({ path: `${artifact}-offer.png`, fullPage: true });
  await editorSection(page, "Pay details").screenshot({
    path: `${artifact}-pay-fields.png`,
    style: "header { visibility: hidden; }",
  });
  await page.getByLabel("Quoted unit", { exact: true }).selectOption("hour");
  await saveSettled(page);
  await page.getByLabel("Journey entry", { exact: true }).selectOption("legs");
  await saveSettled(page);
  await fieldAlignment(page);
  const salary = page.getByLabel("Base salary or revenue (AUD)", { exact: true });
  await salary.fill("invalid");
  await salary.press("Tab");
  await page.getByRole("alert").filter({ hasText: "last saved value" }).waitFor();
  await fieldAlignment(page);
  await page.getByRole("button", { name: "Revert field", exact: true }).click();
  await page.getByLabel("Employment type", { exact: true }).selectOption("sole-trader");
  await saveSettled(page);
  await expandFields(page);
}

async function backupFields(page: Page): Promise<void> {
  const { fixture } = layoutFixture();
  await navigateTo(page, "Backups");
  await page.getByLabel("Preview a JSON backup").setInputFiles({
    name: "layout.json",
    mimeType: "application/json",
    buffer: Buffer.from(JSON.stringify(fixture)),
  });
  await page.getByText("Remote offer — choose a version", { exact: true }).click();
  await page.locator("details[open]").getByLabel("Keep local version", { exact: true }).check();
  await fieldAlignment(page);
  await page.getByRole("button", { name: "Cancel import", exact: true }).click();
}

async function conflictFields(page: Page): Promise<void> {
  await page.getByRole("button", { name: "offers", exact: true }).click();
  await page.getByRole("button", { name: "Remote offer", exact: true }).click();
  const other = await page.context().newPage();
  try {
    await other.goto(page.url());
    await other.getByRole("button", { name: "Remote offer", exact: true }).click();
    await textField(other, "Name", "Stored layout version");
    const name = page.getByLabel("Name", { exact: true });
    await name.fill("Local layout version");
    await name.press("Tab");
    await page.getByRole("region", { name: "Resolve conflicting edits" }).waitFor();
    await page.getByLabel("Keep my edit", { exact: true }).check();
    await fieldAlignment(page);
  } finally {
    await other.close();
  }
}

async function fieldLayoutFlow(page: Page, artifact: string): Promise<void> {
  await comparisonFields(page, artifact);
  await offerFields(page, artifact);
  await ["Personal tax settings", "vehicle", "Preferences"].reduce(async (previous, tab) => {
    await previous;
    await navigateTo(page, tab);
    await expandFields(page);
    await page.evaluate(() => globalThis.scrollTo(0, 0));
    await page.screenshot({ path: `${artifact}-${tab}.png`, fullPage: true });
  }, Promise.resolve());
  await backupFields(page);
  await conflictFields(page);
}

export { fieldLayoutFlow };

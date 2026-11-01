import assert from "node:assert/strict";
import type { Page } from "playwright";
import { importFixture } from "../measurement/compare-flow.ts";
import { backupFixture } from "../measurement/fixtures.ts";
import { amountButton, closeInspector } from "../measurement/inspector-flow.ts";

const headline = "Package value after tax, commute costs and commute time value";

function stressFixture() {
  const fixture = backupFixture();
  const offer = fixture.records.find((record) => record.kind === "offer");
  const comparison = fixture.records.find((record) => record.kind === "comparison");
  const { offers } = comparison?.items ?? {};
  assert(offer && offers);
  offer.name = "A long offer name with a large annual amount for typography verification";
  offer.fields = { ...offer.fields, amount: "12345678.90" };
  const draft = {
    ...offer,
    id: "typography-draft",
    name: "Draft with missing salary",
    fields: { ...offer.fields, amount: "" },
  };
  fixture.records.push(draft);
  offers.push({ id: "typography-draft-link", fields: { offerId: draft.id } });
  return fixture;
}

async function typographyStress(page: Page, browser: string): Promise<void> {
  await importFixture(page, stressFixture());
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.getByRole("button", { name: "comparisons", exact: true }).click();
  await page.getByLabel("Saved comparison", { exact: true }).selectOption({ label: "Two offers" });
  await page.getByRole("button", { name: "Expand all details", exact: true }).click();
  const overflow = await page.locator(".delta-values").evaluateAll((rows) =>
    rows
      .filter((row) => row.checkVisibility())
      .flatMap((row) => {
        const children = [...row.children];
        const cell = row.closest("td");
        if (!cell) {
          return ["Missing value cell"];
        }
        const bounds = cell.getBoundingClientRect();
        return children.flatMap((child, index) => {
          const box = child.getBoundingClientRect();
          const next = children[index + 1]?.getBoundingClientRect();
          if (
            box.left < bounds.left ||
            box.right > bounds.right ||
            (next && box.right > next.left)
          ) {
            return [row.textContent?.trim() ?? "Clipped difference"];
          }
          return [];
        });
      }),
  );
  assert(overflow.length === 0, overflow.join("\n"));
  await page.screenshot({ path: `test-results/typography-${browser}-large-values.png` });
  const draftIndex = 2;
  await amountButton(page, headline, draftIndex).click();
  const amount = page.getByRole("dialog", { name: "Calculation inspector" }).locator(".amount");
  assert((await amount.textContent())?.includes("Unavailable"));
  const style = await amount.evaluate((element) => ({
    family: getComputedStyle(element).fontFamily,
    size: getComputedStyle(element).fontSize,
  }));
  assert(style.family.includes("IBM Plex Sans") && style.size === "14px", JSON.stringify(style));
  await page.screenshot({ path: `test-results/typography-${browser}-unavailable.png` });
  await closeInspector(page);
}

export { typographyStress };

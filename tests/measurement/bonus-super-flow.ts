import assert from "node:assert/strict";
import { isDeepStrictEqual } from "node:util";
import type { Page } from "playwright";
import { readBackup, type SalRecord } from "../../src/lib/data/schema.ts";
import { bonus, offer } from "../calculations/package-fixture.ts";
import { editorSection, saveSettled, textField } from "./edit-flow.ts";
import { backupFixture } from "./fixtures.ts";
import { navigateTo } from "./navigation.ts";

const offerName = "Bonus super choices";
const groupName = "Additional cash bonuses and commissions";
const groupSummary = /^Additional cash bonuses and commissions \(\d+\)$/u;

async function openBonusOffer(page: Page): Promise<void> {
  await page.getByRole("button", { name: "offers", exact: true }).click();
  await page.getByRole("button", { name: offerName, exact: true }).click();
  const summary = page.getByText(groupSummary);
  if ((await editorSection(page, groupSummary).getAttribute("open")) === null) {
    await summary.click();
  }
}

async function exportedOffer(page: Page): Promise<SalRecord> {
  await navigateTo(page, "Backups");
  await page.getByRole("button", { name: "Prepare JSON backup", exact: true }).click();
  await page.getByRole("link", { name: "Download sal-backup.json" }).waitFor();
  const exported: unknown = await page.evaluate(async () => {
    const link = document.querySelector("a[download]");
    if (!(link instanceof HTMLAnchorElement)) {
      throw new Error("Missing backup link");
    }
    return await (await fetch(link.href)).json();
  });
  const record = readBackup(exported).records.find((entry) => entry.name === offerName);
  assert(record);
  await openBonusOffer(page);
  return record;
}

async function bonusSuperFlow(page: Page): Promise<void> {
  const record = offer();
  record.id = "bonus-super-offer";
  record.name = offerName;
  const partial = bonus({ eligible: "", inclusion: "includes", label: "Partial" });
  const exempt = { ...bonus({ eligible: "no", inclusion: "includes" }), id: "exempt" };
  record.items = { earnings: [partial, exempt] };
  await navigateTo(page, "Backups");
  await page.getByLabel("Preview a JSON backup").setInputFiles({
    name: "bonus-super.json",
    mimeType: "application/json",
    buffer: Buffer.from(JSON.stringify({ ...backupFixture(), records: [record] })),
  });
  await page.getByRole("button", { name: "Apply selected import", exact: true }).click();
  await saveSettled(page);
  await openBonusOffer(page);
  const partialRow = page.getByRole("group", { name: `${groupName} 1`, exact: true });
  const exemptRow = page.getByRole("group", { name: `${groupName} 2`, exact: true });
  assert((await page.getByLabel("Eligible for super?", { exact: true }).count()) === 0);
  assert((await page.getByLabel("Includes super?", { exact: true }).count()) === 0);
  assert((await partialRow.getByLabel("Super on this payment").inputValue()) === "");
  assert((await exemptRow.getByLabel("Super on this payment").inputValue()) === "none");
  assert((await partialRow.textContent())?.includes("Saved amount includes super"));
  await textField(page, "Name", `${offerName} edited`);
  await textField(page, "Name", offerName);
  const saved = await exportedOffer(page);
  const { earnings } = saved.items;
  assert(isDeepStrictEqual(earnings, [partial, exempt]));
  await page.getByRole("button", { name: `Add ${groupName}`, exact: true }).click();
  await saveSettled(page);
  const addedRow = page.getByRole("group", { name: `${groupName} 3`, exact: true });
  const treatment = addedRow.getByLabel("Super on this payment", { exact: true });
  assert((await treatment.inputValue()) === "");
  assert(
    (await addedRow.textContent())?.includes("Super applies; choose how the amount is quoted."),
  );
  await changeChoices(page, await exportedOffer(page));
  await treatment.focus();
  await page.keyboard.press("ArrowDown");
  await page.keyboard.press("Tab");
  await saveSettled(page);
  assert((await treatment.inputValue()) === "excludes");
  await reopenBonusOffer(page);
}

async function changeChoices(page: Page, initial: SalRecord): Promise<void> {
  const { earnings: originalEarnings } = initial.items;
  const treatment = page
    .getByRole("group", { name: `${groupName} 3`, exact: true })
    .getByLabel("Super on this payment", { exact: true });
  await [
    { label: "Cash before tax, plus super", eligible: "yes", inclusion: "excludes" },
    { label: "Cash before tax and super combined", eligible: "yes", inclusion: "includes" },
    { label: "Cash before tax, no super applies", eligible: "no", inclusion: "excludes" },
    { label: "Not entered", eligible: "", inclusion: "" },
  ].reduce(async (previous, expected) => {
    const saved = await previous;
    await treatment.selectOption({ label: expected.label });
    await saveSettled(page);
    const next = await exportedOffer(page);
    assert(next.revision === saved.revision + 1, "A choice must save both answers in one revision");
    const { earnings } = next.items;
    const added = earnings?.at(-1);
    assert(
      isDeepStrictEqual(added?.fields, {
        included: "no",
        taxClass: "ordinary",
        eligible: expected.eligible,
        inclusion: expected.inclusion,
      }),
    );
    assert(isDeepStrictEqual(earnings?.slice(0, 2), originalEarnings?.slice(0, 2)));
    return next;
  }, Promise.resolve(initial));
}

async function reopenBonusOffer(page: Page): Promise<void> {
  const reopened = await page.context().newPage();
  try {
    await reopened.goto(page.url());
    await openBonusOffer(reopened);
    assert(
      (await reopened
        .getByRole("group", { name: `${groupName} 3`, exact: true })
        .getByLabel("Super on this payment")
        .inputValue()) === "excludes",
    );
  } finally {
    await reopened.close();
  }
}

export { bonusSuperFlow };

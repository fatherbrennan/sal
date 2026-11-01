import assert from "node:assert/strict";
import type { Page } from "playwright";
import { compactFields } from "./compact-fields.ts";

async function controlRows(page: Page): Promise<void> {
  const defects = await page.evaluate(() => {
    const tolerance = 1;
    return [...document.querySelectorAll(".field-grid")].flatMap((grid) => {
      const rows = new Map<number, DOMRect>();
      return [...grid.children]
        .filter((field) => field.checkVisibility())
        .flatMap((field) => {
          const problems: string[] = [];
          const control = field.querySelector("input, select");
          const label = field.querySelector("label");
          if (!(control && label)) {
            return ["Missing field control or label"];
          }
          const box = control.getBoundingClientRect();
          const fieldBox = field.getBoundingClientRect();
          const labelBox = label.getBoundingClientRect();
          const row = Math.round(fieldBox.top);
          const first = rows.get(row);
          if (
            first &&
            [first.top - box.top, first.height - box.height].some(
              (difference) => Math.abs(difference) > tolerance,
            )
          ) {
            problems.push(`Uneven control row: ${label.textContent}`);
          }
          if (
            Math.abs(labelBox.left - box.left) > tolerance ||
            box.right > fieldBox.right + tolerance ||
            labelBox.bottom - box.top > tolerance
          ) {
            problems.push(`Field label or width: ${label.textContent}`);
          }
          rows.set(row, box);
          return problems;
        });
    });
  });
  assert(defects.length === 0, defects.join("; "));
}

async function choiceLabels(page: Page): Promise<void> {
  const defects = await page.evaluate(() =>
    [...document.querySelectorAll("label:has(> input)")].flatMap((label) => {
      const input = label.querySelector("input");
      if (!input?.checkVisibility()) {
        return [];
      }
      const walker = document.createTreeWalker(label, NodeFilter.SHOW_TEXT);
      let text = walker.nextNode();
      while (text && !text.textContent?.trim()) {
        text = walker.nextNode();
      }
      if (!text) {
        return ["Choice has no visible label"];
      }
      const range = document.createRange();
      range.selectNodeContents(text);
      const [line] = range.getClientRects();
      const box = input.getBoundingClientRect();
      const labelBox = label.getBoundingClientRect();
      if (
        !line ||
        Math.abs(box.top + box.height / 2 - (line.top + line.height / 2)) > 2 ||
        box.right >= line.left ||
        labelBox.right > document.documentElement.clientWidth
      ) {
        return [`Choice alignment: ${label.textContent?.trim()}`];
      }
      return [];
    }),
  );
  assert(defects.length === 0, defects.join("; "));
}

async function choiceRows(page: Page): Promise<void> {
  const defects = await page.evaluate(() => {
    const tolerance = 1;
    return [...document.querySelectorAll("fieldset")].flatMap((group) => {
      const labels = [...group.querySelectorAll(":scope > label, :scope > div > label")].filter(
        (label) => ["checkbox", "radio"].includes(label.querySelector("input")?.type ?? ""),
      );
      const boxes = labels
        .map((label) => label.getBoundingClientRect())
        .filter((box) => box.height);
      return boxes
        .filter((box) =>
          boxes.some(
            (other) =>
              box.top < other.bottom - tolerance &&
              other.top < box.bottom - tolerance &&
              Math.abs(box.top - other.top) > tolerance,
          ),
        )
        .map(() => `Uneven choice row: ${group.querySelector("legend")?.textContent}`);
    });
  });
  assert(defects.length === 0, defects.join("; "));
}

async function fieldAlignment(page: Page): Promise<void> {
  await compactFields(page);
  await controlRows(page);
  await choiceLabels(page);
  await choiceRows(page);
  assert(
    await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth),
    "Fields overflow the viewport",
  );
}

export { fieldAlignment };

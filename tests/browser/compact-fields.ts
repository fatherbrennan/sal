import assert from "node:assert/strict";
import type { Page } from "playwright";

async function compactFields(page: Page): Promise<void> {
  const defects = await page.evaluate(() => {
    const maximumVerticalPadding = 8;
    const pixelTolerance = 1;
    return [...document.querySelectorAll("input[type='text'], input[type='file'], select")]
      .filter((control) => control.checkVisibility())
      .flatMap((control) => {
        const frame = control.parentElement;
        const label = frame?.querySelector("label");
        if (!(frame && label)) {
          return ["Missing shared label/control frame"];
        }
        const style = getComputedStyle(frame);
        const box = frame.getBoundingClientRect();
        const labelBox = label.getBoundingClientRect();
        const inputBox = control.getBoundingClientRect();
        const controlStyle = getComputedStyle(control);
        const problems: string[] = [];
        if (
          [
            style.borderTopWidth,
            style.borderRightWidth,
            style.borderBottomWidth,
            style.borderLeftWidth,
          ].some((width) => Number.parseFloat(width) < 1) ||
          labelBox.top <= box.top ||
          labelBox.bottom - inputBox.top > pixelTolerance ||
          inputBox.bottom >= box.bottom
        ) {
          problems.push(`Label and control need one enclosing border: ${label.textContent}`);
        }
        if (
          Number.parseFloat(controlStyle.borderTopWidth) !== 0 ||
          Number.parseFloat(controlStyle.borderBottomWidth) !== 0 ||
          box.height > labelBox.height + inputBox.height + maximumVerticalPadding
        ) {
          problems.push(`Extra field border or vertical space: ${label.textContent}`);
        }
        if (inputBox.height < 24) {
          problems.push(`Control target is too small: ${label.textContent}`);
        }
        return problems;
      });
  });
  assert(defects.length === 0, defects.join("; "));
  await compactChoices(page);
}

async function compactChoices(page: Page): Promise<void> {
  const defects = await page.evaluate(() =>
    [...document.querySelectorAll("label:has(> input)")]
      .filter((label) => label.checkVisibility())
      .flatMap((label) => {
        const group = label.closest("fieldset");
        const legend = group?.querySelector("legend");
        if (!(group && legend)) {
          return ["Choice needs a named group"];
        }
        const groupBox = group.getBoundingClientRect();
        const heading = legend.getBoundingClientRect();
        const choice = label.getBoundingClientRect();
        if (
          heading.top <= groupBox.top ||
          heading.bottom - choice.top > 1 ||
          choice.bottom >= groupBox.bottom ||
          choice.height < 24 ||
          Number.parseFloat(getComputedStyle(group).borderTopWidth) < 1
        ) {
          return [`Choice heading and options need one compact border: ${legend.textContent}`];
        }
        return [];
      }),
  );
  assert(defects.length === 0, defects.join("; "));
}

export { compactFields };

import { expect, it } from "bun:test";
import process from "node:process";
import { browsers, browserTimeout } from "./browsers.ts";

for (const entry of browsers) {
  it(
    `${entry.name} runs under Bun and supports keyboard interaction`,
    async () => {
      const browser = await entry.launch();
      try {
        const page = await browser.newPage();
        await page.setContent(`
        <!doctype html>
        <html lang="en">
          <title>Compatibility</title>
          <button type="button">Activate</button>
        </html>
      `);
        await page.getByRole("button").evaluate((button) => {
          button.addEventListener("click", () => {
            button.textContent = "Activated";
          });
        });
        await page.keyboard.press("Tab");
        expect(
          await page
            .getByRole("button", { name: "Activate" })
            .evaluate((element) => element === document.activeElement),
        ).toBe(true);
        await page.keyboard.press("Enter");
        expect(await page.getByRole("button").textContent()).toBe("Activated");
        await Bun.write(
          `test-results/compatibility-${entry.name.toLowerCase()}.json`,
          `${JSON.stringify({ browser: entry.name, version: browser.version(), runtime: Bun.version, platform: process.platform, headless: true }, null, 2)}\n`,
        );
      } finally {
        await browser.close();
      }
    },
    browserTimeout,
  );
}

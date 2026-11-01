import { expect, it } from "bun:test";

const declarations =
  /^\s*(?:font(?:-family|-size|-weight)?|line-height|letter-spacing):\s*(?<value>.+);/gmu;
const sharedValue = /^(?:var\(--|inherit$)/u;

it("keeps typography values in the shared palette", async () => {
  const files = [...new Bun.Glob("src/**/*.{svelte,css}").scanSync(".")];
  const violations = (
    await Promise.all(
      files
        .filter((path) => path.replaceAll("\\", "/") !== "src/typography.css")
        .map(async (path) => {
          const source = await Bun.file(path).text();
          return [...source.matchAll(declarations)]
            .filter((match) => {
              const { value } = match.groups ?? {};
              return !sharedValue.test(value ?? "");
            })
            .map((match) => `${path}: ${match[0].trim()}`);
        }),
    )
  ).flat();
  expect(violations).toEqual([]);
  expect(sharedValue.test("0.8rem")).toBe(false);
  expect(sharedValue.test("system-ui, sans-serif")).toBe(false);
});

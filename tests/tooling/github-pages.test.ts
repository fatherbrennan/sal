import { expect, it } from "bun:test";
import { buildBase, hostingBase, hostingUrl } from "../../config/github-pages.ts";
import { validateDeployment } from "../../scripts/github-pages.ts";

it("keeps local builds at the root and explicitly selects Pages builds", () => {
  const flag = "SAL_GITHUB_PAGES";
  const previous = Bun.env[flag];
  try {
    Reflect.deleteProperty(Bun.env, "SAL_GITHUB_PAGES");
    expect(buildBase()).toBe("");
    Bun.env[flag] = "true";
    expect(buildBase()).toBe(hostingBase(hostingUrl));
  } finally {
    if (previous === undefined) {
      Reflect.deleteProperty(Bun.env, "SAL_GITHUB_PAGES");
    } else {
      Bun.env[flag] = previous;
    }
  }
});

it("publishes only by manual dispatch and uploads only the static output", async () => {
  const workflow = Bun.YAML.parse(await Bun.file(".github/workflows/pages.yml").text());
  expect(workflow).toHaveProperty("on", Bun.YAML.parse("workflow_dispatch:"));
  expect(workflow).toHaveProperty("jobs.deploy.needs", "build");
  expect(workflow).toHaveProperty("jobs.deploy.permissions", {
    pages: "write",
    "id-token": "write",
  });
  expect(workflow).toHaveProperty(
    "jobs.build.steps",
    expect.arrayContaining([
      { uses: "actions/upload-pages-artifact@v4", with: { path: "build" } },
      { run: "bun run build:pages" },
      { run: "bun run test:browser:pages" },
    ]),
  );
});

it("supports repository paths and domain roots", () => {
  expect(hostingBase("https://example.github.io/sal/")).toBe("/sal");
  expect(hostingBase("https://example.github.io/sal")).toBe("/sal");
  expect(hostingBase("https://salary.example/")).toBe("");
});

it.each([
  "invalid",
  "http://example.com/",
  "https://user@example.com/",
  "https://example.com/?q=1",
  "https://example.com/#app",
])("rejects invalid hosting URL %s", (url) => {
  expect(() => hostingBase(url)).toThrow();
});

it("blocks placeholders and mismatched deployment targets", () => {
  expect(() =>
    validateDeployment(
      "YOUR_GITHUB_ACCOUNT",
      "https://example.com/",
      "example",
      "https://example.com/",
    ),
  ).toThrow("Set githubAccount");
  expect(() =>
    validateDeployment("example", "https://example.com/", "other", "https://example.com/"),
  ).toThrow("repository owner");
  expect(() =>
    validateDeployment("example", "https://example.com/sal/", "example", "https://example.com/"),
  ).toThrow("hostingUrl");
  expect(() =>
    validateDeployment("Example", "https://example.com/sal/", "example", "https://example.com/sal"),
  ).not.toThrow();
});

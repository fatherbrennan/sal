import assert from "node:assert/strict";
import { githubAccount, hostingUrl } from "../config/github-pages.ts";

const trailingSlash = /\/$/u;

function validateDeployment(
  account: string,
  address: string,
  owner: string,
  actualUrl: string,
): void {
  assert(account !== "YOUR_GITHUB_ACCOUNT", "Set githubAccount in config/github-pages.ts first.");
  assert(
    account.toLowerCase() === owner.toLowerCase(),
    "Configured GitHub account differs from the repository owner.",
  );
  assert(
    new URL(address).href.replace(trailingSlash, "") ===
      new URL(actualUrl).href.replace(trailingSlash, ""),
    "Configured hostingUrl differs from GitHub Pages. Update config/github-pages.ts.",
  );
}

if (import.meta.main) {
  const { GITHUB_REPOSITORY_OWNER: owner, PAGES_URL: pagesUrl } = Bun.env;
  validateDeployment(githubAccount, hostingUrl, owner ?? "", pagesUrl ?? "");
}

export { validateDeployment };

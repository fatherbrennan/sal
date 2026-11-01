import { env } from "node:process";

const githubAccount = "fatherbrennan";
const hostingUrl = `https://${githubAccount}.github.io/sal/`;
const trailingSlash = /\/$/u;

function hostingBase(address: string): "" | `/${string}` {
  const url = new URL(address);
  if (url.protocol !== "https:" || url.username || url.password || url.search || url.hash) {
    throw new Error("The hosting URL must be HTTPS without credentials, query or fragment.");
  }
  if (url.pathname === "/") {
    return "";
  }
  return `/${url.pathname.slice(1).replace(trailingSlash, "")}`;
}

function buildBase(): "" | `/${string}` {
  const { SAL_GITHUB_PAGES: pagesBuild } = env;
  if (pagesBuild === "true") {
    return hostingBase(hostingUrl);
  }
  return "";
}

export { buildBase, githubAccount, hostingBase, hostingUrl };

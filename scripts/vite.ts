import process from "node:process";
import { requireFreePort } from "../config/port.ts";

const viteTasks = new Set(["dev", "build", "preview"]);

async function runVite(arguments_: string[]): Promise<number> {
  const [task] = arguments_;
  if (task === undefined || !viteTasks.has(task)) {
    throw new Error("Use the dev, build or preview package task.");
  }
  if (task === "build") {
    await requireFreePort();
  }
  // SvelteKit workers add FORCE_COLOR, which conflicts with the tool host's NO_COLOR.
  const environment = Object.fromEntries(
    Object.entries(Bun.env).filter(([key]) => key !== "NO_COLOR"),
  );
  // SvelteKit reloads configuration in workers without the Vite mode.
  if (arguments_.includes("github-pages")) {
    const pagesFlag = "SAL_GITHUB_PAGES";
    environment[pagesFlag] = "true";
  }
  const child = Bun.spawn(
    [process.execPath, "--bun", "node_modules/vite/bin/vite.js", ...arguments_],
    {
      env: environment,
      stdin: "inherit",
      stdout: "inherit",
      stderr: "inherit",
    },
  );
  return await child.exited;
}

if (import.meta.main) {
  process.exitCode = await runVite(process.argv.slice(2));
}

export { runVite };

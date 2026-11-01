import { availableParallelism } from "node:os";
import process from "node:process";

const installThreadShare = 0.8;

function installConcurrency(threads: number): number {
  if (!Number.isSafeInteger(threads) || threads < 1) {
    throw new RangeError("Available threads must be a positive safe integer.");
  }
  return Math.max(1, Math.floor(threads * installThreadShare));
}

async function installDependencies(arguments_: string[]): Promise<number> {
  const [mode, ...extra] = arguments_;
  if (extra.length > 0 || (mode !== "frozen-lockfile" && mode !== "update-lockfile")) {
    throw new Error("Use dependencies:install or dependencies:lock without additional arguments.");
  }
  const threads = availableParallelism();
  const concurrency = installConcurrency(threads);
  const command = [process.execPath, "install", `--concurrent-scripts=${concurrency}`];
  if (mode === "frozen-lockfile") {
    command.push("--frozen-lockfile");
  }
  process.stdout.write(
    `Install lifecycle concurrency: ${concurrency} of ${threads} available threads.\n`,
  );
  const child = Bun.spawn(command, { stdin: "inherit", stdout: "inherit", stderr: "inherit" });
  return await child.exited;
}

if (import.meta.main) {
  process.exitCode = await installDependencies(process.argv.slice(2));
}

export { installConcurrency, installDependencies };

import { expect, it } from "bun:test";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import process from "node:process";

it("keeps ordinary and coverage Bun configurations identical except for coverage activation", async () => {
  const ordinary = await Bun.file("bunfig.toml").text();
  const coverage = await Bun.file("bunfig.coverage.toml").text();
  expect(coverage.replace("coverage = true", "coverage = false")).toBe(ordinary);
});

it("Bun rejects an under-covered fixture and accepts the fully tested control", async () => {
  const directory = await mkdtemp(join(tmpdir(), "sal-coverage-"));
  if (dirname(resolve(directory)) !== resolve(tmpdir())) {
    throw new Error("Refusing a fixture outside the temporary directory.");
  }
  const config = await Bun.file("bunfig.coverage.toml").text();
  const module = `
    export function used(): string { return "used"; }
    export function unused(): string { return "unused"; }
  `;
  const testSource = `
    import { expect, it } from "bun:test";
    import { used, unused } from "./module.ts";
    it("covers the selected function", () => { expect(used()).toBe("used"); });
  `;
  try {
    await Promise.all([
      Bun.write(join(directory, "bunfig.toml"), config),
      Bun.write(join(directory, "module.ts"), module),
      Bun.write(join(directory, "fixture.test.ts"), testSource),
    ]);
    const failing = Bun.spawn([process.execPath, "test", "./fixture.test.ts"], {
      cwd: directory,
      stdout: "pipe",
      stderr: "pipe",
    });
    const [failureCode, output, errors] = await Promise.all([
      failing.exited,
      new Response(failing.stdout).text(),
      new Response(failing.stderr).text(),
    ]);
    expect(failureCode, output + errors).not.toBe(0);
    expect(output + errors).toContain("50.00");
    expect(output + errors).toContain("1 pass");
    await Bun.write(
      join(directory, "fixture.test.ts"),
      testSource +
        'it("covers the remaining function", () => { expect(unused()).toBe("unused"); });',
    );
    const passing = Bun.spawn([process.execPath, "test", "./fixture.test.ts"], {
      cwd: directory,
      stdout: "pipe",
      stderr: "pipe",
    });
    const [passCode, passOutput, passErrors] = await Promise.all([
      passing.exited,
      new Response(passing.stdout).text(),
      new Response(passing.stderr).text(),
    ]);
    expect(passCode, passOutput + passErrors).toBe(0);
    expect(passOutput + passErrors).toContain("100.00");
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});

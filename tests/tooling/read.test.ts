import { expect, it } from "bun:test";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { readFiles } from "../../scripts/read.ts";

it("reads literal file paths and preserves line numbers for a selected range", async () => {
  const path = join(tmpdir(), `sal-read-${crypto.randomUUID()}.txt`);
  const file = Bun.file(path);
  try {
    await Bun.write(file, "first\nsecond\nthird");
    expect(await readFiles([path])).toBe(`${path}\n1: first\n2: second\n3: third\n`);
    expect(await readFiles([path, "--lines=2:2"])).toBe(`${path}\n2: second\n`);
    expect(await readFiles([path, "--lines=9:12"])).toBe(`${path}\n\n`);
  } finally {
    await file.delete();
  }
});

it.each([
  [],
  ["AGENTS.md", "--lines=0:2"],
  ["AGENTS.md", "--lines=3:2"],
  ["AGENTS.md", "--lines=1.5:2"],
  ["AGENTS.md", "--lines=1:2", "--lines=3:4"],
])("rejects missing paths and invalid ranges", async (...arguments_) => {
  await expect(readFiles(arguments_)).rejects.toThrow();
});

it("reports a missing file instead of returning an empty result", async () => {
  await expect(readFiles([`sal-missing-${crypto.randomUUID()}.txt`])).rejects.toThrow();
});

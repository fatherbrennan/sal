import { expect, it } from "bun:test";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { compile } from "svelte/compiler";

async function biome(task: string, source: string, arguments_: string[] = []) {
  const child = Bun.spawn(["bun", "run", task, ...arguments_], {
    stdin: new TextEncoder().encode(source),
    stdout: "pipe",
    stderr: "pipe",
  });
  const [code, stdout, stderr] = await Promise.all([
    child.exited,
    new Response(child.stdout).text(),
    new Response(child.stderr).text(),
  ]);
  return { code, stdout, stderr };
}

it("formats Svelte TypeScript, runes, snippets, events, templates and CSS without losing syntax", async () => {
  const source = `<script lang="ts">let count: number=$state(0);const names:string[]=["A","B"];function increase():void{count+=1;}</script>
{#snippet label(name:string)}<strong>{name}</strong>{/snippet}
<button type="button" onclick={increase}>Count: {count}</button>
{#if count>0}<p>Changed</p>{:else}<p>Initial</p>{/if}
{#each names as name (name)}<p>{@render label(name)}</p>{/each}
<style>button{color: #111;background-color:#fff;}</style>`;
  const first = await biome("format:stdin", source);
  expect(first.code, first.stderr).toBe(0);
  expect(first.stdout).toContain("let count: number = $state(0);");
  expect(first.stdout).toContain("onclick={increase}");
  expect(first.stdout).not.toContain("\r");
  expect(() => compile(first.stdout, { filename: "compatibility.svelte" })).not.toThrow();
  const second = await biome("format:stdin", first.stdout);
  expect(second.code, second.stderr).toBe(0);
  expect(second.stdout).toBe(first.stdout);
});

it("rejects both TypeScript and accessibility defects inside a Svelte component", async () => {
  const path = join(tmpdir(), `sal-biome-${crypto.randomUUID()}.svelte`);
  const file = Bun.file(path);
  try {
    await Bun.write(
      file,
      `<script lang="ts">export let value: any;</script><img src="image.png"><p>{value}</p>`,
    );
    const result = await biome("lint:fixture", "", [path]);
    expect(result.code).not.toBe(0);
    expect(result.stdout + result.stderr).toContain("noExplicitAny");
    expect(result.stdout + result.stderr).toContain("useAltText");
  } finally {
    await file.delete();
  }
});

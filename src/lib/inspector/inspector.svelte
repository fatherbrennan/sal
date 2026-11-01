<script lang="ts">
import AngleDoubleLeft from "@primeicons/svelte/angle-double-left";
import { tick } from "svelte";
import Hint from "./hint.svelte";
import { type Inspection, nodeAt } from "./model.ts";
import NodeDetail from "./node-detail.svelte";
import Search from "./search.svelte";
import type { InspectorNode } from "./types.ts";
import { currentLocation } from "./types.ts";

let {
  model,
  initial = "headline",
  root = "headline",
  onselect,
}: {
  model: Inspection;
  initial?: string;
  root?: string;
  onselect?: (node: InspectorNode) => Promise<void>;
} = $props();
let visits = $state<{ id: string; scroll: number }[]>([]);
const cursor = $derived(visits.length - 1);
let body: HTMLDivElement | undefined = $state();
let trail: HTMLElement | undefined = $state();
const current = $derived(nodeAt(model, visits[cursor]?.id ?? root));
const parentId = $derived(visits[cursor - 1]?.id);
const parent = $derived.by(() => {
  if (parentId !== undefined) {
    return nodeAt(model, parentId);
  }
  return null;
});

function remember(): void {
  const currentVisit = visits[cursor];
  if (currentVisit) {
    currentVisit.scroll = body?.scrollTop ?? 0;
  }
}
async function focus(scroll: number, returning = false): Promise<void> {
  await tick();
  const step = trail?.querySelector<HTMLElement>('[aria-current="location"]');
  step?.scrollIntoView({
    block: "nearest",
    inline: "nearest",
  });
  if (returning) {
    step?.focus({ preventScroll: true });
  } else {
    body?.querySelector<HTMLElement>("[data-node-heading]")?.focus({ preventScroll: true });
  }
  if (body) {
    body.scrollTop = scroll;
  }
}
async function revisit(index: number): Promise<void> {
  remember();
  visits = visits.slice(0, index + 1);
  await onselect?.(nodeAt(model, visits[index]?.id ?? root));
  await focus(visits[index]?.scroll ?? 0, true);
}
async function select(id: string): Promise<void> {
  const existing = visits.findIndex((visit) => visit.id === id);
  if (existing >= 0) {
    await revisit(existing);
    return;
  }
  remember();
  visits = [...visits, { id, scroll: 0 }];
  await onselect?.(nodeAt(model, id));
  await focus(0);
}
$effect(() => {
  visits = [{ id: root, scroll: 0 }];
  if (initial !== root) {
    visits = [
      { id: root, scroll: 0 },
      { id: initial, scroll: 0 },
    ];
  }
});
export async function back(): Promise<void> {
  if (cursor > 0) {
    await revisit(cursor - 1);
  }
}
</script>

<div class="inspector" data-calculator-context={model.offer}>
  <div class="navigation">
    <div class="context">
      {model.offer}
      <span
        >{#if model.year}
          {model.year}
        {/if}
      </span>
    </div>
    <div class="history">
      <Hint
        icon={AngleDoubleLeft}
        label="Back one step"
        text="Back one step"
        disabled={cursor === 0}
        onactivate={back}
      />
      <nav aria-label="Exploration trail" bind:this={trail}>
        <ol>
          {#each visits as visit, index (`${visit.id}-${index}`)}
            <li>
              <button
                class="trail-step"
                type="button"
                aria-current={currentLocation(index === cursor)}
                onclick={() => revisit(index)}
              >
                <code>{nodeAt(model, visit.id).symbol}</code>
              </button>
              {#if index < visits.length - 1}
                <span aria-hidden="true">/</span>
              {/if}
            </li>
          {/each}
        </ol>
      </nav>
    </div>
    <Search nodes={model.nodes} selected={current.id} onselect={select} />
  </div>
  <div class="body" bind:this={body}>
    {#key current.id}
      <NodeDetail {model} node={current} {parent} scenario={model.scenario} onselect={select} />
    {/key}
  </div>
</div>

<style>
.inspector {
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: 0;
  font-size: var(--text-small);
  line-height: var(--leading-compact);
}
.navigation {
  flex: none;
  border-bottom: 1px solid var(--divider);
  padding: 0.4rem 0.65rem;
  background: var(--panel);
  position: relative;
}
.context {
  font-weight: var(--weight-medium);
  font-size: var(--text-small);
}
.context span {
  display: block;
  font-weight: var(--weight-regular);
  color: var(--muted);
}
.history {
  display: flex;
  gap: 0.5rem;
  align-items: center;
  margin-top: 0.4rem;
}
nav {
  min-width: 0;
}
ol {
  display: flex;
  list-style: none;
  gap: 0.35rem;
  padding: 0.2rem;
  margin: 0;
  overflow-x: auto;
}
li {
  display: flex;
  align-items: center;
  gap: 0.35rem;
  flex: none;
}
.trail-step {
  border: 0;
  text-decoration: underline;
  color: var(--accent);
  min-height: 1.75rem;
  padding: 0.1rem 0.3rem;
  font-size: var(--text-variable);
}
.trail-step[aria-current="location"] {
  background: var(--accent);
  color: var(--panel);
  text-decoration: none;
}
.body {
  flex: 1;
  min-height: 0;
  overflow: auto;
  overscroll-behavior: contain;
  padding: 0.65rem;
  overflow-y: scroll;
}
code {
  font-size: inherit;
  overflow-wrap: anywhere;
}
</style>

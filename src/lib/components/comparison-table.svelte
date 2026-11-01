<script lang="ts">
import CaretLeftIcon from "@primeicons/svelte/caret-left";
import CaretRightIcon from "@primeicons/svelte/caret-right";
import { type Snippet, untrack } from "svelte";
import { controlShortcuts } from "../control-shortcuts.ts";
import Hint from "../inspector/hint.svelte";

let {
  offerCount,
  headings,
  actions,
  children,
}: { offerCount: number; headings: Snippet; actions: Snippet; children: Snippet } = $props();
let scroller: HTMLElement | undefined = $state();
let headingScroller: HTMLDivElement | undefined = $state();
let scrollbar: HTMLDivElement | undefined = $state();
let scrollLeft = $state(0);
let scrollWidth = $state(0);
let viewportWidth = $state(0);
let toolbarHeight = $state(0);
let toolbar: HTMLDivElement | undefined = $state();
let firstVisible = $state(1);
let lastVisible = $state(1);
let moreLeft = $derived(scrollLeft > 1);
let maximum = $derived(Math.max(0, scrollWidth - viewportWidth));
let moreRight = $derived(scrollLeft < maximum - 1);
const id = $props.id();
const shortcuts = controlShortcuts();
const arrowStep = 40;
// Firefox can quantise paired scroll areas differently; ignore subpixel feedback.
const scrollTolerance = 1;

$effect(() => {
  const table = scroller?.querySelector("table");
  let frame: number | undefined;
  const observer = new ResizeObserver(() => {
    if (frame === undefined) {
      frame = requestAnimationFrame(() => {
        frame = undefined;
        updateScroll();
        toolbarHeight = toolbar?.clientHeight ?? 0;
      });
    }
  });
  if (scroller && table && offerCount > 0) {
    observer.observe(scroller);
    observer.observe(table);
    if (toolbar) {
      observer.observe(toolbar);
    }
    untrack(updateScroll);
  }
  return () => {
    observer.disconnect();
    if (frame !== undefined) {
      cancelAnimationFrame(frame);
    }
  };
});
$effect(() => {
  for (const element of [scroller, headingScroller, scrollbar]) {
    if (element && Math.abs(element.scrollLeft - scrollLeft) > scrollTolerance) {
      element.scrollLeft = scrollLeft;
    }
  }
});
function updateScroll(): void {
  const tableHead = scroller?.querySelector("thead");
  if (scroller && tableHead) {
    ({ scrollLeft, scrollWidth, clientWidth: viewportWidth } = scroller);
    const cells = [...tableHead.querySelectorAll("th")];
    const left = cells[0]?.getBoundingClientRect().right ?? 0;
    const { right } = scroller.getBoundingClientRect();
    const visible = cells.slice(1).flatMap((cell, index) => {
      const box = cell.getBoundingClientRect();
      if (box.right > left + 1 && box.left < right - 1) {
        return [index + 1];
      }
      return [];
    });
    firstVisible = visible[0] ?? 1;
    lastVisible = visible.at(-1) ?? firstVisible;
  }
}
function scrollFromBar(): void {
  if (scrollbar && Math.abs(scrollbar.scrollLeft - scrollLeft) > scrollTolerance) {
    ({ scrollLeft } = scrollbar);
  }
}
function scrollTable(direction: number): void {
  if (scroller) {
    const labelWidth = scroller.querySelector("th")?.clientWidth ?? 0;
    scroller.scrollBy({ left: direction * (scroller.clientWidth - labelWidth), behavior: "auto" });
  }
}
function keyScroll(event: KeyboardEvent): void {
  if (event.target !== event.currentTarget || maximum <= scrollTolerance) {
    return;
  }
  let left = scrollLeft;
  switch (
    shortcuts.match(event, [
      "shortcutScrollFirst",
      "shortcutScrollLast",
      "shortcutScrollLeft",
      "shortcutScrollRight",
    ])
  ) {
    case "shortcutScrollFirst":
      left = 0;
      break;
    case "shortcutScrollLast":
      left = maximum;
      break;
    case "shortcutScrollLeft":
      left -= arrowStep;
      break;
    case "shortcutScrollRight":
      left += arrowStep;
      break;
    default:
      return;
  }
  event.preventDefault();
  scroller?.scrollTo({ left, behavior: "auto" });
}
</script>

<div
  class="comparison-table"
  style:--offer-count={offerCount}
  style:--toolbar-height={`${toolbarHeight}px`}
>
  <div class="table-header">
    <div class="detail-actions" bind:this={toolbar}>{@render actions()}</div>
    <div class="sticky-heading" aria-hidden="true" bind:this={headingScroller}>
      {@render headings()}
    </div>
  </div>
  <div class="table-frame" class:more-right={moreRight}>
    <section
      id={`${id}-table`}
      class="table-scroll"
      aria-label="Salary comparison"
      bind:this={scroller}
      onscroll={updateScroll}
    >
      {@render children()}
    </section>
  </div>
  <section class="scroll-navigation" aria-label="Comparison horizontal navigation">
    <div class="scroll-controls">
      <span id={`${id}-position`} class="scroll-position">
        {#if moreLeft || moreRight}
          Offers {firstVisible}–{lastVisible}
          of {offerCount} in view ·
          {#if moreRight}
            More to the right
          {:else}
            End of offers
          {/if}
        {:else}
          All {offerCount} offers visible
        {/if}
      </span>
      <div class="scroll-buttons">
        <Hint
          icon={CaretLeftIcon}
          label="Scroll comparison left"
          text="Scroll comparison left"
          disabled={!moreLeft}
          onactivate={() => scrollTable(-1)}
        />
        <Hint
          icon={CaretRightIcon}
          label="Scroll comparison right"
          text="Scroll comparison right"
          disabled={!moreRight}
          onactivate={() => scrollTable(1)}
        />
      </div>
    </div>
    <div
      class="scrollbar"
      hidden={maximum <= scrollTolerance}
      role="scrollbar"
      aria-label="Scroll comparison horizontally"
      aria-describedby={`${id}-position`}
      aria-controls={`${id}-table`}
      aria-orientation="horizontal"
      aria-valuemin="0"
      aria-valuemax={maximum}
      aria-valuenow={scrollLeft}
      tabindex="0"
      bind:this={scrollbar}
      onkeydown={keyScroll}
      onscroll={scrollFromBar}
    >
      <div></div>
    </div>
  </section>
</div>

<style>
.comparison-table {
  --metric-width: 21rem;
  --offer-width: 18rem;
  isolation: isolate;
  display: grid;
  grid-template-columns: minmax(0, 1fr);
}
.table-header {
  grid-area: 1 / 1;
  align-self: start;
  position: sticky;
  top: var(--app-header-height);
  z-index: 6;
}
.detail-actions {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  min-height: 3.25rem;
  flex-wrap: wrap;
  padding-block: 0.3rem;
  padding-inline: 0.75rem;
  background: var(--panel);
}
.sticky-heading {
  overflow: hidden;
}
.table-frame {
  grid-area: 1 / 1;
  padding-top: var(--toolbar-height);
  min-width: 0;
  position: relative;
}
.more-right::after {
  content: "";
  position: absolute;
  inset: 0 0 0 auto;
  width: 0.6rem;
  background: linear-gradient(to left, var(--line), transparent);
  pointer-events: none;
  z-index: 5;
}
.scroll-navigation {
  position: sticky;
  bottom: 0;
  z-index: 7;
  background: var(--panel);
  border-block: 1px solid var(--divider);
  padding: 0.35rem 0;
}
.scroll-controls,
.scroll-buttons {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}
.scroll-controls {
  justify-content: space-between;
  padding-inline: 0.75rem;
}
.scroll-position {
  color: var(--muted);
  font-size: var(--text-small);
}
.scrollbar {
  overflow-x: scroll;
  min-height: 1.5rem;
  background: var(--soft);
}
.scrollbar::-webkit-scrollbar {
  height: 1rem;
}
.scrollbar::-webkit-scrollbar-track {
  background: var(--soft);
}
.scrollbar::-webkit-scrollbar-thumb {
  background: var(--line);
  border: 2px solid var(--soft);
}
@supports (scrollbar-color: auto) {
  .scrollbar {
    scrollbar-color: var(--line) var(--soft);
  }
}
.scrollbar div {
  width: max(100%, calc(var(--metric-width) + var(--offer-count) * var(--offer-width)));
  height: 1px;
}
@media (width <= 48rem) {
  .comparison-table {
    --metric-width: 11rem;
    --offer-width: 13rem;
  }
}
@media (width <= 28rem) {
  .comparison-table {
    --metric-width: 9rem;
    --offer-width: 10.5rem;
  }
  .detail-actions {
    gap: 0.25rem;
    padding-inline: 0;
  }
}
.table-scroll {
  overflow-x: auto;
  max-width: 100%;
  scroll-padding-inline-start: var(--metric-width);
  overscroll-behavior: none;
  -webkit-overflow-scrolling: touch;
}
@supports (scrollbar-width: none) {
  .table-scroll {
    scrollbar-width: none;
  }
}
</style>

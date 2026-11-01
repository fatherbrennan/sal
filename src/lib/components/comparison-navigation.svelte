<script lang="ts">
import AngleDoubleDown from "@primeicons/svelte/angle-double-down";
import AngleDoubleUp from "@primeicons/svelte/angle-double-up";
import { comparisonLabel } from "../comparison-presentation.ts";
import Hint from "../inspector/hint.svelte";
import Combobox from "./combobox.svelte";

let {
  groups,
  labels = {},
  employment,
  baseline,
  expanded = $bindable(),
  onjump,
}: {
  groups: { title: string; labels: string[] }[];
  labels?: Record<string, string>;
  employment: string;
  baseline: string;
  expanded: string[];
  onjump: (label: string) => Promise<void>;
} = $props();
const id = $props.id();
</script>

<div class="metric-search">
  <Combobox
    inputId={id}
    label="Find metric or section"
    placeholder="Find metric or section…"
    options={groups.flatMap((group) => [
      { id: group.title, label: group.title },
      ...group.labels.map((label) => ({
        id: label,
        label: labels[label] ?? comparisonLabel(label, employment),
      })),
    ])}
    selected=""
    onselect={onjump}
  />
</div>
<span class="baseline-context" title={`Baseline: ${baseline}`}>Baseline: {baseline}</span>
<Hint
  icon={AngleDoubleDown}
  label="Expand all details"
  text="Expand all details"
  onactivate={() => {
    expanded = groups.map((group) => group.title);
  }}
/>
<Hint
  icon={AngleDoubleUp}
  label="Collapse details"
  text="Collapse details"
  onactivate={() => {
    expanded = [];
  }}
/>

<style>
.metric-search {
  --combobox-spacing: 0;
  width: min(18rem, 45%);
  min-width: 8rem;
}
.baseline-context {
  margin-right: auto;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: var(--text-small);
}
@media (width <= 28rem) {
  .metric-search {
    flex: 1;
  }
  .baseline-context {
    flex-basis: 100%;
    order: 4;
    white-space: normal;
  }
}
</style>

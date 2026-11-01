<script lang="ts">
import { metricHints } from "../comparison-hints.ts";
import { componentSigns } from "../comparison-labels.ts";
import { comparisonLabel } from "../comparison-presentation.ts";
import Hint from "../inspector/hint.svelte";

let { label, employment }: { label: string; employment: string } = $props();
</script>

<span aria-hidden="true">{componentSigns[label] ?? ""}</span>
<Hint
  label={comparisonLabel(label, employment)}
  text={metricHints[label] ?? comparisonLabel(label, employment)}
/>

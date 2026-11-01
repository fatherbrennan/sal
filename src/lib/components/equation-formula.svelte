<script lang="ts">
import { formattedFormulaTokens, formulaParts } from "../explanations/presentation.ts";

let {
  formula,
  contextPath = "",
  prefix = "",
  canExplain,
  onvariable,
}: {
  formula: string;
  contextPath?: string;
  prefix?: string;
  canExplain?: (scope: string, name: string) => boolean;
  onvariable?: (scope: string, name: string, trigger: HTMLButtonElement) => void;
} = $props();
</script>

{#each formulaParts(formula) as part, index (index)}
  {#if part.kind === "formula"}
    <pre
    ><code>{#each formattedFormulaTokens(part.text) as token, tokenIndex (tokenIndex)}{#if token.kind === "variable" && canExplain?.(contextPath, token.text)}<button id={`${prefix}-${index}-${tokenIndex}`} class="variable" type="button" aria-label={`Explain ${token.text}`} onclick={(event) => onvariable?.(contextPath, token.text, event.currentTarget)}>{token.text}</button>{:else}<span class={token.kind} data-calculator-value={(token.kind === "value" && Number.isFinite(Number(token.text)) && token.text) || ""} data-calculator-label="literal">{token.text}</span>{/if}{/each}</code></pre>
  {:else}
    <p>{part.text}</p>
  {/if}
{/each}

<style>
pre {
  white-space: pre-wrap;
  overflow-wrap: anywhere;
  margin-block: 0.5rem;
  padding: 0.65rem;
  background: var(--soft);
  font-size: var(--text-body);
  line-height: var(--leading-formula);
}
.variable {
  color: var(--accent);
}
button {
  padding: 0;
  min-height: 1.5rem;
  border: 0;
  background: transparent;
  font: inherit;
  text-decoration: underline dotted;
  text-underline-offset: 0.2em;
  overflow-wrap: anywhere;
  text-align: left;
}
.value {
  color: var(--equation-value);
  font-weight: var(--weight-strong);
}
.operator {
  color: var(--text);
}
.comment,
p {
  color: var(--muted);
}
p {
  white-space: pre-line;
  margin-block: 0.5rem;
}
</style>

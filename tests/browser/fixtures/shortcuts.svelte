<script lang="ts">
import ChoiceInput from "../../../src/lib/components/choice-input.svelte";
import Combobox from "../../../src/lib/components/combobox.svelte";
import Hint from "../../../src/lib/inspector/hint.svelte";

let count = $state(0);
let checked = $state(false);
let radio = $state("A");
let other = $state(true);
let disabled = $state(false);
let selected = $state("");
let multiple = $state<readonly string[]>([]);
const options = ["Alpha", "Beta", "Gamma"].map((label) => ({ id: label, label }));
</script>

<section aria-label="Shortcut control audit">
  <button
    type="button"
    onclick={() => {
      count += 1;
    }}
  >
    Audit button
  </button>
  <button
    type="button"
    disabled
    onclick={() => {
      count += 1;
    }}
  >
    Disabled audit button
  </button>
  <output aria-label="Audit activations">{count}</output>
  <details>
    <summary>Audit disclosure</summary>
    <p>Audit details</p>
  </details>
  <ChoiceInput
    type="checkbox"
    label="Audit checkbox"
    {checked}
    onchange={(value) => {
      checked = value;
    }}
  />
  {#each ["A", "B", "C"] as name (name)}
    <ChoiceInput
      type="radio"
      name="audit-radio"
      label={`Audit radio ${name}`}
      checked={radio === name}
      disabled={name === "B"}
      onchange={() => {
        radio = name;
      }}
    />
  {/each}
  <ChoiceInput
    type="radio"
    name="audit-other"
    label="Other radio group"
    checked={other}
    onchange={(value) => {
      other = value;
    }}
  />
  <a href="#audit-link-destination">Audit link</a>
  <h2 id="audit-link-destination" tabindex="-1">Audit link destination</h2>
  <ChoiceInput
    type="checkbox"
    label="Disable audit combobox"
    checked={disabled}
    onchange={(value) => {
      disabled = value;
    }}
  />
  <Combobox
    label="Audit single selection"
    placeholder="Search"
    {options}
    {selected}
    {disabled}
    displaySelection
    onselect={(value) => {
      selected = value;
    }}
  />
  <output aria-label="Audit selection">{selected}</output>
  <Combobox
    label="Audit multiple selection"
    placeholder="Search"
    {options}
    multiple
    selected={multiple}
    onselect={(value) => {
      multiple = value;
    }}
  />
  <Hint label="Audit hint" text="Audit tooltip" />
</section>

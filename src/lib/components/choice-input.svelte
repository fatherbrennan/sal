<script lang="ts">
let {
  type,
  label,
  name,
  checked,
  disabled = false,
  onchange,
}: {
  type: "checkbox" | "radio";
  label: string;
  name?: string;
  checked: boolean;
  disabled?: boolean;
  onchange: (checked: boolean) => void;
} = $props();
</script>

<label class="choice">
  <input
    {type}
    {name}
    {checked}
    {disabled}
    onchange={(event) => onchange(event.currentTarget.checked)}
  >
  <span>{label}</span>
</label>

<style>
.choice {
  display: grid;
  grid-template-columns: 1rem minmax(0, 1fr);
  align-items: start;
  gap: 0.5rem;
  min-height: 24px;
  padding-block: 0.1rem;
  overflow-wrap: anywhere;
  cursor: pointer;
}
input {
  margin-top: 0.25rem;
}
</style>

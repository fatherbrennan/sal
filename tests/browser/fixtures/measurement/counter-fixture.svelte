<script lang="ts">
import { describeFailure, writeValue } from "./storage.ts";

const { database }: { database: IDBDatabase } = $props();
let count = $state(0);
let status = $state("ready");

function increment(): void {
  count += 1;
}

function save(): void {
  writeValue(database, "readwrite");
  status = "queued";
}

function rejectWrite(): void {
  try {
    writeValue(database, "readonly");
  } catch (error) {
    status = describeFailure(error);
  }
}
</script>

<section aria-label="Coverage fixture">
  <button type="button" onclick={increment}>Increment</button>
  <button type="button" onclick={save}>Queue write</button>
  <button type="button" onclick={rejectWrite}>Reject write</button>
  <p>Count: {count}</p>
  <p>Status: {status}</p>
</section>

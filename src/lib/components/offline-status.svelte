<script lang="ts">
import ChevronRightIcon from "@primeicons/svelte/chevron-right";
import { onMount } from "svelte";
import { dev } from "$app/env";

let { safeToReload, storage }: { safeToReload: boolean; storage: string } = $props();
let statusOpen = $state(false);
let status = $state("Offline readiness has not yet been confirmed.");
let registration = $state<ServiceWorkerRegistration | null>(null);
let waiting = $state<ServiceWorker | null>(null);
let reloadRequested = false;
function reload(): void {
  if (
    !safeToReload ||
    [...document.querySelectorAll("[aria-invalid]")].some(
      (element) => element.getAttribute("aria-invalid") === "true",
    )
  ) {
    status = "Finish saving and correct invalid fields before reloading.";
    statusOpen = true;
    return;
  }
  if (waiting !== null) {
    reloadRequested = true;
    waiting.postMessage("activate-sal-update");
  }
}
async function connect(): Promise<void> {
  if (dev) {
    status = "Development mode · offline caching is disabled.";
    return;
  }
  if (!("serviceWorker" in navigator)) {
    status = "This browser does not support offline caching.";
    return;
  }
  registration = await navigator.serviceWorker.ready;
  status = "Offline assets ready. This app can reopen without internet.";
  ({ waiting } = registration);
  registration.onupdatefound = () => {
    const worker = registration?.installing;
    if (worker) {
      worker.onstatechange = () => {
        if (worker.state === "installed") {
          waiting = registration?.waiting ?? null;
        }
      };
    }
  };
}
async function checkUpdate(): Promise<void> {
  if (!navigator.onLine) {
    status = "Cannot check for an update while offline. The installed app remains available.";
    return;
  }
  try {
    await registration?.update();
  } catch {
    status = "Cannot check for an update while offline. The installed app remains available.";
  }
}
onMount(() => {
  connect();
  const changed = (): void => {
    if (reloadRequested) {
      globalThis.location.reload();
    }
  };
  navigator.serviceWorker?.addEventListener("controllerchange", changed);
  return () => {
    navigator.serviceWorker?.removeEventListener("controllerchange", changed);
    if (registration !== null) {
      registration.onupdatefound = null;
    }
  };
});
</script>

<details class="offline" bind:open={statusOpen}>
  <summary>
    <span class="icon" aria-hidden="true">
      <ChevronRightIcon />
    </span>
    <span>App status</span>
    <span class="mode">
      {#if dev}
        Development
      {:else if registration}
        Offline ready
      {:else}
        Offline status
      {/if}
    </span>
  </summary>
  <p>{status}</p>
  {#if storage}
    <p>{storage}</p>
  {/if}
  {#if registration}
    <button type="button" onclick={checkUpdate}>Check for app update</button>
  {/if}
</details>
{#if waiting}
  <div class="update" role="status">
    <p>A new version is ready. Calculations will use its current rules after reload.</p>
    <button type="button" onclick={reload}>Reload saved app to update</button>
  </div>
{/if}

<style>
.offline {
  border: 0;
  padding: 0;
  margin: 0;
}
.offline[open],
.update {
  flex-basis: 100%;
}
summary {
  width: fit-content;
  max-width: 100%;
  justify-content: center;
  padding: 0.15rem 0.4rem;
}
summary::before {
  display: none;
}
.icon {
  transform: none;
}
.offline[open] .icon {
  transform: rotate(90deg);
}
.mode {
  font-weight: var(--weight-regular);
}
.mode::before {
  content: "· ";
}
p {
  margin: 0.5rem 0;
}
</style>

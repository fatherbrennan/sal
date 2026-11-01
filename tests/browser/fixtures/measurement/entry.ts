import { mount } from "svelte";
import Counter from "./counter-fixture.svelte";

const request = indexedDB.open("sal-coverage-fixture", 1);
request.onupgradeneeded = () => request.result.createObjectStore("entries");
request.onsuccess = () => {
  mount(Counter, { target: document.body, props: { database: request.result } });
};
request.onerror = () => {
  throw request.error;
};

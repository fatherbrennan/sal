import { mount } from "svelte";
import Controls from "./shortcuts.svelte";

const target = document.createElement("div");
document.body.append(target);
mount(Controls, { target });

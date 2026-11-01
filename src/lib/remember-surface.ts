import type { SurfaceState } from "./ui-state.ts";

interface Options {
  key: string;
  saved: SurfaceState | undefined;
  onchange: (key: string, state: SurfaceState) => void;
}
function controls(node: HTMLElement): HTMLElement[] {
  return [...node.querySelectorAll<HTMLElement>("[data-disclosure]")];
}
function isOpen(element: HTMLElement): boolean {
  if (element instanceof HTMLDetailsElement) {
    return element.open;
  }
  return element.ariaExpanded === "true";
}
function restoreControls(node: HTMLElement, saved: SurfaceState | undefined): void {
  for (const element of controls(node)) {
    const { disclosure = "" } = element.dataset;
    const open = saved?.disclosures[disclosure];
    if (
      open !== undefined &&
      open !== isOpen(element) &&
      !element.contains(document.activeElement)
    ) {
      if (element instanceof HTMLDetailsElement) {
        element.open = open;
        element.dispatchEvent(new Event("toggle"));
      } else if (element instanceof HTMLButtonElement) {
        element.click();
      }
    }
  }
}

function inspectorTriggers(node: HTMLElement, label: string): HTMLButtonElement[] {
  return [
    ...node.querySelectorAll<HTMLButtonElement>(".comparison-content .equation-trigger"),
  ].filter((element) => element.ariaLabel === label);
}

function inspectorState(node: HTMLElement): SurfaceState["inspector"] {
  const trigger = node.querySelector<HTMLButtonElement>("[data-inspector-root]");
  const label = trigger?.ariaLabel;
  if (!(trigger && label && node.querySelector(".inspection-workspace dialog[open]"))) {
    return null;
  }
  return { label, index: inspectorTriggers(node, label).indexOf(trigger) };
}

function restoreInspector(node: HTMLElement, saved: SurfaceState | undefined): void {
  if (saved?.inspector) {
    const { label, index } = saved.inspector;
    inspectorTriggers(node, label)[index]?.click();
  }
}

function rememberSurface(node: HTMLElement, initial: Options) {
  let options = initial;
  let frame = 0;
  let restoring = true;
  function capture(): void {
    if (restoring || !options.key) {
      return;
    }
    options.onchange(options.key, {
      disclosures: Object.fromEntries(
        controls(node).map((element) => {
          const { disclosure = "" } = element.dataset;
          return [disclosure, isOpen(element)];
        }),
      ),
      top: window.scrollY,
      left: node.querySelector(".table-scroll")?.scrollLeft ?? 0,
      inspector: inspectorState(node),
    });
  }
  function restore(): void {
    restoring = true;
    cancelAnimationFrame(frame);
    frame = requestAnimationFrame(() => {
      const { saved } = options;
      restoreControls(node, saved);
      frame = requestAnimationFrame(() => {
        if (!document.activeElement?.closest("[data-input-key]")) {
          window.scrollTo({ top: saved?.top ?? 0, behavior: "instant" });
        }
        node
          .querySelector(".table-scroll")
          ?.scrollTo({ left: saved?.left ?? 0, behavior: "instant" });
        restoreInspector(node, saved);
        frame = requestAnimationFrame(() => {
          restoring = false;
        });
      });
    });
  }
  const observer = new MutationObserver(capture);
  observer.observe(node, {
    subtree: true,
    attributes: true,
    attributeFilter: ["open", "aria-expanded", "data-inspector-root"],
  });
  window.addEventListener("scroll", capture, { passive: true });
  node.addEventListener("scroll", capture, { capture: true, passive: true });
  restore();
  return {
    update(next: Options): void {
      const changed = next.key !== options.key;
      options = next;
      if (changed) {
        restore();
      }
    },
    destroy(): void {
      cancelAnimationFrame(frame);
      observer.disconnect();
      window.removeEventListener("scroll", capture);
      node.removeEventListener("scroll", capture, true);
    },
  };
}

export { rememberSurface };

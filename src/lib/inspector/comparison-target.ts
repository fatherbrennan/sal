function inspectionValue(element: HTMLElement, symbol?: string): HTMLElement {
  let selector = "[data-inspector-value]";
  if (symbol) {
    selector = `[data-inspector-value="${CSS.escape(symbol)}"]`;
  }
  return (
    element.querySelector<HTMLElement>(selector) ??
    element.querySelector<HTMLElement>(".amount") ??
    element
  );
}

function scrollToReference(trigger: HTMLElement | null, value: HTMLElement | null): void {
  if (!trigger?.isConnected) {
    return;
  }
  const reference = value ?? trigger;
  reference.scrollIntoView({ block: "center", inline: "nearest", behavior: "instant" });
  const scroller = trigger.closest(".table-scroll");
  const row = trigger.closest("tr");
  if (scroller && row) {
    const left = row.querySelector("th")?.getBoundingClientRect().right ?? 0;
    const target = reference.getBoundingClientRect();
    if (target.left < left) {
      scroller.scrollLeft -= left - target.left;
    }
  }
}

export { inspectionValue, scrollToReference };

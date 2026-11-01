import {
  type CalculatorPosition,
  type CalculatorState,
  calculatorPositions,
} from "./calculator-position.ts";

const margin = 12;
const previewGap = 8;
const dragThreshold = 4;
class CalculatorPlacement {
  private readonly position: () => CalculatorState["position"];
  private readonly onposition: (position: CalculatorState["position"]) => void;
  panelWidth = $state(0);
  panelHeight = $state(0);
  viewportWidth = $state(0);
  viewportHeight = $state(0);
  previewSpace = $state(0);
  dragged = $state(false);
  drag = $state<{
    pointer: number;
    offsetX: number;
    offsetY: number;
    startX: number;
    startY: number;
    x: number;
    y: number;
  } | null>(null);

  constructor(
    position: () => CalculatorState["position"],
    onposition: (position: CalculatorState["position"]) => void,
  ) {
    this.position = position;
    this.onposition = onposition;
  }

  get anchor() {
    return (
      calculatorPositions.find((entry) => entry.id === this.position()) ?? calculatorPositions[7]
    );
  }
  pointFor(position: CalculatorPosition): { x: number; y: number } {
    return {
      x: margin + (this.maxX - margin) * position.x,
      y: margin + (this.maxY - margin) * position.y,
    };
  }
  get target(): CalculatorPosition {
    if (!this.drag) {
      return this.anchor;
    }
    const { x, y } = this.drag;
    const distance = (position: CalculatorPosition): number => {
      const point = this.pointFor(position);
      return Math.hypot(point.x - x, point.y - y);
    };
    return calculatorPositions.reduce((best, candidate) => {
      if (distance(candidate) < distance(best)) {
        return candidate;
      }
      return best;
    });
  }
  get maxX(): number {
    return Math.max(margin, this.viewportWidth - this.panelWidth - margin);
  }
  get maxY(): number {
    return Math.max(margin, this.viewportHeight - this.panelHeight - margin);
  }
  get groupTop(): number {
    return margin + Math.max(0, this.maxY - margin - this.previewSpace) * (this.anchor?.y ?? 1);
  }
  get left(): number {
    return this.drag?.x ?? margin + (this.maxX - margin) * (this.anchor?.x ?? 0);
  }
  get top(): number {
    if (this.drag) {
      return this.drag.y;
    }
    if (this.anchor?.y === 0) {
      return this.groupTop;
    }
    return this.groupTop + this.previewSpace;
  }
  get previewTop(): number {
    if (this.anchor?.y === 0) {
      return this.top + this.panelHeight + previewGap;
    }
    return this.groupTop;
  }
  watchViewport(): () => void {
    const observer = new ResizeObserver(() => {
      this.viewportWidth = document.documentElement.clientWidth;
    });
    observer.observe(document.documentElement);
    return () => observer.disconnect();
  }
  start(event: PointerEvent): void {
    if (event.button !== 0 || !event.isPrimary || !(event.currentTarget instanceof HTMLElement)) {
      return;
    }
    this.dragged = false;
    this.drag = {
      pointer: event.pointerId,
      offsetX: event.clientX - this.left,
      offsetY: event.clientY - this.top,
      startX: event.clientX,
      startY: event.clientY,
      x: this.left,
      y: this.top,
    };
    event.currentTarget.setPointerCapture(event.pointerId);
  }
  move(event: PointerEvent): void {
    if (!this.drag || event.pointerId !== this.drag.pointer) {
      return;
    }
    if (
      Math.hypot(event.clientX - this.drag.startX, event.clientY - this.drag.startY) >=
      dragThreshold
    ) {
      this.dragged = true;
    }
    this.drag = {
      ...this.drag,
      x: Math.min(this.maxX, Math.max(margin, event.clientX - this.drag.offsetX)),
      y: Math.min(this.maxY, Math.max(margin, event.clientY - this.drag.offsetY)),
    };
  }
  finish(event: PointerEvent): void {
    if (!this.drag || event.pointerId !== this.drag.pointer) {
      return;
    }
    if (this.dragged) {
      this.onposition(this.target.id);
    }
    this.cancel();
  }
  cancel = (): void => {
    this.drag = null;
  };
}

export { CalculatorPlacement, previewGap };

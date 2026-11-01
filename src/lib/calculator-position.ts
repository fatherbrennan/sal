const calculatorPositions = [
  { id: "top-left", label: "Top left", x: 0, y: 0, icon: "↖" },
  { id: "top-centre", label: "Top centre", x: 0.5, y: 0, icon: "↑" },
  { id: "top-right", label: "Top right", x: 1, y: 0, icon: "↗" },
  { id: "middle-left", label: "Middle left", x: 0, y: 0.5, icon: "←" },
  { id: "centre", label: "Centre", x: 0.5, y: 0.5, icon: "·" },
  { id: "middle-right", label: "Middle right", x: 1, y: 0.5, icon: "→" },
  { id: "bottom-left", label: "Bottom left", x: 0, y: 1, icon: "↙" },
  { id: "bottom-centre", label: "Bottom centre", x: 0.5, y: 1, icon: "↓" },
  { id: "bottom-right", label: "Bottom right", x: 1, y: 1, icon: "↘" },
] as const;
type CalculatorPosition = (typeof calculatorPositions)[number];

interface CalculatorState {
  visible: boolean;
  position: CalculatorPosition["id"];
}

export type { CalculatorPosition, CalculatorState };
export { calculatorPositions };

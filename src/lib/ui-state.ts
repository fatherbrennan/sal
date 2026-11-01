import { type CalculatorState, calculatorPositions } from "./calculator-position.ts";
import { scenarios } from "./comparison-scenarios.ts";
import type { SalRecord } from "./data/model.d.ts";
import { requireObject } from "./data/validation.ts";

const mainViews = ["offers", "comparisons", "formulas", "profile", "vehicle", "settings"] as const;
type MainView = (typeof mainViews)[number];
const navigationLabels: Record<string, string> = {
  profile: "Personal tax settings",
  settings: "Settings",
};
const recordKinds = new Map<MainView, "offer" | "comparison" | "formula">([
  ["offers", "offer"],
  ["comparisons", "comparison"],
  ["formulas", "formula"],
]);
type SettingsSection = "preferences" | "defaults" | "backups" | "keybindings";
const settingsSections = [
  { id: "preferences", label: "Preferences" },
  { id: "defaults", label: "Offer defaults" },
  { id: "backups", label: "Backups" },
  { id: "keybindings", label: "Keyboard shortcuts" },
] as const;
interface UiState {
  version: 1;
  view: MainView;
  settingsSection: SettingsSection;
  offerId: string;
  comparisonId: string;
  formulaId: string;
  showArchived: boolean;
  scenarios: Record<string, string>;
  surfaces: Record<string, SurfaceState>;
  calculator: CalculatorState;
}
interface SurfaceState {
  disclosures: Record<string, boolean>;
  top: number;
  left: number;
  inspector: { label: string; index: number } | null;
}
function position(raw: unknown): number {
  if (typeof raw === "number" && Number.isFinite(raw) && raw >= 0) {
    return raw;
  }
  return 0;
}

function readSurfaces(raw: unknown): Record<string, SurfaceState> {
  return Object.fromEntries(
    Object.entries(object(raw)).map(([key, entry]) => {
      const { disclosures: saved, top, left, inspector } = object(entry);
      const disclosures = Object.fromEntries(
        Object.entries(object(saved)).flatMap(([name, open]) => {
          if (typeof open === "boolean") {
            return [[name, open]];
          }
          return [];
        }),
      );
      return [
        key,
        {
          disclosures,
          top: position(top),
          left: position(left),
          inspector: readInspector(inspector),
        },
      ];
    }),
  );
}

function readInspector(raw: unknown): SurfaceState["inspector"] {
  const { label, index } = object(raw);
  if (
    typeof label === "string" &&
    label.length > 0 &&
    typeof index === "number" &&
    Number.isSafeInteger(index) &&
    index >= 0
  ) {
    return { label, index };
  }
  return null;
}

function object(value: unknown): Record<string, unknown> {
  try {
    requireObject(value);
    return value;
  } catch {
    return {};
  }
}

function selectedRecord(
  id: unknown,
  kind: "offer" | "comparison" | "formula",
  records: readonly SalRecord[],
  showArchived: boolean,
): string {
  return (
    records.find(
      (record) => record.id === id && record.kind === kind && (showArchived || !record.archived),
    )?.id ?? ""
  );
}

function readUiState(raw: unknown, records: readonly SalRecord[]): UiState {
  let state = object(raw);
  const { version } = state;
  if (version !== 1) {
    state = {};
  }
  const {
    view,
    settingsSection,
    offerId,
    comparisonId,
    formulaId,
    showArchived,
    scenarios: savedScenarios,
    surfaces,
    calculator: savedCalculator,
  } = state;
  const { visible, position: calculatorPosition } = object(savedCalculator);
  const scenarioValues = object(savedScenarios);
  return {
    version: 1,
    view: mainViews.find((entry) => entry === view) ?? "offers",
    settingsSection:
      settingsSections.find((entry) => entry.id === settingsSection)?.id ?? "preferences",
    offerId: selectedRecord(offerId, "offer", records, showArchived === true),
    comparisonId: selectedRecord(comparisonId, "comparison", records, true),
    formulaId: selectedRecord(formulaId, "formula", records, true),
    showArchived: showArchived === true,
    surfaces: readSurfaces(surfaces),
    calculator: {
      visible: visible !== false,
      position:
        calculatorPositions.find((entry) => entry.id === calculatorPosition)?.id ?? "bottom-centre",
    },
    scenarios: Object.fromEntries(
      records
        .filter((record) => record.kind === "comparison")
        .flatMap((record) => {
          const scenario = scenarios.find((entry) => entry.id === scenarioValues[record.id]);
          if (scenario) {
            return [[record.id, scenario.id]];
          }
          return [];
        }),
    ),
  };
}

function surfaceName(view: MainView, settingsSection: SettingsSection, selectedId: string): string {
  if (view === "settings") {
    return `${view}:${settingsSection}`;
  }
  if (recordKinds.has(view)) {
    return `${view}:${selectedId}`;
  }
  return view;
}

export type { MainView, SettingsSection, SurfaceState, UiState };
export {
  mainViews,
  navigationLabels,
  readUiState,
  recordKinds,
  selectedRecord,
  settingsSections,
  surfaceName,
};

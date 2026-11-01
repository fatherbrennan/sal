import { expect, it } from "bun:test";
import { newRecord } from "../../src/lib/data/schema.ts";
import { readUiState, selectedRecord, surfaceName, type UiState } from "../../src/lib/ui-state.ts";

const now = "2026-10-28T00:00:00.000Z";
const offer = newRecord("offer", "offer-a", now);
const archived = { ...offer, id: "archived", archived: true };
const comparison = newRecord("comparison", "compare-a", now);
const records = [offer, archived, comparison];
const defaults: UiState = {
  version: 1,
  view: "offers",
  settingsSection: "preferences",
  offerId: "",
  comparisonId: "",
  formulaId: "",
  showArchived: false,
  scenarios: {},
  surfaces: {},
  calculator: { visible: true, position: "bottom-centre" },
};

it("restores calculator visibility and only the nine supported screen positions", () => {
  const positions = [
    "top-left",
    "top-centre",
    "top-right",
    "middle-left",
    "centre",
    "middle-right",
    "bottom-left",
    "bottom-centre",
    "bottom-right",
  ] as const;
  for (const position of positions) {
    const calculator = { visible: false, position };
    expect(readUiState({ version: 1, calculator }, []).calculator).toEqual(calculator);
  }
  for (const calculator of [null, [], "hidden", { visible: "false", position: "offscreen" }]) {
    expect(readUiState({ version: 1, calculator }, []).calculator).toEqual(defaults.calculator);
  }
  expect(
    readUiState({ version: 1, calculator: { visible: false, position: "invalid" } }, []).calculator,
  ).toEqual({ visible: false, position: "bottom-centre" });
});

it("falls back independently for absent, malformed and unsupported UI state", () => {
  for (const raw of [undefined, null, [], true, "state", {}, { version: 2, view: "vehicle" }]) {
    expect(readUiState(raw, records)).toEqual(defaults);
  }
  expect(
    readUiState(
      {
        version: 1,
        view: "settings",
        settingsSection: "unknown",
        showArchived: "true",
        offerId: "missing",
        comparisonId: "offer-a",
        scenarios: [],
      },
      records,
    ),
  ).toEqual({ ...defaults, view: "settings" });
});

it("restores only supported navigation and existing record-specific scenarios", () => {
  for (const view of ["offers", "comparisons", "formulas", "profile", "vehicle", "settings"]) {
    expect(readUiState({ version: 1, view }, records)).toMatchObject({ view });
  }
  for (const settingsSection of ["preferences", "defaults", "backups", "keybindings"]) {
    expect(readUiState({ version: 1, settingsSection }, records)).toMatchObject({
      settingsSection,
    });
  }
  for (const scenario of ["base", "guaranteed", "target", "guaranteed-once", "target-once"]) {
    expect(
      readUiState(
        {
          version: 1,
          offerId: offer.id,
          comparisonId: comparison.id,
          scenarios: { "compare-a": scenario, "offer-a": "target", missing: "target" },
        },
        records,
      ),
    ).toMatchObject({
      offerId: offer.id,
      comparisonId: comparison.id,
      scenarios: { "compare-a": scenario },
    });
  }
  expect(
    readUiState({ version: 1, scenarios: { "compare-a": "unknown" } }, records).scenarios,
  ).toEqual({});
});

it("restores the selected formula and keeps its surface separate from comparisons", () => {
  const formula = { ...newRecord("formula", "formula-a", now), archived: true };
  expect(
    readUiState({ version: 1, view: "formulas", formulaId: formula.id }, [formula]),
  ).toMatchObject({ view: "formulas", formulaId: formula.id });
  expect(readUiState({ version: 1, formulaId: offer.id }, records).formulaId).toBe("");
  expect(surfaceName("formulas", "preferences", formula.id)).toBe("formulas:formula-a");
  expect(surfaceName("comparisons", "preferences", comparison.id)).toBe("comparisons:compare-a");
  expect(surfaceName("settings", "backups", "")).toBe("settings:backups");
  expect(surfaceName("profile", "backups", "")).toBe("profile");
});

it("restores independent disclosure and position state and rejects malformed values", () => {
  const { surfaces } = readUiState(
    {
      version: 1,
      surfaces: {
        "offers:offer-a": {
          disclosures: { pay: true, leave: false, invalid: "true" },
          top: 350,
          left: 12,
        },
        "comparisons:compare-a": { disclosures: [], top: -1, left: Number.POSITIVE_INFINITY },
        "profile:": null,
      },
    },
    records,
  );
  expect(surfaces).toEqual({
    "offers:offer-a": {
      disclosures: { pay: true, leave: false },
      top: 350,
      left: 12,
      inspector: null,
    },
    "comparisons:compare-a": { disclosures: {}, top: 0, left: 0, inspector: null },
    "profile:": { disclosures: {}, top: 0, left: 0, inspector: null },
  });
});

it("does not restore hidden archived offers, wrong record kinds or removed selections", () => {
  expect(selectedRecord(archived.id, "offer", records, false)).toBe("");
  expect(selectedRecord(archived.id, "offer", records, true)).toBe(archived.id);
  expect(selectedRecord(comparison.id, "offer", records, true)).toBe("");
  expect(selectedRecord(offer.id, "comparison", records, true)).toBe("");
  expect(
    readUiState({ version: 1, showArchived: true, offerId: archived.id }, records),
  ).toMatchObject({ offerId: archived.id, showArchived: true });
  expect(
    readUiState({ version: 1, offerId: archived.id, comparisonId: comparison.id }, []),
  ).toEqual(defaults);
});

it("restores a saved inspector target and rejects malformed targets", () => {
  const inspector = { label: "Inspect package value · Office offer", index: 1 };
  const state = (target: unknown) =>
    Object.values(
      readUiState(
        { version: 1, surfaces: { "comparisons:compare-a": { inspector: target } } },
        records,
      ).surfaces,
    ).at(0)?.inspector;
  expect(state(inspector)).toEqual(inspector);
  expect(state({ ...inspector, index: 0 })).toEqual({ ...inspector, index: 0 });
  for (const invalid of [
    undefined,
    null,
    true,
    [],
    "open",
    {},
    { label: "", index: 0 },
    { label: 1, index: 0 },
    { ...inspector, index: -1 },
    { ...inspector, index: 0.5 },
    { ...inspector, index: Number.POSITIVE_INFINITY },
    { ...inspector, index: "0" },
  ]) {
    expect(state(invalid)).toBeNull();
  }
});

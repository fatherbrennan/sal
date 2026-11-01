import assert from "node:assert/strict";
import type { Page } from "playwright";

// Expectations come from the audited event guards and native control behavior.
const applicationRows = [
  [
    "Open Preferences",
    "Global",
    [
      "storage ready",
      "no save/import",
      "unresolved conflict",
      "no modal dialog or dialog focus",
      "Ctrl/Command/Alt",
      "pending valid edits",
    ],
  ],
  [
    "Open Keyboard shortcuts",
    "Global",
    [
      "storage ready",
      "no save/import",
      "unresolved conflict",
      "no modal dialog or dialog focus",
      "Ctrl/Command/Alt",
      "pending valid edits",
    ],
  ],
  ...[
    "Add clicked value",
    "Subtract clicked value",
    "Multiply by clicked value",
    "Divide by clicked value",
  ].map(
    (action) =>
      [
        action,
        "Global",
        [
          "Calculator visible",
          "no drag or position chooser",
          "primary click",
          "outside Calculator, Keyboard shortcuts and Page width",
          "modifiers still match",
          "held binding",
        ],
      ] as const,
  ),
  [
    "Undo the last calculator operation",
    "Global",
    [
      "Calculator visible",
      "history exists",
      "inputs, selects and editable text",
      "no modal dialog or dialog focus",
      "checkbox/radio inputs",
      "no drag or position chooser",
    ],
  ],
  [
    "Clear calculator history and entry",
    "Global",
    [
      "Calculator visible",
      "history, entry or error exists",
      "inputs, selects and editable text",
      "no modal dialog or dialog focus",
      "checkbox/radio inputs",
      "no drag or position chooser",
    ],
  ],
] as const;
const controlRows = [
  [
    "Apply the calculator entry",
    "Calculator form",
    ["Number field or Apply button focused", "expanded"],
  ],
  [
    "Open a combobox and highlight the previous option",
    "Combobox",
    ["Search field focused", "enabled"],
  ],
  [
    "Open a combobox and highlight the next option",
    "Combobox",
    ["Search field focused", "enabled"],
  ],
  ["Select the highlighted option", "Combobox", ["dropdown open", "option highlighted", "enabled"]],
  ["Close the combobox dropdown", "Combobox", ["dropdown open", "enabled"]],
  ["Move keyboard focus forward", "Global", ["Browser focus in the app"]],
  ["Move keyboard focus backward", "Global", ["Browser focus in the app"]],
  ["Dismiss a tooltip", "Tooltip", ["Tooltip visible", "modal"]],
  [
    "Close the calculation inspector",
    "Calculation inspector",
    ["Focus inside inspector", "not consumed"],
  ],
  [
    "Cancel shortcut recording",
    "Shortcut recorder",
    ["Dialog active", "repeats", "composition", "AltGraph"],
  ],
  [
    "Save the recorded shortcut",
    "Shortcut recorder",
    [
      "Recording field focused",
      "valid, complete",
      "saving available",
      "repeats",
      "composition",
      "AltGraph",
    ],
  ],
  ["Close page width adjustment", "Page width dialog", ["Dialog active", "no save in progress"]],
  [
    "Cancel calculator placement",
    "Calculator placement",
    ["Position chooser active", "move handle focused while dragging"],
  ],
  ...[
    "Scroll the comparison horizontally left",
    "Scroll the comparison horizontally right",
    "Scroll to the first comparison offers",
    "Scroll to the last comparison offers",
  ].map(
    (action) =>
      [action, "Comparison scrollbar", ["Scrollbar itself focused", "overflowing offers"]] as const,
  ),
  ["Activate a button or disclosure", "Button or Disclosure", ["Control focused", "enabled"]],
  ["Toggle a checkbox", "Checkbox", ["Control focused", "enabled"]],
  [
    "Select the previous radio choice",
    "Radio group",
    ["Radio choice focused", "enabled", "same group"],
  ],
  [
    "Select the next radio choice",
    "Radio group",
    ["Radio choice focused", "enabled", "same group"],
  ],
  ["Follow a link", "Link", ["Link focused", "destination"]],
] as const;

async function shortcutAuditTable(page: Page): Promise<void> {
  const rows = [...applicationRows, ...controlRows];
  const table = page.getByRole("table", { name: "Keyboard shortcuts", exact: true });
  const actual = await table.locator("tbody tr:has(th)").evaluateAll((elements) =>
    elements.map((element) => ({
      action: element.querySelector("th")?.getAttribute("aria-label"),
      context: [...element.querySelectorAll(".context li")]
        .map((tag) => tag.textContent?.trim())
        .join(" or "),
      when: element.closest("tbody")?.querySelector(".when")?.textContent?.trim(),
    })),
  );
  const expected = new Set<string>(rows.map(([action]) => action));
  assert(new Set(actual.map((row) => row.action)).size === expected.size);
  assert(actual.every((row) => typeof row.action === "string" && expected.has(row.action)));
  for (const [action, context, conditions] of rows) {
    const matching = actual.filter((row) => row.action === action);
    assert(matching.length > 0, action);
    for (const row of matching) {
      assert(row.context === context, action);
      for (const condition of conditions) {
        assert(row.when?.includes(condition), `${action}: missing condition ${condition}`);
      }
    }
  }
}

export { shortcutAuditTable };

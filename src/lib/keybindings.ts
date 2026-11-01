function localKey(event: KeyboardEvent): boolean {
  return !(
    event.defaultPrevented ||
    event.isComposing ||
    event.ctrlKey ||
    event.metaKey ||
    event.altKey
  );
}

function dialogOwnsKeys(): boolean {
  return document.querySelector("dialog:modal, dialog[open]:focus-within") !== null;
}

const keybindings = [
  {
    keys: ["Tab"],
    action: "Move keyboard focus forward",
    context: ["Global"],
    when: "Browser focus in the app",
    description:
      "Close an open combobox. Modal dialogs keep focus inside; pinned inspectors permit focus to leave.",
  },
  {
    keys: ["Shift+Tab"],
    action: "Move keyboard focus backward",
    context: ["Global"],
    when: "Browser focus in the app",
    description:
      "Close an open combobox. Modal dialogs keep focus inside; pinned inspectors permit focus to leave.",
  },
  {
    keys: ["Escape"],
    action: "Cancel shortcut recording",
    context: ["Shortcut recorder"],
    when: "Dialog active; recording-field keys ignore repeats, composition and AltGraph",
    description: "Close the recorder without changing the saved shortcut.",
  },
  {
    keys: ["Enter"],
    action: "Save the recorded shortcut",
    context: ["Shortcut recorder"],
    when: "Recording field focused; valid, complete shortcut; saving available; no repeats, composition or AltGraph",
    description: "Save the new binding locally.",
  },
  {
    keys: ["Enter", "Space"],
    action: "Activate a button or disclosure",
    context: ["Button", "Disclosure"],
    when: "Control focused · enabled",
    description: "Activate the control.",
  },
  {
    keys: ["Space"],
    action: "Toggle a checkbox",
    context: ["Checkbox"],
    when: "Control focused · enabled",
    description: "Switch between checked and unchecked.",
  },
  {
    keys: ["←", "↑"],
    action: "Select the previous radio choice",
    context: ["Radio group"],
    when: "Radio choice focused; enabled choices in the same group",
    description: "Select the previous choice in the group, wrapping at the start.",
  },
  {
    keys: ["→", "↓"],
    action: "Select the next radio choice",
    context: ["Radio group"],
    when: "Radio choice focused; enabled choices in the same group",
    description: "Select the next choice in the group, wrapping at the end.",
  },
  {
    keys: ["Enter"],
    action: "Follow a link",
    context: ["Link"],
    when: "Link focused; destination present",
    description: "Open the link destination.",
  },
] as const;

function trapModalTab(event: KeyboardEvent, dialog: HTMLDialogElement): void {
  const controls = [
    ...dialog.querySelectorAll<HTMLElement>("button, select, input, summary, a[href], [tabindex]"),
  ].filter(
    (element) =>
      element.tabIndex >= 0 && !element.matches(":disabled") && element.checkVisibility(),
  );
  const [first] = controls;
  const last = controls.at(-1);
  if (
    event.shiftKey &&
    (document.activeElement === first || document.activeElement === dialog.querySelector("h2"))
  ) {
    event.preventDefault();
    last?.focus();
  } else if (!event.shiftKey && document.activeElement === last) {
    event.preventDefault();
    first?.focus();
  }
}

export { dialogOwnsKeys, keybindings, localKey, trapModalTab };

const scenarios = [
  { id: "base", label: "Base pay only · recurring", target: false, oneOff: false, baseOnly: true },
  {
    id: "guaranteed",
    label: "Guaranteed · recurring",
    target: false,
    oneOff: false,
    baseOnly: false,
  },
  { id: "target", label: "Target · recurring", target: true, oneOff: false, baseOnly: false },
  {
    id: "guaranteed-once",
    label: "Guaranteed · including one-offs",
    target: false,
    oneOff: true,
    baseOnly: false,
  },
  {
    id: "target-once",
    label: "Target · including one-offs",
    target: true,
    oneOff: true,
    baseOnly: false,
  },
];

export { scenarios };

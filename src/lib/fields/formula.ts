import { choices, field, select } from "./helpers.ts";

const formulaSections = [
  {
    title: "Formula",
    fields: [
      field("expression", "Expression", "text"),
      select(
        "format",
        "Result format",
        choices([
          ["money", "AUD"],
          ["number", "Number"],
          ["percent", "Percentage"],
        ]),
      ),
      select(
        "direction",
        "Preferred result",
        choices([
          ["higher", "Higher is better"],
          ["lower", "Lower is better"],
          ["neutral", "Neither"],
        ]),
      ),
    ],
  },
];

export { formulaSections };

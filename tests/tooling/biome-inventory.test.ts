import { expect, it } from "bun:test";
import assert from "node:assert/strict";
import { auditBiomeConfiguration, checkBiomeInventory } from "../../scripts/biome-inventory.ts";
import exclusions from "../../tooling/biome-exclusions.json" with { type: "json" };

const smallSchema = {
  $defs: { width: { type: "number" } },
  properties: {
    formatter: {
      properties: {
        enabled: { type: "boolean" },
        indentWidth: { $ref: "#/$defs/width" },
      },
    },
  },
};

it("requires explicit defaults and rejects an omitted nested setting", () => {
  expect(
    auditBiomeConfiguration(smallSchema, { formatter: { enabled: true, indentWidth: 2 } }, {}),
  ).toContainEqual({ path: "formatter.indentWidth", state: "explicit", value: 2 });
  expect(() => auditBiomeConfiguration(smallSchema, { formatter: { enabled: true } }, {})).toThrow(
    "formatter.indentWidth",
  );
});

it("records an individually justified inapplicable property", () => {
  expect(
    auditBiomeConfiguration(
      smallSchema,
      { formatter: { enabled: true } },
      {
        "formatter.indentWidth": "Synthetic incompatible option for this fixture only.",
      },
    ),
  ).toContainEqual({
    path: "formatter.indentWidth",
    state: "excluded",
    reason: "Synthetic incompatible option for this fixture only.",
  });
});

it("requires reasons for disabled rules and enumerates their inactive options", () => {
  const schema = {
    $defs: {},
    properties: {
      linter: {
        properties: {
          rules: {
            properties: {
              example: {
                properties: {
                  noExample: {
                    anyOf: [
                      { enum: ["off"] },
                      {
                        properties: {
                          level: { type: "string" },
                          options: { properties: { limit: { type: "number" } } },
                        },
                      },
                    ],
                  },
                },
              },
            },
          },
        },
      },
    },
  };
  const config = { linter: { rules: { example: { noExample: "off" } } } };
  expect(() => auditBiomeConfiguration(schema, config, {})).toThrow("needs a reason");
  expect(
    auditBiomeConfiguration(schema, config, {
      "linter.rules.example.noExample": "Synthetic unused language.",
    }),
  ).toContainEqual({
    path: "linter.rules.example.noExample.options.limit",
    state: "excluded",
    reason: "Synthetic unused language.",
  });
});

it("verifies the real pinned schema and checked-in inventory", async () => {
  await expect(checkBiomeInventory(false)).resolves.toBeUndefined();
});

it("rejects removal of the real Biome root indentWidth setting", async () => {
  const schema: unknown = await Bun.file(
    "node_modules/@biomejs/biome/configuration_schema.json",
  ).json();
  const original: unknown = await Bun.file("biome.json").json();
  assert(typeof original === "object" && original !== null && "formatter" in original);
  const { formatter, ...remaining } = original;
  assert(typeof formatter === "object" && formatter !== null && "indentWidth" in formatter);
  const { indentWidth, ...missingWidth } = formatter;
  expect(indentWidth).toBe(2);
  expect(() =>
    auditBiomeConfiguration(schema, { ...remaining, formatter: missingWidth }, exclusions),
  ).toThrow("formatter.indentWidth");
});

it("rejects unsupported and cyclic schema references", () => {
  expect(() =>
    auditBiomeConfiguration({ $defs: {}, $ref: "https://example.invalid/schema" }, {}, {}),
  ).toThrow("Unsupported schema reference");
  const schema = { $defs: { loop: { $ref: "#/$defs/loop" } }, $ref: "#/$defs/loop" };
  expect(() => auditBiomeConfiguration(schema, {}, {})).toThrow("Recursive schema reference");
});

it("rejects warning severity even when the Biome schema permits it", () => {
  const schema = {
    $defs: {},
    properties: {
      linter: {
        properties: {
          rules: {
            properties: {
              suspicious: {
                properties: {
                  noExample: { properties: { level: { enum: ["warn", "error"] } } },
                },
              },
            },
          },
        },
      },
    },
  };
  const warning = { linter: { rules: { suspicious: { noExample: { level: "warn" } } } } };
  expect(() => auditBiomeConfiguration(schema, warning, {})).toThrow("error severity");
  const error = { linter: { rules: { suspicious: { noExample: { level: "error" } } } } };
  expect(() => auditBiomeConfiguration(schema, error, {})).not.toThrow();
});

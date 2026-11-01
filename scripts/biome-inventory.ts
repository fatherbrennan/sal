import assert from "node:assert/strict";
import process from "node:process";

interface InventoryEntry {
  path: string;
  state: "explicit" | "inherited" | "excluded";
  value?: unknown;
  reason?: string;
}

interface AuditContext {
  definitions: Record<string, unknown>;
  configuration: Record<string, unknown>;
  exclusions: Record<string, string>;
  entries: Map<string, InventoryEntry>;
  missing: Set<string>;
}

interface AuditNode {
  definition: unknown;
  value: unknown;
  inherited: unknown;
  path: string;
  exclusion: string | undefined;
}

const overridePrefix = /^overrides\[\d+\]\./u;
const lintRulePath = /^linter\.rules\.\w+\.\w+$/u;
const assistPath = /^assist\.actions\.\w+\.\w+$/u;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function schemaNodes(
  value: unknown,
  definitions: Record<string, unknown>,
  seen = new Set<string>(),
): Record<string, unknown>[] {
  assert(isRecord(value), "Expected a schema object");
  const { $ref, anyOf, oneOf, allOf } = value;
  if (typeof $ref === "string") {
    assert($ref.startsWith("#/$defs/"), `Unsupported schema reference: ${$ref}`);
    assert(!seen.has($ref), `Recursive schema reference: ${$ref}`);
    const referenced = definitions[$ref.slice("#/$defs/".length)];
    return schemaNodes(referenced, definitions, new Set([...seen, $ref]));
  }
  return [
    value,
    ...[anyOf, oneOf, allOf]
      .filter(Array.isArray)
      .flatMap((variants: unknown[]) =>
        variants.flatMap((variant) => schemaNodes(variant, definitions, seen)),
      ),
  ];
}

function objectValue(value: unknown): Record<string, unknown> {
  if (isRecord(value)) {
    return value;
  }
  return {};
}

function displayValue(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map((item: unknown) => displayValue(item));
  }
  if (isRecord(value)) {
    return "Object";
  }
  return value;
}

function verifyRule(path: string, selected: unknown, reason: string | undefined): void {
  const canonicalPath = path.replace(overridePrefix, "");
  if (selected === "off") {
    assert(reason !== undefined, `Disabled rule/action needs a reason: ${path}`);
    return;
  }
  const { level } = objectValue(selected);
  if (lintRulePath.test(canonicalPath) && !canonicalPath.endsWith(".preset")) {
    assert.equal(level, "error", `Lint rule must explicitly use error severity: ${path}`);
  }
  if (assistPath.test(canonicalPath) && !canonicalPath.endsWith(".preset")) {
    assert.equal(level, "on", `Enabled assist must explicitly use on: ${path}`);
  }
}

function recordProperty(
  context: AuditContext,
  node: AuditNode,
  key: string,
): AuditNode | undefined {
  const actual = objectValue(node.value);
  const base = objectValue(node.inherited);
  const { path } = node;
  let reason =
    node.exclusion ??
    context.exclusions[path] ??
    context.exclusions[path.replace(overridePrefix, "")];
  if (key === "recommended") {
    reason =
      "Deprecated and incompatible with the explicit preset field; native Biome validator confirms the conflict.";
  }
  if (Object.hasOwn(actual, key)) {
    const selected = actual[key];
    verifyRule(path, selected, reason);
    const entry: InventoryEntry = { path, state: "explicit", value: displayValue(selected) };
    if (reason !== undefined) {
      entry.reason = reason;
    }
    context.entries.set(path, entry);
    if (selected === "off") {
      return { ...node, value: selected, inherited: undefined, exclusion: reason };
    }
    return { ...node, value: selected, inherited: base[key], exclusion: undefined };
  }
  if (Object.hasOwn(base, key)) {
    context.entries.set(path, {
      path,
      state: "inherited",
      value: displayValue(base[key]),
      reason: "Inherits the explicitly configured root value.",
    });
    return { ...node, value: undefined, inherited: base[key], exclusion: reason };
  }
  if (reason === undefined) {
    context.missing.add(path);
    return undefined;
  }
  context.entries.set(path, { path, state: "excluded", reason });
  return { ...node, value: undefined, inherited: undefined, exclusion: reason };
}

function visitItems(context: AuditContext, node: AuditNode, items: unknown): void {
  if (!isRecord(items)) {
    return;
  }
  if (Array.isArray(node.value) && node.value.length > 0) {
    node.value.forEach((selected: unknown, index) => {
      let inherited: unknown;
      if (node.path === "overrides") {
        inherited = context.configuration;
      }
      visit(context, {
        definition: items,
        value: selected,
        path: `${node.path}[${index}]`,
        inherited,
        exclusion: node.exclusion,
      });
    });
    return;
  }
  visit(context, {
    definition: items,
    value: undefined,
    path: `${node.path}[]`,
    inherited: undefined,
    exclusion:
      node.exclusion ?? "No entries selected for this array; its item properties do not apply.",
  });
}

function visit(context: AuditContext, node: AuditNode): void {
  const nodes = schemaNodes(node.definition, context.definitions);
  const properties = Object.fromEntries(
    nodes.flatMap(({ properties: fields }) => Object.entries(objectValue(fields))),
  );
  for (const [key, definition] of Object.entries(properties)) {
    let path = key;
    if (node.path.length > 0) {
      path = `${node.path}.${key}`;
    }
    const child = recordProperty(context, { ...node, definition, path }, key);
    if (child !== undefined) {
      visit(context, child);
    }
  }
  for (const { items } of nodes) {
    visitItems(context, node, items);
  }
}

function auditBiomeConfiguration(
  schema: unknown,
  configuration: unknown,
  exclusions: Record<string, string>,
): InventoryEntry[] {
  assert(isRecord(schema) && isRecord(configuration), "Expected schema and configuration objects");
  const { $defs } = schema;
  assert(isRecord($defs), "Expected schema definitions");
  const context: AuditContext = {
    definitions: $defs,
    configuration,
    exclusions,
    entries: new Map(),
    missing: new Set(),
  };
  visit(context, {
    definition: schema,
    value: configuration,
    path: "",
    inherited: undefined,
    exclusion: undefined,
  });
  const diagnosticLimit = 30;
  assert.equal(
    context.missing.size,
    0,
    `Unaccounted configuration properties (${context.missing.size}):\n${[...context.missing].slice(0, diagnosticLimit).join("\n")}`,
  );
  return [...context.entries.values()].sort((left, right) => left.path.localeCompare(right.path));
}

function inventorySection(entry: InventoryEntry): string {
  const [section] = entry.path.split(".");
  assert(section !== undefined);
  return section.replaceAll("[", "-").replaceAll("]", "");
}

async function checkBiomeInventory(write: boolean): Promise<void> {
  const [schema, configuration, rawExclusions]: unknown[] = await Promise.all([
    Bun.file("node_modules/@biomejs/biome/configuration_schema.json").json(),
    Bun.file("biome.json").json(),
    Bun.file("tooling/biome-exclusions.json").json(),
  ]);
  assert(isRecord(rawExclusions), "Expected an exclusion dictionary");
  const exclusions: Record<string, string> = {};
  for (const [path, reason] of Object.entries(rawExclusions)) {
    assert(typeof reason === "string" && reason.length > 0, path);
    exclusions[path] = reason;
  }
  const inventory = auditBiomeConfiguration(schema, configuration, exclusions);
  const sections = Object.groupBy(inventory, inventorySection);
  await Promise.all(
    Object.entries(sections).map(async ([section, entries]) => {
      const file = Bun.file(`tooling/biome-inventory/${section}.json`);
      if (write) {
        await Bun.write(file, `${JSON.stringify(entries, null, 2)}\n`);
      } else {
        const saved: unknown = await file.json();
        assert.deepEqual(
          saved,
          entries,
          `Biome inventory is stale: ${section}; review and regenerate it.`,
        );
      }
    }),
  );
  process.stdout.write(`Biome: ${inventory.length} configuration property records verified.\n`);
}

if (import.meta.main) {
  const [, , mode, ...extra] = process.argv;
  assert(
    extra.length === 0 && (mode === "write" || mode === "check"),
    "Use the named Biome inventory tasks.",
  );
  await checkBiomeInventory(mode === "write");
}

export { auditBiomeConfiguration, checkBiomeInventory };

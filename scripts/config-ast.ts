import assert from "node:assert/strict";
import type { Expression, Node } from "typescript";
import {
  createSourceFile,
  forEachChild,
  isArrowFunction,
  isCallExpression,
  isIdentifier,
  isMethodDeclaration,
  isObjectLiteralExpression,
  isParenthesizedExpression,
  isPropertyAccessExpression,
  isPropertyAssignment,
  isSatisfiesExpression,
  isSpreadAssignment,
  isVariableDeclaration,
  ScriptTarget,
} from "typescript";

interface ConfigValue {
  value: string;
  location: string;
}
interface AstContext {
  bindings: Map<string, Expression>;
  values: Map<string, ConfigValue>;
}
const quotedName = /^["']|["']$/gu;

function resolveObject(node: Node, context: AstContext): Node {
  if (isSatisfiesExpression(node) || isParenthesizedExpression(node)) {
    return resolveObject(node.expression, context);
  }
  if (isIdentifier(node)) {
    const binding = context.bindings.get(node.text);
    if (binding) {
      return resolveObject(binding, context);
    }
    return node;
  }
  if (isPropertyAccessExpression(node)) {
    const object = resolveObject(node.expression, context);
    if (isObjectLiteralExpression(object)) {
      const field = object.properties.find(
        (property) => property.name?.getText() === node.name.text,
      );
      if (field && isPropertyAssignment(field)) {
        return resolveObject(field.initializer, context);
      }
    }
  }
  return node;
}

function recordValue(node: Node, path: string, context: AstContext): void {
  const owner = node.getSourceFile();
  context.values.set(path, {
    value: node.getText(),
    location: `${owner.fileName}:${owner.getLineAndCharacterOfPosition(node.getStart()).line + 1}`,
  });
}

function collectObject(input: Node, prefix: string, context: AstContext): void {
  const node = resolveObject(input, context);
  if (!isObjectLiteralExpression(node)) {
    return;
  }
  for (const property of node.properties) {
    if (isSpreadAssignment(property)) {
      collectObject(property.expression, prefix, context);
    }
    if (isPropertyAssignment(property)) {
      const path = `${prefix}.${property.name.getText().replace(quotedName, "")}`;
      recordValue(property.initializer, path, context);
      collectObject(property.initializer, path, context);
    } else if (isMethodDeclaration(property)) {
      recordValue(property, `${prefix}.${property.name.getText()}`, context);
    }
  }
}

function scanConfig(node: Node, context: AstContext): void {
  if (isVariableDeclaration(node) && node.name.getText() === "kitOptions" && node.initializer) {
    collectObject(node.initializer, "SvelteKit", context);
  }
  if (isCallExpression(node) && node.arguments[0]) {
    const name = node.expression.getText();
    if (name === "adapter") {
      collectObject(node.arguments[0], "StaticAdapter", context);
    }
    if (name === "sveltekit") {
      collectObject(node.arguments[0], "SvelteKit", context);
    }
    if (name === "defineConfig" && isArrowFunction(node.arguments[0])) {
      collectObject(node.arguments[0].body, "Vite", context);
    }
  }
  forEachChild(node, (child) => scanConfig(child, context));
}

function collectBindings(node: Node, context: AstContext): void {
  if (isVariableDeclaration(node) && isIdentifier(node.name) && node.initializer) {
    assert(
      !context.bindings.has(node.name.text),
      `Ambiguous configuration binding: ${node.name.text}`,
    );
    context.bindings.set(node.name.text, node.initializer);
  }
  forEachChild(node, (child) => collectBindings(child, context));
}

function extractConfiguration(sources: Record<string, string>): Map<string, ConfigValue> {
  const context: AstContext = { bindings: new Map(), values: new Map() };
  const parsed = Object.entries(sources).map(([path, content]) =>
    createSourceFile(path, content, ScriptTarget.Latest, true),
  );
  for (const source of parsed) {
    collectBindings(source, context);
  }
  for (const source of parsed) {
    scanConfig(source, context);
  }
  for (const [path, value] of [...context.values]) {
    if (path.startsWith("Vite.environments.client.")) {
      context.values.set(path.replace("Vite.environments.client.", "ViteClient."), value);
    }
    if (path.startsWith("Vite.environments.ssr.")) {
      context.values.set(path.replace("Vite.environments.ssr.", "ViteServer."), value);
    }
  }
  return context.values;
}

export type { ConfigValue };
export { extractConfiguration };

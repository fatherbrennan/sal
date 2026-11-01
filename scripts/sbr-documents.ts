import assert from "node:assert/strict";
import { Buffer } from "node:buffer";
import { createRequire } from "node:module";
import { join } from "node:path";
import process from "node:process";
import { Readable } from "node:stream";
import { text } from "node:stream/consumers";
import { requireRecord } from "./config-inventory.ts";

const maximumBytes = 10_485_760;
const downloadTimeoutMs = 30_000;
const sources: Record<string, string> = {
  "guide-2026":
    "https://www.sbr.gov.au/sites/default/files/2026-05/ATO_IITR.0013_2026_Business_Implementation_Guide.docx",
  "contents-2026":
    "https://www.sbr.gov.au/sites/default/files/2026-07/ATO_IITR_2026_Package_v1.6_Contents.docx",
};

function requireAsyncIterable(value: unknown): asserts value is AsyncIterable<unknown> {
  assert(
    typeof value === "object" &&
      value !== null &&
      Symbol.asyncIterator in value &&
      typeof value[Symbol.asyncIterator] === "function",
    "Expected an async archive iterator.",
  );
}

async function documentParts(bytes: Uint8Array): Promise<Map<string, string>> {
  assert(bytes.byteLength <= maximumBytes, "Document exceeds the research size limit.");
  // shortcut: use the pinned Playwright bundle; recheck its ZIP API when Playwright changes.
  const bundle: unknown = createRequire(import.meta.url)("playwright-core/lib/utilsBundle");
  requireRecord(bundle);
  const { yauzl } = bundle;
  requireRecord(yauzl);
  const { fromBufferPromise } = yauzl;
  assert(typeof fromBufferPromise === "function");
  const archive: unknown = await fromBufferPromise(Buffer.from(bytes), {
    autoClose: true,
    decodeStrings: true,
    validateEntrySizes: true,
    strictFileNames: true,
  });
  requireRecord(archive);
  const { eachEntry, openReadStreamPromise, close } = archive;
  assert(typeof eachEntry === "function");
  assert(typeof openReadStreamPromise === "function");
  assert(typeof close === "function");
  const entries: unknown = eachEntry.call(archive);
  requireAsyncIterable(entries);
  const parts = new Map<string, string>();
  try {
    for await (const entry of entries) {
      requireRecord(entry);
      const { fileName, uncompressedSize } = entry;
      if (
        fileName === "word/document.xml" ||
        fileName === "word/footnotes.xml" ||
        fileName === "word/endnotes.xml"
      ) {
        assert(!parts.has(fileName), "Duplicate document part.");
        assert(
          typeof uncompressedSize === "number" && uncompressedSize <= maximumBytes,
          "Document part exceeds the research size limit.",
        );
        const stream: unknown = await openReadStreamPromise.call(archive, entry);
        assert(stream instanceof Readable);
        const content = await text(stream);
        assert(Buffer.byteLength(content) <= maximumBytes, "Expanded document part is too large.");
        parts.set(fileName, content);
      }
    }
  } finally {
    close.call(archive);
  }
  assert(parts.has("word/document.xml"), "DOCX main document part is missing.");
  return parts;
}

async function readSbrDocument(
  arguments_: string[],
  directory = ".cache/research/sbr",
): Promise<void> {
  const [key, ...extra] = arguments_;
  assert(
    key !== undefined && extra.length === 0 && Object.hasOwn(sources, key),
    "Select guide-2026 or contents-2026.",
  );
  const source = sources[key];
  assert(source !== undefined);
  const response = await fetch(source, {
    redirect: "error",
    signal: AbortSignal.timeout(downloadTimeoutMs),
  });
  assert(response.ok, `SBR download failed: HTTP ${response.status}.`);
  const bytes = await response.bytes();
  const parts = await documentParts(bytes);
  const prefix = join(directory, key);
  await Bun.write(`${prefix}.docx`, bytes);
  await Promise.all(
    [...parts].map(([name, content]) =>
      Bun.write(`${prefix}-${name.slice("word/".length)}`, content.replaceAll("><", ">\n<")),
    ),
  );
  await Bun.write(
    `${prefix}.json`,
    `${JSON.stringify(
      {
        source,
        retrievedAt: new Date().toISOString(),
        sha256: new Bun.CryptoHasher("sha256").update(bytes).digest("hex"),
        parts: [...parts.keys()],
        view: "XML with tag-separating newlines; original DOCX retained. No rendered-page verification.",
      },
      null,
      2,
    )}\n`,
  );
  process.stdout.write(`Retained SBR source and XML views: ${prefix}\n`);
}

if (import.meta.main) {
  await readSbrDocument(process.argv.slice(2));
}

export { documentParts, readSbrDocument };

import { expect, it, spyOn } from "bun:test";
import assert from "node:assert/strict";
import { Buffer } from "node:buffer";
import { mkdtemp, rm } from "node:fs/promises";
import { createRequire } from "node:module";
import { tmpdir } from "node:os";
import { join, resolve, sep } from "node:path";
import { Readable } from "node:stream";
import { buffer } from "node:stream/consumers";
import { requireRecord } from "../../scripts/config-inventory.ts";
import { documentParts, readSbrDocument } from "../../scripts/sbr-documents.ts";

const excessiveBytes = 10_485_761;

async function specimen(parts: Record<string, string>): Promise<Uint8Array<ArrayBuffer>> {
  const bundle: unknown = createRequire(import.meta.url)("playwright-core/lib/utilsBundle");
  requireRecord(bundle);
  const { yazl } = bundle;
  requireRecord(yazl);
  const { ZipFile } = yazl;
  assert(typeof ZipFile === "function");
  const zip: unknown = Reflect.construct(ZipFile, []);
  requireRecord(zip);
  const { addBuffer, end, outputStream } = zip;
  assert(typeof addBuffer === "function" && typeof end === "function");
  assert(outputStream instanceof Readable);
  const result = buffer(outputStream);
  for (const [name, text] of Object.entries(parts)) {
    addBuffer.call(zip, Buffer.from(text), name);
  }
  end.call(zip);
  return new Uint8Array(await result);
}

it("retains source XML, footnotes and endnotes without extracting unrelated archive paths", async () => {
  const main =
    '<w:document xmlns:w="urn:test"><w:p><w:t>Tax 1.25 &amp; credit</w:t></w:p></w:document>';
  const parts = await documentParts(
    await specimen({
      "word/document.xml": main,
      "word/footnotes.xml": "<footnotes>Rule qualification</footnotes>",
      "word/endnotes.xml": "<endnotes>Source</endnotes>",
      "unrelated.txt": "Do not extract",
    }),
  );
  expect([...parts]).toEqual([
    ["word/document.xml", main],
    ["word/footnotes.xml", "<footnotes>Rule qualification</footnotes>"],
    ["word/endnotes.xml", "<endnotes>Source</endnotes>"],
  ]);
});

it("rejects a non-ZIP, missing main document and excessive document before claiming extraction", async () => {
  await expect(documentParts(new Uint8Array())).rejects.toThrow();
  await expect(documentParts(await specimen({ "other.txt": "No Word document" }))).rejects.toThrow(
    "main document part is missing",
  );
  await expect(documentParts(new Uint8Array(excessiveBytes))).rejects.toThrow("size limit");
  await expect(
    documentParts(await specimen({ "word/document.xml": "a".repeat(excessiveBytes) })),
  ).rejects.toThrow("part exceeds");
});

it("rejects unknown or ambiguous source selection before downloading or writing", async () => {
  await expect(readSbrDocument([])).rejects.toThrow("Select guide-2026 or contents-2026");
  await expect(readSbrDocument(["../outside"])).rejects.toThrow(
    "Select guide-2026 or contents-2026",
  );
  await expect(readSbrDocument(["guide-2026", "extra"])).rejects.toThrow(
    "Select guide-2026 or contents-2026",
  );
});

it("retains exact downloaded bytes and provenance; failed downloads preserve prior evidence", async () => {
  const directory = await mkdtemp(join(tmpdir(), "sal-sbr-research-"));
  const xml = "<document><p>Source amount 1.25</p></document>";
  const bytes = await specimen({ "word/document.xml": xml });
  const download = spyOn(globalThis, "fetch").mockResolvedValue(new Response(bytes));
  try {
    await readSbrDocument(["guide-2026"], directory);
    const prefix = join(directory, "guide-2026");
    expect(await Bun.file(`${prefix}.docx`).bytes()).toEqual(bytes);
    expect(await Bun.file(`${prefix}-document.xml`).text()).toBe(
      ["<document>", "<p>Source amount 1.25</p>", "</document>"].join("\n"),
    );
    const provenance: unknown = await Bun.file(`${prefix}.json`).json();
    requireRecord(provenance);
    const { source, sha256, parts, retrievedAt } = provenance;
    expect(source).toBe(
      "https://www.sbr.gov.au/sites/default/files/2026-05/ATO_IITR.0013_2026_Business_Implementation_Guide.docx",
    );
    expect(sha256).toBe(new Bun.CryptoHasher("sha256").update(bytes).digest("hex"));
    expect(parts).toEqual(["word/document.xml"]);
    expect(typeof retrievedAt).toBe("string");
    download.mockResolvedValue(new Response("Unavailable", { status: 503 }));
    await expect(readSbrDocument(["guide-2026"], directory)).rejects.toThrow("HTTP 503");
    download.mockResolvedValue(new Response("Not a document"));
    await expect(readSbrDocument(["guide-2026"], directory)).rejects.toThrow();
    expect(await Bun.file(`${prefix}.docx`).bytes()).toEqual(bytes);
    expect(await Bun.file(`${prefix}.json`).json()).toEqual(provenance);
  } finally {
    download.mockRestore();
    assert(resolve(directory).startsWith(`${resolve(tmpdir())}${sep}sal-sbr-research-`));
    await rm(directory, { recursive: true });
  }
});

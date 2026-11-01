import { readRecord, type SalRecord, validateReferences } from "./schema.ts";

type SaveResult =
  | { status: "saved"; records: SalRecord[] }
  | { status: "conflict"; records: SalRecord[] };
const storeName = "records";
function openDatabase(
  name = "sal",
  factory: IDBFactory = globalThis.indexedDB,
): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = factory.open(name, 1);
    let blocked = false;
    request.onupgradeneeded = () => request.result.createObjectStore(storeName, { keyPath: "id" });
    request.onblocked = () => {
      blocked = true;
      reject(new Error("Close older sal tabs to finish opening local storage."));
    };
    request.onerror = () =>
      reject(request.error ?? new Error("Local storage could not be opened."));
    request.onsuccess = () => {
      const db = request.result;
      db.onversionchange = () => db.close();
      if (blocked) {
        db.close();
      } else {
        resolve(db);
      }
    };
  });
}
function readRows(value: unknown): SalRecord[] {
  if (!Array.isArray(value)) {
    throw new Error("Local records are malformed.");
  }
  const rows = value.map((entry: unknown) => readRecord(entry));
  // Deleted offers must not prevent opening the remaining local records for repair.
  validateReferences(rows, true);
  return rows;
}
function loadRecords(db: IDBDatabase): Promise<SalRecord[]> {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(storeName, "readonly");
    const request = transaction.objectStore(storeName).getAll();
    transaction.onerror = () =>
      reject(transaction.error ?? new Error("Local records could not be read."));
    transaction.onabort = () =>
      reject(transaction.error ?? new Error("Local read was interrupted."));
    transaction.oncomplete = () => {
      try {
        resolve(readRows(request.result));
      } catch (error) {
        reject(error);
      }
    };
  });
}
function saveRecords(
  db: IDBDatabase,
  changes: readonly SalRecord[],
  expected: Record<string, number>,
  now: string,
): Promise<SaveResult> {
  const validated = changes.map(readRecord);
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(storeName, "readwrite");
    const store = transaction.objectStore(storeName);
    const request = store.getAll();
    let result: SaveResult = { status: "conflict", records: [] };
    let failure: unknown;
    transaction.oncomplete = () => resolve(result);
    transaction.onerror = () =>
      reject(transaction.error ?? new Error("Save failed. Your previous data is unchanged."));
    transaction.onabort = () =>
      reject(
        failure ??
          transaction.error ??
          new Error("Save was interrupted. Your previous data is unchanged."),
      );
    request.onsuccess = () => {
      try {
        const current = readRows(request.result);
        const byId = new Map(current.map((record) => [record.id, record]));
        if (
          validated.some((record) => (byId.get(record.id)?.revision ?? 0) !== expected[record.id])
        ) {
          result = { status: "conflict", records: current };
          return;
        }
        const saved = validated.map((record) =>
          readRecord({
            ...record,
            revision: (byId.get(record.id)?.revision ?? 0) + 1,
            updatedAt: now,
          }),
        );
        for (const record of saved) {
          byId.set(record.id, record);
        }
        const next = [...byId.values()];
        validateReferences(next, true);
        validateReferences(
          next.filter(
            (record) =>
              record.kind !== "comparison" || saved.some((entry) => entry.id === record.id),
          ),
        );
        for (const record of saved) {
          store.put(record);
        }
        result = { status: "saved", records: next };
      } catch (error) {
        failure = error;
        transaction.abort();
      }
    };
  });
}

export type { SaveResult };
export { loadRecords, openDatabase, readRows, saveRecords };

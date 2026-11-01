import { loadRecords, openDatabase, readRows, saveRecords } from "../../src/lib/data/database.ts";
import { newRecord } from "../../src/lib/data/schema.ts";

const now = "2026-10-23T00:00:00.000Z";
function check(condition: boolean, message: string): void {
  if (!condition) {
    throw new Error(message);
  }
}
async function rejection(task: Promise<unknown>): Promise<void> {
  try {
    await task;
  } catch {
    return;
  }
  throw new Error("Expected storage failure");
}
function transactionDone(transaction: IDBTransaction): Promise<void> {
  return new Promise((resolve, reject) => {
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error);
  });
}
async function persistenceCases(): Promise<void> {
  const name = `sal-test-${crypto.randomUUID()}`;
  const db = await openDatabase(name);
  try {
    check((await loadRecords(db)).length === 0, "New database must be empty");
    const offer = newRecord("offer", "saved-offer", now);
    const saved = await saveRecords(db, [offer], { [offer.id]: 0 }, now);
    check(saved.status === "saved", "Initial write must commit");
    const conflict = await saveRecords(db, [{ ...offer, name: "stale" }], { [offer.id]: 0 }, now);
    check(conflict.status === "conflict", "Stale revision must conflict");
    check((await loadRecords(db))[0]?.name === offer.name, "Conflict must preserve stored offer");
    const comparison = newRecord("comparison", "broken-reference", now);
    comparison.items = { offers: [{ id: "missing", fields: { offerId: "absent" } }] };
    await rejection(saveRecords(db, [comparison], { [comparison.id]: 0 }, now));
    check((await loadRecords(db)).length === 1, "Rejected transaction must preserve all data");
    const transaction = db.transaction("records", "readwrite");
    transaction.objectStore("records").put({ id: "corrupt" });
    await transactionDone(transaction);
    await rejection(loadRecords(db));
    await rejection(saveRecords(db, [offer], { [offer.id]: 1 }, now));
    let malformedRejected = false;
    try {
      readRows(null);
    } catch {
      malformedRejected = true;
    }
    check(malformedRejected, "Malformed record list must fail validation");
  } finally {
    db.close();
    indexedDB.deleteDatabase(name);
  }
}
async function transactionFailures(): Promise<void> {
  const name = `sal-fault-${crypto.randomUUID()}`;
  const db = await openDatabase(name);
  const original = db.transaction.bind(db);
  const offer = newRecord("offer", "fault-offer", now);
  try {
    const fault = async (event: string): Promise<void> => {
      Object.defineProperty(db, "transaction", {
        configurable: true,
        value: (stores: string | string[], mode?: IDBTransactionMode) => {
          const transaction = original(stores, mode);
          queueMicrotask(() => {
            transaction.dispatchEvent(new Event(event));
            transaction.abort();
          });
          return transaction;
        },
      });
      await rejection(loadRecords(db));
      await rejection(saveRecords(db, [offer], { [offer.id]: 0 }, now));
    };
    await fault("abort");
    await fault("error");
    Object.defineProperty(db, "transaction", { value: original });
    check((await loadRecords(db)).length === 0, "Faulted writes must not persist");
  } finally {
    db.close();
    indexedDB.deleteDatabase(name);
  }
}
async function openingFailures(): Promise<void> {
  const original = indexedDB.open.bind(indexedDB);
  try {
    const fault = async (event: string): Promise<void> => {
      const name = `sal-open-${crypto.randomUUID()}`;
      let completed: Promise<void> = Promise.resolve();
      Object.defineProperty(indexedDB, "open", {
        configurable: true,
        value: (database: string, version?: number) => {
          const request = original(database, version);
          if (event === "error") {
            Object.defineProperty(request, "error", { value: null });
          }
          completed = new Promise((resolve) =>
            request.addEventListener("success", () => {
              request.result.close();
              resolve();
            }),
          );
          queueMicrotask(() => request.dispatchEvent(new Event(event)));
          return request;
        },
      });
      await rejection(openDatabase(name));
      await completed;
      indexedDB.deleteDatabase(name);
    };
    await fault("blocked");
    await fault("error");
  } finally {
    Object.defineProperty(indexedDB, "open", { value: original });
  }
  const name = `sal-version-${crypto.randomUUID()}`;
  const db = await openDatabase(name);
  const upgraded = indexedDB.open(name, 2);
  await new Promise<void>((resolve, reject) => {
    upgraded.onsuccess = () => {
      upgraded.result.close();
      resolve();
    };
    upgraded.onerror = () => reject(upgraded.error);
  });
  await rejection(openDatabase(name));
  db.close();
  indexedDB.deleteDatabase(name);
}
async function databaseChecks(): Promise<void> {
  await persistenceCases();
  await transactionFailures();
  await openingFailures();
}

export { databaseChecks };

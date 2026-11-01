import type { Page } from "playwright";

async function uiStateData(page: Page, next?: unknown): Promise<unknown> {
  return await page.evaluate(
    (incoming) =>
      new Promise<unknown>((resolve, reject) => {
        const request = indexedDB.open("sal-ui", 1);
        request.onerror = () => reject(request.error);
        request.onsuccess = () => {
          const db = request.result;
          let mode: IDBTransactionMode = "readonly";
          if (incoming !== undefined) {
            mode = "readwrite";
          }
          const transaction = db.transaction("ui-state", mode);
          const store = transaction.objectStore("ui-state");
          if (incoming !== undefined) {
            store.put(incoming, "current");
          }
          const read = store.get("current");
          transaction.oncomplete = () => {
            db.close();
            resolve(read.result);
          };
          transaction.onerror = () => {
            db.close();
            reject(transaction.error);
          };
        };
      }),
    next,
  );
}

async function storedRecords(page: Page): Promise<unknown> {
  return await page.evaluate(
    () =>
      new Promise<unknown>((resolve, reject) => {
        const request = indexedDB.open("sal");
        request.onerror = () => reject(request.error);
        request.onsuccess = () => {
          const db = request.result;
          const transaction = db.transaction("records", "readonly");
          const read = transaction.objectStore("records").getAll();
          transaction.oncomplete = () => {
            db.close();
            resolve(read.result);
          };
          transaction.onerror = () => {
            db.close();
            reject(transaction.error);
          };
        };
      }),
  );
}

async function removeStoredData(page: Page, name: "sal" | "sal-ui", keys: string[]): Promise<void> {
  await page.evaluate(
    ({ database, ids }) =>
      new Promise<void>((resolve, reject) => {
        const request = indexedDB.open(database);
        request.onerror = () => reject(request.error);
        request.onsuccess = () => {
          const db = request.result;
          const stores = { sal: "records", "sal-ui": "ui-state" };
          const transaction = db.transaction(stores[database], "readwrite");
          const store = transaction.objectStore(stores[database]);
          for (const id of ids) {
            store.delete(id);
          }
          transaction.oncomplete = () => {
            db.close();
            resolve();
          };
          transaction.onerror = () => {
            db.close();
            reject(transaction.error);
          };
        };
      }),
    { database: name, ids: keys },
  );
}

export { removeStoredData, storedRecords, uiStateData };

import type { UiState } from "./ui-state.ts";

const storeName = "ui-state";
class UiStateStorage {
  private db: IDBDatabase | null = null;
  private closed = false;

  async open(): Promise<unknown> {
    try {
      await new Promise<void>((resolve, reject) => {
        const request = indexedDB.open("sal-ui", 1);
        let blocked = false;
        request.onupgradeneeded = () => request.result.createObjectStore(storeName);
        request.onerror = () => reject(request.error);
        request.onblocked = () => {
          blocked = true;
          reject(new Error("UI state storage is blocked."));
        };
        request.onsuccess = () => {
          const db = request.result;
          db.onversionchange = () => this.close();
          if (blocked || this.closed) {
            db.close();
          } else {
            this.db = db;
          }
          resolve();
        };
      });
      return await new Promise<unknown>((resolve, reject) => {
        if (this.db === null) {
          resolve(undefined);
          return;
        }
        const transaction = this.db.transaction(storeName, "readonly");
        const request = transaction.objectStore(storeName).get("current");
        transaction.oncomplete = () => resolve(request.result);
        transaction.onerror = () => reject(transaction.error);
        transaction.onabort = () => reject(transaction.error);
      });
    } catch {
      return undefined;
    }
  }

  async save(state: UiState): Promise<void> {
    try {
      const { db } = this;
      if (db === null) {
        return;
      }
      await new Promise<void>((resolve, reject) => {
        const transaction = db.transaction(storeName, "readwrite");
        transaction.oncomplete = () => resolve();
        transaction.onerror = () => reject(transaction.error);
        transaction.onabort = () => reject(transaction.error);
        transaction.objectStore(storeName).put(state, "current");
      });
    } catch {
      // Disposable navigation state must not interrupt financial-data saves.
    }
  }

  close(): void {
    this.closed = true;
    this.db?.close();
    this.db = null;
  }
}

export { UiStateStorage };

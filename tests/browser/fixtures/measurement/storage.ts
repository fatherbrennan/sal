export function writeValue(database: IDBDatabase, mode: IDBTransactionMode): void {
  database.transaction("entries", mode).objectStore("entries").put("value", "key");
}

export function describeFailure(error: unknown): string {
  return String(error);
}

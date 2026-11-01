import { loadRecords, openDatabase, saveRecords } from "./data/database.ts";
import { leavePayDefaults, resolveOffer } from "./data/defaults.ts";
import type { Backup, SalRecord } from "./data/model.d.ts";
import { mergeImport, newRecord, readRecord, ruleVersion, schemaVersion } from "./data/schema.ts";
import { maxTextLength } from "./data/validation.ts";

interface Conflict {
  mine: SalRecord[];
  stored: SalRecord[];
}
function message(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  return "The operation failed.";
}
class Workspace {
  records = $state<SalRecord[]>([]);
  latestRecords = $state<SalRecord[]>([]);
  status = $state("Opening local data…");
  error = $state("");
  ready = $state(false);
  busy = $state(false);
  conflict = $state<Conflict | null>(null);
  storage = $state("");
  private db: IDBDatabase | null = null;
  private channel: BroadcastChannel | null = null;
  private persistenceRequest: Promise<void> | null = null;

  async open(): Promise<void> {
    try {
      this.db = await openDatabase();
      this.records = await loadRecords(this.db);
      this.latestRecords = this.records;
      this.ready = true;
      this.status = "Saved locally";
      this.channel = new BroadcastChannel("sal-records");
      this.channel.onmessage = () => {
        this.status = "Another tab saved changes. Your next save will check for conflicts.";
        this.refresh();
      };
    } catch (error) {
      this.error = message(error);
      this.status = "Local data unavailable";
    }
  }
  close(): void {
    this.channel?.close();
    this.db?.close();
  }
  private keepLatest(records: SalRecord[]): void {
    const known = new Map(this.latestRecords.map((record) => [record.id, record]));
    for (const record of records) {
      if ((known.get(record.id)?.revision ?? -1) <= record.revision) {
        known.set(record.id, record);
      }
    }
    const present = new Set(records.map((record) => record.id));
    this.latestRecords = [...known.values()].filter((record) => present.has(record.id));
  }
  private async refresh(): Promise<void> {
    try {
      if (this.db !== null) {
        this.keepLatest(await loadRecords(this.db));
      }
    } catch (failure) {
      this.error = `Unable to refresh another tab's saved inputs: ${message(failure)}`;
    }
  }
  find(id: string): SalRecord | undefined {
    return this.records.find((record) => record.id === id);
  }
  effectiveOffer(record: SalRecord, latest = false): SalRecord {
    return resolveOffer(
      record,
      this.settings("preferences", latest).fields,
      this.settings("vehicle", latest).fields,
    );
  }
  settings(kind: "profile" | "vehicle" | "preferences", latest = false): SalRecord {
    let { records } = this;
    if (latest) {
      records = this.latestRecords;
    }
    const record =
      records.find((entry) => entry.id === kind) ?? newRecord(kind, kind, new Date().toISOString());
    if (kind === "preferences") {
      return { ...record, fields: { ...leavePayDefaults, ...record.fields } };
    }
    return record;
  }
  async save(changes: SalRecord[]): Promise<boolean> {
    if (this.db === null || this.busy || this.conflict !== null) {
      this.error = "Wait for the current save or resolve the conflict before editing.";
      return false;
    }
    this.busy = true;
    this.error = "";
    this.status = "Saving…";
    try {
      const expected = Object.fromEntries(changes.map((record) => [record.id, record.revision]));
      const result = await saveRecords(this.db, changes, expected, new Date().toISOString());
      if (result.status === "conflict") {
        this.conflict = { mine: changes, stored: result.records };
        this.status = "Save conflict";
        return false;
      }
      this.records = result.records;
      this.keepLatest(result.records);
      this.status = "Saved locally";
      this.channel?.postMessage("saved");
      this.requestPersistence();
      return true;
    } catch (error) {
      this.error = message(error);
      this.status = "Save failed";
      return false;
    } finally {
      this.busy = false;
    }
  }
  private requestPersistence(): Promise<void> {
    if (this.persistenceRequest === null) {
      this.persistenceRequest = this.attemptPersistence();
    }
    return this.persistenceRequest;
  }
  private async attemptPersistence(): Promise<void> {
    this.storage = "Requesting browser storage protection…";
    try {
      const protectedStorage = await navigator.storage.persist();
      if (protectedStorage) {
        this.storage = "Browser storage protection granted. Keep JSON backups.";
      } else {
        this.storage = "Browser storage protection was not granted. Keep JSON backups.";
      }
    } catch {
      this.storage = "Browser storage protection is unavailable. Keep JSON backups.";
    }
  }
  async create(kind: "offer" | "comparison" | "formula"): Promise<string | null> {
    const record = newRecord(kind, crypto.randomUUID(), new Date().toISOString());
    if (kind === "comparison") {
      const { year = "" } = this.settings("preferences").fields;
      record.fields = { ...record.fields, year };
    }
    const saved = await this.save([record]);
    if (saved) {
      return record.id;
    }
    return null;
  }
  async edit(record: SalRecord): Promise<string | null> {
    try {
      const saved = await this.save([readRecord(record)]);
      if (!saved && this.conflict === null) {
        return this.error;
      }
      return null;
    } catch (error) {
      this.error = message(error);
      this.status = "Edit not saved";
      return this.error;
    }
  }
  async duplicateRecord(source: SalRecord): Promise<string | null> {
    const record = {
      ...source,
      id: crypto.randomUUID(),
      name: `Copy of ${source.name || `Untitled ${source.kind}`}`.slice(0, maxTextLength),
      revision: 0,
      updatedAt: new Date().toISOString(),
      archived: false,
    };
    if (await this.save([record])) {
      return record.id;
    }
    return null;
  }
  async resolve(choices: Record<string, "local" | "mine">): Promise<void> {
    const { conflict } = this;
    if (conflict === null) {
      return;
    }
    const changed: SalRecord[] = [];
    for (const mine of conflict.mine) {
      if (!Object.hasOwn(choices, mine.id)) {
        this.error = "Choose a version for every conflicting record.";
        return;
      }
      if (choices[mine.id] === "mine") {
        const stored = conflict.stored.find((record) => record.id === mine.id);
        changed.push({ ...mine, revision: stored?.revision ?? 0 });
      }
    }
    this.records = conflict.stored;
    this.keepLatest(conflict.stored);
    this.conflict = null;
    this.error = "";
    this.status = "Saved locally";
    if (changed.length > 0) {
      await this.save(changed);
    }
  }
  backup(): Backup {
    return {
      schemaVersion,
      ruleVersion,
      exportedAt: new Date().toISOString(),
      records: this.latestRecords,
    };
  }
  async import(
    records: SalRecord[],
    choices: Record<string, "local" | "import">,
  ): Promise<boolean> {
    try {
      const merged = mergeImport(this.records, records, choices).map((record) => ({
        ...record,
        revision: this.find(record.id)?.revision ?? 0,
      }));
      return await this.save(merged);
    } catch (error) {
      this.error = message(error);
      return false;
    }
  }
}

export { message, Workspace };

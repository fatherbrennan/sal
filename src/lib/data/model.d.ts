import type { EntityKind } from "../fields.ts";

type Fields = Record<string, string>;
interface Item {
  id: string;
  fields: Fields;
}
interface SalRecord {
  id: string;
  kind: EntityKind;
  name: string;
  revision: number;
  updatedAt: string;
  archived: boolean;
  fields: Fields;
  items: Record<string, Item[] | undefined>;
}
interface Backup {
  schemaVersion: 1;
  exportedAt: string;
  ruleVersion: string;
  records: SalRecord[];
}

export type { Backup, Fields, Item, SalRecord };

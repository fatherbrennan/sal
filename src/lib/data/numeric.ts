import type { Fields } from "./model.d.ts";

function numeric(fields: Fields, key: string): number | null {
  const value = fields[key];
  if (value === undefined || value === "") {
    return null;
  }
  return Number(value);
}

export { numeric };

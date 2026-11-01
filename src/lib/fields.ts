import { formulaSections } from "./fields/formula.ts";
import type { Section } from "./fields/helpers.ts";
import { offerSections } from "./fields/offer.ts";
import {
  comparisonSections,
  preferenceSections,
  profileSections,
  vehicleSections,
} from "./fields/settings.ts";

type EntityKind = "offer" | "profile" | "vehicle" | "preferences" | "comparison" | "formula";
const sections: Record<EntityKind, readonly Section[]> = {
  offer: offerSections,
  profile: profileSections,
  vehicle: vehicleSections,
  preferences: preferenceSections,
  comparison: comparisonSections,
  formula: formulaSections,
};
const groups: Record<EntityKind, readonly string[]> = {
  offer: ["earnings", "perks", "costs", "roster", "exceptions", "holidays", "taxOverride"],
  profile: [],
  vehicle: [],
  preferences: [],
  comparison: ["offers", "formulas"],
  formula: [],
};

export type { Choice, Field, Section } from "./fields/helpers.ts";
export type { EntityKind };
export { groups, sections };

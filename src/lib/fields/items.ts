import { answer, choices, type Field, field, frequency, inclusion, select } from "./helpers.ts";
import { rosterFields } from "./roster.ts";
import { profileSections } from "./settings.ts";

const itemFields: Record<string, readonly Field[] | undefined> = {
  earnings: [
    field("label", "Description", "text"),
    field("amount", "Annual amount (AUD)"),
    select("inclusion", "Includes super?", inclusion),
    answer("eligible", "Eligible for super?"),
    answer("included", "Already included in base quote?"),
    select(
      "certainty",
      "Certainty",
      choices([
        ["guaranteed", "Guaranteed"],
        ["target", "Target"],
      ]),
    ),
    select(
      "recurrence",
      "Recurrence",
      choices([
        ["recurring", "Recurring annually"],
        ["once", "One-off"],
      ]),
    ),
    select(
      "taxClass",
      "Tax character",
      choices([
        ["ordinary", "Established ordinary employment income"],
        ["other", "Other / unverified treatment"],
      ]),
    ),
  ],
  perks: [
    field("label", "Perk", "text"),
    field("amount", "Personal value (AUD)"),
    select("frequency", "Value frequency", frequency),
  ],
  costs: [
    field("label", "Cost", "text"),
    field("amount", "Cash paid (AUD)"),
    field(
      "reimbursement",
      "Separately reimbursed (AUD)",
      "decimal",
      "Reimbursement cannot exceed this expense. Any excess requires a separate established earnings classification.",
    ),
    select("frequency", "Cost frequency", frequency),
    select(
      "recurrence",
      "Recurrence",
      choices([
        ["recurring", "Recurring"],
        ["once", "One-off"],
      ]),
    ),
  ],
  roster: rosterFields,
  exceptions: [
    field("date", "Date", "date"),
    select(
      "kind",
      "Exception type",
      choices([
        ["leave", "Leave"],
        ["work", "Work-pattern change"],
      ]),
    ),
    field("hours", "Worked hours on this date"),
    select(
      "place",
      "Attendance",
      choices([
        ["onsite", "On site"],
        ["remote", "Remote / absent"],
      ]),
    ),
    field("journeys", "Return journeys"),
    field("label", "Reason / leave", "text"),
  ],
  holidays: [
    field("date", "Holiday date", "date"),
    field("start", "Starts (HH:MM)", "text"),
    field("hours", "Holiday duration (hours)"),
    field("label", "Holiday and locality", "text"),
  ],
  offers: [field("offerId", "Offer ID", "text")],
  formulas: [field("formulaId", "Formula ID", "text")],
  taxOverride: profileSections.flatMap((section) => section.fields),
};

export { itemFields };

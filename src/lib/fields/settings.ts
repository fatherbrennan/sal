import { pageWidthMaximum, pageWidthMinimum, pageWidthStep } from "../page-width.ts";
import { shortcutCommands } from "../shortcut-commands.ts";
import { defaultSections } from "./defaults.ts";
import { answer, choices, estimateMode, field, type Section, select } from "./helpers.ts";

const profileSections: readonly Section[] = [
  {
    title: "Personal tax settings",
    fields: [
      estimateMode,
      answer("resident", "Full-year Australian tax resident?"),
      answer("adult", "Adult, ordinary tax treatment (no SAPTO or special rates)?"),
      field("otherIncome", "Other annual assessable income before deductions (AUD)"),
      field("otherLabourIncome", "Other eligible labour income, included above (AUD)"),
      field("deductions", "Established other annual deductions (AUD)"),
      field(
        "otherSpecifiedDeductions",
        "Specified work deductions included in other deductions (AUD)",
      ),
      field("workDeductions", "Established employee work deductions (AUD)"),
      field(
        "specifiedWorkDeductions",
        "Specified deductions included in employee work deductions (AUD)",
      ),
      answer("standardDeduction", "Eligible for the 2026–27 employee standard deduction?"),
      select(
        "medicare",
        "Medicare circumstances",
        choices([
          [
            "ordinary",
            "Ordinary levy: no SAPTO, exemptions or special adjustments for either spouse",
          ],
          ["exempt", "Established full-year exemption"],
          ["other", "Partial exemption / other circumstances"],
        ]),
      ),
      answer(
        "hospitalCover",
        "Appropriate hospital cover for every required family member for the entire year?",
      ),
      answer("single", "Single with no dependants for the full year?"),
      select(
        "household",
        "Established full-year household",
        choices([
          ["single", "Single, no dependants"],
          ["single-with-dependants", "Single with qualifying dependants"],
          ["full-year-spouse", "Spouse for the full year"],
          ["other", "Changed during the year / other"],
        ]),
      ),
      field("spouseTaxableIncome", "Established spouse taxable income (whole AUD)"),
      field("spouseMlsIncome", "Established spouse income for Medicare surcharge (whole AUD)"),
      field("levyChildren", "Ordinary levy qualifying child count"),
      field("mlsChildren", "Medicare surcharge qualifying child count"),
      answer(
        "levyFamilyRelief",
        "Single with dependants: entitled to ordinary levy family reduction?",
      ),
      answer("helpFamilyOffer", "HELP section-8 family exception established with this offer?"),
      answer("helpFamilyBase", "HELP section-8 family exception established without this offer?"),
      answer(
        "assessmentComplete",
        "No other offsets, charges, special income or assessment adjustments?",
        "Confirm this for both annual scenarios. The subtotal excludes small-business offsets, other tax offsets, private-health rebate reconciliation, excess-contribution/Division 293 adjustments and special lump-sum or employee-share treatment. Select No if an applicable item remains outside the entered supported components.",
      ),
      answer("ordinaryMls", "Ordinary Medicare surcharge treatment, without special exclusions?"),
      field("mlsLiableDays", "Established Medicare surcharge liable days (0–365)"),
      field(
        "reportableBenefits",
        "Other reportable fringe benefits, excluding this offer (AUD)",
        "decimal",
        "Enter the established reportable amount for the selected income year. The offer amount is added separately; personal perk value is not a reporting value.",
      ),
      field("reportableSuper", "Other reportable super contributions, excluding this offer (AUD)"),
      field("investmentLoss", "Net investment losses (AUD)"),
      field("foreignIncome", "Exempt foreign employment income (AUD)"),
      answer("studyLoan", "Repayable study loan?"),
      select(
        "loanScheme",
        "Study loan scheme",
        choices([
          ["help", "HELP only"],
          ["other-or-multiple", "Other or multiple loan schemes"],
        ]),
      ),
      answer("helpEligible", "Ordinary HELP liability and debt conditions established?"),
      field("loanDebt", "Applicable repayable loan balance (AUD)"),
      field("taxNotes", "Special circumstances and source notes", "text"),
    ],
  },
];
const vehicleSections: readonly Section[] = [
  {
    title: "Shared vehicle settings",
    fields: [
      select(
        "energy",
        "Energy units",
        choices([
          ["fuel", "Fuel (litres)"],
          ["electric", "Electricity (kWh)"],
          ["none", "No vehicle energy cost"],
        ]),
      ),
      field("energyPrice", "Energy price (AUD per litre / kWh)"),
      field("consumption", "Consumption per 100 km"),
      field("source", "Price / consumption evidence", "text"),
    ],
  },
];
const preferenceSections: readonly Section[] = [
  {
    title: "Keyboard shortcuts",
    fields: shortcutCommands.map((command) => field(command.id, command.action, "text")),
  },
  {
    title: "Preferences",
    fields: [
      select(
        "year",
        "Financial year",
        choices([
          ["2026-27", "2026–27"],
          ["2025-26", "2025–26"],
        ]),
      ),
    ],
  },
  ...defaultSections,
  {
    title: "Appearance preferences",
    fields: [
      select(
        "pageWidth",
        "Page width",
        Array.from(
          { length: (pageWidthMaximum - pageWidthMinimum) / pageWidthStep + 1 },
          (_, index) => {
            const width = pageWidthMinimum + index * pageWidthStep;
            return { value: String(width), label: `${width}%` };
          },
        ),
      ),
      answer("inspectorPinned", "Pin calculation inspector beside comparison when space permits?"),
      select(
        "appearance",
        "Appearance",
        choices([
          ["system", "Follow system"],
          ["light", "Light"],
          ["dark", "Dark"],
        ]),
      ),
      select(
        "fontSize",
        "Font size",
        choices([
          ["10", "10"],
          ["12", "12"],
          ["14", "14"],
          ["16", "16"],
          ["18", "18"],
          ["20", "20"],
          ["24", "24"],
        ]),
      ),
    ],
  },
];
const comparisonSections: readonly Section[] = [
  {
    title: "Comparison settings",
    fields: [
      select(
        "year",
        "Financial year",
        choices([
          ["2026-27", "2026–27"],
          ["2025-26", "2025–26"],
        ]),
      ),
      answer("timeValue", "Include monetary commute time valuation?"),
      field("baseline", "Baseline offer ID", "text"),
    ],
  },
];

export { comparisonSections, preferenceSections, profileSections, vehicleSections };

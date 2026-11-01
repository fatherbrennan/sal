import { annualLeaveFields } from "./annual-leave.ts";
import {
  answer,
  choices,
  estimateMode,
  field,
  inclusion,
  type Section,
  select,
} from "./helpers.ts";

const offerSections: readonly Section[] = [
  {
    title: "Employment and pay",
    fields: [
      estimateMode,
      select(
        "employment",
        "Employment type",
        choices([
          ["full-time", "Full-time employee"],
          ["part-time", "Part-time employee"],
          ["casual", "Casual employee"],
          ["fixed-term", "Fixed-term employee"],
          ["apprentice", "Apprentice / trainee"],
          ["labour-hire", "Labour-hire employee"],
          ["other-employee", "Other employee arrangement"],
          ["sole-trader", "Sole-trader contractor"],
        ]),
      ),
      field("employer", "Employer or client", "text"),
      field("role", "Role", "text"),
      field("amount", "Base salary or revenue (AUD)"),
      select(
        "unit",
        "Quoted unit",
        choices([
          ["annual", "Per year"],
          ["hour", "Per hour"],
          ["day", "Per day"],
        ]),
      ),
      field(
        "paidUnits",
        "Annual paid / billable hours or days",
        "decimal",
        "For hourly or daily quotes. Enter the annual paid quantity; attendance does not determine earnings.",
      ),
      select("inclusion", "Base amount includes super?", inclusion),
      field("weeklyHours", "Standard paid hours per week"),
      field("weeks", "Standard weeks per year"),
      select(
        "payFrequency",
        "Pay frequency",
        choices([
          ["weekly", "Weekly"],
          ["fortnightly", "Fortnightly"],
          ["monthly", "Monthly"],
        ]),
      ),
      answer("threshold", "Claim the tax-free threshold from this payer?"),
      answer("tfnProvided", "TFN supplied to this payer?"),
      answer(
        "noPaygAdjustments",
        "Ordinary payroll, with no withholding variations or adjustments?",
      ),
      answer("regularPay", "Base cash is paid in equal ordinary pay periods?"),
      answer("ordinaryPayroll", "Ordinary employee withholding rules apply?"),
      field(
        "periodSacrifice",
        "Representative pay period: salary sacrifice to super (AUD)",
        "decimal",
        "Enter the amount under an established valid salary-sacrifice arrangement, or explicit zero. Unknown leaves PAYG unavailable. Do not derive it from a perk value.",
      ),
      field("periodPersonalSuper", "Representative pay period: personal super deducted (AUD)"),
      field("periodOtherDeductions", "Representative pay period: other payroll deductions (AUD)"),
      field(
        "reportableBenefitsOffer",
        "Reportable fringe benefits from this offer (AUD)",
        "decimal",
        "Enter the established reporting amount for the selected income year, separate from other employers and personal perk values. The FBT year and income year differ.",
      ),
      field(
        "reportableSuperOffer",
        "Reportable super from this offer for the selected income year (AUD)",
        "decimal",
        "Use the established reporting amount. Include applicable salary sacrifice and other reportable contributions; exclude compulsory SG and non-deducted personal contributions. Reporting year and fund receipt year are distinct.",
      ),
      answer(
        "reportableSuperSameYear",
        "All entered annual salary sacrifice is reportable in the selected income year?",
        "Confirm only when the reporting basis is established. Yes requires reportable super to include at least the entered sacrifice. No or unknown does not change your separately established reportable amount.",
      ),
      field(
        "annualLeave",
        "Annual leave entitlement (weeks)",
        "decimal",
        "Editable entitlement, not leave taken or an unused balance. Confirm additional shiftworker, award or contractual weeks. Enter leave dates separately.",
      ),
      answer(
        "ordinaryLeave",
        "Ordinary 4-week annual leave entitlement confirmed?",
        "Confirm national-system coverage, non-casual employment, and no additional shiftworker, award, agreement or contract entitlement. Sets an editable entitlement only; leave taken still requires dates.",
      ),
      field(
        "terms",
        "Offer conditions and fit",
        "text",
        "Optional notes: schedule control, workload, team, career prospects, role fit, travel reliability, useful benefits, leave rules, restrictions and repayment clauses. Record known terms separately from personal impressions; these notes do not change calculations.",
      ),
    ],
  },
  { title: "Paid annual leave", fields: annualLeaveFields },
  {
    title: "Super and contributions",
    fields: [
      field(
        "superRate",
        "Employer super (%)",
        "decimal",
        "Starts at the statutory minimum for the selected years. Higher contractual contributions may have different limits.",
      ),
      answer(
        "superEligible",
        "Base cash eligible for employer super?",
        "Yes means the entire base is eligible; No means it is wholly ineligible. Leave unknown for mixed ordinary/overtime earnings until the separate amounts and treatment are established.",
      ),
      select(
        "superLimit",
        "Employer contribution limit",
        choices([
          ["statutory", "Statutory minimum limits"],
          ["uncapped", "Contract expressly pays this rate without a cap"],
        ]),
        "Limits the earnings used for minimum employer super: $62,500 per quarter in 2025–26; $270,830 per employer for 2026–27. A contract can promise more. This is separate from your personal contribution tax cap.",
      ),
      field(
        "sacrifice",
        "Annual salary sacrificed to super (AUD)",
        "decimal",
        "Enter valid super salary sacrifice from this offer's annual cash pay. This does not establish the contribution's reporting year or fund receipt year; confirm those separately.",
      ),
      field("personalSuper", "Annual non-deducted personal super (AUD)"),
      answer(
        "evenSuper",
        "2025–26 eligible earnings are evenly allocated across all four quarters?",
      ),
      select(
        "ordinaryFund",
        "Super contribution model",
        choices([
          ["yes", "Ordinary taxed accumulation estimate"],
          ["no", "Other or unverified treatment"],
        ]),
        "The ordinary estimate uses 15% contribution tax, supplied-TFN and matching-year conditions. It excludes excess-contribution adjustments, Division 293, fund releases, LISTO, co-contributions and special funds. It estimates contributions only, excluding fees, insurance and investment returns.",
      ),
    ],
  },
  {
    title: "Contractor revenue and costs",
    fields: [
      select(
        "gst",
        "Revenue GST basis",
        choices([
          ["none", "No GST applies"],
          ["exclusive", "Excludes GST"],
          ["inclusive", "Includes 10% GST on all quoted services"],
        ]),
      ),
      field("businessCosts", "Annual business cash costs, excluding recoverable GST (AUD)"),
      field("businessDeductions", "Established annual business deductions (AUD)"),
      field("eligibleLabour", "Established eligible labour income, included in revenue (AUD)"),
      field(
        "specifiedDeductions",
        "Specified work deductions included in business deductions (AUD)",
      ),
      field("contractorSuper", "Annual hirer-funded super, additional to fees (AUD)"),
      field("contractorPersonalSuper", "Annual non-deducted personal super contribution (AUD)"),
      field("contractorNotes", "GST, PSI/PSB and tax classification evidence", "text"),
    ],
  },
  {
    title: "Work calendar",
    fields: [
      field("rosterAnchor", "Roster cycle starts", "date"),
      field("cycleDays", "Days in repeating cycle"),
      answer(
        "rosterComplete",
        "Repeating roster is complete?",
        "Confirm every work block is entered. A confirmed empty roster means no repeating work; an unfinished roster leaves attendance unavailable.",
      ),
      answer("holidaysWorked", "Normally work rostered public holidays?"),
      field("location", "Work-base state and locality", "text"),
      answer(
        "calendarComplete",
        "Applicable holiday dates have been checked?",
        "Include local, substituted and partial-day holidays. Unknown calendar coverage leaves attendance estimates incomplete.",
      ),
      field("calendarSource", "Holiday calendar source / verification note", "text"),
    ],
  },
  {
    title: "Commuting",
    fields: [
      select(
        "tripBasis",
        "Journey entry",
        choices([
          ["return", "Return-trip totals"],
          ["legs", "Separate outward and return legs"],
        ]),
      ),
      field("distance", "Return distance (km)"),
      field("minutes", "Return travel time (minutes)"),
      field("outDistance", "Outward distance (km)"),
      field("backDistance", "Return-leg distance (km)"),
      field("outMinutes", "Outward time (minutes)"),
      field("backMinutes", "Return-leg time (minutes)"),
      select(
        "costMethod",
        "Vehicle cost method",
        choices([
          ["entered", "Entered running costs"],
          ["ato", "Broader ATO kilometre-rate estimate"],
        ]),
      ),
      select(
        "energy",
        "Energy units",
        choices([
          ["fuel", "Litres per 100 km"],
          ["electric", "kWh per 100 km"],
          ["none", "No vehicle energy cost"],
        ]),
      ),
      field(
        "energyPrice",
        "Override energy price (AUD per litre / kWh)",
        "decimal",
        "Shared values apply only to matching energy units. Blank means unknown.",
      ),
      field(
        "consumption",
        "Override consumption per 100 km",
        "decimal",
        "Shared values apply only to matching energy units. Blank means unknown.",
      ),
      field("maintenance", "Running maintenance per km (AUD)"),
      field("tripCharges", "Parking, tolls, fares per return journey (AUD)"),
      field("commuteNotes", "Route, fares and estimate evidence", "text"),
    ],
  },
];

export { offerSections };

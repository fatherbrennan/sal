import type { Section } from "./helpers.ts";
import { offerSections } from "./offer.ts";
import { offerGroups } from "./order.ts";
import { rosterFields } from "./roster.ts";

const sharedKeys = new Set(
  (
    "estimateMode employment unit weeklyHours weeks payFrequency threshold annualLeave leaveRateBasis " +
    "superRate superLimit ordinaryFund sacrifice personalSuper periodPersonalSuper " +
    "periodOtherDeductions reportableBenefitsOffer businessCosts businessDeductions " +
    "contractorSuper contractorPersonalSuper holidaysWorked tripBasis costMethod maintenance tripCharges"
  ).split(" "),
);
const definitions = [
  ...offerSections.flatMap(({ fields }) => fields).filter(({ key }) => sharedKeys.has(key)),
  ...rosterFields.filter(({ key }) => !["day", "hours"].includes(key)),
];
function shared(title: string, keys: string): Section {
  return {
    title: `Shared defaults: ${title}`,
    fields: keys.split(" ").flatMap((key) => definitions.filter((field) => field.key === key)),
  };
}
const defaultSections: readonly Section[] = [
  shared("Pay details", offerGroups["Pay details"]),
  shared("Work pattern", "place start breakStart breakMinutes journeys holidaysWorked"),
  shared("Paid annual leave", "annualLeave leaveRateBasis"),
  shared("Commuting costs", offerGroups["Commuting costs"]),
  shared("Sole-trader costs", offerGroups["Sole-trader costs"]),
  shared(
    "Extra contributions and payroll settings",
    `${offerGroups["Extra contributions and payroll settings"]} ordinaryFund estimateMode`,
  ),
  shared("Tax reporting amounts", offerGroups["Tax reporting amounts"]),
];

export { defaultSections, sharedKeys };

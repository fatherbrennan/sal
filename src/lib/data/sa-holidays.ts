import type { Item } from "./model.d.ts";

const holidaySource = "https://www.safework.sa.gov.au/resources/public-holidays";
// Statewide dates and partial-day intervals verified against SafeWork SA on 24 October 2026.
const dates: readonly (readonly [string, string])[] = [
  ["2025-10-06", "Labour Day"],
  ["2025-12-24", "Christmas Eve"],
  ["2025-12-25", "Christmas Day"],
  ["2025-12-26", "Proclamation Day"],
  ["2025-12-31", "New Year's Eve"],
  ["2026-01-01", "New Year's Day"],
  ["2026-01-26", "Australia Day"],
  ["2026-03-09", "Adelaide Cup Day"],
  ["2026-04-03", "Good Friday"],
  ["2026-04-04", "Easter Saturday"],
  ["2026-04-05", "Easter Sunday"],
  ["2026-04-06", "Easter Monday"],
  ["2026-04-25", "ANZAC Day"],
  ["2026-06-08", "King's Birthday"],
  ["2026-10-05", "Labour Day"],
  ["2026-12-24", "Christmas Eve"],
  ["2026-12-25", "Christmas Day"],
  ["2026-12-26", "Proclamation Day"],
  ["2026-12-28", "Additional Proclamation Day holiday"],
  ["2026-12-31", "New Year's Eve"],
  ["2027-01-01", "New Year's Day"],
  ["2027-01-26", "Australia Day"],
  ["2027-03-08", "Adelaide Cup Day"],
  ["2027-03-26", "Good Friday"],
  ["2027-03-27", "Easter Saturday"],
  ["2027-03-28", "Easter Sunday"],
  ["2027-03-29", "Easter Monday"],
  ["2027-04-25", "ANZAC Day"],
  ["2027-06-14", "King's Birthday"],
];

function saHolidays(): Item[] {
  return dates.map(([date, label]) => {
    const partial = date.endsWith("-12-24") || date.endsWith("-12-31");
    let start = "00:00";
    let hours = "24";
    if (partial) {
      start = "19:00";
      hours = "5";
    }
    return {
      id: `sa-${date}`,
      fields: { date, label, start, hours },
    };
  });
}

export { holidaySource, saHolidays };

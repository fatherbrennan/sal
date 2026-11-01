const moneyFormat = new Intl.NumberFormat("en-AU", {
  style: "currency",
  currency: "AUD",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});
const numberFormat = new Intl.NumberFormat("en-AU", { maximumFractionDigits: 2 });
const calculatorUnitSuffix = /(?:\/L| percentage points)$/u;
function display(amount: number | null, unit: "money" | "number" | "percent" = "money"): string {
  if (amount === null || !Number.isFinite(amount)) {
    return "Unavailable";
  }
  if (unit === "number") {
    return numberFormat.format(amount);
  }
  if (unit === "percent") {
    return `${numberFormat.format(amount)}%`;
  }
  return moneyFormat.format(amount);
}

function calculatorDisplayValue(text: string): string {
  return text.replace(calculatorUnitSuffix, "");
}

export { calculatorDisplayValue, display };

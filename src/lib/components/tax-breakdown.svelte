<script lang="ts">
import type { ComparisonResult } from "../calculations/comparison.ts";
import { calculateRepresentativePayroll } from "../calculations/tax/payroll.ts";
import { calculatePayrollHourly } from "../calculations/tax/payroll-hourly.ts";
import { TAX_SOURCES } from "../calculations/tax/sources.ts";
import type { TaxAmount, TaxYear } from "../calculations/tax/types.d.ts";
import type { SalRecord } from "../data/model.d.ts";
import { numeric } from "../data/numeric.ts";
import { allocatedHoursEquation, payrollEquation } from "../explanations/payroll.ts";
import { annualEquation } from "../explanations/tax.ts";
import { annualNames } from "../explanations/tax-context.ts";
import { display } from "../format.ts";
import EquationPopup from "./equation-popup.svelte";

let { result, offer, year }: { result: ComparisonResult; offer: SalRecord; year: TaxYear } =
  $props();
const labels = new Map([
  ["basicIncomeTax", "Basic income tax"],
  ["lito", "Low income tax offset"],
  ["incomeTaxAfterLito", "Income tax after low income tax offset"],
  ["medicare", "Medicare levy"],
  ["mls", "Medicare levy surcharge"],
  ["help", "HELP repayment"],
  ["rawComponentSubtotal", "Estimated personal tax and HELP repayments"],
  ["finalAssessment", "Final assessed tax"],
]);
let payroll = $derived(
  calculateRepresentativePayroll({
    year,
    annualBaseCash: result.baseCash,
    profile: result.profile,
    payer: result.payer,
  }),
);
let hourly = $derived(
  calculatePayrollHourly({
    payroll,
    weeklyHours: numeric(offer.fields, "weeklyHours"),
    weeks: numeric(offer.fields, "weeks"),
  }),
);
function amountText(amount: TaxAmount): string {
  if (amount.status === "available") {
    return display(amount.amount);
  }
  return amount.reason;
}
let equationContext = $derived({ result, payroll, hourly });
const frequencySuffix = /ly$/u;
function periodLabel(label: string, perHour: boolean): string {
  if (perHour) {
    return `${label} per standard paid hour`;
  }
  return `${label} per ${payroll.period?.replace(frequencySuffix, "") ?? "pay period"}`;
}
</script>
{#snippet taxAmount(amount: TaxAmount, label: string)}
  <span
    class:numeric={amount.status === "available"}
    data-calculator-value={(amount.status === "available" && amountText(amount)) || ""}
    data-calculator-label={label}
    >{amountText(amount)}</span
  >
{/snippet}
{#snippet annualLabel(key: string, label: string)}
  <EquationPopup
    {label}
    equations={() => [
      annualEquation(key, result.tax.withOffer, result, { title: `${offer.name} · with offer` }),
      annualEquation(key, result.tax.withoutOffer, result, {
        title: `${offer.name} · without offer`,
        withoutOffer: true,
      }),
    ]}
  />
{/snippet}
{#snippet payrollLabel(
  key: string,
  label: string,
  amount: TaxAmount,
  period: import("../calculations/tax/types.d.ts").PaygRulePeriod | null = null,
  perHour = false,
)}
  <EquationPopup
    label={periodLabel(label, perHour)}
    equations={() => [payrollEquation(key, amount, equationContext, { period, perHour })]}
  />
{/snippet}
<div class="breakdown" data-calculator-context={offer.id}>
  <table>
    <caption>
      Personal annual tax and HELP estimates
    </caption>
    <thead>
      <tr>
        <th scope="col">Component</th>
        <th scope="col">With offer</th>
        <th scope="col">Without offer</th>
      </tr>
    </thead>
    <tbody>
      {#each Object.entries(result.tax.withOffer.annual).filter(([key]) =>
        labels.has(key),
      ) as [key, amount] (key)}
        {#if typeof amount !== "string"}
          <tr>
            <th scope="row">{@render annualLabel(key, labels.get(key) ?? key)}</th>
            <td>{@render taxAmount(amount, `${annualNames[key]}[with_offer]`)}</td>
            <td>
              {#each Object.entries(result.tax.withoutOffer.annual).filter(
                ([baselineKey]) => baselineKey === key,
              ) as [baselineKey, baselineAmount] (baselineKey)}
                {#if typeof baselineAmount !== "string"}
                  {@render taxAmount(baselineAmount, `${annualNames[key]}[without_offer]`)}
                {/if}
              {/each}
            </td>
          </tr>
        {/if}
      {/each}
    </tbody>
  </table>
  <p>
    Offer-attributed tax is the difference between the valid annual scenarios with and without this
    offer. It is separate from payroll withholding.
  </p>
  {#if result.tax.incrementalTax.status === "unavailable"}
    <p class="notice">{result.tax.incrementalTax.reason}</p>
  {/if}
  <details>
    <summary>Without-offer baseline and taxable income</summary>
    <table>
      <thead>
        <tr>
          <th scope="col">Income / deduction</th>
          <th scope="col">With offer</th>
          <th scope="col">Without offer</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <th scope="row">
            {@render annualLabel("standardDeduction", "Employee standard deduction")}
          </th>
          <td>
            {@render taxAmount(
              result.tax.withOffer.standardDeduction,
              "standard_deduction[with_offer]",
            )}
          </td>
          <td>
            {@render taxAmount(
              result.tax.withoutOffer.standardDeduction,
              "standard_deduction[without_offer]",
            )}
          </td>
        </tr>
        <tr>
          <th scope="row">
            {@render annualLabel("derivedTaxableIncome", "Derived taxable income")}
          </th>
          <td>
            {@render taxAmount(
              result.tax.withOffer.derivedTaxableIncome,
              "derived_taxable_income[with_offer]",
            )}
          </td>
          <td>
            <span
              class:numeric={result.tax.withoutOffer.derivedTaxableIncome.status === "available"}
              data-calculator-value={(result.tax.withoutOffer.derivedTaxableIncome.status ===
                "available" &&
                amountText(result.tax.withoutOffer.derivedTaxableIncome)) ||
                ""}
              data-calculator-label="derived_taxable_income[without_offer]"
              >{amountText(result.tax.withoutOffer.derivedTaxableIncome)}</span
            >
          </td>
        </tr>
        <tr>
          <th scope="row">
            {@render annualLabel("taxableInput", "Taxable income used for estimate")}
          </th>
          <td>
            {@render taxAmount(result.tax.withOffer.taxableInput, "taxable_income[with_offer]")}
          </td>
          <td>
            {@render taxAmount(
              result.tax.withoutOffer.taxableInput,
              "taxable_income[without_offer]",
            )}
          </td>
        </tr>
      </tbody>
    </table>
    {#if result.tax.withOffer.approximation}
      <p>{result.tax.withOffer.approximation}</p>
    {/if}
    {#if result.tax.withoutOffer.approximation}
      <p>{result.tax.withoutOffer.approximation}</p>
    {/if}
  </details>
  <h4>Representative payslip estimates</h4>
  <p>
    Equal base-pay periods only. Bonuses, commissions and special payments require their own
    withholding treatment. These are representative amounts, not a dated deposit schedule.
  </p>
  <p>{payroll.conversionNote}</p>
  <dl>
    <dt>
      {@render payrollLabel("grossBaseCash", "Base cash pay before tax", payroll.grossBaseCash)}
    </dt>
    <dd>
      {@render taxAmount(payroll.grossBaseCash, "period_gross_cash_pay")}
    </dd>
    <dt>
      {@render payrollLabel(
        "salarySacrifice",
        "Salary sacrifice to super",
        payroll.salarySacrifice,
      )}
    </dt>
    <dd>
      {@render taxAmount(payroll.salarySacrifice, "period_salary_sacrifice")}
    </dd>
    <dt>
      {@render payrollLabel("taxablePay", "Pay subject to PAYG withholding", payroll.taxablePay)}
    </dt>
    <dd>
      {@render taxAmount(payroll.taxablePay, "period_payg_earnings")}
    </dd>
    <dt>
      {@render payrollLabel(
        "personalSuper",
        "Personal super deducted from after-tax pay",
        payroll.personalSuper,
      )}
    </dt>
    <dd>
      {@render taxAmount(payroll.personalSuper, "period_personal_super_contribution")}
    </dd>
    <dt>
      {@render payrollLabel(
        "otherDeductions",
        "Other deductions from after-tax pay",
        payroll.otherDeductions,
      )}
    </dt>
    <dd>
      {@render taxAmount(payroll.otherDeductions, "period_other_post_tax_deductions")}
    </dd>
  </dl>
  {#each payroll.rulePeriods as pay (pay.rulePeriod)}
    <h5>{pay.rulePeriod}</h5>
    <dl>
      <dt>
        {@render payrollLabel(
          "ordinary",
          "PAYG withholding before study-loan adjustment",
          pay.withholding.ordinary,
          pay.rulePeriod,
        )}
      </dt>
      <dd>
        {@render taxAmount(pay.withholding.ordinary, `period_ordinary_payg[${pay.rulePeriod}]`)}
      </dd>
      <dt>
        {@render payrollLabel(
          "loanIncrement",
          "Additional study-loan withholding",
          pay.withholding.loanIncrement,
          pay.rulePeriod,
        )}
      </dt>
      <dd>
        {@render taxAmount(
          pay.withholding.loanIncrement,
          `period_study_loan_withholding[${pay.rulePeriod}]`,
        )}
      </dd>
      <dt>
        {@render payrollLabel(
          "combined",
          "Total PAYG withholding",
          pay.withholding.combined,
          pay.rulePeriod,
        )}
      </dt>
      <dd>
        {@render taxAmount(pay.withholding.combined, `period_total_payg[${pay.rulePeriod}]`)}
      </dd>
      <dt>
        {@render payrollLabel(
          "cash",
          "Cash after withholding, before after-tax deductions",
          pay.cashAfterWithholding,
          pay.rulePeriod,
        )}
      </dt>
      <dd>
        {@render taxAmount(
          pay.cashAfterWithholding,
          `period_cash_after_withholding[${pay.rulePeriod}]`,
        )}
      </dd>
      <dt>
        {@render payrollLabel(
          "bankEstimate",
          "Estimated payslip cash after deductions",
          pay.bankEstimate,
          pay.rulePeriod,
        )}
      </dt>
      <dd>
        {@render taxAmount(pay.bankEstimate, `period_bank_cash_estimate[${pay.rulePeriod}]`)}
      </dd>
    </dl>
  {/each}
  <details>
    <summary>Rule sources</summary>
    <ul>
      {#each [...TAX_SOURCES] as [id, source] (id)}
        <li><a href={source} target="_blank" rel="noreferrer">{id}</a></li>
      {/each}
    </ul>
    <p>Sources open only when selected; calculations never contact these sites.</p>
  </details>
  <details>
    <summary>Representative payslip estimates per standard paid hour</summary>
    <p>{hourly.denominatorNote}</p>
    <p>
      <EquationPopup
        label="Allocated standard paid hours in this period"
        equations={() => [allocatedHoursEquation(equationContext)]}
      />:
      <span
        class:numeric={hourly.allocatedPeriodHours !== null}
        data-calculator-value={(hourly.allocatedPeriodHours !== null &&
          display(hourly.allocatedPeriodHours, "number")) ||
          ""}
        data-calculator-label="allocated_period_paid_hours"
        >{display(hourly.allocatedPeriodHours, "number")}</span
      >
    </p>
    <dl>
      <dt>
        {@render payrollLabel(
          "grossBaseCash",
          "Base cash pay before tax",
          hourly.grossBaseCash,
          null,
          true,
        )}
      </dt>
      <dd>
        {@render taxAmount(hourly.grossBaseCash, "period_gross_cash_pay_per_hour")}
      </dd>
      <dt>
        {@render payrollLabel(
          "salarySacrifice",
          "Salary sacrifice to super",
          hourly.salarySacrifice,
          null,
          true,
        )}
      </dt>
      <dd>
        {@render taxAmount(hourly.salarySacrifice, "period_salary_sacrifice_per_hour")}
      </dd>
      <dt>
        {@render payrollLabel(
          "taxablePay",
          "Pay subject to PAYG withholding",
          hourly.taxablePay,
          null,
          true,
        )}
      </dt>
      <dd>
        {@render taxAmount(hourly.taxablePay, "period_payg_earnings_per_hour")}
      </dd>
      <dt>
        {@render payrollLabel(
          "personalSuper",
          "Personal super deducted from after-tax pay",
          hourly.personalSuper,
          null,
          true,
        )}
      </dt>
      <dd>
        {@render taxAmount(hourly.personalSuper, "period_personal_super_contribution_per_hour")}
      </dd>
      <dt>
        {@render payrollLabel(
          "otherDeductions",
          "Other deductions from after-tax pay",
          hourly.otherDeductions,
          null,
          true,
        )}
      </dt>
      <dd>
        {@render taxAmount(hourly.otherDeductions, "period_other_post_tax_deductions_per_hour")}
      </dd>
    </dl>
    {#each hourly.rulePeriods as pay (pay.rulePeriod)}
      <h5>{pay.rulePeriod}</h5>
      <dl>
        <dt>
          {@render payrollLabel(
            "ordinary",
            "PAYG withholding before study-loan adjustment",
            pay.withholding.ordinary,
            pay.rulePeriod,
            true,
          )}
        </dt>
        <dd>
          {@render taxAmount(
            pay.withholding.ordinary,
            `period_ordinary_payg_per_hour[${pay.rulePeriod}]`,
          )}
        </dd>
        <dt>
          {@render payrollLabel(
            "loanIncrement",
            "Additional study-loan withholding",
            pay.withholding.loanIncrement,
            pay.rulePeriod,
            true,
          )}
        </dt>
        <dd>
          {@render taxAmount(
            pay.withholding.loanIncrement,
            `period_study_loan_withholding_per_hour[${pay.rulePeriod}]`,
          )}
        </dd>
        <dt>
          {@render payrollLabel(
            "combined",
            "Total PAYG withholding",
            pay.withholding.combined,
            pay.rulePeriod,
            true,
          )}
        </dt>
        <dd>
          {@render taxAmount(
            pay.withholding.combined,
            `period_total_payg_per_hour[${pay.rulePeriod}]`,
          )}
        </dd>
        <dt>
          {@render payrollLabel(
            "cash",
            "Cash after withholding, before after-tax deductions",
            pay.cashAfterWithholding,
            pay.rulePeriod,
            true,
          )}
        </dt>
        <dd>
          {@render taxAmount(
            pay.cashAfterWithholding,
            `period_cash_after_withholding_per_hour[${pay.rulePeriod}]`,
          )}
        </dd>
        <dt>
          {@render payrollLabel(
            "bankEstimate",
            "Estimated payslip cash after deductions",
            pay.bankEstimate,
            pay.rulePeriod,
            true,
          )}
        </dt>
        <dd>
          {@render taxAmount(
            pay.bankEstimate,
            `period_bank_cash_estimate_per_hour[${pay.rulePeriod}]`,
          )}
        </dd>
      </dl>
    {/each}
  </details>
</div>

<style>
table {
  width: 100%;
  border-collapse: collapse;
}
th,
td {
  text-align: left;
  border-bottom: 1px solid var(--divider);
  padding: 0.5rem;
  vertical-align: top;
  overflow-wrap: anywhere;
}
dl {
  display: grid;
  grid-template-columns: minmax(0, 2fr) minmax(0, 1fr);
  gap: 0.5rem;
}
dd {
  margin: 0;
  overflow-wrap: anywhere;
}
td:has(.numeric),
dd:has(.numeric) {
  text-align: right;
}
ul {
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
}
</style>

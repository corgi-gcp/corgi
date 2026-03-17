---
name: pro-forma-financials
description: "Generate Document 9 — Pro Forma Financial Statements for the SEIC Utah captive filing. Use this skill whenever the user asks to generate or update the pro forma financials, balance sheet, income statement, or cash flow statement for the captive. Triggers include: 'generate pro forma financials', 'create financial statements', 'build the balance sheet', 'Document 9', 'pro forma statements', 'income statement', 'cash flow statement', 'GAAP financials', or 'SAP financials'."
---

# Pro Forma Financial Statements (Document 9)

This skill generates the formal pro forma financial statements for SEIC's Utah captive filing. Unlike the projections table in Doc 8 (which is a management summary), these are structured as proper statutory accounting (SAP) financial statements as required by the Utah DOI.

## Document Purpose

The pro forma financials present the captive's expected financial position in standard insurance accounting format for Years 1–3. They give the regulator a clear picture of the captive's balance sheet, underwriting results, and cash position — formatted in the same way the captive will report annually after approval.

## Statements Produced

Three statements, one set per year (Years 1, 2, and 3):

1. **Statutory Balance Sheet** (Statement of Financial Position)
2. **Statutory Income Statement** (Statement of Operations / Underwriting Statement)
3. **Statement of Cash Flows**

Plus a **Notes to Financial Statements** section covering key accounting policies.

---

## Data Source

All figures drawn from `data.json`. Primary sources:

| Field | Source |
|---|---|
| Opening surplus / capitalization | `capitalization.total_capitalization` |
| Gross written premium per year | `projections[n].gross_written_premium` |
| Net written premium per year | `projections[n].net_written_premium` |
| Net earned premium per year | `projections[n].net_earned_premium` |
| Losses incurred per year | `projections[n].losses_incurred` |
| Operating expenses per year | `projections[n].operating_expenses` |
| Net income per year | `projections[n].net_income` |
| Surplus end of year | `projections[n].surplus_end_of_year` |
| Investment return | `investment_policy.assumed_return_pct` |
| Loss reserves | Derived: 50% of current year losses incurred (standard assumption if actuary not specified) |

---

## Statement Structures

### 1. Statutory Balance Sheet

```
SPORTS AND ENTERTAINMENT INSURANCE COMPANY, INC.
STATUTORY BALANCE SHEET (PRO FORMA)
As of December 31, Year [N]

ASSETS
  Invested Assets
    Cash and Cash Equivalents                    $X,XXX,XXX
    Fixed Maturity Securities                    $X,XXX,XXX
    Total Invested Assets                        $X,XXX,XXX

  Non-Invested Assets
    Premiums Receivable                          $X,XXX,XXX
    Reinsurance Recoverables                     $X,XXX,XXX
    Other Assets                                 $X,XXX,XXX
    Total Non-Invested Assets                    $X,XXX,XXX

  TOTAL ASSETS                                  $X,XXX,XXX

LIABILITIES
  Loss and Loss Adjustment Expense Reserves     $X,XXX,XXX
  Unearned Premium Reserve                      $X,XXX,XXX
  Reinsurance Payable                           $X,XXX,XXX
  Accounts Payable and Accrued Expenses         $X,XXX,XXX
  Total Liabilities                             $X,XXX,XXX

SURPLUS
  Paid-In Capital                               $X,XXX,XXX
  Paid-In Surplus                               $X,XXX,XXX
  Retained Earnings (Deficit)                   $X,XXX,XXX
  Total Surplus                                 $X,XXX,XXX

  TOTAL LIABILITIES AND SURPLUS                 $X,XXX,XXX
```

### 2. Statutory Income Statement

```
SPORTS AND ENTERTAINMENT INSURANCE COMPANY, INC.
STATEMENT OF OPERATIONS (PRO FORMA)
For the Year Ended December 31, Year [N]

UNDERWRITING INCOME
  Gross Premiums Written                        $X,XXX,XXX
  Ceded Premiums Written                       ($X,XXX,XXX)
  Net Premiums Written                          $X,XXX,XXX
  Change in Unearned Premiums                  ($X,XXX,XXX)
  Net Premiums Earned                           $X,XXX,XXX

UNDERWRITING DEDUCTIONS
  Losses Incurred                              ($X,XXX,XXX)
  Loss Adjustment Expenses                     ($X,XXX,XXX)
  Operating Expenses                           ($X,XXX,XXX)
  Total Underwriting Deductions               ($X,XXX,XXX)

UNDERWRITING INCOME (LOSS)                     $X,XXX,XXX

  Net Investment Income                         $X,XXX,XXX
  Net Realized Capital Gains (Losses)                  $0

NET INCOME BEFORE TAXES                        $X,XXX,XXX
  Income Tax Expense                                   $0
NET INCOME                                     $X,XXX,XXX
```

### 3. Statement of Cash Flows

```
SPORTS AND ENTERTAINMENT INSURANCE COMPANY, INC.
STATEMENT OF CASH FLOWS (PRO FORMA)
For the Year Ended December 31, Year [N]

OPERATING ACTIVITIES
  Net Income                                    $X,XXX,XXX
  Adjustments:
    Increase in Loss Reserves                   $X,XXX,XXX
    Increase in Unearned Premiums               $X,XXX,XXX
    Increase in Premiums Receivable            ($X,XXX,XXX)
    Increase in Accounts Payable                $X,XXX,XXX
  Net Cash from Operating Activities            $X,XXX,XXX

INVESTING ACTIVITIES
  Purchase of Investments                      ($X,XXX,XXX)
  Proceeds from Investments                     $X,XXX,XXX
  Net Cash from Investing Activities           ($X,XXX,XXX)

FINANCING ACTIVITIES
  Capital Contributions (Year 1 only)           $X,XXX,XXX
  Net Cash from Financing Activities            $X,XXX,XXX

NET CHANGE IN CASH                              $X,XXX,XXX
CASH — BEGINNING OF YEAR                       $X,XXX,XXX
CASH — END OF YEAR                             $X,XXX,XXX
```

### 4. Notes to Financial Statements

Standard notes to include:

1. **Organization and Nature of Business** — Description of SEIC as a Utah association captive
2. **Basis of Presentation** — Statutory accounting principles (NAIC SAP), Utah domicile
3. **Summary of Significant Accounting Policies:**
   - Premium recognition (written → earned over policy period)
   - Loss reserve methodology (based on actuarial estimate)
   - Investment valuation (amortized cost for fixed maturity)
   - Reinsurance accounting (ceded premiums and recoveries)
4. **Capitalization** — Source and amount of initial capital
5. **Reinsurance** — Summary of reinsurance program per coverage line
6. **Related Party Transactions** — Any transactions with parent (SIMG) or ultimate owner (Dane Administration)
7. **Subsequent Events** — Any material events after the statement date

---

## Generation Logic

1. Pull all projection data from `data.json` for Years 1, 2, and 3.
2. Derive balance sheet items using standard insurance accounting relationships:
   - `loss_reserves = losses_incurred × 0.50` (unless actuary specifies different factor)
   - `unearned_premium_reserve = gross_written_premium × 0.50` (mid-year assumption)
   - `premiums_receivable = gross_written_premium × 0.10` (standard receivable assumption)
   - `invested_assets = surplus + total_liabilities - non_invested_assets`
   - `investment_income = invested_assets × investment_return_pct`
3. Verify the balance sheet balances: `total_assets = total_liabilities + surplus`
4. Generate all three statements for each of the 3 years.
5. Write Notes to Financial Statements.
6. Format the output as Document 9 using the `document-formatting` agent rules.

---

## Validation Checks

- Balance sheet balances for every year: `total_assets = total_liabilities + surplus` (exact)
- Surplus end of Year N matches `projections[N].surplus_end_of_year` in data.json
- Net income matches `projections[N].net_income` in data.json
- Net premiums earned matches `projections[N].net_earned_premium` in data.json
- Year 1 opening surplus matches `capitalization.total_capitalization`
- Surplus never falls below $250,000 in any year
- Investment income is positive (non-negative investment return)
- All three statements (balance sheet, income, cash flow) present for all three years
- Notes section includes all 7 required topics
- Document header shows SEIC legal name and "Pro Forma" designation on every page

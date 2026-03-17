---
name: financial-projections-change
description: "Update the 5-year financial projections in the SEIC Business Plan. Use this skill whenever the user wants to revise any financial assumption in the projections table: gross written premium, net earned premium, losses incurred, loss ratio, operating expenses, expense ratio, combined ratio, surplus, or member count for any projection year. Triggers include: 'update projections', 'change loss ratio', 'revise financials', 'update Year 2 premium', 'change member count', 'revise GWP', 'update surplus projection', 'change expense ratio', or any reference to a specific projection year's numbers."
---

# Financial Projections Change Agent

This skill updates the 5-year financial projection table in the SEIC Business Plan (Doc 8) and enforces all internal mathematical consistency rules. It is the only agent authorized to modify projection-layer financials — it ensures no ratio can ever be inconsistent with its underlying inputs.

## Trigger Intent Examples

- "Update Year 1 gross written premium to $2,500,000"
- "Change the loss ratio assumption to 55% for Years 2–5"
- "Revise member count — we expect 150 members in Year 1, growing to 400 by Year 5"
- "The actuary revised the loss picks — update all five years"
- "Increase operating expenses by 10% across the board"
- "Year 3 surplus looks too low — the actuary recommends adjusting"

## Documents Affected

| Document | What Changes |
|---|---|
| **Doc 8 — Business Plan** | The 5-year projections table and any narrative that references specific financial figures |
| **data.json** | Projections array updated |

> Note: If GWP changes significantly, the Coverage Line Change Agent should also be run to keep Doc 6 total premiums in sync.

## Projection Table Structure

Each year (1–5) has the following fields:

| Field | Symbol | Derived From |
|---|---|---|
| `year` | — | Input |
| `member_count` | — | Input |
| `gross_written_premium` | GWP | Input |
| `net_written_premium` | NWP | Input (GWP minus ceded reinsurance) |
| `net_earned_premium` | NEP | Input or derived (≈ NWP adjusted for unearned) |
| `losses_incurred` | L | Input (actuary-determined) |
| `loss_ratio` | LR | **Derived:** L ÷ NEP |
| `operating_expenses` | OE | Input |
| `expense_ratio` | ER | **Derived:** OE ÷ NEP |
| `combined_ratio` | CR | **Derived:** LR + ER |
| `net_income` | NI | **Derived:** NEP − L − OE |
| `surplus_end_of_year` | Surplus | **Derived:** Prior year surplus + NI |

**Derived fields are always recalculated automatically — the user never inputs them.**

## Step-by-Step Logic

### 1. Identify the Input Change
Determine which input fields are changing and for which year(s):
- Single year change: update one row
- Multi-year change: update multiple rows (e.g., "change loss ratio for Years 3–5")
- Assumption change: apply a percentage or delta across all years (e.g., "+10% GWP every year")

### 2. Update data.json Projections Array
For each modified year, update the input fields. Never store derived values — they are always computed on output.

### 3. Recalculate All Derived Fields

For each year in sequence (Year 1 → Year 5):

```
loss_ratio        = losses_incurred / net_earned_premium
expense_ratio     = operating_expenses / net_earned_premium
combined_ratio    = loss_ratio + expense_ratio
net_income        = net_earned_premium - losses_incurred - operating_expenses
surplus_year_1    = opening_surplus + net_income_year_1
surplus_year_N    = surplus_year_(N-1) + net_income_year_N
```

Round monetary values to nearest dollar. Round ratios to 4 decimal places (display as %).

### 4. Validate the Updated Projections
Run all checks before writing to Doc 8:
- `combined_ratio > 1.20 (120%)` for any year → WARN (unusual but not blocking)
- `combined_ratio > 1.50 (150%)` for any year → FAIL (unrealistic — block and require actuary sign-off)
- `surplus_end_of_year < 250,000` for any year → FAIL (below Utah statutory minimum)
- `surplus_end_of_year < 0` for any year → FAIL (insolvency scenario — block)
- `net_written_premium > gross_written_premium` for any year → FAIL
- `member_count ≤ 0` for any year → FAIL
- YoY member count growth > 300% → WARN

### 5. Regenerate Doc 8 — Business Plan

**Projections table:**
- Rebuild the entire 5-year table with updated values
- Format: monetary columns right-aligned with $ and comma separators ($X,XXX,XXX)
- Format: ratio columns as percentages with 1 decimal (e.g., 62.5%)
- Bold the totals/summary row if present

**Narrative sections referencing specific figures:**
- "Executive Summary" — update any specific GWP, surplus, or member count figures mentioned
- "Financial Projections" section header paragraph — update year-specific highlights
- "Capitalization / Funding" — update if opening surplus reference appears

Do NOT rewrite the full narrative — only update sentences that contain specific numbers being changed.

### 6. Output Summary
```
FINANCIAL PROJECTIONS CHANGE SUMMARY
Years modified: [e.g., Year 1, Year 2]
Input changes:
  - GWP Year 1: $2,000,000 → $2,500,000
  - Loss ratio assumption: 65% → 55% (Years 2–5)

Recalculated projections:
  Year 1: GWP $2.5M | LR 55.0% | CR 92.0% | Surplus $5.8M
  Year 2: GWP $3.0M | LR 55.0% | CR 90.5% | Surplus $6.4M
  ...

Changes made:
  ✓ data.json projections array updated
  ✓ Doc 8 — Projections table rebuilt
  ✓ Doc 8 — Narrative figures updated

Warnings:
  ⚠ [Any ratio or surplus threshold flags]

Action required:
  → [e.g., "Actuary sign-off required if combined ratio exceeds 120%"]
  → [e.g., "Run coverage-line-change agent to sync Doc 6 GWP totals if Year 1 GWP changed"]
```

## Validation Checks

- All derived fields recalculated correctly (within $1 rounding tolerance)
- `combined_ratio = loss_ratio + expense_ratio` for every year
- `surplus_year_N = surplus_year_(N-1) + net_income_year_N` for every year
- No year has surplus below $250,000
- No year has negative surplus
- No year has NWP > GWP
- Loss ratio is not negative
- Expense ratio is not negative
- Combined ratio warning if > 120%, block if > 150%
- Opening surplus in Doc 8 still matches total capitalization in Doc 4

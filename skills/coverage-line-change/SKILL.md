---
name: coverage-line-change
description: "Add, remove, or modify a line of insurance coverage across the entire SEIC filing package. Use this skill whenever the user mentions changing coverage terms, adding a new line of coverage, removing an existing line, updating premium amounts, changing limits or deductibles, modifying claims basis, or updating reinsurance for a specific line. Triggers include: 'add coverage', 'remove line', 'change premium', 'update limits', 'new coverage line', 'modify deductible', 'change aggregate', 'update SIR', or any mention of a specific coverage line name (CGL, Participant Liability, Cyber, D&O, etc.) in the context of a change."
---

# Coverage Line Change Agent

This skill propagates any insurance coverage line change across all affected SEIC filing documents. Coverage changes are the most cross-cutting edits in the filing package — a single line addition or removal ripples through three documents and multiple financial tables.

## Trigger Intent Examples

- "Add a Professional Liability line with a $1M/$2M limit"
- "Remove the Equipment Floater line"
- "Change the Cyber Liability aggregate limit from $1M to $2M"
- "Update the CGL gross premium to $450,000"
- "The Abuse & Misconduct line is now claims-made — add a retroactive date of 01/01/2024"
- "Increase the D&O per-occurrence limit"

## The 9 Current SEIC Coverage Lines

1. Commercial General Liability (CGL)
2. Participant Legal Liability
3. Coach / Instructor E&O
4. Participant Accident Medical
5. Equipment Floater
6. Cyber Liability
7. Abuse & Misconduct Liability
8. Directors & Officers Liability (D&O)
9. Event Cancellation

## Documents Affected

| Document | What Changes |
|---|---|
| **Doc 6 — Lines of Coverage** | Primary record — all per-line fields updated, summary tables recalculated |
| **Doc 8 — Business Plan** | Coverage lines list updated; GWP/NWP in Year 1 projections updated; reinsurance narrative updated |
| **Membership Agreement** | Exhibit B (Coverage Summary) and coverage lines list in the body updated |
| **data.json** | Source of truth updated first |

## Step-by-Step Logic

### 1. Identify the Operation
- **ADD** — new coverage line not currently in the package
- **REMOVE** — existing line being dropped
- **MODIFY** — change to any field of an existing line

### 2. Collect Required Fields
For each line, the following fields must be known:

| Field | Required | Notes |
|---|---|---|
| `line_name` | Yes | Full descriptive name |
| `line_code` | Yes | NAIC code |
| `claims_basis` | Yes | "occurrence" or "claims-made" |
| `retroactive_date` | If claims-made | ISO date string |
| `per_occurrence_limit` | Yes | Raw number |
| `aggregate_limit` | Yes | Raw number |
| `deductible_sir` | Yes | Raw number (0 if none) |
| `gross_premium` | Yes | Raw number |
| `net_premium` | Yes | Raw number (≤ gross) |
| `reinsurance_type` | Yes | "quota share", "excess of loss", "none" |
| `reinsurance_amount` | If reinsured | Raw number |
| `reinsurer_name` | If reinsured | Company name |
| `territory` | Yes | e.g., "United States" |

If any required field is missing, insert `[MISSING: field_name]` and flag for review.

### 3. Update data.json
- ADD: append new line object to `coverage_lines[]`
- REMOVE: remove the line object from `coverage_lines[]`
- MODIFY: update the specific field(s) on the matching line object
- Recalculate `total_gross_premium` and `total_net_premium` aggregates

### 4. Regenerate Doc 6 — Lines of Coverage

**Per-line section:**
- ADD: insert a new fully formatted section for the new line
- REMOVE: delete the section entirely
- MODIFY: update the specific fields within the existing section

**Summary table (at top of doc):**
- Rebuild the complete summary table showing all lines with limits and premiums
- Recalculate column totals

**Premium summary (at bottom of doc):**
- Update total gross written premium
- Update total net written premium
- Verify gross ≥ net for every line; flag any violation

### 5. Update Doc 8 — Business Plan

**Coverage lines list:**
- ADD: append new line name to the lines of coverage list in the business plan
- REMOVE: remove line name from the list

**Year 1 financial projections:**
- Update `gross_written_premium` (Year 1) to match the new total from Doc 6
- Update `net_written_premium` (Year 1) accordingly
- Cascade: recalculate `net_earned_premium`, `loss_ratio`, `expense_ratio`, `combined_ratio` for Year 1
- Do NOT auto-adjust Years 2–5 — flag that the actuary should review projection consistency

**Reinsurance narrative:**
- If a new reinsured line is added: add a paragraph describing the reinsurance arrangement
- If a reinsured line is removed: remove or update the corresponding paragraph

### 6. Update Membership Agreement

**Body:**
- ADD: append new line to the available coverages list in Article III (Coverage)
- REMOVE: remove line from the list; add a note if any existing member had that coverage

**Exhibit B (Coverage Summary):**
- Rebuild the table to reflect all current lines with their limits

### 7. Output Summary
```
COVERAGE LINE CHANGE SUMMARY
Operation: [ADD / REMOVE / MODIFY]
Line: [Line Name]
Changes made:
  ✓ data.json updated (total GWP: $X,XXX,XXX → $X,XXX,XXX)
  ✓ Doc 6 — Lines of Coverage updated
  ✓ Doc 8 — Business Plan lines list and Year 1 projections updated
  ✓ Membership Agreement — coverage list and Exhibit B updated

Warnings:
  ⚠ [Any missing required fields / math violations / actuary review flags]

Action required:
  → Actuary should review Years 2–5 projection consistency after premium change
  → [Any claims-made line missing retroactive date]
```

## Validation Checks

- Every line has: name, claims basis, per-occurrence limit, aggregate limit, gross premium, net premium
- Gross premium ≥ net premium for every line
- Claims-made lines have a retroactive date
- Total gross premium in Doc 6 matches Year 1 GWP in Doc 8
- All lines in Doc 6 appear in Doc 8's coverage list and in the Membership Agreement
- After REMOVE: the line no longer appears in any of the three documents
- After ADD: the new line appears in all three documents with consistent naming

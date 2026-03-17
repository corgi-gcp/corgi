---
name: formation-capitalization
description: "Generate or update Document 4 — Captive Formation & Capitalization Details for the SEIC Utah captive filing. Use this skill whenever the user mentions 'formation', 'capitalization', 'initial capital', 'shares', 'surplus', 'letter of credit', 'Document 4', or needs to fill in the capital structure and formation details for the captive."
---

# Captive Formation & Capitalization Details (Document 4)

This skill generates the **Captive Formation & Capitalization Details** document for SEIC.

## Document Purpose

Documents how the captive will be formed and funded — share structure, initial capital contribution, surplus, letters of credit, and the capitalization timeline. Utah uses this to assess solvency and financial readiness.

## Data Fields to Extract from CSV

### Formation Details
- `entity_type` — Corporation, LLC, etc.
- `formation_state` — State of incorporation/organization
- `formation_date` — Actual or projected date
- `fiscal_year_end` — Month/day of fiscal year end

### Share Structure
- `authorized_shares` — Total authorized shares
- `shares_issued` — Shares to be issued at formation
- `par_value` — Par value per share
- `share_class` — Common, preferred, etc.

### Capitalization
- `initial_capital` — Total initial capital contribution (e.g. $5,000,000)
- `paid_in_capital` — Portion paid in at formation
- `paid_in_surplus` — Surplus above par value
- `loc_amount` — Letter of credit amount (if any)
- `loc_issuer` — LOC issuing bank
- `loc_terms` — LOC terms and conditions
- `total_capitalization` — Total = paid-in capital + surplus + LOC

### Capital Sources
- `capital_source_entity` — Entity contributing capital
- `capital_source_amount` — Amount from each source
- `capital_source_form` — Cash, LOC, or other

## Template Structure

1. **Header** — "CAPTIVE FORMATION & CAPITALIZATION DETAILS"
2. **Formation Information** — Entity type, state, date, fiscal year
3. **Share Structure** — Authorized shares, par value, classes
4. **Initial Capitalization** — Capital contributions table
5. **Letter of Credit Details** — LOC terms if applicable
6. **Total Capitalization Summary** — Aggregate table showing paid-in capital + surplus + LOC = total

## Generation Logic

1. Read formation and capitalization fields from CSV.
2. Load template from `4. Captive Formation & Capitalization.docx`.
3. Populate all sections; compute totals using formulas where possible.
4. Flag missing fields with `[MISSING: field_name]`.
5. Validate that total capitalization matches sum of components.
6. Save output.

## Validation Checks

- `total_capitalization` = `paid_in_capital` + `paid_in_surplus` + `loc_amount`
- `shares_issued` ≤ `authorized_shares`
- `initial_capital` matches known value ($5,000,000 for SEIC)
- All monetary values are formatted consistently
- LOC details present if `loc_amount` > 0

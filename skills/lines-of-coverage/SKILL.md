---
name: lines-of-coverage
description: "Generate or update Document 6 — Lines of Coverage Details for the SEIC Utah captive filing. Use this skill whenever the user mentions 'lines of coverage', 'insurance lines', 'coverage details', 'premiums', 'limits', 'deductibles', 'reinsurance', 'Document 6', or needs to populate the coverage schedule for the captive. Also trigger for CGL, participant liability, E&O, accident medical, cyber, abuse & misconduct, D&O, event cancellation, or equipment floater coverage details."
---

# Lines of Coverage Details (Document 6)

This skill generates the **Lines of Coverage Details** document for SEIC.

## Document Purpose

Describes every line of insurance the captive will write — coverage type, policy form, limits, deductibles, gross premium, reinsurance arrangements, and claims basis. Utah reviews this to understand the captive's risk profile.

## Data Fields to Extract from CSV

For each line of coverage:

- `line_name` — Coverage name (e.g. "Commercial General Liability")
- `line_code` — Internal code or NAIC line code
- `policy_form` — Occurrence or claims-made
- `coverage_description` — Brief description of what the line covers
- `per_occurrence_limit` — Per-occurrence or per-claim limit
- `aggregate_limit` — Annual aggregate limit
- `deductible` — Deductible or self-insured retention (SIR)
- `gross_premium` — Gross written premium
- `net_premium` — Net premium after reinsurance
- `reinsurance_type` — Quota share, excess of loss, etc.
- `reinsurance_amount` — Ceded premium or limit
- `reinsurer_name` — Name of reinsurer (if known)
- `claims_basis` — Occurrence or claims-made
- `retroactive_date` — For claims-made lines, the retro date
- `territory` — Geographic scope

### Known SEIC Lines (9 lines)
1. Commercial General Liability
2. Participant Legal Liability
3. Coach / Instructor E&O
4. Participant Accident Medical
5. Equipment Floater
6. Cyber Liability
7. Abuse & Misconduct Liability
8. Directors & Officers Liability
9. Event Cancellation

## Template Structure

1. **Header** — "LINES OF COVERAGE DETAILS"
2. **Coverage Summary Table** — Line | Form | Limit | Deductible | Gross Premium | Reinsured
3. **Per-Line Detail Sections** — One section per coverage line with full details
4. **Reinsurance Summary** — Aggregate view of ceded risk
5. **Premium Summary** — Total gross premium, total net premium, total ceded

## Generation Logic

1. Read coverage records from CSV.
2. Load template from `6. Lines of Coverage Details.docx`.
3. Build summary table and individual line sections.
4. Compute totals for gross premium, net premium, and ceded amounts.
5. Flag any line missing premium or limit data.
6. Save output.

## Validation Checks

- All 9 known SEIC lines are present
- For each line: `gross_premium` ≥ `net_premium`
- `per_occurrence_limit` and `aggregate_limit` are both populated
- Claims-made lines have a `retroactive_date`
- Total gross premium across all lines is consistent with the Business Plan (Document 8)
- Reinsurance details present for lines where `reinsurance_amount` > 0

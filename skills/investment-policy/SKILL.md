---
name: investment-policy
description: "Generate or update Document 11 — CG Investment Policy for the SEIC Utah captive filing. Use this skill whenever the user mentions 'investment policy', 'investment guidelines', 'asset allocation', 'permitted investments', 'Document 11', or needs to create the investment policy statement for the captive. Also trigger for custodian arrangements, portfolio limits, or Utah §31A-18-110 investment compliance."
---

# CG — Investment Policy (Document 11)

This skill generates the **Investment Policy** corporate governance document for SEIC.

## Document Purpose

Sets the investment guidelines for the captive's assets — permitted asset classes, allocation limits, quality standards, custodian arrangements, and compliance with Utah Insurance Code §31A-18-110 and §31A-18-111.

## Data Fields to Extract from JSON

### Policy Parameters
- `investment_objective` — Primary objective (capital preservation, liquidity, income)
- `risk_tolerance` — Conservative, moderate, etc.
- `liquidity_requirement` — Minimum liquid assets as % of reserves
- `benchmark` — Performance benchmark if any

### Permitted Asset Classes
For each permitted class:
- `asset_class` — Name (e.g. "U.S. Treasury obligations", "Investment-grade corporates")
- `max_allocation_pct` — Maximum portfolio allocation percentage
- `quality_minimum` — Minimum credit rating or quality standard
- `maturity_limit` — Maximum maturity/duration
- `single_issuer_limit` — Concentration limit per issuer

### Custodian & Oversight
- `custodian_name` — Name of investment custodian/bank
- `custodian_address` — Address
- `investment_advisor_name` — Name of advisor (if any)
- `reporting_frequency` — How often investment reports go to the board
- `review_frequency` — How often the policy is reviewed

### Prohibited Investments
- `prohibited_list` — Categories explicitly prohibited (derivatives, commodities, etc.)

## Template Structure

1. **Header** — "INVESTMENT POLICY — SPORTS AND ENTERTAINMENT INSURANCE COMPANY, INC."
2. **Purpose & Scope** — Why the policy exists, what it governs
3. **Investment Objectives** — Capital preservation, liquidity, income
4. **Permitted Investments** — Each asset class with limits and quality standards
5. **Prohibited Investments** — Explicit exclusions
6. **Concentration Limits** — Single-issuer and sector limits
7. **Liquidity Requirements** — Minimum liquid asset thresholds
8. **Custodian Arrangements** — Custodian identity and responsibilities
9. **Reporting & Oversight** — Board reporting, review schedule
10. **Compliance** — Reference to Utah §31A-18-110 and §31A-18-111
11. **Policy Review & Amendment** — Process for updating the policy
12. **Approval & Signatures** — Board resolution and signature block

## Generation Logic

1. Read investment policy fields from `data.json`.
2. Load template from `11. CG - Investment Policy.docx`.
3. Populate permitted investment sections with allocation limits.
4. Ensure all statutory references to Utah code are accurate.
5. Save output.

## Validation Checks

- Sum of all `max_allocation_pct` values is logically consistent (individual maxes may exceed 100% since they're caps, not targets)
- Every permitted class has a quality minimum specified
- Custodian is identified
- Policy includes a Utah code compliance section
- Reporting frequency is specified

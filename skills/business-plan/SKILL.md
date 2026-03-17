---
name: business-plan
description: "Generate or update Document 8 — Business Plan for the SEIC Utah captive filing. Use this skill whenever the user mentions 'business plan', 'plan of operation', 'Document 8', or needs to create or edit the captive's business plan. Also trigger for financial projections, loss ratios, expense ratios, premium forecasts, risk management strategy, or the operational narrative for the captive application."
---

# Business Plan (Document 8)

This skill generates the **Business Plan** document for SEIC.

## Document Purpose

The business plan is the most comprehensive document in the filing. It describes why the captive is being formed, how it will operate, its financial projections, risk management approach, and governance structure. Utah uses it to evaluate the viability and legitimacy of the captive.

## Data Fields to Extract from CSV

### Entity & Background
- All entity fields from Document 1 (legal name, type, domicile, etc.)
- `business_purpose` — Why the captive is being formed
- `target_market` — Description of the insured population (sports & entertainment organizations)
- `market_analysis` — Overview of the sports insurance market and unmet needs

### Operational Details
- `captive_manager_name` — Who manages day-to-day operations
- `underwriting_approach` — How risks are evaluated and priced
- `claims_handling` — Claims process description
- `reinsurance_strategy` — Approach to ceding risk
- `marketing_plan` — How the captive will attract and retain members

### Financial Projections (5-year)
For each projection year:
- `year` — Projection year
- `gross_written_premium` — Total GWP
- `net_written_premium` — NWP after cessions
- `net_earned_premium` — NEP
- `losses_incurred` — Projected losses
- `loss_ratio` — Losses / NEP
- `operating_expenses` — Admin, management fees, etc.
- `expense_ratio` — Expenses / NEP
- `combined_ratio` — Loss ratio + expense ratio
- `net_income` — Bottom line
- `surplus` — Projected surplus at year end
- `member_count` — Projected number of insured members

### Risk Management
- `risk_appetite_statement` — Board-approved risk appetite
- `risk_limits` — Key risk limits and triggers
- `catastrophe_exposure` — CAT risk analysis
- `diversification_strategy` — How risk is spread across lines and members

### Governance
- All governance fields (board composition, meeting frequency, committees, etc.)

## Template Structure

The business plan follows this outline (matching the existing template):

1. **Executive Summary**
2. **Company Overview** — Legal structure, domicile, parent, history
3. **Market Analysis** — Sports & entertainment insurance landscape, unmet needs
4. **Association & Membership** — Association structure, member eligibility, growth plan
5. **Lines of Coverage** — Summary of all 9 lines (detailed in Document 6)
6. **Underwriting & Risk Management** — Underwriting guidelines, risk selection, limits
7. **Reinsurance Program** — Strategy, structure, retention levels
8. **Claims Management** — Claims process, TPA arrangements, reserve methodology
9. **Financial Projections** — 5-year pro forma (premium, loss, expense, surplus)
10. **Capitalization & Funding** — Initial and ongoing capital (references Document 4)
11. **Investment Strategy** — Summary (detailed in Document 11)
12. **Governance & Management** — Board, officers, committees, meeting schedule
13. **Service Providers** — Summary (detailed in Document 3)
14. **Regulatory Compliance** — Utah captive law compliance, reporting, examinations
15. **Appendices** — Org chart, actuarial references, additional exhibits

## Generation Logic

1. Read all relevant fields from CSV.
2. Load template from `8. Business Plan.docx`.
3. Populate each section with CSV data and narrative text.
4. Build financial projection tables with proper formatting.
5. Cross-reference coverage details with Document 6, capitalization with Document 4.
6. Flag sections where actuarial input is still pending (`[PENDING: Actuarial input required]`).
7. Save output.

## Validation Checks

- Financial projections are internally consistent (loss ratio = losses / NEP, etc.)
- Combined ratio is reasonable (typically < 100% for a well-run captive)
- Surplus never falls below Utah minimum capital requirements
- All 9 coverage lines mentioned match Document 6
- Capitalization figures match Document 4
- Member count growth is consistent across projection years

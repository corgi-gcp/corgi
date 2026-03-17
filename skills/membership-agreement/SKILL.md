---
name: membership-agreement
description: "Generate or update the Membership Agreement for the SEIC Utah captive filing. Use this skill whenever the user mentions 'membership agreement', 'member agreement', 'association membership', or needs to prepare the agreement governing how insured members join and participate in the captive program. Also trigger for membership eligibility, member obligations, premium payment terms, coverage participation terms, withdrawal provisions, or indemnification of members."
---

# Membership Agreement

This skill generates the **Membership Agreement** document for SEIC.

## Document Purpose

The Membership Agreement governs the relationship between SEIC (the captive) and each insured member of the association. It defines eligibility, the application process, premium obligations, coverage participation, governance rights, withdrawal terms, and indemnification. This is a key document for association captives because it establishes the insured-to-insurer relationship.

## Data Fields to Extract from CSV

### Program Identity
- `program_name` — Name of the insurance program
- `captive_name` — SEIC legal name
- `association_name` — Association name
- `effective_date` — Agreement effective date

### Eligibility & Admission
- `member_eligibility_criteria` — Who can become a member (sports/entertainment organizations, etc.)
- `application_process` — How entities apply for membership
- `underwriting_requirements` — What information is required in the application
- `approval_authority` — Who approves new members (board, manager, etc.)

### Coverage & Premium
- `coverage_lines_available` — Lines of coverage available to members
- `premium_calculation_method` — How premiums are determined (rate tables, underwriting, etc.)
- `premium_payment_terms` — When and how premiums are paid
- `minimum_premium` — Minimum annual premium if any
- `coverage_effective_date_rules` — When coverage begins after acceptance

### Member Obligations
- `loss_control_requirements` — Risk management requirements for members
- `claims_reporting_obligations` — How and when members must report claims
- `information_disclosure` — Ongoing disclosure requirements
- `compliance_requirements` — Regulatory and program compliance

### Governance Rights
- `voting_rights` — Member voting rights (if any) in association governance
- `board_representation` — Whether members can serve on the board
- `meeting_participation` — Rights to attend meetings

### Withdrawal & Termination
- `voluntary_withdrawal_notice` — Notice period for voluntary withdrawal
- `involuntary_termination_grounds` — Grounds for removal
- `tail_coverage` — Extended reporting period provisions
- `return_of_capital` — Whether departing members receive any capital return

### Indemnification & Liability
- `member_indemnification` — Scope of captive's indemnification of members
- `member_liability_limits` — Limits on member liability to the captive
- `subrogation_rights` — Captive's subrogation rights

## Template Structure

1. **Recitals** — Background, parties, purpose
2. **Article I — Definitions**
3. **Article II — Membership** — Eligibility, application, acceptance, effective date
4. **Article III — Coverage** — Available lines, terms, exclusions
5. **Article IV — Premium** — Calculation, payment, adjustments
6. **Article V — Member Obligations** — Loss control, reporting, compliance
7. **Article VI — Claims** — Reporting, handling, cooperation
8. **Article VII — Governance** — Voting, meetings, representation
9. **Article VIII — Withdrawal & Termination** — Voluntary exit, removal, tail coverage
10. **Article IX — Indemnification**
11. **Article X — Confidentiality**
12. **Article XI — Dispute Resolution**
13. **Article XII — General Provisions** — Amendments, notices, governing law, assignment, severability
14. **Signature Block**
15. **Exhibit A — Rate Tables** (referenced, prepared separately)
16. **Exhibit B — Coverage Summary**

## Generation Logic

1. Read membership agreement fields from CSV.
2. Load template from `Membership Agreement.docx`.
3. Populate each article with data from the CSV.
4. Cross-reference coverage lines with Document 6.
5. Note that rate tables are prepared separately and referenced as an exhibit.
6. Flag sections needing adjustment pending final feasibility study.
7. Save output.

## Validation Checks

- All coverage lines referenced match those in Document 6
- Premium payment terms are clearly defined
- Withdrawal notice period is reasonable (30–90 days typical)
- Governing law is Utah
- Dispute resolution mechanism is specified
- The agreement notes it may need adjustment once the feasibility study is finalized

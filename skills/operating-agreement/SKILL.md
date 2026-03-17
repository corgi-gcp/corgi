---
name: operating-agreement
description: "Generate or update Document 15 — CG Operating Agreement for the SEIC Utah captive filing. Use this skill whenever the user mentions 'operating agreement', 'LLC agreement', 'Document 15', or needs to prepare the operating agreement governing the captive's parent LLC or the captive itself. Also trigger for unit classes, capital contributions, profit/loss allocation, distribution provisions, transfer restrictions, or dissolution terms in the operating agreement."
---

# CG — Operating Agreement (Document 15)

This skill generates the **Operating Agreement** corporate governance document for SEIC's structure.

## Document Purpose

The Operating Agreement governs the relationship between the unitholders and the management of the LLC entity in SEIC's corporate structure. It covers capital contributions, unit classes, profit/loss allocation, distributions, transfer restrictions, governance, and dissolution. Utah DOI reviews this as part of assessing the captive's organizational soundness.

## Data Fields to Extract from CSV

### Entity & Parties
- `llc_name` — Name of the LLC governed by this agreement
- `formation_date` — Date of LLC formation
- `formation_state` — State of organization
- `managing_member` — Name of managing member / manager
- `members_list` — List of all members with their unit holdings

### Capital Structure
- `unit_classes` — Types of units (Common Units, Program Units, etc.)
- `initial_capital_contributions` — Per-member capital contributions
- `additional_capital_call_provisions` — Terms for additional calls
- `capital_account_maintenance` — How capital accounts are tracked

### Governance
- `management_type` — Manager-managed or member-managed
- `board_composition` — How the board/managers are appointed
- `voting_rights` — Voting rights per unit class
- `approval_thresholds` — Actions requiring special approval

### Financial
- `profit_loss_allocation` — How profits and losses are allocated among members
- `distribution_policy` — When and how distributions are made
- `tax_treatment` — Tax classification (partnership, disregarded entity, etc.)

### Transfer & Exit
- `transfer_restrictions` — Restrictions on transferring units
- `right_of_first_refusal` — Whether ROFR exists
- `termination_events` — Events triggering mandatory buyback
- `buyback_valuation` — How units are valued on buyback

### Dissolution
- `dissolution_triggers` — Events that can trigger dissolution
- `winding_up_process` — How assets are distributed on dissolution
- `liquidation_priority` — Priority of claims in liquidation

## Template Structure

1. **Article I — Definitions**
2. **Article II — Formation & Purpose**
3. **Article III — Units & Capital Contributions**
4. **Article IV — Allocations of Profit and Loss**
5. **Article V — Distributions**
6. **Article VI — Management & Voting**
7. **Article VII — Officers**
8. **Article VIII — Transfer Restrictions**
9. **Article IX — Termination Events & Buyback**
10. **Article X — Dissolution & Winding Up**
11. **Article XI — Books, Records & Reports**
12. **Article XII — Indemnification**
13. **Article XIII — Miscellaneous** — Amendments, governing law, notices, severability
14. **Signature Block**
15. **Exhibit A — Members & Capital Contributions Schedule**

## Generation Logic

1. Read operating agreement fields from CSV.
2. Load template from `15. CG - Operating Agreement.docx`.
3. Populate each article and build the members/capital schedule exhibit.
4. Ensure capital contribution amounts are consistent with Document 4.
5. Save output.

## Validation Checks

- All members listed have capital contributions that sum to total initial capital
- Transfer restrictions are present
- Dissolution provisions exist
- Governing law is Utah
- Management structure is clearly defined (manager-managed vs. member-managed)
- Profit/loss allocation method is specified

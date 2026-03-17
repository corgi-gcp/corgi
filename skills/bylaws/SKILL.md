---
name: bylaws
description: "Generate or update Document 13 — CG Bylaws for the SEIC Utah captive filing. Use this skill whenever the user mentions 'bylaws', 'corporate bylaws', 'Document 13', or needs to prepare the internal governance rules for the captive. Also trigger for board meeting rules, quorum requirements, officer election procedures, committee structures, fiscal year provisions, or amendment procedures in the captive's bylaws."
---

# CG — Bylaws (Document 13)

This skill generates the **Bylaws** corporate governance document for SEIC.

## Document Purpose

Bylaws are the internal governance rules of the corporation. They define how the board operates, how officers are elected, meeting procedures, quorum requirements, committees, fiscal year, and amendment processes. Utah DOI reviews bylaws to ensure proper governance.

## Data Fields to Extract from JSON

### Board of Directors
- `board_size` — Number of directors (or range)
- `director_term_years` — Length of director terms
- `director_election_method` — How directors are elected (by shareholders, etc.)
- `quorum_requirement` — Quorum for board meetings (e.g. "majority of directors")
- `voting_standard` — Majority, supermajority, etc.
- `board_meeting_frequency` — How often the board meets (quarterly, annually, etc.)
- `special_meeting_call` — Who can call special meetings

### Officers
- `officer_positions` — List of officer titles (President, VP, Secretary, Treasurer, etc.)
- `officer_election_by` — Elected by the board
- `officer_term` — Serve at the pleasure of the board / annual terms
- `officer_removal` — Process for removing officers

### Meetings
- `annual_meeting_timing` — When annual shareholder meeting is held
- `notice_period_days` — Days of notice required for meetings
- `action_without_meeting` — Whether written consent in lieu of meeting is allowed

### Committees
- `committees` — List of board committees (e.g. Investment, Audit, Underwriting)
- `committee_composition` — How committee members are appointed

### Other Provisions
- `fiscal_year_end` — Fiscal year end date
- `indemnification_scope` — D&O indemnification terms
- `amendment_process` — How bylaws are amended
- `conflict_of_interest_policy` — Whether a COI policy is referenced

## Template Structure

1. **Article I — Offices** — Principal office, registered office
2. **Article II — Shareholders** — Meetings, notice, quorum, voting, proxies, action without meeting
3. **Article III — Board of Directors** — Number, election, term, powers, meetings, quorum, committees, resignation/removal
4. **Article IV — Officers** — Positions, election, duties, removal, vacancies
5. **Article V — Indemnification** — Scope and limitations
6. **Article VI — Share Certificates** — Issuance, transfer, lost certificates
7. **Article VII — Fiscal Year**
8. **Article VIII — Amendments**
9. **Article IX — General Provisions** — Checks, contracts, loans, conflict of interest

## Generation Logic

1. Read governance fields from `data.json`.
2. Load template from `13. CG - Bylaws.docx`.
3. Populate each article section.
4. Ensure consistency with Articles of Incorporation (Document 12) on board size, share structure.
5. Save output.

## Validation Checks

- Board size ≥ 3
- Quorum ≥ majority
- All standard officer positions are defined
- Fiscal year matches what's in Documents 4 and 8
- Amendment process is defined
- Indemnification provisions are consistent with the Articles (Document 12)

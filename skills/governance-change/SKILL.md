---
name: governance-change
description: "Update governance rules across the SEIC filing package — board size, quorum, voting thresholds, committees, fiscal year, or officer term rules. Use this skill whenever the user mentions changing how the board operates, modifying meeting requirements, updating committee structure, changing voting rules, or modifying any governance provision. Triggers include: 'change quorum', 'update board size', 'add committee', 'change voting threshold', 'modify fiscal year', 'update officer terms', 'change meeting frequency', 'governance update', or any reference to bylaws, articles, or operating agreement provisions in the context of a change."
---

# Governance Change Agent

This skill propagates governance rule changes across all three governance documents simultaneously. Governance provisions appear in Articles of Incorporation, Bylaws, and the Operating Agreement — they must be internally consistent or the filing will draw regulatory scrutiny.

## Trigger Intent Examples

- "Increase the board quorum from majority to two-thirds"
- "Change the minimum board size from 3 to 5 directors"
- "Add an Underwriting Committee with 3 members"
- "Change the fiscal year end from December 31 to June 30"
- "Officer terms should be 2 years instead of 1"
- "Annual meeting notice period should be 30 days instead of 15"
- "Add a conflict-of-interest policy reference to the bylaws"

## Documents Affected

| Document | What Changes |
|---|---|
| **Doc 12 — Articles of Incorporation** | Board size minimums, fundamental purpose provisions, amendment process |
| **Doc 13 — Bylaws** | Quorum rules, voting thresholds, officer terms, meeting notice periods, committee structure, fiscal year, indemnification scope |
| **Doc 15 — Operating Agreement** | Voting rights per unit class, special approval thresholds, management structure if manager-managed |
| **data.json** | Governance fields updated first |

## Governance Fields in data.json

```json
{
  "governance": {
    "board_min_size": 3,
    "board_max_size": null,
    "director_term_years": 1,
    "quorum_type": "majority",
    "quorum_threshold": 0.51,
    "voting_standard": "majority of quorum",
    "supermajority_threshold": 0.67,
    "annual_meeting_notice_days": 15,
    "special_meeting_notice_days": 10,
    "action_without_meeting": true,
    "officer_term_years": 1,
    "fiscal_year_end": "December 31",
    "committees": [
      { "name": "Investment Committee", "min_members": 3 },
      { "name": "Audit Committee", "min_members": 3 },
      { "name": "Underwriting Committee", "min_members": 3 }
    ],
    "amendment_process": "majority vote of board",
    "indemnification_scope": "directors, officers, and agents"
  }
}
```

## Step-by-Step Logic

### 1. Identify the Governance Change
Classify the change:
- **Board composition** — min/max size, term length, election method
- **Meeting rules** — quorum, voting standard, notice period, action without meeting
- **Officer rules** — term length, removal process, title additions/removals
- **Committee** — add, remove, or modify a committee
- **Fiscal year** — change year-end date
- **Amendment process** — modify how governance documents can be changed

### 2. Validate the Change
- Board min size ≥ 3 (Utah corporate law minimum) — **block if violated**
- Quorum threshold must be > 50% for standard voting — **warn if ≤ 50%**
- Supermajority threshold must be > standard quorum — **block if ≤ quorum**
- Fiscal year end must be a valid calendar date
- Committee min members must be ≥ 1

### 3. Update data.json
Update the relevant `governance` fields.

### 4. Regenerate Doc 12 — Articles of Incorporation
Changes that require Articles update:
- **Board minimum size** — Article V may reference minimum director count
- **Amendment process** — Article IX (Amendment) must reflect the updated process
- **Fundamental purpose** — only if captive type or purpose clause changes (rare)

Most day-to-day governance changes do NOT require Articles amendment — Articles contain only the fundamental corporate framework.

### 5. Regenerate Doc 13 — Bylaws
This is the primary document for most governance changes:

**Article II (Shareholders/Members):**
- Annual meeting timing, notice period, action without meeting

**Article III (Board of Directors):**
- Board size range (min–max), director term, election method
- Quorum: update the fraction (e.g., "a majority" → "two-thirds")
- Voting standard: update the required threshold
- Special meeting call requirements

**Article IV (Officers):**
- Officer term length
- Officer removal process
- Add or remove officer position definitions

**Article V (Indemnification):**
- Update scope if indemnification coverage changes

**Article VII (Fiscal Year):**
- Update fiscal year end date

**Article VIII (Amendments):**
- Update the amendment process description

**Committee sections:**
- ADD committee: insert new committee article/section with name, purpose, member count, appointment method
- REMOVE committee: delete the section
- MODIFY: update member count or appointment rules

### 6. Regenerate Doc 15 — Operating Agreement
Changes that require Operating Agreement update:
- **Voting rights** — if standard voting threshold changes, update Article VI (Management & Voting)
- **Special approval thresholds** — update list of actions requiring supermajority
- **Fiscal year** — update Article XI (Books/Records/Reports)
- **Amendment process** — update Article XIII (Miscellaneous) if OA amendment process changes

### 7. Consistency Check Across All Three Documents
After regeneration, verify:
- Fiscal year end is identical in Doc 13 and Doc 15 (and Doc 4 and Doc 8)
- Board minimum size in Doc 12 ≤ board minimum size in Doc 13 (Articles sets floor, Bylaws can be more restrictive)
- Amendment process in Doc 12 and Doc 13 are not contradictory
- No officer title in Doc 13 is absent from Doc 2 (Directors & Officers)

### 8. Output Summary
```
GOVERNANCE CHANGE SUMMARY
Change type: [e.g., Quorum Update]
Previous: [e.g., Simple majority (>50%)]
New: [e.g., Two-thirds supermajority (>66.7%)]

Changes made:
  ✓ data.json governance fields updated
  ✓ Doc 12 — Articles updated (if applicable)
  ✓ Doc 13 — Bylaws Article III updated
  ✓ Doc 15 — Operating Agreement Article VI updated (if applicable)

Warnings:
  ⚠ [Any rule violations or consistency flags]

Action required:
  → [e.g., "Fiscal year change from Dec 31 to Jun 30 requires updating Doc 4 and Doc 8 — run the capitalization-change and financial-projections-change agents"]
```

## Validation Checks

- Board size ≥ 3 in all three documents
- Quorum > 50% (warn if ≤ 66% for captive governance best practices)
- Fiscal year end identical across Doc 4, Doc 8, Doc 13, Doc 15
- All officer positions defined in Doc 13 Bylaws are present in Doc 2
- Committee definitions in Doc 13 match any committee references in Doc 8
- Amendment process defined in both Doc 12 and Doc 13 with no contradiction
- No governance provision in Doc 15 directly contradicts Doc 13

---
name: personnel-change
description: "Add, remove, or modify a director or officer across the entire SEIC filing package. Use this skill whenever the user mentions changing a person's name, title, address, or role; adding a new director or officer; removing an existing one; or updating biographical affidavit status. Triggers include: 'change director', 'add officer', 'remove board member', 'update title', 'new president', 'replace treasurer', 'personnel update', or any mention of Laqua, Yuan, Beddes, or Brown in the context of a role change."
---

# Personnel Change Agent

This skill propagates any director or officer change across all affected SEIC filing documents simultaneously. It is the single entry point for any personnel-related edit — the user never needs to know which documents are impacted.

## Trigger Intent Examples

- "Change Emily Yuan's title from VP to President"
- "Add a new director: Jane Smith, 123 Main St, Salt Lake City"
- "Remove Mike Brown as Treasurer and replace with David Lee"
- "Update Seth Beddes' address"
- "We need a new board member"

## Documents Affected

| Document | What Changes |
|---|---|
| **Doc 2 — Directors & Officers** | Primary record — name, title, address, term dates, director/officer flags |
| **Doc 7 — Biographical Affidavit** | New affidavit required for new person; updated name/title on existing affidavit |
| **Doc 12 — Articles of Incorporation** | Initial directors list updated if person is a director |
| **Doc 13 — Bylaws** | Officer position definitions updated if a title is added or removed |
| **data.json** | Source of truth updated first; all docs re-generated from updated JSON |

## Step-by-Step Logic

### 1. Understand the Change
Identify the operation type:
- **ADD** — new person joining the board or officer team
- **REMOVE** — existing person leaving
- **MODIFY** — name correction, title change, address update, term date update

### 2. Update data.json First
Before touching any document, update the relevant fields in `data.json`:
- `officers_directors` array: add, remove, or update the person's record
- Fields per person: `full_name`, `titles[]`, `is_director`, `address`, `phone`, `email`, `term_start`, `term_end`, `affidavit_on_file`

### 3. Validate Personnel Rules
Before writing to any document, check:
- Director count after the change is still ≥ 3. If it would drop to 2, **block the operation** and warn the user.
- All four required officer positions remain filled: President, Vice President/Secretary, Treasurer, Assistant Secretary. If a position would become vacant, warn but do not block.
- No duplicate names or titles.

### 4. Regenerate Affected Documents

**Doc 2:**
- Rebuild the summary table with all current officers/directors
- Rebuild each individual detail block
- Update biographical affidavit status column (new person = "Required — Not Yet Filed"; existing = unchanged)

**Doc 7 (Biographical Affidavit):**
- **ADD:** Create a new blank affidavit document pre-populated with the person's name, title, and address. Insert `[MISSING: employment_history]` placeholders. Flag that the affidavit must be signed before submission.
- **REMOVE:** Mark the removed person's affidavit as superseded (do not delete — regulatory records must be preserved).
- **MODIFY:** Update name and/or title on the existing affidavit; re-validate 10-year employment coverage.

**Doc 12 (Articles of Incorporation):**
- If the person is a director, update the Initial Directors list in Article V.
- If all initial directors are replaced, flag that amended Articles may need to be filed with the Utah Division of Corporations.

**Doc 13 (Bylaws):**
- If a new officer title is introduced (e.g., "Chief Risk Officer"), add the position definition to Article IV (Officers).
- If a title is removed entirely, remove its definition section.

### 5. Output Summary
After all updates, produce a change summary:
```
PERSONNEL CHANGE SUMMARY
Operation: [ADD / REMOVE / MODIFY]
Person: [Full Name]
Changes made:
  ✓ data.json updated
  ✓ Doc 2 — Directors & Officers updated
  ✓ Doc 7 — New affidavit created / Updated / Marked superseded
  ✓ Doc 12 — Initial directors list updated
  ✓ Doc 13 — Officer definitions updated (if applicable)

Warnings:
  ⚠ [Any rule violations or items requiring manual review]

Action required:
  → [e.g., "New affidavit for Jane Smith must be signed before submission"]
```

## Validation Checks

- Board has ≥ 3 directors after change
- President, VP/Secretary, Treasurer positions all filled after change
- New person has a valid address (street, city, state, ZIP)
- If new person added: affidavit flagged as required
- No person appears twice with conflicting titles
- Term dates are logically consistent (start before end)
- All modified documents pass the cross-document consistency check for person names

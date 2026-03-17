---
name: reinsurance-change
description: "Update the reinsurance program for any coverage line across the SEIC filing package. Use this skill whenever the user mentions changing a reinsurer, modifying reinsurance terms, adding or removing reinsurance on a coverage line, changing retention levels, or updating the reinsurance strategy narrative. Triggers include: 'change reinsurer', 'update retention', 'new reinsurance treaty', 'add quota share', 'change excess of loss', 'remove reinsurance', 'update cession percentage', 'new reinsurance partner', or any reference to reinsurance terms for a specific coverage line."
---

# Reinsurance Change Agent

This skill updates reinsurance terms for any coverage line and propagates the changes to all documents that reference the reinsurance program. Reinsurance changes affect both the per-line detail in Doc 6 and the strategic narrative in Doc 8.

## Trigger Intent Examples

- "Add a 50% quota share reinsurance on the CGL line with Munich Re"
- "Remove the excess of loss treaty on Cyber Liability"
- "Change the Event Cancellation reinsurer from Swiss Re to Hannover Re"
- "Increase the retention on the D&O line from $250K to $500K"
- "The Abuse & Misconduct line now has a $2M xs $500K treaty"
- "Update the overall reinsurance strategy — we're moving to facultative for all lines"

## Reinsurance Types

| Type | Description |
|---|---|
| **Quota Share** | Reinsurer takes a fixed % of premiums and losses |
| **Excess of Loss (XL)** | Reinsurer pays losses above a retention threshold |
| **Stop Loss** | Reinsurer pays losses above an aggregate threshold |
| **Facultative** | Per-risk, individually negotiated |
| **None** | Line is fully retained by the captive |

## Documents Affected

| Document | What Changes |
|---|---|
| **Doc 6 — Lines of Coverage** | Per-line reinsurance fields: type, amount/percentage, reinsurer name, net premium |
| **Doc 8 — Business Plan** | Reinsurance program narrative section; NWP in projections if cession % changes significantly |
| **data.json** | Reinsurance fields updated in the relevant coverage line |

## Reinsurance Fields per Coverage Line in data.json

```json
{
  "reinsurance_type": "quota share | excess of loss | stop loss | facultative | none",
  "reinsurance_structure": "e.g., 50% quota share | $2M xs $500K",
  "reinsurer_name": "Munich Re",
  "cession_percentage": 50,
  "net_premium": 225000,
  "reinsurance_premium": 225000
}
```

## Step-by-Step Logic

### 1. Identify the Affected Line(s)
Determine which coverage line(s) are changing and what aspect:
- Reinsurer name (company change)
- Reinsurance type (quota share → excess of loss, etc.)
- Retention / attachment point
- Cession percentage
- Adding reinsurance to a previously uninsured line
- Removing reinsurance from a currently reinsured line

### 2. Validate the Change
- If quota share: cession % must be between 1% and 99%
- Net premium = gross premium × (1 − cession %) for quota share — validate math
- For XL: retention must be < per-occurrence limit (otherwise reinsurance is never triggered)
- If reinsurer name is provided: it should be a known reinsurance company (warn if unrecognized)
- Net premium must be ≥ 0 and ≤ gross premium

### 3. Update data.json
Update the reinsurance fields on the specific coverage line object. Recalculate `net_premium` automatically where formula applies (quota share). Recalculate `total_net_premium` aggregate.

### 4. Regenerate Doc 6 — Lines of Coverage

**Per-line detail section:**
- Update the reinsurance type field
- Update the reinsurance structure description (e.g., "50% Quota Share" or "$2M xs $500K")
- Update the reinsurer name
- Update the net premium (after cession)

**Reinsurance summary section (at bottom of Doc 6):**
- Rebuild the reinsurance summary table showing all reinsured lines, reinsurers, and structures
- Lines with no reinsurance: show "Retained" in the reinsurer column

**Premium summary:**
- Update total net written premium to reflect updated cessions

### 5. Update Doc 8 — Business Plan

**Reinsurance Program section:**
- If reinsurer changed: update reinsurer name in the narrative
- If reinsurance type changed: update the description of the program structure
- If a line transitions from retained → reinsured: add a new paragraph describing the treaty
- If a line transitions from reinsured → retained: update to reflect full retention

**NWP in Year 1 projections:**
- If cession % changed materially (> 5%): update `net_written_premium` for Year 1
- Flag that actuary should review Years 2–5 NWP consistency

### 6. Output Summary
```
REINSURANCE CHANGE SUMMARY
Line: [Coverage Line Name]
Operation: [Add / Remove / Modify]
Structure: [e.g., 50% Quota Share → $2M xs $500K]
Reinsurer: [Old Reinsurer] → [New Reinsurer]
Gross Premium: $XXX,XXX (unchanged)
Previous Net Premium: $XXX,XXX
New Net Premium: $XXX,XXX

Changes made:
  ✓ data.json reinsurance fields updated
  ✓ Doc 6 — Per-line section and reinsurance summary updated
  ✓ Doc 8 — Reinsurance narrative updated
  ✓ Doc 8 — Year 1 NWP updated (if cession % changed)

Warnings:
  ⚠ [Any math violations / unrecognized reinsurer names]

Action required:
  → Actuary should review Years 2–5 NWP projections if cession % changed
  → [e.g., "Provide reinsurance treaty documentation for the filing"]
```

## Validation Checks

- Net premium ≤ gross premium for every line after update
- Quota share: net premium = gross premium × (1 − cession %) within $1 tolerance
- XL retention < per-occurrence limit for the line
- Cession % between 0% and 100% (exclusive)
- Total net premium in Doc 6 matches Year 1 NWP in Doc 8 (within 5% tolerance; exact match preferred)
- All reinsured lines have a reinsurer name populated
- Lines with no reinsurance have net premium = gross premium
- Reinsurance summary table in Doc 6 lists all and only the reinsured lines

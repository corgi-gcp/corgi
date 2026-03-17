---
name: capitalization-change
description: "Update the capitalization structure, share structure, or letter of credit across the entire SEIC filing package. Use this skill whenever the user mentions changing the initial capital amount, paid-in capital, paid-in surplus, authorized shares, issued shares, par value, letter of credit amount or provider, or any other capitalization-related field. Triggers include: 'change capital', 'update capitalization', 'new LOC', 'change shares', 'increase surplus', 'modify share structure', 'update par value', or any reference to the $5M capitalization figure in the context of a change."
---

# Capitalization Change Agent

This skill propagates any change to SEIC's capital structure across all affected filing documents. Capitalization figures appear in four documents and must be perfectly consistent for the Utah DOI to accept the filing.

## Trigger Intent Examples

- "Increase initial capital from $5M to $7M"
- "Change the authorized shares from 1,000 to 10,000"
- "Update the letter of credit to $1,000,000 from First Utah Bank"
- "Split the capitalization: $4M paid-in capital, $1M paid-in surplus"
- "Change the par value per share"
- "Remove the letter of credit — fully funded with cash"

## Documents Affected

| Document | What Changes |
|---|---|
| **Doc 4 — Formation & Capitalization** | Primary record — share structure table, capitalization breakdown table, LOC details |
| **Doc 8 — Business Plan** | Opening surplus / Year 1 beginning surplus updated; capitalization/funding section narrative updated |
| **Doc 12 — Articles of Incorporation** | Authorized shares count in Article IV updated |
| **Doc 15 — Operating Agreement** | Total capital contributions in Exhibit A updated |
| **data.json** | Source of truth updated first |

## Step-by-Step Logic

### 1. Identify What Is Changing
Determine which capital fields are being modified:

**Share Structure fields:**
- `authorized_shares` — Total authorized shares
- `issued_shares` — Shares actually issued (must be ≤ authorized)
- `par_value` — Par value per share (e.g., $0.01)
- `share_class` — Class of shares (e.g., "Common")

**Capitalization fields:**
- `paid_in_capital` — Cash contributed as stated capital
- `paid_in_surplus` — Cash contributed as surplus above par
- `loc_amount` — Letter of credit amount (0 if none)
- `loc_provider` — LOC issuing bank name
- `loc_expiry` — LOC expiration date
- `total_capitalization` — Must equal paid_in_capital + paid_in_surplus + loc_amount

### 2. Validate the New Structure
Before updating any document:
- `total_capitalization = paid_in_capital + paid_in_surplus + loc_amount` — **hard rule, block if violated**
- `issued_shares ≤ authorized_shares` — **hard rule, block if violated**
- `total_capitalization ≥ 250,000` — Utah statutory minimum (§31A-37-203); **block if violated**
- If LOC is being introduced or changed: `loc_provider` and `loc_expiry` must both be present
- Warn if `total_capitalization` is below $5,000,000 (SEIC's stated target)

### 3. Update data.json
Update all affected capitalization fields. Recalculate `total_capitalization` automatically.

### 4. Regenerate Doc 4 — Formation & Capitalization

**Share Structure table:**
- Update authorized shares, issued shares, par value, share class

**Initial Capitalization table:**
- Update paid-in capital row
- Update paid-in surplus row
- Update LOC row (or remove row if LOC = 0)
- Recalculate and update the Total row

**LOC Details section:**
- If LOC > 0: populate provider name, amount, expiry date, LOC number if known
- If LOC = 0: remove or gray out the LOC Details section

**Total Capitalization summary:**
- Display final total with breakdown narrative

### 5. Update Doc 8 — Business Plan

**Opening surplus:**
- Update `opening_surplus` to match new `total_capitalization`
- Update Year 1 `surplus_end_of_year` baseline (= opening_surplus + Year 1 net income)

**Capitalization / Funding section:**
- Update the narrative paragraph describing the $X capitalization structure
- Update any specific dollar amounts mentioned

**Do NOT auto-change Years 2–5 surplus projections** — flag that the actuary should review.

### 6. Update Doc 12 — Articles of Incorporation

**Article IV (Authorized Shares):**
- Update the authorized shares count to match Doc 4
- Update par value if changed

### 7. Update Doc 15 — Operating Agreement

**Exhibit A (Members & Capital Contributions Schedule):**
- Update the total capital contributions column to match new `total_capitalization`
- If the breakdown across members changes, update each member's contribution row

### 8. Output Summary
```
CAPITALIZATION CHANGE SUMMARY
Previous total capitalization: $X,XXX,XXX
New total capitalization:      $X,XXX,XXX
Breakdown: Paid-in capital $X,XXX,XXX + Surplus $X,XXX,XXX + LOC $X,XXX,XXX

Changes made:
  ✓ data.json updated
  ✓ Doc 4 — Formation & Capitalization tables updated
  ✓ Doc 8 — Opening surplus and funding narrative updated
  ✓ Doc 12 — Authorized shares updated (if changed)
  ✓ Doc 15 — Exhibit A capital contributions updated

Warnings:
  ⚠ [Any math violations / statutory minimum flags]

Action required:
  → Actuary should review Years 2–5 surplus projections for consistency
  → [LOC: confirm LOC documentation from provider is in the file]
```

## Validation Checks

- `paid_in_capital + paid_in_surplus + loc_amount = total_capitalization` (exact, no rounding)
- `issued_shares ≤ authorized_shares`
- `total_capitalization ≥ $250,000` (Utah statutory minimum)
- Authorized shares in Doc 4 exactly matches Article IV of Doc 12
- Opening surplus in Doc 8 matches total capitalization in Doc 4
- Total capital contributions in Doc 15 Exhibit A matches total capitalization in Doc 4
- If LOC > 0: provider name and expiry date are both populated

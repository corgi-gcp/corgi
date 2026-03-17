---
name: entity-ownership-change
description: "Update the legal name, registered agent, domicile address, parent entity, or ownership chain across the entire SEIC filing package. Use this skill whenever the user mentions a legal name change, registered agent substitution, address change for the captive itself, parent company change, or ownership restructuring. Triggers include: 'change legal name', 'new registered agent', 'update domicile address', 'parent company change', 'ownership restructure', 'rename the captive', 'change principal office', 'new statutory agent', or any reference to Dane Administration or Sports Insurance Management Group in the context of a change."
---

# Entity / Ownership Change Agent

This skill propagates changes to SEIC's core identity — its name, registered agent, principal office, and ownership chain — across all documents where these appear. These are the highest-stakes edits in the filing package: a name mismatch across documents is an immediate red flag for regulators.

## Trigger Intent Examples

- "Change the registered agent to ABC Registered Agents, LLC"
- "The captive's principal office is moving to 456 State St, Salt Lake City, UT 84111"
- "Rename the captive to Sports and Entertainment Insurance Company, Inc. — Series A"
- "The parent company is changing from Sports Insurance Management Group to SIMG Holdings, LLC"
- "Update the ultimate owner address"
- "Ownership is being restructured — SIMG will now own 80%, new partner owns 20%"

## Documents Affected

| Document | What Changes |
|---|---|
| **Doc 1 — Company Details** | Legal name, all addresses, registered agent, parent chain, association info |
| **Doc 12 — Articles of Incorporation** | Legal name (Article I), registered agent (Article II) |
| **Doc 13 — Bylaws** | Governing law clause, principal office reference |
| **Doc 15 — Operating Agreement** | Party names, governing law, registered agent reference |
| **Membership Agreement** | Captive name in recitals and throughout |
| **data.json** | All entity/ownership fields updated first |

## Entity Fields in data.json

```json
{
  "entity": {
    "legal_name": "Sports and Entertainment Insurance Company, Inc.",
    "dba_name": null,
    "captive_type": "Association Captive",
    "domicile_state": "Utah",
    "formation_date": "2025-01-01",
    "fiscal_year_end": "December 31",
    "principal_office_address": "123 Main Street, Salt Lake City, UT 84101",
    "records_address": "123 Main Street, Salt Lake City, UT 84101",
    "mailing_address": "123 Main Street, Salt Lake City, UT 84101",
    "statutory_agent_name": "Registered Agent Name",
    "statutory_agent_address": "Agent Address, Salt Lake City, UT 84101"
  },
  "ownership": {
    "direct_parent_name": "Sports Insurance Management Group, LLC",
    "direct_parent_domicile": "Utah",
    "direct_parent_ownership_pct": 100,
    "ultimate_owner_name": "Dane Administration, LLC",
    "ultimate_owner_address": "Owner Address",
    "ownership_structure_description": "Narrative description of ownership chain"
  }
}
```

## Step-by-Step Logic

### 1. Identify What Is Changing
- **Legal name change** — highest impact; touches every document
- **Registered agent change** — touches Doc 1 and Doc 12
- **Address change** — touches Doc 1 and any doc with a principal office reference
- **Parent / ownership change** — touches Doc 1 and Doc 15

### 2. Validate the Change

**Legal name change:**
- New name must not conflict with any existing Utah corporation (warn user to verify with Utah Division of Corporations)
- New name should still contain "Insurance Company" or "Insurance" to comply with Utah captive naming requirements
- If name changes, amended Articles of Incorporation must be filed with Utah Division of Corporations — flag this requirement

**Registered agent change:**
- New agent must have a physical Utah street address (P.O. boxes not permitted for registered agents)
- New agent must be either an individual Utah resident or a company authorized to do business in Utah

**Ownership change:**
- All ownership percentages must sum to exactly 100%
- Any new ultimate owner with > 10% interest may need to file a biographical affidavit with Utah DOI — flag this

**Domicile change:**
- Changing domicile state is a redomestication — this is a major regulatory event. Block the change and instruct the user to consult legal counsel.

### 3. Update data.json
Update the `entity` and/or `ownership` blocks with the new values.

### 4. Regenerate Doc 1 — Company Details
This is the primary identity document — all fields must be updated:
- Header: update legal name
- Legal Name section: update
- All address sections: update if address changed
- Statutory Agent section: update if agent changed
- Parent Chain section: update if ownership changed
- Beneficial Owners section: update ownership percentages and narrative

### 5. Regenerate Doc 12 — Articles of Incorporation
- **Article I (Name):** Update legal name
- **Article II (Registered Agent & Office):** Update agent name and address

> ⚠ If the legal name or registered agent changes, the **amended Articles must be filed with the Utah Division of Corporations** in addition to the DOI filing. Flag this explicitly.

### 6. Update Doc 13 — Bylaws
- Update the principal office reference in Article I (Offices) if address changed
- The governing law clause ("governed by the laws of the State of Utah") should NOT change unless domicile changes

### 7. Update Doc 15 — Operating Agreement
- Update party names in the preamble and recitals if parent/owner changed
- Update registered agent reference if agent changed
- Update any address references for the captive's principal place of business

### 8. Update Membership Agreement
- Update captive name in the recitals ("Sports and Entertainment Insurance Company, Inc., a Utah association captive...")
- Do a full-text search for the old legal name and replace all occurrences

### 9. Output Summary
```
ENTITY / OWNERSHIP CHANGE SUMMARY
Change type: [Legal Name / Registered Agent / Address / Ownership]
Previous: [Old value]
New: [New value]

Changes made:
  ✓ data.json entity/ownership fields updated
  ✓ Doc 1 — Company Details updated
  ✓ Doc 12 — Articles of Incorporation updated
  ✓ Doc 13 — Bylaws updated (if applicable)
  ✓ Doc 15 — Operating Agreement updated
  ✓ Membership Agreement — captive name updated

Warnings:
  ⚠ [Ownership % sum, naming requirements, etc.]

Action required:
  → [e.g., "Amended Articles of Incorporation must be filed with Utah Division of Corporations"]
  → [e.g., "New ultimate owner with >10% interest may require biographical affidavit — run personnel-change agent"]
```

## Validation Checks

- Legal name is identical (character for character) across all documents after update
- Registered agent name in Doc 1 matches exactly with Doc 12 Article II
- All ownership percentages sum to exactly 100%
- New registered agent has a physical Utah street address (not a P.O. box)
- Principal office address is a valid Utah address
- Legal name contains "Insurance" (Utah captive naming convention)
- If legal name changed: flag that amended Articles must be filed with Utah Division of Corporations
- If new owner with >10% interest: flag potential biographical affidavit requirement

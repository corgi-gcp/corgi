---
name: address-contact-update
description: "Update a mailing address, phone number, email, or contact person anywhere in the SEIC filing package. Use this skill whenever the user mentions updating an address, correcting a phone number, changing an email, or updating a contact person's information — for any person or entity in the filing. Triggers include: 'update address', 'change phone', 'new email', 'correct contact', 'address changed', 'wrong zip code', 'update mailing address', or any mention of a specific address string in the context of a correction."
---

# Address & Contact Update Agent

This skill finds and replaces any address, phone number, email address, or contact person name across all filing documents that contain it. Contact information appears in multiple documents and must be perfectly consistent throughout the package.

## Trigger Intent Examples

- "Update Nicolas Laqua's home address to 789 Oak Ave, Provo, UT 84601"
- "The captive manager's phone number changed to (801) 555-0199"
- "Fix the zip code on the statutory agent address — it should be 84101 not 84110"
- "The auditor's contact person is now Sarah Johnson, not Tom Williams"
- "Update the principal office address for SEIC"
- "Emily Yuan's email address changed"

## Where Contact Information Appears

| Entity / Person | Documents |
|---|---|
| SEIC principal office | Doc 1 |
| SEIC registered agent | Doc 1, Doc 12 |
| Application contact person | Doc 1 |
| Each director/officer (address) | Doc 2, Doc 7 (affidavit) |
| Captive Manager | Doc 3 |
| Legal Counsel | Doc 3 |
| Independent Auditor | Doc 3 |
| Actuary | Doc 3 |
| Investment Advisor | Doc 3 |
| Banking Institution | Doc 3, Doc 11 |
| Direct Parent | Doc 1 |
| Ultimate Owner | Doc 1, Doc 15 |

## Step-by-Step Logic

### 1. Identify the Target
Determine:
- **Who or what** is being updated (person name, company name, or entity type)
- **What field** is changing (address, phone, email, contact name)
- **New value** the field should contain

### 2. Locate All Occurrences
Search all 13 documents (plus data.json) for:
- The old address / phone / email string (exact match)
- Any variant formatting of the same value (e.g., "(801) 555-0101" vs. "801-555-0101")
- The person or company name associated with the contact info

Build a list of all locations found: `[Document, Section, Old Value]`

### 3. Validate the New Value

**Address:**
- Must contain street number, street name, city, state abbreviation, and ZIP code
- If this is a registered agent address: must be a physical Utah street address (no P.O. boxes)
- ZIP code format: 5 digits or 5+4 digits (e.g., 84101 or 84101-1234)

**Phone:**
- Normalize to consistent format: (###) ###-#### or ###-###-####
- Must be a valid US phone number (10 digits)

**Email:**
- Must contain @ and a valid domain
- Normalize to lowercase

### 4. Apply the Update
For each located occurrence, replace the old value with the new value.

**Preserve formatting:** If the old address was in a table cell, bold, or specific font, maintain that formatting in the replacement text.

**data.json:** Update the corresponding field in the correct object (person record, entity block, or provider block).

### 5. Handle Address Components Individually
If only part of an address is changing (e.g., just the ZIP code), update only that component — do not replace the full address string if only a piece changed. This prevents accidentally overwriting a correct address with a partially-typed new one.

### 6. Output Summary
```
ADDRESS / CONTACT UPDATE SUMMARY
Target: [Person or Entity Name]
Field: [Address / Phone / Email / Contact Name]
Old value: [Old string]
New value: [New string]

Occurrences updated:
  ✓ data.json — [field path]
  ✓ Doc 1 — [Section name]
  ✓ Doc 2 — [Officer detail block]
  ✓ Doc 3 — [Provider section]
  ✓ Doc 7 — [Affidavit personal info block]
  (list only docs where an occurrence was found)

Occurrences not found / skipped:
  – Doc X — [Reason: "address not present in this document"]

Warnings:
  ⚠ [Any P.O. box in a registered agent field / invalid format]
```

### 7. Post-Update Scan
After updating, run a secondary scan to confirm the old value no longer appears anywhere in the filing package. If any remaining occurrence is found, flag it for manual review.

## Validation Checks

- New address contains all required components (street, city, state, ZIP)
- Registered agent address is a physical Utah address (not P.O. box)
- Phone number is exactly 10 digits after stripping formatting
- Email address contains @ and valid domain
- All documents that previously contained the old value now contain the new value
- No occurrence of the old value remains in any document after update
- data.json updated in addition to all .docx files
- Format consistency: all phone numbers in the package use the same format style after update

---
name: service-provider-change
description: "Swap, add, or update any service provider across the entire SEIC filing package. Use this skill whenever the user mentions changing the captive manager, actuary, legal counsel, auditor, investment advisor, or banking institution. Triggers include: 'change captive manager', 'new actuary', 'replace legal counsel', 'update auditor', 'switch banks', 'new investment advisor', 'service provider update', or any mention of a provider company name in the context of a replacement or update."
---

# Service Provider Change Agent

This skill propagates any service provider change across all affected SEIC filing documents. A single provider update can touch up to four documents — this agent handles all of them consistently.

## Trigger Intent Examples

- "Change the captive manager from ABC Management to XYZ Captive Services"
- "We have a new actuary: Smith & Associates"
- "Update the banking institution to First National Bank of Utah"
- "Replace our investment advisor"
- "The auditor's address changed"

## Provider Categories

| Category | Key in data.json | Appears In |
|---|---|---|
| Captive Manager | `captive_manager` | Doc 3, Doc 8 |
| Legal Counsel | `legal_counsel` | Doc 3 |
| Independent Auditor | `auditor` | Doc 3 |
| Actuary | `actuary` | Doc 3, Doc 8 |
| Investment Advisor | `investment_advisor` | Doc 3, Doc 11 |
| Banking Institution | `bank` | Doc 3, Doc 11 |

## Documents Affected

| Document | What Changes |
|---|---|
| **Doc 3 — Service Providers** | Primary record — company name, contact, address, phone, email, services description, fees |
| **Doc 8 — Business Plan** | Narrative references to captive manager and actuary updated in relevant sections |
| **Doc 11 — Investment Policy** | Custodian name updated if banking institution changes; investment advisor name updated if advisor changes |
| **data.json** | Source of truth updated first |

## Step-by-Step Logic

### 1. Identify the Provider and Change Type
Determine:
- Which provider category is changing (captive manager / legal counsel / auditor / actuary / investment advisor / bank)
- Is it a **full replacement** (new company) or a **detail update** (address, contact person, fee structure)?

### 2. Update data.json
Update the relevant provider block:
```json
{
  "company_name": "New Company Name",
  "contact_name": "Contact Person",
  "contact_title": "Title",
  "address": "Full address",
  "phone": "Phone number",
  "email": "Email",
  "services_description": "Description of services",
  "contract_term": "Term",
  "fees_description": "Fee structure"
}
```

### 3. Regenerate Doc 3 — Service Providers
- Replace the entire section for the changed provider category
- All six categories must remain present; if a category becomes empty, insert `[MISSING: provider_name]`
- Preserve formatting: each category is its own labeled section with consistent field layout

### 4. Update Doc 8 — Business Plan (if applicable)
- **Captive Manager change:** Update the captive manager name in the "Operational Details" and "Service Providers" sections of the business plan narrative
- **Actuary change:** Update actuary name in the "Underwriting / Risk Management" and "Service Providers" sections
- Do a full-text search for the old company name and replace all occurrences

### 5. Update Doc 11 — Investment Policy (if applicable)
- **Banking Institution change:** Update the custodian name and address in the "Custodian Arrangements" section
- **Investment Advisor change:** Update the investment advisor name in the "Reporting & Oversight" section

### 6. Verify No Other Occurrences Remain
After all updates, scan all 13 documents for any remaining occurrence of the old provider name. If found, flag for manual review.

### 7. Output Summary
```
SERVICE PROVIDER CHANGE SUMMARY
Category: [e.g., Captive Manager]
Old: [Old Company Name]
New: [New Company Name]
Changes made:
  ✓ data.json updated
  ✓ Doc 3 — Service Providers updated
  ✓ Doc 8 — Business Plan narrative updated (if applicable)
  ✓ Doc 11 — Investment Policy updated (if applicable)

Warnings:
  ⚠ [Any remaining references found / missing fields]

Action required:
  → [e.g., "Update service agreement contract term in Doc 3 — currently set to [old term]"]
```

## Validation Checks

- All 6 provider categories remain populated after the change (no empty categories)
- New provider has at minimum: company name and address
- Old company name no longer appears in any of the affected documents
- If banking institution changed: custodian name in Doc 11 matches new bank name in Doc 3
- If investment advisor changed: advisor name in Doc 11 matches new entry in Doc 3
- If captive manager changed: Doc 8 narrative references match new name in Doc 3
- If actuary changed: Doc 8 narrative references match new name in Doc 3

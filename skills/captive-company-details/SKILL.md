---
name: captive-company-details
description: "Generate or update Document 1 — Captive Insurance Company Details for the SEIC Utah captive filing. Use this skill whenever the user mentions 'company details', 'captive details', 'entity information', 'Document 1', or needs to populate the company overview form for the Utah captive application. Also trigger when filling in legal name, principal office, statutory agent, parent/owner chain, organizational chart, or NAIC codes for SEIC."
---

# Captive Insurance Company Details (Document 1)

This skill generates the **Captive Insurance Company Details** document for Sports and Entertainment Insurance Company, Inc. (SEIC), the first document in the Utah captive insurance filing package.

## Document Purpose

This form captures the foundational identity of the captive: its legal name, domicile, office addresses, contact person, statutory agent, corporate parent chain, beneficial owners, organizational structure, association details, and NAIC classification codes.

## Data Fields to Extract from JSON

The following fields must be read from `data.json` and mapped into the document:

### Entity Identity
- `legal_name` — Full legal name of the captive (e.g. "Sports and Entertainment Insurance Company, Inc.")
- `dba_name` — Any DBA/trade name if applicable
- `captive_type` — Type of captive (Association Captive)
- `domicile_state` — State of domicile (Utah)
- `formation_date` — Expected or actual formation date

### Addresses
- `principal_office_address` — Statutory home office in Utah (street, city, state, zip)
- `records_address` — Address where books and records are maintained (may be same as principal office)
- `mailing_address` — Mailing address if different

### Application Contact
- `contact_name` — Primary contact person name
- `contact_title` — Title
- `contact_phone` — Phone number
- `contact_email` — Email address

### Statutory Agent
- `statutory_agent_name` — Name of registered agent for service of process
- `statutory_agent_address` — Agent's Utah address

### Corporate Parent Chain
- `direct_parent_name` — Immediate parent entity name
- `direct_parent_domicile` — Parent's state of domicile
- `ultimate_owner_name` — Ultimate beneficial owner entity
- `ultimate_owner_address` — Owner's address
- `ownership_percentage` — Ownership % of parent in captive (100%)
- `ownership_structure_description` — Narrative describing ownership chain and how association members indirectly own the captive

### Association Details
- `association_name` — Name of the association whose members the captive insures
- `association_description` — Description of the association and its members
- `member_count` — Number of current or projected members
- `member_eligibility` — Criteria for membership

### NAIC Codes
- `naic_codes` — List of applicable NAIC line-of-business codes with descriptions

### Organizational Chart
- `org_chart_description` — Text description of the org chart (the tool should also be able to embed or reference a diagram file)

## Template Structure

The output .docx should follow this section order:

1. **Header** — "SPORTS AND ENTERTAINMENT INSURANCE COMPANY — COMPANY DETAILS"
2. **Legal Name** — Full legal name paragraph
3. **Principal Place of Business & Records Address** — Office and records address
4. **Application Contact Person** — Name, title, phone, email
5. **Statutory Agent for Service of Process** — Agent name and address
6. **Direct Parent** — Parent name and domicile
7. **Beneficial and Ultimate Owners** — Ownership chain narrative with percentages
8. **Organizational Structure** — Org chart description or embedded image
9. **Association Information** — Association name, purpose, membership details
10. **NAIC Codes** — Table or list of applicable codes

## Generation Logic

1. Read `data.json` and extract all fields listed above.
2. Load the template .docx (from `Consultants - Filing Documents - Sports/1. Captive Insurance Company Details.docx`).
3. For each section, replace placeholder text or populate the corresponding paragraphs with JSON data.
4. If a field is missing or null in `data.json`, insert a highlighted placeholder `[MISSING: field_name]` so the reviewer can fill it in.
5. Save the output to the workspace for review.

## Validation Checks

After generation, verify:
- All required fields are populated (no `[MISSING:]` tags remain for critical fields)
- Phone number format is consistent (###-###-#### or (###) ###-####)
- Email format is valid
- Addresses include street, city, state, and ZIP
- Ownership percentages sum to 100%
- NAIC codes are valid and match the lines of coverage in Document 6

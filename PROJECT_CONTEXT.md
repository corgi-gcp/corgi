# Utah Captive Insurance Filing Tool — Project Context

## Purpose

This project automates the preparation and filing of regulatory documents required to operate **Sports and Entertainment Insurance Company, Inc. (SEIC)** as an association captive insurance company domiciled in Utah, under the Utah Insurance Code (Title 31A).

The tool reads a master JSON data file (`data.json`) containing all entity, officer, service-provider, financial, and coverage details, then populates each required filing document automatically. A verification/editing interface lets preparers review and tweak each document before final compilation into the submission package.

## Entity Overview

| Field | Value |
|---|---|
| Legal Name | Sports and Entertainment Insurance Company, Inc. (SEIC) |
| Type | Association Captive |
| Domicile | Utah |
| Parent | Sports Insurance Management Group, LLC (SIMG) |
| Ultimate Owner | Dane Administration, LLC |
| Statutory Home Office | 310 W Bearcat Drive, South Salt Lake, UT 84115 |
| Initial Capitalization | $5,000,000 (5,000 shares at $1,000/share) |
| Statutory Agent | Dane Administration, LLC |

## Tech Stack

- **Runtime:** Node.js / TypeScript
- **Document generation:** docx templating library (e.g. `docx` or `docxtemplater`)
- **Data source:** `data.json` — a single canonical JSON file that drives all documents
- **Verification UI:** TBD (CLI or lightweight web interface for per-document review)

## Architecture (High Level)

```
data.json
     │
     ▼
┌────────────┐
│  Parser     │  Reads JSON, normalizes into typed data model
└────┬───────┘
     │
     ▼
┌────────────────┐
│  Document       │  One generator per filing document
│  Generators     │  Each reads from the data model + a .docx template
└────┬───────────┘
     │
     ▼
┌────────────────┐
│  Verify & Edit  │  Per-document review interface
└────┬───────────┘
     │
     ▼
┌────────────────┐
│  Compiler       │  Assembles final submission package
└────────────────┘
```

## Filing Checklist (from SEIC Sports Captive tab)

The master tracker lists the following required documents. Each has a dedicated Cowork skill for generation/editing.

| # | Document | Skill Name |
|---|---|---|
| 1 | Captive Insurance Company Details | `captive-company-details` |
| 2 | Directors/Managers and Officers Details | `directors-officers` |
| 3 | Service Providers Details | `service-providers` |
| 4 | Captive Formation & Capitalization Details | `formation-capitalization` |
| 6 | Lines of Coverage Details | `lines-of-coverage` |
| 7a-d | Biographical Affidavits (4 officers) | `biographical-affidavit` |
| 8 | Business Plan | `business-plan` |
| 11 | CG – Investment Policy | `investment-policy` |
| 12 | CG – Articles of Incorporation | `articles-of-incorporation` |
| 13 | CG – Bylaws | `bylaws` |
| 15 | CG – Operating Agreement | `operating-agreement` |
| — | Membership Agreement | `membership-agreement` |

### Documents not yet in scope (external or pending)

- 5: Economic Benefit Details (prepared by actuary)
- 9: Feasibility Study (prepared by actuaries)
- 10: Appointment of Commissioner (needed at CPG stage)
- 14: Articles/Certificate of Organization (external filing)
- 17: Audited annual report of parent/sponsor (external)
- 18: Statement of personal net worth (N/A)
- 19.x: Policy Forms (9 lines — templates to be uploaded separately)
- Membership Rate Tables

## JSON Data Model

The canonical `data.json` file is the single source of truth. It is structured as a typed JSON object with top-level sections corresponding to each area of the filing:

```json
{
  "entity": { ... },               // Legal name, type, domicile, addresses, contact, statutory agent
  "ownership": { ... },            // Parent chain, ultimate owner, ownership percentages
  "association": { ... },          // Association name, description, member count, eligibility
  "naic_codes": [ ... ],           // NAIC line-of-business codes
  "directors_officers": [ ... ],   // Array of person objects
  "service_providers": { ... },    // Keyed by category: captiveManager, legalCounsel, etc.
  "formation": { ... },            // Entity type, formation date, fiscal year end
  "capitalization": { ... },       // Shares, paid-in capital, surplus, LOC, total
  "lines_of_coverage": [ ... ],    // Array of coverage line objects (9 lines)
  "financial_projections": [ ... ],// 5-year projection rows
  "investment_policy": { ... },    // Asset classes, custodian, prohibited investments
  "governance": { ... },           // Board size, meeting rules, quorum, officer terms
  "membership_agreement": { ... }  // Eligibility, premium terms, withdrawal, indemnification
}
```

See `data.json` in the project root for the fully populated data file.

## How Skills Work Together

1. User places/updates `data.json` in the workspace root.
2. User invokes a per-document skill (e.g. "fill in the Articles of Incorporation").
3. The skill reads `data.json`, maps fields to the document template, generates/updates the .docx.
4. User reviews the output, makes edits, re-runs if needed.
5. After all documents pass review, the compiler skill packages the submission.

## Regulatory References

- Utah Insurance Code, Title 31A, Chapter 37 (Captive Insurance Companies)
- Utah Admin. Code R590-250 (Captive Insurer Rules)
- Utah Department of Insurance captive application checklist

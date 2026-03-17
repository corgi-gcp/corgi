# Utah Captive Insurance Filing Tool — Project Context

## Purpose

This project automates the preparation and filing of regulatory documents required to operate **Sports and Entertainment Insurance Company, Inc. (SEIC)** as an association captive insurance company domiciled in Utah, under the Utah Insurance Code (Title 31A).

The tool reads a master CSV data file containing all entity, officer, service-provider, financial, and coverage details, then populates each required filing document automatically. A verification/editing interface lets preparers review and tweak each document before final compilation into the submission package.

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
- **Data source:** CSV file parsed at runtime (one canonical data file drives all documents)
- **Verification UI:** TBD (CLI or lightweight web interface for per-document review)

## Architecture (High Level)

```
CSV Data File
     │
     ▼
┌────────────┐
│  Parser     │  Reads CSV, normalizes into typed data model
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

## CSV Data Model

The canonical CSV file is the single source of truth. It should contain sections/columns covering:

- **Entity info:** legal name, type, domicile, addresses, statutory agent, parent chain, ownership percentages
- **Contact:** application contact name, title, phone, email
- **Officers & Directors:** for each person — name, title, roles, address, biographical details
- **Service providers:** captive manager, legal counsel, auditor, actuary, investment advisor, bank — with names, addresses, contact info, roles
- **Formation & capitalization:** formation date, initial capital, share structure, par value, surplus, LOC details
- **Lines of coverage:** for each line — name, form type, limit, SIR/deductible, gross premium, reinsurance details, claims basis
- **Financial projections:** 5-year premium, loss, expense, and surplus projections
- **Investment policy parameters:** asset classes, allocation targets, limits, custodian
- **Governance fields:** fiscal year, meeting frequency, quorum rules, officer terms, indemnification scope

## How Skills Work Together

1. User places/updates the CSV data file in the workspace.
2. User invokes a per-document skill (e.g. "fill in the Articles of Incorporation").
3. The skill reads the CSV, maps fields to the document template, generates/updates the .docx.
4. User reviews the output, makes edits, re-runs if needed.
5. After all documents pass review, the compiler skill packages the submission.

## Regulatory References

- Utah Insurance Code, Title 31A, Chapter 37 (Captive Insurance Companies)
- Utah Admin. Code R590-250 (Captive Insurer Rules)
- Utah Department of Insurance captive application checklist

---
name: document-formatting
description: "Apply or restore proper formatting to any SEIC filing document or the full compiled package. Use this skill whenever the user mentions formatting issues, wants to apply consistent styles, needs to add a logo or letterhead, wants to fix fonts or spacing, needs to prepare a document for submission, or wants to compile all documents into a final submission-ready package. Triggers include: 'fix formatting', 'apply logo', 'add letterhead', 'prepare for submission', 'compile the package', 'fix fonts', 'add page numbers', 'make it look professional', 'format the document', 'add cover page', 'fix table formatting', or 'submission-ready'."
---

# Document Formatting Agent

This skill enforces section-level formatting rules across all 13 SEIC filing documents. It runs as a post-processing step after any content change, or on demand when preparing the final submission package. It never changes content — only presentation.

## When to Run

- **After any content agent** makes edits (personnel-change, coverage-line-change, etc.) to restore formatting integrity
- **Before submission** to produce the final, polished package
- **On demand** when any formatting inconsistency is reported

## Global Style Specifications

These rules apply to every document in the package unless a document-specific override applies:

| Element | Specification |
|---|---|
| Body font | Times New Roman, 12pt |
| Body line spacing | 1.15 |
| Body paragraph spacing | 6pt after |
| Page margins | 1 inch all sides |
| Page size | Letter (8.5 × 11 inches) |
| Header font | Times New Roman, 10pt, gray (#595959) |
| Footer font | Times New Roman, 10pt, gray (#595959) |
| Heading 1 | Times New Roman, 16pt, bold, dark navy (#1a237e) |
| Heading 2 | Times New Roman, 14pt, bold, dark navy (#1a237e) |
| Heading 3 | Times New Roman, 12pt, bold, dark navy (#1a237e) |
| Table header row | Calibri 11pt bold, white text, navy background (#1a237e) |
| Table body rows | Calibri 11pt, alternating white / light blue (#e8eaf6) |
| Table borders | 0.5pt, gray (#bdbdbd) |
| Defined terms | Bold on first use |
| Monetary values | Right-aligned in tables, $ with comma separators |
| Percentages | Right-aligned in tables, 1 decimal place |

## Logo and Letterhead Specifications

**Logo placement:**
- File: `assets/seic-logo.png` (if available) or `assets/seic-logo.svg`
- Position: Top-left of the cover page and top-left of the running header
- Cover page size: 2 inches wide, proportional height
- Header size: 0.5 inches wide, proportional height
- Minimum clear space around logo: 0.25 inches on all sides

**Letterhead (cover page only):**
```
[LOGO]                    Sports and Entertainment Insurance Company, Inc.
                          Utah Association Captive Insurance Company
                          [Principal Office Address]
                          [Phone] | [Email]
────────────────────────────────────────────────────────────────
```

**Running header (all body pages after cover):**
```
[LOGO]   SEIC — [Document Title] — CONFIDENTIAL          Page X of Y
```

**Footer (all pages):**
```
Sports and Entertainment Insurance Company, Inc. | Utah DOI Filing | [Year]
```

---

## Per-Document Formatting Rules

### Doc 1 — Captive Insurance Company Details
- **Cover page:** Full letterhead with document title "CAPTIVE INSURANCE COMPANY DETAILS — DOCUMENT 1"
- **Section headers:** Heading 2, all-caps, navy underline
- **Field labels:** Bold, followed by colon, content on same line or indented below
- **Address blocks:** Indented 0.5 inches, single-spaced
- **NAIC codes:** Formatted as a two-column table (Code | Description)
- **Org chart:** If text-based, use indented bullet hierarchy; if image, center-aligned, 4-inch max width

### Doc 2 — Directors & Officers
- **Cover page:** Full letterhead with title "DIRECTORS, MANAGERS AND OFFICERS — DOCUMENT 2"
- **Summary table:** Full-width, alternating row shading, 5 columns (Name | Title | Director | Term | Affidavit Status)
- **Individual detail blocks:** Each person has a Heading 2 section with a sub-table for fields (Label | Value), no outer border
- **Director/Officer status:** Use checkmark (✓) or dash (–) in the summary table, not "Yes"/"No"

### Doc 3 — Service Providers
- **Cover page:** Full letterhead with title "SERVICE PROVIDERS — DOCUMENT 3"
- **Provider category headers:** Heading 2, category name in all-caps
- **Provider detail:** Two-column table (Field | Value) per provider, compact row height
- **Six categories must appear in this order:** Captive Manager → Legal Counsel → Independent Auditor → Actuary → Investment Advisor → Banking Institution

### Doc 4 — Formation & Capitalization
- **Cover page:** Full letterhead with title "CAPTIVE FORMATION AND CAPITALIZATION — DOCUMENT 4"
- **Share Structure table:** Three columns (Item | Count | Notes), right-aligned numbers
- **Capitalization table:** Three columns (Component | Amount | Notes), right-aligned dollar amounts, bold Total row with top border
- **LOC Details:** Boxed subsection if LOC > 0; hidden if LOC = 0
- **Dollar format:** $X,XXX,XXX (no decimals for whole dollars)

### Doc 6 — Lines of Coverage
- **Cover page:** Full letterhead with title "LINES OF COVERAGE — DOCUMENT 6"
- **Coverage summary table:** Full-width, one row per line, columns: Line Name | Basis | Per-Occ Limit | Aggregate | Gross Premium | Net Premium
- **Per-line sections:** Each line gets its own Heading 2 section with a compact two-column detail table
- **Reinsurance summary table:** Appears after all line sections; columns: Line | Reinsurer | Structure | Cession % | Net Premium
- **Premium summary:** Bold totals row at the bottom of the coverage summary table

### Doc 7a–7d — Biographical Affidavits
- **No running header on page 1** (it is the form header)
- **Form header:** SEIC logo top-left, "BIOGRAPHICAL AFFIDAVIT" title centered, document reference number top-right
- **Section labels:** Bold, 12pt, underlined
- **Employment history table:** Six columns (Employer | Title | City/State | Start | End | Full-Time?), 10pt Calibri
- **Disclosure questions:** Each question on its own line, checkbox-style (☐ Yes ☐ No), answer space indented
- **Signature block:** Single solid line for signature, double line space above, "Date:" field on same row as line, right side; "Printed Name:" below signature line
- **One affidavit per document file** (7a.docx, 7b.docx, 7c.docx, 7d.docx)

### Doc 8 — Business Plan
- **Cover page:** Full letterhead, title "BUSINESS PLAN — DOCUMENT 8", subtitle "Sports and Entertainment Insurance Company, Inc.", filing year
- **Table of Contents:** Auto-generated after cover page, Heading 1/2 entries only, with page numbers
- **Section numbering:** Numbered sections (1. Executive Summary, 2. Company Overview, etc.), Heading 1
- **Subsection numbering:** 1.1, 1.2, etc., Heading 2
- **Projections table:** Full-width, one column per year plus row labels; monetary rows right-aligned $; ratio rows right-aligned %; bold heading row; bold totals/derived-fields rows with light shading
- **Narrative paragraphs:** Justified alignment, 12pt Times New Roman

### Doc 11 — Investment Policy
- **Cover page:** Full letterhead, title "INVESTMENT POLICY — DOCUMENT 11"
- **Article numbering:** "ARTICLE I — TITLE", "ARTICLE II — PURPOSE", etc. — all-caps, Heading 1
- **Section numbering:** 1.1, 1.2, etc., Heading 2
- **Asset allocation table:** Three columns (Asset Class | Max Allocation % | Quality Minimum), right-aligned percentages, bold Total row
- **Prohibited investments list:** Bulleted, indented 0.5 inches
- **Approval/signature block:** Two-column signature block at the end (Name/Title | Signature/Date)

### Doc 12 — Articles of Incorporation
- **Cover page:** Full letterhead, "ARTICLES OF INCORPORATION — DOCUMENT 12", subtitle "A Utah Corporation"
- **Article headings:** "ARTICLE I", "ARTICLE II", etc. — centered, bold, all-caps, Heading 1, underlined
- **Article content:** Indented 0.5 inches, justified
- **Incorporator signature block:** Right-aligned, single underline for signature, "Date:" field
- **No alternating shading** — legal documents use plain white body

### Doc 13 — Bylaws
- **Cover page:** Full letterhead, "BYLAWS — DOCUMENT 13", subtitle "Of Sports and Entertainment Insurance Company, Inc."
- **Article headings:** Same style as Doc 12 — centered, bold, all-caps, Heading 1
- **Section headings:** "Section 1.", "Section 2.", bold, followed by section title in title case — Heading 2
- **Body text:** Justified, 12pt, no extra indentation
- **Table of Contents:** Auto-generated after cover page
- **No alternating shading** — legal documents use plain white body

### Doc 15 — Operating Agreement
- **Cover page:** Full letterhead, "OPERATING AGREEMENT — DOCUMENT 15"
- **Article headings:** Same as Bylaws style
- **Defined terms:** First use bold + all-caps (e.g., **"AGREEMENT"**, **"UNITS"**)
- **Exhibit A:** Separate page break, title "EXHIBIT A — MEMBERS AND CAPITAL CONTRIBUTIONS", formatted as a table (Member Name | Unit Class | Units | Capital Contribution | % Interest)

### Membership Agreement
- **Cover page:** Full letterhead, "MEMBERSHIP AGREEMENT"
- **Article headings:** Same as Bylaws style
- **Exhibit B:** Separate page break, title "EXHIBIT B — COVERAGE SUMMARY", formatted as a table matching Doc 6 summary table format
- **Rate Tables (Exhibit A):** If included, formatted as a multi-column rate table with bordered cells

---

## Compilation Mode (Full Package)

When preparing the final submission package, this agent also:

1. **Adds a Master Cover Page:**
   - SEIC logo, full letterhead
   - Title: "UTAH CAPTIVE INSURANCE FILING PACKAGE"
   - Subtitle: "Sports and Entertainment Insurance Company, Inc."
   - Filing date, contact person, document count

2. **Adds a Master Table of Contents:**
   - Lists all 13 documents with document number, title, and starting page number

3. **Paginates the entire package sequentially** (page 1 through the final page of the last document)

4. **Applies consistent running headers and footers** across all documents with correct page references

5. **Outputs:** A single compiled .docx file named `SEIC_Utah_Filing_Package_[Date].docx`

---

## Validation Checks

- All documents use Times New Roman 12pt for body text
- All cover pages have the SEIC logo in the correct position and size
- All Heading 1/2/3 use the correct font size, weight, and color
- All tables use the correct header row color (#1a237e) and alternating row shading (legal docs: no shading)
- All dollar amounts formatted as $X,XXX,XXX with right-alignment
- All percentages formatted as X.X% with right-alignment
- Running header appears on all body pages (not the cover page)
- Footer appears on all pages including cover
- Page numbers are sequential and correct
- No content was altered during formatting — only presentation elements changed
- Compiled package: all 13 documents present, master TOC page numbers match actual document starting pages

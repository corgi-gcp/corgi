---
name: directors-officers
description: "Generate or update Document 2 — Directors/Managers and Officers Details for the SEIC Utah captive filing. Use this skill whenever the user mentions 'directors', 'officers', 'managers', 'board members', 'Document 2', or needs to populate the D&O details form. Also trigger when working with officer names, titles, roles, terms, or the governance roster for the captive."
---

# Directors/Managers and Officers Details (Document 2)

This skill generates the **Directors/Managers and Officers Details** document for SEIC.

## Document Purpose

Lists every director, manager, and officer of the captive with their personal details, titles, roles, term dates, and background information. Utah requires this to assess the fitness of the people governing the captive.

## Data Fields to Extract from JSON

For each director/officer, extract:

- `full_name` — Full legal name
- `title` — Corporate title(s) (e.g. "President, Director")
- `role_description` — Brief description of responsibilities
- `address` — Business or residential address
- `phone` — Contact phone
- `email` — Contact email
- `term_start` — Start date of current term
- `term_end` — End date of current term (or "until successor elected")
- `is_director` — Boolean: serves on the board
- `is_officer` — Boolean: holds officer position
- `biographical_affidavit_filed` — Whether bio affidavit is on file with Utah DOI from a prior submission

### Known Officers for SEIC
The current roster includes:
1. Nicolas Scott Laqua — President, Director
2. Emily Zeng Yuan — VP, Secretary, Director
3. Seth Heber Beddes — Assistant Secretary, Director
4. Mike Brown — Treasurer

## Template Structure

1. **Header** — "DIRECTORS/MANAGERS AND OFFICERS DETAILS"
2. **Summary Table** — Name | Title | Director? | Officer? | Term
3. **Individual Detail Sections** — One section per person with full contact info and role description
4. **Biographical Affidavit Status** — Notes on which individuals have affidavits on file vs. required

## Generation Logic

1. Read officer/director records from `data.json`.
2. Load template from `2. Directors_Managers and Officers.docx`.
3. Populate the summary table and individual sections.
4. Flag any person missing required fields with `[MISSING: field_name]`.
5. Save output for review.

## Validation Checks

- At least 3 directors listed (Utah minimum for a corporation)
- Each person has a unique name and at least one role
- Term dates are logically consistent (start < end)
- At least one person holds each of: President, Secretary, Treasurer

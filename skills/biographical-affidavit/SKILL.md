---
name: biographical-affidavit
description: "Generate or update Documents 7a–7d — Biographical Affidavits for SEIC directors and officers. Use this skill whenever the user mentions 'biographical affidavit', 'bio affidavit', 'NAIC biographical', 'Document 7', or needs to prepare the personal background disclosure forms for any officer or director of the captive. Also trigger when the user references background checks, fingerprints, or personal history statements for captive filings."
---

# Biographical Affidavits (Documents 7a–7d)

This skill generates **Biographical Affidavit** documents for each director and officer of SEIC.

## Document Purpose

Utah requires a biographical affidavit (typically the NAIC Uniform Biographical Affidavit form) for every director, manager, and officer of the captive. Officers who filed an affidavit in a prior submission may be exempt from re-filing.

## Data Fields to Extract from JSON

For each individual requiring an affidavit:

- `full_name` — Full legal name
- `other_names` — Any former or other names used
- `date_of_birth` — DOB
- `ssn_last_four` — Last 4 digits of SSN (for identification only, not stored in output)
- `home_address` — Current residential address
- `citizenship` — Country of citizenship
- `title_at_captive` — Title(s) held at SEIC
- `employment_history` — Last 10 years of employment (employer, title, dates)
- `education` — Educational background (institution, degree, year)
- `professional_licenses` — Any insurance or professional licenses
- `criminal_history` — Whether any criminal convictions (yes/no + details if yes)
- `regulatory_actions` — Any prior regulatory actions or denials
- `prior_affidavit_on_file` — Boolean: whether Utah DOI already has this person's affidavit from a prior filing

### Known Individuals
- 7a: Nicolas Scott Laqua (President, Director) — prior affidavit on file
- 7b: Emily Zeng Yuan (VP, Secretary, Director) — prior affidavit on file
- 7c: Seth Heber Beddes (Assistant Secretary, Director) — prior affidavit on file
- 7d: Mike Brown (Treasurer) — new affidavit required

## Template Structure

Each affidavit follows the NAIC Uniform Biographical Affidavit format:

1. **Personal Information** — Name, DOB, address, citizenship
2. **Position Information** — Title and role at the captive
3. **Employment History** — 10-year employment history table
4. **Education** — Degrees and institutions
5. **Professional Designations/Licenses**
6. **Criminal History Disclosure**
7. **Regulatory History Disclosure**
8. **Certification and Signature Block**

## Generation Logic

1. Read officer records from `data.json`.
2. For each person where `prior_affidavit_on_file` is false, generate a full affidavit.
3. For each person where `prior_affidavit_on_file` is true, generate a cover note stating the affidavit is already on file with the Utah DOI.
4. Use the NAIC form layout for new affidavits.
5. Flag sensitive fields that need manual completion (SSN, signature).
6. Save each affidavit as a separate file (e.g. `7a_Biographical_Affidavit_Laqua.docx`).

## Validation Checks

- Employment history covers at least the last 10 years
- No gaps in employment history > 6 months without explanation
- All yes/no disclosure questions are answered
- Signature block is present (even if blank for later signing)

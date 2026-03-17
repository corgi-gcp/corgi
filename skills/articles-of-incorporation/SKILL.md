---
name: articles-of-incorporation
description: "Generate or update Document 12 — CG Articles of Incorporation for the SEIC Utah captive filing. Use this skill whenever the user mentions 'articles of incorporation', 'corporate charter', 'Document 12', or needs to prepare the articles for the captive insurance company. Also trigger for incorporator details, corporate purposes clause, share authorization, registered agent designation, or initial director appointments in the articles."
---

# CG — Articles of Incorporation (Document 12)

This skill generates the **Articles of Incorporation** corporate governance document for SEIC.

## Document Purpose

The Articles of Incorporation are the founding charter filed with the Utah Division of Corporations. They define the captive's name, purpose, share structure, registered agent, initial directors, and incorporator. Utah DOI reviews these as part of the captive application.

## Data Fields to Extract from JSON

- `legal_name` — Full corporate name
- `purpose_clause` — Corporate purpose (to operate as an association captive insurance company under Utah Title 31A, Chapter 37)
- `domicile_state` — Utah
- `registered_agent_name` — Registered agent name
- `registered_agent_address` — Agent's Utah address
- `authorized_shares` — Number of authorized shares
- `par_value` — Par value per share
- `share_classes` — Description of share classes (common only, or common + preferred)
- `incorporator_name` — Name of incorporator
- `incorporator_address` — Address of incorporator
- `initial_directors` — List of initial directors (name and address for each)
- `perpetual_existence` — Whether the corporation has perpetual existence (yes/no)
- `indemnification_clause` — Indemnification provisions for directors and officers

## Template Structure

1. **Article I — Name** — Legal name of the corporation
2. **Article II — Registered Agent & Office** — Agent name and Utah address
3. **Article III — Purpose** — Corporate purpose clause referencing Utah captive law
4. **Article IV — Authorized Shares** — Number, par value, classes
5. **Article V — Initial Directors** — Names and addresses
6. **Article VI — Incorporator** — Name and address
7. **Article VII — Duration** — Perpetual existence
8. **Article VIII — Indemnification** — D&O indemnification provisions
9. **Article IX — Amendment** — Process for amending the articles
10. **Signature Block** — Incorporator signature and date

## Generation Logic

1. Read corporate formation fields from `data.json`.
2. Load template from `12. CG - Articles of Incorporation.docx`.
3. Populate each article with the corresponding data.
4. Ensure the purpose clause specifically references Utah Title 31A, Chapter 37.
5. Save output.

## Validation Checks

- Legal name matches across all documents
- Registered agent is the same entity listed in Document 1
- Authorized shares match Document 4
- At least 3 initial directors listed
- Purpose clause references captive insurance under Utah law

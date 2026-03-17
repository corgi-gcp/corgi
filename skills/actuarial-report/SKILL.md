---
name: actuarial-report
description: "Generate Document 10 — Actuarial Report transmittal and data package for the SEIC Utah captive filing. Use this skill whenever the user needs to prepare the actuarial report section, assemble the data package for the actuary, validate actuarial assumptions against the filing, or generate the actuarial opinion cover wrapper. Triggers include: 'actuarial report', 'Document 10', 'actuary data package', 'loss reserve analysis', 'actuarial opinion', 'prepare for actuary', 'actuarial assumptions', or 'reserve certification'."
---

# Actuarial Report (Document 10)

This skill prepares the actuarial report package for SEIC's Utah captive filing. The actuary provides the substantive opinion — this agent generates the transmittal wrapper, assembles the complete data package the actuary needs to certify the reserves, and validates that the actuarial assumptions used in the filing are internally consistent.

## Document Purpose

Document 10 serves two functions in the filing:

1. **The Actuarial Opinion Letter** — A signed letter from the actuary certifying that the loss reserves and premium rates are adequate. The actuary writes and signs this; the agent generates the structured template and populates all SEIC-specific fields.

2. **The Actuarial Data Package** — The complete set of data the actuary uses to produce their opinion. This agent assembles this package from `data.json` and the filing documents, ensuring the actuary has everything they need in a clean, organized format.

---

## Part A — Actuarial Opinion Letter Template

The agent generates a pre-populated template for the actuary to review, complete, and sign.

### Opinion Letter Structure

```
[ACTUARY FIRM LETTERHEAD]

[Date]

Utah Department of Insurance
Captive Insurance Division
State Office Building
Salt Lake City, Utah 84114

RE: Actuarial Opinion — Sports and Entertainment Insurance Company, Inc.
    Utah Association Captive — Initial Filing

Dear Commissioner,

OPINION

I, [Actuary Name], [Credentials — FCAS, MAAA, etc.], of [Firm Name], have been retained
by Sports and Entertainment Insurance Company, Inc. ("SEIC" or the "Company") to provide
an actuarial opinion in connection with the Company's application for a certificate of
authority as a Utah association captive insurance company pursuant to Utah Code Title 31A,
Chapter 37.

SCOPE OF REVIEW
I have reviewed the following materials in connection with this opinion:
  • Business Plan (Document 8), dated [date]
  • Lines of Coverage Details (Document 6), dated [date]
  • Pro Forma Financial Statements (Document 9), dated [date]
  • Feasibility Study prepared by [Feasibility Study Author], dated [date]
  • [Any additional materials]

STATEMENT OF ACTUARIAL OPINION
In my opinion:

1. PREMIUM ADEQUACY
   The gross premium rates for each line of coverage are reasonable and adequate to
   support the projected losses and expenses as set forth in the Business Plan.

2. LOSS RESERVES
   The loss and loss adjustment expense reserves as presented in the Pro Forma Financial
   Statements are computed in accordance with sound actuarial principles and are, in my
   opinion, adequate to meet the Company's future obligations.

3. CAPITAL ADEQUACY
   The initial capitalization of $[amount] is adequate to support the Company's proposed
   lines of business and risk exposures, consistent with the requirements of
   Utah Code §31A-37-203.

4. FINANCIAL PROJECTIONS
   The five-year financial projections presented in the Business Plan reflect reasonable
   actuarial assumptions regarding future loss experience, premium growth, and expense levels.

QUALIFICATIONS
[Actuary credentials and independence statement]

SIGNATURE
_________________________________    Date: _______________
[Actuary Name], [Credentials]
[Firm Name]
[Address]
[Phone / Email]
```

---

## Part B — Actuarial Data Package

The agent assembles a structured data package from `data.json` and the filing documents, organized into the sections the actuary needs.

### Package Contents

**Section 1 — Entity Overview**
- SEIC legal name, captive type, domicile
- Parent and ownership structure
- Association description and member count (Year 1 projected)

**Section 2 — Lines of Coverage Summary**
Extracted from Doc 6 — one row per line:

| Line | Basis | Per-Occ Limit | Aggregate | Deductible/SIR | Gross Premium | Reinsurance |
|---|---|---|---|---|---|---|
| CGL | Occurrence | $X,XXX,XXX | $X,XXX,XXX | $X,XXX | $XXX,XXX | None |
| ... | | | | | | |

**Section 3 — Financial Projections Data**
Extracted from Doc 8 — full 5-year projections table in clean tabular format:

| Year | Members | GWP | NWP | NEP | Losses | LR | Expenses | ER | CR | Surplus |
|---|---|---|---|---|---|---|---|---|---|---|
| 1 | | | | | | | | | | |
| ... | | | | | | | | | | |

**Section 4 — Capitalization Structure**
Extracted from Doc 4:
- Paid-in capital, paid-in surplus, LOC amount, total capitalization
- Comparison to Utah minimum capital requirement ($250,000)

**Section 5 — Reinsurance Program Summary**
Extracted from Doc 6 reinsurance fields:
- Per-line reinsurance type, structure, reinsurer, and net retention

**Section 6 — Key Assumptions for Actuary to Certify**
A checklist of the actuarial assumptions embedded in the filing that require the actuary's sign-off:

```
□ Loss ratio assumptions (by line and by year) — see Projection Table
□ Premium rate adequacy (by line) — see Lines of Coverage
□ Reserve adequacy — see Pro Forma Balance Sheet
□ Minimum capital adequacy — see Formation & Capitalization
□ Tail factor for claims-made lines — see Lines of Coverage
□ Investment return assumption — see Investment Policy
□ Reinsurance recoverability — see Reinsurance Program
```

---

## Generation Logic

1. Read all relevant fields from `data.json`.
2. Extract supplementary data from Doc 6, Doc 8, and Doc 4.
3. Generate Part A (Opinion Letter Template) pre-populated with all SEIC-specific fields.
4. Generate Part B (Data Package) as a clean structured exhibit.
5. Bundle both parts into a single Document 10 file.
6. Flag any fields in the opinion template that are left blank for the actuary to complete (mark with `[ACTUARY TO COMPLETE]`).

---

## Consistency Validation

Before delivering the data package to the actuary, validate:

- All 9 coverage lines in the data package match Doc 6 exactly
- Financial projections in the data package match Doc 8 exactly
- Capitalization amount in the data package matches Doc 4 exactly
- Reinsurance structures in the data package match the reinsurance fields in Doc 6
- No `[MISSING:]` placeholders remain in the data package sections
- Loss ratios in the projection table are not lower than the feasibility study's projections (if feasibility study has been reviewed — cross-reference with feasibility-study-review output)

---

## Validation Checks

- Opinion letter template contains all required opinion statements (premium adequacy, loss reserves, capital adequacy, projections)
- Actuary name and credentials are populated or flagged `[ACTUARY TO COMPLETE]`
- Data package contains all 6 sections
- All 9 coverage lines present in Section 2
- All 5 projection years present in Section 3
- No discrepancy between data package figures and source documents (Doc 4, Doc 6, Doc 8)
- Key assumptions checklist is complete with one item per major actuarial assumption
- If feasibility-study-review has been run: no Priority 1 discrepancies remain unresolved before the actuary is sent the data package

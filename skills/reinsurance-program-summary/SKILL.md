---
name: reinsurance-program-summary
description: "Generate Document 14 — Reinsurance Program Summary for the SEIC Utah captive filing. Use this skill whenever the user needs to generate or update the formal reinsurance disclosure document, compile the reinsurance treaty checklist, or produce the reinsurance program summary for the regulator. Triggers include: 'reinsurance program summary', 'Document 14', 'reinsurance disclosure', 'compile reinsurance docs', 'reinsurance treaties', 'reinsurance program document', 'formal reinsurance summary', or 'reinsurance checklist'."
---

# Reinsurance Program Summary (Document 14)

This skill generates the formal reinsurance program disclosure document for SEIC's Utah captive filing. It compiles all reinsurance data from `data.json` and Doc 6 into a structured regulatory disclosure document, and produces a checklist of physical treaty documents that must be attached to complete the filing.

## Document Purpose

Document 14 formally discloses SEIC's full reinsurance program to the Utah DOI. Regulators require this to assess:
- Whether the captive retains an appropriate level of risk
- Whether the reinsurers are financially sound
- Whether the reinsurance structures are appropriate for the lines written
- That the net premiums and retentions in the filing documents are accurate

---

## Data Source

All reinsurance data drawn from `data.json` coverage lines and Doc 6:

```json
{
  "coverage_lines": [
    {
      "line_name": "...",
      "gross_premium": 0,
      "net_premium": 0,
      "reinsurance_type": "quota share | excess of loss | stop loss | facultative | none",
      "reinsurance_structure": "e.g., 50% quota share",
      "reinsurer_name": "...",
      "reinsurer_am_best_rating": "...",
      "cession_percentage": 0,
      "attachment_point": null,
      "reinsurance_limit": null,
      "treaty_effective_date": "...",
      "treaty_expiry_date": "...",
      "treaty_reference_number": "..."
    }
  ]
}
```

---

## Document Structure

### Cover Page
SEIC letterhead, title "REINSURANCE PROGRAM SUMMARY — DOCUMENT 14", filing date.

---

### Section 1 — Program Overview

A narrative paragraph describing the overall reinsurance philosophy and strategy:

```
Sports and Entertainment Insurance Company, Inc. ("SEIC") has established a reinsurance
program designed to manage its net risk exposure across its [N] lines of coverage.
The program consists of [quota share / excess of loss / mixed] arrangements with
[N] reinsurance partners, all of which are [authorized / accredited] reinsurers
in the State of Utah.

Total gross written premium: $X,XXX,XXX
Total ceded premium:         $X,XXX,XXX
Total net written premium:   $X,XXX,XXX
Overall cession percentage:  XX.X%
```

---

### Section 2 — Reinsurance Program Summary Table

Full-width table, one row per reinsured line:

| Coverage Line | Structure | Reinsurer | A.M. Best | Attachment | Limit | Cession % | Gross Premium | Ceded Premium | Net Premium |
|---|---|---|---|---|---|---|---|---|---|
| CGL | Quota Share | [Reinsurer] | A+ | N/A | N/A | 30% | $450,000 | $135,000 | $315,000 |
| Cyber | XL | [Reinsurer] | A | $500,000 | $2,000,000 | N/A | $200,000 | $80,000 | $120,000 |
| [Retained lines] | None — Retained | — | — | — | — | 0% | $XXX,XXX | $0 | $XXX,XXX |

**Totals row:** Bold, sum of all monetary columns.

---

### Section 3 — Per-Reinsurer Detail

One section per unique reinsurer (not per line), consolidating all lines with that reinsurer:

```
REINSURER: [Full Legal Name]
  A.M. Best Rating:        [Rating and outlook]
  Domicile:                [State / Country]
  NAIC Number:             [If applicable]
  Lines Covered:           [List of lines]
  Total Ceded Premium:     $X,XXX,XXX
  Treaty Reference:        [Treaty number or "See attached"]
  Treaty Effective Date:   [Date]
  Treaty Expiry Date:      [Date]
  Type of Authority:       [Authorized / Accredited / Approved / Alien]
```

---

### Section 4 — Retained Lines

Table of lines with no reinsurance, confirming full retention:

| Coverage Line | Gross Premium | Retention | Reason for Full Retention |
|---|---|---|---|
| Participant Accident Medical | $XXX,XXX | 100% | High-frequency, low-severity — retained per risk management policy |
| Equipment Floater | $XXX,XXX | 100% | Aggregate exposure within surplus tolerance |

---

### Section 5 — Treaty Document Checklist

A checklist of physical reinsurance treaty documents required to complete the filing:

```
REINSURANCE TREATY DOCUMENT CHECKLIST

The following executed reinsurance agreements must be attached to Document 14
before submission to the Utah Department of Insurance:

□ [Reinsurer A] — Quota Share Treaty — [Lines covered]
    Treaty #: [Reference]          Status: [ ] Attached  [ ] Pending
    Expected from: [Reinsurer contact name]

□ [Reinsurer B] — Excess of Loss Treaty — [Lines covered]
    Treaty #: [Reference]          Status: [ ] Attached  [ ] Pending
    Expected from: [Reinsurer contact name]

Lines with no treaty required (fully retained):
  ✓ [Line 1] — No reinsurance
  ✓ [Line 2] — No reinsurance
```

---

### Section 6 — Reinsurer Financial Strength Confirmation

Regulatory attestation that all reinsurers meet Utah's financial strength requirements:

```
All reinsurers listed in this program summary:

□ Are licensed, accredited, or approved reinsurers in the State of Utah, OR
  have posted security in an amount not less than their outstanding reserves
  pursuant to Utah Code §31A-17-404

□ Carry an A.M. Best financial strength rating of [A- / A / A+ / A++] or
  equivalent from another nationally recognized rating agency

□ Have not been placed under regulatory supervision, receivership, or
  liquidation proceedings in any jurisdiction as of the filing date

Confirmed by: ___________________________  Date: __________
              [Filing Coordinator Name / Title]
```

---

## Generation Logic

1. Read all coverage lines from `data.json`.
2. Separate lines into: reinsured (reinsurance_type ≠ "none") and retained (reinsurance_type = "none").
3. For reinsured lines, group by reinsurer to populate Section 3.
4. Calculate: ceded_premium = gross_premium − net_premium per line.
5. Calculate program totals: total GWP, total ceded, total NWP, overall cession %.
6. Generate the treaty checklist from reinsurer names and treaty reference numbers.
7. Flag any reinsurer missing an A.M. Best rating with `[RATING REQUIRED]`.
8. Flag any reinsured line missing a treaty reference number with `[TREATY REFERENCE REQUIRED]`.

---

## Validation Checks

- Net premium = gross premium − ceded premium for every line (within $1 tolerance)
- Total net premium in Doc 14 matches total net premium in Doc 6
- All reinsured lines have: reinsurer name, structure description, and treaty reference (or flag)
- All reinsurers have an A.M. Best rating listed (or flag)
- Treaty checklist has one entry for every reinsured line
- Retained lines table shows gross premium = net premium (0% cession)
- Total GWP in Section 1 narrative matches Doc 6 total gross premium
- Total NWP in Section 1 narrative matches Doc 6 total net premium
- Section 6 attestation block has a signature line for the filing coordinator
- No reinsurer with ceded premium > 0 is missing from Section 3

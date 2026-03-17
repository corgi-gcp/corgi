---
name: feasibility-study-review
description: "Cross-check a provided feasibility study against the SEIC filing package and produce recommendations where discrepancies exist. Use this skill whenever the user uploads or provides a feasibility study document and wants it validated against the filing. Triggers include: 'check the feasibility study', 'cross-check the actuary report', 'validate the feasibility study', 'compare feasibility study with our docs', 'review the actuarial study', 'feasibility study uploaded', 'does the feasibility study match', or any time a feasibility study file is provided as input."
---

# Feasibility Study Review Agent

This agent accepts a provided feasibility study (uploaded .pdf or .docx) and cross-checks its actuarial assumptions and financial figures against the SEIC filing package. It does not generate a feasibility study — it validates one that has already been prepared by the actuary and flags any inconsistencies with recommendations for resolution.

## How It Works

The feasibility study is treated as the **external authoritative source** for actuarial assumptions. The filing package documents (Doc 6, Doc 8, Doc 4, etc.) are the **internal working documents**. This agent finds every point where the two diverge and tells you what to do about it.

## Input

- **Feasibility study file:** Provided by the user as a .pdf or .docx upload
- **Filing package:** The current state of all 13 documents in `data.json` and the .docx files

## Documents Cross-Referenced

| Filing Document | What Is Compared Against the Feasibility Study |
|---|---|
| **Doc 6 — Lines of Coverage** | Gross premiums, net premiums, limits, deductibles per line |
| **Doc 8 — Business Plan** | Loss ratios, expense ratios, combined ratios, GWP, NWP, surplus projections, member count |
| **Doc 4 — Formation & Capitalization** | Total capitalization vs. actuary's recommended minimum capital |
| **Doc 11 — Investment Policy** | Investment return assumptions if cited in the feasibility study |

---

## Step-by-Step Logic

### 1. Extract the Feasibility Study Data

Use Claude to read the feasibility study and extract the following actuarial data points:

**Premium Adequacy Section:**
- Expected gross written premium per coverage line (Year 1)
- Expected net written premium per coverage line (Year 1)
- Premium rate methodology and assumptions

**Loss Projections:**
- Expected loss ratio per coverage line
- Expected aggregate losses per year (Years 1–5)
- Loss development assumptions
- Tail factor assumptions (if claims-made lines present)

**Expense Assumptions:**
- Expected expense ratio
- Expected operating expenses (Year 1)

**Capitalization:**
- Actuary's recommended minimum capital / surplus
- Risk-based capital analysis results (if included)

**Member Base:**
- Assumed member count (Year 1 and growth projections)
- Exposure base assumptions

**Reinsurance:**
- Reinsurance structures assumed in the study
- Net retention per line as assumed by the actuary

---

### 2. Run Cross-Check Comparisons

For each extracted data point, compare against the corresponding value in the filing package. Assign a status to each comparison:

- **MATCH** — values are consistent within acceptable tolerance
- **DISCREPANCY** — values differ materially (> 5% for monetary values, > 2 percentage points for ratios)
- **MISSING IN FILING** — feasibility study has a value but the filing document does not
- **MISSING IN STUDY** — filing document has a value but the feasibility study does not address it

#### Tolerance Rules

| Data Type | Acceptable Variance | Threshold for DISCREPANCY |
|---|---|---|
| Premium amounts | ± 5% | > 5% difference |
| Loss ratios | ± 2 percentage points | > 2 pp difference |
| Expense ratios | ± 2 percentage points | > 2 pp difference |
| Capitalization | ± $0 (exact match recommended) | Any shortfall vs. actuary minimum |
| Member count | ± 10% | > 10% difference |
| Coverage line names | Exact match | Any line in one but not the other |

---

### 3. Generate Recommendations

For every DISCREPANCY or MISSING item, produce a specific recommendation. Recommendations fall into three categories:

**Category 1 — Update the Filing (filing is wrong, study is right):**
> The actuary's number is the authoritative source. The filing document should be updated to match.
> *Action: Run the appropriate change agent (coverage-line-change, financial-projections-change, etc.)*

**Category 2 — Notify the Actuary (study may be outdated):**
> The filing has been updated since the feasibility study was prepared. The actuary should be informed and may need to revise the study or issue a supplement.
> *Action: Flag for actuary review before submission*

**Category 3 — Investigate (discrepancy source unclear):**
> The difference cannot be attributed to a known update. Manual review by the filing team is required before a determination is made.
> *Action: Flag for legal/compliance review*

---

### 4. Produce the Cross-Check Report

Generate a structured report document: `SEIC — Feasibility Study Cross-Check — [Date].docx`

#### Report Structure

**Cover Page:**
- SEIC letterhead
- Title: "Feasibility Study Cross-Check Report"
- Feasibility study reference: actuary name, study date, version
- Filing package version: date last updated
- Report date

**Section 1 — Executive Summary**
- Total comparisons run: N
- Matches: N
- Discrepancies: N (broken down by severity: material / minor)
- Missing items: N
- Overall status: READY FOR SUBMISSION / REVISIONS REQUIRED / HOLD — ACTUARY REVIEW NEEDED

**Section 2 — Detailed Comparison Table**

| # | Data Point | Filing Value | Study Value | Variance | Status | Recommendation |
|---|---|---|---|---|---|---|
| 1 | CGL Gross Premium (Yr 1) | $450,000 | $425,000 | +5.9% | DISCREPANCY | Update Doc 6 or notify actuary |
| 2 | CGL Loss Ratio | 62.5% | 62.5% | 0% | MATCH | — |
| ... | | | | | | |

**Section 3 — Recommendations by Priority**

**Priority 1 — Must Resolve Before Submission:**
- Any discrepancy where the filing value falls below the actuary's recommended minimum (especially capital adequacy)
- Any coverage line present in one document but absent in the other
- Any loss ratio in the filing that is lower than the actuary's projection (optimistic bias)

**Priority 2 — Should Resolve Before Submission:**
- Premium differences > 5%
- Member count differences > 10%
- Expense ratio differences > 2 pp

**Priority 3 — Review and Document:**
- Minor variances within tolerance
- Items not addressed in the feasibility study

**Section 4 — Action Log**

For each recommendation that requires running a change agent, list the specific agent to run and the instruction:

```
ACTION REQUIRED:
→ Run coverage-line-change: Update CGL gross premium from $450,000 to $425,000
→ Run financial-projections-change: Update Year 1 GWP to $X,XXX,XXX to match study
→ Notify actuary: Member count assumption in study (100) differs from filing (120)
```

**Section 5 — Sign-Off Block**
Signature lines for:
- Filing coordinator (confirms review)
- Legal counsel (confirms no objections to actuary discrepancy resolutions)

---

### 5. Optional: Auto-Apply Recommendations

If the user confirms they want to auto-apply Priority 1 and Priority 2 recommendations:
- Route each action to the appropriate change agent
- Re-run the cross-check after all changes are applied
- Confirm that all previously flagged discrepancies are now resolved
- Update the report with "RESOLVED" status for each addressed item

---

## Validation Checks

- Every data point extracted from the feasibility study has a corresponding comparison in the report
- No discrepancy is silently dropped — all must appear in the report
- Capital adequacy check: filing total capitalization ≥ actuary's recommended minimum (hard block if not)
- All 9 coverage lines in the filing appear in the feasibility study (or are flagged as missing)
- Loss ratios in the filing are not materially lower than the actuary's projections (optimism bias check)
- Report includes actuary name, study date, and version for traceability
- Action log lists a specific agent or manual action for every discrepancy
- Sign-off block is present before the report is considered final

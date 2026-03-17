---
name: regulatory-response
description: "Process a Utah DOI comment letter or regulatory feedback and make the corresponding changes across the SEIC filing package. Use this skill whenever the user provides a comment letter, regulatory objection, deficiency notice, or specific feedback from the Utah Department of Insurance. Triggers include: 'respond to comment letter', 'DOI feedback', 'regulator asked for', 'fix the deficiency', 'address comment', 'DOI wants us to change', 'respond to objection', 'regulatory correction', or when the user pastes or uploads a comment letter or list of regulatory concerns."
---

# Regulatory Response Agent

This skill is the most important agent in the pipeline at submission time. It takes regulatory feedback — a comment letter, deficiency notice, or verbal instruction from the Utah DOI — and translates each comment into specific document edits across the filing package, then produces a formal response log.

## Trigger Intent Examples

- "The DOI sent a comment letter — here it is: [paste text]"
- "The examiner said the biographical affidavits don't cover 10 years for Mike Brown"
- "They want the Articles to explicitly reference 31A-37"
- "The DOI says our investment policy doesn't reference §31A-18-110"
- "Deficiency notice says our capitalization table math is wrong"
- "The regulator wants the CGL retroactive date removed — it should be occurrence-based"

## Input Format

The agent accepts regulatory feedback in any of these forms:
1. **Pasted comment letter text** — full letter from the DOI
2. **Numbered deficiency list** — "1. Doc 4 math error. 2. Missing affidavit."
3. **Single verbal instruction** — "The DOI wants the registered agent address corrected"
4. **Uploaded document** — a scanned or digital comment letter file

## Processing Logic

### 1. Parse the Comments
Extract each individual comment or deficiency from the input. Number them if not already numbered. For each comment, identify:
- **Which document** is cited or implied
- **What specific field, section, or value** is in question
- **What change is required** (explicit or implied)
- **Priority:** Critical (blocks approval) vs. Administrative (minor correction)

### 2. Map Each Comment to an Agent
After parsing, route each comment to the appropriate specialist agent:

| Comment Type | Route to Agent |
|---|---|
| Director/officer change | personnel-change |
| Service provider correction | service-provider-change |
| Coverage line modification | coverage-line-change |
| Capitalization math / structure | capitalization-change |
| Projection financials | financial-projections-change |
| Governance / bylaws / articles | governance-change |
| Legal name / registered agent | entity-ownership-change |
| Reinsurance terms | reinsurance-change |
| Address / contact correction | address-contact-update |
| Formatting issue | document-formatting |
| Multiple documents / cross-cutting | Handle directly (see below) |

### 3. Execute Changes
For each comment, either:
- **Route to specialist agent** with the specific instruction
- **Handle directly** if the change is a simple text correction that doesn't fit a specialist agent (e.g., typo fix, adding a missing statutory citation, inserting a missing paragraph)

For direct handling:
- Open the specific document and section
- Make the targeted edit
- Do not touch any other content in the document

### 4. Build the Response Log
After all changes are made, generate a formal response document that:
- Lists each DOI comment
- States the action taken in response
- Identifies which document was updated and what section was changed
- Notes any comment that was NOT addressed and explains why (e.g., "disagree with comment — legal counsel review recommended")

### Response Log Format (per comment)

```
COMMENT #[N]
DOI Concern: [Exact text or paraphrase of the DOI's comment]
Document(s): [Doc 1 / Doc 4 / etc.]
Action Taken: [Specific description of what was changed]
Section Updated: [e.g., "Doc 12, Article III — Purpose Clause"]
Status: RESOLVED / PENDING / DISPUTED
Notes: [Any additional context or follow-up required]
```

### 5. Final Output

**Edited documents:** All corrected .docx files

**Regulatory Response Log:** A new document titled:
`SEIC — Response to DOI Comment Letter — [Date].docx`

Structure of the response log document:
1. Cover page: SEIC name, filing reference, date of DOI letter, date of response
2. Introduction paragraph: standard regulatory response language
3. Comment-by-comment response table
4. Closing statement: confirmation that all deficiencies have been addressed
5. Signature block: officer authorized to submit the response

### 6. Re-Run Audit
After all changes, automatically re-run the regulatory audit tool (the 36-check suite) to verify:
- All previously failing checks now pass
- No new failures were introduced by the corrections

## Common DOI Comment Types and Responses

| DOI Comment | Typical Response |
|---|---|
| "Articles do not reference captive insurance statute" | Add "pursuant to Utah Code Title 31A, Chapter 37" to purpose clause in Doc 12 |
| "Biographical affidavit does not cover 10 years" | Flag the specific affidavit for re-filing with extended employment history |
| "Capitalization table math error" | Run capitalization-change agent to recalculate and correct |
| "Investment policy does not cite §31A-18-110" | Add statutory citation to Doc 11 compliance section |
| "Missing service provider for [category]" | Run service-provider-change agent to add the missing provider |
| "Coverage line [X] missing retroactive date" | Run coverage-line-change agent to add retroactive date |
| "Ownership percentages do not sum to 100%" | Run entity-ownership-change agent to correct percentages |
| "Registered agent address is a P.O. box" | Run entity-ownership-change agent to correct to a physical address |

## Validation Checks

- Every comment in the input has a corresponding entry in the response log
- No comment is silently ignored — all must be marked RESOLVED, PENDING, or DISPUTED
- Re-run of the 36-check audit shows no new failures after corrections
- Response log document has a complete signature block
- Response log date matches the date corrections were made
- All PENDING items have a clear explanation and expected resolution date

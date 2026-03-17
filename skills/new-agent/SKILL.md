---
name: new-agent
description: "Create a new custom agent for the SEIC filing package. Use this skill whenever the user wants to add a new agent, build a new skill, define a new automated workflow, or extend the filing system with a capability that doesn't exist yet. Triggers include: 'add a new agent', 'create a new skill', 'build an agent for', 'I need an agent that', 'add a workflow for', 'new automation', 'create a skill that', or any description of a repeatable task on the filing package that should be automated."
---

# New Agent Creator

This meta-agent scaffolds new agents for the SEIC filing package. It interviews the user to understand the new agent's purpose, determines which documents it affects, defines its logic, and writes the complete SKILL.md file — following the same conventions as all existing agents.

## Trigger Intent Examples

- "Add a new agent that handles premium audit adjustments"
- "I need an agent that generates the actuarial opinion cover letter"
- "Create a skill for handling member onboarding documents"
- "Build an agent that tracks open items and produces a checklist"
- "Add an agent that generates the state filing transmittal letter"
- "I want an agent that validates the complete package before submission"

---

## Step-by-Step Logic

### 1. Interview the User

Ask the following questions (only those not already answered in the trigger):

1. **What is the agent's purpose?**
   _"In one sentence, what should this agent do?"_

2. **What triggers it?**
   _"What does a user say or do that should activate this agent? Give 3–5 example phrases."_

3. **Which documents does it read?**
   _"Which of the 13 filing documents does it need to look at?"_

4. **Which documents does it write?**
   _"Which documents does it create or modify? Does it produce a new document?"_

5. **What is the core logic?**
   _"Walk me through what the agent should do, step by step."_

6. **What are the validation rules?**
   _"What must be true when the agent finishes? What should it check before saving?"_

7. **What data does it need from data.json?**
   _"Which fields in data.json does it read or write?"_

If the user provides all of this upfront, skip directly to Step 2.

---

### 2. Determine Agent Type

Classify the new agent into one of these categories to apply the right template:

| Type | Description | Examples |
|---|---|---|
| **Change agent** | Edits existing content across multiple documents in response to a stakeholder change | personnel-change, coverage-line-change |
| **Generation agent** | Produces a brand-new document not yet in the package | actuarial opinion, transmittal letter |
| **Validation agent** | Reads documents and checks for issues without writing | pre-submission checklist, consistency check |
| **Compilation agent** | Assembles multiple documents into one output | full package compiler, exhibit bundler |
| **Notification agent** | Monitors the package and alerts when action is needed | missing document tracker, deadline reminder |

---

### 3. Identify the Documents Affected

Map the agent's scope to the known document set:

| ID | Document |
|---|---|
| doc1 | Captive Insurance Company Details |
| doc2 | Directors & Officers |
| doc3 | Service Providers |
| doc4 | Formation & Capitalization |
| doc6 | Lines of Coverage |
| doc7a–d | Biographical Affidavits |
| doc8 | Business Plan |
| doc11 | Investment Policy |
| doc12 | Articles of Incorporation |
| doc13 | Bylaws |
| doc15 | Operating Agreement |
| membership | Membership Agreement |
| new | A new document this agent generates |

---

### 4. Define the data.json Fields

List which fields in `data.json` the new agent reads and/or writes. If new fields are needed that don't exist yet, define them and flag that `data.json` must be updated.

---

### 5. Write the SKILL.md

Generate a complete `SKILL.md` file following this structure:

```markdown
---
name: [agent-name-in-kebab-case]
description: "[One-sentence description for triggering. Include 5–8 exact trigger phrases.]"
---

# [Agent Title]

[One paragraph describing what this agent does and why it exists.]

## Trigger Intent Examples

- "[Example 1]"
- "[Example 2]"
- "[Example 3]"
- "[Example 4]"
- "[Example 5]"

## Documents Affected

| Document | What Changes |
|---|---|
| **[Doc ID] — [Doc Name]** | [What this agent reads or writes in this doc] |

## [Data Fields / Input Requirements]

[Any specific data fields or inputs the agent needs.]

## Step-by-Step Logic

### 1. [First step title]
[Description]

### 2. [Second step title]
[Description]

...

### N. Output Summary
[What the agent outputs at the end — a change summary, a new document, a report, etc.]

## Validation Checks

- [Check 1]
- [Check 2]
- [Check 3]
```

---

### 6. Save the File

Write the new skill to:
```
skills/[agent-name]/SKILL.md
```

Where `[agent-name]` is the kebab-case name chosen in Step 5.

---

### 7. Register the Agent

After saving, update the project's agent registry (if one exists) or produce a summary entry:

```
NEW AGENT REGISTERED
Name: [agent-name]
Type: [Change / Generation / Validation / Compilation / Notification]
Triggers: [3–5 key phrases]
Documents: [List of affected docs]
File: skills/[agent-name]/SKILL.md
```

Confirm to the user that the new agent is ready and explain how to trigger it.

---

## Naming Conventions

| Rule | Example |
|---|---|
| Use kebab-case | `premium-audit-adjustment` |
| Use a verb-noun pattern for change agents | `coverage-line-change`, `personnel-change` |
| Use a noun pattern for generation agents | `transmittal-letter`, `actuarial-cover` |
| Use `validate-` prefix for validation agents | `validate-submission`, `validate-projections` |
| Use `compile-` prefix for compilation agents | `compile-package`, `compile-exhibits` |
| Keep name under 30 characters | — |

---

## Validation Checks

- Agent name is unique — no existing skill has the same name
- SKILL.md includes a valid YAML frontmatter block with `name` and `description`
- Description field contains at least 5 trigger phrases
- At least one document is listed in "Documents Affected"
- Step-by-step logic has at least 3 numbered steps
- Validation Checks section is present with at least 3 checks
- File is saved to the correct path: `skills/[agent-name]/SKILL.md`

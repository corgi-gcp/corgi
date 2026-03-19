# CLAUDE.md — Heber AI Integration Launch Brief

> Hand this file to a new Claude Code session as the single source of truth.
> Goal: merge two projects into one deployable product on Railway.

---

## 1. What Exists Today

### Project A — Heber AI (live on Railway)
**Repo:** `https://github.com/corgi-gcp/Heber_AI` (branch: `staging`)
**Live URL:** `https://heber-ai-frontend-staging.up.railway.app/`
**Local path:** `C:\Users\aleja\Downloads\Heber_AI`

A React + Django platform where captive insurance consultants manage filing projects. A consultant creates a Filing (one per client/state), populates a document structure (StructureTiles), uploads context files, and uses AI agents to draft each document section.

**Railway deployment (already configured):**
- Backend service: Django + gunicorn, starts via `railway.toml`:
  ```
  python manage.py migrate && python manage.py load_skills &&
  python manage.py collectstatic --noinput &&
  gunicorn backend.wsgi --timeout 120 --bind 0.0.0.0:$PORT
  ```
- Frontend service: React/Vite, built via `frontend/railway.toml`
- Health check: `GET /api/system/status/`

**Stack:**
| Layer | Technology |
|---|---|
| Frontend | React 18 + Vite, React Router v6, inline styles |
| Backend | Django 4 + Django REST Framework |
| AI | Anthropic Claude (Python SDK) |
| DB | SQLite locally / PostgreSQL on Railway |
| Storage | Local media + optional Google Drive sync |

**Key backend API endpoints (all under `/api/`):**
```
GET/POST   filings/                             List / create Projects
GET/PUT    filings/<id>/                        Retrieve / update Project
GET/POST   filings/<id>/context/               List / upload context documents
POST       filings/<id>/context/process/       Parse .md files → StructureTiles
GET        filings/<id>/tiles/                 List StructureTiles
PUT        filings/<id>/tiles/<tile_id>/       Update a tile (content, status)
POST       filings/<id>/tiles/<tile_id>/draft/ AI-generate tile draft (SSE stream)
POST       filings/<id>/draft/                 AI-generate full project draft (SSE stream)
GET        skills/                             List all Skills
GET        skills/<id>/                        Skill detail
GET        system/status/                      API key + Drive status
```

**Django data models (current):**
```python
Project          # captive_name, domicile_state, captive_type, status,
                 # lines_of_coverage (JSON), variables (JSON flat {key:value}),
                 # drive_folder_id, updated_at

StructureTile    # project FK, title, context_instructions, draft_content,
                 # skill FK, status, order
                 # MISSING: subsections, filing_doc_number, required_variables

Skill            # slug, name, description, category, content (markdown),
                 # filing_doc_number, version
                 # MISSING: template_structure, required_fields,
                 #          validation_checks, cross_references

ProjectDocument  # project FK, folder_type (context/skills), title,
                 # content (text), mime_type, drive_file_id

Section          # legacy — being replaced by StructureTile
AgentConfig      # agent persona config
TaskLog          # audit log per project
```

**Frontend routes:**
```
/filings          FilingsList — all projects
/filings/:id      Filing detail (tabs: Structure, Context, Settings, Drafting)
/structures       Filing structure templates
/skills           Skills library
/agents           AI agent config
/settings         API key, model, Drive settings
```

---

### Project B — Filing Preparation Tool ("Corgi")
**Repo:** `https://github.com/corgi-gcp/corgi` (branch: `main`)
**Local path:** `C:\Users\aleja\Downloads\Corgi`
**Currently runs at:** `http://localhost:3001/document-requirements-flow.html`

A browser-based 5-step intake pipeline. Takes a consultant from nothing → a full AI-drafted filing package. Currently a standalone prototype. **This becomes the intake flow that feeds into Heber AI.**

**Stack:**
| Layer | Technology |
|---|---|
| Frontend | Single HTML file (embedded CSS + JS, no framework) |
| Backend | Express 5 + TypeScript, Node.js, port 3001 |
| AI | `claude-haiku-4-5` via `@anthropic-ai/sdk` |
| Streaming | Server-Sent Events (SSE) |
| Local persistence | `localStorage` (step state) + IndexedDB (SERFF document library) |

**The 5-step pipeline (state flows via `window._step1` → `window._step5`):**

| Step | Name | Input | Output |
|---|---|---|---|
| 01 | Legislation Research | State, business context, policy types | Statute text, SERFF search terms, DOI links |
| 02 | SERFF Document Library | PDF uploads from SERFF portal | AI-identified reference docs: `{documentType, relevanceScore, coveredRequirements[]}` |
| 03 | Document Checklist | Legislation text | Checklist items (mandatory / conditional / optional), cross-referenced vs. Step 02 library |
| 04 | Requirements Matching | Checklist + SERFF library | Scored match table: which SERFF doc covers which requirement |
| 05 | Document Generation | All prior steps | Drafted documents, SKILL.md files per doc type, `filing-structure.md` manifest |

**Express API endpoints (`audit-tool/src/legislation-server.ts`):**
```
POST /api/legislation-research   SSE — statute research via Claude web_search
POST /api/extract-checklist      JSON — checklist from legislation text
POST /api/match-requirements     JSON — scored checklist x SERFF library match
POST /api/generate-documents     SSE — full document set drafting
POST /api/serff-search-terms     JSON — targeted SERFF search term chips
POST /api/identify-document      JSON — AI reads PDF, returns type + coverage
```

---

## 2. The Integration — What Needs to Be Built

### Concept
Corgi = **preparation phase** → Heber AI = **management + drafting phase**.

At Step 05 completion, Corgi produces a `PreprocessingResult` JSON that directly populates a new Heber AI Project with its structure, variables, skills, and initial draft content. The consultant never leaves the platform.

### The `PreprocessingResult` schema (target handoff format)

```json
{
  "source_filing_id": "UT-2025-042",
  "state": "Utah",
  "captive_type": "Pure Captive",
  "extracted_at": "2026-03-19T12:00:00Z",

  "structure": {
    "sections": [
      {
        "id": "doc-8",
        "title": "Business Plan",
        "description": "Comprehensive overview of the captive's purpose, risk strategy, and operational plan.",
        "order": 4,
        "filing_doc_number": "8",
        "skill_ref": "business-plan",
        "required_variables": ["company_name", "parent_company", "captive_manager", "lines_of_coverage", "capital"],
        "subsections": [
          { "id": "doc-8-1", "title": "Executive Summary", "description": "..." },
          { "id": "doc-8-2", "title": "Company Overview", "description": "..." }
        ]
      }
    ]
  },

  "variables": [
    {
      "key": "company_name",
      "label": "Company Name",
      "type": "text",
      "group": "entity",
      "required": true,
      "used_by": ["doc-1", "doc-8", "doc-12"],
      "extracted_value": "Acme Captive Insurance Co."
    },
    {
      "key": "directors",
      "label": "Directors",
      "type": "person_list",
      "group": "governance",
      "required": true,
      "used_by": ["doc-2", "doc-7", "doc-13"],
      "extracted_value": ["John Smith", "Jane Doe"]
    },
    {
      "key": "capital",
      "label": "Initial Capitalization",
      "type": "currency",
      "group": "financial",
      "required": true,
      "used_by": ["doc-4", "doc-8", "doc-12"],
      "extracted_value": 250000
    }
  ],

  "skills": [
    {
      "slug": "business-plan",
      "name": "Business Plan",
      "filing_doc_number": "8",
      "category": "formation",
      "description": "Generates Document 8 — the comprehensive business plan...",
      "template_structure": [
        "Executive Summary", "Company Overview", "Market Analysis",
        "Lines of Coverage", "Underwriting & Risk Management",
        "Financial Projections", "Capitalization & Funding"
      ],
      "required_fields": ["company_name", "parent_company", "captive_manager", "capital"],
      "validation_checks": [
        "Combined ratio < 100%",
        "Surplus never below state minimum",
        "Coverage lines match doc-6",
        "Capitalization matches doc-4"
      ],
      "cross_references": ["lines-of-coverage", "formation-capitalization", "investment-policy"]
    }
  ]
}
```

**Variable types:** `text | number | currency | date | list | person_list | address`
**Variable groups:** `entity | governance | financial | coverage | service_providers | compliance`

### The relationship graph
```
Structure.sections
  ├── skill_ref ──────────────────→ Skills.slug
  ├── required_variables ─────────→ Variables.key
  └── subsections (nested)

Skills
  ├── required_fields ────────────→ Variables.key
  └── cross_references ───────────→ Skills.slug (self-referential)

Variables
  └── used_by ────────────────────→ Structure.sections[].id
```

---

## 3. Work Plan — Ordered TODOs

### Phase 1 — Extend Django models

**TODO 1 — Extend `StructureTile`** (`filings/models.py`)
```python
subsections = models.JSONField(default=list, blank=True)
# Each item: {"id": str, "title": str, "description": str}
filing_doc_number = models.CharField(max_length=20, blank=True)
required_variables = models.JSONField(default=list, blank=True)
# List of variable key strings
```

**TODO 2 — Extend `Skill` model** (`filings/models.py`)
```python
template_structure = models.JSONField(default=list, blank=True)
# Ordered list of section heading strings
required_fields = models.JSONField(default=list, blank=True)
# List of variable key strings
validation_checks = models.JSONField(default=list, blank=True)
# List of rule strings
cross_references = models.JSONField(default=list, blank=True)
# List of other skill slug strings
```

**TODO 3 — Add `VariableDefinition` model** (`filings/models.py`)
```python
class VariableDefinition(models.Model):
    TYPE_CHOICES = [
        ('text','text'), ('number','number'), ('currency','currency'),
        ('date','date'), ('list','list'), ('person_list','person_list'), ('address','address')
    ]
    GROUP_CHOICES = [
        ('entity','entity'), ('governance','governance'), ('financial','financial'),
        ('coverage','coverage'), ('service_providers','service_providers'), ('compliance','compliance')
    ]
    project = models.ForeignKey(Project, on_delete=models.CASCADE, related_name='variable_definitions')
    key = models.CharField(max_length=100)
    label = models.CharField(max_length=255)
    type = models.CharField(max_length=20, choices=TYPE_CHOICES, default='text')
    group = models.CharField(max_length=30, choices=GROUP_CHOICES, default='entity')
    required = models.BooleanField(default=False)
    used_by = models.JSONField(default=list, blank=True)   # list of section ID strings
    extracted_value = models.JSONField(null=True, blank=True)

    class Meta:
        unique_together = ('project', 'key')
```

After all model changes: `python manage.py makemigrations && python manage.py migrate`

---

### Phase 2 — Build the import endpoint

**TODO 4 — `POST /api/filings/<id>/import-preprocessing/`** (`filings/views.py`)

Accepts a `PreprocessingResult` JSON body and:
1. Creates `StructureTile` rows from `structure.sections`, matching `skill` FK by `skill_ref` slug
2. Creates `VariableDefinition` rows from `variables[]`
3. Updates `Project.variables = {key: extracted_value}` for backward compatibility
4. Upserts `Skill` rows from `skills[]` by slug, populating new JSON fields
5. Returns `{"tiles_created": N, "variables_created": N, "skills_matched": N, "skills_created": N}`

Register in `filings/urls.py`:
```python
path('filings/<str:pk>/import-preprocessing/', ImportPreprocessingView.as_view())
```

---

### Phase 3 — Connect Corgi Step 05 to the import

**TODO 5 — Add "Export to Heber AI" panel in Corgi Step 05**
(`document-requirements-flow.html`, at the bottom of the Step 05 output panel)

```
[ ✓ Send to Heber AI ]
  Project name: ___________
  Heber AI URL: https://heber-ai-backend.up.railway.app   (from settings)
  [ CREATE FILING → ]
```

On click:
1. `POST {heberUrl}/api/filings/` → creates Project, gets back `project_id`
2. `POST {heberUrl}/api/filings/{project_id}/import-preprocessing/` → with full `PreprocessingResult`
3. Show link: `Open in Heber AI → {heberFrontendUrl}/filings/{project_id}`

The `PreprocessingResult` is assembled from: `window._step1` (state/context), `window._step3` (checklist → structure), `window._step5` (generated docs → skills + variables).

---

### Phase 4 — Deploy Corgi as a Railway service

**TODO 6 — Add `railway.toml` to Corgi repo** (`audit-tool/railway.toml`)
```toml
[build]
builder = "NIXPACKS"

[deploy]
startCommand = "npm install && npx ts-node src/legislation-server.ts"
healthcheckPath = "/api/system/status"
restartPolicyType = "ON_FAILURE"
```

Add health endpoint to `legislation-server.ts`:
```typescript
app.get('/api/system/status', (_req, res) => res.json({ status: 'ok', service: 'filing-prep' }));
```

Deploy as `corgi-filing-prep` service on Railway. The HTML file is served as a static file via Express (`express.static`).

---

### Phase 5 — Frontend upgrades in Heber AI

**TODO 7 — Type-aware variable inputs**
In `FilingForm.jsx` or a new `VariablesPanel.jsx`: fetch `VariableDefinition` records for the project, render grouped by `group`, use `type` to pick control: text input, number/currency formatter, date picker, multi-person list.

**TODO 8 — StructureTile subsection display**
In `StructureTab.jsx` / `DraftingWorkspace.jsx`: if a tile has `subsections[]`, render the outline as a collapsible list. Pass subsection titles as additional context to the draft endpoint.

**TODO 9 — Use structured Skill fields in drafting**
In `SectionDraftView` (`filings/views.py`): inject `skill.template_structure` as required sections and `skill.validation_checks` as output constraints into the system prompt.

---

## 4. Target Repo Structure (new merged repo)

```
heber-ai/
├── CLAUDE.md                        ← this file
├── railway.toml                     ← Django backend deploy (existing)
├── Procfile
├── requirements.txt
├── manage.py
│
├── backend/                         ← Django settings (existing)
├── filings/                         ← Django app (existing + extended)
│   ├── models.py                    ← + VariableDefinition, extended Skill + StructureTile
│   ├── views.py                     ← + ImportPreprocessingView
│   └── urls.py                      ← + import-preprocessing/ route
│
├── frontend/                        ← React/Vite (existing)
│   └── src/
│       ├── App.jsx
│       ├── features/
│       │   └── ... (existing)
│       └── services/
│           ├── api.js               ← existing Django API calls
│           └── filingPrepApi.js     ← NEW: calls to Corgi/Express endpoints
│
├── filing-prep/                     ← Corgi Express server (from Corgi repo)
│   ├── src/legislation-server.ts
│   ├── package.json
│   ├── tsconfig.json
│   ├── .env.example
│   └── railway.toml                 ← NEW: separate Railway service
│
└── skills/                          ← SKILL.md templates (loaded by load_skills)
```

---

## 5. Running Locally

```bash
# Django backend
pip install -r requirements.txt
cp .env.example .env        # set ANTHROPIC_API_KEY
python manage.py migrate
python manage.py load_skills
python manage.py runserver  # → http://localhost:8000

# React frontend
cd frontend && npm install
npm run dev                 # → http://localhost:5173

# Express / filing prep
cd filing-prep && npm install
npx ts-node src/legislation-server.ts  # → http://localhost:3001
# Open: http://localhost:3001/document-requirements-flow.html
```

---

## 6. Environment Variables

### Django backend (`.env`)
```
ANTHROPIC_API_KEY=sk-ant-...
USE_MOCK_LLM=false
SECRET_KEY=django-secret-key
DEBUG=false
ALLOWED_HOSTS=*.railway.app,localhost
DATABASE_URL=                        # set automatically by Railway
GOOGLE_DRIVE_FOLDER_ID=              # optional
GOOGLE_SERVICE_ACCOUNT_JSON=         # optional
```

### Express server (`filing-prep/.env`)
```
ANTHROPIC_API_KEY=sk-ant-...
PORT=3001
HEBER_AI_BACKEND_URL=https://heber-ai-backend.up.railway.app
HEBER_AI_FRONTEND_URL=https://heber-ai-frontend-staging.up.railway.app
```

---

## 7. Current Gaps — Quick Reference

| Gap | File | Fix |
|---|---|---|
| `StructureTile` missing `subsections`, `filing_doc_number`, `required_variables` | `filings/models.py` | Add JSONFields + migration |
| `Skill` missing `template_structure`, `required_fields`, `validation_checks`, `cross_references` | `filings/models.py` | Add JSONFields + migration |
| No `VariableDefinition` model | `filings/models.py` | New model + migration |
| No `PreprocessingResult` import endpoint | `filings/views.py` | New `ImportPreprocessingView` |
| Corgi has no "Send to Heber AI" export button | `document-requirements-flow.html` | Step 05 export panel |
| Corgi not on Railway | `filing-prep/railway.toml` | Add config + deploy |
| Variable inputs are generic text fields | `FilingForm.jsx` | Type-aware input controls per `VariableDefinition.type` |
| Draft endpoint ignores `template_structure` and `validation_checks` | `filings/views.py` `SectionDraftView` | Inject structured skill fields into system prompt |

---

## 8. Design System (shared)

```
Font:       DM Sans (Google Fonts)
Navy:       #1E3A5F   primary, step numbers, buttons
Background: #E8ECF2   page bg
Card:       #FFFFFF   border: 1px solid #D1D9E6   box-shadow: 0 2px 8px rgba(0,0,0,.08)
Radius:     12px (cards)   8px (inputs/buttons)
Text:       #1A1D23 (primary)   #4A5568 (secondary)   #64748B (muted)
Success:    #065F46 on #ECFDF5
Warning:    #92400E on #FFFBEB
Error:      #991B1B on #FEF2F2
Accent:     #3B82F6 (links, progress bars)
Mono:       JetBrains Mono (code, IDs, tags)
```

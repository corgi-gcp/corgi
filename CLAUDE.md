# PROJECT CONTEXT — Heber AI + Filing Preparation Tool

## What We're Building

Two separate projects that need to be integrated into a single platform for captive insurance consultants. The goal is to embed the **Filing Preparation Tool** (currently a standalone prototype) as a full module inside **Heber AI** (the main product).

---

## Project 1 — Heber AI (the platform)

**Location:** `C:\Users\aleja\Downloads\Heber_AI`
**Repo:** `https://github.com/corgi-gcp/Heber_AI` (branch: `staging`)

### What it is
A React + Django web application that manages captive insurance filing projects. Consultants create a "filing" (one per client/state), work through the document structure, and use AI agents to draft individual sections.

### Tech stack
| Layer | Technology |
|---|---|
| Frontend | React 18 + Vite, React Router v6, no CSS framework (inline styles) |
| Backend | Django 4 + Django REST Framework (Python) |
| AI | Anthropic Claude via Python SDK |
| Storage | SQLite (local) / PostgreSQL (production), Google Drive integration |
| Deploy | Railway (frontend + backend as separate services) |
| Design | DM Sans font, `#1E3A5F` navy primary, `#E8ECF2` background, white cards |

### Key files
```
Heber_AI/
├── frontend/src/
│   ├── App.jsx                      # All routes + inline page components
│   ├── constants.jsx                # Icons (I.*), agentRegistry, mock data, API_BASE
│   ├── context/ProjectProvider.jsx  # Global state: currentProject, activeAgent, systemStatus, driveStatus
│   ├── layouts/MainLayout.jsx       # Sidebar + top header shell
│   ├── features/
│   │   ├── Sidebar.jsx              # Nav links + SidebarAgentStatus
│   │   ├── DraftingWorkspace.jsx    # Per-section AI drafting UI
│   │   ├── SkillsLibrary.jsx        # Skill browser/editor
│   │   ├── FilingForm.jsx           # New filing modal + variable inputs
│   │   ├── ContextTab.jsx           # Uploaded context documents per filing
│   │   ├── StructureTab.jsx         # Filing structure tile editor
│   │   └── AgentConfigPanel.jsx     # Agent config & run history
│   └── services/api.js              # All fetch() calls to Django backend
├── filings/                         # Django app
│   ├── models.py                    # Project, Section, StructureTile, Skill, AgentConfig, TaskLog
│   ├── views.py                     # REST viewsets + streaming AI endpoints
│   ├── services/claude_service.py   # Anthropic calls
│   └── drive_service.py             # Google Drive folder init & file sync
└── backend/settings.py              # Django config, env vars
```

### Current routes (React Router)
- `/filings` — list of all filing projects
- `/filings/:id` — filing detail (tabs: Structure, Context, Settings, Drafting)
- `/structures` — filing structure templates
- `/skills` — skills library (reusable document templates per document type)
- `/agents` — AI agent config panel
- `/settings` — API key, model, Drive settings

### Data model (key models)
- **Project** — one captive insurance filing (`captive_name`, `domicile_state`, `captive_type`, `status`, `drive_folder_id`)
- **StructureTile** — one document within a filing (`title`, `section`, `order`, `draft_content`, `skill`)
- **Skill** — reusable document template (`slug`, `title`, `description`, `system_prompt`, `variables`)
- **AgentConfig** — saved agent persona + system prompt

---

## Project 2 — Filing Preparation Tool ("Corgi")

**Location:** `C:\Users\aleja\Downloads\Corgi`
**Repo:** `https://github.com/corgi-gcp/corgi` (branch: `main`)

### What it is
A browser-based 5-step pipeline that takes a consultant from zero to a complete, AI-drafted filing package. Currently a standalone prototype (single HTML file + Node.js backend). This is the **intake and research phase** that should feed into Heber AI.

### Tech stack
| Layer | Technology |
|---|---|
| Frontend | Single HTML file with embedded CSS/JS (no framework) |
| Backend | Express 5 + TypeScript, Node.js, port 3001 |
| AI | Anthropic Claude (`claude-haiku-4-5`) via `@anthropic-ai/sdk` |
| Streaming | Server-Sent Events (SSE) for real-time output |
| Local state | `localStorage` (step saves), IndexedDB (SERFF document library) |

### Key files
```
Corgi/
├── document-requirements-flow.html  # Entire frontend — HTML + CSS + JS in one file
└── audit-tool/
    ├── src/legislation-server.ts    # Express server — 5 API endpoints + SSE streaming
    ├── package.json
    └── .env.example
```

### The 5-step pipeline
Each step feeds the next via `window._step1` through `window._step5` shared state + `localStorage` saves.

| Step | Name | Input | Output |
|---|---|---|---|
| 01 | Legislation Research | State selector, business context, optional policy types | Statute text, SERFF search terms, state DOI links |
| 02 | SERFF Document Library | PDF uploads from SERFF portal | AI-identified reference docs (type, relevance score, requirements covered) |
| 03 | Document Checklist | Legislation text from Step 01 | Structured checklist (mandatory/conditional/optional), cross-referenced against Step 02 docs |
| 04 | Requirements Matching | Checklist + SERFF library | Scored match table — which SERFF doc satisfies which requirement, what's missing |
| 05 | Document Generation | All prior steps | Full drafted document set, downloadable SKILL.md per doc type, filing-structure.md manifest |

### Server endpoints (`legislation-server.ts`)
| Endpoint | Purpose |
|---|---|
| `POST /api/legislation-research` | SSE stream — Claude with web_search tool, returns statute text |
| `POST /api/extract-checklist` | Returns JSON checklist from legislation text |
| `POST /api/match-requirements` | Returns scored match table (checklist × SERFF library) |
| `POST /api/generate-documents` | SSE stream — drafts all documents with SERFF context |
| `POST /api/serff-search-terms` | Returns JSON array of targeted SERFF search terms |
| `POST /api/identify-document` | Reads uploaded PDF, returns `{documentType, relevanceScore, coveredRequirements[]}` |

---

## Integration Goal

The two projects are **sequential**: Corgi prepares the filing → Heber AI manages and drafts it.

### Natural seam points

1. **Step 03 checklist → Heber AI StructureTiles**
   The document checklist produced in Step 03 maps directly to `StructureTile` records in Heber AI. Each checklist item becomes a tile in the filing's structure.

2. **Step 02 SERFF library → Heber AI ContextTab**
   The AI-identified SERFF reference documents (with summaries) should become uploaded context documents attached to the Project.

3. **Step 05 generated documents → DraftingWorkspace**
   The drafted content for each document flows into `StructureTile.draft_content`, immediately available for review/editing in the Drafting Workspace.

4. **Step 05 SKILL.md files → Skills Library**
   Each document type generates a reusable skill entry — these feed directly into Heber AI's `Skill` model and `SkillsLibrary` UI.

5. **Step 01 legislation output → Project context**
   The state legislation text and research results become context documents for the Project, informing AI drafting throughout.

### Proposed integration approach

**Option A — Embed as a route in Heber AI frontend (recommended)**
Add a `/filings/new/prepare` route in Heber AI that renders the 5-step pipeline as a React component. On Step 05 completion, auto-create a `Project` + all `StructureTile` records via the Django API. The Express server (`legislation-server.ts`) merges into the Django backend as new endpoints, or runs as a sidecar.

**Option B — API bridge**
Keep Corgi running independently on port 3001. Add a "Send to Heber AI" button on Step 05 that POSTs the pipeline output to the Django backend, creating the Project and tiles. Simpler, less integrated UX.

**Recommended: Option A** — the pipeline becomes `/filings/new` in Heber AI, replacing the current simple `NewFilingModal`. The 5-step flow is the proper onboarding into a filing project.

---

## Design System (shared by both projects)

- **Font:** DM Sans (Google Fonts)
- **Primary navy:** `#1E3A5F`
- **Background:** `#E8ECF2`
- **Card surface:** `#FFFFFF`, `border: 1px solid #D1D9E6`, `box-shadow: 0 2px 8px rgba(0,0,0,.08)`
- **Border radius:** `12px` (cards), `8px` (inputs/buttons)
- **Secondary text:** `#4A5568`
- **Muted text:** `#64748B`
- **Success:** `#065F46` on `#ECFDF5`
- **Warning:** `#92400E` on `#FFFBEB`
- **Error:** `#991B1B` on `#FEF2F2`

---

## Running Locally

### Heber AI
```bash
# Backend (Django)
cd Heber_AI
pip install -r requirements.txt
cp .env.example .env   # add ANTHROPIC_API_KEY
python manage.py migrate
python manage.py runserver   # → http://localhost:8000

# Frontend (React/Vite)
cd frontend
npm install
npm run dev   # → http://localhost:5173
```

### Corgi (Filing Prep Tool)
```bash
cd Corgi/audit-tool
npm install
cp .env.example .env   # add ANTHROPIC_API_KEY
npx ts-node src/legislation-server.ts   # → http://localhost:3001
# Open: http://localhost:3001/document-requirements-flow.html
```

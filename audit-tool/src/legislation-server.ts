import express from 'express';
import Anthropic from '@anthropic-ai/sdk';
import * as path from 'path';
import * as dotenv from 'dotenv';

dotenv.config({ path: path.join(__dirname, '../../.env') });
dotenv.config({ path: path.join(__dirname, '../.env') });
dotenv.config(); // fallback: look in cwd

const envApiKey = process.env.ANTHROPIC_API_KEY;
console.log('[boot] ANTHROPIC_API_KEY:', envApiKey ? `set (${envApiKey.slice(0,12)}...)` : 'MISSING');

const app = express();
app.use(express.json());
app.use((_req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  next();
});

// Serve the dashboard
app.use(express.static(path.join(__dirname, '../../')));

// Helper: create Anthropic client using request body apiKey or fall back to env
function _getClient(bodyApiKey?: string): Anthropic {
  const key = bodyApiKey || envApiKey;
  if (key) return new Anthropic({ apiKey: key });
  return new Anthropic();
}

function _getModel(bodyModel?: string): string {
  return bodyModel || 'claude-haiku-4-5';
}

const US_STATES = [
  'Alabama','Alaska','Arizona','Arkansas','California','Colorado','Connecticut',
  'Delaware','Florida','Georgia','Hawaii','Idaho','Illinois','Indiana','Iowa',
  'Kansas','Kentucky','Louisiana','Maine','Maryland','Massachusetts','Michigan',
  'Minnesota','Mississippi','Missouri','Montana','Nebraska','Nevada','New Hampshire',
  'New Jersey','New Mexico','New York','North Carolina','North Dakota','Ohio',
  'Oklahoma','Oregon','Pennsylvania','Rhode Island','South Carolina','South Dakota',
  'Tennessee','Texas','Utah','Vermont','Virginia','Washington','West Virginia',
  'Wisconsin','Wyoming','District of Columbia'
];

app.get('/api/states', (_req, res) => {
  res.json(US_STATES);
});

app.post('/api/legislation-research', async (req, res) => {
  const { state, caseType, apiKey: bodyApiKey, model: bodyModel } = req.body as { state: string; caseType: string; apiKey?: string; model?: string };

  if (!state || !caseType) {
    return res.status(400).json({ error: 'state and caseType are required' });
  }

  // Set up SSE for streaming
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();

  const send = (data: object) => res.write(`data: ${JSON.stringify(data)}\n\n`);

  try {
    send({ type: 'status', message: `Searching ${state} DOI and NAIC for "${caseType}" statutes...` });

    const messages: Anthropic.MessageParam[] = [
      {
        role: 'user',
        content: `You are a regulatory research assistant. Research captive insurance legislation for the following:

State: ${state}
Case Type / Business Context: ${caseType}

Please search for and return:
1. Current captive insurance statutes from the ${state} Department of Insurance (DOI)
2. Relevant NAIC model laws or guidelines that apply
3. Key filing requirements and document checklist for this case type
4. Any recent amendments or regulatory changes

Format your response as structured sections with clear headings. Be specific about statute numbers, rule citations, and document requirements.`
      }
    ];

    const reqClient = _getClient(bodyApiKey);
    const reqModel = _getModel(bodyModel);

    // Use web_search tool if available, otherwise do direct response
    let response: Anthropic.Message;
    try {
      response = await (reqClient.messages.create as Function)({
        model: reqModel,
        max_tokens: 4096,
        tools: [{ type: 'web_search_20250305', name: 'web_search' }],
        messages,
      });
    } catch {
      // Fallback without web search tool
      response = await reqClient.messages.create({
        model: reqModel,
        max_tokens: 4096,
        messages,
      });
    }

    // Handle tool use loop if needed
    let currentMessages = messages;
    let currentResponse = response;

    while (currentResponse.stop_reason === 'tool_use') {
      const toolUses = currentResponse.content.filter(b => b.type === 'tool_use') as Anthropic.ToolUseBlock[];

      for (const tu of toolUses) {
        send({ type: 'status', message: `Searching: ${(tu.input as { query?: string }).query ?? '...'}` });
      }

      const assistantMsg: Anthropic.MessageParam = { role: 'assistant', content: currentResponse.content };
      const toolResults: Anthropic.ToolResultBlockParam[] = toolUses.map(tu => ({
        type: 'tool_result' as const,
        tool_use_id: tu.id,
        content: JSON.stringify((tu as unknown as { result?: unknown }).result ?? ''),
      }));

      currentMessages = [
        ...currentMessages,
        assistantMsg,
        { role: 'user', content: toolResults },
      ];

      currentResponse = await (reqClient.messages.create as Function)({
        model: reqModel,
        max_tokens: 4096,
        tools: [{ type: 'web_search_20250305', name: 'web_search' }],
        messages: currentMessages,
      });
    }

    // Extract text from final response
    const textBlocks = currentResponse.content.filter(b => b.type === 'text') as Anthropic.TextBlock[];
    const fullText = textBlocks.map(b => b.text).join('\n');

    send({ type: 'result', text: fullText });
    send({ type: 'done' });
    res.end();

  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    send({ type: 'error', message });
    res.end();
  }
});

app.post('/api/document-checklist', async (req, res) => {
  const { state, caseType, legislationText, apiKey: bodyApiKey, model: bodyModel } = req.body as {
    state: string;
    caseType: string;
    legislationText: string;
    apiKey?: string;
    model?: string;
  };

  if (!legislationText) {
    return res.status(400).json({ error: 'legislationText is required' });
  }

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();

  const send = (data: object) => res.write(`data: ${JSON.stringify(data)}\n\n`);

  try {
    send({ type: 'status', message: 'Parsing statutes and extracting filing requirements...' });

    const prompt = `You are a regulatory document analyst specializing in captive insurance filings.

Given the following legislation research for ${state} captive insurance (context: ${caseType}), extract ALL required filing documents into a structured checklist.

LEGISLATION RESEARCH:
${legislationText}

Return a JSON object with this exact structure (no markdown, no explanation — raw JSON only):
{
  "state": "${state}",
  "caseType": "${caseType}",
  "summary": "1-2 sentence overview of the regulatory framework",
  "items": [
    {
      "id": 1,
      "name": "Document name",
      "description": "What this document contains and why it is required",
      "status": "mandatory" | "conditional" | "optional",
      "conditionNote": "Only populated if status is conditional — describe the condition",
      "category": "Formation" | "Governance" | "Financial" | "Personnel" | "Coverage" | "Compliance" | "Other",
      "citation": "Specific statute or rule citation if known, otherwise empty string"
    }
  ]
}

Be exhaustive — include every document mentioned. Use status "mandatory" for always-required, "conditional" for situation-dependent, "optional" for recommended-only.`;

    const response = await _getClient(bodyApiKey).messages.create({
      model: _getModel(bodyModel),
      max_tokens: 4096,
      messages: [{ role: 'user', content: prompt }],
    });

    const raw = (response.content[0] as Anthropic.TextBlock).text.trim();

    // Strip markdown code fences if present
    const jsonStr = raw.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '').trim();

    let parsed: unknown;
    try {
      parsed = JSON.parse(jsonStr);
    } catch {
      send({ type: 'error', message: 'Failed to parse checklist JSON. Raw: ' + raw.slice(0, 200) });
      res.end();
      return;
    }

    send({ type: 'result', checklist: parsed });
    send({ type: 'done' });
    res.end();

  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    send({ type: 'error', message });
    res.end();
  }
});

app.post('/api/serff-quality-score', async (req, res) => {
  const { content, source, apiKey: bodyApiKey, model: bodyModel } = req.body as { content: string; source: string; apiKey?: string; model?: string };

  if (!content) return res.status(400).json({ error: 'content is required' });

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();

  const send = (data: object) => res.write(`data: ${JSON.stringify(data)}\n\n`);

  try {
    send({ type: 'status', message: 'Evaluating document quality...' });

    const prompt = `You are a SERFF filing quality analyst evaluating a captive insurance document for use as a reference model in an automated filing system.

SOURCE TYPE: ${source}
DOCUMENT CONTENT:
${content.slice(0, 6000)}

Evaluate this document on 4 dimensions and check 3 hard gates. Return raw JSON only (no markdown):

{
  "gates": {
    "parseable": { "pass": true, "value": "XML" },
    "approved": { "pass": true, "value": "Not withdrawn" },
    "currency": { "pass": true, "value": "Post-amendment 2024" }
  },
  "scores": {
    "completeness": { "weight": 30, "score": 70 },
    "generalizability": { "weight": 25, "score": 60 },
    "clarity": { "weight": 25, "score": 75 },
    "precedent": { "weight": 20, "score": 50 }
  },
  "composite": 65,
  "tier": "B",
  "tierLabel": "Reference Model",
  "tierNote": "1-2 sentence assessment of the document's quality and what the agent will need to do in Step 5."
}

Tiers: A = 85+, B = 65-84, C = 45-64, D = <45.
gate.value = brief description of what you found (e.g. "XML", "PDF text-extractable", "Withdrawn 2022").
Score 0-100 for each dimension. Compute composite as weighted sum.`;

    const response = await _getClient(bodyApiKey).messages.create({
      model: _getModel(bodyModel),
      max_tokens: 1024,
      messages: [{ role: 'user', content: prompt }],
    });

    const raw = (response.content[0] as Anthropic.TextBlock).text.trim();
    const jsonStr = raw.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '').trim();

    let parsed: unknown;
    try { parsed = JSON.parse(jsonStr); }
    catch { send({ type: 'error', message: 'Parse error: ' + raw.slice(0, 100) }); res.end(); return; }

    send({ type: 'result', score: parsed });
    send({ type: 'done' });
    res.end();
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    send({ type: 'error', message });
    res.end();
  }
});

app.post('/api/match-requirements', async (req, res) => {
  const { requirements, document: docText, state, apiKey: bodyApiKey, model: bodyModel } = req.body as {
    requirements: Array<{ id: number; name: string; description: string; category: string }>;
    document: string;
    state: string;
    apiKey?: string;
    model?: string;
  };

  if (!requirements?.length) return res.status(400).json({ error: 'requirements array is required' });

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();

  const send = (data: object) => res.write(`data: ${JSON.stringify(data)}\n\n`);

  try {
    send({ type: 'status', message: `Matching ${requirements.length} requirements against document...` });

    const prompt = `You are a regulatory document matching analyst for ${state} captive insurance filings.

REQUIREMENTS CHECKLIST (${requirements.length} items):
${requirements.map(r => `${r.id}. ${r.name} — ${r.description}`).join('\n')}

REFERENCE DOCUMENT:
${(docText || '').slice(0, 8000)}

For each requirement, compute a cosine similarity score (0-100) between the requirement and any matching document section, then classify:
- "covered": score ≥ 75
- "partial": score 40-74
- "gap": score < 40

Return raw JSON only (no markdown):
{
  "items": [
    {
      "name": "requirement name",
      "similarity": 72,
      "status": "partial",
      "section": "Brief description of matched document section, or 'Not found' if gap"
    }
  ]
}`;

    const response = await _getClient(bodyApiKey).messages.create({
      model: _getModel(bodyModel),
      max_tokens: 4096,
      messages: [{ role: 'user', content: prompt }],
    });

    const raw = (response.content[0] as Anthropic.TextBlock).text.trim();
    const jsonStr = raw.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '').trim();

    let parsed: unknown;
    try { parsed = JSON.parse(jsonStr); }
    catch { send({ type: 'error', message: 'Parse error: ' + raw.slice(0, 200) }); res.end(); return; }

    send({ type: 'result', matches: parsed });
    send({ type: 'done' });
    res.end();
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    send({ type: 'error', message });
    res.end();
  }
});

app.post('/api/generate-documents', async (req, res) => {
  const { requirements, matches, legislation, state, apiKey: bodyApiKey, model: bodyModel } = req.body as {
    requirements: Array<{ id: number; name: string; description: string }>;
    matches: Array<{ name: string; status: string; section: string }>;
    legislation: string;
    state: string;
    apiKey?: string;
    model?: string;
  };

  if (!requirements?.length) return res.status(400).json({ error: 'requirements array is required' });

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();

  const send = (data: object) => res.write(`data: ${JSON.stringify(data)}\n\n`);

  try {
    send({ type: 'status', message: `Agent analyzing ${requirements.length} requirements...` });

    const prompt = `You are a filing document agent for ${state} captive insurance.

REQUIREMENTS (${requirements.length}):
${requirements.map(r => `${r.id}. ${r.name} — ${r.description}`).join('\n')}

MATCH RESULTS:
${(matches || []).map(m => `${m.name}: ${m.status} — ${m.section}`).join('\n')}

LEGISLATION EXCERPT:
${(legislation || '').slice(0, 4000)}

For each requirement, decide:
- "adopted": reference section covers it fully, use as-is
- "adapted": reference exists but needs state-specific changes
- "generated": no reference, generate from legislation
- "skipped": requirement is N/A for this entity structure

Return raw JSON only (no markdown):
{
  "items": [
    {
      "name": "requirement name",
      "action": "adopted|adapted|generated|skipped",
      "note": "1-sentence description of what the agent did",
      "output": "SEIC_DocumentName.docx or — if skipped"
    }
  ]
}`;

    send({ type: 'status', message: 'Running agent decisions...' });

    const response = await _getClient(bodyApiKey).messages.create({
      model: _getModel(bodyModel),
      max_tokens: 4096,
      messages: [{ role: 'user', content: prompt }],
    });

    const raw = (response.content[0] as Anthropic.TextBlock).text.trim();
    const jsonStr = raw.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '').trim();

    let parsed: unknown;
    try { parsed = JSON.parse(jsonStr); }
    catch { send({ type: 'error', message: 'Parse error: ' + raw.slice(0, 200) }); res.end(); return; }

    send({ type: 'result', docs: parsed });
    send({ type: 'done' });
    res.end();
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    send({ type: 'error', message });
    res.end();
  }
});

// ── SERFF search terms ────────────────────────────────────────────────────────
app.post('/api/serff-search-terms', async (req, res) => {
  const { text, state, caseType, apiKey: bodyApiKey, model: bodyModel } = req.body as { text: string; state: string; caseType: string; apiKey?: string; model?: string };
  try {
    const prompt = `Based on this captive insurance legislation research for ${state} (${caseType}), generate 8-12 precise SERFF search terms that a filer would use to find relevant reference documents in the SERFF database.

SERFF searches across filing names, company names, and descriptions. Make terms specific and actionable.

Research text:
${text.slice(0, 3000)}

Include terms covering:
- Entity type (captive, association captive, group captive, etc.)
- State-specific regulatory keywords
- Document type keywords (feasibility study, application, bylaws, etc.)
- Business context keywords from the case type

Return raw JSON only — no markdown, no explanation:
{"terms": ["term 1", "term 2", "term 3", ...]}`;

    const response = await _getClient(bodyApiKey).messages.create({
      model: _getModel(bodyModel),
      max_tokens: 512,
      messages: [{ role: 'user', content: prompt }],
    });

    const raw = (response.content[0] as Anthropic.TextBlock).text.trim();
    const jsonStr = raw.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '').trim();
    const parsed = JSON.parse(jsonStr) as { terms: string[] };
    res.json(parsed);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    res.status(500).json({ error: message });
  }
});

// ── Generate individual document content ──────────────────────────────────────
app.post('/api/generate-document-content', async (req, res) => {
  const { name, action, note, state, caseType, legislation, apiKey: bodyApiKey, model: bodyModel } = req.body as {
    name: string; action: string; note: string;
    state: string; caseType: string; legislation: string;
    apiKey?: string; model?: string;
  };

  try {
    const prompt = `You are a captive insurance filing specialist. Generate the complete content for this regulatory document:

Document: ${name}
State: ${state}
Case Type: ${caseType}
Agent Decision: ${action} — ${note}

${legislation ? `Relevant legislation excerpt:\n${legislation.slice(0, 3000)}\n` : ''}

Generate a complete, professional document with:
- Header section: document title, state, date ([DATE]), company name ([COMPANY NAME]), captive name ([CAPTIVE NAME])
- All required sections with proper headings
- Variable fields in [BRACKETS] for data to be filled in
- Accurate regulatory language for ${state} captive insurance
- Any required certifications, signatures, or attestations at the end

Format as clean Markdown. Be thorough and realistic — this is a real filing document template.`;

    const response = await _getClient(bodyApiKey).messages.create({
      model: _getModel(bodyModel),
      max_tokens: 2048,
      messages: [{ role: 'user', content: prompt }],
    });

    const content = (response.content[0] as Anthropic.TextBlock).text;
    const filename = name.replace(/[^a-zA-Z0-9_\-]/g, '_').replace(/_+/g, '_') + '.md';
    res.json({ content, filename });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    res.status(500).json({ error: message });
  }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Legislation server running at http://localhost:${PORT}`);
  console.log(`Dashboard: http://localhost:${PORT}/document-requirements-flow.html`);
});

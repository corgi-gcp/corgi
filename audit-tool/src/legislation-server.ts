import express from 'express';
import Anthropic from '@anthropic-ai/sdk';
import * as path from 'path';
import * as dotenv from 'dotenv';

dotenv.config({ path: path.join(__dirname, '../../.env') });
dotenv.config({ path: path.join(__dirname, '../.env') });
dotenv.config(); // fallback: look in cwd

// ── Robust JSON extractor ────────────────────────────────────────────────────
// Handles: ```json ... ```, ``` ... ```, plain JSON, text before/after fences,
// truncated responses missing the closing fence, and arrays as top-level.
function extractJson(raw: string): string {
  // 1. Try to find a fenced block (```json ... ``` or ``` ... ```)
  const fenceMatch = raw.match(/```(?:json)?\s*([\s\S]*?)(?:```|$)/i);
  if (fenceMatch) {
    const inner = fenceMatch[1].trim();
    if (inner.startsWith('{') || inner.startsWith('[')) return inner;
  }

  // 2. Find the outermost { } or [ ] block in the raw text
  const firstBrace   = raw.indexOf('{');
  const firstBracket = raw.indexOf('[');
  let start = -1;
  let openChar: string, closeChar: string;

  if (firstBrace === -1 && firstBracket === -1) return raw;
  if (firstBrace === -1)  { start = firstBracket; openChar = '['; closeChar = ']'; }
  else if (firstBracket === -1) { start = firstBrace; openChar = '{'; closeChar = '}'; }
  else if (firstBrace < firstBracket) { start = firstBrace; openChar = '{'; closeChar = '}'; }
  else { start = firstBracket; openChar = '['; closeChar = ']'; }

  // Walk forward counting brackets to find the matching close
  let depth = 0;
  for (let i = start; i < raw.length; i++) {
    if (raw[i] === openChar) depth++;
    else if (raw[i] === closeChar) {
      depth--;
      if (depth === 0) return raw.slice(start, i + 1);
    }
  }

  // 3. No balanced close found — take everything from start (truncated response)
  return raw.slice(start);
}

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

// Health check for Railway
app.get('/api/system/status', (_req, res) => res.json({ status: 'ok', service: 'filing-prep' }));

// Serve the dashboard
app.use(express.static(path.join(__dirname, '../')));

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
  const { state, caseType, policyTypes, apiKey: bodyApiKey, model: bodyModel } = req.body as { state: string; caseType: string; policyTypes?: string; apiKey?: string; model?: string };

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
    const policyTypesLine = policyTypes ? `\nSpecific Policy Types: ${policyTypes}` : '';
    send({ type: 'status', message: `Searching ${state} DOI and NAIC for "${caseType}" statutes...` });

    const messages: Anthropic.MessageParam[] = [
      {
        role: 'user',
        content: `You are a regulatory research assistant. Research captive insurance legislation for the following:

State: ${state}
Case Type / Business Context: ${caseType}${policyTypesLine}

Please search for and return:
1. Current captive insurance statutes from the ${state} Department of Insurance (DOI)
2. Relevant NAIC model laws or guidelines that apply
3. Key filing requirements and document checklist for this case type${policyTypes ? `\n4. Specific requirements for each policy type: ${policyTypes}` : ''}
${policyTypes ? '5' : '4'}. Any recent amendments or regulatory changes

${policyTypes ? `Pay particular attention to how each policy type (${policyTypes}) is treated under ${state} captive statutes — note any distinct capital requirements, form filing rules, or actuarial standards that differ by line of business.\n\n` : ''}Format your response as structured sections with clear headings. Be specific about statute numbers, rule citations, and document requirements.`
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

// ── Combined research + checklist (saves one Claude call) ─────────────────────
app.post('/api/research-and-checklist', async (req, res) => {
  const { state, caseType, policyTypes, apiKey: bodyApiKey, model: bodyModel } = req.body as {
    state: string; caseType: string; policyTypes?: string; apiKey?: string; model?: string;
  };

  if (!state || !caseType) return res.status(400).json({ error: 'state and caseType are required' });

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();

  const send = (data: object) => res.write(`data: ${JSON.stringify(data)}\n\n`);

  try {
    const policyTypesLine = policyTypes ? `\nSpecific Policy Types: ${policyTypes}` : '';
    send({ type: 'status', message: `Searching ${state} DOI and NAIC for "${caseType}" statutes...` });

    const researchMessages: Anthropic.MessageParam[] = [{
      role: 'user',
      content: `You are a regulatory research assistant. Research captive insurance legislation for the following:

State: ${state}
Case Type / Business Context: ${caseType}${policyTypesLine}

Please search for and return:
1. Current captive insurance statutes from the ${state} Department of Insurance (DOI)
2. Relevant NAIC model laws or guidelines that apply
3. Key filing requirements and document checklist for this case type${policyTypes ? `\n4. Specific requirements for each policy type: ${policyTypes}` : ''}
${policyTypes ? '5' : '4'}. Any recent amendments or regulatory changes

${policyTypes ? `Pay particular attention to how each policy type (${policyTypes}) is treated under ${state} captive statutes.\n\n` : ''}Format your response as structured sections with clear headings. Be specific about statute numbers, rule citations, and document requirements.`
    }];

    const reqClient = _getClient(bodyApiKey);
    const reqModel = _getModel(bodyModel);

    // Phase 1: Research with web search
    let response: Anthropic.Message;
    try {
      response = await (reqClient.messages.create as Function)({
        model: reqModel, max_tokens: 4096,
        tools: [{ type: 'web_search_20250305', name: 'web_search' }],
        messages: researchMessages,
      });
    } catch {
      response = await reqClient.messages.create({
        model: reqModel, max_tokens: 4096, messages: researchMessages,
      });
    }

    // Handle tool use loop
    let currentMessages = researchMessages;
    let currentResponse = response;

    while (currentResponse.stop_reason === 'tool_use') {
      const toolUses = currentResponse.content.filter(b => b.type === 'tool_use') as Anthropic.ToolUseBlock[];
      for (const tu of toolUses) {
        send({ type: 'status', message: `Searching: ${(tu.input as { query?: string }).query ?? '...'}` });
      }
      const assistantMsg: Anthropic.MessageParam = { role: 'assistant', content: currentResponse.content };
      const toolResults: Anthropic.ToolResultBlockParam[] = toolUses.map(tu => ({
        type: 'tool_result' as const, tool_use_id: tu.id,
        content: JSON.stringify((tu as unknown as { result?: unknown }).result ?? ''),
      }));
      currentMessages = [...currentMessages, assistantMsg, { role: 'user', content: toolResults }];
      currentResponse = await (reqClient.messages.create as Function)({
        model: reqModel, max_tokens: 4096,
        tools: [{ type: 'web_search_20250305', name: 'web_search' }],
        messages: currentMessages,
      });
    }

    // Extract research text
    const textBlocks = currentResponse.content.filter(b => b.type === 'text') as Anthropic.TextBlock[];
    const fullText = textBlocks.map(b => b.text).join('\n');

    send({ type: 'research_result', text: fullText });
    send({ type: 'status', message: 'Extracting document checklist from research...' });

    // Phase 2: Extract checklist from the same conversation context
    const checklistMessages: Anthropic.MessageParam[] = [
      ...currentMessages,
      { role: 'assistant', content: currentResponse.content },
      { role: 'user', content: `Now extract ALL required filing documents from the legislation research above into a structured checklist.

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

Be exhaustive — include every document mentioned. Use status "mandatory" for always-required, "conditional" for situation-dependent, "optional" for recommended-only.` },
    ];

    const checklistResponse = await reqClient.messages.create({
      model: reqModel, max_tokens: 4096, messages: checklistMessages,
    });

    const checklistRaw = (checklistResponse.content[0] as Anthropic.TextBlock).text.trim();
    let checklist: unknown;
    try {
      checklist = JSON.parse(extractJson(checklistRaw));
    } catch {
      send({ type: 'error', message: 'Failed to parse checklist JSON. Raw: ' + checklistRaw.slice(0, 200) });
      res.end();
      return;
    }

    send({ type: 'checklist_result', checklist });
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

    let parsed: unknown;
    try {
      parsed = JSON.parse(extractJson(raw));
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

// ── Combined document ingestion (quality score + identification in one call) ──
app.post('/api/ingest-document', async (req, res) => {
  const {
    content, source,
    fileName, fileType, fileContent, isBase64,
    checklist,
    apiKey: bodyApiKey, model: bodyModel
  } = req.body as {
    content?: string; source?: string;
    fileName?: string; fileType?: string; fileContent?: string; isBase64?: boolean;
    checklist?: Array<{ id: string; name: string }>;
    apiKey?: string; model?: string;
  };

  // Determine document text for the prompt
  const isPdf = (fileType === 'application/pdf' || (fileName || '').toLowerCase().endsWith('.pdf'));
  const hasFileContent = !!fileContent;
  const hasTextContent = !!content;

  if (!hasFileContent && !hasTextContent) {
    return res.status(400).json({ error: 'content or fileContent is required' });
  }

  try {
    const client = _getClient(bodyApiKey);
    const model = _getModel(bodyModel);

    const checklistContext = checklist && checklist.length
      ? `\n\nCURRENT FILING CHECKLIST (match against these):\n${checklist.map((c: any, i: number) => `${i + 1}. ${c.name}`).join('\n')}`
      : '';

    const combinedPrompt = `You are a SERFF filing quality analyst AND document identification specialist for captive insurance.

Analyze the provided document and return a SINGLE JSON object that includes BOTH a quality assessment AND document identification. Return ONLY valid JSON — no markdown, no explanation.

${checklistContext}

Return this exact JSON structure:
{
  "score": {
    "gates": {
      "parseable": { "pass": true, "value": "description of format" },
      "approved": { "pass": true, "value": "status" },
      "currency": { "pass": true, "value": "recency assessment" }
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
    "tierNote": "1-2 sentence quality assessment"
  },
  "identification": {
    "documentType": "identified document type",
    "confidence": "high | medium | low",
    "summary": "1-2 sentence description",
    "coveredRequirements": ["requirement names this covers"],
    "keyFields": ["key fields found"],
    "gaps": ["missing fields"],
    "filingReady": true
  }
}

Tiers: A = 85+, B = 65-84, C = 45-64, D = <45. Score 0-100 per dimension. Composite = weighted sum.`;

    let response: Anthropic.Message;

    if (hasFileContent && isPdf && isBase64) {
      // Native PDF support
      response = await (client.beta as any).messages.create({
        model, max_tokens: 2048,
        system: 'You are a captive insurance filing specialist with expertise in SERFF documents and quality assessment.',
        messages: [{
          role: 'user',
          content: [
            { type: 'document' as const, source: { type: 'base64' as const, media_type: 'application/pdf' as const, data: fileContent } },
            { type: 'text' as const, text: combinedPrompt },
          ],
        }],
        betas: ['pdfs-2024-09-25'],
      });
    } else {
      // Text content (either from fileContent or content param)
      let textContent: string;
      if (hasFileContent) {
        textContent = isBase64
          ? Buffer.from(fileContent!, 'base64').toString('utf8').slice(0, 15000)
          : fileContent!.slice(0, 15000);
      } else {
        textContent = content!.slice(0, 8000);
      }

      response = await client.messages.create({
        model, max_tokens: 2048,
        messages: [{ role: 'user', content: `${combinedPrompt}\n\nSOURCE: ${source || fileName || 'uploaded'}\nDOCUMENT CONTENT:\n${textContent}` }],
      });
    }

    const raw = (response.content[0] as Anthropic.TextBlock).text.trim();
    const jsonStr = extractJson(raw);
    const parsed = JSON.parse(jsonStr) as { score: unknown; identification: unknown };

    res.json(parsed);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    res.status(500).json({ error: message });
  }
});

// Legacy endpoint — redirects to ingest-document
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
    const jsonStr = extractJson(raw);

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
    const jsonStr = extractJson(raw);

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

// /api/generate-documents — REMOVED (zombie Step 5)
// Step 5 now builds the decision table client-side from Step 4 match data.

// ── SERFF search terms ────────────────────────────────────────────────────────
app.post('/api/serff-search-terms', async (req, res) => {
  const { text, state, caseType, policyTypes, apiKey: bodyApiKey, model: bodyModel } = req.body as { text: string; state: string; caseType: string; policyTypes?: string; apiKey?: string; model?: string };
  try {
    const policyTypesSection = policyTypes
      ? `\n- Policy-type specific terms for each line of business: ${policyTypes} (include abbreviations, filing codes, and SERFF line-of-business tags)`
      : '';
    const prompt = `Based on this captive insurance legislation research for ${state} (${caseType}${policyTypes ? ` — policy types: ${policyTypes}` : ''}), generate 10-16 precise SERFF search terms that a filer would use to find relevant reference documents in the SERFF database.

SERFF searches across filing names, company names, and descriptions. Make terms specific and actionable.

Research text:
${text.slice(0, 3000)}

Include terms covering:
- Entity type (captive, association captive, group captive, etc.)
- State-specific regulatory keywords
- Document type keywords (feasibility study, application, bylaws, etc.)
- Business context keywords from the case type${policyTypesSection}

Return raw JSON only — no markdown, no explanation:
{"terms": ["term 1", "term 2", "term 3", ...]}`;

    const response = await _getClient(bodyApiKey).messages.create({
      model: _getModel(bodyModel),
      max_tokens: 512,
      messages: [{ role: 'user', content: prompt }],
    });

    const raw = (response.content[0] as Anthropic.TextBlock).text.trim();
    const jsonStr = extractJson(raw);
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

// ── /api/identify-serff-doc ──────────────────────────────────────────────────
// Reads uploaded SERFF document content and identifies:
//   - what document type it is
//   - which checklist requirements it covers
//   - key fields found
//   - confidence level
app.post('/api/identify-serff-doc', async (req, res) => {
  const {
    fileName, fileType, fileContent, isBase64,
    checklist,
    apiKey: bodyApiKey, model: bodyModel
  } = req.body as {
    fileName: string;
    fileType: string;       // 'application/pdf' | 'text/plain' | 'text/xml' | etc.
    fileContent: string;    // base64 string for binary, raw text for text files
    isBase64: boolean;
    checklist?: Array<{ id: string; name: string }>;
    apiKey?: string;
    model?: string;
  };

  if (!fileName || !fileContent) {
    return res.status(400).json({ error: 'fileName and fileContent are required' });
  }

  try {
    const client = _getClient(bodyApiKey);
    const model  = _getModel(bodyModel);

    const checklistContext = checklist && checklist.length
      ? `\n\nCURRENT FILING CHECKLIST (match against these):\n${checklist.map((c, i) => `${i + 1}. ${c.name}`).join('\n')}`
      : '';

    const systemPrompt = `You are a captive insurance filing specialist with deep expertise in SERFF (System for Electronic Rate and Form Filing) documents.
Analyze the provided document and return ONLY a valid JSON object — no markdown, no explanation.`;

    const userPrompt = `Analyze this document and identify:
1. What type of regulatory/filing document it is
2. Which requirements from the checklist it covers
3. Key fields/sections found
4. A confidence rating

${checklistContext}

Return ONLY this JSON structure:
{
  "documentType": "string — the identified document type (e.g., 'Business Plan', 'Articles of Incorporation')",
  "confidence": "high | medium | low",
  "summary": "1-2 sentence description of what this document is and its purpose",
  "coveredRequirements": ["array of checklist requirement names this document satisfies"],
  "keyFields": ["array of key fields/sections found in the document"],
  "gaps": ["array of important fields that appear missing or incomplete"],
  "filingReady": true or false
}`;

    let messageContent: any;

    // Use native PDF support for PDFs, plain text for everything else
    const isPdf = fileType === 'application/pdf' || fileName.toLowerCase().endsWith('.pdf');

    if (isPdf && isBase64) {
      messageContent = [
        {
          type: 'document' as const,
          source: {
            type: 'base64' as const,
            media_type: 'application/pdf' as const,
            data: fileContent,
          },
        },
        { type: 'text' as const, text: userPrompt },
      ];
    } else {
      // For text/XML/DOCX — use text content
      const textContent = isBase64
        ? Buffer.from(fileContent, 'base64').toString('utf8').slice(0, 15000)
        : fileContent.slice(0, 15000);
      messageContent = `${userPrompt}\n\nDOCUMENT CONTENT:\n${textContent}`;
    }

    // PDFs use the beta PDF endpoint; all other files use standard messages
    const response = isPdf && isBase64
      ? await (client.beta as any).messages.create({
          model, max_tokens: 1024, system: systemPrompt,
          messages: [{ role: 'user', content: messageContent }],
          betas: ['pdfs-2024-09-25'],
        })
      : await client.messages.create({
          model, max_tokens: 1024, system: systemPrompt,
          messages: [{ role: 'user', content: messageContent }],
        });

    const raw = (response.content[0] as Anthropic.TextBlock).text.trim();
    let clean = extractJson(raw);
    // Fallback: extract first { ... } block
    if (!clean.startsWith('{')) {
      const s = clean.indexOf('{'), e = clean.lastIndexOf('}');
      if (s !== -1 && e !== -1) clean = clean.slice(s, e + 1);
    }
    const result = JSON.parse(clean);
    res.json(result);

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

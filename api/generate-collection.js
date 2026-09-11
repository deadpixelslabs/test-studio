const DEFAULT_GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-2.5-flash';
const DEFAULT_NVIDIA_MODEL = process.env.NVIDIA_MODEL || 'meta/llama-guard-4-12b';
const GUARD_TIMEOUT_MS = Math.max(8000, Math.min(20000, Number(process.env.NVIDIA_GUARD_TIMEOUT_MS || 15000)));
const GEMINI_TIMEOUT_MS = Math.max(10000, Math.min(30000, Number(process.env.GEMINI_TIMEOUT_MS || 22000)));
const GUARD_STRICT = String(process.env.NVIDIA_GUARD_STRICT || 'false').toLowerCase() === 'true';

function json(res, status, data) {
  res.status(status).setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify(data));
}

function extractGeminiText(payload) {
  const parts = payload?.candidates?.[0]?.content?.parts;
  if (!Array.isArray(parts)) return '';
  return parts.map((p) => p?.text || '').join('\n').trim();
}

function cleanJsonString(text) {
  let out = String(text || '').trim();
  if (out.startsWith('```')) {
    out = out.replace(/^```(?:json)?/i, '').replace(/```$/i, '').trim();
  }
  const first = out.indexOf('{');
  const last = out.lastIndexOf('}');
  if (first >= 0 && last > first) out = out.slice(first, last + 1);
  return out;
}

async function readJsonBody(req) {
  if (req.body && typeof req.body === 'object') return req.body;
  if (typeof req.body === 'string') return JSON.parse(req.body || '{}');
  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  const raw = Buffer.concat(chunks).toString('utf8');
  return raw ? JSON.parse(raw) : {};
}

function sanitizeApiKey(value) {
  return String(value || '').trim().replace(/^Bearer\s+/i, '').replace(/^['"]|['"]$/g, '');
}

function key1() {
  return sanitizeApiKey(process.env.NVIDIA_API_KEY_1 || process.env.NVIDIA_API_KEY || process.env.NVIDIA_NIM_API_KEY_1 || process.env.NGC_API_KEY);
}
function key2() {
  return sanitizeApiKey(process.env.NVIDIA_API_KEY_2 || process.env.NVIDIA_NIM_API_KEY_2);
}
function geminiKey() {
  return sanitizeApiKey(process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY);
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function fetchWithTimeout(url, options, timeoutMs) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } catch (error) {
    if (error?.name === 'AbortError') {
      const timeoutError = new Error(`Timed out after ${Math.ceil(timeoutMs / 1000)}s`);
      timeoutError.code = 'TIMEOUT';
      throw timeoutError;
    }
    throw error;
  } finally {
    clearTimeout(timer);
  }
}

function createGeminiPrompt(userPrompt, style) {
  return `You are an NFT collection architect. Return exactly one valid JSON object and no markdown.

Task: Turn the user's idea into a 10K-ready trait-based NFT collection blueprint.

Rules:
- Keep output compact and production-friendly.
- Exactly 6 layers.
- Each layer must have exactly 5 traits.
- Each trait needs a name and integer weight.
- Weights inside each layer should create useful rarity variety and roughly sum near 100.
- Layer names should be practical for a collection generator.
- Use hex colors for palette.primary, palette.secondary, palette.accent.
- count must be 10000.
- width and height must be 512.
- required should be true for the first 4 layers; false is allowed for the last 2.
- noneWeight only matters when required is false.
- Keep names short and clean.
- Make the blueprint visually consistent with the user's prompt and style.
- Avoid explicit sexual content, hateful content, graphic violence, illegal instructions, malware, and self-harm promotion.

Return JSON schema:
{
  "collectionName": "string",
  "description": "string",
  "styleLabel": "string",
  "count": 10000,
  "width": 512,
  "height": 512,
  "palette": {
    "primary": "#RRGGBB",
    "secondary": "#RRGGBB",
    "accent": "#RRGGBB"
  },
  "layers": [
    {
      "name": "Background",
      "required": true,
      "noneWeight": 0,
      "traits": [
        { "name": "Trait A", "weight": 30 },
        { "name": "Trait B", "weight": 25 },
        { "name": "Trait C", "weight": 20 },
        { "name": "Trait D", "weight": 15 },
        { "name": "Trait E", "weight": 10 }
      ]
    }
  ]
}

User prompt: ${userPrompt}
Preferred style: ${style || 'Dead Pixels (16-Bit Cyberpunk)'}
`;
}

async function callGemini(prompt, style) {
  const apiKey = geminiKey();
  if (!apiKey) throw new Error('Missing GEMINI_API_KEY (or GOOGLE_API_KEY) in Vercel environment variables.');

  const response = await fetchWithTimeout(
    `https://generativelanguage.googleapis.com/v1beta/models/${DEFAULT_GEMINI_MODEL}:generateContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ role: 'user', parts: [{ text: createGeminiPrompt(prompt, style) }] }],
        generationConfig: {
          temperature: 0.7,
          topP: 0.9,
          maxOutputTokens: 2048,
          responseMimeType: 'application/json',
        },
      }),
    },
    GEMINI_TIMEOUT_MS
  );

  const raw = await response.text();
  if (!response.ok) throw new Error(`Gemini API error ${response.status}: ${raw.substring(0, 900)}`);

  const parsedResponse = JSON.parse(raw);
  const text = extractGeminiText(parsedResponse);
  const cleaned = cleanJsonString(text);
  try {
    return JSON.parse(cleaned);
  } catch {
    throw new Error(`Gemini returned invalid JSON: ${text.substring(0, 900)}`);
  }
}

function parseGuardDecision(rawText) {
  const text = String(rawText || '').trim();
  if (!text) return { decision: 'unavailable', reason: 'Empty safety response.' };
  const firstLine = text.split(/\r?\n/)[0].trim().toLowerCase();
  if (firstLine === 'safe') return { decision: 'allow', reason: 'safe', raw: text };
  if (firstLine === 'unsafe') {
    const categories = text.split(/\r?\n/).slice(1).join(', ').trim();
    return { decision: 'block', reason: categories ? `unsafe: ${categories}` : 'unsafe', raw: text };
  }
  if (/^safe\b/i.test(text)) return { decision: 'allow', reason: 'safe', raw: text };
  if (/^unsafe\b/i.test(text)) return { decision: 'block', reason: text, raw: text };
  return { decision: 'unavailable', reason: `Unexpected Llama Guard response: ${text}`, raw: text };
}

function createGuardMessages(stage, content, prompt) {
  if (stage === 'input') {
    return [{ role: 'user', content: String(content || prompt || '') }];
  }
  return [
    { role: 'user', content: String(prompt || '') },
    { role: 'assistant', content: typeof content === 'string' ? content : JSON.stringify(content) },
  ];
}

function slotForKey(key) {
  if (key && key === key2()) return 2;
  return 1;
}

async function pollNvidiaStatus(requestId, apiKey, deadlineMs) {
  while (Date.now() < deadlineMs) {
    await sleep(700);
    const remaining = Math.max(1000, deadlineMs - Date.now());
    const response = await fetchWithTimeout(
      `https://integrate.api.nvidia.com/v1/status/${encodeURIComponent(requestId)}`,
      { headers: { Authorization: `Bearer ${apiKey}` } },
      Math.min(5000, remaining)
    );
    const raw = await response.text();
    if (response.status === 202) continue;
    if (!response.ok) throw new Error(`NVIDIA polling error ${response.status}: ${raw.substring(0, 500)}`);
    return JSON.parse(raw);
  }
  const e = new Error(`NVIDIA async result timed out after ${Math.ceil(GUARD_TIMEOUT_MS / 1000)}s`);
  e.code = 'TIMEOUT';
  throw e;
}

async function callNvidiaOnce(apiKey, stage, content, prompt) {
  const started = Date.now();
  const deadline = started + GUARD_TIMEOUT_MS;
  const response = await fetchWithTimeout(
    'https://integrate.api.nvidia.com/v1/chat/completions',
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: DEFAULT_NVIDIA_MODEL,
        messages: createGuardMessages(stage, content, prompt),
        temperature: 0,
        max_tokens: 10,
        stream: false,
      }),
    },
    GUARD_TIMEOUT_MS
  );

  let payload;
  const raw = await response.text();
  if (response.status === 202) {
    let pending;
    try { pending = JSON.parse(raw); } catch { pending = {}; }
    const requestId = pending?.requestId || pending?.request_id || pending?.id;
    if (!requestId) throw new Error('NVIDIA returned 202 without a requestId.');
    payload = await pollNvidiaStatus(requestId, apiKey, deadline);
  } else {
    if (!response.ok) throw new Error(`NVIDIA API error ${response.status}: ${raw.substring(0, 700)}`);
    payload = JSON.parse(raw);
  }

  const messageText = payload?.choices?.[0]?.message?.content || payload?.result?.choices?.[0]?.message?.content || '';
  const decision = parseGuardDecision(messageText);
  return {
    provider: `nvidia-key-${slotForKey(apiKey)}`,
    model: DEFAULT_NVIDIA_MODEL,
    stage,
    latencyMs: Date.now() - started,
    ...decision,
  };
}

function prioritizedKeys(stage) {
  const k1 = key1();
  const k2 = key2();
  const list = stage === 'output' ? [k2, k1] : [k1, k2];
  return Array.from(new Set(list.filter(Boolean)));
}

async function callNvidiaGuard(stage, content, prompt) {
  const keys = prioritizedKeys(stage);
  if (!keys.length) {
    throw new Error('Missing NVIDIA API key in Vercel. Add NVIDIA_API_KEY_1 (key #2 is optional failover).');
  }

  // Hedged failover: start primary immediately, then start the second key shortly
  // afterwards if primary is still slow. First usable answer wins.
  const attempts = keys.map((apiKey, index) => (async () => {
    if (index > 0) await sleep(1200 * index);
    return callNvidiaOnce(apiKey, stage, content, prompt);
  })());

  const errors = [];
  const wrapped = attempts.map((promise) => promise.catch((error) => {
    errors.push(error?.message || String(error));
    throw error;
  }));

  try {
    const result = await Promise.any(wrapped);
    return result;
  } catch {
    const reason = `NVIDIA guard unavailable: ${errors.join(' | ')}`;
    if (GUARD_STRICT) throw new Error(reason);
    return {
      provider: 'nvidia-unavailable',
      model: DEFAULT_NVIDIA_MODEL,
      stage,
      decision: 'unavailable',
      reason,
      softFail: true,
    };
  }
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return json(res, 405, { error: 'Method not allowed' });

  try {
    const body = await readJsonBody(req);
    const prompt = String(body.prompt || '').trim();
    const style = String(body.style || '').trim();
    if (!prompt) return json(res, 400, { error: 'Prompt is required.' });

    const started = Date.now();
    const inputGuard = await callNvidiaGuard('input', prompt, prompt);
    if (inputGuard.decision === 'block') {
      return json(res, 400, { error: 'Prompt blocked by NVIDIA safety guard.', stage: 'input_guard', guard: inputGuard });
    }

    const blueprint = await callGemini(prompt, style);

    const outputGuard = await callNvidiaGuard('output', blueprint, prompt);
    if (outputGuard.decision === 'block') {
      return json(res, 400, { error: 'Generated blueprint blocked by NVIDIA output guard.', stage: 'output_guard', guard: outputGuard });
    }

    const warnings = [];
    if (inputGuard.decision === 'unavailable') warnings.push('Input safety guard was unavailable; generation continued in test mode.');
    if (outputGuard.decision === 'unavailable') warnings.push('Output safety guard was unavailable; generation continued in test mode.');

    return json(res, 200, {
      ...blueprint,
      _pipeline: {
        status: warnings.length ? 'ok_with_warnings' : 'ok',
        totalLatencyMs: Date.now() - started,
        inputGuard,
        geminiModel: DEFAULT_GEMINI_MODEL,
        outputGuard,
        strictGuardMode: GUARD_STRICT,
        warnings,
      },
    });
  } catch (error) {
    return json(res, 500, { error: error?.message || 'Unknown server error.' });
  }
}

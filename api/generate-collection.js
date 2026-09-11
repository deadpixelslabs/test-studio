const DEFAULT_GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-1.5-flash';
const DEFAULT_NVIDIA_MODEL = process.env.NVIDIA_MODEL || 'meta/llama-guard-4-12b';

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
  let out = (text || '').trim();
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

function getNvidiaKeys() {
  return Array.from(new Set([
    sanitizeApiKey(process.env.NVIDIA_API_KEY_1),
    sanitizeApiKey(process.env.NVIDIA_API_KEY_2),
    sanitizeApiKey(process.env.NVIDIA_API_KEY),
    sanitizeApiKey(process.env.NVIDIA_NIM_API_KEY_1),
    sanitizeApiKey(process.env.NVIDIA_NIM_API_KEY_2),
    sanitizeApiKey(process.env.NGC_API_KEY),
  ].filter(Boolean)));
}

function getGeminiKey() {
  return sanitizeApiKey(process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY);
}

async function fetchWithTimeout(url, options, timeoutMs) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } finally {
    clearTimeout(timeoutId);
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
- Weights inside each layer should create useful rarity variety and should roughly sum near 100.
- Layer names should be practical for a collection generator.
- Use hex colors for palette.primary, palette.secondary, palette.accent.
- count must be 10000.
- width and height must be 512.
- required should be true for the first 4 layers, and false is allowed for the last 2 layers.
- noneWeight only matters when required is false.
- Keep names short and clean.
- Make the blueprint visually consistent with the user's prompt and style.
- Do not include any hateful, sexual, violent, illegal, or explicit content.
- Do not reference copyrighted franchises directly.

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
  const apiKey = getGeminiKey();
  if (!apiKey) throw new Error('Missing GEMINI_API_KEY (or GOOGLE_API_KEY) in Vercel environment variables.');

  const response = await fetchWithTimeout(
    `https://generativelanguage.googleapis.com/v1beta/models/${DEFAULT_GEMINI_MODEL}:generateContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [
          {
            role: 'user',
            parts: [{ text: createGeminiPrompt(prompt, style) }],
          },
        ],
        generationConfig: {
          temperature: 0.7,
          topP: 0.9,
          maxOutputTokens: 2048,
          responseMimeType: 'application/json',
        },
      }),
    },
    25000
  );

  const raw = await response.text();
  if (!response.ok) {
    throw new Error(`Gemini API error: ${raw}`);
  }

  const parsedResponse = JSON.parse(raw);
  const text = extractGeminiText(parsedResponse);
  const cleaned = cleanJsonString(text);

  try {
    return JSON.parse(cleaned);
  } catch {
    throw new Error(`Gemini returned invalid JSON: ${text}`);
  }
}

function parseGuardDecision(rawText) {
  const text = String(rawText || '').trim();
  if (!text) return { decision: 'block', reason: 'Empty safety response.' };

  const firstLine = text.split(/\r?\n/)[0].trim().toLowerCase();
  if (firstLine === 'safe') {
    return { decision: 'allow', reason: 'safe', raw: text };
  }
  if (firstLine === 'unsafe') {
    const categories = text.split(/\r?\n/).slice(1).join(', ').trim();
    return {
      decision: 'block',
      reason: categories ? `unsafe: ${categories}` : 'unsafe',
      raw: text,
    };
  }

  const lower = text.toLowerCase();
  if (/^safe\b/.test(lower)) return { decision: 'allow', reason: 'safe', raw: text };
  if (/^unsafe\b/.test(lower)) return { decision: 'block', reason: text, raw: text };

  // Fail closed if the guard returns an unexpected format.
  return { decision: 'block', reason: `Unexpected Llama Guard response: ${text}`, raw: text };
}

function createGuardMessages(stage, content, prompt) {
  if (stage === 'input') {
    // Llama Guard 4 expects user/assistant roles only. A single user turn is valid
    // for classifying an input prompt.
    return [
      {
        role: 'user',
        content: String(content || prompt || ''),
      },
    ];
  }

  // To classify an assistant output, give Llama Guard an alternating
  // user -> assistant conversation. No system role is used.
  return [
    {
      role: 'user',
      content: String(prompt || ''),
    },
    {
      role: 'assistant',
      content: typeof content === 'string' ? content : JSON.stringify(content),
    },
  ];
}

function orderedNvidiaKeys(stage) {
  const key1 = sanitizeApiKey(process.env.NVIDIA_API_KEY_1 || process.env.NVIDIA_API_KEY || process.env.NVIDIA_NIM_API_KEY_1 || process.env.NGC_API_KEY);
  const key2 = sanitizeApiKey(process.env.NVIDIA_API_KEY_2 || process.env.NVIDIA_NIM_API_KEY_2);

  const ordered = stage === 'output' ? [key2, key1] : [key1, key2];
  return Array.from(new Set(ordered.filter(Boolean)));
}

async function callNvidiaGuard(stage, content, prompt, style) {
  const keys = orderedNvidiaKeys(stage);
  if (!keys.length) {
    throw new Error('Missing NVIDIA API key in Vercel. Add NVIDIA_API_KEY_1 (key #2 is optional failover).');
  }

  const errors = [];
  for (let i = 0; i < keys.length; i += 1) {
    const key = keys[i];
    const preferredSlot = stage === 'output' ? (i === 0 && sanitizeApiKey(process.env.NVIDIA_API_KEY_2) ? 2 : 1) : (i === 0 ? 1 : 2);

    try {
      const response = await fetchWithTimeout(
        'https://integrate.api.nvidia.com/v1/chat/completions',
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${key}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: DEFAULT_NVIDIA_MODEL,
            messages: createGuardMessages(stage, content, prompt),
            temperature: 0,
            max_tokens: 20,
          }),
        },
        10000
      );

      const raw = await response.text();
      if (!response.ok) {
        errors.push(`NVIDIA key ${preferredSlot}: ${raw}`);
        continue;
      }

      const payload = JSON.parse(raw);
      const messageText = payload?.choices?.[0]?.message?.content || '';
      const decision = parseGuardDecision(messageText);
      return {
        provider: `nvidia-key-${preferredSlot}`,
        model: DEFAULT_NVIDIA_MODEL,
        stage,
        ...decision,
      };
    } catch (error) {
      errors.push(`NVIDIA key ${preferredSlot}: ${error?.message || 'Unknown error'}`);
    }
  }

  throw new Error(`All NVIDIA guard attempts failed. ${errors.join(' | ')}`);
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return json(res, 405, { error: 'Method not allowed' });
  }

  try {
    const body = await readJsonBody(req);
    const prompt = String(body.prompt || '').trim();
    const style = String(body.style || '').trim();

    if (!prompt) {
      return json(res, 400, { error: 'Prompt is required.' });
    }

    const inputGuard = await callNvidiaGuard('input', prompt, prompt, style);
    if (inputGuard.decision !== 'allow') {
      return json(res, 400, {
        error: 'Prompt blocked by NVIDIA safety guard.',
        stage: 'input_guard',
        guard: inputGuard,
      });
    }

    const blueprint = await callGemini(prompt, style);

    const outputGuard = await callNvidiaGuard('output', blueprint, prompt, style);
    if (outputGuard.decision !== 'allow') {
      return json(res, 400, {
        error: 'Generated blueprint blocked by NVIDIA output guard.',
        stage: 'output_guard',
        guard: outputGuard,
      });
    }

    return json(res, 200, {
      ...blueprint,
      _pipeline: {
        status: 'ok',
        inputGuard,
        geminiModel: DEFAULT_GEMINI_MODEL,
        outputGuard,
      },
    });
  } catch (error) {
    const message = error?.name === 'AbortError'
      ? 'A model request timed out.'
      : (error?.message || 'Unknown server error.');
    return json(res, 500, { error: message });
  }
}

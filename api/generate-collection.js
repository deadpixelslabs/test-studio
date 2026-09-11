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
  ].filter(Boolean)));
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
  const apiKey = sanitizeApiKey(process.env.GEMINI_API_KEY);
  if (!apiKey) throw new Error('Missing GEMINI_API_KEY in Vercel environment variables.');

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

  const cleaned = cleanJsonString(text);
  try {
    const parsed = JSON.parse(cleaned);
    const decision = String(parsed?.decision || parsed?.verdict || '').toLowerCase();
    if (decision === 'allow' || decision === 'safe') {
      return { decision: 'allow', reason: parsed?.reason || parsed?.summary || 'Allowed by guard.' };
    }
    if (decision === 'block' || decision === 'unsafe') {
      return { decision: 'block', reason: parsed?.reason || parsed?.summary || 'Blocked by guard.' };
    }
  } catch {}

  const lower = text.toLowerCase();
  if (lower.includes('unsafe') || lower.includes('block')) {
    return { decision: 'block', reason: text };
  }
  if (lower.includes('safe') || lower.includes('allow')) {
    return { decision: 'allow', reason: text };
  }
  return { decision: 'block', reason: text };
}

function createGuardMessages(stage, content, prompt, style) {
  const stageLabel = stage === 'input' ? 'input prompt' : 'generated NFT blueprint';
  return [
    {
      role: 'system',
      content: 'You are a strict safety classifier for an NFT collection generator. Classify the content. Respond with minified JSON only using this exact schema: {"decision":"allow"|"block","reason":"short reason"}. Allow benign creative NFT prompts and benign NFT collection blueprints. Block sexual content involving minors, explicit sexual content, graphic violence, illegal instructions, malware, self-harm promotion, hateful/extremist content, or requests clearly meant to imitate well-known copyrighted franchises directly.'
    },
    {
      role: 'user',
      content: `Stage: ${stageLabel}\nPreferred style: ${style || 'Dead Pixels (16-Bit Cyberpunk)'}\nOriginal prompt: ${prompt}\n\nContent to classify:\n${typeof content === 'string' ? content : JSON.stringify(content)}`
    }
  ];
}

async function callNvidiaGuard(stage, content, prompt, style) {
  const keys = getNvidiaKeys();
  if (!keys.length) {
    throw new Error('Missing NVIDIA_API_KEY_1 / NVIDIA_API_KEY_2 in Vercel environment variables.');
  }

  const errors = [];
  for (let i = 0; i < keys.length; i += 1) {
    const key = keys[i];
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
            messages: createGuardMessages(stage, content, prompt, style),
            temperature: 0,
            max_tokens: 128,
          }),
        },
        10000
      );

      const raw = await response.text();
      if (!response.ok) {
        errors.push(`NVIDIA key ${i + 1}: ${raw}`);
        continue;
      }

      const payload = JSON.parse(raw);
      const messageText = payload?.choices?.[0]?.message?.content || '';
      const decision = parseGuardDecision(messageText);
      return {
        provider: `nvidia-${i + 1}`,
        model: DEFAULT_NVIDIA_MODEL,
        ...decision,
      };
    } catch (error) {
      errors.push(`NVIDIA key ${i + 1}: ${error?.message || 'Unknown error'}`);
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

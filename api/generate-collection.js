export const config = { maxDuration: 30 };

const PRIMARY_MODEL = process.env.GROQ_MODEL || 'openai/gpt-oss-20b';
const FALLBACK_MODEL = process.env.GROQ_FALLBACK_MODEL || 'qwen/qwen3.8-27b';
const TIMEOUT_MS = Math.max(8000, Math.min(25000, Number(process.env.GROQ_TIMEOUT_MS || 18000)));

function json(res, status, data) {
  res.status(status).setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify(data));
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

async function fetchWithTimeout(url, options, timeoutMs) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } catch (error) {
    if (error?.name === 'AbortError') throw new Error(`Groq request timed out after ${Math.ceil(timeoutMs / 1000)}s.`);
    throw error;
  } finally {
    clearTimeout(timer);
  }
}

const blueprintSchema = {
  type: 'object',
  properties: {
    collectionName: { type: 'string' },
    description: { type: 'string' },
    styleLabel: { type: 'string' },
    count: { type: 'integer' },
    width: { type: 'integer' },
    height: { type: 'integer' },
    palette: {
      type: 'object',
      properties: {
        primary: { type: 'string' },
        secondary: { type: 'string' },
        accent: { type: 'string' },
      },
      required: ['primary', 'secondary', 'accent'],
      additionalProperties: false,
    },
    layers: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          name: { type: 'string' },
          required: { type: 'boolean' },
          noneWeight: { type: 'integer' },
          traits: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                name: { type: 'string' },
                weight: { type: 'integer' },
              },
              required: ['name', 'weight'],
              additionalProperties: false,
            },
          },
        },
        required: ['name', 'required', 'noneWeight', 'traits'],
        additionalProperties: false,
      },
    },
  },
  required: ['collectionName', 'description', 'styleLabel', 'count', 'width', 'height', 'palette', 'layers'],
  additionalProperties: false,
};

function buildMessages(prompt, style) {
  return [
    {
      role: 'system',
      content: `You are GLITCH NFT STUDIO's collection architect. Convert creative ideas into clean generative NFT blueprints. Output only data matching the supplied JSON schema. Build exactly 6 practical stacked layers with exactly 5 traits per layer. The first 4 layers are required. The last 2 may be optional. Use rarity weights like 35,25,18,12,10 or a similarly useful distribution. Keep all trait names short and visually descriptive. Avoid copyrighted franchise names and explicit/illegal content.`,
    },
    {
      role: 'user',
      content: `Create a 10,000-piece generative NFT collection blueprint.\n\nConcept: ${prompt}\nPreferred art direction: ${style || 'Dead Pixels (16-Bit Cyberpunk)'}\n\nRequirements:\n- count: 10000\n- canvas: 512x512\n- exactly 6 layers\n- exactly 5 traits per layer\n- palette colors must be #RRGGBB\n- names should fit the user's actual concept, not generic placeholders\n- metadata-ready collection name and description`,
    },
  ];
}

function normalizeBlueprint(data) {
  const layers = Array.isArray(data?.layers) ? data.layers.slice(0, 6) : [];
  if (layers.length !== 6) throw new Error(`Model returned ${layers.length} layers; expected 6.`);

  const normalizedLayers = layers.map((layer, i) => {
    const traits = Array.isArray(layer?.traits) ? layer.traits.slice(0, 5) : [];
    if (traits.length !== 5) throw new Error(`Layer ${i + 1} returned ${traits.length} traits; expected 5.`);
    return {
      name: String(layer.name || `Layer ${i + 1}`).trim(),
      required: i < 4 ? true : layer.required !== false,
      noneWeight: i < 4 ? 0 : Math.max(0, Math.min(50, Number(layer.noneWeight ?? 12))),
      traits: traits.map((trait, j) => ({
        name: String(trait?.name || `Trait ${j + 1}`).trim(),
        weight: Math.max(1, Math.min(100, Number(trait?.weight ?? 10))),
      })),
    };
  });

  return {
    collectionName: String(data?.collectionName || 'Untitled Collection').trim(),
    description: String(data?.description || 'AI generated NFT collection.').trim(),
    styleLabel: String(data?.styleLabel || 'AI Generated').trim(),
    count: 10000,
    width: 512,
    height: 512,
    palette: {
      primary: String(data?.palette?.primary || '#0f172a'),
      secondary: String(data?.palette?.secondary || '#22c55e'),
      accent: String(data?.palette?.accent || '#38bdf8'),
    },
    layers: normalizedLayers,
  };
}

async function callGroq(apiKey, model, prompt, style) {
  const response = await fetchWithTimeout(
    'https://api.groq.com/openai/v1/chat/completions',
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model,
        messages: buildMessages(prompt, style),
        temperature: 0.65,
        reasoning_effort: 'low',
        max_completion_tokens: 2200,
        response_format: {
          type: 'json_schema',
          json_schema: {
            name: 'nft_collection_blueprint',
            strict: true,
            schema: blueprintSchema,
          },
        },
      }),
    },
    TIMEOUT_MS
  );

  const raw = await response.text();
  if (!response.ok) {
    const error = new Error(`Groq ${model} error ${response.status}: ${raw.substring(0, 700)}`);
    error.status = response.status;
    throw error;
  }

  const payload = JSON.parse(raw);
  const content = payload?.choices?.[0]?.message?.content;
  if (!content) throw new Error(`Groq ${model} returned an empty response.`);
  return normalizeBlueprint(JSON.parse(content));
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return json(res, 405, { error: 'Method not allowed.' });

  const apiKey = sanitizeApiKey(process.env.GROQ_API_KEY);
  if (!apiKey) return json(res, 500, { error: 'Missing GROQ_API_KEY in Vercel Environment Variables.' });

  try {
    const body = await readJsonBody(req);
    const prompt = String(body.prompt || '').trim();
    const style = String(body.style || '').trim();
    if (!prompt) return json(res, 400, { error: 'Prompt is required.' });

    const models = Array.from(new Set([PRIMARY_MODEL, FALLBACK_MODEL].filter(Boolean)));
    const errors = [];

    for (const model of models) {
      try {
        const blueprint = await callGroq(apiKey, model, prompt, style);
        return json(res, 200, {
          ...blueprint,
          _pipeline: {
            provider: 'Groq',
            model,
            structuredOutput: true,
            status: 'ok',
          },
        });
      } catch (error) {
        errors.push(error?.message || String(error));
        const status = Number(error?.status || 0);
        if (status && status < 500 && status !== 429) break;
      }
    }

    return json(res, 502, { error: errors.join(' | ') || 'Groq generation failed.' });
  } catch (error) {
    return json(res, 500, { error: error?.message || 'Unknown server error.' });
  }
}

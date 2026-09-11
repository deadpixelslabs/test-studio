export const config = { maxDuration: 60 };

const PRIMARY_MODEL = process.env.GROQ_MODEL || 'openai/gpt-oss-20b';
const FALLBACK_MODEL = process.env.GROQ_FALLBACK_MODEL || 'qwen/qwen3.8-27b';
const SAFETY_MODEL = process.env.GROQ_SAFETY_MODEL || 'openai/gpt-oss-safeguard-20b';
const TIMEOUT_MS = Math.max(12000, Math.min(45000, Number(process.env.GROQ_TIMEOUT_MS || 30000)));
const MAX_PROMPT_CHARS = 1600;
const RATE_WINDOW_MS = 10 * 60 * 1000;
const RATE_MAX = 15;
const rateBuckets = globalThis.__glitchRateBuckets || new Map();
globalThis.__glitchRateBuckets = rateBuckets;

function getClientIp(req) {
  return String(req.headers['x-forwarded-for'] || req.headers['x-real-ip'] || 'unknown').split(',')[0].trim();
}

function checkRateLimit(req) {
  const ip = getClientIp(req);
  const now = Date.now();
  const current = rateBuckets.get(ip);
  if (!current || now - current.startedAt > RATE_WINDOW_MS) {
    rateBuckets.set(ip, { startedAt: now, count: 1 });
    return { ok: true, remaining: RATE_MAX - 1 };
  }
  if (current.count >= RATE_MAX) return { ok: false, remaining: 0 };
  current.count += 1;
  rateBuckets.set(ip, current);
  return { ok: true, remaining: RATE_MAX - current.count };
}

function json(res, status, data) {
  res.status(status).setHeader('Content-Type', 'application/json');
  res.setHeader('Cache-Control', 'no-store');
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

const traitSchema = {
  type: 'object',
  properties: {
    name: { type: 'string' },
    weight: { type: 'integer' },
    svg: { type: 'string' },
  },
  required: ['name', 'weight', 'svg'],
  additionalProperties: false,
};

const blueprintSchema = {
  type: 'object',
  properties: {
    collectionName: { type: 'string' },
    description: { type: 'string' },
    subject: { type: 'string' },
    styleLabel: { type: 'string' },
    count: { type: 'integer' },
    width: { type: 'integer' },
    height: { type: 'integer' },
    layers: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          name: { type: 'string' },
          role: {
            type: 'string',
            enum: ['background', 'base', 'texture', 'outfit', 'face', 'eyes', 'accessory', 'headwear', 'overlay', 'effect', 'foreground', 'other'],
          },
          required: { type: 'boolean' },
          noneWeight: { type: 'integer' },
          traits: { type: 'array', items: traitSchema },
        },
        required: ['name', 'role', 'required', 'noneWeight', 'traits'],
        additionalProperties: false,
      },
    },
  },
  required: ['collectionName', 'description', 'subject', 'styleLabel', 'count', 'width', 'height', 'layers'],
  additionalProperties: false,
};

const safetySchema = {
  type: 'object',
  properties: {
    violation: { type: 'boolean' },
    category: { type: ['string', 'null'] },
    reason: { type: 'string' },
  },
  required: ['violation', 'category', 'reason'],
  additionalProperties: false,
};

const qualitySchema = {
  type: 'object',
  properties: {
    matchesPrompt: { type: 'boolean' },
    subjectAccurate: { type: 'boolean' },
    layersCoherent: { type: 'boolean' },
    reason: { type: 'string' },
  },
  required: ['matchesPrompt', 'subjectAccurate', 'layersCoherent', 'reason'],
  additionalProperties: false,
};

function buildSafetyMessages(prompt) {
  return [
    {
      role: 'system',
      content: `You are the content safety gate for a public AI NFT art generator.
Classify the user's visual-art request using this policy.
BLOCK only when the request asks for prohibited sexual content, any sexual content involving minors, graphic sexual violence, explicit encouragement of self-harm, hateful/extremist praise or recruitment, instructions facilitating serious wrongdoing, or other clearly unsafe content.
ALLOW ordinary fictional characters, horror, fantasy, memes, animals, robots, monsters, weapons as decorative fictional elements, satire, and general creative art.
Return JSON only.`,
    },
    { role: 'user', content: prompt },
  ];
}

function buildGenerationMessages(prompt, style) {
  const styleInstruction = !style || /^auto/i.test(style)
    ? 'Follow the user prompt exactly. Infer the art direction from the prompt.'
    : `Use this only as a visual art-direction hint: ${style}. It must NEVER replace or change the user's main subject.`;

  return [
    {
      role: 'system',
      content: `You are GLITCH NFT STUDIO's production art engine.
The USER PROMPT IS THE SOURCE OF TRUTH. Never replace the user's main subject with a preset subject. If the user says doge, render doge; if they say toaster, spaceship, flower, monster, shoe, abstract symbol, or anything else, build THAT concept.

Your job is to create a complete layered generative NFT collection as compact standalone SVG art.

PRODUCTION RULES:
- Return data matching the JSON schema only.
- Exactly 6 layers, exactly 5 traits per layer.
- At least 4 layers must be required.
- The collection must support at least 10,000 unique combinations.
- Every trait must include a COMPLETE standalone SVG string with viewBox="0 0 128 128".
- Background layer SVGs should fill the canvas.
- All non-background SVGs must use transparent backgrounds and contain only that layer's visual contribution.
- The base layer must clearly depict the user's requested main subject. Do not substitute another subject.
- Keep the primary subject in a consistent position and silhouette across base variants so overlays align.
- Every non-None trait must contain clearly visible SVG shapes. No blank required layers.
- Optional layers may include a transparent None/No ... trait.
- SVGs must be compact: simple rect/circle/path/polygon/line shapes, crisp 2D vector or pixel-art construction, no external images, no scripts, no foreignObject, no remote URLs.
- Use a consistent 128x128 coordinate system for all layers.
- Make trait names specific to the user's concept, not generic placeholders.
- Avoid copying a living artist's exact style or a copyrighted character verbatim. Transform requests into an original collection concept when needed.
- Do not include text in the artwork unless the user explicitly requests visible text.

LAYER STACK GUIDANCE:
background -> base -> texture/outfit -> face/eyes -> accessory/headwear -> effect/foreground.
You may choose different layer names that fit the concept, but roles must describe stacking order.

Make the visual output feel intentionally designed, not random.`,
    },
    {
      role: 'user',
      content: `Create a production-ready generative NFT collection from this concept:\n\n${prompt}\n\n${styleInstruction}\n\nTarget supply: 10,000\nCanvas: 512x512 final render (SVG source viewBox 0 0 128 128).`,
    },
  ];
}

function isNoneTrait(name) {
  const n = String(name || '').trim().toLowerCase();
  return n === 'none' || n.startsWith('no ') || n.includes('empty') || n.includes('transparent');
}

function isSvgSafe(svg) {
  const s = String(svg || '').trim();
  if (!s.startsWith('<svg')) return false;
  if (s.length < 30 || s.length > 12000) return false;
  if (/<script\b|<foreignObject\b|<iframe\b|<object\b|<embed\b|javascript\s*:|https?:\/\//i.test(s)) return false;
  return true;
}

function hasVisibleShape(svg) {
  return /<(rect|circle|ellipse|line|polyline|polygon|path|text)\b/i.test(String(svg || ''));
}

function normalizeBlueprint(data) {
  const layers = Array.isArray(data?.layers) ? data.layers.slice(0, 6) : [];
  if (layers.length !== 6) throw new Error(`AI returned ${layers.length} layers; expected exactly 6.`);

  let requiredCount = 0;
  const normalizedLayers = layers.map((layer, i) => {
    const traits = Array.isArray(layer?.traits) ? layer.traits.slice(0, 5) : [];
    if (traits.length !== 5) throw new Error(`Layer ${i + 1} returned ${traits.length} traits; expected exactly 5.`);

    const required = Boolean(layer.required);
    if (required) requiredCount += 1;

    const normalizedTraits = traits.map((trait, j) => {
      const name = String(trait?.name || `Trait ${j + 1}`).trim();
      const svg = String(trait?.svg || '').trim();
      if (!isSvgSafe(svg)) throw new Error(`Unsafe or invalid SVG in layer ${i + 1}, trait ${j + 1}.`);
      if (!(isNoneTrait(name) && !required) && !hasVisibleShape(svg)) {
        throw new Error(`Empty visible art in required trait ${name}.`);
      }
      return {
        name,
        weight: Math.max(1, Math.min(100, Number(trait?.weight ?? 10))),
        svg,
      };
    });

    return {
      name: String(layer?.name || `Layer ${i + 1}`).trim(),
      role: String(layer?.role || 'other').trim(),
      required,
      noneWeight: required ? 0 : Math.max(0, Math.min(60, Number(layer?.noneWeight ?? 0))),
      traits: normalizedTraits,
    };
  });

  if (requiredCount < 4) throw new Error('AI returned fewer than 4 required layers.');
  const roles = normalizedLayers.map((layer) => layer.role);
  if (!roles.includes('background')) throw new Error('AI blueprint is missing a background layer.');
  if (!roles.includes('base')) throw new Error('AI blueprint is missing the main subject/base layer.');
  const baseLayer = normalizedLayers.find((layer) => layer.role === 'base');
  if (!baseLayer?.required) throw new Error('The main subject/base layer must be required.');

  const combinationCount = normalizedLayers.reduce((acc, layer) => {
    const variants = layer.traits.length + (!layer.required && layer.noneWeight > 0 ? 1 : 0);
    return acc * variants;
  }, 1);
  if (combinationCount < 10000) throw new Error(`AI blueprint only supports ${combinationCount} combinations.`);

  return {
    collectionName: String(data?.collectionName || 'Untitled Collection').trim(),
    description: String(data?.description || 'AI-generated generative NFT collection.').trim(),
    subject: String(data?.subject || '').trim(),
    styleLabel: String(data?.styleLabel || 'AI Generated').trim(),
    count: 10000,
    width: 512,
    height: 512,
    layers: normalizedLayers,
  };
}

async function callGroqJson(apiKey, model, messages, schemaName, schema, maxTokens = 14000, timeoutMs = TIMEOUT_MS) {
  const response = await fetchWithTimeout(
    'https://api.groq.com/openai/v1/chat/completions',
    {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model,
        messages,
        temperature: model.includes('safeguard') ? 0 : 0.55,
        reasoning_effort: 'low',
        max_completion_tokens: maxTokens,
        response_format: {
          type: 'json_schema',
          json_schema: { name: schemaName, strict: !model.includes('safeguard'), schema },
        },
      }),
    },
    timeoutMs
  );

  const raw = await response.text();
  if (!response.ok) {
    const error = new Error(`Groq ${model} error ${response.status}: ${raw.substring(0, 900)}`);
    error.status = response.status;
    throw error;
  }
  const payload = JSON.parse(raw);
  const content = payload?.choices?.[0]?.message?.content;
  if (!content) throw new Error(`Groq ${model} returned an empty response.`);
  return JSON.parse(content);
}

async function moderatePrompt(apiKey, prompt) {
  try {
    const result = await callGroqJson(apiKey, SAFETY_MODEL, buildSafetyMessages(prompt), 'art_safety', safetySchema, 600, 12000);
    return {
      violation: Boolean(result?.violation),
      category: result?.category ?? null,
      reason: String(result?.reason || ''),
      model: SAFETY_MODEL,
    };
  } catch (error) {
    // Production-safe default: do not silently bypass a failed moderation check.
    throw new Error(`Safety check unavailable: ${error?.message || String(error)}`);
  }
}

function blueprintSummary(blueprint) {
  return {
    collectionName: blueprint.collectionName,
    subject: blueprint.subject,
    styleLabel: blueprint.styleLabel,
    layers: blueprint.layers.map((layer) => ({
      name: layer.name,
      role: layer.role,
      required: layer.required,
      traits: layer.traits.map((trait) => trait.name),
    })),
  };
}

async function qualityCheck(apiKey, prompt, blueprint) {
  const messages = [
    {
      role: 'system',
      content: `You are a strict semantic QA checker for an AI NFT generator. The user's requested concept must remain the main subject. A style hint must never replace the requested subject. Evaluate only semantic fidelity and layer coherence. Return JSON only.`,
    },
    {
      role: 'user',
      content: `User prompt:
${prompt}

Generated blueprint summary:
${JSON.stringify(blueprintSummary(blueprint))}

Check whether the blueprint clearly depicts the requested concept and whether the layers/traits are coherent for that concept.`,
    },
  ];
  const result = await callGroqJson(apiKey, PRIMARY_MODEL, messages, 'collection_quality', qualitySchema, 500, 12000);
  return {
    matchesPrompt: Boolean(result?.matchesPrompt),
    subjectAccurate: Boolean(result?.subjectAccurate),
    layersCoherent: Boolean(result?.layersCoherent),
    reason: String(result?.reason || ''),
  };
}

async function generateBlueprint(apiKey, model, prompt, style) {
  const data = await callGroqJson(apiKey, model, buildGenerationMessages(prompt, style), 'glitch_nft_collection', blueprintSchema, 18000, TIMEOUT_MS);
  return normalizeBlueprint(data);
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return json(res, 405, { error: 'Method not allowed.' });

  const apiKey = sanitizeApiKey(process.env.GROQ_API_KEY);
  if (!apiKey) return json(res, 500, { error: 'Missing GROQ_API_KEY in Vercel Environment Variables.' });

  const rate = checkRateLimit(req);
  res.setHeader('X-RateLimit-Remaining', String(rate.remaining));
  if (!rate.ok) return json(res, 429, { error: 'Too many generation requests. Please try again later.' });

  const allowedOrigin = String(process.env.ALLOWED_ORIGIN || '').trim();
  const requestOrigin = String(req.headers.origin || '').trim();
  if (allowedOrigin && requestOrigin && requestOrigin !== allowedOrigin) {
    return json(res, 403, { error: 'Origin not allowed.' });
  }

  try {
    const body = await readJsonBody(req);
    const prompt = String(body.prompt || '').trim();
    const style = String(body.style || '').trim();

    if (!prompt) return json(res, 400, { error: 'Prompt is required.' });
    if (prompt.length > MAX_PROMPT_CHARS) return json(res, 400, { error: `Prompt is too long. Maximum ${MAX_PROMPT_CHARS} characters.` });

    const safety = await moderatePrompt(apiKey, prompt);
    if (safety.violation) {
      return json(res, 400, {
        error: 'This prompt cannot be generated. Please change the concept and try again.',
        blocked: true,
        category: safety.category,
      });
    }

    const models = Array.from(new Set([PRIMARY_MODEL, FALLBACK_MODEL].filter(Boolean)));
    const errors = [];

    for (const model of models) {
      try {
        const blueprint = await generateBlueprint(apiKey, model, prompt, style);
        const quality = await qualityCheck(apiKey, prompt, blueprint);
        if (!quality.matchesPrompt || !quality.subjectAccurate || !quality.layersCoherent) {
          throw new Error(`Semantic QA rejected the blueprint: ${quality.reason || 'prompt mismatch'}`);
        }
        return json(res, 200, {
          ...blueprint,
          _pipeline: {
            provider: 'Groq',
            model,
            safetyModel: SAFETY_MODEL,
            qualityModel: PRIMARY_MODEL,
            structuredOutput: true,
            svgLayers: true,
            status: 'ok',
          },
        });
      } catch (error) {
        errors.push(error?.message || String(error));
        const status = Number(error?.status || 0);
        if (status && status < 500 && status !== 429) break;
      }
    }

    return json(res, 502, { error: errors.join(' | ') || 'AI generation failed.' });
  } catch (error) {
    return json(res, 500, { error: error?.message || 'Unknown server error.' });
  }
}

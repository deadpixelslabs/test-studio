export const config = { maxDuration: 60 };

const PRIMARY_MODEL = process.env.GROQ_MODEL || 'openai/gpt-oss-20b';
const FALLBACK_MODEL = process.env.GROQ_FALLBACK_MODEL || 'qwen/qwen3.8-27b';
const SAFETY_MODEL = process.env.GROQ_SAFETY_MODEL || 'openai/gpt-oss-safeguard-20b';
const TIMEOUT_MS = Math.max(10000, Math.min(30000, Number(process.env.GROQ_TIMEOUT_MS || 20000)));
const MAX_PROMPT_CHARS = 1600;
const RATE_WINDOW_MS = 10 * 60 * 1000;
const RATE_MAX = 15;
const ASSET_CONCURRENCY = 3;
const rateBuckets = globalThis.__glitchRateBuckets || new Map();
globalThis.__glitchRateBuckets = rateBuckets;

const ROLE_ORDER = {
  background: 10,
  base: 20,
  texture: 30,
  outfit: 40,
  face: 50,
  eyes: 55,
  accessory: 60,
  headwear: 70,
  overlay: 80,
  effect: 90,
  foreground: 100,
  other: 65,
};

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
    if (error?.name === 'AbortError') throw new Error(`AI request timed out after ${Math.ceil(timeoutMs / 1000)}s.`);
    throw error;
  } finally {
    clearTimeout(timer);
  }
}

function compactGroqError(status, raw) {
  try {
    const parsed = JSON.parse(raw);
    const message = String(parsed?.error?.message || parsed?.message || '').trim();
    if (message) {
      if (/failed to generate json/i.test(message)) return `Structured generation failed on this model (${status}).`;
      if (/rate limit/i.test(message)) return `Groq rate limit reached (${status}).`;
      return `${message.slice(0, 260)} (${status}).`;
    }
  } catch {}
  return `Groq request failed with HTTP ${status}.`;
}

const traitPlanSchema = {
  type: 'object',
  properties: {
    name: { type: 'string' },
    weight: { type: 'integer' },
  },
  required: ['name', 'weight'],
  additionalProperties: false,
};

const collectionPlanSchema = {
  type: 'object',
  properties: {
    collectionName: { type: 'string' },
    description: { type: 'string' },
    subject: { type: 'string' },
    styleLabel: { type: 'string' },
    artDirection: { type: 'string' },
    compositionGuide: { type: 'string' },
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
          traits: { type: 'array', items: traitPlanSchema },
        },
        required: ['name', 'role', 'required', 'noneWeight', 'traits'],
        additionalProperties: false,
      },
    },
  },
  required: ['collectionName', 'description', 'subject', 'styleLabel', 'artDirection', 'compositionGuide', 'layers'],
  additionalProperties: false,
};

const layerRenderSchema = {
  type: 'object',
  properties: {
    layerName: { type: 'string' },
    traits: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          name: { type: 'string' },
          svg: { type: 'string' },
        },
        required: ['name', 'svg'],
        additionalProperties: false,
      },
    },
  },
  required: ['layerName', 'traits'],
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
      content: `You are the content-safety gate for a public AI NFT art generator.
BLOCK only clearly disallowed visual-art requests such as sexual content involving minors, explicit sexual violence, graphic gore intended for shock, explicit self-harm encouragement, hateful/extremist praise or recruitment, or instructions facilitating serious wrongdoing.
ALLOW ordinary fictional characters, horror/fantasy, memes, animals, robots, monsters, decorative fictional weapons, satire, and general creative art.
Return JSON only.`,
    },
    { role: 'user', content: prompt },
  ];
}

function buildPlanMessages(prompt, style) {
  const styleInstruction = !style || /^auto/i.test(style)
    ? 'Infer the visual style directly from the user prompt.'
    : `Use "${style}" only as an art-direction hint. It must never replace the main subject requested by the user.`;

  return [
    {
      role: 'system',
      content: `You are GLITCH NFT STUDIO's collection architect.
The USER PROMPT IS THE SOURCE OF TRUTH. Do not substitute a different subject, mascot, preset, animal, skull, robot, or character.
Design a generative collection architecture that could later be rendered as aligned SVG layers.

Rules:
- Return only data matching the schema.
- Exactly 6 layers and exactly 5 traits per layer.
- Include one required background layer and one required base layer.
- At least 4 of the 6 layers must be required.
- Optional layers may include a trait named None or No <thing>.
- The base layer defines the user's main requested subject.
- Trait names must be specific to the requested concept, not generic placeholders.
- Rarity weights should be useful integers between 1 and 100.
- The architecture must provide at least 10,000 possible combinations.
- artDirection should describe the visual language, materials, palette, and mood.
- compositionGuide should describe one consistent centered composition all SVG render calls can follow.
- Do not include SVG code in this step.
- If the user asks for a copyrighted character or a living artist's exact style, produce an original transformed concept rather than an exact copy.`,
    },
    {
      role: 'user',
      content: `Create a production-ready 10,000-item NFT collection plan from this concept:\n\n${prompt}\n\n${styleInstruction}`,
    },
  ];
}

function buildLayerRenderMessages(prompt, plan, layer) {
  const traitNames = layer.traits.map((trait) => trait.name);
  const roleInstruction = layer.role === 'background'
    ? 'Every non-None SVG must fill the full 128x128 canvas.'
    : layer.role === 'base'
      ? `Every SVG must clearly depict the same main subject: ${plan.subject}. Keep the silhouette, scale, and placement consistent across all five base variants.`
      : 'Use a transparent background and draw only this layer contribution so it aligns over the base subject.';

  return [
    {
      role: 'system',
      content: `You are GLITCH NFT STUDIO's SVG asset renderer.
Render exactly the requested layer for a generative NFT collection.

Hard requirements:
- Return JSON matching the schema only.
- Return exactly the same trait names and exactly one SVG for each trait.
- Every SVG must be a complete standalone <svg> using viewBox='0 0 128 128'.
- Use SINGLE QUOTES inside SVG attributes to keep JSON escaping simple.
- Keep SVG compact and preferably one line.
- Use only safe built-in SVG geometry: rect, circle, ellipse, line, polyline, polygon, path, g, defs, linearGradient, radialGradient, stop.
- No script, foreignObject, iframe, embedded image, external URL, CSS import, animation, or event handlers.
- No visible text unless the user's prompt explicitly requests text.
- Non-background layers must remain transparent outside their actual shapes.
- A trait named None / No ... must return a valid empty transparent SVG.
- All visible traits must contain visible shapes.
- Preserve the user's requested subject exactly; do not substitute a preset subject.

Coordinate contract for consistency:
- Canvas: 128x128.
- Main subject generally occupies x=18..110 and y=10..124 unless the collection plan explicitly needs another composition.
- Keep facial/detail overlays around the same anchors across variants.
- Effects may extend outward but should not shift the base subject.

${roleInstruction}`,
    },
    {
      role: 'user',
      content: `USER PROMPT:\n${prompt}\n\nSUBJECT:\n${plan.subject}\n\nSTYLE:\n${plan.styleLabel}\n\nART DIRECTION:\n${plan.artDirection}\n\nCOMPOSITION GUIDE:\n${plan.compositionGuide}\n\nLAYER TO RENDER:\n${layer.name}\nROLE: ${layer.role}\nREQUIRED: ${layer.required}\n\nTRAIT NAMES (must match exactly):\n${traitNames.map((name, i) => `${i + 1}. ${name}`).join('\n')}`,
    },
  ];
}

function isNoneTrait(name) {
  const n = String(name || '').trim().toLowerCase();
  return n === 'none' || n.startsWith('no ') || n.includes('empty') || n.includes('transparent');
}

function transparentSvg() {
  return "<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 128 128'></svg>";
}

function isSvgSafe(svg) {
  const s = String(svg || '').trim();
  if (!s.startsWith('<svg')) return false;
  if (s.length < 30 || s.length > 9000) return false;
  if (/<script\b|<foreignObject\b|<iframe\b|<object\b|<embed\b|<image\b|javascript\s*:|https?:\/\//i.test(s)) return false;
  if (/\son[a-z]+\s*=/i.test(s)) return false;
  return true;
}

function hasVisibleShape(svg) {
  return /<(rect|circle|ellipse|line|polyline|polygon|path)\b/i.test(String(svg || ''));
}

function normalizePlan(data) {
  const layers = Array.isArray(data?.layers) ? data.layers.slice(0, 6) : [];
  if (layers.length !== 6) throw new Error(`AI returned ${layers.length} layers; expected exactly 6.`);

  let requiredCount = 0;
  const normalizedLayers = layers.map((layer, i) => {
    const traits = Array.isArray(layer?.traits) ? layer.traits.slice(0, 5) : [];
    if (traits.length !== 5) throw new Error(`Layer ${i + 1} returned ${traits.length} traits; expected exactly 5.`);

    const required = Boolean(layer.required);
    if (required) requiredCount += 1;

    return {
      name: String(layer?.name || `Layer ${i + 1}`).trim(),
      role: String(layer?.role || 'other').trim(),
      required,
      noneWeight: required ? 0 : Math.max(0, Math.min(60, Number(layer?.noneWeight ?? 0))),
      traits: traits.map((trait, j) => ({
        name: String(trait?.name || `Trait ${j + 1}`).trim(),
        weight: Math.max(1, Math.min(100, Number(trait?.weight ?? 10))),
      })),
    };
  });

  if (requiredCount < 4) throw new Error('AI returned fewer than 4 required layers.');
  const roles = normalizedLayers.map((layer) => layer.role);
  if (!roles.includes('background')) throw new Error('AI plan is missing a background layer.');
  if (!roles.includes('base')) throw new Error('AI plan is missing the main subject/base layer.');
  const baseLayer = normalizedLayers.find((layer) => layer.role === 'base');
  if (!baseLayer?.required) throw new Error('The main subject/base layer must be required.');

  normalizedLayers.sort((a, b) => (ROLE_ORDER[a.role] ?? 65) - (ROLE_ORDER[b.role] ?? 65));

  const combinationCount = normalizedLayers.reduce((acc, layer) => {
    const variants = layer.traits.length + (!layer.required && layer.noneWeight > 0 ? 1 : 0);
    return acc * variants;
  }, 1);
  if (combinationCount < 10000) throw new Error(`AI plan only supports ${combinationCount} combinations.`);

  return {
    collectionName: String(data?.collectionName || 'Untitled Collection').trim(),
    description: String(data?.description || 'AI-generated generative NFT collection.').trim(),
    subject: String(data?.subject || '').trim(),
    styleLabel: String(data?.styleLabel || 'AI Generated').trim(),
    artDirection: String(data?.artDirection || '').trim(),
    compositionGuide: String(data?.compositionGuide || '').trim(),
    count: 10000,
    width: 512,
    height: 512,
    layers: normalizedLayers,
    combinationCount,
  };
}

function normalizeRenderedLayer(planLayer, rendered) {
  const rawTraits = Array.isArray(rendered?.traits) ? rendered.traits : [];
  if (rawTraits.length !== planLayer.traits.length) {
    throw new Error(`Layer "${planLayer.name}" returned ${rawTraits.length} rendered traits; expected ${planLayer.traits.length}.`);
  }

  return {
    ...planLayer,
    traits: planLayer.traits.map((plannedTrait, index) => {
      const byName = rawTraits.find((item) => String(item?.name || '').trim().toLowerCase() === plannedTrait.name.toLowerCase());
      const renderedTrait = byName || rawTraits[index];
      const name = plannedTrait.name;
      let svg = String(renderedTrait?.svg || '').trim();

      if (!planLayer.required && isNoneTrait(name)) {
        svg = transparentSvg();
      }

      if (!isSvgSafe(svg)) throw new Error(`Invalid SVG for ${planLayer.name} / ${name}.`);
      if (!(isNoneTrait(name) && !planLayer.required) && !hasVisibleShape(svg)) {
        throw new Error(`Empty art for ${planLayer.name} / ${name}.`);
      }

      return { name, weight: plannedTrait.weight, svg };
    }),
  };
}

async function callGroqStructured(apiKey, model, messages, schemaName, schema, maxTokens, timeoutMs, strict = true) {
  const response = await fetchWithTimeout(
    'https://api.groq.com/openai/v1/chat/completions',
    {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model,
        messages,
        temperature: model.includes('safeguard') ? 0 : 0.35,
        ...(model.includes('safeguard') ? {} : { reasoning_effort: 'low' }),
        max_completion_tokens: maxTokens,
        response_format: {
          type: 'json_schema',
          json_schema: { name: schemaName, strict, schema },
        },
      }),
    },
    timeoutMs
  );

  const raw = await response.text();
  if (!response.ok) {
    const error = new Error(compactGroqError(response.status, raw));
    error.status = response.status;
    throw error;
  }

  const payload = JSON.parse(raw);
  const content = payload?.choices?.[0]?.message?.content;
  if (!content) throw new Error(`${model} returned an empty response.`);
  return JSON.parse(content);
}

async function callGroqJsonObject(apiKey, model, messages, maxTokens, timeoutMs) {
  const response = await fetchWithTimeout(
    'https://api.groq.com/openai/v1/chat/completions',
    {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model,
        messages,
        temperature: 0.25,
        reasoning_effort: 'low',
        max_completion_tokens: maxTokens,
        response_format: { type: 'json_object' },
      }),
    },
    timeoutMs
  );

  const raw = await response.text();
  if (!response.ok) {
    const error = new Error(compactGroqError(response.status, raw));
    error.status = response.status;
    throw error;
  }
  const payload = JSON.parse(raw);
  const content = payload?.choices?.[0]?.message?.content;
  if (!content) throw new Error(`${model} returned an empty response.`);
  return JSON.parse(content);
}

async function callWithModelFallback(apiKey, messages, schemaName, schema, maxTokens, timeoutMs, preferredModel, transform) {
  const models = Array.from(new Set([preferredModel, PRIMARY_MODEL, FALLBACK_MODEL].filter(Boolean)));
  const errors = [];

  for (const model of models) {
    const attempts = [
      { mode: 'strict', run: () => callGroqStructured(apiKey, model, messages, schemaName, schema, maxTokens, timeoutMs, true) },
      { mode: 'best-effort', run: () => callGroqStructured(apiKey, model, messages, schemaName, schema, maxTokens, timeoutMs, false) },
      { mode: 'json-object', run: () => callGroqJsonObject(apiKey, model, messages, maxTokens, timeoutMs) },
    ];

    for (const attempt of attempts) {
      try {
        const rawData = await attempt.run();
        const data = transform ? transform(rawData) : rawData;
        return { data, model, mode: attempt.mode };
      } catch (error) {
        errors.push(`${model}/${attempt.mode}: ${error?.message || String(error)}`);
      }
    }
  }

  throw new Error(errors.join(' | ') || 'All creative models failed.');
}

async function moderatePrompt(apiKey, prompt) {
  try {
    const result = await callGroqStructured(apiKey, SAFETY_MODEL, buildSafetyMessages(prompt), 'art_safety', safetySchema, 500, 10000, false);
    return {
      violation: Boolean(result?.violation),
      category: result?.category ?? null,
      reason: String(result?.reason || ''),
      model: SAFETY_MODEL,
    };
  } catch (error) {
    throw new Error(`Safety check unavailable: ${error?.message || String(error)}`);
  }
}

function blueprintSummary(plan) {
  return {
    collectionName: plan.collectionName,
    subject: plan.subject,
    styleLabel: plan.styleLabel,
    artDirection: plan.artDirection,
    layers: plan.layers.map((layer) => ({
      name: layer.name,
      role: layer.role,
      required: layer.required,
      traits: layer.traits.map((trait) => trait.name),
    })),
  };
}

async function qualityCheck(apiKey, prompt, plan) {
  const messages = [
    {
      role: 'system',
      content: `You are a semantic QA checker for an AI NFT generator. The user's requested concept must remain the main subject. A style hint must never replace the requested subject. Check prompt fidelity and whether the planned layers/traits make sense for that concept. Return JSON only.`,
    },
    {
      role: 'user',
      content: `User prompt:\n${prompt}\n\nGenerated collection plan:\n${JSON.stringify(blueprintSummary(plan))}`,
    },
  ];

  const result = await callGroqStructured(apiKey, PRIMARY_MODEL, messages, 'collection_quality', qualitySchema, 500, 10000, true);
  return {
    matchesPrompt: Boolean(result?.matchesPrompt),
    subjectAccurate: Boolean(result?.subjectAccurate),
    layersCoherent: Boolean(result?.layersCoherent),
    reason: String(result?.reason || ''),
  };
}

async function generatePlan(apiKey, prompt, style) {
  const result = await callWithModelFallback(
    apiKey,
    buildPlanMessages(prompt, style),
    'glitch_collection_plan',
    collectionPlanSchema,
    4500,
    TIMEOUT_MS,
    PRIMARY_MODEL,
    normalizePlan
  );
  return { plan: result.data, model: result.model, mode: result.mode };
}

async function renderLayer(apiKey, prompt, plan, layer, preferredModel, index) {
  const result = await callWithModelFallback(
    apiKey,
    buildLayerRenderMessages(prompt, plan, layer),
    `glitch_layer_${index + 1}`,
    layerRenderSchema,
    6000,
    TIMEOUT_MS,
    preferredModel,
    (data) => normalizeRenderedLayer(layer, data)
  );
  return { layer: result.data, model: result.model, mode: result.mode };
}

async function mapWithConcurrency(items, limit, mapper) {
  const results = new Array(items.length);
  let nextIndex = 0;

  async function worker() {
    while (true) {
      const index = nextIndex;
      nextIndex += 1;
      if (index >= items.length) return;
      results[index] = await mapper(items[index], index);
    }
  }

  const workers = Array.from({ length: Math.min(limit, items.length) }, () => worker());
  await Promise.all(workers);
  return results;
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

  const startedAt = Date.now();
  let stage = 'request';

  try {
    const body = await readJsonBody(req);
    const prompt = String(body.prompt || '').trim();
    const style = String(body.style || '').trim();

    if (!prompt) return json(res, 400, { error: 'Prompt is required.' });
    if (prompt.length > MAX_PROMPT_CHARS) return json(res, 400, { error: `Prompt is too long. Maximum ${MAX_PROMPT_CHARS} characters.` });

    stage = 'safety';
    const safety = await moderatePrompt(apiKey, prompt);
    if (safety.violation) {
      return json(res, 400, {
        error: 'This prompt cannot be generated. Please change the concept and try again.',
        blocked: true,
        category: safety.category,
      });
    }

    stage = 'collection-plan';
    const { plan, model: planModel, mode: planMode } = await generatePlan(apiKey, prompt, style);

    stage = 'semantic-qa';
    const quality = await qualityCheck(apiKey, prompt, plan);
    if (!quality.matchesPrompt || !quality.subjectAccurate || !quality.layersCoherent) {
      return json(res, 422, {
        error: 'AI concept validation detected a prompt mismatch. Please click Generate again.',
        reason: quality.reason,
      });
    }

    stage = 'svg-layer-render';
    const rendered = await mapWithConcurrency(plan.layers, ASSET_CONCURRENCY, (layer, index) =>
      renderLayer(apiKey, prompt, plan, layer, planModel, index)
    );

    const finalLayers = rendered.map((item) => item.layer);
    const renderModels = Array.from(new Set(rendered.map((item) => item.model)));
    const renderModes = Array.from(new Set(rendered.map((item) => item.mode)));

    return json(res, 200, {
      collectionName: plan.collectionName,
      description: plan.description,
      subject: plan.subject,
      styleLabel: plan.styleLabel,
      count: 10000,
      width: 512,
      height: 512,
      layers: finalLayers,
      _pipeline: {
        version: '1.0.1',
        provider: 'Groq',
        architectureModel: planModel,
        architectureMode: planMode,
        renderModels,
        renderModes,
        safetyModel: SAFETY_MODEL,
        qualityModel: PRIMARY_MODEL,
        stages: ['safety', 'collection-plan', 'semantic-qa', '6-layer-svg-render', 'server-validation'],
        structuredOutput: 'staged',
        combinationCount: plan.combinationCount,
        latencyMs: Date.now() - startedAt,
        status: 'ok',
      },
    });
  } catch (error) {
    console.error('[GLITCH NFT STUDIO generation error]', error);
    return json(res, 502, {
      error: 'AI generation could not complete this request. Please try Generate again.',
      stage,
      detail: String(error?.message || 'Unknown server error.').slice(0, 360),
    });
  }
}

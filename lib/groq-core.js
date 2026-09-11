export const PRIMARY_MODEL = process.env.GROQ_MODEL || 'openai/gpt-oss-20b';
export const SAFETY_MODEL = process.env.GROQ_SAFETY_MODEL || 'openai/gpt-oss-safeguard-20b';
export const TIMEOUT_MS = Math.max(10000, Math.min(30000, Number(process.env.GROQ_TIMEOUT_MS || 22000)));

export const ROLE_ORDER = {
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

export const traitPlanSchema = {
  type: 'object',
  properties: {
    name: { type: 'string' },
    weight: { type: 'integer' },
  },
  required: ['name', 'weight'],
  additionalProperties: false,
};

export const collectionPlanSchema = {
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

export const layerRenderSchema = {
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

export const safetySchema = {
  type: 'object',
  properties: {
    violation: { type: 'boolean' },
    category: { type: ['string', 'null'] },
    reason: { type: 'string' },
  },
  required: ['violation', 'category', 'reason'],
  additionalProperties: false,
};

export function sanitizeApiKey(value) {
  return String(value || '').trim().replace(/^Bearer\s+/i, '').replace(/^['"]|['"]$/g, '');
}

export function json(res, status, data, extraHeaders = {}) {
  res.status(status).setHeader('Content-Type', 'application/json');
  res.setHeader('Cache-Control', 'no-store');
  for (const [key, value] of Object.entries(extraHeaders)) {
    if (value !== undefined && value !== null) res.setHeader(key, String(value));
  }
  res.end(JSON.stringify(data));
}

export async function readJsonBody(req) {
  if (req.body && typeof req.body === 'object') return req.body;
  if (typeof req.body === 'string') return JSON.parse(req.body || '{}');
  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  const raw = Buffer.concat(chunks).toString('utf8');
  return raw ? JSON.parse(raw) : {};
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

function parseRetryAfterMs(response) {
  const raw = response.headers.get('retry-after');
  if (raw) {
    const seconds = Number(raw);
    if (Number.isFinite(seconds)) return Math.max(1000, Math.ceil(seconds * 1000));
    const dateMs = Date.parse(raw);
    if (Number.isFinite(dateMs)) return Math.max(1000, dateMs - Date.now());
  }
  return 7000;
}

function compactError(status, raw) {
  try {
    const parsed = JSON.parse(raw);
    const message = String(parsed?.error?.message || parsed?.message || '').trim();
    if (/rate limit/i.test(message)) return 'Groq rate limit reached.';
    if (/failed to generate json/i.test(message)) return 'Structured JSON generation failed.';
    if (/request too large/i.test(message)) return 'Model request was too large.';
    if (message) return message.slice(0, 240);
  } catch {}
  return `Groq request failed with HTTP ${status}.`;
}

async function requestGroq(apiKey, payload, timeoutMs = TIMEOUT_MS) {
  const response = await fetchWithTimeout(
    'https://api.groq.com/openai/v1/chat/completions',
    {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    },
    timeoutMs
  );

  const raw = await response.text();
  if (!response.ok) {
    const error = new Error(compactError(response.status, raw));
    error.status = response.status;
    error.retryAfterMs = response.status === 429 ? parseRetryAfterMs(response) : 0;
    throw error;
  }

  const data = JSON.parse(raw);
  const content = data?.choices?.[0]?.message?.content;
  if (!content) throw new Error('Groq returned an empty response.');
  return content;
}

export async function callStructuredOnce(apiKey, { model = PRIMARY_MODEL, messages, schemaName, schema, maxTokens = 2500, strict = true, temperature = 0.25 }) {
  const content = await requestGroq(apiKey, {
    model,
    messages,
    temperature,
    ...(model.includes('safeguard') ? {} : { reasoning_effort: 'low' }),
    max_completion_tokens: maxTokens,
    response_format: {
      type: 'json_schema',
      json_schema: { name: schemaName, strict, schema },
    },
  });
  return JSON.parse(content);
}

export async function callJsonObjectOnce(apiKey, { model = PRIMARY_MODEL, messages, maxTokens = 2500, temperature = 0.2 }) {
  const content = await requestGroq(apiKey, {
    model,
    messages,
    temperature,
    reasoning_effort: 'low',
    max_completion_tokens: maxTokens,
    response_format: { type: 'json_object' },
  });
  return JSON.parse(content);
}

export function buildSafetyMessages(prompt) {
  return [
    {
      role: 'system',
      content: `You are the safety gate for a public AI art generator. Block only clearly disallowed content: sexual content involving minors, explicit sexual violence, graphic gore for shock, explicit self-harm encouragement, hateful/extremist praise or recruitment, or instructions facilitating serious wrongdoing. Allow ordinary fictional characters, horror/fantasy, memes, animals, robots, monsters, decorative fictional weapons, satire, and normal creative art. Return JSON only.`,
    },
    { role: 'user', content: prompt },
  ];
}

export function buildPlanMessages(prompt, style) {
  const styleInstruction = !style || /^auto/i.test(style)
    ? 'Infer the visual style directly from the user prompt.'
    : `Use "${style}" only as an art-direction hint. Never replace the main subject requested by the user.`;

  return [
    {
      role: 'system',
      content: `You are GLITCH NFT STUDIO's collection architect. The USER PROMPT IS THE SOURCE OF TRUTH. Never substitute a different subject, mascot, animal, skull, robot, or preset.
Return exactly 6 layers with exactly 5 VISIBLE traits per layer. Include one required background and one required base layer. At least 4 layers must be required. The base layer must visibly define the user's main requested subject. Trait names must be specific to the requested concept. Base-layer traits must be genuinely different visible variants of the requested subject (fur/color/material/expression/body variant as appropriate); NEVER use numbered placeholders like 'Doge Punk 1', 'Variant 2', or generic filler names. Every trait must be visually meaningful and directly related to the prompt. IMPORTANT: NEVER use None, No Accessory, No Outfit, Empty, Transparent, or any absence/no-trait value inside the 5 trait names. Absence is represented ONLY by required=false plus noneWeight > 0. Required layers must always contain 5 visible drawable traits. Weights are integers 1-100. The architecture must support at least 10,000 combinations. artDirection must define visual language, palette, and mood. compositionGuide must define one consistent centered composition. Do not output SVG code in this step.`,
    },
    { role: 'user', content: `Create a 10,000-item generative NFT collection plan from:\n${prompt}\n\n${styleInstruction}` },
  ];
}

export function buildLayerRenderMessages(prompt, plan, layer) {
  const traitNames = layer.traits.map((trait) => trait.name);
  const roleInstruction = layer.role === 'background'
    ? 'Every visible SVG must fill the full 128x128 canvas.'
    : layer.role === 'base'
      ? `Every SVG must clearly depict the same main subject: ${plan.subject}. Keep silhouette, scale, and placement consistent across all variants.`
      : 'Use transparent background and draw only this layer contribution, aligned to the same base subject.';

  return [
    {
      role: 'system',
      content: `You render ONE NFT layer as compact, browser-safe SVG assets. Return JSON only. Return the same 5 trait names and one SVG each. SVG viewBox must be '0 0 128 128'. Use single quotes inside SVG attributes. Each SVG must be complete, valid XML and include xmlns='http://www.w3.org/2000/svg'. Keep each SVG compact (target under 1000 characters). Use FLAT VECTOR / PIXEL geometry only: rect, circle, ellipse, line, polyline, polygon, path, g. DO NOT use defs, gradients, filters, masks, clipPath, style blocks, text, image, script, foreignObject, iframe, external URL, CSS import, animation, or event handlers. Use direct hex/rgb fill and stroke values. Keep all visible subject parts centered and aligned to the same 128x128 coordinate system. The main subject should occupy roughly x=18..110 and y=10..120. Optional absence is handled outside the SVG pipeline, so every requested trait here must be visibly drawable. Preserve the user's requested subject exactly. ${roleInstruction}`,
    },
    {
      role: 'user',
      content: `PROMPT: ${prompt}\nSUBJECT: ${plan.subject}\nSTYLE: ${plan.styleLabel}\nART: ${plan.artDirection}\nCOMPOSITION: ${plan.compositionGuide}\nLAYER: ${layer.name}\nROLE: ${layer.role}\nTRAITS:\n${traitNames.map((name, i) => `${i + 1}. ${name}`).join('\n')}`,
    },
  ];
}

export function isNoneTrait(name) {
  const n = String(name || '').trim().toLowerCase();
  return n === 'none' || n.startsWith('no ') || n.includes('empty') || n.includes('transparent');
}

export function transparentSvg() {
  return "<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 128 128'></svg>";
}


function normalizeSvgMarkup(svg) {
  let s = String(svg || '').trim()
    .replace(/^```(?:svg|xml)?\s*/i, '')
    .replace(/\s*```$/i, '')
    .replace(/<\?xml[\s\S]*?\?>/gi, '')
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/[\u201C\u201D]/g, '"')
    .trim();

  const first = s.indexOf('<svg');
  const last = s.lastIndexOf('</svg>');
  if (first >= 0) s = s.slice(first, last >= first ? last + 6 : undefined);
  s = s.replace(/&(?!amp;|lt;|gt;|quot;|apos;|#\d+;|#x[0-9a-fA-F]+;)/g, '&amp;');

  // Remove markup that is unnecessary for our compact NFT renderer.
  s = s
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<defs[\s\S]*?<\/defs>/gi, '')
    .replace(/<(?:filter|mask|clipPath)[\s\S]*?<\/(?:filter|mask|clipPath)>/gi, '')
    .replace(/\s(?:filter|mask|clip-path)\s*=\s*(['"])[\s\S]*?\1/gi, '');

  const leafTags = ['rect', 'circle', 'ellipse', 'line', 'polyline', 'polygon', 'path'];
  for (const tag of leafTags) {
    s = s.replace(new RegExp(`</${tag}\\s*>`, 'gi'), '');
    s = s.replace(new RegExp(`<${tag}\\b([^<>]*)>`, 'gi'), (match, attrs) => {
      if (/\/\s*>$/.test(match)) return match;
      const clean = String(attrs || '').replace(/\/\s*$/, '').trim();
      return `<${tag}${clean ? ` ${clean}` : ''}/>`;
    });
  }

  if (!s.endsWith('</svg>')) s += '</svg>';
  if (!/xmlns\s*=/.test(s)) s = s.replace('<svg', "<svg xmlns='http://www.w3.org/2000/svg'");
  if (!/viewBox\s*=\s*['"][^'"]+['"]/i.test(s)) s = s.replace('<svg', "<svg viewBox='0 0 128 128'");
  return s;
}

function isSvgSafe(svg) {
  const s = String(svg || '').trim();
  if (!s.startsWith('<svg')) return false;
  if (s.length < 30 || s.length > 7000) return false;
  if (/<script\b|<foreignObject\b|<iframe\b|<object\b|<embed\b|<image\b|javascript\s*:/i.test(s)) return false;
  if (/\son[a-z]+\s*=/i.test(s)) return false;
  // Allow the standard SVG namespace URL, but reject every other external http(s) reference.
  const withoutNamespace = s.replace(/xmlns\s*=\s*(['"])http:\/\/www\.w3\.org\/2000\/svg\1/gi, '');
  if (/https?:\/\//i.test(withoutNamespace)) return false;
  return true;
}

function hasVisibleShape(svg) {
  return /<(rect|circle|ellipse|line|polyline|polygon|path)\b/i.test(String(svg || ''));
}

function visibleFallbackTraitName(role, layerName, index) {
  const roleMap = {
    background: 'Classic Background',
    base: 'Classic Base',
    texture: 'Classic Texture',
    outfit: 'Classic Outfit',
    face: 'Classic Face',
    eyes: 'Classic Eyes',
    accessory: 'Classic Accessory',
    headwear: 'Classic Headwear',
    overlay: 'Classic Overlay',
    effect: 'Subtle Effect',
    foreground: 'Classic Foreground',
    other: `Classic ${String(layerName || 'Trait')}`,
  };
  const base = roleMap[role] || `Classic ${String(layerName || 'Trait')}`;
  return index > 0 ? `${base} ${index + 1}` : base;
}

export function normalizePlan(data) {
  const layers = Array.isArray(data?.layers) ? data.layers.slice(0, 6) : [];
  if (layers.length !== 6) throw new Error(`AI returned ${layers.length} layers; expected 6.`);

  let requiredCount = 0;
  const normalizedLayers = layers.map((layer, i) => {
    const traits = Array.isArray(layer?.traits) ? layer.traits.slice(0, 5) : [];
    if (traits.length !== 5) throw new Error(`Layer ${i + 1} returned ${traits.length} traits; expected 5.`);
    const layerName = String(layer?.name || `Layer ${i + 1}`).trim();
    const role = String(layer?.role || 'other').trim();
    const required = Boolean(layer.required);
    if (required) requiredCount += 1;

    let noneWeight = required ? 0 : Math.max(0, Math.min(60, Number(layer?.noneWeight ?? 0)));
    let fallbackCounter = 0;
    const normalizedTraits = traits.map((trait, j) => {
      let name = String(trait?.name || `Trait ${j + 1}`).trim();
      const weight = Math.max(1, Math.min(100, Number(trait?.weight ?? 10)));
      if (isNoneTrait(name)) {
        if (!required) noneWeight = Math.max(noneWeight, Math.min(40, weight));
        name = visibleFallbackTraitName(role, layerName, fallbackCounter++);
      }
      return { name, weight };
    });

    return {
      name: layerName,
      role,
      required,
      noneWeight,
      traits: normalizedTraits,
    };
  });

  if (requiredCount < 4) throw new Error('AI returned fewer than 4 required layers.');
  const roles = normalizedLayers.map((layer) => layer.role);
  if (!roles.includes('background') || !roles.includes('base')) throw new Error('Plan must contain background and base layers.');
  const baseLayer = normalizedLayers.find((layer) => layer.role === 'base');
  if (!baseLayer?.required) throw new Error('Base layer must be required.');

  normalizedLayers.sort((a, b) => (ROLE_ORDER[a.role] ?? 65) - (ROLE_ORDER[b.role] ?? 65));
  const combinationCount = normalizedLayers.reduce((acc, layer) => {
    const variants = layer.traits.length + (!layer.required && layer.noneWeight > 0 ? 1 : 0);
    return acc * variants;
  }, 1);
  if (combinationCount < 10000) throw new Error(`Plan only supports ${combinationCount} combinations.`);

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

export function normalizeRenderedLayer(planLayer, rendered) {
  const rawTraits = Array.isArray(rendered?.traits) ? rendered.traits : [];
  if (rawTraits.length !== planLayer.traits.length) throw new Error(`Layer "${planLayer.name}" returned ${rawTraits.length} assets; expected ${planLayer.traits.length}.`);

  return {
    ...planLayer,
    traits: planLayer.traits.map((plannedTrait, index) => {
      const byName = rawTraits.find((item) => String(item?.name || '').trim().toLowerCase() === plannedTrait.name.toLowerCase());
      const renderedTrait = byName || rawTraits[index];
      const name = plannedTrait.name;
      let svg = normalizeSvgMarkup(String(renderedTrait?.svg || ''));
      if (!planLayer.required && isNoneTrait(name)) svg = transparentSvg();
      if (!isSvgSafe(svg)) throw new Error(`Invalid SVG for ${planLayer.name} / ${name}.`);
      if (!(isNoneTrait(name) && !planLayer.required) && !hasVisibleShape(svg)) throw new Error(`Empty art for ${planLayer.name} / ${name}.`);
      return { name, weight: plannedTrait.weight, svg };
    }),
  };
}

export const TEXT_MODEL = process.env.GEMINI_TEXT_MODEL || 'gemini-3.7-flash';
export const TEXT_FALLBACK_MODELS = String(process.env.GEMINI_TEXT_FALLBACK_MODELS || 'gemini-3.5-flash,gemini-3.5-flash-lite')
  .split(',')
  .map((value) => value.trim())
  .filter(Boolean);
export const TEXT_MODEL_CHAIN = Array.from(new Set([TEXT_MODEL, ...TEXT_FALLBACK_MODELS]));
export const IMAGE_MODEL = process.env.GEMINI_IMAGE_MODEL || 'gemini-3.1-flash-image';
export const TEXT_TIMEOUT_MS = Math.max(12000, Math.min(55000, Number(process.env.GEMINI_TEXT_TIMEOUT_MS || 45000)));

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

export const plannerEnvelopeSchema = {
  type: 'object',
  properties: {
    allowed: { type: 'boolean' },
    blockedCategory: { type: 'string' },
    blockedReason: { type: 'string' },
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
          traits: {
            type: 'array',
            items: traitPlanSchema,
          },
        },
        required: ['name', 'role', 'required', 'noneWeight', 'traits'],
        additionalProperties: false,
      },
    },
  },
  required: [
    'allowed',
    'blockedCategory',
    'blockedReason',
    'collectionName',
    'description',
    'subject',
    'styleLabel',
    'artDirection',
    'compositionGuide',
    'layers',
  ],
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

export async function fetchWithTimeout(url, options, timeoutMs) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } catch (error) {
    if (error?.name === 'AbortError') {
      const timeoutError = new Error(`Gemini request timed out after ${Math.ceil(timeoutMs / 1000)}s.`);
      timeoutError.code = 'TIMEOUT';
      throw timeoutError;
    }
    throw error;
  } finally {
    clearTimeout(timer);
  }
}

function retryDelayStringToMs(value) {
  const raw = String(value || '').trim();
  const match = raw.match(/^([0-9.]+)s$/i);
  if (match) return Math.max(1000, Math.ceil(Number(match[1]) * 1000));
  return 0;
}

export function parseRetryAfterMs(response, rawBody = '') {
  const header = response.headers.get('retry-after');
  if (header) {
    const seconds = Number(header);
    if (Number.isFinite(seconds)) return Math.max(1000, Math.ceil(seconds * 1000));
    const dateMs = Date.parse(header);
    if (Number.isFinite(dateMs)) return Math.max(1000, dateMs - Date.now());
  }

  try {
    const parsed = JSON.parse(rawBody || '{}');
    const details = parsed?.error?.details || [];
    const retryInfo = details.find((item) => String(item?.['@type'] || '').includes('RetryInfo'));
    const parsedMs = retryDelayStringToMs(retryInfo?.retryDelay);
    if (parsedMs) return parsedMs;
  } catch {}

  return 7000;
}

export function compactGeminiError(status, raw) {
  try {
    const parsed = JSON.parse(raw);
    const message = String(parsed?.error?.message || parsed?.message || '').trim();
    if (/quota|resource_exhausted/i.test(message)) return 'Gemini quota is temporarily exhausted.';
    if (/billing|paid tier/i.test(message)) return 'Gemini API billing / paid tier is required for this request.';
    if (/model.*not found|not found.*model/i.test(message)) return 'The configured Gemini model is unavailable for this API key.';
    if (message) return message.slice(0, 420);
  } catch {}
  return `Gemini request failed with HTTP ${status}.`;
}

function extractGeminiText(data) {
  const parts = data?.candidates?.[0]?.content?.parts;
  if (!Array.isArray(parts)) return '';
  return parts.map((part) => String(part?.text || '')).join('\n').trim();
}

function extractInteractionText(data) {
  if (!data || typeof data !== 'object') return '';
  if (typeof data.output_text === 'string' && data.output_text.trim()) return data.output_text.trim();
  if (typeof data.outputText === 'string' && data.outputText.trim()) return data.outputText.trim();

  const steps = Array.isArray(data.steps) ? data.steps : [];
  const chunks = [];
  for (const step of steps) {
    if (step?.type && step.type !== 'model_output') continue;
    const content = Array.isArray(step?.content) ? step.content : [];
    for (const part of content) {
      if (typeof part?.text === 'string' && part.text.trim()) chunks.push(part.text.trim());
      else if (typeof part?.content === 'string' && part.content.trim()) chunks.push(part.content.trim());
    }
  }
  if (chunks.length) return chunks.join('\n').trim();

  // Defensive compatibility: some REST surfaces can return the structured object directly.
  if (Object.prototype.hasOwnProperty.call(data, 'allowed') && Array.isArray(data.layers)) {
    return JSON.stringify(data);
  }
  return '';
}

function geminiHttpError(response, raw) {
  const error = new Error(compactGeminiError(response.status, raw));
  error.status = response.status;
  error.retryAfterMs = (response.status === 429 || response.status === 503 || response.status === 502)
    ? parseRetryAfterMs(response, raw)
    : 0;
  return error;
}

async function callGeminiInteractionsStructured(apiKey, {
  prompt,
  schema,
  model,
  temperature,
  maxOutputTokens,
}) {
  const response = await fetchWithTimeout(
    'https://generativelanguage.googleapis.com/v1beta/interactions',
    {
      method: 'POST',
      headers: {
        'x-goog-api-key': apiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model,
        input: prompt,
        store: false,
        response_format: {
          type: 'text',
          mime_type: 'application/json',
          schema,
        },
        generation_config: {
          temperature,
          max_output_tokens: maxOutputTokens,
          thinking_level: 'low',
        },
      }),
    },
    TEXT_TIMEOUT_MS
  );

  const raw = await response.text();
  if (!response.ok) throw geminiHttpError(response, raw);

  let data;
  try {
    data = JSON.parse(raw);
  } catch {
    throw new Error('Gemini Interactions API returned a non-JSON response.');
  }

  const text = extractInteractionText(data);
  if (!text) {
    const status = String(data?.status || 'completed');
    throw new Error(`Gemini returned no structured text (interaction status: ${status}).`);
  }
  try {
    return JSON.parse(text);
  } catch {
    throw new Error('Gemini returned malformed structured JSON. Please retry generation.');
  }
}

async function callGeminiGenerateContentStructuredFallback(apiKey, {
  prompt,
  schema,
  model,
  temperature,
  maxOutputTokens,
}) {
  const response = await fetchWithTimeout(
    `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`,
    {
      method: 'POST',
      headers: {
        'x-goog-api-key': apiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        generationConfig: {
          temperature,
          maxOutputTokens,
          responseFormat: {
            text: {
              // The GenerateContent REST surface expects the enum constant here,
              // not the human-readable MIME string.
              mimeType: 'APPLICATION_JSON',
              schema,
            },
          },
        },
      }),
    },
    TEXT_TIMEOUT_MS
  );

  const raw = await response.text();
  if (!response.ok) throw geminiHttpError(response, raw);

  const data = JSON.parse(raw);
  const text = extractGeminiText(data);
  if (!text) {
    const finishReason = data?.candidates?.[0]?.finishReason || 'UNKNOWN';
    throw new Error(`Gemini returned no structured text (finish reason: ${finishReason}).`);
  }
  try {
    return JSON.parse(text);
  } catch {
    throw new Error('Gemini returned malformed structured JSON. Please retry generation.');
  }
}

export async function callGeminiStructured(apiKey, {
  prompt,
  schema,
  model = TEXT_MODEL,
  temperature = 0.25,
  maxOutputTokens = 3200,
}) {
  try {
    // Gemini 3.8's current recommended text/structured-output surface.
    return await callGeminiInteractionsStructured(apiKey, {
      prompt,
      schema,
      model,
      temperature,
      maxOutputTokens,
    });
  } catch (error) {
    const status = Number(error?.status || 0);
    // Preserve retryable/quota errors so the frontend can wait and retry rather than
    // doubling requests against another endpoint.
    if (status === 429 || status === 502 || status === 503) throw error;

    // Compatibility fallback for projects/regions still serving GenerateContent.
    return await callGeminiGenerateContentStructuredFallback(apiKey, {
      prompt,
      schema,
      model,
      temperature,
      maxOutputTokens,
    });
  }
}


function sleepServer(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function isRetryableGeminiError(error) {
  const status = Number(error?.status || 0);
  return status === 429 || status === 502 || status === 503 || error?.code === 'TIMEOUT';
}

export async function callGeminiStructuredResilient(apiKey, {
  prompt,
  schema,
  models = TEXT_MODEL_CHAIN,
  temperature = 0.25,
  maxOutputTokens = 3200,
}) {
  const attempts = [];
  let lastError = null;

  for (let index = 0; index < models.length; index += 1) {
    const model = models[index];
    try {
      const result = await callGeminiStructured(apiKey, {
        prompt,
        schema,
        model,
        temperature,
        maxOutputTokens,
      });
      return { result, model, attempts };
    } catch (error) {
      lastError = error;
      attempts.push({
        model,
        status: Number(error?.status || 0) || null,
        code: error?.code || null,
        message: String(error?.message || 'Unknown Gemini error').slice(0, 180),
      });

      if (!isRetryableGeminiError(error)) throw error;
      if (index < models.length - 1) {
        const retryAfterMs = Math.max(0, Number(error?.retryAfterMs || 0));
        const backoffMs = Math.min(5000, Math.max(900, retryAfterMs, 900 * (2 ** index)) + Math.floor(Math.random() * 650));
        await sleepServer(backoffMs);
      }
    }
  }

  if (lastError) {
    lastError.modelsTried = attempts;
    throw lastError;
  }
  throw new Error('No Gemini planner models were configured.');
}

export function buildPlannerPrompt(prompt, style) {
  const styleInstruction = !style || /^auto/i.test(style)
    ? 'Infer the visual style directly from the user prompt.'
    : `Use "${style}" only as an art-direction hint. Never replace the main subject requested by the user.`;

  return `You are GLITCH NFT STUDIO's Gemini-only safety gate and collection architect.

USER PROMPT IS THE SOURCE OF TRUTH:
${prompt}

STYLE RULE:
${styleInstruction}

SAFETY DECISION:
- Set allowed=false only for clearly disallowed content such as sexual content involving minors, explicit sexual violence, graphic gore created primarily for shock, explicit encouragement of self-harm, hateful/extremist praise or recruitment, or content that materially facilitates serious wrongdoing.
- Ordinary fictional characters, horror/fantasy, memes, animals, robots, monsters, non-graphic fictional weapons, satire, dark themes, and normal creative art are allowed.
- If blocked: set allowed=false, explain blockedCategory and blockedReason briefly, and return layers=[] with harmless empty strings for the collection fields.
- If allowed: set allowed=true, blockedCategory="", blockedReason="", and build the collection plan below.

COLLECTION ARCHITECTURE RULES WHEN ALLOWED:
1. Never substitute a different subject, mascot, animal, skull, robot, character type, or preset. Preserve exactly what the user asked for.
2. Return exactly 6 layers with exactly 4 VISIBLE traits per layer.
3. Include exactly one role="background" and exactly one role="base". These two are required=true with noneWeight=0.
4. The remaining four layers are optional: required=false with noneWeight between 10 and 30.
5. The base layer must visibly define the requested main subject. Base traits must be meaningfully different visible variants of that subject, not numbered placeholders.
6. Never use trait names like None, No Accessory, No Outfit, Empty, Transparent, Variant 1, Trait 2, or other filler names. Absence exists only through noneWeight.
7. Trait names must be concrete visual instructions that an image model can actually render.
8. Use integer weights 1-100. Keep weights sensible for rarity.
9. The six-layer architecture must support at least 10,000 possible combinations.
10. artDirection must describe palette, visual medium, shape language, texture, lighting, and mood.
11. compositionGuide must define one consistent centered square composition so all image edits stay aligned.
12. The image pipeline will later create a canonical master reference and edit it. Plan traits that can be layered cleanly and consistently.
13. No SVG or code in this response; this step is planning only.

Return only the structured response required by the schema.`;
}

export function isNoneTrait(name) {
  const n = String(name || '').trim().toLowerCase();
  return n === 'none' || n.startsWith('no ') || n.includes('empty') || n.includes('transparent');
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
  if (data?.allowed === false) {
    const error = new Error(String(data?.blockedReason || 'This prompt cannot be generated.'));
    error.blocked = true;
    error.category = String(data?.blockedCategory || 'policy');
    throw error;
  }

  const layers = Array.isArray(data?.layers) ? data.layers.slice(0, 6) : [];
  if (layers.length !== 6) throw new Error(`Gemini returned ${layers.length} layers; expected 6.`);

  const normalizedLayers = layers.map((layer, i) => {
    const traits = Array.isArray(layer?.traits) ? layer.traits.slice(0, 4) : [];
    if (traits.length !== 4) throw new Error(`Layer ${i + 1} returned ${traits.length} traits; expected 4.`);

    const layerName = String(layer?.name || `Layer ${i + 1}`).trim();
    const role = String(layer?.role || 'other').trim();
    const isCore = role === 'background' || role === 'base';
    const required = isCore;
    let noneWeight = required ? 0 : Math.max(10, Math.min(30, Number(layer?.noneWeight ?? 20)));
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

    return { name: layerName, role, required, noneWeight, traits: normalizedTraits };
  });

  const backgroundLayers = normalizedLayers.filter((layer) => layer.role === 'background');
  const baseLayers = normalizedLayers.filter((layer) => layer.role === 'base');
  if (backgroundLayers.length !== 1 || baseLayers.length !== 1) {
    throw new Error('Gemini plan must contain exactly one background layer and one base layer.');
  }

  normalizedLayers.sort((a, b) => (ROLE_ORDER[a.role] ?? 65) - (ROLE_ORDER[b.role] ?? 65));

  const combinationCount = normalizedLayers.reduce((acc, layer) => {
    const variants = layer.traits.length + (!layer.required && layer.noneWeight > 0 ? 1 : 0);
    return acc * variants;
  }, 1);
  if (combinationCount < 10000) throw new Error(`Gemini plan only supports ${combinationCount} combinations.`);

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

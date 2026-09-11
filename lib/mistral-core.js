export const TEXT_MODEL = process.env.MISTRAL_TEXT_MODEL || 'mistral-large-latest';
export const TEXT_FALLBACK_MODELS = String(process.env.MISTRAL_TEXT_FALLBACK_MODELS || 'mistral-medium-latest,mistral-small-latest')
  .split(',')
  .map((value) => value.trim())
  .filter(Boolean);
export const TEXT_MODEL_CHAIN = Array.from(new Set([TEXT_MODEL, ...TEXT_FALLBACK_MODELS]));
export const IMAGE_MODEL = process.env.MISTRAL_IMAGE_MODEL || 'mistral-medium-latest';
export const TEXT_TIMEOUT_MS = Math.max(12000, Math.min(55000, Number(process.env.MISTRAL_TEXT_TIMEOUT_MS || 45000)));
export const IMAGE_TIMEOUT_MS = Math.max(20000, Math.min(55000, Number(process.env.MISTRAL_IMAGE_TIMEOUT_MS || 52000)));

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
      const timeoutError = new Error(`Mistral request timed out after ${Math.ceil(timeoutMs / 1000)}s.`);
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
    const retry = parsed?.retry_after || parsed?.retryAfter || parsed?.error?.retry_after;
    if (Number.isFinite(Number(retry))) return Math.max(1000, Number(retry) * 1000);
    const parsedMs = retryDelayStringToMs(parsed?.retry_delay || parsed?.error?.retry_delay);
    if (parsedMs) return parsedMs;
  } catch {}

  return 7000;
}

export function compactMistralError(status, raw) {
  try {
    const parsed = JSON.parse(raw);
    const message = String(parsed?.message || parsed?.error?.message || parsed?.detail || '').trim();
    if (/quota|rate.?limit|too many requests/i.test(message)) return 'Mistral rate limit is temporarily exhausted.';
    if (/billing|payment|credit/i.test(message)) return 'Mistral billing or credits are required for this request.';
    if (/model.*not found|not found.*model/i.test(message)) return 'The configured Mistral model is unavailable for this API key.';
    if (/image_generation|image generation/i.test(message) && /not|unavailable|forbidden|permission/i.test(message)) {
      return 'Mistral image generation is not enabled for this workspace/API key.';
    }
    if (message) return message.slice(0, 420);
  } catch {}
  return `Mistral request failed with HTTP ${status}.`;
}

function mistralHttpError(response, raw) {
  const error = new Error(compactMistralError(response.status, raw));
  error.status = response.status;
  error.retryAfterMs = (response.status === 429 || response.status === 502 || response.status === 503)
    ? parseRetryAfterMs(response, raw)
    : 0;
  return error;
}

function extractChatContent(data) {
  const content = data?.choices?.[0]?.message?.content;
  if (typeof content === 'string') return content.trim();
  if (Array.isArray(content)) {
    return content.map((part) => String(part?.text || part?.content || '')).join('\n').trim();
  }
  if (content && typeof content === 'object') return JSON.stringify(content);
  return '';
}

export async function callMistralStructured(apiKey, {
  prompt,
  schema,
  model = TEXT_MODEL,
  temperature = 0.22,
  maxOutputTokens = 3200,
}) {
  const response = await fetchWithTimeout(
    'https://api.mistral.ai/v1/chat/completions',
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model,
        messages: [
          {
            role: 'system',
            content: 'You are the planning and safety brain for GLITCH NFT STUDIO. Return only the structured JSON requested by the response schema.',
          },
          { role: 'user', content: prompt },
        ],
        response_format: {
          type: 'json_schema',
          json_schema: {
            name: 'glitch_collection_plan',
            schema,
            strict: true,
          },
        },
        temperature,
        max_tokens: maxOutputTokens,
        safe_prompt: true,
      }),
    },
    TEXT_TIMEOUT_MS
  );

  const raw = await response.text();
  if (!response.ok) throw mistralHttpError(response, raw);

  let data;
  try {
    data = JSON.parse(raw);
  } catch {
    throw new Error('Mistral planner returned a non-JSON API response.');
  }

  const text = extractChatContent(data);
  if (!text) throw new Error('Mistral planner returned empty structured output.');
  try {
    return JSON.parse(text);
  } catch {
    throw new Error('Mistral planner returned malformed structured JSON. Please retry generation.');
  }
}

function sleepServer(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function isRetryableMistralError(error) {
  const status = Number(error?.status || 0);
  return status === 429 || status === 502 || status === 503 || error?.code === 'TIMEOUT';
}

export async function callMistralStructuredResilient(apiKey, {
  prompt,
  schema,
  models = TEXT_MODEL_CHAIN,
  temperature = 0.22,
  maxOutputTokens = 3200,
}) {
  const attempts = [];
  let lastError = null;

  for (let index = 0; index < models.length; index += 1) {
    const model = models[index];
    try {
      const result = await callMistralStructured(apiKey, { prompt, schema, model, temperature, maxOutputTokens });
      return { result, model, attempts };
    } catch (error) {
      lastError = error;
      attempts.push({
        model,
        status: Number(error?.status || 0) || null,
        code: error?.code || null,
        message: String(error?.message || 'Unknown Mistral error').slice(0, 180),
      });
      if (!isRetryableMistralError(error)) throw error;
      if (index < models.length - 1) {
        const retryAfterMs = Math.max(0, Number(error?.retryAfterMs || 0));
        const backoffMs = Math.min(5000, Math.max(800, retryAfterMs, 850 * (2 ** index)) + Math.floor(Math.random() * 550));
        await sleepServer(backoffMs);
      }
    }
  }

  if (lastError) {
    lastError.modelsTried = attempts;
    throw lastError;
  }
  throw new Error('No Mistral planner models were configured.');
}

export function buildPlannerPrompt(prompt, style) {
  const styleInstruction = !style || /^auto/i.test(style)
    ? 'Infer the visual style directly from the user prompt.'
    : `Use "${style}" only as an art-direction hint. Never replace the main subject requested by the user.`;

  return `USER PROMPT IS THE SOURCE OF TRUTH:\n${prompt}\n\nSTYLE RULE:\n${styleInstruction}\n\nSAFETY DECISION:\n- Set allowed=false only for clearly disallowed content such as sexual content involving minors, explicit sexual violence, graphic gore created primarily for shock, explicit encouragement of self-harm, hateful/extremist praise or recruitment, or content that materially facilitates serious wrongdoing.\n- Ordinary fictional characters, horror/fantasy, memes, animals, robots, monsters, non-graphic fictional weapons, satire, dark themes, and normal creative art are allowed.\n- If blocked: set allowed=false, explain blockedCategory and blockedReason briefly, and return layers=[] with harmless empty strings for collection fields.\n- If allowed: set allowed=true, blockedCategory="", blockedReason="", and build the plan below.\n\nCOLLECTION ARCHITECTURE RULES WHEN ALLOWED:\n1. Never substitute a different subject, mascot, animal, skull, robot, character type, or preset. Preserve exactly what the user asked for.\n2. Return exactly 6 layers with exactly 4 VISIBLE traits per layer.\n3. Include exactly one role="background" and exactly one role="base". These two are required=true with noneWeight=0.\n4. The remaining four layers are optional: required=false with noneWeight between 10 and 30.\n5. The base layer must visibly define the requested main subject. Base traits must be meaningfully different visible variants, not numbered placeholders.\n6. Never use trait names like None, No Accessory, No Outfit, Empty, Transparent, Variant 1, Trait 2, or filler names. Absence exists only through noneWeight.\n7. Trait names must be concrete visual instructions that an image model can render.\n8. Use integer weights 1-100 and sensible rarity.\n9. The architecture must support at least 10,000 combinations.\n10. artDirection must describe palette, visual medium, shape language, texture, lighting, and mood.\n11. compositionGuide must define one consistent centered square composition so image edits stay aligned.\n12. Plan traits that can be edited onto one canonical master reference.\n13. No SVG or code in this response; planning only.`;
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
  if (layers.length !== 6) throw new Error(`Mistral returned ${layers.length} layers; expected 6.`);

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
    throw new Error('Mistral plan must contain exactly one background layer and one base layer.');
  }

  normalizedLayers.sort((a, b) => (ROLE_ORDER[a.role] ?? 65) - (ROLE_ORDER[b.role] ?? 65));

  const combinationCount = normalizedLayers.reduce((acc, layer) => {
    const variants = layer.traits.length + (!layer.required && layer.noneWeight > 0 ? 1 : 0);
    return acc * variants;
  }, 1);
  if (combinationCount < 10000) throw new Error(`Mistral plan only supports ${combinationCount} combinations.`);

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

function walkForToolFile(value, found = []) {
  if (!value || typeof value !== 'object') return found;
  if ((value.type === 'tool_file' || value.type === 'tool.file') && (value.file_id || value.fileId)) {
    found.push({
      fileId: value.file_id || value.fileId,
      fileName: value.file_name || value.fileName || 'generated.png',
      fileType: value.file_type || value.fileType || 'png',
    });
  }
  if (Array.isArray(value)) {
    for (const item of value) walkForToolFile(item, found);
  } else {
    for (const item of Object.values(value)) walkForToolFile(item, found);
  }
  return found;
}

function findMessageOutputEntryId(outputs) {
  if (!Array.isArray(outputs)) return '';
  for (let i = outputs.length - 1; i >= 0; i -= 1) {
    const item = outputs[i];
    const hasToolFile = walkForToolFile(item, []).length > 0;
    if (hasToolFile && item?.id) return String(item.id);
  }
  for (let i = outputs.length - 1; i >= 0; i -= 1) {
    const item = outputs[i];
    if ((item?.type === 'message.output' || item?.object === 'entry') && item?.id) return String(item.id);
  }
  return '';
}

async function downloadMistralFile(apiKey, fileId) {
  const response = await fetchWithTimeout(
    `https://api.mistral.ai/v1/files/${encodeURIComponent(fileId)}/content`,
    { headers: { Authorization: `Bearer ${apiKey}` } },
    IMAGE_TIMEOUT_MS
  );
  const rawBuffer = Buffer.from(await response.arrayBuffer());
  if (!response.ok) {
    const raw = rawBuffer.toString('utf8');
    throw mistralHttpError(response, raw);
  }

  const contentType = String(response.headers.get('content-type') || '').toLowerCase();
  if (contentType.startsWith('image/')) {
    return { buffer: rawBuffer, mimeType: contentType.split(';')[0] || 'image/png' };
  }

  // Defensive handling for gateways that serialize file bytes as a JSON/base64 string.
  const text = rawBuffer.toString('utf8').trim();
  try {
    const parsed = JSON.parse(text);
    const candidate = typeof parsed === 'string' ? parsed : parsed?.data || parsed?.content || parsed?.base64;
    if (typeof candidate === 'string' && candidate.length > 100) {
      return { buffer: Buffer.from(candidate, 'base64'), mimeType: 'image/png' };
    }
  } catch {}

  // If no content-type is exposed, generated image files are PNG in Mistral's image tool examples.
  return { buffer: rawBuffer, mimeType: 'image/png' };
}

async function parseConversationImageResponse(apiKey, response) {
  const raw = await response.text();
  if (!response.ok) throw mistralHttpError(response, raw);

  let data;
  try {
    data = JSON.parse(raw);
  } catch {
    throw new Error('Mistral image conversation returned a non-JSON response.');
  }

  const toolFiles = walkForToolFile(data, []);
  const file = toolFiles[toolFiles.length - 1];
  if (!file?.fileId) {
    const textPreview = JSON.stringify(data).slice(0, 280);
    throw new Error(`Mistral image tool returned no generated file. ${textPreview}`);
  }

  const downloaded = await downloadMistralFile(apiKey, file.fileId);
  const conversationId = String(data?.conversation_id || data?.conversationId || '');
  const entryId = findMessageOutputEntryId(data?.outputs);
  return {
    image: `data:${downloaded.mimeType};base64,${downloaded.buffer.toString('base64')}`,
    mimeType: downloaded.mimeType,
    fileId: file.fileId,
    conversationId,
    entryId,
  };
}

export async function startMistralImageConversation(apiKey, prompt) {
  const response = await fetchWithTimeout(
    'https://api.mistral.ai/v1/conversations',
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: IMAGE_MODEL,
        inputs: prompt,
        instructions: 'You are GLITCH NFT STUDIO image artist. When the user requests artwork, always use the image_generation tool. Follow the requested subject and visual constraints exactly.',
        tools: [{ type: 'image_generation' }],
        store: true,
        completion_args: {
          temperature: 0.3,
          top_p: 0.95,
        },
      }),
    },
    IMAGE_TIMEOUT_MS
  );
  return parseConversationImageResponse(apiKey, response);
}

export async function restartMistralImageFromReference(apiKey, {
  conversationId,
  entryId,
  prompt,
}) {
  if (!conversationId || !entryId) throw new Error('Missing Mistral master conversation reference.');
  const response = await fetchWithTimeout(
    `https://api.mistral.ai/v1/conversations/${encodeURIComponent(conversationId)}/restart`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from_entry_id: entryId,
        inputs: prompt,
        store: true,
        handoff_execution: 'server',
      }),
    },
    IMAGE_TIMEOUT_MS
  );
  return parseConversationImageResponse(apiKey, response);
}

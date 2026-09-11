export const config = { maxDuration: 60 };

import { sanitizeApiKey, json, readJsonBody } from '../lib/groq-core.js';

const MODEL = process.env.GEMINI_IMAGE_MODEL || 'gemini-3.1-flash-image';
const TIMEOUT_MS = Math.max(15000, Math.min(55000, Number(process.env.GEMINI_IMAGE_TIMEOUT_MS || 50000)));
const CHROMA = '#00FF00';

function parseRetryAfterMs(response) {
  const raw = response.headers.get('retry-after');
  if (raw) {
    const seconds = Number(raw);
    if (Number.isFinite(seconds)) return Math.max(1000, Math.ceil(seconds * 1000));
    const dateMs = Date.parse(raw);
    if (Number.isFinite(dateMs)) return Math.max(1000, dateMs - Date.now());
  }
  return 8000;
}

function compactError(status, raw) {
  try {
    const parsed = JSON.parse(raw);
    const message = String(parsed?.error?.message || parsed?.message || '').trim();
    if (/quota|billing|paid tier|resource_exhausted/i.test(message)) {
      return 'Gemini Image has no available image-generation quota. Enable Gemini API billing / paid tier for this project, then retry.';
    }
    if (message) return message.slice(0, 360);
  } catch {}
  return `Gemini Image request failed with HTTP ${status}.`;
}

async function fetchWithTimeout(url, options, timeoutMs) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

function parseDataUrl(value) {
  const text = String(value || '');
  const match = text.match(/^data:([^;,]+);base64,(.+)$/s);
  if (!match) return null;
  return { mimeType: match[1], data: match[2] };
}

function summarizePlan(plan) {
  if (!plan) return '';
  const layers = Array.isArray(plan.layers)
    ? plan.layers.map((layer) => `${layer.name} (${layer.role}): ${layer.traits?.map((t) => t.name).join(', ')}`).join('\n')
    : '';
  return [
    `Collection: ${plan.collectionName || ''}`,
    `Subject: ${plan.subject || ''}`,
    `Style: ${plan.styleLabel || ''}`,
    `Art direction: ${plan.artDirection || ''}`,
    `Composition: ${plan.compositionGuide || ''}`,
    `Layers:\n${layers}`,
  ].join('\n');
}

function buildImagePrompt({ task, prompt, plan, layer, trait }) {
  const core = `USER CONCEPT: ${prompt}\n\n${summarizePlan(plan)}\n\n`;
  const globalRules = `\n\nGLOBAL RULES:\n- Follow the user concept exactly. Never replace the requested subject with another mascot, skull, robot, animal, or preset.\n- Square 1:1 composition.\n- No text, logos, captions, borders, signatures, or watermarks.\n- Keep the same visual language described by the plan.\n- This is production artwork for a layered generative NFT collection.`;

  if (task === 'master') {
    return `${core}Create the CANONICAL MASTER CHARACTER/OBJECT reference for this collection.\nUse base trait: ${trait?.name || 'canonical base'}.\nShow one clear centered subject matching "${plan?.subject || prompt}". Use the exact consistent pose, scale, camera angle, proportions, and framing that every future trait edit must preserve. Use a neutral safe base appearance and neutral base attire only if anatomy requires clothing. Do NOT add distinctive headwear, accessories, special effects, foreground props, or environmental scenery.\nBACKGROUND REQUIREMENT: the entire background must be a perfectly flat uniform chroma green ${CHROMA}. No gradients, shadows, floor, horizon, texture, or objects in the green background. Do not use this exact chroma green anywhere inside the subject.${globalRules}`;
  }

  if (task === 'background') {
    return `${core}Generate ONLY the full-canvas BACKGROUND trait named "${trait?.name}" for the collection. No main subject, no character silhouette, no foreground character, no text. Make it visually rich but clean enough for the main subject to remain readable.${globalRules}`;
  }

  if (task === 'base-variant') {
    return `${core}EDIT THE PROVIDED MASTER REFERENCE. Preserve the pose, scale, camera, silhouette, composition, lighting direction, and art style as closely as possible. Change ONLY the intrinsic BASE appearance so it clearly becomes the trait "${trait?.name}". Do not add headwear, accessories, special effects, or scenery.\nBACKGROUND REQUIREMENT: preserve a perfectly flat uniform chroma green ${CHROMA} across the entire background. Do not use this exact chroma green inside the subject.${globalRules}`;
  }

  return `${core}EDIT THE PROVIDED MASTER REFERENCE. Preserve the subject, pose, scale, camera, proportions, composition, base colors, and art style as closely as possible. Change or add ONLY this one generative trait:\nLAYER: ${layer?.name || ''}\nROLE: ${layer?.role || ''}\nTRAIT: ${trait?.name || ''}\nDo not modify unrelated parts of the subject. Do not add scenery or text.\nBACKGROUND REQUIREMENT: preserve a perfectly flat uniform chroma green ${CHROMA} across the entire background. Do not use this exact chroma green inside the requested trait.${globalRules}`;
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return json(res, 405, { error: 'Method not allowed.' });

  const apiKey = sanitizeApiKey(process.env.GEMINI_API_KEY);
  if (!apiKey) return json(res, 500, { error: 'Missing GEMINI_API_KEY in Vercel Environment Variables.' });

  try {
    const body = await readJsonBody(req);
    const task = String(body.task || '').trim();
    const prompt = String(body.prompt || '').trim();
    const plan = body.plan;
    const layer = body.layer || null;
    const trait = body.trait || null;
    const reference = body.reference ? parseDataUrl(body.reference) : null;

    if (!prompt || !plan || !task) return json(res, 400, { error: 'task, prompt, and plan are required.' });
    if (task !== 'master' && task !== 'background' && !reference) {
      return json(res, 400, { error: `A reference image is required for ${task}.` });
    }

    const parts = [{ text: buildImagePrompt({ task, prompt, plan, layer, trait }) }];
    if (reference) {
      parts.push({ inlineData: { mimeType: reference.mimeType, data: reference.data } });
    }

    const response = await fetchWithTimeout(
      `https://generativelanguage.googleapis.com/v1/models/${encodeURIComponent(MODEL)}:generateContent`,
      {
        method: 'POST',
        headers: {
          'x-goog-api-key': apiKey,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{ role: 'user', parts }],
          generationConfig: {
            responseModalities: ['IMAGE'],
            responseFormat: {
              image: {
                aspectRatio: '1:1',
                imageSize: '512',
              },
            },
          },
        }),
      },
      TIMEOUT_MS
    );

    const raw = await response.text();
    if (!response.ok) {
      const retryable = response.status === 429 || response.status === 503 || response.status === 502;
      const retryAfterMs = retryable ? parseRetryAfterMs(response) : 0;
      return json(res, response.status, {
        error: compactError(response.status, raw),
        retryAfterMs,
        provider: 'Google Gemini Image',
      }, retryable ? { 'Retry-After': Math.ceil(retryAfterMs / 1000) } : {});
    }

    const data = JSON.parse(raw);
    const responseParts = data?.candidates?.[0]?.content?.parts || [];
    const imagePart = responseParts.find((part) => part?.inlineData?.data);
    if (!imagePart?.inlineData?.data) {
      const finishReason = data?.candidates?.[0]?.finishReason || 'UNKNOWN';
      return json(res, 422, {
        error: `Gemini Image returned no image (finish reason: ${finishReason}). Try a different concept or trait.`,
      });
    }

    const mimeType = imagePart.inlineData.mimeType || 'image/png';
    return json(res, 200, {
      image: `data:${mimeType};base64,${imagePart.inlineData.data}`,
      mimeType,
      model: MODEL,
      task,
      chroma: CHROMA,
    });
  } catch (error) {
    const message = error?.name === 'AbortError'
      ? 'Gemini Image request timed out.'
      : String(error?.message || 'Unknown image-generation error.');
    console.error('[GLITCH Gemini image error]', error);
    return json(res, 502, { error: message.slice(0, 360) });
  }
}

export const config = { maxDuration: 60 };

import { IMAGE_MODEL, sanitizeApiKey, json, readJsonBody, fetchWithTimeout, parseRetryAfterMs, compactGeminiError } from '../lib/gemini-core.js';

const MODEL = IMAGE_MODEL;
const TIMEOUT_MS = Math.max(15000, Math.min(55000, Number(process.env.GEMINI_IMAGE_TIMEOUT_MS || 50000)));
const CHROMA = '#00FF00';

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
          // Gemini 3.1 Flash Image defaults to a square image for text-only
          // generation and follows the square reference for edit requests. We omit
          // responseFormat here because some current REST deployments reject the
          // human-readable aspectRatio/imageSize values even though the SDK/docs
          // expose them. The browser pipeline normalizes every asset to 512x512.
          generationConfig: {
            responseModalities: ['IMAGE'],
          },
        }),
      },
      TIMEOUT_MS
    );

    const raw = await response.text();
    if (!response.ok) {
      const retryable = response.status === 429 || response.status === 503 || response.status === 502;
      const retryAfterMs = retryable ? parseRetryAfterMs(response, raw) : 0;
      return json(res, response.status, {
        error: compactGeminiError(response.status, raw),
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

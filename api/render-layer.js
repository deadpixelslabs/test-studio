export const config = { maxDuration: 60 };

import {
  PRIMARY_MODEL,
  layerRenderSchema,
  sanitizeApiKey,
  json,
  readJsonBody,
  callStructuredOnce,
  callJsonObjectOnce,
  buildLayerRenderMessages,
  normalizeRenderedLayer,
} from '../lib/groq-core.js';

function retryResponse(res, error) {
  const retryAfterMs = Math.max(1000, Number(error?.retryAfterMs || 8000));
  const retryAfterSeconds = Math.ceil(retryAfterMs / 1000);
  return json(res, 429, {
    error: 'Groq is temporarily rate-limited for artwork rendering.',
    retryAfterMs,
  }, { 'Retry-After': retryAfterSeconds });
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return json(res, 405, { error: 'Method not allowed.' });
  const apiKey = sanitizeApiKey(process.env.GROQ_API_KEY);
  if (!apiKey) return json(res, 500, { error: 'Missing GROQ_API_KEY.' });

  try {
    const body = await readJsonBody(req);
    const prompt = String(body.prompt || '').trim();
    const plan = body.plan;
    const layer = body.layer;
    const index = Math.max(0, Number(body.index || 0));
    if (!prompt || !plan || !layer) return json(res, 400, { error: 'prompt, plan, and layer are required.' });

    const messages = buildLayerRenderMessages(prompt, plan, layer);
    let raw;
    let mode = 'strict';
    try {
      raw = await callStructuredOnce(apiKey, {
        model: PRIMARY_MODEL,
        messages,
        schemaName: `glitch_layer_${index + 1}`,
        schema: layerRenderSchema,
        maxTokens: 2100,
        strict: true,
        temperature: 0.25,
      });
    } catch (error) {
      if (error?.status === 429) return retryResponse(res, error);
      mode = 'json-object';
      raw = await callJsonObjectOnce(apiKey, {
        model: PRIMARY_MODEL,
        messages: [
          ...messages,
          { role: 'system', content: 'Return one compact JSON object only with layerName and traits[{name,svg}].' },
        ],
        maxTokens: 2100,
        temperature: 0.2,
      });
    }

    const renderedLayer = normalizeRenderedLayer(layer, raw);
    return json(res, 200, {
      layer: renderedLayer,
      _pipeline: { version: '1.0.2', model: PRIMARY_MODEL, mode },
    });
  } catch (error) {
    if (error?.status === 429) return retryResponse(res, error);
    console.error('[GLITCH layer render error]', error);
    return json(res, 502, {
      error: 'Could not render this layer.',
      detail: String(error?.message || 'Unknown error.').slice(0, 260),
    });
  }
}

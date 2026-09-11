export const config = { maxDuration: 60 };

import {
  PRIMARY_MODEL,
  SAFETY_MODEL,
  collectionPlanSchema,
  safetySchema,
  sanitizeApiKey,
  json,
  readJsonBody,
  callStructuredOnce,
  callJsonObjectOnce,
  buildSafetyMessages,
  buildPlanMessages,
  normalizePlan,
} from '../lib/groq-core.js';

const MAX_PROMPT_CHARS = 1600;

function retryResponse(res, error, stage) {
  const retryAfterMs = Math.max(1000, Number(error?.retryAfterMs || 7000));
  const retryAfterSeconds = Math.ceil(retryAfterMs / 1000);
  return json(res, 429, {
    error: 'AI service is temporarily rate-limited. Retrying automatically is safe.',
    stage,
    retryAfterMs,
  }, { 'Retry-After': retryAfterSeconds });
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return json(res, 405, { error: 'Method not allowed.' });
  const apiKey = sanitizeApiKey(process.env.GROQ_API_KEY);
  if (!apiKey) return json(res, 500, { error: 'Missing GROQ_API_KEY in Vercel Environment Variables.' });

  let stage = 'request';
  try {
    const body = await readJsonBody(req);
    const prompt = String(body.prompt || '').trim();
    const style = String(body.style || '').trim();
    if (!prompt) return json(res, 400, { error: 'Prompt is required.' });
    if (prompt.length > MAX_PROMPT_CHARS) return json(res, 400, { error: `Prompt is too long. Maximum ${MAX_PROMPT_CHARS} characters.` });

    stage = 'safety';
    let safety;
    try {
      safety = await callStructuredOnce(apiKey, {
        model: SAFETY_MODEL,
        messages: buildSafetyMessages(prompt),
        schemaName: 'art_safety',
        schema: safetySchema,
        maxTokens: 350,
        strict: false,
        temperature: 0,
      });
    } catch (error) {
      if (error?.status === 429) return retryResponse(res, error, stage);
      throw error;
    }

    if (safety?.violation) {
      return json(res, 400, {
        error: 'This prompt cannot be generated. Please change the concept and try again.',
        blocked: true,
        category: safety?.category ?? null,
      });
    }

    stage = 'collection-plan';
    const messages = buildPlanMessages(prompt, style);
    let rawPlan;
    let mode = 'strict';
    try {
      rawPlan = await callStructuredOnce(apiKey, {
        model: PRIMARY_MODEL,
        messages,
        schemaName: 'glitch_collection_plan',
        schema: collectionPlanSchema,
        maxTokens: 2600,
        strict: true,
        temperature: 0.3,
      });
    } catch (error) {
      if (error?.status === 429) return retryResponse(res, error, stage);
      mode = 'json-object';
      rawPlan = await callJsonObjectOnce(apiKey, {
        model: PRIMARY_MODEL,
        messages: [
          ...messages,
          { role: 'system', content: 'Return a JSON object only, matching the requested collection-plan fields exactly.' },
        ],
        maxTokens: 2600,
        temperature: 0.2,
      });
    }

    const plan = normalizePlan(rawPlan);
    return json(res, 200, {
      plan,
      _pipeline: { version: '1.0.4', provider: 'Groq', model: PRIMARY_MODEL, planMode: mode },
    });
  } catch (error) {
    if (error?.status === 429) return retryResponse(res, error, stage);
    console.error('[GLITCH plan error]', error);
    return json(res, 502, {
      error: 'Could not create the collection plan. Please try Generate again.',
      stage,
      detail: String(error?.message || 'Unknown error.').slice(0, 260),
    });
  }
}

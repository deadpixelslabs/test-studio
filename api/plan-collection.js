export const config = { maxDuration: 60 };

import {
  TEXT_MODEL,
  plannerEnvelopeSchema,
  sanitizeApiKey,
  json,
  readJsonBody,
  callGeminiStructured,
  buildPlannerPrompt,
  normalizePlan,
} from '../lib/gemini-core.js';

const MAX_PROMPT_CHARS = 1800;

function retryResponse(res, error, stage) {
  const retryAfterMs = Math.max(1000, Number(error?.retryAfterMs || 7000));
  return json(
    res,
    Number(error?.status || 429),
    {
      error: 'Gemini is temporarily busy. Retrying automatically is safe.',
      stage,
      retryAfterMs,
    },
    { 'Retry-After': Math.ceil(retryAfterMs / 1000) }
  );
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return json(res, 405, { error: 'Method not allowed.' });

  const apiKey = sanitizeApiKey(process.env.GEMINI_API_KEY);
  if (!apiKey) {
    return json(res, 500, { error: 'Missing GEMINI_API_KEY in Vercel Environment Variables.' });
  }

  let stage = 'request';
  try {
    const body = await readJsonBody(req);
    const prompt = String(body.prompt || '').trim();
    const style = String(body.style || '').trim();

    if (!prompt) return json(res, 400, { error: 'Prompt is required.' });
    if (prompt.length > MAX_PROMPT_CHARS) {
      return json(res, 400, { error: `Prompt is too long. Maximum ${MAX_PROMPT_CHARS} characters.` });
    }

    stage = 'gemini-safety-plan';
    const rawPlan = await callGeminiStructured(apiKey, {
      model: TEXT_MODEL,
      prompt: buildPlannerPrompt(prompt, style),
      schema: plannerEnvelopeSchema,
      maxOutputTokens: 3200,
      temperature: 0.28,
    });

    let plan;
    try {
      plan = normalizePlan(rawPlan);
    } catch (error) {
      if (error?.blocked) {
        return json(res, 400, {
          error: String(error.message || 'This prompt cannot be generated.'),
          blocked: true,
          category: error?.category || 'policy',
          stage: 'safety',
        });
      }
      throw error;
    }

    return json(res, 200, {
      plan,
      _pipeline: {
        version: '1.2.0',
        provider: 'Google Gemini',
        plannerModel: TEXT_MODEL,
        mode: 'gemini-only',
      },
    });
  } catch (error) {
    const status = Number(error?.status || 0);
    if (status === 429 || status === 502 || status === 503) {
      return retryResponse(res, error, stage);
    }

    console.error('[GLITCH Gemini plan error]', error);
    return json(res, 502, {
      error: 'Gemini could not create the collection plan. Please try Generate again.',
      stage,
      detail: String(error?.message || 'Unknown error.').slice(0, 320),
    });
  }
}

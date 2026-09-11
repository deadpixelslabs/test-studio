export const config = { maxDuration: 60 };

import {
  TEXT_MODEL_CHAIN,
  plannerEnvelopeSchema,
  sanitizeApiKey,
  json,
  readJsonBody,
  callMistralStructuredResilient,
  buildPlannerPrompt,
  normalizePlan,
} from '../lib/mistral-core.js';

const MAX_PROMPT_CHARS = 1800;

function retryResponse(res, error, stage) {
  const retryAfterMs = Math.max(1000, Number(error?.retryAfterMs || 7000));
  return json(
    res,
    Number(error?.status || 429),
    {
      error: 'Mistral is temporarily busy. Retrying automatically is safe.',
      stage,
      retryAfterMs,
      modelsTried: error?.modelsTried || [],
    },
    { 'Retry-After': Math.ceil(retryAfterMs / 1000) }
  );
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return json(res, 405, { error: 'Method not allowed.' });

  const apiKey = sanitizeApiKey(process.env.MISTRAL_API_KEY);
  if (!apiKey) return json(res, 500, { error: 'Missing MISTRAL_API_KEY in Vercel Environment Variables.' });

  let stage = 'request';
  try {
    const body = await readJsonBody(req);
    const prompt = String(body.prompt || '').trim();
    const style = String(body.style || '').trim();

    if (!prompt) return json(res, 400, { error: 'Prompt is required.' });
    if (prompt.length > MAX_PROMPT_CHARS) {
      return json(res, 400, { error: `Prompt is too long. Maximum ${MAX_PROMPT_CHARS} characters.` });
    }

    stage = 'mistral-collection-plan';
    const planner = await callMistralStructuredResilient(apiKey, {
      models: TEXT_MODEL_CHAIN,
      prompt: buildPlannerPrompt(prompt, style),
      schema: plannerEnvelopeSchema,
      maxOutputTokens: 3200,
      temperature: 0.22,
    });

    let plan;
    try {
      plan = normalizePlan(planner.result);
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
        version: '1.3.1',
        provider: 'Mistral AI',
        plannerModel: planner.model,
        plannerFallbackChain: TEXT_MODEL_CHAIN,
        priorAttempts: planner.attempts,
        mode: 'mistral-only',
      },
    });
  } catch (error) {
    const status = Number(error?.status || 0);
    if (status === 429 || status === 502 || status === 503) return retryResponse(res, error, stage);

    console.error('[GLITCH Mistral plan error]', error);
    return json(res, 502, {
      error: 'Mistral could not create the collection plan. Please try Generate again.',
      stage,
      detail: String(error?.message || 'Unknown error.').slice(0, 320),
    });
  }
}

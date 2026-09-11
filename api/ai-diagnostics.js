import { TEXT_MODEL_CHAIN, sanitizeApiKey, fetchWithTimeout, compactMistralError, IMAGE_MODEL } from '../lib/mistral-core.js';

export default async function handler(req, res) {
  const apiKey = sanitizeApiKey(process.env.MISTRAL_API_KEY);
  if (!apiKey) {
    return res.status(200).json({
      ok: false,
      version: '1.3.2',
      env: { mistralKey: false },
      error: 'MISTRAL_API_KEY missing.',
    });
  }

  const results = [];
  let anyOk = false;
  for (const model of TEXT_MODEL_CHAIN) {
    const started = Date.now();
    try {
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
            messages: [{ role: 'user', content: 'Reply with exactly OK.' }],
            max_tokens: 16,
            temperature: 0,
          }),
        },
        12000
      );
      const raw = await response.text();
      let preview = raw.slice(0, 120);
      try {
        const parsed = JSON.parse(raw);
        const content = parsed?.choices?.[0]?.message?.content;
        preview = typeof content === 'string' ? content.slice(0, 80) : preview;
      } catch {}
      anyOk = anyOk || response.ok;
      results.push({
        model,
        ok: response.ok,
        status: response.status,
        latencyMs: Date.now() - started,
        preview: response.ok ? preview : undefined,
        error: response.ok ? null : compactMistralError(response.status, raw),
      });
    } catch (error) {
      results.push({
        model,
        ok: false,
        status: null,
        latencyMs: Date.now() - started,
        error: String(error?.message || error),
      });
    }
  }

  return res.status(200).json({
    ok: anyOk,
    version: '1.3.2',
    env: { mistralKey: true },
    plannerModelChain: TEXT_MODEL_CHAIN,
    mistralTextModels: results,
    mistralImage: {
      model: IMAGE_MODEL,
      configured: true,
      tool: 'image_generation',
      note: 'Diagnostics do not generate an image, so no image-generation quota is consumed.',
    },
    note: 'Secret key values are never exposed.',
  });
}

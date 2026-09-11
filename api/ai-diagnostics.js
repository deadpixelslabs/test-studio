import { TEXT_MODEL_CHAIN, sanitizeApiKey, fetchWithTimeout, compactGeminiError } from '../lib/gemini-core.js';

export default async function handler(req, res) {
  const apiKey = sanitizeApiKey(process.env.GEMINI_API_KEY);
  const imageModel = process.env.GEMINI_IMAGE_MODEL || 'gemini-3.1-flash-image';

  if (!apiKey) {
    return res.status(200).json({
      ok: false,
      version: '1.2.2',
      env: { geminiKey: false },
      error: 'GEMINI_API_KEY missing.',
    });
  }

  const results = [];
  let anyOk = false;

  for (const model of TEXT_MODEL_CHAIN) {
    const started = Date.now();
    try {
      const response = await fetchWithTimeout(
        `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`,
        {
          method: 'POST',
          headers: {
            'x-goog-api-key': apiKey,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            contents: [{ role: 'user', parts: [{ text: 'Reply with exactly OK.' }] }],
            generationConfig: { temperature: 0, maxOutputTokens: 32 },
          }),
        },
        12000
      );

      const raw = await response.text();
      let preview = raw.slice(0, 160);
      try {
        const parsed = JSON.parse(raw);
        preview = parsed?.candidates?.[0]?.content?.parts?.map((part) => part?.text || '').join(' ').slice(0, 80) || preview;
      } catch {}

      anyOk = anyOk || response.ok;
      results.push({
        model,
        ok: response.ok,
        status: response.status,
        latencyMs: Date.now() - started,
        preview: response.ok ? preview : undefined,
        error: response.ok ? null : compactGeminiError(response.status, raw),
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
    version: '1.2.2',
    env: { geminiKey: true },
    plannerModelChain: TEXT_MODEL_CHAIN,
    geminiTextModels: results,
    geminiImage: {
      model: imageModel,
      configured: true,
      note: 'Image diagnostics do not generate a paid image.',
    },
    note: 'Secret key values are never exposed.',
  });
}

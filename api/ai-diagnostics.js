import { TEXT_MODEL, sanitizeApiKey, fetchWithTimeout, compactGeminiError } from '../lib/gemini-core.js';

export default async function handler(req, res) {
  const apiKey = sanitizeApiKey(process.env.GEMINI_API_KEY);
  const imageModel = process.env.GEMINI_IMAGE_MODEL || 'gemini-3.1-flash-image';

  if (!apiKey) {
    return res.status(200).json({
      ok: false,
      version: '1.2.0',
      env: { geminiKey: false },
      error: 'GEMINI_API_KEY missing.',
    });
  }

  const started = Date.now();
  try {
    const response = await fetchWithTimeout(
      `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(TEXT_MODEL)}:generateContent`,
      {
        method: 'POST',
        headers: {
          'x-goog-api-key': apiKey,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{ role: 'user', parts: [{ text: 'Reply with exactly OK.' }] }],
          generationConfig: { temperature: 0, maxOutputTokens: 64 },
        }),
      },
      15000
    );

    const raw = await response.text();
    let preview = raw.slice(0, 220);
    try {
      const parsed = JSON.parse(raw);
      preview = parsed?.candidates?.[0]?.content?.parts?.map((p) => p?.text || '').join(' ').slice(0, 120) || preview;
    } catch {}

    return res.status(200).json({
      ok: response.ok,
      version: '1.2.0',
      env: { geminiKey: true },
      geminiText: {
        model: TEXT_MODEL,
        status: response.status,
        latencyMs: Date.now() - started,
        preview,
        error: response.ok ? null : compactGeminiError(response.status, raw),
      },
      geminiImage: {
        model: imageModel,
        configured: true,
        note: 'Image diagnostics do not generate a paid image.',
      },
      note: 'Secret key values are never exposed.',
    });
  } catch (error) {
    return res.status(200).json({
      ok: false,
      version: '1.2.0',
      env: { geminiKey: true },
      model: TEXT_MODEL,
      latencyMs: Date.now() - started,
      error: String(error?.message || error),
    });
  }
}

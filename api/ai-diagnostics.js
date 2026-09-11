function sanitize(value) {
  return String(value || '').trim().replace(/^Bearer\s+/i, '').replace(/^['"]|['"]$/g, '');
}

export default async function handler(req, res) {
  const key = sanitize(process.env.GROQ_API_KEY);
  if (!key) return res.status(200).json({ ok: false, version: '0.1.8', error: 'GROQ_API_KEY missing.' });

  const model = process.env.GROQ_MODEL || 'openai/gpt-oss-20b';
  const started = Date.now();
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 15000);
  try {
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
      signal: controller.signal,
      body: JSON.stringify({
        model,
        messages: [{ role: 'user', content: 'Reply with exactly: OK' }],
        temperature: 0,
        reasoning_effort: 'low',
        max_completion_tokens: 32,
      }),
    });
    const raw = await response.text();
    res.status(200).json({
      ok: response.ok,
      version: '0.1.8',
      model,
      status: response.status,
      latencyMs: Date.now() - started,
      preview: raw.slice(0, 300),
      note: 'Secret key is never returned.',
    });
  } catch (error) {
    res.status(200).json({ ok: false, version: '0.1.8', model, latencyMs: Date.now() - started, error: error?.message || String(error) });
  } finally {
    clearTimeout(timer);
  }
}

function present(value) {
  return Boolean(String(value || '').trim());
}

function sanitize(value) {
  return String(value || '').trim().replace(/^Bearer\s+/i, '').replace(/^['"]|['"]$/g, '');
}

async function timed(label, fn) {
  const started = Date.now();
  try {
    const result = await fn();
    return { label, ok: true, latencyMs: Date.now() - started, ...result };
  } catch (error) {
    return { label, ok: false, latencyMs: Date.now() - started, error: error?.message || String(error) };
  }
}

async function nvidiaCheck(key, slot) {
  if (!key) return { skipped: true, reason: 'missing key' };
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 20000);
  try {
    const res = await fetch('https://integrate.api.nvidia.com/v1/chat/completions', {
      method: 'POST',
      headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
      signal: controller.signal,
      body: JSON.stringify({
        model: process.env.NVIDIA_MODEL || 'meta/llama-guard-4-12b',
        messages: [{ role: 'user', content: 'A cute pixel cat NFT collection.' }],
        temperature: 0,
        max_tokens: 5,
        stream: false,
      }),
    });
    const raw = await res.text();
    return { slot, status: res.status, preview: raw.slice(0, 220) };
  } finally {
    clearTimeout(timer);
  }
}

async function geminiCheck(key) {
  if (!key) return { skipped: true, reason: 'missing key' };
  const model = process.env.GEMINI_MODEL || 'gemini-2.5-flash';
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 20000);
  try {
    const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      signal: controller.signal,
      body: JSON.stringify({ contents: [{ role: 'user', parts: [{ text: 'Reply with exactly: ok' }] }], generationConfig: { maxOutputTokens: 8 } }),
    });
    const raw = await res.text();
    return { model, status: res.status, preview: raw.slice(0, 220) };
  } finally {
    clearTimeout(timer);
  }
}

export default async function handler(req, res) {
  const n1 = sanitize(process.env.NVIDIA_API_KEY_1 || process.env.NVIDIA_API_KEY || process.env.NVIDIA_NIM_API_KEY_1 || process.env.NGC_API_KEY);
  const n2 = sanitize(process.env.NVIDIA_API_KEY_2 || process.env.NVIDIA_NIM_API_KEY_2);
  const g = sanitize(process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY);

  const results = await Promise.all([
    timed('nvidiaKey1', () => nvidiaCheck(n1, 1)),
    timed('nvidiaKey2', () => nvidiaCheck(n2, 2)),
    timed('gemini', () => geminiCheck(g)),
  ]);

  res.status(200).json({
    ok: results.some((x) => x.label === 'gemini' && x.ok),
    version: '0.1.7',
    keysPresent: { nvidiaKey1: present(n1), nvidiaKey2: present(n2), geminiKey: present(g) },
    results,
    note: 'This endpoint makes small live test calls. It never returns secret key values.'
  });
}

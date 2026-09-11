function present(value) {
  return Boolean(String(value || '').trim());
}

export default function handler(req, res) {
  const groq = present(process.env.GROQ_API_KEY);
  res.status(200).json({
    ok: groq,
    app: 'GLITCH NFT STUDIO',
    version: '0.1.8',
    pipeline: 'GROQ STRUCTURED BLUEPRINT -> GLITCH LAYER ENGINE',
    env: { groqKey: groq },
    models: {
      primary: process.env.GROQ_MODEL || 'openai/gpt-oss-20b',
      fallback: process.env.GROQ_FALLBACK_MODEL || 'qwen/qwen3.8-27b',
    },
    note: 'API key values are never exposed.',
  });
}

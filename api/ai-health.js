function present(value) {
  return Boolean(String(value || '').trim());
}

export default function handler(req, res) {
  const groq = present(process.env.GROQ_API_KEY);
  res.status(200).json({
    ok: groq,
    app: 'GLITCH NFT STUDIO',
    version: '1.0.3',
    pipeline: 'SAFETY+PLAN -> CLIENT-QUEUED LAYER RENDERS -> LOCAL VALIDATION -> NFT GENERATOR',
    env: { groqKey: groq },
    models: {
      safety: process.env.GROQ_SAFETY_MODEL || 'openai/gpt-oss-safeguard-20b',
      primary: process.env.GROQ_MODEL || 'openai/gpt-oss-20b',
          },
    output: 'Rate-aware 6-layer SVG pipeline with automatic 429 backoff + resume-by-layer',
    note: 'Secret values are never exposed.',
  });
}

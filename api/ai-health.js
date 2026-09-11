function present(value) {
  return Boolean(String(value || '').trim());
}

export default function handler(req, res) {
  const groq = present(process.env.GROQ_API_KEY);
  res.status(200).json({
    ok: groq,
    app: 'GLITCH NFT STUDIO',
    version: '1.0.1',
    pipeline: 'SAFETY -> COLLECTION PLAN -> SEMANTIC QA -> 6 STAGED SVG RENDERS -> CLIENT NFT GENERATOR',
    env: { groqKey: groq },
    models: {
      safety: process.env.GROQ_SAFETY_MODEL || 'openai/gpt-oss-safeguard-20b',
      primary: process.env.GROQ_MODEL || 'openai/gpt-oss-20b',
      fallback: process.env.GROQ_FALLBACK_MODEL || 'qwen/qwen3.8-27b',
    },
    output: '6 layered SVG sets + traits + rarity + ERC-721 metadata-ready config',
    note: 'Secret values are never exposed.',
  });
}

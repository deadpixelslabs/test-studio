function present(value) {
  return Boolean(String(value || '').trim());
}

export default function handler(req, res) {
  const groq = present(process.env.GROQ_API_KEY);
  const gemini = present(process.env.GEMINI_API_KEY);
  res.status(200).json({
    ok: groq && gemini,
    app: 'GLITCH NFT STUDIO',
    version: '1.1.0',
    pipeline: 'GROQ SAFETY+PLAN -> GEMINI IMAGE MASTER+EDITS -> CHROMA/DIFF LAYERS -> 10K NFT ENGINE',
    env: {
      groqKey: groq,
      geminiKey: gemini,
    },
    models: {
      planner: process.env.GROQ_MODEL || 'openai/gpt-oss-20b',
      safety: process.env.GROQ_SAFETY_MODEL || 'openai/gpt-oss-safeguard-20b',
      image: process.env.GEMINI_IMAGE_MODEL || 'gemini-3.1-flash-image',
    },
    imageSize: '512',
    note: 'Secret values are never exposed.',
  });
}

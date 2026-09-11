function present(value) {
  return Boolean(String(value || '').trim());
}

export default function handler(req, res) {
  const gemini = present(process.env.GEMINI_API_KEY);
  res.status(200).json({
    ok: gemini,
    app: 'GLITCH NFT STUDIO',
    version: '1.2.1',
    pipeline: 'GEMINI SAFETY+PLAN -> GEMINI IMAGE MASTER+EDITS -> CHROMA/DIFF LAYERS -> 10K NFT ENGINE',
    env: {
      geminiKey: gemini,
    },
    models: {
      planner: process.env.GEMINI_TEXT_MODEL || 'gemini-3.8-flash',
      image: process.env.GEMINI_IMAGE_MODEL || 'gemini-3.1-flash-image',
    },
    imageApiOutput: 'default square (Gemini)',
    normalizedCanvas: '512x512',
    providerMode: 'Gemini only',
    note: 'Secret values are never exposed.',
  });
}

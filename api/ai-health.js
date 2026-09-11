function present(value) {
  return Boolean(String(value || '').trim());
}

export default function handler(req, res) {
  const gemini = present(process.env.GEMINI_API_KEY);
  res.status(200).json({
    ok: gemini,
    app: 'GLITCH NFT STUDIO',
    version: '1.2.2',
    pipeline: 'GEMINI SAFETY+PLAN -> GEMINI IMAGE MASTER+EDITS -> CHROMA/DIFF LAYERS -> 10K NFT ENGINE',
    env: {
      geminiKey: gemini,
    },
    models: {
      plannerPrimary: process.env.GEMINI_TEXT_MODEL || 'gemini-3.7-flash',
      plannerFallbacks: String(process.env.GEMINI_TEXT_FALLBACK_MODELS || 'gemini-3.5-flash,gemini-3.5-flash-lite').split(',').map(v => v.trim()).filter(Boolean),
      image: process.env.GEMINI_IMAGE_MODEL || 'gemini-3.1-flash-image',
    },
    imageApiOutput: 'default square (Gemini)',
    normalizedCanvas: '512x512',
    providerMode: 'Gemini only',
    note: 'Secret values are never exposed.',
  });
}

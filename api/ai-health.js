function present(value) {
  return Boolean(String(value || '').trim());
}

export default function handler(req, res) {
  const mistral = present(process.env.MISTRAL_API_KEY);
  res.status(200).json({
    ok: mistral,
    app: 'GLITCH NFT STUDIO',
    version: '1.3.2',
    pipeline: 'MISTRAL SAFETY+PLAN -> MISTRAL IMAGE GENERATION+REFERENCE BRANCH EDITS -> CHROMA/DIFF LAYERS -> 10K NFT ENGINE',
    env: { mistralKey: mistral },
    models: {
      plannerPrimary: process.env.MISTRAL_TEXT_MODEL || 'mistral-large-2512',
      plannerFallbacks: String(process.env.MISTRAL_TEXT_FALLBACK_MODELS || 'mistral-small-2603,ministral-14b-2512').split(',').map(v => v.trim()).filter(Boolean),
      imageConversationModel: process.env.MISTRAL_IMAGE_MODEL || 'mistral-small-2603',
    },
    normalizedCanvas: '512x512',
    providerMode: 'Mistral only',
    note: 'Only MISTRAL_API_KEY is required. Secret values are never exposed.',
  });
}

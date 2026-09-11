function present(value) {
  return Boolean(String(value || '').trim());
}

export default function handler(req, res) {
  const nvidia1 = present(process.env.NVIDIA_API_KEY_1 || process.env.NVIDIA_API_KEY || process.env.NVIDIA_NIM_API_KEY_1 || process.env.NGC_API_KEY);
  const nvidia2 = present(process.env.NVIDIA_API_KEY_2 || process.env.NVIDIA_NIM_API_KEY_2);
  const gemini = present(process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY);

  res.status(200).json({
    ok: nvidia1 && gemini,
    app: 'GLITCH NFT STUDIO',
    version: '0.1.5',
    pipeline: 'NVIDIA INPUT GUARD -> GEMINI -> NVIDIA OUTPUT GUARD',
    env: {
      nvidiaKey1: nvidia1,
      nvidiaKey2: nvidia2,
      geminiKey: gemini
    },
    models: {
      nvidia: process.env.NVIDIA_MODEL || 'meta/llama-guard-4-12b',
      gemini: process.env.GEMINI_MODEL || 'gemini-1.5-flash'
    },
    note: 'Key values are never exposed.'
  });
}

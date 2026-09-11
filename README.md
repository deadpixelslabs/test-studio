# GLITCH NFT STUDIO / V0.1.6 Llama Guard Role Fix

This build fixes the NVIDIA `meta/llama-guard-4-12b` request format.

## Pipeline
1. NVIDIA key #1 -> input prompt classification
2. Gemini -> NFT collection blueprint JSON
3. NVIDIA key #2 -> output blueprint classification
4. Frontend -> renderable layers, traits, rarity, and generator

## Important fix
Llama Guard 4 accepts `user` and `assistant` conversation roles and expects them to alternate. The old build sent a `system` role and also requested too many output tokens, which caused NVIDIA HTTP 400 errors.

V0.1.6 now uses:
- Input guard: one `user` message
- Output guard: `user` prompt + `assistant` generated blueprint
- `max_tokens: 20` for Llama Guard
- NVIDIA key #1 preferred for input
- NVIDIA key #2 preferred for output
- automatic cross-failover if one key fails

## Required Vercel Environment Variables
- `GEMINI_API_KEY`
- `NVIDIA_API_KEY_1`
- `NVIDIA_API_KEY_2` (recommended; key #1 can still fail over if omitted)

Optional:
- `GEMINI_MODEL=gemini-1.5-flash`
- `NVIDIA_MODEL=meta/llama-guard-4-12b`

Redeploy after changing environment variables.

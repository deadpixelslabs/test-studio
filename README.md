# GLITCH NFT STUDIO / V0.1.8 Groq Build

This build removes Gemini and NVIDIA from the generation critical path.

Pipeline:

Prompt -> Groq structured blueprint -> GLITCH layer engine -> NFT generator

## Required Vercel Environment Variable

`GROQ_API_KEY`

Optional:
- `GROQ_MODEL=openai/gpt-oss-20b`
- `GROQ_FALLBACK_MODEL=qwen/qwen3.8-27b`
- `GROQ_TIMEOUT_MS=18000`

## Test endpoints

- `/api/ai-health` checks whether the Groq key is visible to Vercel.
- `/api/ai-diagnostics` makes a tiny live Groq request and reports status/latency without exposing the key.

## Deploy

1. Upload/deploy this project to Vercel.
2. Add `GROQ_API_KEY` under Project Settings -> Environment Variables.
3. Redeploy after adding the environment variable.
4. Open `/api/ai-health`. `groqKey` should be true.
5. Open `/api/ai-diagnostics`. `ok` should be true.
6. Test Generate Collection Architecture in the UI.

The primary model is `openai/gpt-oss-20b` using Groq Structured Outputs with strict JSON schema. A Groq-hosted Qwen model is configured as same-provider fallback.

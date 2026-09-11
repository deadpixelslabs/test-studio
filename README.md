# GLITCH NFT STUDIO / V0.1.7 Resilient Triple-AI Pipeline

Pipeline:

NVIDIA INPUT GUARD -> GEMINI BLUEPRINT -> NVIDIA OUTPUT GUARD -> LOCAL RENDER ENGINE

## Why V0.1.7
The NVIDIA free Llama Guard endpoint can occasionally be slow/cold. The previous build used a 10-second timeout per key sequentially, so both guard calls could abort before Gemini was ever reached.

V0.1.7 adds:
- 15-second NVIDIA budget
- hedged failover between NVIDIA key #1 and #2
- support for NVIDIA HTTP 202 async responses + status polling
- Gemini default changed to `gemini-2.5-flash`
- 70-second browser request budget
- 60-second Vercel function duration
- MVP soft-fail mode for temporary guard outages
- live `/api/ai-diagnostics` endpoint

## Required Vercel environment variables
- `GEMINI_API_KEY`
- `NVIDIA_API_KEY_1`

Optional:
- `NVIDIA_API_KEY_2`
- `GEMINI_MODEL=gemini-2.5-flash`
- `NVIDIA_MODEL=meta/llama-guard-4-12b`
- `NVIDIA_GUARD_TIMEOUT_MS=15000`
- `GEMINI_TIMEOUT_MS=22000`
- `NVIDIA_GUARD_STRICT=false`

For MVP testing keep `NVIDIA_GUARD_STRICT=false`. If both NVIDIA calls time out, the request continues to Gemini and the response records a pipeline warning instead of failing the entire generator.

For public production later, set `NVIDIA_GUARD_STRICT=true` if you want safety checks to fail closed.

## Debug URLs
After deploy:
- `/api/ai-health` checks environment wiring only.
- `/api/ai-diagnostics` performs tiny live calls to NVIDIA key #1, NVIDIA key #2, and Gemini and reports latency/status without revealing any API keys.

## Vercel
- Framework: Vite
- Build command: `npm run build`
- Output directory: `dist`

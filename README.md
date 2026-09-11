# GLITCH NFT STUDIO / 10K NFT Collection Generator

This build has been stabilized to avoid frequent AI generation timeouts.

## What changed
- Fast **local prompt engine** is now the default.
- A prompt is converted instantly into a collection concept, layers, traits, and rarity weights.
- **Remote AI is optional** and disabled by default.
- Safer frontend request timeout handling.
- No hardcoded API keys.

## Recommended mode
Use the default **fast-local** mode first to make sure the generator works reliably.

## Run locally
1. Install dependencies
   - `npm install`
2. Copy `.env.example` to `.env.local` if needed
3. Run
   - `npm run dev`

## Optional remote AI
If you still want to try cloud AI enrichment later, set:

```
ENABLE_REMOTE_AI=true
REMOTE_AI_TIMEOUT_MS=8000
GEMINI_API_KEY=...
# or NVIDIA_API_KEY_1 / NVIDIA_API_KEY_2
```

If remote AI is slow or fails, the app falls back to the fast local generator.

# GLITCH NFT STUDIO v1.0.3 — Rate-Aware Production Build

Prompt-driven generative NFT collection builder for DEAD PIXELS LABS.

## Why v1.0.3

v1.0.1 could still hit Groq free-tier rate limits because one browser click triggered a long serverless function that performed safety, planning, semantic QA, then six SVG render jobs with retries/fallbacks. When Groq returned HTTP 429, the whole generation failed.

v1.0.3 changes the architecture so rate limits are recoverable instead of fatal.

## Production pipeline

1. User enters any safe prompt.
2. `/api/plan-collection` performs safety + creates the collection architecture.
3. The browser renders the six layers **sequentially** through `/api/render-layer`.
4. If Groq returns HTTP 429, the UI reads `Retry-After`, waits, and automatically retries the same layer.
5. Completed layers remain in memory; the generator does **not** restart from layer 1 after a rate limit.
6. A short pacing delay is inserted between successful layer calls to avoid burst limits.
7. SVGs are validated and converted into the existing NFT layer engine.
8. PNGs + ERC-721 metadata + ZIP are still generated locally in the browser.

## Important reliability changes

- Removed three-way retry storms (`strict -> best effort -> JSON object -> fallback model`) from normal 429 handling.
- No Qwen fallback for SVG rendering, avoiding `request too large for model` errors on the current service tier.
- Each Vercel function does only one small job and stays below Hobby max-duration constraints.
- Automatic 429 backoff uses Groq's `Retry-After` header when available.
- SVG output budget reduced and prompts request compact SVGs.
- Standard `xmlns='http://www.w3.org/2000/svg'` is now correctly allowed by SVG security validation.

## Required Vercel environment variable

```text
GROQ_API_KEY=...
```

Optional:

```text
GROQ_MODEL=openai/gpt-oss-20b
GROQ_SAFETY_MODEL=openai/gpt-oss-safeguard-20b
GROQ_TIMEOUT_MS=22000
ALLOWED_ORIGIN=https://generator.deadpixelslabs.com
```

Leave `ALLOWED_ORIGIN` unset while testing on the Vercel preview domain.

## Vercel settings

- Framework Preset: Vite
- Build Command: `npm run build`
- Output Directory: `dist`

## Health check

`/api/ai-health` should report version `1.0.3` and `groqKey: true`.

## API flow

- `/api/plan-collection`
- `/api/render-layer`
- `/api/ai-health`
- `/api/ai-diagnostics`

The old `/api/generate-collection` route remains in the bundle for compatibility but the production UI no longer uses it.

## Export

The browser still exports:

- `images/*.png`
- `metadata/*.json`
- `_metadata.json`
- `collection_summary.json`

Supply presets support up to 10,000 NFTs when the generated architecture has at least 10,000 unique combinations.

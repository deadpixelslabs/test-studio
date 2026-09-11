# GLITCH NFT STUDIO v1.0.1 — Production Staged SVG Build

Prompt-driven generative NFT collection builder for DEAD PIXELS LABS.

## Why v1.0.1 exists

v1.0.0 asked one model call to return the entire collection architecture plus 30 complete SVG strings inside one very large strict JSON object. Some Groq requests returned `failed_generation / Failed to generate JSON` even when the model had clearly started producing correct artwork.

v1.0.1 removes that bottleneck.

## Production pipeline

1. User enters any safe collection concept.
2. Groq Safeguard checks the prompt.
3. The creative model generates a **small collection plan only**: subject, style, six layers, trait names, rarity weights, art direction, and composition guide.
4. Semantic QA verifies that the plan still matches the user's prompt.
5. Six smaller SVG-render jobs generate the actual trait artwork, one layer at a time, with up to three jobs running concurrently.
6. Every SVG is validated server-side.
7. The browser stacks the generated SVG layers and generates PNGs + ERC-721 metadata + ZIP locally.

The prompt is the source of truth. There is no fixed dog/cat/skull subject mapper in the production AI path.

## Reliability strategy

Each creative stage automatically tries:

1. strict JSON Schema mode;
2. best-effort JSON Schema mode;
3. JSON Object mode;
4. primary model then fallback model.

This means a single JSON formatting failure no longer kills the whole generation request.

## Required Vercel environment variable

`GROQ_API_KEY`

## Recommended production variables

```text
GROQ_SAFETY_MODEL=openai/gpt-oss-safeguard-20b
GROQ_MODEL=openai/gpt-oss-20b
GROQ_FALLBACK_MODEL=qwen/qwen3.8-27b
GROQ_TIMEOUT_MS=20000
ALLOWED_ORIGIN=https://generator.deadpixelslabs.com
```

Leave `ALLOWED_ORIGIN` unset while testing on a `*.vercel.app` preview URL. Set it only after the production custom domain is attached.

## Vercel settings

- Framework Preset: Vite
- Build Command: `npm run build`
- Output Directory: `dist`

## Health checks

- `/api/ai-health`
- `/api/ai-diagnostics`

## Production safeguards

- API key remains server-side.
- Prompt moderation runs before generation.
- Semantic subject/prompt QA runs before expensive SVG rendering.
- SVG active/external content is rejected.
- Required traits cannot be visually empty.
- Optional `None / No ...` traits may be transparent.
- Same-origin restriction is available via `ALLOWED_ORIGIN`.
- Basic per-IP request throttling is included.
- No private key or seed phrase handling.

## Export

The browser generator exports:

- `images/*.png`
- `metadata/*.json`
- `_metadata.json`
- `collection_summary.json`

Supply presets support up to 10,000 NFTs when the generated architecture has at least 10,000 unique combinations.

# GLITCH NFT STUDIO v1.0.0 — Production Build

Prompt-driven generative NFT collection builder for DEAD PIXELS LABS.

## Production pipeline

1. User enters any safe collection concept.
2. Groq Safeguard checks the prompt.
3. GPT-OSS generates the collection subject, layer architecture, trait names, rarity weights, and the actual compact SVG artwork for every trait.
4. A semantic QA pass verifies that the generated subject still matches the user's prompt.
5. The browser converts the SVG traits into stacked layers and renders the collection locally.
6. The browser generates PNGs + ERC-721 metadata + ZIP.

The prompt is the source of truth. Style presets are only optional visual hints and must not replace the requested subject.

## Required Vercel environment variable

`GROQ_API_KEY`

## Recommended production variables

```text
GROQ_SAFETY_MODEL=openai/gpt-oss-safeguard-20b
GROQ_MODEL=openai/gpt-oss-20b
GROQ_FALLBACK_MODEL=qwen/qwen3.8-27b
GROQ_TIMEOUT_MS=30000
ALLOWED_ORIGIN=https://generator.deadpixelslabs.com
```

Leave `ALLOWED_ORIGIN` unset while testing on a `*.vercel.app` preview URL. Set it only after the production custom domain is attached.

## Vercel settings

- Framework Preset: Vite
- Build Command: `npm run build`
- Output Directory: `dist`

## Health checks

After deployment:

- `/api/ai-health` — confirms environment/model configuration without exposing keys.
- `/api/ai-diagnostics` — makes a small live request to Groq and reports status/latency.

## Production safeguards included

- Server-side API key only; never exposed to browser JavaScript.
- Groq safety moderation before generation.
- Semantic QA after generation to reduce prompt/subject drift.
- SVG validation and sanitization before browser rendering.
- No external URLs/scripts allowed inside AI-generated SVG artwork.
- Same-origin lock is available through `ALLOWED_ORIGIN`.
- Basic per-IP request throttling is included in the generation endpoint.
- Prompt length limit.
- No private key / seed phrase handling.

## Generation model

The creative model generates compact standalone 128×128 SVG traits directly from the user's prompt. The browser scales and stacks those assets at 512×512 for NFT rendering. This mirrors the code-generated visual workflow that works well inside AI Studio, rather than mapping prompts onto a fixed dog/cat/skull template library.

## Export

The current browser generator exports:

- `images/*.png`
- `metadata/*.json`
- `_metadata.json`
- `collection_summary.json`

Supply presets support up to 10,000 NFTs, provided the generated layer architecture has at least 10,000 unique combinations.

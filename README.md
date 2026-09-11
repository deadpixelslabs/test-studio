# GLITCH NFT STUDIO v1.1.1 — Groq Brain + Gemini Image Artist

This build replaces LLM-drawn SVG artwork with real AI image generation.

## Production pipeline

```text
USER PROMPT
  -> Groq safety + collection plan
  -> Gemini Image canonical master reference
  -> Gemini Image backgrounds / base edits / trait edits
  -> browser chroma-key removal + image-difference extraction
  -> composable PNG layers
  -> local 10,000 NFT generator
  -> ERC-721 metadata + ZIP
```

The prompt is the source of truth. There are no hardcoded dog/cat/skull subject templates in the AI production path.

## Required Vercel Environment Variables

Add both values in **Vercel -> Project -> Settings -> Environment Variables**:

```text
GROQ_API_KEY=...
GEMINI_API_KEY=...
```

Then redeploy.

### Important: Gemini image billing

`gemini-3.1-flash-image` image generation is a paid-tier Gemini API feature. The API key must belong to a Google project with usable paid image-generation quota/billing. Google AI Studio may let you experiment interactively even when the production API project does not yet have paid image quota.

Optional settings:

```text
GROQ_MODEL=openai/gpt-oss-20b
GROQ_SAFETY_MODEL=openai/gpt-oss-safeguard-20b
GEMINI_IMAGE_MODEL=gemini-3.1-flash-image
GEMINI_IMAGE_TIMEOUT_MS=50000
```

## Check after deploy

Open:

```text
https://YOUR-DOMAIN/api/ai-health
```

Expected:

```json
{
  "ok": true,
  "version": "1.1.1",
  "env": {
    "groqKey": true,
    "geminiKey": true
  }
}
```

`/api/ai-diagnostics` checks the Groq connection and whether the Gemini key is configured without spending money on an image-generation call.

## How the layer engine works

The collection planner returns 6 layers with 4 visible traits each:

- Background — required
- Base — required
- 4 concept-specific optional layers

The 4 optional layers also have a `noneWeight`, producing exactly at least 10,000 possible combinations:

```text
4 × 4 × 5 × 5 × 5 × 5 = 10,000
```

Gemini Image first creates a canonical master subject on a reserved chroma-green background. Base variants are image edits of that master. Other traits are generated as controlled edits of the same master; the browser removes the chroma background and extracts the changed pixels to form composable transparent PNG overlays.

## Expected generation time

The first collection build performs roughly two dozen image-generation calls. Depending on Gemini latency/quota, creating the initial layer pack can take a few minutes. The expensive AI step creates the reusable asset pack only — it does **not** generate 10,000 images with Gemini. The local generator combines the finished layers into the final collection.

## Deploy settings

Vercel normally detects these automatically:

```text
Framework: Vite
Build command: npm run build
Output directory: dist
```

## Fee system

Payment/export paywall is intentionally not included yet. The generation core should be validated with real users first; the planned $5 export fee can be added after the image pipeline is confirmed stable.


## v1.1.1 REST compatibility
Raw Gemini REST requests intentionally omit `responseFormat` sizing fields. Gemini produces a square image by default and the browser raster engine downsamples/normalizes each asset to 512×512. This avoids the API enum validation error seen with `aspectRatio: "1:1"` and `imageSize: "512"` on some current deployments.

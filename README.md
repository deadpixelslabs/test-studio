# GLITCH NFT STUDIO v1.2.2 — Gemini Only Production Build

This build removes Groq completely from the generation path.

## Pipeline

```text
USER PROMPT
  -> Gemini 3.8 Flash: safety + collection architecture
  -> Gemini 3.1 Flash Image: canonical master artwork
  -> Gemini 3.1 Flash Image: background/base/trait edits
  -> Browser chroma-key + difference extraction
  -> Composable PNG trait layers
  -> GLITCH 10K engine
  -> Images + ERC-721/OpenSea metadata + ZIP
```

The user's prompt is the source of truth. There are no hard-coded dog/cat/skull concept templates in the AI generation path.

## Required Vercel environment variable

Only one secret is required:

```env
GEMINI_API_KEY=...
```

Optional overrides:

```env
GEMINI_TEXT_MODEL=gemini-3.7-flash
GEMINI_TEXT_FALLBACK_MODELS=gemini-3.5-flash,gemini-3.5-flash-lite
GEMINI_IMAGE_MODEL=gemini-3.1-flash-image
GEMINI_TEXT_TIMEOUT_MS=45000
GEMINI_IMAGE_TIMEOUT_MS=50000
```

`GROQ_API_KEY` is not used by v1.2.2 and can be removed from Vercel after deployment.

## Health check

Open:

```text
/api/ai-health
```

Expected important fields:

```json
{
  "ok": true,
  "version": "1.2.1",
  "env": { "geminiKey": true },
  "providerMode": "Gemini only"
}
```

## Diagnostics

Open:

```text
/api/ai-diagnostics
```

This makes a tiny Gemini text request to verify the key/model without generating a paid image.

## Vercel

- Framework: Vite
- Build Command: `npm run build`
- Output Directory: `dist`

After adding/changing environment variables, redeploy the project.

## Notes

- Image generation may require Gemini API billing/quota.
- The browser normalizes generated image assets to 512x512.
- Collection planning is structured JSON generated directly by Gemini.
- Optional NFT layer absence is handled locally with `noneWeight`; Gemini is never asked to create a fake `None` image trait.

## v1.2.2 text-planner compatibility

Gemini 3.8 structured planning now uses the current **Interactions API**. The app no longer sends the human-readable `application/json` string into the GenerateContent enum field that caused the v1.2.0 error. A GenerateContent fallback remains for compatibility.

## v1.2.2 planner resilience

The Gemini-only planner now uses a model fallback chain: `gemini-3.7-flash` -> `gemini-3.5-flash` -> `gemini-3.5-flash-lite`. Transient 429/502/503/timeouts automatically move to the next Gemini model with backoff and jitter. No Groq or other provider is used.

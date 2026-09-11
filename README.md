# GLITCH NFT STUDIO v1.0.4 — Browser SVG Render Fix

This build fixes the broken AI-generated SVG thumbnails / incomplete live preview seen in v1.0.3.

## Main fixes
- AI artwork is constrained to simpler browser-safe flat SVG geometry.
- SVG markup is normalized before it reaches the UI.
- Client validates every SVG with DOMParser before applying the collection.
- Invalid artwork is re-rendered automatically per layer instead of silently appearing broken.
- AI SVG data URLs now use base64 encoding for more reliable browser rendering.
- Base trait names must be meaningful visual variants, not numbered placeholders.
- Prompt remains the source of truth; no subject-specific prompt is required.

## Required Vercel env
- GROQ_API_KEY

## Verify deployment
Open `/api/ai-health` and confirm `version: 1.0.4`.

## Pipeline
Prompt -> Safety -> Collection Plan -> 6 sequential AI layer renders -> Browser SVG validation -> NFT generator -> metadata + ZIP.

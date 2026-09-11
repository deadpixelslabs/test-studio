# Changelog

## v1.1.1 — Gemini REST Compatibility Fix

- Removed `generationConfig.responseFormat.image.aspectRatio` / `imageSize` from raw REST requests because the current Gemini REST endpoint can reject the human-readable values with an enum validation error.
- Keeps `responseModalities: ['IMAGE']`; Gemini defaults text-only generations to square output and edit generations follow the square master reference.
- Browser raster pipeline still normalizes every generated asset to exactly 512×512 before chroma removal, diff extraction, compositing, and export.
- No environment-variable changes required.

# CHANGELOG

## v1.1.1 — Real Image Generation Pipeline
- Replaced Groq-generated SVG art with Google Gemini Image artwork.
- Groq remains the collection architect and safety/planning brain.
- Added `GEMINI_API_KEY` and `gemini-3.1-flash-image` production endpoint.
- Added canonical master-reference generation to lock subject, pose, scale, and composition.
- Added Gemini image-to-image generation for base and trait variants.
- Added browser-side chroma-key removal for transparent PNG assets.
- Added browser-side image-difference extraction to convert edited full images into composable trait overlays.
- Reduced collection architecture to 6 layers x 4 visible traits, with 4 optional none states, yielding exactly 10,000+ combinations while reducing paid image calls.
- Added retry/backoff for Gemini 429/502/503 responses.
- Added health reporting for both Groq and Gemini keys.
- Removed obsolete SVG rendering API routes from the production path.

## v1.0.4 — Browser SVG Render Fix
- Previous LLM-to-SVG approach. Retained only as historical reference; no longer used in v1.1.1 production generation.

# Changelog

## 1.0.2
- Reworked generation into two production endpoints: plan + per-layer render.
- Added automatic client-side 429 backoff/retry using Retry-After.
- Sequential layer rendering replaces burst concurrency.
- Removed Qwen fallback from the critical render path.
- Reduced per-layer output/token budget.
- Fixed SVG security validator incorrectly rejecting the standard W3C SVG namespace URL.
- Keeps completed layers instead of restarting the entire job after a temporary rate limit.

## 1.0.1
- Staged SVG generation to avoid oversized strict JSON output.

## 1.0.0
- Initial production prompt-to-SVG generation pipeline.

## v1.0.3 - None Trait Repair
- Prevents AI plans from using None/No Accessory/No Outfit/Empty/Transparent as one of the five rendered traits.
- Optional absence is represented only by noneWeight, so it no longer consumes an SVG render slot.
- Server automatically repairs accidental None-style traits into visible fallback variants before rendering.
- Fixes `Invalid SVG for Outfit / None` failures that could trigger wasteful retries and subsequent Groq 429s.

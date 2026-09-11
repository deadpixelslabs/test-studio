# GLITCH NFT STUDIO v1.0.0

## Production generation core

- Prompt is now the source of truth; default style is AUTO.
- Removed runtime dependency on hardcoded dog/cat/skull visual templates for AI-created collections.
- Groq GPT-OSS now generates the actual SVG artwork for each trait, not only trait names.
- Added Groq GPT-OSS-Safeguard prompt moderation.
- Added semantic QA after generation to reject subject drift (for example, Doge -> skull).
- Requires exactly 6 production layers and 5 traits per layer.
- Validates background + base/main-subject layers.
- Rejects empty required trait artwork.
- Sanitizes AI SVGs and rejects scripts, remote assets, foreignObject, and unsafe URLs.
- Automatic layer stacking by semantic role.
- Same API key stays server-side; no browser secret exposure.
- Added basic request throttling and optional production origin lock.
- Rebranded UI to GLITCH NFT STUDIO.
- Export remains PNG + ERC-721 JSON metadata + master metadata + collection summary ZIP.

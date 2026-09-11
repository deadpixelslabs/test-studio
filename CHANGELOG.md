## 1.3.2 — Rate-limit checkpoint & resume
- Saves every completed AI trait asset in IndexedDB.
- Resumes from the next missing trait after a 429 instead of restarting.
- Adds deliberate pacing between Mistral image generations.
- Keeps master conversation references for consistent resumed edits.

# Changelog

## 1.3.2 — Mistral Only

- Removed Gemini from the production generation path.
- Only `MISTRAL_API_KEY` is required.
- Added Mistral JSON-schema collection planning with planner fallback models.
- Added Mistral built-in `image_generation` through the Conversations API.
- Added generated-file download through the Mistral Files API.
- Added master-conversation references so trait edits branch from the same canonical image.
- Kept browser chroma-key and difference-layer extraction for composable NFT traits.
- Updated health, diagnostics, UI labels and metadata to Mistral-only.

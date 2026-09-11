# Changelog

## v1.2.0 — Gemini Only

- Removed Groq from the application and API generation path.
- Removed `GROQ_API_KEY`, Groq planner, Groq safety model, Groq retry logic, and Groq diagnostics.
- Added Gemini 3.8 Flash structured collection planning and prompt policy classification in one request.
- Kept Gemini 3.1 Flash Image as the visual generation/edit engine.
- Only `GEMINI_API_KEY` is required.
- Added Gemini-only health and diagnostics endpoints.
- Updated UI copy and metadata to accurately describe the Gemini-only pipeline.
- Preserved master-reference locking, chroma-key extraction, difference-layer extraction, rarity, metadata, and 10K ZIP generation.

## v1.1.1

- Fixed raw Gemini Image REST compatibility by omitting problematic image response-format values and normalizing assets to 512x512 in the browser.

## v1.1.0

- Replaced text-generated SVG artwork with real Gemini Image generation and image editing.

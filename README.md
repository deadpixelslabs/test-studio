# GLITCH NFT STUDIO — Stable MVP v0.1.2

This build fixes the `Failed to generate` problem seen on Vercel.

## Root cause
The previous frontend called `/api/ai/generate-collection`, but the uploaded project was deployed as a Vite/static app. The Express route was therefore not reliably available on Vercel.

## Fix
- Prompt -> concept/layers now runs **100% client-side**.
- No `/api/ai/generate-collection` dependency.
- No Gemini/NVIDIA/network wait.
- No API keys required.
- Vercel build is now a normal static Vite build.
- Same prompt always creates the same deterministic collection architecture.
- Produces 6 layers / 30 traits with enough combinations for a 10K collection.

## Deploy to Vercel
1. Upload/import this folder.
2. Framework: Vite (auto-detected).
3. Build command: `npm run build`.
4. Output directory: `dist`.
5. No Environment Variables are required for this MVP.

## Test
Open AI Collection Concept Studio, enter a prompt, then click **Generate Collection Architecture**. It should apply the concept immediately without calling any backend API.

## Next
After this step is confirmed stable, optimize the full 10K image + metadata ZIP generation/export path separately.

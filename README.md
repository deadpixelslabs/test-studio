# GLITCH NFT STUDIO / V0.1.4 Triple-AI Pipeline

This build uses a real multi-model API pipeline for:

Prompt -> safety check -> collection blueprint -> safety check -> generator layers

## AI pipeline
1. **NVIDIA Guard #1** checks the user's prompt
2. **Gemini** generates the NFT collection blueprint JSON
3. **NVIDIA Guard #2** checks the generated output
4. Frontend converts the blueprint into renderable SVG trait layers

## Required Vercel Environment Variables
Add these in **Vercel -> Project Settings -> Environment Variables**:

- `GEMINI_API_KEY`
- `NVIDIA_API_KEY_1`
- `NVIDIA_API_KEY_2`

Optional:
- `GEMINI_MODEL=gemini-1.5-flash`
- `NVIDIA_MODEL=meta/llama-guard-4-12b`

## Notes
- The two NVIDIA keys are used as **fast failover** for the safety guard.
- The creative generation is handled by **Gemini**.
- If one NVIDIA key fails, the API route automatically tries the second key.
- If the prompt or output is blocked by guard, the frontend will show the error.

## Deploy settings
- Framework Preset: `Vite`
- Build Command: `npm run build`
- Output Directory: `dist`

## Local run
```bash
npm install
npm run dev
```

## API route
The frontend calls:
- `/api/generate-collection`

This route runs the full triple-AI pipeline.

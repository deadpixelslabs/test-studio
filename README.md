# GLITCH NFT STUDIO V0.1.5 — AI ENV / PIPELINE FIX

The app uses:
1. NVIDIA Llama Guard for input safety
2. Gemini for creative collection blueprint generation
3. NVIDIA Llama Guard for output safety

## Required Vercel variables
Go to **Vercel → Project → Settings → Environment Variables** and add:

- `GEMINI_API_KEY`
- `NVIDIA_API_KEY_1`

Optional failover:
- `NVIDIA_API_KEY_2`

Then **Redeploy** the project. Environment variables are applied to new deployments.

## Verify without exposing secrets
Open:

`/api/ai-health`

Expected:
```json
{
  "ok": true,
  "env": {
    "nvidiaKey1": true,
    "nvidiaKey2": true,
    "geminiKey": true
  }
}
```

The endpoint only returns booleans and never returns the API keys.

## Supported aliases
If you already use different names, the backend also accepts:
- Gemini: `GOOGLE_API_KEY`
- NVIDIA: `NVIDIA_API_KEY`, `NVIDIA_NIM_API_KEY_1`, `NVIDIA_NIM_API_KEY_2`, `NGC_API_KEY`

## Deploy
Framework: Vite
Build command: `npm run build`
Output directory: `dist`

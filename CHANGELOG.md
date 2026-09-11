# Changelog

## 1.0.1

- Replaced the single giant strict-JSON SVG request with a staged production pipeline.
- Collection architecture is generated separately from SVG artwork.
- SVG artwork is generated one layer at a time with concurrency 3.
- Added automatic strict -> best-effort -> JSON Object fallback.
- Added primary -> fallback model failover for creative stages.
- Added compact user-facing errors; raw failed-generation payloads stay in server logs.
- Added generation stage reporting for easier debugging.
- Kept prompt-locked subject fidelity and semantic QA.
- Kept server-side SVG safety validation.

## 1.0.0

- Initial production SVG build.

# Prompt Engineering Workshop

Players see a target frontend and write a prompt for an AI to recreate it. This MVP
is the scoring core: paste a target HTML page and an attempt, get a 0–100 visual
similarity score and a heatmap of where they differ.

## Run

```bash
npm install
npx playwright install chromium
npm start        # http://localhost:3000
npm test
```

## Scoring

Both pages are rendered at 1280px wide (full page, max 4000px tall). The score blends
SSIM (layout/structure) with CIEDE2000 colour distance, then is normalised so that an
empty page scores ~0 and an identical page scores 100.

Pasted HTML runs in headless Chromium with network access — run locally only.

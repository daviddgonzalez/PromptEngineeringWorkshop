import express from 'express';
import { fileURLToPath } from 'node:url';
import { render } from './render.js';
import { score } from './score.js';

const MAX_HTML_BYTES = 5 * 1024 * 1024;

export const app = express();
app.use(express.json({ limit: '12mb' }));
app.use(express.static(fileURLToPath(new URL('../public', import.meta.url))));

const isValidHtml = (value) =>
  typeof value === 'string' && value.trim() !== '' && Buffer.byteLength(value) <= MAX_HTML_BYTES;

const dataUrl = (png) => `data:image/png;base64,${png.toString('base64')}`;

app.post('/api/score', async (req, res) => {
  const { targetHtml, attemptHtml } = req.body ?? {};
  if (!isValidHtml(targetHtml) || !isValidHtml(attemptHtml)) {
    return res.status(400).json({ error: 'targetHtml and attemptHtml must be non-empty strings of at most 5MB' });
  }

  let targetPng;
  let attemptPng;
  try {
    [targetPng, attemptPng] = await Promise.all([render(targetHtml), render(attemptHtml)]);
  } catch (err) {
    return res.status(422).json({ error: `Could not render page: ${err.message}` });
  }

  const result = score(targetPng, attemptPng);
  res.json({
    score: result.score,
    details: { ssim: result.ssim, colorSim: result.colorSim, baseline: result.baseline },
    images: { target: dataUrl(targetPng), attempt: dataUrl(attemptPng), diff: dataUrl(result.diffPng) },
  });
});

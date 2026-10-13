import express from 'express';
import { fileURLToPath } from 'node:url';
import { render, renderImage } from './render.js';
import { score } from './score.js';

const MAX_INPUT_BYTES = 5 * 1024 * 1024;
const IMAGE_DATA_URL = /^data:image\/(png|jpeg|webp|gif);base64,[A-Za-z0-9+/]+=*$/;

export const app = express();
// Two base64 images at the 5MB cap come to ~13.4MB of JSON.
app.use(express.json({ limit: '16mb' }));
app.use(express.static(fileURLToPath(new URL('../public', import.meta.url))));

const isNonEmptyString = (value) => typeof value === 'string' && value.trim() !== '';

function parseSide(html, image) {
  if (isNonEmptyString(html) === isNonEmptyString(image)) return null;
  if (isNonEmptyString(html)) {
    return Buffer.byteLength(html) <= MAX_INPUT_BYTES ? () => render(html) : null;
  }
  const decodedBytes = (image.length - image.indexOf(',') - 1) * 0.75;
  return IMAGE_DATA_URL.test(image) && decodedBytes <= MAX_INPUT_BYTES ? () => renderImage(image) : null;
}

const dataUrl = (png) => `data:image/png;base64,${png.toString('base64')}`;

app.post('/api/score', async (req, res) => {
  const { targetHtml, targetImage, attemptHtml, attemptImage } = req.body ?? {};
  const renderTarget = parseSide(targetHtml, targetImage);
  const renderAttempt = parseSide(attemptHtml, attemptImage);
  if (!renderTarget || !renderAttempt) {
    return res.status(400).json({
      error: 'Give each side either HTML or a PNG/JPEG/WebP/GIF image (not both), each at most 5MB',
    });
  }

  let targetPng;
  let attemptPng;
  try {
    [targetPng, attemptPng] = await Promise.all([renderTarget(), renderAttempt()]);
  } catch (err) {
    return res.status(422).json({ error: `Could not render: ${err.message}` });
  }

  const result = score(targetPng, attemptPng);
  res.json({
    score: result.score,
    details: { ssim: result.ssim, colorSim: result.colorSim, baseline: result.baseline },
    images: { target: dataUrl(targetPng), attempt: dataUrl(attemptPng), diff: dataUrl(result.diffPng) },
  });
});

app.use((err, req, res, next) => {
  if (res.headersSent) return next(err);
  res.status(err.status ?? 500).json({ error: err.expose ? err.message : 'Internal error' });
});

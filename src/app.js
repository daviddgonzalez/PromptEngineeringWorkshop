import express from 'express';
import { readdir } from 'node:fs/promises';
import { extname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { render, renderImage } from './render.js';
import { score } from './score.js';
import { tsxToHtml } from './tsx.js';

const MAX_INPUT_BYTES = 5 * 1024 * 1024;
const IMAGE_DATA_URL = /^data:image\/(png|jpeg|webp|gif);base64,[A-Za-z0-9+/]+=*$/;
const PUBLIC_DIR = fileURLToPath(new URL('../public', import.meta.url));
const TARGETS_DIR = join(PUBLIC_DIR, 'targets');
const TARGET_TYPES = { '.html': 'html', '.tsx': 'tsx', '.png': 'image', '.jpg': 'image', '.jpeg': 'image', '.webp': 'image', '.gif': 'image' };

export const app = express();
// Two base64 images at the 5MB cap come to ~13.4MB of JSON.
app.use(express.json({ limit: '16mb' }));
app.use(express.static(PUBLIC_DIR));

const isNonEmptyString = (value) => typeof value === 'string' && value.trim() !== '';
const fitsLimit = (text) => Buffer.byteLength(text) <= MAX_INPUT_BYTES;

class CompileError extends Error {}

async function compile(tsx) {
  try {
    return await tsxToHtml(tsx);
  } catch (err) {
    throw new CompileError(err.message);
  }
}

function parseSide(html, image, tsx) {
  if ([html, image, tsx].filter(isNonEmptyString).length !== 1) return null;
  if (isNonEmptyString(html)) return fitsLimit(html) ? () => render(html) : null;
  if (isNonEmptyString(tsx)) return fitsLimit(tsx) ? async () => render(await compile(tsx)) : null;
  const decodedBytes = (image.length - image.indexOf(',') - 1) * 0.75;
  return IMAGE_DATA_URL.test(image) && decodedBytes <= MAX_INPUT_BYTES ? () => renderImage(image) : null;
}

const dataUrl = (png) => `data:image/png;base64,${png.toString('base64')}`;

app.post('/api/score', async (req, res) => {
  const { targetHtml, targetImage, targetTsx, attemptHtml, attemptImage, attemptTsx } = req.body ?? {};
  const renderTarget = parseSide(targetHtml, targetImage, targetTsx);
  const renderAttempt = parseSide(attemptHtml, attemptImage, attemptTsx);
  if (!renderTarget || !renderAttempt) {
    return res.status(400).json({
      error: 'Give each side exactly one of HTML, TSX or a PNG/JPEG/WebP/GIF image, each at most 5MB',
    });
  }

  let targetPng;
  let attemptPng;
  try {
    [targetPng, attemptPng] = await Promise.all([renderTarget(), renderAttempt()]);
  } catch (err) {
    const prefix = err instanceof CompileError ? 'Could not compile TSX' : 'Could not render';
    return res.status(422).json({ error: `${prefix}: ${err.message}` });
  }

  const result = score(targetPng, attemptPng);
  res.json({
    score: result.score,
    details: { ssim: result.ssim, colorSim: result.colorSim, baseline: result.baseline },
    images: { target: dataUrl(targetPng), attempt: dataUrl(attemptPng), diff: dataUrl(result.diffPng) },
  });
});

app.post('/api/preview', async (req, res) => {
  const { tsx } = req.body ?? {};
  if (!isNonEmptyString(tsx) || !fitsLimit(tsx)) {
    return res.status(400).json({ error: 'Give TSX of at most 5MB' });
  }
  try {
    res.json({ html: await compile(tsx) });
  } catch (err) {
    res.status(422).json({ error: err.message });
  }
});

const DISPLAY_NAMES = { html: 'HTML', css: 'CSS', tsx: 'TSX' };
const titleCase = (name) =>
  DISPLAY_NAMES[name.toLowerCase()] ?? name.replace(/[-_]+/g, ' ').trim().replace(/^./, (c) => c.toUpperCase());
const byName = new Intl.Collator('en', { numeric: true }).compare;
const urlPath = (...parts) => parts.map(encodeURIComponent).join('/');

async function subdirs(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  return entries.filter((e) => e.isDirectory()).map((e) => e.name).sort(byName);
}

// Layout: public/targets/<track>/<category>/<test file>
app.get('/api/targets', async (_req, res) => {
  const tracks = [];
  for (const track of await subdirs(TARGETS_DIR)) {
    const categories = [];
    for (const category of await subdirs(join(TARGETS_DIR, track))) {
      const files = (await readdir(join(TARGETS_DIR, track, category))).filter((f) => TARGET_TYPES[extname(f).toLowerCase()]);
      if (files.length === 0) continue;
      categories.push({
        category: titleCase(category),
        tests: files.sort(byName).map((file) => ({
          name: titleCase(file.slice(0, -extname(file).length)),
          file: urlPath('targets', track, category, file),
          type: TARGET_TYPES[extname(file).toLowerCase()],
        })),
      });
    }
    if (categories.length > 0) tracks.push({ track: titleCase(track), categories });
  }
  res.json(tracks);
});

app.use((err, _req, res, next) => {
  if (res.headersSent) return next(err);
  res.status(err.status ?? 500).json({ error: err.expose ? err.message : 'Internal error' });
});

import { PNG } from 'pngjs';
import { ssim } from 'ssim.js';
import { deltaE2000, srgbToLab } from './color.js';

const SSIM_WEIGHT = 0.6;
const DOWNSCALE = 4;
// ΔE2000 at or above this counts as a completely wrong colour.
const MAX_DELTA_E = 40;
// Below a just-noticeable difference the heatmap leaves the pixel untinted.
const NOTICEABLE_DELTA_E = 2;

function blankImage(width, height) {
  return { width, height, data: new Uint8ClampedArray(width * height * 4).fill(255) };
}

function padTo(img, width, height) {
  const out = blankImage(width, height);
  for (let row = 0; row < img.height; row++) {
    const start = row * img.width * 4;
    out.data.set(img.data.subarray(start, start + img.width * 4), row * width * 4);
  }
  return out;
}

function downscale(img) {
  const width = Math.ceil(img.width / DOWNSCALE);
  const height = Math.ceil(img.height / DOWNSCALE);
  const out = blankImage(width, height);
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const sum = [0, 0, 0];
      let count = 0;
      for (let row = y * DOWNSCALE; row < Math.min((y + 1) * DOWNSCALE, img.height); row++) {
        for (let col = x * DOWNSCALE; col < Math.min((x + 1) * DOWNSCALE, img.width); col++) {
          const i = (row * img.width + col) * 4;
          sum[0] += img.data[i];
          sum[1] += img.data[i + 1];
          sum[2] += img.data[i + 2];
          count++;
        }
      }
      const o = (y * width + x) * 4;
      for (let c = 0; c < 3; c++) out.data[o + c] = sum[c] / count;
    }
  }
  return out;
}

function deltaEMap(a, b) {
  const deltas = new Float32Array(a.width * a.height);
  for (let p = 0; p < deltas.length; p++) {
    const i = p * 4;
    deltas[p] = deltaE2000(
      srgbToLab(a.data[i], a.data[i + 1], a.data[i + 2]),
      srgbToLab(b.data[i], b.data[i + 1], b.data[i + 2]),
    );
  }
  return deltas;
}

function compare(a, b) {
  const deltas = deltaEMap(downscale(a), downscale(b));
  let colorTotal = 0;
  for (const d of deltas) colorTotal += Math.max(0, 1 - d / MAX_DELTA_E);
  const structural = ssim(a, b).mssim;
  const colorSim = colorTotal / deltas.length;
  return { ssim: structural, colorSim, sim: SSIM_WEIGHT * structural + (1 - SSIM_WEIGHT) * colorSim, deltas };
}

function heatmap(target, deltas) {
  const out = new PNG({ width: target.width, height: target.height });
  const smallWidth = Math.ceil(target.width / DOWNSCALE);
  for (let y = 0; y < target.height; y++) {
    for (let x = 0; x < target.width; x++) {
      const i = (y * target.width + x) * 4;
      const gray = 0.299 * target.data[i] + 0.587 * target.data[i + 1] + 0.114 * target.data[i + 2];
      const faded = 255 - (255 - gray) * 0.3;
      const d = deltas[Math.floor(y / DOWNSCALE) * smallWidth + Math.floor(x / DOWNSCALE)];
      const t = Math.min(1, d / MAX_DELTA_E);
      const alpha = d < NOTICEABLE_DELTA_E ? 0 : 0.25 + 0.65 * t;
      const tint = [255 - 35 * t, 220 * (1 - t), 0];
      for (let c = 0; c < 3; c++) out.data[i + c] = faded * (1 - alpha) + tint[c] * alpha;
      out.data[i + 3] = 255;
    }
  }
  return PNG.sync.write(out);
}

/** Visual similarity of two PNG buffers; score is 0–100 where a blank attempt scores ~0. */
export function score(targetPng, attemptPng) {
  const rawTarget = PNG.sync.read(targetPng);
  const rawAttempt = PNG.sync.read(attemptPng);
  const width = Math.max(rawTarget.width, rawAttempt.width);
  const height = Math.max(rawTarget.height, rawAttempt.height);
  const target = padTo(rawTarget, width, height);
  const attempt = padTo(rawAttempt, width, height);

  const result = compare(target, attempt);
  const baseline = compare(target, blankImage(width, height)).sim;
  const headroom = 1 - baseline;
  const normalized = headroom < 1e-6
    ? (result.sim > 1 - 1e-6 ? 1 : 0)
    : (result.sim - baseline) / headroom;

  return {
    score: Math.round(100 * Math.min(1, Math.max(0, normalized))),
    ssim: result.ssim,
    colorSim: result.colorSim,
    baseline,
    diffPng: heatmap(target, result.deltas),
  };
}

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { srgbToLab, deltaE2000 } from '../src/color.js';

const close = (actual, expected, eps) =>
  assert.ok(Math.abs(actual - expected) < eps, `${actual} !≈ ${expected}`);

test('deltaE2000 matches Sharma reference pairs', () => {
  const pairs = [
    [[50, 2.6772, -79.7751], [50, 0, -82.7485], 2.0425],
    [[50, 0, 0], [50, -1, 2], 2.3669],
    [[50, 2.5, 0], [73, 25, -18], 27.1492],
  ];
  for (const [a, b, expected] of pairs) close(deltaE2000(a, b), expected, 1e-4);
});

test('srgbToLab maps white and black to the L* extremes', () => {
  const [L, a, b] = srgbToLab(255, 255, 255);
  close(L, 100, 0.01);
  close(a, 0, 0.01);
  close(b, 0, 0.01);
  assert.deepEqual(srgbToLab(0, 0, 0), [0, 0, 0]);
});

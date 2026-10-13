import { test } from 'node:test';
import assert from 'node:assert/strict';
import { PNG } from 'pngjs';
import { score } from '../src/score.js';

const WHITE = [255, 255, 255];
const BLUE = [59, 130, 246];

function png(width, height, rects = []) {
  const img = new PNG({ width, height });
  img.data.fill(255);
  for (const { x, y, w, h, color } of rects) {
    for (let row = y; row < y + h; row++) {
      for (let col = x; col < x + w; col++) {
        const i = (row * width + col) * 4;
        [img.data[i], img.data[i + 1], img.data[i + 2]] = color;
      }
    }
  }
  return PNG.sync.write(img);
}

function page({ button = BLUE, header = [30, 41, 59], shift = 0, height = 240 } = {}) {
  return png(320, height, [
    { x: 0, y: 0, w: 320, h: 40, color: header },
    { x: 40 + shift, y: 80, w: 120, h: 30, color: button },
    { x: 40, y: 140, w: 240, h: 10, color: [200, 200, 200] },
    { x: 40, y: 160, w: 200, h: 10, color: [200, 200, 200] },
  ]);
}

const target = page();

test('identical pages score 100', () => {
  assert.equal(score(target, page()).score, 100);
});

test('a blank attempt scores near zero', () => {
  assert.ok(score(target, png(320, 240)).score <= 5);
});

test('a slightly-off shade beats a different colour', () => {
  const shade = score(target, page({ button: [37, 99, 235] })).score;
  const orange = score(target, page({ button: [249, 115, 22] })).score;
  assert.ok(shade > orange, `shade ${shade} should beat orange ${orange}`);
});

test('a small shift beats a missing header', () => {
  const shifted = score(target, page({ shift: 10 })).score;
  const headless = score(target, page({ header: WHITE })).score;
  assert.ok(shifted > headless, `shifted ${shifted} should beat headless ${headless}`);
});

test('pages of different heights are padded, not rejected', () => {
  const result = score(target, page({ height: 120 }));
  assert.ok(result.score < 100);
  const diff = PNG.sync.read(result.diffPng);
  assert.deepEqual([diff.width, diff.height], [320, 240]);
});

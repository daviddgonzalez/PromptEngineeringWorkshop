import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { app } from '../src/app.js';
import { close } from '../src/render.js';

let server;
let baseUrl;

before(async () => {
  server = app.listen(0);
  await new Promise((resolve) => server.once('listening', resolve));
  baseUrl = `http://127.0.0.1:${server.address().port}`;
});

after(async () => {
  server.close();
  await close();
});

const post = (body) =>
  fetch(`${baseUrl}/api/score`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  });

test('rejects missing or empty html with 400', async () => {
  assert.equal((await post({ targetHtml: '<p>x</p>' })).status, 400);
  assert.equal((await post({ targetHtml: '<p>x</p>', attemptHtml: '  ' })).status, 400);
});

test('rejects html over 5MB with 400', async () => {
  const huge = 'a'.repeat(5 * 1024 * 1024 + 1);
  const res = await post({ targetHtml: huge, attemptHtml: '<p>x</p>' });
  assert.equal(res.status, 400);
});

test('scores identical pages 100 and returns images', async () => {
  const html = '<h1 style="color:#2563eb">Hello</h1>';
  const res = await post({ targetHtml: html, attemptHtml: html });
  assert.equal(res.status, 200);
  const body = await res.json();
  assert.equal(body.score, 100);
  for (const key of ['ssim', 'colorSim', 'baseline']) assert.equal(typeof body.details[key], 'number');
  for (const key of ['target', 'attempt', 'diff']) assert.match(body.images[key], /^data:image\/png;base64,/);
});

import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { PNG } from 'pngjs';
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

const tinyPng = (() => {
  const img = new PNG({ width: 4, height: 4 });
  img.data.fill(128);
  return `data:image/png;base64,${PNG.sync.write(img).toString('base64')}`;
})();

test('accepts an image in place of html on either side', async () => {
  const res = await post({ targetImage: tinyPng, attemptHtml: '<p>x</p>' });
  assert.equal(res.status, 200);
  assert.equal(typeof (await res.json()).score, 'number');
});

test('rejects a side given both html and an image, or a non-image data url', async () => {
  for (const body of [
    { targetHtml: '<p>x</p>', targetImage: tinyPng, attemptHtml: '<p>x</p>' },
    { targetImage: 'data:text/html;base64,PHA+', attemptHtml: '<p>x</p>' },
  ]) {
    const res = await post(body);
    assert.equal(res.status, 400);
    assert.equal(typeof (await res.json()).error, 'string');
  }
});

test('an undecodable image is a 422', async () => {
  const res = await post({ targetImage: 'data:image/png;base64,AAAA', attemptHtml: '<p>x</p>' });
  assert.equal(res.status, 422);
});

test('the same TSX on both sides scores 100', async () => {
  const tsx = 'export default function App() { return <h1 className="text-4xl text-rose-600 p-10">Hi</h1>; }';
  const res = await post({ targetTsx: tsx, attemptTsx: tsx });
  assert.equal(res.status, 200);
  assert.equal((await res.json()).score, 100);
});

test('TSX that does not compile is a 422 when scoring', async () => {
  const res = await post({ targetHtml: '<p>x</p>', attemptTsx: 'export default () => <p>' });
  assert.equal(res.status, 422);
  assert.match((await res.json()).error, /Could not compile TSX/);
});

test('/api/preview compiles TSX or explains why not', async () => {
  const preview = (tsx) =>
    fetch(`${baseUrl}/api/preview`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ tsx }),
    });
  const ok = await preview('export default () => <p className="text-xl">Hi</p>;');
  assert.equal(ok.status, 200);
  assert.match((await ok.json()).html, /^<!doctype html>/);
  const bad = await preview('export default () => <p>');
  assert.equal(bad.status, 422);
  assert.equal(typeof (await bad.json()).error, 'string');
  assert.equal((await preview('')).status, 400);
});

test('/api/targets lists the built-in tests by track and category', async () => {
  const tracks = await (await fetch(`${baseUrl}/api/targets`)).json();
  assert.deepEqual(tracks.map((t) => t.track), ['HTML', 'React']);
  const expectedType = { HTML: 'html', React: 'tsx' };
  for (const { track, categories } of tracks) {
    assert.deepEqual(categories.map((c) => c.category), ['Components', 'Styling']);
    for (const { tests } of categories) {
      assert.deepEqual(tests.map((t) => t.name), ['Test 1', 'Test 2', 'Test 3']);
      for (const t of tests) {
        assert.equal(t.type, expectedType[track]);
        assert.equal((await fetch(`${baseUrl}/${t.file}`)).status, 200);
      }
    }
  }
});

test('an oversized body gets a JSON error', async () => {
  const res = await post({ targetHtml: 'a'.repeat(17 * 1024 * 1024), attemptHtml: '<p>x</p>' });
  assert.equal(res.status, 413);
  assert.equal(typeof (await res.json()).error, 'string');
});

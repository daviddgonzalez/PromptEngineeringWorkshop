import { test, after } from 'node:test';
import assert from 'node:assert/strict';
import { PNG } from 'pngjs';
import { render, renderImage, close } from '../src/render.js';
import { score } from '../src/score.js';

after(close);

const size = (png) => {
  const { width, height } = PNG.sync.read(png);
  return [width, height];
};

test('a short page fills the 1280x800 viewport', async () => {
  assert.deepEqual(size(await render('<h1>Hi</h1>')), [1280, 800]);
});

test('tall pages are capped at 4000px', async () => {
  assert.deepEqual(size(await render('<div style="height:10000px"></div>')), [1280, 4000]);
});

test('the same HTML rendered twice scores 100', async () => {
  const html = '<body style="margin:0"><header style="background:#1e293b;height:80px"></header><button style="margin:40px">Go</button></body>';
  assert.equal(score(await render(html), await render(html)).score, 100);
});

test('a page that hangs after load rejects instead of hanging', async () => {
  const html = "<script>addEventListener('load', () => setTimeout(() => { while (true); }, 0))</script>";
  await assert.rejects(render(html), /timed out/);
});

const pngDataUrl = (png) => `data:image/png;base64,${png.toString('base64')}`;

test('an image renders at 1280px wide, scaled from any source width', async () => {
  const img = new PNG({ width: 640, height: 300 });
  img.data.fill(200);
  assert.deepEqual(size(await renderImage(pngDataUrl(PNG.sync.write(img)))), [1280, 800]);
});

test('a screenshot rendered as an image matches the page it came from', async () => {
  const html = '<body style="margin:0"><header style="background:#1e293b;height:80px"></header><h1>Hi</h1></body>';
  const screenshot = await render(html);
  assert.equal(score(await renderImage(pngDataUrl(screenshot)), screenshot).score, 100);
});

test('an undecodable image rejects', async () => {
  await assert.rejects(renderImage('data:image/png;base64,AAAA'), /could not decode image/i);
});

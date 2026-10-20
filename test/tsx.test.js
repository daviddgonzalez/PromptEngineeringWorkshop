import { test, after } from 'node:test';
import assert from 'node:assert/strict';
import { readdir, readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { PNG } from 'pngjs';
import { render, close } from '../src/render.js';
import { tsxToHtml } from '../src/tsx.js';

after(close);

test('a typed component renders with Tailwind classes applied', async () => {
  const tsx = `
    import { useState } from 'react';
    type Props = { label?: string };
    export default function App({ label = 'Hi' }: Props) {
      const [count] = useState<number>(1);
      return <div className="bg-blue-500 h-screen text-white">{label} {count}</div>;
    }`;
  const png = PNG.sync.read(await render(await tsxToHtml(tsx)));
  const i = (400 * png.width + 640) * 4;
  const [r, g, b] = png.data.subarray(i, i + 3);
  assert.ok(b > 200 && r < 100, `expected blue, got rgb(${r}, ${g}, ${b})`);
});

test('imports other than react and react-dom are rejected', async () => {
  for (const source of ['fs', '../package.json', 'lodash']) {
    const tsx = `import x from '${source}'; export default () => <p>{String(x)}</p>;`;
    await assert.rejects(tsxToHtml(tsx), /Only react and react-dom can be imported/);
  }
});

test('a missing default export gets a friendly error', async () => {
  await assert.rejects(tsxToHtml('export function App() { return <p />; }'), /Export your component as default/);
});

test('syntax errors report the line', async () => {
  await assert.rejects(tsxToHtml('export default function App() {\n  return <p>;\n}'), /line \d/);
});

test('every built-in React target compiles', async () => {
  const dir = fileURLToPath(new URL('../public/targets/react', import.meta.url));
  const files = (await readdir(dir, { recursive: true })).filter((f) => f.endsWith('.tsx'));
  assert.ok(files.length > 0);
  for (const file of files) {
    await assert.doesNotReject(tsxToHtml(await readFile(join(dir, file), 'utf8')), file);
  }
});

test('a component that throws still renders instead of hanging', async () => {
  const html = await tsxToHtml('export default function App(): JSX.Element { throw new Error("boom"); }');
  await render(html);
});

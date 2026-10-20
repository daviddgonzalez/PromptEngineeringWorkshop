import { build } from 'esbuild';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);
const ROOT = fileURLToPath(new URL('..', import.meta.url));
const ALLOWED_IMPORTS = new Set(['react', 'react/jsx-runtime', 'react-dom', 'react-dom/client']);

let tailwindScript;
const tailwind = () => (tailwindScript ??= readFileSync(require.resolve('@tailwindcss/browser'), 'utf8'));

// Renders the player's default export, then clears data-pending once Tailwind's injected
// styles have stopped changing, so the screenshot never catches unstyled markup.
const ENTRY = `
import { flushSync } from 'react-dom';
import { createRoot } from 'react-dom/client';
import App from 'user';

const container = document.getElementById('root');
try {
  flushSync(() => createRoot(container).render(<App />));
} catch (err) {
  container.textContent = 'Your component threw: ' + (err?.message ?? err);
}

const styles = () => Array.from(document.querySelectorAll('style'), (s) => s.textContent).join('');
const started = performance.now();
let last = styles();
let stableFrames = 0;
(function settle() {
  const now = styles();
  stableFrames = now === last ? stableFrames + 1 : 0;
  last = now;
  if (stableFrames >= 5 || performance.now() - started > 3000) {
    document.fonts.ready.then(() => document.documentElement.removeAttribute('data-pending'));
  } else {
    requestAnimationFrame(settle);
  }
})();
`;

const userModule = (code) => ({
  name: 'user-module',
  setup(b) {
    b.onResolve({ filter: /^user$/ }, () => ({ path: 'user', namespace: 'user' }));
    b.onLoad({ filter: /.*/, namespace: 'user' }, () => ({ contents: code, loader: 'tsx', resolveDir: ROOT }));
    // Anything else imported from the player's code could pull files off the server's disk into the page.
    b.onResolve({ filter: /.*/, namespace: 'user' }, (args) => {
      if (ALLOWED_IMPORTS.has(args.path)) return undefined;
      return { errors: [{ text: `Only react and react-dom can be imported (got "${args.path}")` }] };
    });
  },
});

const escapeScript = (js) => js.replace(/<\/script/gi, '<\\/script');

/** Compiles a React + Tailwind TSX module (default export = component) into a standalone HTML page. */
export async function tsxToHtml(code) {
  let result;
  try {
    result = await build({
      stdin: { contents: ENTRY, loader: 'tsx', resolveDir: ROOT, sourcefile: 'entry.tsx' },
      bundle: true,
      write: false,
      format: 'iife',
      jsx: 'automatic',
      minify: true,
      logLevel: 'silent',
      define: { 'process.env.NODE_ENV': '"production"' },
      plugins: [userModule(code)],
    });
  } catch (err) {
    const first = err.errors?.[0];
    if (!first) throw err;
    if (/No matching export .* for import "default"/.test(first.text)) {
      throw new Error('Export your component as default (export default function App() {…})');
    }
    const where = first.location?.file === 'user:user' ? ` (line ${first.location.line})` : '';
    throw new Error(`${first.text}${where}`);
  }
  return `<!doctype html>
<html data-pending>
<head>
<meta charset="utf-8">
<script>${escapeScript(tailwind())}</script>
</head>
<body>
<div id="root"></div>
<script>${escapeScript(result.outputFiles[0].text)}</script>
</body>
</html>`;
}

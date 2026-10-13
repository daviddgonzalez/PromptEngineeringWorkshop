import { chromium } from 'playwright';

const VIEWPORT = { width: 1280, height: 800 };
const MAX_HEIGHT = 4000;
const RENDER_TIMEOUT_MS = 10_000;

let browserPromise;

function browser() {
  browserPromise ??= chromium.launch().catch((err) => {
    browserPromise = undefined;
    throw err;
  });
  return browserPromise;
}

/** Full-page PNG of `html` at 1280px wide, at most 4000px tall; rejects after 10s. */
export async function render(html) {
  const context = await (await browser()).newContext({ viewport: VIEWPORT });
  let timedOut = false;
  // Closing the context is the only way to unstick a page whose main thread is busy-looping.
  const deadline = setTimeout(() => {
    timedOut = true;
    context.close().catch(() => {});
  }, RENDER_TIMEOUT_MS);
  try {
    const page = await context.newPage();
    await page.setContent(html, { waitUntil: 'load', timeout: 0 });
    const pageHeight = await page.evaluate(() => document.documentElement.scrollHeight);
    return await page.screenshot({
      fullPage: true,
      clip: { x: 0, y: 0, width: VIEWPORT.width, height: Math.min(pageHeight, MAX_HEIGHT) },
    });
  } catch (err) {
    if (timedOut) throw new Error(`render timed out after ${RENDER_TIMEOUT_MS}ms`, { cause: err });
    throw err;
  } finally {
    clearTimeout(deadline);
    await context.close();
  }
}

export async function close() {
  if (!browserPromise) return;
  const instance = await browserPromise;
  browserPromise = undefined;
  await instance.close();
}

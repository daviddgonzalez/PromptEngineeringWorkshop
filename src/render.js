import { chromium } from 'playwright';

const VIEWPORT = { width: 1280, height: 800 };
const MAX_HEIGHT = 4000;
const LOAD_TIMEOUT_MS = 10_000;

let browserPromise;

function browser() {
  browserPromise ??= chromium.launch().catch((err) => {
    browserPromise = undefined;
    throw err;
  });
  return browserPromise;
}

/** Full-page PNG of `html` at 1280px wide, at most 4000px tall. */
export async function render(html) {
  const context = await (await browser()).newContext({ viewport: VIEWPORT });
  try {
    const page = await context.newPage();
    await page.setContent(html, { waitUntil: 'load', timeout: LOAD_TIMEOUT_MS });
    const pageHeight = await page.evaluate(() => document.documentElement.scrollHeight);
    return await page.screenshot({
      fullPage: true,
      clip: { x: 0, y: 0, width: VIEWPORT.width, height: Math.min(pageHeight, MAX_HEIGHT) },
    });
  } finally {
    await context.close();
  }
}

export async function close() {
  if (!browserPromise) return;
  const instance = await browserPromise;
  browserPromise = undefined;
  await instance.close();
}

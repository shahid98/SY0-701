#!/usr/bin/env node
/**
 * Smoke test: serves the existing dist/ build (run `npm run build` first) with `vite preview`,
 * opens routes in headless Chrome at desktop size and on an emulated touch phone, and fails on
 * console errors, horizontal page overflow or controls cut off past the screen edge.
 * Screenshots are saved to scripts/screenshots/.
 *
 *   node scripts/smoke.mjs                          # all default routes
 *   node scripts/smoke.mjs '#/labs'                 # specific routes
 *   SMOKE_MOBILE_WIDTH=360 node scripts/smoke.mjs   # test a narrower phone (default 390px)
 *   CHROME=/path/to/chrome node scripts/smoke.mjs
 */
import { spawn } from 'node:child_process';
import { mkdirSync, existsSync } from 'node:fs';
import { chromium } from 'playwright-core';

const PORT = 4789;
const BASE = `http://127.0.0.1:${PORT}/`;
const SHOTS = new URL('./screenshots/', import.meta.url).pathname;
const chromePath = process.env.CHROME || ['/usr/bin/google-chrome', '/usr/bin/chromium', '/usr/bin/chromium-browser'].find((p) => existsSync(p));

const DEFAULT_ROUTES = [
  '#/', '#/learn', '#/learn/d1', '#/learn/d1/1.1', '#/learn/d1/1.1/control-categories', '#/learn/d1/1.1/control-types',
  '#/labs', '#/flashcards', '#/vocabulary', '#/practice', '#/pbq', '#/mock-exam', '#/revision', '#/progress',
  '#/coverage', '#/compare', '#/scenarios', '#/settings',
];

const routes = process.argv.slice(2).filter((a) => a.startsWith('#'));
const list = routes.length ? routes : DEFAULT_ROUTES;
mkdirSync(SHOTS, { recursive: true });

const viteBin = new URL('../node_modules/vite/bin/vite.js', import.meta.url).pathname;
const server = spawn(process.execPath, [viteBin, 'preview', '--port', String(PORT), '--strictPort', '--host', '127.0.0.1'], { stdio: ['ignore', 'pipe', 'pipe'] });
process.on('exit', () => server.kill());
await new Promise((resolve, reject) => {
  const t = setTimeout(() => reject(new Error('preview server did not start')), 20000);
  server.stdout.on('data', (d) => { if (String(d).includes(String(PORT))) { clearTimeout(t); resolve(); } });
  server.on('exit', (c) => reject(new Error(`preview exited ${c}`)));
});

const browser = await chromium.launch({ executablePath: chromePath, headless: true, args: ['--no-sandbox'] });
let failures = 0;
try {
  // The phone run emulates a touch device (coarse pointer), so touch-only styles are exercised too.
  const MOBILE_WIDTH = Number(process.env.SMOKE_MOBILE_WIDTH || 390);
  const contexts = [
    ['desktop', { viewport: { width: 1440, height: 900 }, colorScheme: 'dark' }],
    ['mobile', { viewport: { width: MOBILE_WIDTH, height: 844 }, colorScheme: 'light', isMobile: true, hasTouch: true, deviceScaleFactor: 2 }],
  ];
  for (const [label, options] of contexts) {
    const ctx = await browser.newContext(options);
    const page = await ctx.newPage();
    const errors = [];
    page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
    page.on('pageerror', (e) => errors.push(String(e)));
    for (const r of list) {
      errors.length = 0;
      await page.goto(BASE + r, { waitUntil: 'networkidle' });
      await page.waitForTimeout(400);
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
      const culprits = overflow > 2 ? await page.evaluate(() => {
        const out = [];
        for (const el of document.querySelectorAll('body *')) {
          const r = el.getBoundingClientRect();
          if (r.right > window.innerWidth + 2 && r.width > 0) {
            let p = el.parentElement, clipped = false;
            while (p) { const cs = getComputedStyle(p); if (cs.overflowX !== 'visible') { clipped = true; break; } p = p.parentElement; }
            if (!clipped) out.push(`${el.tagName.toLowerCase()}.${String(el.className).slice(0, 80)} right=${Math.round(r.right)}`);
          }
        }
        return out.slice(0, 6);
      }) : [];
      // Controls pushed past the right edge but hidden by an overflow:hidden card don't scroll the page — catch them too.
      const cutOff = await page.evaluate(() => {
        const out = [];
        for (const el of document.querySelectorAll('main button, main a[href], main input, main select')) {
          const r = el.getBoundingClientRect();
          if (!r.width || r.right <= window.innerWidth + 1) continue;
          let p = el.parentElement, scrollable = false;
          while (p) { const ox = getComputedStyle(p).overflowX; if (ox === 'auto' || ox === 'scroll') { scrollable = true; break; } p = p.parentElement; }
          if (!scrollable) out.push(`${el.tagName.toLowerCase()} "${(el.textContent || el.getAttribute('aria-label') || '').trim().slice(0, 40)}" right=${Math.round(r.right)}`);
        }
        return out.slice(0, 4);
      });
      const title = await page.evaluate(() => document.querySelector('main h1')?.textContent ?? '(no h1)');
      const name = `${label}-${r.replace(/[#/?=&]+/g, '_').replace(/^_+|_+$/g, '') || 'home'}.png`;
      await page.screenshot({ path: SHOTS + name, fullPage: false });
      // Every page renders a top-level heading; a missing one means the page failed to render.
      const bad = errors.length > 0 || overflow > 2 || cutOff.length > 0 || title === '(no h1)';
      if (bad) failures++;
      console.log(`${bad ? '✗' : '✓'} [${label}] ${r.padEnd(48)} h1="${title.slice(0, 50)}"${overflow > 2 ? ` H-OVERFLOW ${overflow}px` : ''}`);
      for (const e of errors) console.log(`    console: ${e.slice(0, 300)}`);
      for (const c of culprits) console.log(`    overflow: ${c}`);
      for (const c of cutOff) console.log(`    cut off: ${c}`);
    }
    await ctx.close();
  }
} finally {
  await browser.close();
  server.kill();
}
console.log(failures ? `\n${failures} route checks failed` : '\nAll route checks passed');
process.exit(failures ? 1 : 0);

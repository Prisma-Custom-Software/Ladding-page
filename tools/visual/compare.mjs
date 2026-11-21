#!/usr/bin/env node
// Visual comparison harness: renders the original model (Landing Page v6.html) and our React app
// in headless Chrome under identical conditions, screenshots the same element on both sides,
// and diffs them with ImageMagick.
//
// Usage:
//   node tools/visual/compare.mjs --name T03-about --sel '#sobre' [options]
//
// Options:
//   --name <id>           output folder name (required)
//   --sel <css>           element to capture on both sides (default: full page)
//   --orig-sel / --ours-sel   override selector per side
//   --ours <url>          our page URL (default http://localhost:5173/)
//   --widths 1440,390     viewport widths (default 1440,1024,768,390)
//   --height 900          viewport height (default 900)
//   --mode final|time     final = intro skipped + sections fully built (default)
//                         time  = intro NOT skipped, screenshots at --times (ms after mount)
//   --times 300,1200,...  real milliseconds after page mount, for --mode time
//   --keep-fixed          keep position:fixed elements (menu button, agents canvas, chip, FAB)
//   --hide <css>          extra selector hidden on BOTH sides (repeatable via comma)
//   --hide-orig / --hide-ours <css>   hide per side
//   --click <css>         click this selector before capture (both sides), e.g. menu button
//   --fuzz 6              ImageMagick fuzz % for pixel equality (default 6)
//   --ready <css>         selector that proves OUR page mounted (default #topo; use e.g. '#sobre' on preview.html)
//   --orig-ready <css>    same for the original (default #topo)
//   --skip-intro          (time mode) set the session flag so the intro is skipped
//   --scroll-to <css>     (time mode) instantly scroll to this element 1.5s after mount, then start the --times clock
//   --orig-scroll-to <css>  per-side override for the original
//   --viewport            capture only the viewport instead of an element / full page
//
// Recipes:
//   Section in isolation (our preview entry), final state:
//     node tools/visual/compare.mjs --name T03 --sel '#sobre' --ready '#sobre' \
//       --ours 'http://localhost:5173/preview.html?c=sections/About'
//   Intro frames (whole viewport, overlays visible):
//     node tools/visual/compare.mjs --name T09 --mode time --times 300,900,1500,2500,3500,4500 \
//       --viewport --keep-fixed --widths 1440,390
//   Section build animation frames:
//     node tools/visual/compare.mjs --name T10 --mode time --skip-intro --scroll-to '#software' \
//       --times 200,600,1200,2500 --viewport --keep-fixed --widths 1440
//
// Output: tools/visual/out/<name>/<width>[-t<ms>]/{orig.png,ours.png,diff.png,side.png}
// Prints a JSON summary on stdout. Exit code 0 always (agents read the JSON).
//
// Determinism: Math.random is replaced by the same seeded PRNG on both sides, videos are paused
// at frame 0, and Chrome runs are serialized with a lock file so parallel agents don't OOM.

import puppeteer from 'puppeteer-core';
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import url from 'node:url';

const HERE = path.dirname(url.fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, '../..');
const ORIG_URL = url.pathToFileURL(path.join(ROOT, 'Landing Page v6.html')).href;
const CHROME = process.env.CHROME_PATH || '/usr/bin/google-chrome';
const LOCK = path.join(HERE, '.chrome.lock');

function arg(name, def) {
  const i = process.argv.indexOf('--' + name);
  if (i < 0) return def;
  const v = process.argv[i + 1];
  return v === undefined || v.startsWith('--') ? true : v;
}

const name = arg('name');
if (!name) { console.error('--name is required'); process.exit(2); }
const sel = arg('sel', null);
const origSel = arg('orig-sel', sel);
const oursSel = arg('ours-sel', sel);
const oursUrl = arg('ours', 'http://localhost:5173/');
const widths = String(arg('widths', '1440,1024,768,390')).split(',').map(Number);
const height = Number(arg('height', 900));
const mode = arg('mode', 'final');
const times = String(arg('times', '0')).split(',').map(Number);
const keepFixed = !!arg('keep-fixed', false);
const hideBoth = arg('hide', '');
const hideOrig = [hideBoth, arg('hide-orig', '')].filter(Boolean).join(',');
const hideOurs = [hideBoth, arg('hide-ours', '')].filter(Boolean).join(',');
const click = arg('click', null);
const fuzz = Number(arg('fuzz', 6));
const ready = arg('ready', '#topo');
const origReady = arg('orig-ready', '#topo');
const skipIntroInTime = !!arg('skip-intro', false);
const scrollTo = arg('scroll-to', null);
const viewportOnly = !!arg('viewport', false);
const OUT = path.join(HERE, 'out', name);

// --- simple cross-process lock (one Chrome at a time) ---
async function withLock(fn) {
  const start = Date.now();
  for (;;) {
    try { fs.mkdirSync(LOCK); break; } catch {
      try { if (Date.now() - fs.statSync(LOCK).mtimeMs > 600000) fs.rmSync(LOCK, { recursive: true }); } catch {}
      if (Date.now() - start > 600000) throw new Error('lock timeout');
      await new Promise(r => setTimeout(r, 500));
    }
  }
  try { return await fn(); } finally { fs.rmSync(LOCK, { recursive: true, force: true }); }
}

const SEED_SCRIPT = `(() => {
  let s = 0x9e3779b9;
  Math.random = function () { s |= 0; s = s + 0x6D2B79F5 | 0; let t = Math.imul(s ^ s >>> 15, 1 | s);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
})();`;

async function prepare(page, side, width, skipIntro) {
  const readySel = side === 'orig' ? origReady : ready;
  await page.setViewport({ width, height, deviceScaleFactor: 1 });
  await page.evaluateOnNewDocument(SEED_SCRIPT);
  if (skipIntro) {
    await page.evaluateOnNewDocument(() => { try { sessionStorage.setItem('prisma-hero-built', '1'); } catch (e) {} });
  }
  const target = side === 'orig' ? ORIG_URL : oursUrl;
  await page.goto(target, { waitUntil: 'load', timeout: 60000 });
  await page.waitForSelector(readySel, { timeout: 60000 });
  await page.evaluate(() => {
    const st = document.createElement('style');
    st.textContent = 'html,body{scroll-behavior:auto !important}';
    document.head.appendChild(st);
  });
}

async function freeze(page, hide) {
  await page.evaluate(async ({ keepFixed, hide }) => {
    document.querySelectorAll('video').forEach(v => { try { v.pause(); v.currentTime = 0; } catch (e) {} });
    if (document.fonts && document.fonts.ready) await document.fonts.ready;
    const st = document.createElement('style');
    st.textContent = (hide ? `${hide}{visibility:hidden !important}` : '') +
      '*{caret-color:transparent !important}';
    document.head.appendChild(st);
    if (!keepFixed) {
      for (const el of document.querySelectorAll('body *')) {
        if (getComputedStyle(el).position === 'fixed') el.style.setProperty('visibility', 'hidden', 'important');
      }
    }
  }, { keepFixed, hide });
}

// Scroll through the whole page so every section triggers its build animation, then wait for it.
async function buildAllSections(page) {
  await page.evaluate(async () => {
    const H = document.documentElement.scrollHeight;
    for (let y = 0; y <= H; y += Math.round(innerHeight * 0.6)) {
      scrollTo(0, y); await new Promise(r => setTimeout(r, 350));
    }
    scrollTo(0, 0);
  });
  await new Promise(r => setTimeout(r, 4500));
}

async function shoot(page, selector, file) {
  if (viewportOnly) {
    await page.screenshot({ path: file });
  } else if (selector) {
    const el = await page.$(selector);
    if (!el) return { error: `selector not found: ${selector}` };
    await el.evaluate(e => { const r = e.getBoundingClientRect(); window.scrollTo({ top: scrollY + r.top, behavior: 'instant' }); });
    await new Promise(r => setTimeout(r, 400));
    await el.screenshot({ path: file });
  } else {
    await page.screenshot({ path: file, fullPage: true });
  }
  return { ok: true };
}

function size(file) {
  return execFileSync('identify', ['-format', '%w %h', file]).toString().trim().split(' ').map(Number);
}

function diff(dir) {
  const o = path.join(dir, 'orig.png'), u = path.join(dir, 'ours.png');
  const [ow, oh] = size(o), [uw, uh] = size(u);
  const W = Math.max(ow, uw), H = Math.max(oh, uh);
  // pad both to the same canvas so size mismatches still produce a diff
  for (const f of [o, u]) execFileSync('convert', [f, '-background', '#ff00ff', '-gravity', 'northwest', '-extent', `${W}x${H}`, f + '.pad.png']);
  let ae = 0;
  try {
    execFileSync('compare', ['-metric', 'AE', '-fuzz', fuzz + '%', o + '.pad.png', u + '.pad.png', path.join(dir, 'diff.png')], { stdio: ['ignore', 'ignore', 'pipe'] });
  } catch (e) { ae = parseFloat(String(e.stderr)) || 0; }
  execFileSync('convert', [o + '.pad.png', u + '.pad.png', path.join(dir, 'diff.png'), '+append', '-resize', '2400x>', path.join(dir, 'side.png')]);
  fs.rmSync(o + '.pad.png'); fs.rmSync(u + '.pad.png');
  return { origSize: [ow, oh], oursSize: [uw, uh], sizeMatch: ow === uw && oh === uh, diffPixels: ae, diffPercent: +(100 * ae / (W * H)).toFixed(3) };
}

async function run() {
  const results = [];
  await withLock(async () => {
    const browser = await puppeteer.launch({
      executablePath: CHROME, headless: true,
      args: ['--no-sandbox', '--disable-dev-shm-usage', '--autoplay-policy=no-user-gesture-required', '--hide-scrollbars', '--force-color-profile=srgb', '--font-render-hinting=none'],
    });
    try {
      for (const width of widths) {
        const shots = mode === 'time' ? times : [null];
        for (const t of shots) {
          const dir = path.join(OUT, t === null ? String(width) : `${width}-t${t}`);
          fs.mkdirSync(dir, { recursive: true });
          const entry = { width, t, dir };
          for (const side of ['orig', 'ours']) {
            const ctx = await browser.createBrowserContext();
            const page = await ctx.newPage();
            const errors = [];
            page.on('pageerror', e => errors.push(String(e.message || e)));
            page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
            try {
              await prepare(page, side, width, mode !== 'time' || skipIntroInTime);
              if (mode === 'time') {
                if (scrollTo) {
                  await new Promise(r => setTimeout(r, 1500));
                  await page.evaluate(s => { const e = document.querySelector(s); if (e) window.scrollTo({ top: scrollY + e.getBoundingClientRect().top, behavior: 'instant' }); }, side === 'orig' ? (arg('orig-scroll-to', scrollTo)) : scrollTo);
                }
                await new Promise(r => setTimeout(r, t));
              } else {
                await new Promise(r => setTimeout(r, 1500));
                await buildAllSections(page);
              }
              if (click) { await page.click(click).catch(() => {}); await new Promise(r => setTimeout(r, 700)); }
              await freeze(page, side === 'orig' ? hideOrig : hideOurs);
              const r = await shoot(page, side === 'orig' ? origSel : oursSel, path.join(dir, side + '.png'));
              entry[side] = { ...r, consoleErrors: errors.slice(0, 10) };
            } catch (e) {
              entry[side] = { error: String(e.message || e), consoleErrors: errors.slice(0, 10) };
            }
            await ctx.close();
          }
          if (entry.orig?.ok && entry.ours?.ok) Object.assign(entry, diff(dir));
          results.push(entry);
        }
      }
    } finally { await browser.close(); }
  });
  console.log(JSON.stringify({ name, mode, origSel, oursSel, oursUrl, results }, null, 2));
}

run().catch(e => { console.log(JSON.stringify({ name, fatal: String(e.stack || e) })); });

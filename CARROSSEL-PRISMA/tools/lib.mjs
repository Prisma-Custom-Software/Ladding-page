// Shared helpers: tiny static server + headless Chrome via the repo's puppeteer-core.
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

export const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const require = createRequire(path.join(ROOT, '..', 'tools', 'visual', 'package.json'));
const puppeteer = require('puppeteer-core');

const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.woff2': 'font/woff2', '.mp4': 'video/mp4', '.png': 'image/png' };
export function serve() {
  return new Promise((res) => {
    const srv = http.createServer((req, rsp) => {
      const p = path.join(ROOT, decodeURIComponent(new URL(req.url, 'http://x').pathname));
      if (!p.startsWith(ROOT) || !fs.existsSync(p) || fs.statSync(p).isDirectory()) { rsp.writeHead(404); return rsp.end(); }
      rsp.writeHead(200, { 'content-type': TYPES[path.extname(p)] || 'application/octet-stream' });
      fs.createReadStream(p).pipe(rsp);
    });
    srv.listen(0, '127.0.0.1', () => res({ srv, base: `http://127.0.0.1:${srv.address().port}` }));
  });
}
export async function browser() {
  return puppeteer.launch({ executablePath: '/usr/bin/google-chrome', headless: 'new', args: [...(process.env.GFLAGS !== undefined ? process.env.GFLAGS.split(',').filter(Boolean) : ['--enable-gpu', '--ignore-gpu-blocklist', '--use-angle=gl']), '--no-sandbox', '--autoplay-policy=no-user-gesture-required', '--disable-gpu-vsync'] });
}
export async function openSlide(br, base, n) {
  const page = await br.newPage();
  await page.setViewport({ width: 1100, height: 1400 });
  const errs = [];
  page.on('pageerror', (e) => errs.push(e.message));
  page.on('console', (m) => { if (m.type() === 'error') errs.push(m.text()); });
  await page.goto(`${base}/slide.html?n=${n}&capture`, { waitUntil: 'load' });
  await page.waitForFunction('window.__ready === true', { timeout: 30000 });
  return { page, errs };
}

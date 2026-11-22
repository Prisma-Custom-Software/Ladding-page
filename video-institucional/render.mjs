#!/usr/bin/env node
// Render do reel institucional da Prisma.
//
// Abre index.html num Chrome headless, chama window.seek(t) quadro a quadro e
// tira um screenshot de cada quadro. Nada depende do relógio do navegador.
//
// Uso (a partir da raiz do projeto):
//   node video-institucional/render.mjs --fmt 16x9 --stills 2.4,5.6     -> PNGs soltos
//   node video-institucional/render.mjs --fmt 16x9 --contact            -> folha de contato (1 quadro por batida)
//   node video-institucional/render.mjs --fmt 16x9 --video              -> MP4 final com a trilha
//
// A trilha (out/trilha.wav) é gerada antes por: python3 video-institucional/music.py

import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, '..');
const OUT = path.join(HERE, 'out');
const require = createRequire(path.join(ROOT, 'tools/visual/package.json'));
const puppeteer = require('puppeteer-core');

const args = process.argv.slice(2);
const opt = (k, d) => { const i = args.indexOf('--' + k); return i < 0 ? d : args[i + 1] && !args[i + 1].startsWith('--') ? args[i + 1] : true; };
const FMT = opt('fmt', '16x9');
const [W, H] = FMT === '9x16' ? [1080, 1920] : [1920, 1080];
const TL = JSON.parse(fs.readFileSync(path.join(HERE, 'timeline.json'), 'utf8'));
fs.mkdirSync(OUT, { recursive: true });

const MIME = { '.html': 'text/html', '.json': 'application/json', '.woff2': 'font/woff2', '.png': 'image/png', '.js': 'text/javascript', '.css': 'text/css' };
const server = http.createServer((req, res) => {
  const p = path.join(ROOT, decodeURIComponent(new URL(req.url, 'http://x').pathname));
  if (!p.startsWith(ROOT) || !fs.existsSync(p) || fs.statSync(p).isDirectory()) { res.writeHead(404); return res.end(); }
  res.writeHead(200, { 'Content-Type': MIME[path.extname(p)] || 'application/octet-stream' });
  fs.createReadStream(p).pipe(res);
});
await new Promise(r => server.listen(0, '127.0.0.1', r));
const PORT = server.address().port;

const browser = await puppeteer.launch({
  executablePath: '/usr/bin/google-chrome',
  headless: true,
  args: ['--hide-scrollbars', '--font-render-hinting=none', '--disable-gpu-vsync', '--force-color-profile=srgb'],
});
const page = await browser.newPage();
await page.setViewport({ width: W, height: H, deviceScaleFactor: 1 });
page.on('console', m => { if (m.type() === 'error') console.error('[page]', m.text()); });
page.on('pageerror', e => console.error('[page error]', e.message));
await page.goto(`http://127.0.0.1:${PORT}/video-institucional/index.html?fmt=${FMT}`, { waitUntil: 'networkidle0' });
await page.evaluate(() => window.__ready);

async function frameAt(t) {
  await page.evaluate(tt => window.seek(tt), t);
  return page.screenshot({ type: 'png', clip: { x: 0, y: 0, width: W, height: H } });
}

try {
  if (opt('stills')) {
    for (const s of String(opt('stills')).split(',')) {
      const f = path.join(OUT, `still-${FMT}-${s}.png`);
      fs.writeFileSync(f, await frameAt(+s));
      console.log(f);
    }
  }
  if (opt('contact')) {
    const dir = path.join(OUT, 'contato', FMT); fs.mkdirSync(dir, { recursive: true });
    for (let i = 0; i < TL.contact.length; i++) {
      const f = path.join(dir, `${String(i + 1).padStart(2, '0')}.png`);
      fs.writeFileSync(f, await frameAt(TL.contact[i]));
    }
    console.log(dir);
  }
  if (opt('video')) {
    const wav = path.join(OUT, 'trilha.wav');
    const mp4 = path.join(OUT, `prisma-institucional-${FMT}.mp4`);
    const ff = spawn('ffmpeg', [
      '-y', '-v', 'error',
      '-f', 'image2pipe', '-framerate', String(TL.fps), '-c:v', 'png', '-i', '-',
      ...(fs.existsSync(wav) ? ['-i', wav, '-c:a', 'aac', '-b:a', '256k'] : []),
      '-c:v', 'libx264', '-preset', 'slow', '-crf', '16', '-pix_fmt', 'yuv420p',
      '-color_primaries', 'bt709', '-color_trc', 'bt709', '-colorspace', 'bt709',
      '-movflags', '+faststart', '-t', String(TL.duration), mp4,
    ], { stdio: ['pipe', 'inherit', 'inherit'] });
    const N = Math.round(TL.duration * TL.fps);
    for (let f = 0; f < N; f++) {
      const buf = await frameAt(f / TL.fps);
      if (!ff.stdin.write(buf)) await new Promise(r => ff.stdin.once('drain', r));
      if (f % 60 === 0) process.stdout.write(`  ${FMT} quadro ${f}/${N}\n`);
    }
    ff.stdin.end();
    await new Promise((res, rej) => ff.on('close', c => (c === 0 ? res() : rej(new Error('ffmpeg ' + c)))));
    console.log(mp4);
  }
} finally {
  await browser.close();
  server.close();
}

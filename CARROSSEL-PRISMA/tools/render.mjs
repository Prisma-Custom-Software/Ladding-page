// Render slides to MP4: node tools/render.mjs [1,2,...]
// frames: canvas → PNG → ffmpeg (H.264 yuv420p, 30 fps, 8 s); audio: Web Audio offline render → WAV → AAC.
import fs from 'node:fs';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { ROOT, serve, browser, openSlide } from './lib.mjs';

const FPS = 30, DUR = 8, N = FPS * DUR;
const which = (process.argv[2] || '1,2,3,4,5,6').split(',').map(Number);
const OUT = path.join(ROOT, 'out');
fs.mkdirSync(OUT, { recursive: true });

const { srv, base } = await serve();
const br = await browser();
for (const n of which) {
  const t0 = Date.now();
  const { page, errs } = await openSlide(br, base, n);
  const wav = path.join(OUT, `.audio-0${n}.wav`);
  fs.writeFileSync(wav, Buffer.from(await page.evaluate(() => window.__audio()), 'base64'));
  const mp4 = path.join(OUT, `slide-0${n}.mp4`);
  const ff = spawn('ffmpeg', ['-y', '-loglevel', 'error',
    '-f', 'image2pipe', '-framerate', String(FPS), '-c:v', 'png', '-i', '-',
    '-i', wav,
    '-map', '0:v', '-map', '1:a',
    '-c:v', 'libx264', '-preset', 'slow', '-crf', '15', '-pix_fmt', 'yuv420p', '-profile:v', 'high', '-level', '4.1',
    '-color_primaries', 'bt709', '-color_trc', 'bt709', '-colorspace', 'bt709', '-color_range', 'tv',
    '-x264-params', 'keyint=30:min-keyint=30',
    '-c:a', 'aac', '-b:a', '192k', '-ar', '48000',
    '-t', String(DUR), '-movflags', '+faststart', mp4], { stdio: ['pipe', 'inherit', 'inherit'] });
  const done = new Promise((res, rej) => ff.on('close', (c) => (c ? rej(new Error('ffmpeg ' + c)) : res())));
  for (let f = 0; f < N; f++) {
    const url = await page.evaluate((t) => window.__frame(t), f / FPS);
    const buf = Buffer.from(url.slice(url.indexOf(',') + 1), 'base64');
    if (!ff.stdin.write(buf)) await new Promise((r) => ff.stdin.once('drain', r));
    if (f % 60 === 0) process.stdout.write(`slide ${n}: ${f}/${N}\r`);
  }
  ff.stdin.end();
  await done;
  // loop seam check: mean abs diff of the wrap (last→first) vs a typical adjacent pair
  const seam = await page.evaluate(() => {
    const c = document.getElementById('c');
    const g = c.getContext('2d', { willReadFrequently: true });
    const grab = (t) => { window.__draw(t); return g.getImageData(0, 0, c.width, c.height).data; };
    const d = (a, b) => { let s = 0; for (let i = 0; i < a.length; i += 16) s += Math.abs(a[i] - b[i]) + Math.abs(a[i + 1] - b[i + 1]) + Math.abs(a[i + 2] - b[i + 2]); return s / (a.length / 16) / 3; };
    const last = grab(239 / 30), first = grab(0), mid1 = grab(100 / 30), mid2 = grab(101 / 30), pre = grab(238 / 30);
    return { wrap: d(last, first), endPair: d(pre, last), typical: d(mid1, mid2) };
  });
  fs.unlinkSync(wav);
  await page.close();
  console.log(`slide ${n}: ${mp4}  ${((Date.now() - t0) / 1000).toFixed(0)}s  seam wrap=${seam.wrap.toFixed(2)} endPair=${seam.endPair.toFixed(2)} typical=${seam.typical.toFixed(2)}${errs.length ? '  ERR: ' + [...new Set(errs)].join(' | ') : ''}`);
}
await br.close();
srv.close();

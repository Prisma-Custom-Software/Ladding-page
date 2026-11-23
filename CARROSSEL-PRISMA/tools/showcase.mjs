// Website showcase (16:9, 48 s): node tools/showcase.mjs [--frames 3,7.75,...]
// → out/carrossel-vitrine.mp4 (master), the card loop in ../src/assets/video/carrossel.{mp4,webm} + poster,
// and the per-slide web MP4s + posters in ../src/assets/carrossel/ (needs out/slide-0N.mp4 from render.mjs).
import fs from 'node:fs';
import path from 'node:path';
import { spawn, execFileSync } from 'node:child_process';
import { ROOT, serve, browser } from './lib.mjs';

const FPS = 30;
const OUT = path.join(ROOT, 'out');
const SITE = path.join(ROOT, '..', 'src', 'assets', 'video');
const { srv, base } = await serve();
const br = await browser();
const page = await br.newPage();
await page.setViewport({ width: 1940, height: 1100 });
await page.goto(`${base}/showcase.html?capture`, { waitUntil: 'load' });
await page.waitForFunction('window.__ready === true', { timeout: 60000 });
const frameArg = process.argv.indexOf('--frames');
if (frameArg > 0) {
  for (const t of process.argv[frameArg + 1].split(',').map(Number)) {
    const url = await page.evaluate((t) => window.__frame(t), t);
    const f = path.join(OUT, `vitrine-${t}.png`);
    fs.writeFileSync(f, Buffer.from(url.split(',')[1], 'base64'));
    console.log(f);
  }
} else {
  const total = await page.evaluate(() => window.__total);
  const wav = path.join(OUT, '.vitrine.wav');
  fs.writeFileSync(wav, Buffer.from(await page.evaluate(() => window.__audio()), 'base64'));
  const master = path.join(OUT, 'carrossel-vitrine.mp4');
  const ff = spawn('ffmpeg', ['-y', '-loglevel', 'error', '-f', 'image2pipe', '-framerate', String(FPS), '-c:v', 'png', '-i', '-', '-i', wav,
    '-map', '0:v', '-map', '1:a', '-c:v', 'libx264', '-preset', 'slow', '-crf', '16', '-pix_fmt', 'yuv420p',
    '-color_primaries', 'bt709', '-color_trc', 'bt709', '-colorspace', 'bt709', '-c:a', 'aac', '-b:a', '256k', '-t', String(total), '-movflags', '+faststart', master],
    { stdio: ['pipe', 'inherit', 'inherit'] });
  const done = new Promise((res, rej) => ff.on('close', (c) => (c ? rej(new Error('ffmpeg ' + c)) : res())));
  const N = total * FPS;
  for (let f = 0; f < N; f++) {
    const url = await page.evaluate((t) => window.__frame(t), f / FPS);
    if (!ff.stdin.write(Buffer.from(url.slice(url.indexOf(',') + 1), 'base64'))) await new Promise((r) => ff.stdin.once('drain', r));
    if (f % 150 === 0) console.log(`vitrine ${f}/${N}`);
  }
  ff.stdin.end();
  await done;
  fs.unlinkSync(wav);
  // web encodes for the project card (small, muted loop; the viewer opens the interactive carousel instead)
  const run = (args) => execFileSync('ffmpeg', ['-y', '-loglevel', 'error', ...args], { stdio: 'inherit' });
  run(['-i', master, '-vf', 'scale=960:540:flags=lanczos', '-c:v', 'libx264', '-preset', 'slow', '-crf', '28', '-maxrate', '700k', '-bufsize', '1400k', '-pix_fmt', 'yuv420p',
    '-color_primaries', 'bt709', '-color_trc', 'bt709', '-colorspace', 'bt709', '-an', '-movflags', '+faststart', path.join(SITE, 'carrossel.mp4')]);
  run(['-i', master, '-vf', 'scale=960:540:flags=lanczos', '-c:v', 'libvpx-vp9', '-crf', '40', '-b:v', '600k', '-maxrate', '800k', '-bufsize', '1600k', '-row-mt', '1', '-deadline', 'good', '-cpu-used', '3', '-an', path.join(SITE, 'carrossel.webm')]);
  run(['-ss', '6.3', '-i', master, '-frames:v', '1', '-vf', 'scale=960:540:flags=lanczos', '-c:v', 'libwebp', '-quality', '80', path.join(SITE, 'carrossel-poster.webp')]);
  // one 720x900 MP4 + poster per slide for the interactive carousel in the project viewer
  const SL = path.join(ROOT, '..', 'src', 'assets', 'carrossel');
  fs.mkdirSync(SL, { recursive: true });
  const HERO = [6.3, 6.5, 4.5, 5.0, 5.0, 5.0];
  for (let n = 1; n <= 6; n++) {
    const src = path.join(OUT, `slide-0${n}.mp4`);
    run(['-i', src, '-vf', 'scale=720:900:flags=lanczos', '-c:v', 'libx264', '-preset', 'slow', '-crf', '27', '-maxrate', '1500k', '-bufsize', '3000k', '-pix_fmt', 'yuv420p',
      '-color_primaries', 'bt709', '-color_trc', 'bt709', '-colorspace', 'bt709', '-c:a', 'aac', '-b:a', '128k', '-t', '8', '-movflags', '+faststart', path.join(SL, `slide-0${n}.mp4`)]);
    run(['-ss', String(HERO[n - 1]), '-i', src, '-frames:v', '1', '-vf', 'scale=720:900:flags=lanczos', '-c:v', 'libwebp', '-quality', '78', path.join(SL, `slide-0${n}-poster.webp`)]);
  }
  console.log('ok', master);
}
await br.close();
srv.close();

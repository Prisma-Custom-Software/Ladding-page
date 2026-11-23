// After render: out/carrossel-completo.mp4 (6 slides in sequence) + out/panorama.png (seams side by side)
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { ROOT, serve, browser, openSlide } from './lib.mjs';
const OUT = path.join(ROOT, 'out');
const list = path.join(OUT, '.concat.txt');
fs.writeFileSync(list, [1, 2, 3, 4, 5, 6].map((n) => `file 'slide-0${n}.mp4'`).join('\n'));
execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-f', 'concat', '-safe', '0', '-i', list, '-c', 'copy', '-movflags', '+faststart', path.join(OUT, 'carrossel-completo.mp4')]);
fs.unlinkSync(list);
const t = +(process.argv[2] || 5.2);
const { srv, base } = await serve();
const br = await browser();
const { page } = await openSlide(br, base, 1);
const url = await page.evaluate((t) => {
  const pano = document.createElement('canvas');
  pano.width = 3240; pano.height = 675;
  const g = pano.getContext('2d');
  for (let n = 1; n <= 6; n++) {
    const c = document.createElement('canvas');
    c.width = P.W; c.height = P.H;
    P.stage(c, P.SLIDES[n]).draw(t);
    g.drawImage(c, (n - 1) * 540, 0, 540, 675);
  }
  return pano.toDataURL('image/png');
}, t);
fs.writeFileSync(path.join(OUT, 'panorama.png'), Buffer.from(url.split(',')[1], 'base64'));
console.log('ok');
await br.close(); srv.close();

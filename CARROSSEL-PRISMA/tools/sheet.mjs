// Contact sheet: node tools/sheet.mjs <n> [t1,t2,...]  -> out/sheet-0n.png (+ prints page errors)
import fs from 'node:fs';
import path from 'node:path';
import { ROOT, serve, browser, openSlide } from './lib.mjs';

const n = +(process.argv[2] || 1);
const times = (process.argv[3] || '0,0.5,1,1.5,2,2.5,3,3.5,4,4.5,5,5.5,6,6.5,7,7.5,7.75,7.95').split(',').map(Number);
const cols = +(process.argv[4] || 6);
const { srv, base } = await serve();
const br = await browser();
const { page, errs } = await openSlide(br, base, n);
const url = await page.evaluate(async (times, cols) => {
  const src = document.getElementById('c');
  const w = 360, h = 450, rows = Math.ceil(times.length / cols);
  const sh = document.createElement('canvas');
  sh.width = cols * w; sh.height = rows * (h + 24);
  const g = sh.getContext('2d');
  g.fillStyle = '#222'; g.fillRect(0, 0, sh.width, sh.height);
  times.forEach((t, i) => {
    window.__draw(t);
    const x = (i % cols) * w, y = Math.floor(i / cols) * (h + 24);
    g.drawImage(src, x, y + 24, w, h);
    g.fillStyle = '#fff'; g.font = '16px monospace'; g.fillText('t=' + t.toFixed(2), x + 6, y + 17);
  });
  return sh.toDataURL('image/png');
}, times, cols);
const out = path.join(ROOT, 'out', `sheet-0${n}.png`);
fs.writeFileSync(out, Buffer.from(url.split(',')[1], 'base64'));
console.log(out, errs.length ? '\nERRORS:\n' + [...new Set(errs)].join('\n') : 'no errors');
await br.close(); srv.close();

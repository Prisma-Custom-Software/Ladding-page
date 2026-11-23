// Single full-res frame: node tools/frame.mjs <n> <t>  -> out/frame-0n-<t>.png
import fs from 'node:fs';
import path from 'node:path';
import { ROOT, serve, browser, openSlide } from './lib.mjs';
const n = +process.argv[2], ts = process.argv[3].split(',').map(Number);
const { srv, base } = await serve();
const br = await browser();
const { page, errs } = await openSlide(br, base, n);
for (const t of ts) {
  const url = await page.evaluate((t) => window.__frame(t), t);
  const out = path.join(ROOT, 'out', `frame-0${n}-${t}.png`);
  fs.writeFileSync(out, Buffer.from(url.split(',')[1], 'base64'));
  console.log(out);
}
if (errs.length) console.log('ERRORS:\n' + [...new Set(errs)].join('\n'));
await br.close(); srv.close();

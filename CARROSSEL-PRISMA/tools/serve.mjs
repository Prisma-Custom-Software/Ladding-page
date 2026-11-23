// Local preview server: node tools/serve.mjs  → open the printed URL (carrossel.html)
import { serve } from './lib.mjs';
const { base } = await serve();
console.log(`${base}/carrossel.html\n${base}/slide.html?n=1`);

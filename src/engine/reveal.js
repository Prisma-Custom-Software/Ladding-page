// Revelacao de texto linha a linha via clip-path + posicao do cursor (porte 1:1 de reveal() do modelo).
// Devolve [x, yCentroDaLinha, alturaDaLinha] em coordenadas de viewport, ou null.
export function reveal(el, u) {
  if (!el) return null;
  if (u >= 1) {
    el.style.clipPath = 'none';
    return null;
  }
  const er = el.getBoundingClientRect();
  const rg = document.createRange();
  rg.selectNodeContents(el);
  const lines = [];
  for (const r of rg.getClientRects()) {
    if (r.width < 1) continue;
    const L = lines.find((l) => Math.abs(l.t - r.top) < 6 || (r.top >= l.t && r.bottom <= l.b + 2));
    if (L) {
      L.l = Math.min(L.l, r.left);
      L.r = Math.max(L.r, r.right);
      L.t = Math.min(L.t, r.top);
      L.b = Math.max(L.b, r.bottom);
    } else lines.push({ l: r.left, r: r.right, t: r.top, b: r.bottom });
  }
  if (!lines.length) return null;
  lines.sort((a, b) => a.t - b.t);
  const total = lines.reduce((s, l) => s + l.r - l.l, 0);
  let target = u * total;
  let ci = 0;
  let cur = lines[0];
  let x = cur.l;
  for (let i = 0; i < lines.length; i++) {
    const L = lines[i];
    const w = L.r - L.l;
    cur = L;
    ci = i;
    if (target <= w) {
      x = L.l + target;
      break;
    }
    target -= w;
    x = L.r;
  }
  const prev = lines[ci - 1];
  const next = lines[ci + 1];
  const top = prev ? (prev.b + cur.t) / 2 : cur.t;
  const bot = next ? (cur.b + next.t) / 2 : cur.b + 4;
  const X = x - er.left;
  const Tp = top - er.top;
  const B = bot - er.top;
  const W = er.width + 30;
  el.style.clipPath =
    u <= 0
      ? 'polygon(0 0,0 0,0 0)'
      : `polygon(-30px -30px, ${W}px -30px, ${W}px ${Tp}px, ${X}px ${Tp}px, ${X}px ${B}px, -30px ${B}px)`;
  return [x, (cur.t + cur.b) / 2, cur.b - cur.t];
}

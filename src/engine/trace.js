// Ponto percorrendo o contorno de um elemento e desenho do contorno (porte 1:1 do modelo).

// Pura: ponto no perimetro do retangulo {left,top,right,bottom,width,height} para u (0..1).
export function tracePtRect(r, u) {
  let d = u * 2 * (r.width + r.height);
  if (d < r.width) return [r.left + d, r.top];
  d -= r.width;
  if (d < r.height) return [r.right, r.top + d];
  d -= r.height;
  if (d < r.width) return [r.right - d, r.bottom];
  d -= r.width;
  return [r.left, r.bottom - d];
}

export function tracePt(el, u) {
  if (!el) return null;
  return tracePtRect(el.getBoundingClientRect(), u);
}

export function drawTrace(ctx, el, u, alpha, light) {
  if (!el || u <= 0 || alpha <= 0.01) return;
  const r = el.getBoundingClientRect();
  if (r.bottom < -20 || r.top > innerHeight + 20) return;
  const pts = [
    [r.left, r.top],
    [r.right, r.top],
    [r.right, r.bottom],
    [r.left, r.bottom],
    [r.left, r.top],
  ];
  let left = u * 2 * (r.width + r.height);
  ctx.save();
  ctx.strokeStyle = light ? `rgba(11,18,32,${alpha})` : `rgba(184,255,58,${alpha})`;
  ctx.lineWidth = 1.4;
  ctx.shadowColor = '#B8FF3A';
  ctx.shadowBlur = light ? 6 : 10;
  ctx.beginPath();
  ctx.moveTo(pts[0][0], pts[0][1]);
  for (let i = 1; i < 5 && left > 0; i++) {
    const [ax, ay] = pts[i - 1];
    const [bx, by] = pts[i];
    const L = Math.hypot(bx - ax, by - ay);
    const k = Math.min(1, left / L);
    ctx.lineTo(ax + (bx - ax) * k, ay + (by - ay) * k);
    left -= L;
  }
  ctx.stroke();
  ctx.restore();
}

/* Prisma carousel engine — drawing primitives: robots, 3D prism, shards, FX, background, HUD, belt, text. */
(function (G) {
  const P = G.P;
  const { W, H, C, clamp, lerp, ease: E } = P;

  // ---------- path helpers ----------
  P.rr = (ctx, x, y, w, h, r) => {
    r = Math.max(0, Math.min(r, Math.abs(w) / 2, Math.abs(h) / 2));
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  };
  P.poly = (ctx, pts) => {
    ctx.beginPath();
    pts.forEach((p, i) => (i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1])));
    ctx.closePath();
  };
  P.glow = (ctx, color, blur) => {
    ctx.shadowColor = color;
    ctx.shadowBlur = blur;
  };
  P.noGlow = (ctx) => {
    ctx.shadowColor = 'transparent';
    ctx.shadowBlur = 0;
  };
  P.radial = (ctx, x, y, r, color, a) => {
    const g = ctx.createRadialGradient(x, y, 0, x, y, r);
    g.addColorStop(0, P.rgba(color, a));
    g.addColorStop(1, P.rgba(color, 0));
    ctx.fillStyle = g;
    ctx.fillRect(x - r, y - r, r * 2, r * 2);
  };

  // ---------- offscreen layer: draw fn once, composite once with a filter (canvas filters are per-op and slow) ----------
  const pool = [];
  let depth = 0;
  P.offscreen = (ctx, box, filter, fn, pad = 24) => {
    const m = ctx.getTransform();
    const pts = [[box[0], box[1]], [box[2], box[1]], [box[0], box[3]], [box[2], box[3]]].map(([x, y]) => [m.a * x + m.c * y + m.e, m.b * x + m.d * y + m.f]);
    const cw = ctx.canvas.width, ch = ctx.canvas.height;
    const bx = Math.max(0, Math.floor(Math.min(...pts.map((p) => p[0])) - pad)), by = Math.max(0, Math.floor(Math.min(...pts.map((p) => p[1])) - pad));
    const ex = Math.min(cw, Math.ceil(Math.max(...pts.map((p) => p[0])) + pad)), ey = Math.min(ch, Math.ceil(Math.max(...pts.map((p) => p[1])) + pad));
    if (ex <= bx || ey <= by) return;
    const c = pool[depth] || (pool[depth] = document.createElement('canvas'));
    depth++;
    if (c.width < ex - bx || c.height < ey - by) {
      c.width = Math.max(c.width, ex - bx);
      c.height = Math.max(c.height, ey - by);
    }
    const g = c.getContext('2d');
    g.setTransform(1, 0, 0, 1, 0, 0);
    g.clearRect(0, 0, ex - bx, ey - by);
    g.globalAlpha = 1;
    g.globalCompositeOperation = 'source-over';
    g.filter = 'none';
    g.setTransform(m.a, m.b, m.c, m.d, m.e - bx, m.f - by);
    fn(g);
    depth--;
    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.filter = filter;
    ctx.drawImage(c, 0, 0, ex - bx, ey - by, bx, by, ex - bx, ey - by);
    ctx.restore();
  };

  // ---------- text ----------
  P.font = (size, fam = 'Oswald', w = 700, style = '') => `${style} ${w} ${size}px "${fam}"`.trim();
  const capCache = {};
  P.capH = (ctx, size, fam = 'Oswald', w = 700) => {
    const k = fam + w;
    if (!capCache[k]) {
      ctx.save();
      ctx.font = P.font(100, fam, w);
      capCache[k] = ctx.measureText('H').actualBoundingBoxAscent / 100;
      ctx.restore();
    }
    return capCache[k] * size;
  };
  /** lay out a line of text, centered on cx. returns chars with center x and width */
  P.layout = (ctx, str, size, { fam = 'Oswald', w = 700, track = 0, cx = W / 2, align = 'center' } = {}) => {
    ctx.save();
    ctx.font = P.font(size, fam, w);
    const chars = [];
    let x = 0;
    for (const ch of str) {
      const cw = ctx.measureText(ch).width;
      chars.push({ ch, x: x + cw / 2, w: cw });
      x += cw + track * size;
    }
    const width = x - track * size;
    const x0 = align === 'center' ? cx - width / 2 : align === 'right' ? cx - width : cx;
    chars.forEach((c) => (c.x += x0));
    ctx.restore();
    return { chars, width, size, fam, w, x0, cap: P.capH(ctx, size, fam, w) };
  };
  /** draw a single glyph centered at (x, y=cap middle) */
  P.glyph = (ctx, ch, size, fam = 'Oswald', w = 700, cap) => {
    ctx.font = P.font(size, fam, w);
    ctx.textAlign = 'center';
    ctx.textBaseline = 'alphabetic';
    ctx.fillText(ch, 0, cap / 2);
  };

  // ---------- background ----------
  const dust = [];
  {
    const r = P.rng(77);
    for (let i = 0; i < 90; i++) dust.push({ x: r() * W, y: r() * H, s: 0.6 + r() * 2.2, a: 0.15 + r() * 0.5, k: 1 + (r() * 2) | 0, tw: r() });
  }
  P.bg = (ctx, t, cam, n, opt = {}) => {
    ctx.fillStyle = C.ink;
    ctx.fillRect(0, 0, W, H);
    ctx.save();
    P.applyCam(ctx, cam, 0.25);
    // orbiting colour glows
    const gx = W * 0.22 + P.osc(t, 1) * 140, gy = H * 0.28 + P.osc(t, 1, 0.25) * 90;
    P.radial(ctx, gx, gy, 760, opt.glowA || C.lilac, opt.glowAa ?? 0.2);
    P.radial(ctx, W * 0.82 - P.osc(t, 1, 0.5) * 120, H * 0.78 + P.osc(t, 1, 0.1) * 70, 640, opt.glowB || C.lime, opt.glowBa ?? 0.1);
    P.radial(ctx, W * 0.5, H * 1.05, 700, C.violet, 0.2);
    ctx.restore();

    // blueprint grid in global coordinates (continuous across the seams), two parallax layers
    ctx.save();
    P.applyCam(ctx, cam, 0.35);
    const scroll = P.phase(t, 2) * 90;
    ctx.lineWidth = 1;
    ctx.strokeStyle = P.rgba(C.lilac, 0.07);
    ctx.beginPath();
    for (let x = -90; x <= W + 90; x += 90) {
      ctx.moveTo(x, -100);
      ctx.lineTo(x, H + 100);
    }
    for (let y = -90 - scroll; y <= H + 90; y += 90) {
      ctx.moveTo(-100, y);
      ctx.lineTo(W + 100, y);
    }
    ctx.stroke();
    ctx.fillStyle = P.rgba(C.lilac, 0.22);
    for (let x = 0; x <= W; x += 90)
      for (let y = -scroll; y <= H + 90; y += 90) ctx.fillRect(x - 2, y - 2, 4, 4);
    ctx.restore();

    // giant outline numeral (far layer)
    ctx.save();
    P.applyCam(ctx, cam, 0.15);
    ctx.font = P.font(980, 'Oswald', 700);
    ctx.textAlign = 'right';
    ctx.textBaseline = 'alphabetic';
    ctx.lineWidth = 3;
    ctx.strokeStyle = P.rgba(opt.numColor || C.lilac, 0.09);
    ctx.strokeText('0' + n, W + 60 + P.osc(t, 1, 0.3) * 30, H - 120 + P.osc(t, 2) * 14);
    ctx.restore();

    // dust (slow, mid-far)
    ctx.save();
    P.applyCam(ctx, cam, 0.45);
    for (const d of dust) {
      const y = (((d.y - P.phase(t, d.k) * H) % H) + H) % H;
      const tw = 0.5 + 0.5 * Math.sin(P.TAU * (P.phase(t, 4) + d.tw));
      ctx.fillStyle = P.rgba(d.k > 1 ? C.lime : C.paper, d.a * tw * 0.6);
      ctx.fillRect(d.x + P.osc(t, 1, d.tw) * 12, y, d.s, d.s);
    }
    ctx.restore();
  };

  // ---------- foreground ----------
  const bokeh = [];
  {
    const r = P.rng(4242);
    for (let i = 0; i < 12; i++)
      bokeh.push({ x: r() * W, y: r() * H, r: 26 + r() * 80, a: 0.05 + r() * 0.08, c: [C.lilac, C.lime, C.lilacSoft][i % 3], k: 1 + ((r() * 2) | 0), o: r() });
  }
  P.front = (ctx, t, cam, opt = {}) => {
    ctx.save();
    P.applyCam(ctx, cam, 1.7);
    ctx.globalCompositeOperation = 'lighter';
    for (const b of bokeh) {
      const y = ((((b.y - P.phase(t, b.k) * (H + 300)) % (H + 300)) + H + 300) % (H + 300)) - 150;
      P.radial(ctx, b.x + P.osc(t, 1, b.o) * 40, y, b.r, b.c, b.a * (opt.bokeh ?? 1));
    }
    ctx.restore();
  };

  // grain tiles (deterministic)
  let grainTiles = null;
  P.grain = (ctx, t, amt = 0.07) => {
    if (!grainTiles) {
      grainTiles = [];
      const r = P.rng(9);
      for (let k = 0; k < 6; k++) {
        const c = document.createElement('canvas');
        c.width = c.height = 256;
        const g = c.getContext('2d');
        const id = g.createImageData(256, 256);
        for (let i = 0; i < id.data.length; i += 4) {
          const v = (r() * 255) | 0;
          id.data[i] = id.data[i + 1] = id.data[i + 2] = v;
          id.data[i + 3] = 255;
        }
        g.putImageData(id, 0, 0);
        grainTiles.push(c);
      }
    }
    const f = Math.round(t * P.FPS) % (P.DUR * P.FPS);
    const tile = grainTiles[f % 6];
    ctx.save();
    ctx.globalAlpha = amt;
    ctx.globalCompositeOperation = 'overlay';
    const ox = (P.hash(f, 3) * 256) | 0, oy = (P.hash(f, 5) * 256) | 0;
    for (let x = -ox; x < W; x += 256) for (let y = -oy; y < H; y += 256) ctx.drawImage(tile, x, y);
    ctx.restore();
  };
  P.vignette = (ctx, amt = 0.65) => {
    const g = ctx.createRadialGradient(W / 2, H / 2, H * 0.3, W / 2, H / 2, H * 0.78);
    g.addColorStop(0, 'rgba(4,7,14,0)');
    g.addColorStop(1, `rgba(4,7,14,${amt})`);
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);
  };
  P.flash = (ctx, a, color = '#ffffff') => {
    if (a <= 0.004) return;
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    ctx.fillStyle = P.rgba(color, clamp(a));
    ctx.fillRect(0, 0, W, H);
    ctx.restore();
  };

  // ---------- 3D prism (from the official symbol) ----------
  // Vertices traced from brand/prisma-simbolo.png (1975×1876 view), normalised; z added for depth.
  const IMG = { A: [1165, 62], B: [62, 1360], C: [1222, 1163], D: [1912, 1506], E: [1203, 1812], h1: [1085, 415], h2: [455, 1183], h3: [1125, 1026] };
  const n2 = (p) => [(p[0] - 987) / 1750, (p[1] - 937) / 1750];
  const V = {
    A: [...n2(IMG.A), -0.1],
    B: [...n2(IMG.B), 0.0],
    C: [...n2(IMG.C), 0.42],
    D: [...n2(IMG.D), -0.05],
    E: [...n2(IMG.E), 0.06],
  };
  // barycentric coords of the hole inside face ABC
  const bary = (p, a, b, c) => {
    const v0 = [b[0] - a[0], b[1] - a[1]], v1 = [c[0] - a[0], c[1] - a[1]], v2 = [p[0] - a[0], p[1] - a[1]];
    const d = v0[0] * v1[1] - v1[0] * v0[1];
    const v = (v2[0] * v1[1] - v1[0] * v2[1]) / d, w = (v0[0] * v2[1] - v2[0] * v0[1]) / d;
    return [1 - v - w, v, w];
  };
  const HOLE = ['h1', 'h2', 'h3'].map((k) => bary(IMG[k], IMG.A, IMG.B, IMG.C));
  P.PRISM_COLORS = { lime: '#9ef150', lilac: '#7b6cff', green: '#5fd08a', violet: '#4b39d9', back1: '#3a2bb0', back2: '#2f9a63' };
  const FACES = [
    { v: ['A', 'B', 'C'], c: P.PRISM_COLORS.lime, hole: true, id: 0 },
    { v: ['A', 'C', 'D'], c: P.PRISM_COLORS.lilac, id: 1 },
    { v: ['B', 'E', 'C'], c: P.PRISM_COLORS.green, id: 2 },
    { v: ['C', 'E', 'D'], c: P.PRISM_COLORS.violet, id: 3 },
    { v: ['A', 'D', 'B'], c: P.PRISM_COLORS.back1, id: 4 },
    { v: ['B', 'D', 'E'], c: P.PRISM_COLORS.back2, id: 5 },
  ];
  const PIVOT = [0.04, 0.0, 0.08];
  const sub = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
  const cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
  const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
  const norm = (a) => {
    const l = Math.hypot(a[0], a[1], a[2]) || 1;
    return [a[0] / l, a[1] / l, a[2] / l];
  };
  const solidC = [0, 1, 2].map((i) => (V.A[i] + V.B[i] + V.C[i] + V.D[i] + V.E[i]) / 5);
  FACES.forEach((f) => {
    const [a, b, c] = f.v.map((k) => V[k]);
    let nrm = norm(cross(sub(b, a), sub(c, a)));
    const fc = [0, 1, 2].map((i) => (a[i] + b[i] + c[i]) / 3);
    if (dot(nrm, sub(fc, solidC)) < 0) nrm = nrm.map((x) => -x);
    f.n = nrm;
  });
  const LIGHT = norm([-0.45, -0.6, 0.65]);
  const rot3 = (p, rx, ry, rz) => {
    let [x, y, z] = p;
    let c = Math.cos(ry), s = Math.sin(ry);
    [x, z] = [x * c + z * s, -x * s + z * c];
    c = Math.cos(rx); s = Math.sin(rx);
    [y, z] = [y * c - z * s, y * s + z * c];
    c = Math.cos(rz); s = Math.sin(rz);
    [x, y] = [x * c - y * s, x * s + y * c];
    return [x, y, z];
  };
  const shadeColor = (hex, k) => (k >= 0 ? P.mixc(hex, '#ffffff', clamp(k * 0.5, 0, 0.28)) : P.mixc(hex, '#05070f', clamp(-k * 1.0, 0, 0.6)));

  /** project the prism; returns visible faces sorted back-to-front with 2D points */
  P.prismFaces = (o) => {
    const { x = W / 2, y = H / 2, size = 400, rx = 0, ry = 0, rz = 0, explode = 0, seed = 3 } = o;
    const proj = (p3) => {
      const r = rot3(sub(p3, PIVOT), rx, ry, rz);
      const k = 1 / (1 - r[2] * 0.28);
      return [x + r[0] * size * k, y + r[1] * size * k, r[2]];
    };
    const out = [];
    for (const f of FACES) {
      const nr = rot3(f.n, rx, ry, rz);
      if (nr[2] <= 0.01) continue;
      let pts = f.v.map((k) => proj(V[k]));
      let hole = null;
      if (f.hole) {
        const [a, b, c] = f.v.map((k) => V[k]);
        hole = HOLE.map((w) => proj([0, 1, 2].map((i) => a[i] * w[0] + b[i] * w[1] + c[i] * w[2])));
      }
      const lightK = dot(nr, LIGHT) - dot(f.n, LIGHT);
      const z = pts.reduce((s, p) => s + p[2], 0) / 3;
      let cx = (pts[0][0] + pts[1][0] + pts[2][0]) / 3, cy = (pts[0][1] + pts[1][1] + pts[2][1]) / 3;
      if (explode) {
        const dx = cx - x, dy = cy - y, l = Math.hypot(dx, dy) || 1;
        const ox = (dx / l) * explode * size * 0.55, oy = (dy / l) * explode * size * 0.55;
        const ang = (P.hash(f.id, seed) - 0.5) * 1.6 * explode;
        const tr = (p) => {
          const px = p[0] - cx, py = p[1] - cy;
          return [cx + ox + px * Math.cos(ang) - py * Math.sin(ang), cy + oy + px * Math.sin(ang) + py * Math.cos(ang), p[2]];
        };
        pts = pts.map(tr);
        if (hole) hole = hole.map(tr);
        cx += ox;
        cy += oy;
      }
      out.push({ id: f.id, pts, hole, color: f.c, fill: shadeColor(f.c, lightK * (o.shade ?? 1)), z, cx, cy, nz: nr[2] });
    }
    out.sort((a, b) => a.z - b.z);
    return out;
  };

  P.drawPrism = (ctx, o) => {
    const faces = P.prismFaces(o);
    const mask = o.faces; // optional array of face alphas by id
    ctx.save();
    if (o.glow) {
      ctx.globalCompositeOperation = 'lighter';
      P.radial(ctx, o.x, o.y, o.size * 1.1, o.glowColor || C.lilac, 0.22 * o.glow);
      ctx.globalCompositeOperation = 'source-over';
    }
    for (const f of faces) {
      const a = (o.alpha ?? 1) * (mask ? mask[f.id] ?? 1 : 1);
      if (a <= 0.01) continue;
      ctx.globalAlpha = a;
      ctx.beginPath();
      f.pts.forEach((p, i) => (i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1])));
      ctx.closePath();
      if (f.hole) {
        ctx.moveTo(f.hole[0][0], f.hole[0][1]);
        ctx.lineTo(f.hole[2][0], f.hole[2][1]);
        ctx.lineTo(f.hole[1][0], f.hole[1][1]);
        ctx.closePath();
      }
      ctx.fillStyle = P.rgba(f.fill);
      ctx.fill('evenodd');
      if (o.heat) {
        ctx.fillStyle = P.rgba('#eaffc0', 0.5 * o.heat);
        ctx.fill('evenodd');
      }
      if (o.edges !== false) {
        ctx.lineJoin = 'round';
        ctx.lineWidth = Math.max(1, o.size * 0.006);
        ctx.strokeStyle = P.rgba('#ffffff', 0.22 + 0.5 * (o.edgeGlow || 0));
        ctx.stroke();
      }
    }
    ctx.restore();
    return faces;
  };

  // ---------- shards ----------
  /** split visible faces into triangular shards (deterministic) */
  P.shatter = (faces, seed = 1, depth = 2) => {
    const r = P.rng(seed);
    const tris = [];
    for (const f of faces) {
      const p = f.pts.map((q) => [q[0], q[1]]);
      if (f.hole) {
        const h = f.hole.map((q) => [q[0], q[1]]);
        // ring between outer [A,B,C] and hole [h1,h2,h3] (h1~A, h2~B, h3~C)
        const quads = [[p[0], p[1], h[1], h[0]], [p[1], p[2], h[2], h[1]], [p[2], p[0], h[0], h[2]]];
        for (const q of quads) {
          tris.push({ pts: [q[0], q[1], q[2]], color: f.fill, id: f.id });
          tris.push({ pts: [q[0], q[2], q[3]], color: f.fill, id: f.id });
        }
      } else tris.push({ pts: p, color: f.fill, id: f.id });
    }
    const split = (tri, d) => {
      if (d <= 0) return [tri];
      const ps = tri.pts;
      let li = 0, ll = 0;
      for (let i = 0; i < 3; i++) {
        const a = ps[i], b = ps[(i + 1) % 3], l = Math.hypot(a[0] - b[0], a[1] - b[1]);
        if (l > ll) { ll = l; li = i; }
      }
      const a = ps[li], b = ps[(li + 1) % 3], c = ps[(li + 2) % 3];
      const k = 0.35 + r() * 0.3;
      const m = [a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k];
      return [...split({ ...tri, pts: [a, m, c] }, d - 1), ...split({ ...tri, pts: [m, b, c] }, d - 1)];
    };
    const out = [];
    for (const t of tris) {
      const area = Math.abs((t.pts[1][0] - t.pts[0][0]) * (t.pts[2][1] - t.pts[0][1]) - (t.pts[2][0] - t.pts[0][0]) * (t.pts[1][1] - t.pts[0][1])) / 2;
      const d = area > 9000 ? depth + 1 : area > 1500 ? depth : Math.max(0, depth - 1);
      out.push(...split(t, d));
    }
    return out.map((s, i) => {
      const cx = (s.pts[0][0] + s.pts[1][0] + s.pts[2][0]) / 3, cy = (s.pts[0][1] + s.pts[1][1] + s.pts[2][1]) / 3;
      return { ...s, cx, cy, rel: s.pts.map((q) => [q[0] - cx, q[1] - cy]), r1: r(), r2: r(), r3: r(), i };
    });
  };
  /** position of a shard tau seconds after the blast */
  P.shardPos = (s, tau, o = {}) => {
    const { ix = W / 2, iy = H / 2, speed = 1, g = 1100, bias = [0, 0] } = o;
    let dx = s.cx - ix, dy = s.cy - iy;
    const l = Math.hypot(dx, dy) || 1;
    dx /= l; dy /= l;
    const a = Math.atan2(dy, dx) + (s.r1 - 0.5) * 0.9;
    const v = (380 + s.r2 * 900) * speed;
    const vx = Math.cos(a) * v + bias[0], vy = Math.sin(a) * v + bias[1] - 260 * speed;
    return {
      x: s.cx + vx * tau,
      y: s.cy + vy * tau + 0.5 * g * tau * tau,
      rot: (s.r3 - 0.5) * 14 * tau,
      tumble: Math.cos(tau * (4 + s.r1 * 9)),
    };
  };
  P.drawShard = (ctx, s, x, y, rot, tumble, alpha = 1, scale = 1, glow = 0) => {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(rot);
    ctx.scale(scale * (0.25 + 0.75 * Math.abs(tumble)), scale);
    ctx.globalAlpha = alpha;
    P.poly(ctx, s.rel);
    // face-on = original colour; edge-on darkens, the back side flashes slightly lighter
    const lightK = tumble >= 0 ? (tumble - 1) * 0.55 : -tumble * 0.25;
    ctx.fillStyle = P.rgba(lightK >= 0 ? P.mixc(s.color, '#ffffff', lightK) : P.mixc(s.color, '#000000', -lightK));
    if (glow) P.glow(ctx, P.rgba(s.color, 0.9), glow);
    ctx.fill();
    P.noGlow(ctx);
    ctx.lineWidth = 1.5;
    ctx.strokeStyle = 'rgba(255,255,255,0.45)';
    ctx.stroke();
    ctx.restore();
  };

  // ---------- cracks ----------
  P.cracks = (ctx, cx, cy, amt, seed = 5, radius = 200, color = '#ffffff') => {
    if (amt <= 0) return;
    const r = P.rng(seed);
    ctx.save();
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    P.glow(ctx, C.lime, 18);
    for (let b = 0; b < 9; b++) {
      let a = (b / 9) * P.TAU + r() * 0.5, x = cx, y = cy;
      const segs = 7, len = radius * (0.55 + r() * 0.6);
      const reveal = clamp(amt * 1.4 - r() * 0.4);
      const nSeg = Math.floor(segs * reveal);
      ctx.beginPath();
      ctx.moveTo(x, y);
      for (let i = 0; i < nSeg; i++) {
        a += (r() - 0.5) * 0.9;
        x += Math.cos(a) * (len / segs);
        y += Math.sin(a) * (len / segs);
        ctx.lineTo(x, y);
      }
      ctx.lineWidth = 5 * (1 - b * 0.05);
      ctx.strokeStyle = color;
      ctx.stroke();
      ctx.lineWidth = 1.5;
      ctx.strokeStyle = C.lime;
      ctx.stroke();
    }
    ctx.restore();
  };

  // ---------- FX ----------
  P.shock = (ctx, x, y, dt, o = {}) => {
    const { r0 = 20, r1 = 520, dur = 0.7, color = C.lime, width = 14, fill = 0.12, squash = 1 } = o;
    if (dt < 0 || dt > dur) return;
    const k = dt / dur, e = E.outExpo(k);
    const r = r0 + (r1 - r0) * e;
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(1, squash);
    ctx.globalCompositeOperation = 'lighter';
    ctx.beginPath();
    ctx.arc(0, 0, r, 0, P.TAU);
    ctx.lineWidth = width * (1 - k) + 1;
    ctx.strokeStyle = P.rgba(color, Math.pow(1 - k, 1.4));
    P.glow(ctx, P.rgba(color, 0.8), 24);
    ctx.stroke();
    if (fill) {
      ctx.fillStyle = P.rgba(color, fill * Math.pow(1 - k, 2));
      ctx.fill();
    }
    ctx.restore();
  };
  /** spark burst: dt seconds after the event */
  P.sparks = (ctx, x, y, dt, o = {}) => {
    const { n = 26, seed = 1, speed = 900, dir = -Math.PI / 2, spread = Math.PI * 2, g = 1600, life = 0.7, color = C.lime, len = 0.035, width = 3 } = o;
    if (dt < 0 || dt > life * 1.4) return;
    const r = P.rng(seed);
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    ctx.lineCap = 'round';
    for (let i = 0; i < n; i++) {
      const a = dir + (r() - 0.5) * spread, v = speed * (0.35 + r() * 0.75), lf = life * (0.5 + r() * 0.7);
      if (dt > lf) { r(); continue; }
      const vx = Math.cos(a) * v, vy = Math.sin(a) * v;
      const px = x + vx * dt, py = y + vy * dt + 0.5 * g * dt * dt;
      const tvx = vx, tvy = vy + g * dt;
      const k = 1 - dt / lf;
      ctx.strokeStyle = P.rgba(r() > 0.3 ? color : '#ffffff', k);
      ctx.lineWidth = width * (0.5 + k);
      ctx.beginPath();
      ctx.moveTo(px, py);
      ctx.lineTo(px - tvx * len, py - tvy * len);
      ctx.stroke();
    }
    ctx.restore();
  };
  /** landing dust ring (flattened puffs) */
  P.dust = (ctx, x, y, dt, o = {}) => {
    const { n = 14, seed = 2, w = 260, life = 0.8, color = '#c9c3ff' } = o;
    if (dt < 0 || dt > life) return;
    const r = P.rng(seed);
    const k = dt / life, e = E.outCubic(k);
    ctx.save();
    for (let i = 0; i < n; i++) {
      const side = i % 2 ? 1 : -1, sp = 0.4 + r() * 0.8, rad = 10 + r() * 26;
      const px = x + side * e * w * sp, py = y - e * 30 * r();
      ctx.fillStyle = P.rgba(color, 0.32 * (1 - k));
      ctx.beginPath();
      ctx.arc(px, py, rad * (0.6 + e), 0, P.TAU);
      ctx.fill();
    }
    ctx.restore();
  };
  /** laser beam from (x1,y1) to (x2,y2) */
  P.laser = (ctx, x1, y1, x2, y2, w, t, color = C.lime, a = 1) => {
    if (a <= 0) return;
    const ang = Math.atan2(y2 - y1, x2 - x1), len = Math.hypot(x2 - x1, y2 - y1);
    ctx.save();
    ctx.translate(x1, y1);
    ctx.rotate(ang);
    ctx.globalCompositeOperation = 'lighter';
    const j = 1 + 0.18 * Math.sin(t * 90) + 0.1 * Math.sin(t * 57);
    const g = ctx.createLinearGradient(0, -w * 3, 0, w * 3);
    g.addColorStop(0, P.rgba(color, 0));
    g.addColorStop(0.5, P.rgba(color, 0.35 * a));
    g.addColorStop(1, P.rgba(color, 0));
    ctx.fillStyle = g;
    ctx.fillRect(0, -w * 3 * j, len, w * 6 * j);
    ctx.fillStyle = P.rgba(color, 0.9 * a);
    ctx.fillRect(0, -w * 0.6 * j, len, w * 1.2 * j);
    ctx.fillStyle = P.rgba('#ffffff', a);
    ctx.fillRect(0, -w * 0.22, len, w * 0.44);
    // travelling energy dashes
    ctx.fillStyle = P.rgba('#ffffff', 0.8 * a);
    const off = (t * 2600) % 120;
    for (let d = off; d < len; d += 120) ctx.fillRect(d, -w * 0.5, 34, w);
    ctx.restore();
  };
  /** rising embers around a rectangle */
  P.embers = (ctx, x, y, wd, ht, t, o = {}) => {
    const { n = 30, seed = 11, a = 1, color = '#ffb347', rise = 220 } = o;
    if (a <= 0) return;
    const r = P.rng(seed);
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    for (let i = 0; i < n; i++) {
      const px = x + r() * wd, ph = (P.phase(t, 4, r()) + 0) % 1, sz = 1.5 + r() * 3.5;
      const py = y + ht - ph * (ht + rise);
      ctx.fillStyle = P.rgba(r() > 0.5 ? color : C.lime, a * (1 - ph) * 0.9);
      ctx.fillRect(px + Math.sin(ph * 9 + i) * 10, py, sz, sz);
    }
    ctx.restore();
  };

  // ---------- thruster flame ----------
  P.flame = (ctx, x, y, len, w, t, seed = 0, color = C.lime) => {
    if (len <= 1) return;
    const fl = len * (0.85 + 0.15 * Math.sin(t * 70 + seed) + 0.08 * Math.sin(t * 131 + seed * 3));
    ctx.save();
    ctx.translate(x, y);
    ctx.globalCompositeOperation = 'lighter';
    const g = ctx.createLinearGradient(0, 0, 0, fl);
    g.addColorStop(0, P.rgba('#ffffff', 0.95));
    g.addColorStop(0.25, P.rgba(color, 0.9));
    g.addColorStop(1, P.rgba(color, 0));
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.moveTo(-w / 2, 0);
    ctx.quadraticCurveTo(-w * 0.35, fl * 0.5, 0, fl);
    ctx.quadraticCurveTo(w * 0.35, fl * 0.5, w / 2, 0);
    ctx.closePath();
    ctx.fill();
    P.radial(ctx, 0, fl * 0.2, w * 1.6, color, 0.35);
    ctx.restore();
  };

  // ---------- PRI — the main robot ----------
  P.drawPri = (ctx, o) => {
    if (o.lit !== undefined && o.lit < 0.999) {
      // body darkened through one brightness pass, eyes drawn on top at full power
      const s = o.s || 1;
      P.offscreen(ctx, [o.x - 220 * s, o.y - 230 * s, o.x + 220 * s, o.y + 470 * s], `brightness(${Math.max(0.02, o.lit)})`, (g) => P.drawPri(g, { ...o, lit: 1, eyeGlow: 0, eye: 0.0001, rim: 0 }));
      return P.drawPri(ctx, { ...o, lit: 1, eyesOnly: true });
    }
    const { x, y, s = 1, rot = 0, sx = 1, sy = 1, eye = 1, eyeGlow = 1, look = [0, 0], mood = 'neutral', ant = 1, armL = 0.25, armR = -0.25, flame = 0, t = 0, lit = 1, rim = 0, body = true, alpha = 1, eyesOnly = false } = o;
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(rot);
    ctx.scale(s * sx, s * sy);
    ctx.globalAlpha = alpha;
    const bodyFill = (y0, y1) => {
      const g = ctx.createLinearGradient(0, y0, 0, y1);
      g.addColorStop(0, '#2a3760');
      g.addColorStop(1, '#0f172b');
      return g;
    };
    if (body && !eyesOnly) {
      P.flame(ctx, 0, 292, 150 * flame, 64, t, 1);
      // arms (behind body edge)
      for (const side of [-1, 1]) {
        const a = side < 0 ? armL : armR;
        ctx.save();
        ctx.translate(side * 104, 150);
        ctx.rotate(a * side * -1 + (side < 0 ? 0 : 0));
        ctx.rotate(side * 0.15);
        P.rr(ctx, -17, 0, 34, 118, 17);
        ctx.fillStyle = bodyFill(0, 118);
        ctx.fill();
        ctx.lineWidth = 4;
        ctx.strokeStyle = C.lilac;
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(0, 128, 22, 0, P.TAU);
        ctx.fillStyle = C.violet;
        ctx.fill();
        ctx.stroke();
        ctx.restore();
      }
      // neck + body
      ctx.fillStyle = '#0b1220';
      ctx.fillRect(-40, 100, 80, 40);
      P.rr(ctx, -110, 128, 220, 160, 54);
      ctx.fillStyle = bodyFill(128, 288);
      ctx.fill();
      ctx.lineWidth = 6;
      ctx.strokeStyle = C.lilac;
      ctx.stroke();
      P.rr(ctx, -62, 158, 124, 96, 26);
      ctx.fillStyle = '#05080f';
      ctx.fill();
      P.drawPrism(ctx, { x: 0, y: 206, size: 70, edges: false, glow: 0.8 * eyeGlow });
      // nozzle
      ctx.fillStyle = '#1e2846';
      ctx.beginPath();
      ctx.moveTo(-38, 284);
      ctx.lineTo(38, 284);
      ctx.lineTo(28, 300);
      ctx.lineTo(-28, 300);
      ctx.closePath();
      ctx.fill();
    }
    // ears
    for (const side of eyesOnly ? [] : [-1, 1]) {
      ctx.beginPath();
      ctx.arc(side * 152, 0, 34, 0, P.TAU);
      ctx.fillStyle = C.violet;
      ctx.fill();
      ctx.lineWidth = 5;
      ctx.strokeStyle = C.lilac;
      ctx.stroke();
      ctx.save();
      ctx.setLineDash([10, 8]);
      ctx.lineDashOffset = -t * 60 * side;
      ctx.beginPath();
      ctx.arc(side * 152, 0, 20, 0, P.TAU);
      ctx.strokeStyle = C.lime;
      ctx.lineWidth = 4;
      ctx.stroke();
      ctx.restore();
    }
    if (!eyesOnly) {
    // antenna
    ctx.lineWidth = 7;
    ctx.strokeStyle = C.lilac;
    ctx.beginPath();
    ctx.moveTo(0, -110);
    ctx.lineTo(0, -168);
    ctx.stroke();
    // head
    P.rr(ctx, -150, -112, 300, 224, 74);
    ctx.fillStyle = bodyFill(-112, 112);
    ctx.fill();
    ctx.lineWidth = 7;
    ctx.strokeStyle = C.lilac;
    ctx.stroke();
    // head highlight
    ctx.save();
    ctx.clip();
    ctx.fillStyle = 'rgba(255,255,255,0.08)';
    ctx.beginPath();
    ctx.ellipse(-40, -110, 170, 60, -0.15, 0, P.TAU);
    ctx.fill();
    ctx.restore();
    }
    // rim light (backlight)
    if (rim > 0) {
      ctx.save();
      P.rr(ctx, -150, -112, 300, 224, 74);
      P.glow(ctx, P.rgba(C.lilac, 1), 60 * rim);
      ctx.lineWidth = 5;
      ctx.strokeStyle = P.rgba('#c9c3ff', 0.9 * rim);
      ctx.stroke();
      ctx.restore();
    }
    // antenna ball
    ctx.save();
    P.glow(ctx, C.lime, 40 * ant);
    ctx.beginPath();
    ctx.arc(0, -180, 17, 0, P.TAU);
    ctx.fillStyle = P.rgba(P.mixc('#2a3760', C.lime, ant));
    ctx.fill();
    ctx.restore();
    // visor
    P.rr(ctx, -120, -64, 240, 128, 54);
    ctx.fillStyle = '#03060c';
    ctx.fill();
    ctx.lineWidth = 3;
    ctx.strokeStyle = P.rgba(C.lilac, 0.5);
    ctx.stroke();
    // eyes
    const eh = Math.max(3, 78 * eye), ew = 54;
    ctx.save();
    P.rr(ctx, -120, -64, 240, 128, 54);
    ctx.clip();
    if (eyeGlow > 0.05) {
      ctx.globalCompositeOperation = 'lighter';
      for (const side of [-1, 1]) P.radial(ctx, side * 54 + look[0], look[1], 120, C.lime, 0.35 * eyeGlow * Math.min(1, eye * 3));
      ctx.globalCompositeOperation = 'source-over';
    }
    for (const side of [-1, 1]) {
      const ex = side * 54 + look[0], ey = look[1];
      ctx.save();
      P.glow(ctx, C.lime, 34 * eyeGlow);
      ctx.fillStyle = P.rgba(P.mixc(C.lime, '#ffffff', clamp(eyeGlow - 1, 0, 1) * 0.7));
      if (mood === 'happy' && eye > 0.5) {
        ctx.lineWidth = 16;
        ctx.lineCap = 'round';
        ctx.strokeStyle = ctx.fillStyle;
        ctx.beginPath();
        ctx.arc(ex, ey + 14, 24, Math.PI * 1.1, Math.PI * 1.9);
        ctx.stroke();
      } else {
        P.rr(ctx, ex - ew / 2, ey - eh / 2, ew, eh, Math.min(20, eh / 2));
        ctx.fill();
        if (mood === 'focus') {
          // angled brow cut
          ctx.globalCompositeOperation = 'destination-out';
          ctx.beginPath();
          ctx.moveTo(ex - side * 40, ey - 60);
          ctx.lineTo(ex + side * 40, ey - 60);
          ctx.lineTo(ex + side * 40, ey - eh / 2 + 34);
          ctx.closePath();
          ctx.fill();
          ctx.globalCompositeOperation = 'source-over';
        }
      }
      ctx.restore();
      if (eye > 0.3 && mood !== 'happy') {
        ctx.fillStyle = 'rgba(255,255,255,0.85)';
        ctx.fillRect(ex - ew / 2 + 9, ey - eh / 2 + 9, 10, Math.min(16, eh * 0.25));
      }
    }
    // scanlines over visor
    ctx.fillStyle = 'rgba(0,0,0,0.25)';
    for (let yy = -64; yy < 64; yy += 6) ctx.fillRect(-120, yy, 240, 2);
    ctx.restore();
    ctx.restore();
  };
  /** PRI eye positions in world space (for lasers) */
  P.priEyes = (o) => {
    const { x, y, s = 1, rot = 0, sx = 1, sy = 1, look = [0, 0] } = o;
    return [-1, 1].map((side) => {
      const lx = (side * 54 + look[0]) * s * sx, ly = look[1] * s * sy;
      return [x + lx * Math.cos(rot) - ly * Math.sin(rot), y + lx * Math.sin(rot) + ly * Math.cos(rot)];
    });
  };

  // ---------- mini bot ----------
  P.drawBot = (ctx, o) => {
    if (o.blur) {
      const s = o.s || 1;
      return P.offscreen(ctx, [o.x - 90 * s, o.y - 90 * s, o.x + 90 * s, o.y + 160 * s], `blur(${o.blur}px)`, (g) => P.drawBot(g, { ...o, blur: 0 }));
    }
    const { x, y, s = 1, rot = 0, sx = 1, sy = 1, color = C.lime, eye = 1, look = [0, 0], flame = 0.7, t = 0, seed = 0, cargo, alpha = 1, blur = 0, mood } = o;
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(rot);
    ctx.scale(s * sx, s * sy);
    ctx.globalAlpha = alpha;
    if (cargo) cargo(ctx);
    P.flame(ctx, 0, 30, 58 * flame, 26, t, seed, color);
    // claws
    ctx.lineWidth = 5;
    ctx.lineCap = 'round';
    ctx.strokeStyle = P.rgba(color, 0.9);
    ctx.beginPath();
    ctx.moveTo(-22, 18); ctx.lineTo(-30, 40);
    ctx.moveTo(22, 18); ctx.lineTo(30, 40);
    ctx.stroke();
    // fins
    ctx.fillStyle = C.violet;
    ctx.beginPath();
    ctx.moveTo(-36, -6); ctx.lineTo(-52, 14); ctx.lineTo(-32, 14);
    ctx.moveTo(36, -6); ctx.lineTo(52, 14); ctx.lineTo(32, 14);
    ctx.fill();
    // antenna
    ctx.strokeStyle = C.lilac;
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(0, -30); ctx.lineTo(0, -46);
    ctx.stroke();
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(0, -49, 6, 0, P.TAU);
    ctx.fill();
    // shell
    P.rr(ctx, -36, -32, 72, 62, 26);
    const g = ctx.createLinearGradient(0, -32, 0, 30);
    g.addColorStop(0, '#2f3d6b');
    g.addColorStop(1, '#111a33');
    ctx.fillStyle = g;
    ctx.fill();
    ctx.lineWidth = 4;
    ctx.strokeStyle = color;
    ctx.stroke();
    // visor
    P.rr(ctx, -26, -18, 52, 24, 12);
    ctx.fillStyle = '#03060c';
    ctx.fill();
    P.glow(ctx, color, 16);
    ctx.fillStyle = color;
    const eh = Math.max(2, 13 * eye);
    if (mood === 'happy') {
      ctx.lineWidth = 4;
      ctx.strokeStyle = color;
      for (const sd of [-1, 1]) {
        ctx.beginPath();
        ctx.arc(sd * 10 + look[0], -2 + look[1], 6, Math.PI * 1.1, Math.PI * 1.9);
        ctx.stroke();
      }
    } else {
      P.rr(ctx, -16 + look[0], -6 - eh / 2 + look[1], 10, eh, 4);
      ctx.fill();
      P.rr(ctx, 6 + look[0], -6 - eh / 2 + look[1], 10, eh, 4);
      ctx.fill();
    }
    ctx.restore();
  };

  /** motion-blur trail behind a moving object */
  P.trail = (ctx, pts, color = C.lime, w = 20) => {
    if (pts.length < 2) return;
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    ctx.lineCap = 'round';
    for (let i = 1; i < pts.length; i++) {
      const k = i / pts.length;
      ctx.strokeStyle = P.rgba(color, 0.35 * k);
      ctx.lineWidth = w * k;
      ctx.beginPath();
      ctx.moveTo(pts[i - 1][0], pts[i - 1][1]);
      ctx.lineTo(pts[i][0], pts[i][1]);
      ctx.stroke();
    }
    ctx.restore();
  };

  // ---------- belt + seam prisms (assembly line across the carousel) ----------
  P.BELT_Y = 1248;
  P.belt = (ctx, t) => {
    const y = P.BELT_Y;
    ctx.save();
    // shadow / under-glow
    P.radial(ctx, W / 2, y + 30, 700, C.violet, 0.12);
    ctx.fillStyle = '#070b16';
    ctx.fillRect(-60, y, W + 120, 34);
    ctx.fillStyle = '#141d36';
    ctx.fillRect(-60, y + 34, W + 120, 14);
    // moving chevrons (16 cells per loop)
    const off = P.phase(t, 16) * 60;
    ctx.fillStyle = P.rgba(C.lilac, 0.55);
    for (let x = -120 + off; x < W + 120; x += 60) {
      ctx.beginPath();
      ctx.moveTo(x, y + 8); ctx.lineTo(x + 14, y + 17); ctx.lineTo(x, y + 26); ctx.lineTo(x + 8, y + 26); ctx.lineTo(x + 22, y + 17); ctx.lineTo(x + 8, y + 8);
      ctx.fill();
    }
    // top edge highlight
    ctx.fillStyle = C.lime;
    ctx.fillRect(-60, y - 2, W + 120, 3);
    P.glow(ctx, C.lime, 16);
    ctx.fillRect(-60, y - 2, W + 120, 1);
    P.noGlow(ctx);
    // rollers
    for (let x = 30; x < W; x += 90) {
      ctx.save();
      ctx.translate(x, y + 41);
      ctx.rotate(P.phase(t, 8) * P.TAU);
      ctx.fillStyle = '#1e2846';
      ctx.beginPath();
      ctx.arc(0, 0, 9, 0, P.TAU);
      ctx.fill();
      ctx.fillStyle = C.lilac;
      ctx.fillRect(-1.5, -9, 3, 18);
      ctx.restore();
    }
    ctx.restore();
  };
  /** static prism straddling a seam; stage 0 = intact, 1 = fully dismantled. Identical on both sides. */
  P.seamPrism = (ctx, cxEdge, stage) => {
    const y = P.BELT_Y - 92, size = 170;
    ctx.save();
    // contact shadow
    ctx.fillStyle = 'rgba(0,0,0,0.45)';
    ctx.beginPath();
    ctx.ellipse(cxEdge, P.BELT_Y - 2, 120 + stage * 60, 9, 0, 0, P.TAU);
    ctx.fill();
    const faces = P.prismFaces({ x: cxEdge, y, size, ry: -0.25 + stage * 0.5, rx: 0.08, rz: stage * 0.35, explode: stage * 0.9, seed: 7 });
    for (const f of faces) {
      const fall = stage > 0.6 ? clamp((stage - 0.6) / 0.4) : 0;
      ctx.save();
      // late stages: faces drop toward the belt and tilt
      const drop = fall * Math.max(0, P.BELT_Y - 30 - f.cy) * (0.4 + P.hash(f.id, 9) * 0.6);
      ctx.translate(0, drop);
      ctx.globalAlpha = 1;
      ctx.beginPath();
      f.pts.forEach((p, i) => (i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1])));
      ctx.closePath();
      if (f.hole) {
        ctx.moveTo(f.hole[0][0], f.hole[0][1]);
        ctx.lineTo(f.hole[2][0], f.hole[2][1]);
        ctx.lineTo(f.hole[1][0], f.hole[1][1]);
        ctx.closePath();
      }
      ctx.fillStyle = P.rgba(f.fill);
      P.glow(ctx, P.rgba(f.color, 0.5), 18);
      ctx.fill('evenodd');
      P.noGlow(ctx);
      ctx.lineWidth = 1.5;
      ctx.strokeStyle = 'rgba(255,255,255,0.35)';
      ctx.stroke();
      // bolts showing the dismantling
      if (stage > 0) {
        ctx.fillStyle = C.lime;
        for (const p of f.pts) ctx.fillRect(p[0] - 3, p[1] - 3, 6, 6);
      }
      ctx.restore();
    }
    // clamp arm holding it on the belt (assembly-line look)
    ctx.strokeStyle = P.rgba(C.lilac, 0.6);
    ctx.lineWidth = 3;
    ctx.setLineDash([6, 6]);
    ctx.beginPath();
    ctx.moveTo(cxEdge, y - size * 0.62);
    ctx.lineTo(cxEdge, y - size * 0.95);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.restore();
  };
  P.seams = (ctx, n) => {
    if (n < 6) P.seamPrism(ctx, W, (n - 1) / 4);
    if (n > 1) P.seamPrism(ctx, 0, (n - 2) / 4);
  };

  // ---------- HUD ----------
  P.hud = (ctx, t, n, o = {}) => {
    const a = o.alpha ?? 1;
    if (a <= 0) return;
    ctx.save();
    ctx.globalAlpha = a;
    P.drawPrism(ctx, { x: 76, y: 74, size: 46, ry: P.osc(t, 1) * 0.35, edges: false });
    ctx.fillStyle = C.paper;
    ctx.font = P.font(30, 'Exo 2', 800);
    ctx.textBaseline = 'alphabetic';
    ctx.textAlign = 'left';
    ctx.fillText('PRISMA', 112, 80);
    ctx.font = P.font(12, 'Roboto Mono', 500);
    ctx.fillStyle = C.lime;
    ctx.fillText('T E C H N O L O G I E S', 113, 98);
    // slide counter + beat bar
    ctx.textAlign = 'right';
    ctx.font = P.font(20, 'Roboto Mono', 500);
    ctx.fillStyle = P.rgba(C.paper, 0.75);
    ctx.fillText(`0${n} / 06`, W - 60, 80);
    for (let i = 0; i < 6; i++) {
      const on = i === n - 1;
      const bp = on ? 1 + 0.6 * P.pulse(t, Math.floor(t / P.BEAT) * P.BEAT, 10) : 1;
      ctx.fillStyle = on ? C.lime : P.rgba(C.paper, 0.22);
      const wdt = on ? 34 : 14;
      ctx.fillRect(W - 60 - (5 - i) * 22 - (on ? 20 : 0) - (i > n - 1 ? 0 : 0), 96, wdt, 4 * bp);
    }
    ctx.restore();
  };
})(window);

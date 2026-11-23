/* Slide 4 — TRÁFEGO PAGO + MARKETING PRA REDES.
 * Bots arrive from slide 3. Phone spins in and lands; a sponsored post builds. Title locks like slot-machine reels,
 * a bot strikes each reel. Audience grid gets targeted by a crosshair on the beat. Reach chart punches through its
 * frame on T8. Neon subtitle flickers on. A bot points to the edge and leaves. Last beat: dolly into the phone. */
(function () {
  const P = window.P, { W, H, C, ease: E, clamp, lerp, since, prog } = P;

  const PH = { x: 300, y: 790, w: 380, h: 720, rot: -0.07 };
  const T_PHONE = 1.0, T_REEL0 = 2.0, REEL_STEP = 0.125, T_BREAK = 4.0, T_NEON = 4.5;
  const T_EXIT0 = 6.4, T_EXIT1 = 7.2, T_DOLLY = 7.45;
  const AUD = { x: 610, y: 430, cols: 6, rows: 4, gap: 66 };
  const TARGETS = [[1, 0], [4, 1], [2, 2], [5, 3], [0, 3], [3, 0], [5, 1], [1, 2]]; // locked on beats 4..11
  const CH = { x: 600, y: 806, w: 420, h: 290 };
  const BUBBLES = [
    { t: 2.5, x: 700, y: 752, label: 'CTR', val: 4.8, fmt: (v) => v.toFixed(1).replace('.', ',') + '%' },
    { t: 3.0, x: 960, y: 830, label: 'CPC', val: 0.42, fmt: (v) => 'R$ ' + v.toFixed(2).replace('.', ',') },
    { t: 3.5, x: 840, y: 1150, label: 'ROAS', val: 6.2, fmt: (v) => v.toFixed(1).replace('.', ',') + 'x' },
  ];

  const phoneK = (t) => E.outBack(prog(t, 0.45, T_PHONE), 1.4);
  const reelGlyphs = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789$%#';

  const bots = [
    { col: C.lime, seed: 1 },
    { col: C.lilac, seed: 2 },
    { col: C.green, seed: 3 },
  ];
  const botPose = (i, t, title) => {
    const en = P.enterLeft(t, i * 0.08, 0.6 + i * 0.08, 0, 0);
    let tx, ty;
    if (i === 0) {
      // strikes the reels: rides along above the title
      const k = clamp((t - T_REEL0) / (REEL_STEP * 11));
      const c = title.chars[Math.min(11, Math.floor(k * 12))];
      tx = c ? c.x : 120;
      ty = 120 - Math.abs(Math.sin((t - T_REEL0) * Math.PI * 8)) * 18 * (k < 1 && t > T_REEL0 ? 1 : 0);
      if (t < T_REEL0) { tx = 540 + P.osc(t, 4) * 60; ty = 128; }
      if (t > T_REEL0 + REEL_STEP * 12) { tx = 540 + P.osc(t, 2) * 300; ty = 118 + P.osc(t, 4) * 8; }
    } else if (i === 1) {
      const tg = crossTarget(t);
      tx = tg[0] + 50; ty = tg[1] - 70;
    } else {
      tx = CH.x + CH.w * 0.75 + P.osc(t, 2) * 30;
      ty = CH.y + CH.h * 0.3 - 80 * P.ep(t, 3.0, T_BREAK, E.inCubic) + 60 * P.wobble(t - T_BREAK, 2, 4);
    }
    const settle = E.outBack(prog(t, 0.3 + i * 0.08, 0.9 + i * 0.08), 1.3);
    let x = lerp(en.x, tx, settle), y = lerp(P.LANE_Y, ty, settle);
    let rot = en.rot, sx = en.sx, sy = en.sy, flame = en.flame;
    if (i === 0 && t > T_EXIT0 - 0.8) {
      // goes to the corner, points, exits
      const g = E.outBack(prog(t, T_EXIT0 - 0.8, T_EXIT0 - 0.3), 1.5);
      x = lerp(x, 960, g);
      y = lerp(y, 1000, g);
      const ex = P.exitRight(t, T_EXIT0, T_EXIT1, 960, 1000);
      if (t > T_EXIT0) ({ x, y, rot, sx, sy, flame } = ex);
    }
    return { x, y, rot, sx, sy, flame, s: 1.15, color: bots[i].col, seed: bots[i].seed, t, look: [6, 4] };
  };
  const crossTarget = (t) => {
    const b = Math.floor((t - 2.0) / P.BEAT);
    const idx = clamp(b, 0, TARGETS.length - 1);
    const cur = TARGETS[idx], prev = TARGETS[Math.max(0, idx - 1)];
    const k = E.outBack(prog((t - 2.0) % P.BEAT, 0, 0.25), 1.8);
    const pos = (c) => [AUD.x + c[0] * AUD.gap + 30, AUD.y + c[1] * AUD.gap + 40];
    if (t < 2.0) return pos(TARGETS[0]);
    const a = pos(prev), bb = pos(cur);
    return b >= TARGETS.length ? bb : [lerp(a[0], bb[0], k), lerp(a[1], bb[1], k)];
  };

  const drawPhone = (ctx, t) => {
    const k = phoneK(t);
    if (k <= 0) return;
    const land = P.wobble(t - T_PHONE, 3, 6);
    ctx.save();
    ctx.translate(PH.x, PH.y + (1 - k) * 900);
    ctx.rotate(PH.rot + (1 - k) * 0.9);
    ctx.scale(1 + 0.05 * land, 1 - 0.07 * land);
    const { w, h } = PH;
    // body
    P.glow(ctx, P.rgba(C.lilac, 0.6), 50);
    P.rr(ctx, -w / 2, -h / 2, w, h, 52);
    ctx.fillStyle = '#0a0f1f';
    ctx.fill();
    P.noGlow(ctx);
    ctx.lineWidth = 8;
    ctx.strokeStyle = '#2a3760';
    ctx.stroke();
    ctx.lineWidth = 2;
    ctx.strokeStyle = C.lilac;
    ctx.stroke();
    // screen
    const sx = -w / 2 + 16, sy = -h / 2 + 16, sw = w - 32, sh = h - 32;
    ctx.save();
    P.rr(ctx, sx, sy, sw, sh, 40);
    ctx.clip();
    ctx.fillStyle = '#0d1428';
    ctx.fillRect(sx, sy, sw, sh);
    // notch
    ctx.fillStyle = '#000';
    P.rr(ctx, -50, sy + 10, 100, 26, 13);
    ctx.fill();
    // post header
    const build = (i) => E.outBack(prog(t, T_PHONE + 0.1 + i * 0.12, T_PHONE + 0.4 + i * 0.12), 1.6);
    ctx.globalAlpha = build(0);
    ctx.beginPath();
    ctx.arc(sx + 40, sy + 74, 20, 0, P.TAU);
    ctx.fillStyle = C.lime;
    ctx.fill();
    P.drawPrism(ctx, { x: sx + 40, y: sy + 74, size: 26, edges: false });
    ctx.fillStyle = C.paper;
    ctx.font = P.font(20, 'Exo 2', 800);
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText('prisma.tech', sx + 70, sy + 66);
    ctx.font = P.font(14, 'Roboto Mono', 500);
    ctx.fillStyle = P.rgba(C.paper, 0.6);
    ctx.fillText('Patrocinado', sx + 70, sy + 86);
    ctx.globalAlpha = 1;
    // ad creative
    const b1 = build(1);
    const ay = sy + 110, ah = 330;
    ctx.save();
    ctx.translate(0, ay + ah / 2);
    ctx.scale(b1, b1);
    ctx.translate(0, -(ay + ah / 2));
    ctx.fillStyle = C.lime;
    ctx.fillRect(sx, ay, sw, ah);
    // ad content: robot face + bold copy
    ctx.fillStyle = C.ink;
    ctx.font = P.font(58, 'Oswald', 700);
    ctx.textAlign = 'center';
    ctx.fillText('SEU NEGÓCIO', 0, ay + 66);
    ctx.fillText('NO TOPO', 0, ay + 126);
    P.drawBot(ctx, { x: 0, y: ay + 236 + Math.sin(t * 6) * 8, s: 1.3, color: C.violet, t, flame: 0.8, mood: 'happy' });
    // ad shimmer
    const shx = ((t * 1.1) % 1.6) * sw * 1.6 - sw * 0.6;
    const g = ctx.createLinearGradient(sx + shx - 60, 0, sx + shx + 60, 0);
    g.addColorStop(0, 'rgba(255,255,255,0)');
    g.addColorStop(0.5, 'rgba(255,255,255,0.35)');
    g.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = g;
    ctx.fillRect(sx, ay, sw, ah);
    ctx.restore();
    // action bar
    const b2 = build(2);
    ctx.globalAlpha = b2;
    const hb = 1 + 0.35 * Math.exp(-((t - 2.5) % 0.5) * 9) * (t > 2.5 ? 1 : 0);
    ctx.save();
    ctx.translate(sx + 34, ay + ah + 36);
    ctx.scale(hb, hb);
    heart(ctx, 0, 0, 15, '#ff4d6d');
    ctx.restore();
    ctx.strokeStyle = C.paper;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(sx + 84, ay + ah + 36, 13, 0, P.TAU);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(sx + 118, ay + ah + 46); ctx.lineTo(sx + 140, ay + ah + 24); ctx.lineTo(sx + 126, ay + ah + 24);
    ctx.stroke();
    // likes counter rolling
    const likes = Math.floor(lerp(120, 12480, E.outCubic(prog(t, 2.2, 5.5))));
    ctx.fillStyle = C.paper;
    ctx.font = P.font(20, 'Exo 2', 800);
    ctx.textAlign = 'left';
    ctx.fillText(likes.toLocaleString('pt-BR') + ' curtidas', sx + 20, ay + ah + 80);
    ctx.globalAlpha = 1;
    // CTA
    const b3 = build(3);
    ctx.save();
    ctx.translate(0, ay + ah + 130);
    ctx.scale(b3, b3);
    P.rr(ctx, sx + 20 - 0, -26, sw - 40, 52, 12);
    ctx.fillStyle = C.lilac;
    ctx.fill();
    ctx.fillStyle = '#fff';
    ctx.font = P.font(22, 'Exo 2', 800);
    ctx.textAlign = 'center';
    ctx.fillText('SAIBA MAIS  ›', 0, 1);
    ctx.restore();
    ctx.restore();
    // glass reflection
    const g2 = ctx.createLinearGradient(-w / 2, -h / 2, w / 2, h / 2);
    g2.addColorStop(0.35, 'rgba(255,255,255,0)');
    g2.addColorStop(0.45, 'rgba(255,255,255,0.08)');
    g2.addColorStop(0.55, 'rgba(255,255,255,0)');
    ctx.fillStyle = g2;
    P.rr(ctx, -w / 2, -h / 2, w, h, 52);
    ctx.fill();
    ctx.restore();
  };
  const heart = (ctx, x, y, r, col) => {
    ctx.save();
    ctx.translate(x, y);
    ctx.fillStyle = col;
    ctx.beginPath();
    ctx.moveTo(0, r * 0.9);
    ctx.bezierCurveTo(-r * 1.6, -r * 0.2, -r * 0.8, -r * 1.4, 0, -r * 0.5);
    ctx.bezierCurveTo(r * 0.8, -r * 1.4, r * 1.6, -r * 0.2, 0, r * 0.9);
    ctx.fill();
    ctx.restore();
  };
  const person = (ctx, x, y, col, s = 1) => {
    ctx.fillStyle = col;
    ctx.beginPath();
    ctx.arc(x, y - 12 * s, 11 * s, 0, P.TAU);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(x, y + 16 * s, 19 * s, 14 * s, 0, Math.PI, 0);
    ctx.fill();
  };

  const slide = {
    n: 4,
    bgOpt: { glowA: C.violet, glowAa: 0.24, glowBa: 0.1 },
    camera(t) {
      return P.camera(t, {
        impacts: [{ t: T_PHONE, amp: 16, k: 8 }, { t: T_BREAK, amp: 36, k: 5 }, ...Array.from({ length: 12 }, (_, i) => ({ t: T_REEL0 + i * REEL_STEP, amp: 3, k: 14 }))],
        punches: [{ t: T_BREAK, amt: 0.06 }],
        drift: 5,
        seed: 4,
      });
    },
    draw(ctx, t, cam) {
      ctx.save();
      P.applyCam(ctx, cam, 0.9);
      // ===== audience grid + crosshair =====
      const audIn = (c, r) => E.outBack(prog(t, 1.2 + (c + r) * 0.04, 1.5 + (c + r) * 0.04), 2);
      ctx.font = P.font(20, 'Roboto Mono', 700);
      ctx.textAlign = 'left';
      ctx.fillStyle = P.rgba(C.paper, 0.7 * P.ep(t, 1.2, 1.5));
      ctx.fillText('PÚBLICO-ALVO  ·  25–44  ·  B2B', AUD.x, AUD.y - 20);
      for (let r = 0; r < AUD.rows; r++)
        for (let c = 0; c < AUD.cols; c++) {
          const k = audIn(c, r);
          if (k <= 0) continue;
          const ti = TARGETS.findIndex(([a, b]) => a === c && b === r);
          const lockT = ti >= 0 ? 2.0 + ti * P.BEAT + 0.25 : 99;
          const locked = t >= lockT && t < T_DOLLY + 0.3;
          const x = AUD.x + c * AUD.gap + 30, y = AUD.y + r * AUD.gap + 40;
          const pop = locked ? 1 + 0.4 * P.wobble(t - lockT, 3, 6) : 1;
          person(ctx, x, y + Math.sin(t * 3 + c + r) * 3, locked ? C.lime : P.rgba(C.lilac, 0.55), k * pop * 0.9);
          if (locked) {
            P.shock(ctx, x, y, t - lockT, { r1: 70, dur: 0.4, width: 5, fill: 0 });
            ctx.font = P.font(20, 'Exo 2', 900);
            ctx.fillStyle = C.lime;
            ctx.fillText('+1', x + 14, y - 26 - 30 * E.outCubic(prog(t, lockT, lockT + 0.5)));
          }
        }
      if (t > 1.6) {
        const [cx, cy] = crossTarget(t);
        const a = P.ep(t, 1.6, 1.9) * (1 - prog(t, T_DOLLY, 8));
        const sp = 1 + 0.5 * Math.exp(-((t - 2.0) % P.BEAT) * 10);
        ctx.save();
        ctx.translate(cx, cy);
        ctx.rotate(P.phase(t, 2) * P.TAU);
        ctx.globalAlpha = a;
        ctx.strokeStyle = '#ff4d6d';
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.arc(0, 0, 30 * sp, 0, P.TAU);
        ctx.stroke();
        for (let q = 0; q < 4; q++) {
          ctx.rotate(Math.PI / 2);
          ctx.beginPath();
          ctx.moveTo(18 * sp, 0);
          ctx.lineTo(44 * sp, 0);
          ctx.stroke();
        }
        ctx.restore();
      }

      // ===== reach chart =====
      const chIn = E.outBack(prog(t, 2.2, 2.6), 1.6);
      if (chIn > 0) {
        ctx.save();
        ctx.translate(CH.x, CH.y + CH.h);
        ctx.scale(1, chIn);
        ctx.translate(-CH.x, -(CH.y + CH.h));
        P.rr(ctx, CH.x, CH.y, CH.w, CH.h, 14);
        ctx.fillStyle = 'rgba(10,16,32,0.9)';
        ctx.fill();
        ctx.strokeStyle = P.rgba(C.lilac, 0.7);
        ctx.lineWidth = 2;
        ctx.stroke();
        ctx.font = P.font(18, 'Roboto Mono', 700);
        ctx.fillStyle = P.rgba(C.paper, 0.7);
        ctx.textAlign = 'left';
        ctx.fillText('ALCANCE', CH.x + 18, CH.y + 28);
        ctx.strokeStyle = 'rgba(255,255,255,0.06)';
        for (let gy = 1; gy < 5; gy++) {
          ctx.beginPath();
          ctx.moveTo(CH.x + 14, CH.y + gy * 60);
          ctx.lineTo(CH.x + CH.w - 14, CH.y + gy * 60);
          ctx.stroke();
        }
        ctx.restore();
        // line (exponential) drawn 2.6 → 4.0, the head punches through the top on T8
        const dk = E.inOutCubic(prog(t, 2.6, T_BREAK));
        const pts = [];
        const N = 40;
        for (let i = 0; i <= N * dk; i++) {
          const u = i / N;
          const v = Math.pow(u, 2.6);
          pts.push([CH.x + 24 + u * (CH.w - 60), CH.y + CH.h - 24 - v * (CH.h - 70)]);
        }
        let head = pts[pts.length - 1];
        const burst = t >= T_BREAK ? E.outExpo(prog(t, T_BREAK, T_BREAK + 0.35)) : 0;
        if (head) {
          const tip = [head[0] + 30 * burst, head[1] - 260 * burst];
          if (burst > 0) pts.push(tip);
          ctx.save();
          ctx.lineWidth = 8;
          ctx.lineJoin = 'round';
          ctx.strokeStyle = C.lime;
          P.glow(ctx, C.lime, 24);
          ctx.beginPath();
          pts.forEach((p, i) => (i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1])));
          ctx.stroke();
          // area fill
          ctx.lineTo(pts[pts.length - 1][0], CH.y + CH.h - 20);
          ctx.lineTo(CH.x + 24, CH.y + CH.h - 20);
          ctx.closePath();
          ctx.fillStyle = P.rgba(C.lime, 0.12);
          ctx.fill();
          P.noGlow(ctx);
          // arrow head
          const p2 = pts[pts.length - 1], p1 = pts[pts.length - 2] || [p2[0] - 10, p2[1] + 10];
          const ang = Math.atan2(p2[1] - p1[1], p2[0] - p1[0]);
          ctx.translate(p2[0], p2[1]);
          ctx.rotate(ang);
          ctx.fillStyle = C.lime;
          ctx.beginPath();
          ctx.moveTo(24, 0); ctx.lineTo(-12, -18); ctx.lineTo(-12, 18);
          ctx.fill();
          ctx.restore();
          if (t >= T_BREAK) {
            // frame shatters where it broke through
            const bx = head[0] + 10, by = CH.y;
            P.shock(ctx, bx, by, t - T_BREAK, { r1: 500, dur: 0.7, width: 18, fill: 0.15 });
            P.sparks(ctx, bx, by, t - T_BREAK, { n: 50, seed: 41, speed: 1300, life: 0.9 });
          }
        }
      }
      // metric bubbles
      for (const b of BUBBLES) {
        const k = E.outBack(prog(t, b.t, b.t + 0.3), 2.4);
        const out = E.inBack(prog(t, T_DOLLY, 7.9));
        if (k <= 0) continue;
        const v = b.val * E.outCubic(prog(t, b.t, b.t + 1.2));
        ctx.save();
        ctx.translate(b.x, b.y + Math.sin(t * 3 + b.x) * 8);
        ctx.scale(k * (1 - out), k * (1 - out));
        P.rr(ctx, -92, -46, 184, 92, 46);
        ctx.fillStyle = C.paper;
        P.glow(ctx, P.rgba(C.lime, 0.5), 20);
        ctx.fill();
        P.noGlow(ctx);
        ctx.fillStyle = C.violet;
        ctx.font = P.font(16, 'Roboto Mono', 700);
        ctx.textAlign = 'center';
        ctx.fillText(b.label, 0, -16);
        ctx.fillStyle = C.ink;
        ctx.font = P.font(38, 'Exo 2', 900);
        ctx.fillText(b.fmt(v), 0, 24);
        ctx.restore();
      }

      // ===== phone =====
      drawPhone(ctx, t);
      // hearts flying out of the post
      if (t > 2.5) {
        for (let i = 0; i < 10; i++) {
          const t0 = 2.5 + i * 0.5;
          const life = 1.6;
          const dt = t - t0;
          if (dt < 0 || dt > life) continue;
          const k = dt / life;
          const x = PH.x - 120 + Math.sin(dt * 5 + i) * 30 + k * 60;
          const y = PH.y + 80 - E.outCubic(k) * 520;
          const s = E.outBack(Math.min(1, dt / 0.25), 3) * (1 - k * 0.3);
          ctx.globalAlpha = 1 - E.inQuad(k);
          heart(ctx, x, y, 22 * s, i % 3 === 0 ? C.lime : '#ff4d6d');
          ctx.globalAlpha = 1;
        }
      }
      ctx.restore();

      // ===== title: slot reels =====
      ctx.save();
      P.applyCam(ctx, cam, 1.12);
      const L = P.layout(ctx, 'TRÁFEGO PAGO', 150, { track: 0.03 });
      const TY = 218;
      const winIn = (i) => E.outBack(prog(t, 1.3 + i * 0.03, 1.6 + i * 0.03), 2);
      L.chars.forEach((c, i) => {
        if (c.ch === ' ') return;
        const k = winIn(i);
        const out = prog(t, T_DOLLY, 8);
        if (k <= 0) return;
        const lockT = T_REEL0 + i * REEL_STEP;
        const cellH = L.cap * 1.5;
        ctx.save();
        ctx.translate(c.x, TY);
        ctx.scale(k, k);
        // reel window
        P.rr(ctx, -c.w / 2 - 8, -cellH / 2, c.w + 16, cellH, 10);
        ctx.fillStyle = 'rgba(5,8,16,0.85)';
        ctx.fill();
        ctx.strokeStyle = P.rgba(C.lilac, 0.6);
        ctx.lineWidth = 2;
        ctx.stroke();
        ctx.clip();
        const spinK = prog(t, 1.6, lockT);
        const N = 10 + i;
        const off = (1 - E.outBack(spinK, 1.1)) * N * cellH;
        const locked = t >= lockT;
        for (let j = 0; j <= N; j++) {
          const y = j * cellH - off;
          if (y < -cellH * 1.2 || y > cellH * 1.2) continue;
          const ch = j === 0 ? c.ch : reelGlyphs[Math.floor(P.hash(i * 31 + j, 2) * reelGlyphs.length)];
          ctx.save();
          ctx.translate(0, -y);
          if (!locked) ctx.scale(1, 1.25);
          ctx.fillStyle = j === 0 ? (locked ? C.paper : P.rgba(C.paper, 0.85)) : P.rgba(C.lilac, 0.6);
          if (locked && j === 0) {
            const fl = Math.exp(-(t - lockT) * 6);
            ctx.fillStyle = P.rgba(P.mixc(C.paper, C.lime, fl));
            P.glow(ctx, P.rgba(C.lime, fl), 30 * fl);
          }
          ctx.translate(0, out * 400 * (i % 2 ? 1 : -1));
          P.glyph(ctx, ch, L.size, 'Oswald', 700, L.cap);
          ctx.restore();
        }
        ctx.restore();
      });
      // neon subtitle
      if (t >= T_NEON) {
        const fk = t - T_NEON;
        const on = fk > 0.45 ? 1 : P.hash(Math.floor(fk * 25), 7) > 0.5 ? 1 : 0.15;
        const off = t > T_DOLLY ? 1 - prog(t, T_DOLLY, T_DOLLY + 0.2) : 1;
        ctx.save();
        ctx.font = P.font(56, 'Oswald', 500);
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.lineWidth = 3;
        P.glow(ctx, P.rgba(C.lilac, 1), 40 * on);
        ctx.strokeStyle = P.rgba(C.lilacSoft, on * off);
        ctx.strokeText('+ MARKETING PRA REDES', 540, 336);
        ctx.fillStyle = P.rgba('#e9e6ff', 0.92 * on * off);
        ctx.fillText('+ MARKETING PRA REDES', 540, 336);
        ctx.restore();
      }
      // bots
      for (let i = 0; i < 3; i++) {
        const b = botPose(i, t, L);
        if (i === 0 && t > T_EXIT1) continue;
        P.drawBot(ctx, b);
        if (i === 0 && t > T_REEL0 && t < T_REEL0 + REEL_STEP * 12) P.sparks(ctx, b.x, b.y + 50, ((t - T_REEL0) % REEL_STEP), { n: 8, seed: Math.floor(t * 8), speed: 400, life: 0.2, width: 2 });
      }
      // corner arrow
      if (t > T_EXIT0 - 0.6 && t < T_EXIT0 + 0.3) {
        const a = E.outBack(prog(t, T_EXIT0 - 0.6, T_EXIT0 - 0.3), 2) * (1 - prog(t, T_EXIT0, T_EXIT0 + 0.3));
        ctx.save();
        ctx.translate(990 + Math.abs(Math.sin(t * 8)) * 14, 900);
        ctx.scale(a, a);
        ctx.fillStyle = C.lime;
        P.glow(ctx, C.lime, 30);
        ctx.font = P.font(70, 'Oswald', 700);
        ctx.textAlign = 'center';
        ctx.fillText('›››', 0, 0);
        ctx.restore();
      }
      ctx.restore();
    },
    flash(t) {
      const pre = Math.pow(prog(t, T_DOLLY + 0.2, 8), 2) * 0.9;
      return 0.9 * P.pulse(t, 0, 10) + 0.55 * P.pulse(t, T_BREAK, 8) * (t >= T_BREAK ? 1 : 0) + pre;
    },
    flashColor: '#eaffc0',
    chroma(t) {
      return (t >= T_BREAK ? 12 * P.pulse(t, T_BREAK, 7) : 0) + 16 * prog(t, T_DOLLY, 8) + 10 * P.pulse(t, 0, 10);
    },
    compose(ctx, scene, t) {
      if (t < T_DOLLY) return ctx.drawImage(scene, 0, 0);
      // dolly into the phone screen
      const k = E.inExpo(prog(t, T_DOLLY, 8));
      const z = 1 + k * 7;
      const fx = PH.x, fy = PH.y - 120;
      ctx.save();
      ctx.translate(W / 2, H / 2);
      ctx.scale(z, z);
      ctx.translate(-lerp(W / 2, fx, Math.min(1, k * 2)), -lerp(H / 2, fy, Math.min(1, k * 2)));
      ctx.drawImage(scene, 0, 0);
      ctx.restore();
    },
    audio(S) {
      S.groove({ kick: true, snare: true, hats: true, bass: [0, 15], arp: [4, 15], pad: true });
      S.whoosh(0, 0.5, 1, 1);
      S.whoosh(0.1, 0.5, 0.6, 1);
      S.thud(T_PHONE, 1.2);
      S.servo(0.45, 0.5, 0.8, true);
      for (let i = 0; i < 12; i++) if (i !== 7) S.click(T_REEL0 + i * REEL_STEP, 1, 3000 + i * 150);
      for (let i = 0; i < 8; i++) S.blip(2.0 + i * P.BEAT + 0.25, [76, 79, 81, 84, 86, 84, 81, 88][i], 0.7, 'square', 0.06);
      for (const b of BUBBLES) S.blip(b.t, 91, 0.8, 'sine', 0.12);
      S.boom(T_BREAK, 0.9);
      S.stamp(T_BREAK, 0.8);
      S.neon(T_NEON, 0.5, 1);
      S.whoosh(T_EXIT0 + 0.2, 0.7, 1, 1);
      S.riser(T_DOLLY - 0.3, 0.85, 1.2);
    },
  };
  P.SLIDES[4] = slide;
})();

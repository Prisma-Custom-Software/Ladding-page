/* Slide 5 — ANÁLISE DE DADOS.
 * Courier bots bring the dashboard cards from the left (one per beat, bounce + weld sparks). Three bots spray pixel
 * blocks that build the title. Bars spring up, line draws, donut sweeps, KPIs roll, heatmap flips. T8 = INSIGHT scan.
 * A bot leaves through the right edge; the last beat blows the dashboard apart. */
(function () {
  const P = window.P, { W, H, C, ease: E, clamp, lerp, since, prog } = P;

  const T_INSIGHT = 4.0, T_EXIT0 = 6.4, T_EXIT1 = 7.2, T_BLOW = 7.45;
  const TITLE_Y = 196, BLOCK = 7;
  // widgets: [x, y, w, h, arrival time]
  const WG = {
    k1: [60, 344, 300, 190, 0.5],
    k2: [390, 344, 300, 190, 0.75],
    k3: [720, 344, 300, 190, 1.0],
    bars: [60, 560, 570, 330, 1.5],
    donut: [660, 560, 360, 330, 2.0],
    line: [60, 916, 570, 290, 2.5],
    heat: [660, 916, 360, 290, 3.0],
  };
  const ORDER = ['k1', 'k2', 'k3', 'bars', 'donut', 'line', 'heat'];
  const BOT_COLORS = [C.lime, C.lilac, C.green, C.lime, C.lilac, C.green, C.violet];
  const BARS = [0.35, 0.52, 0.44, 0.68, 0.6, 0.82, 0.74, 0.96];
  const DONUT = [[0.42, C.lime], [0.26, C.lilac], [0.18, C.green], [0.14, C.violet]];

  // ---- pixel title ----
  let BLOCKS = null;
  const blocks = () => {
    if (BLOCKS) return BLOCKS;
    const c = document.createElement('canvas');
    c.width = W;
    c.height = 200;
    const g = c.getContext('2d');
    g.font = P.font(128, 'Oswald', 700);
    g.textAlign = 'center';
    g.textBaseline = 'middle';
    g.fillStyle = '#fff';
    const str1 = 'ANÁLISE DE ', str2 = 'DADOS';
    const w1 = g.measureText(str1).width, w2 = g.measureText(str2).width;
    const x0 = W / 2 - (w1 + w2) / 2;
    g.textAlign = 'left';
    g.fillText(str1, x0, 100);
    g.fillStyle = '#0f0';
    g.fillText(str2, x0 + w1, 100);
    const id = g.getImageData(0, 0, W, 200).data;
    const out = [];
    for (let y = 0; y < 200; y += BLOCK)
      for (let x = 0; x < W; x += BLOCK) {
        const i = ((y + 3) * W + (x + 3)) * 4;
        if (id[i + 3] > 120) out.push({ x, y: y + TITLE_Y - 100, lime: id[i] < 100, r: P.hash(x * 7 + y, 3) });
      }
    const xs = out.map((b) => b.x), mn = Math.min(...xs), mx = Math.max(...xs);
    out.forEach((b) => {
      const u = (b.x - mn) / (mx - mn);
      b.ta = 1.0 + u * 1.5 + b.r * 0.12; // arrival
      b.em = u < 0.33 ? 0 : u < 0.66 ? 1 : 2; // emitter
    });
    return (BLOCKS = out);
  };
  const EMIT = (i, t) => [200 + i * 340 + Math.sin(t * 3 + i) * 50, 316 + Math.sin(t * 5 + i * 2) * 8];

  const cardK = (key, t) => {
    const ta = WG[key][4];
    return { inK: prog(t, ta - 0.5, ta), land: t - ta };
  };
  const cardBox = (ctx, key, t, accent, title) => {
    const [x, y, w, h, ta] = WG[key];
    const { inK, land } = cardK(key, t);
    if (inK <= 0) return null;
    const blow = prog(t, T_BLOW, 8);
    const e = E.outBack(inK, 1.2);
    const dx = (1 - e) * -(x + w + 200);
    const dy = -Math.sin(inK * Math.PI) * 80;
    const wob = P.wobble(land, 3.5, 7);
    ctx.save();
    const fallY = blow * blow * 1400 * (0.7 + P.hash(x + y, 1) * 0.6);
    ctx.translate(x + w / 2 + dx + blow * (P.hash(x, 2) - 0.5) * 300, y + h / 2 + dy + fallY);
    ctx.rotate(blow * (P.hash(y, 4) - 0.5) * 2 + (1 - e) * -0.2);
    ctx.scale(1 + 0.06 * wob, 1 - 0.08 * wob);
    ctx.translate(-w / 2, -h / 2);
    P.rr(ctx, 0, 0, w, h, 16);
    ctx.fillStyle = 'rgba(12,19,38,0.94)';
    ctx.fill();
    const ins = t >= T_INSIGHT && t < T_BLOW ? Math.exp(-(t - T_INSIGHT) * 2.5) : 0;
    P.glow(ctx, P.rgba(accent, 0.5 + ins * 0.5), 18 + ins * 40);
    ctx.lineWidth = 2.5 + ins * 3;
    ctx.strokeStyle = P.rgba(accent, 0.85);
    ctx.stroke();
    P.noGlow(ctx);
    ctx.font = P.font(17, 'Roboto Mono', 700);
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = P.rgba(C.paper, 0.65);
    ctx.fillText(title, 18, 26);
    return { w, h, land, ins };
  };
  const roll = (v, k) => v * E.outCubic(k);

  const slide = {
    n: 5,
    bgOpt: { glowA: C.lilac, glowAa: 0.18, glowB: C.green, glowBa: 0.1 },
    camera(t) {
      return P.camera(t, {
        impacts: [...ORDER.map((k) => ({ t: WG[k][4], amp: 9, k: 10 })), { t: 2.5, amp: 10, k: 9 }, { t: T_INSIGHT, amp: 28, k: 5 }],
        punches: [{ t: T_INSIGHT, amt: 0.05 }],
        drift: 5,
        seed: 5,
      });
    },
    draw(ctx, t, cam) {
      ctx.save();
      P.applyCam(ctx, cam, 1);

      // ===== KPI cards =====
      const kpis = [
        ['k1', 'RECEITA', (v) => 'R$ ' + v.toFixed(1).replace('.', ',') + 'k', 48.2, C.lime],
        ['k2', 'CRESCIMENTO', (v) => '+' + Math.round(v) + '%', 187, C.lilac],
        ['k3', 'CLIENTES', (v) => Math.round(v).toLocaleString('pt-BR'), 12430, C.green],
      ];
      kpis.forEach(([key, title, fmt, val, acc], i) => {
        const b = cardBox(ctx, key, t, acc, title);
        if (!b) return;
        const k = prog(t, 2.0 + i * 0.15, 3.5);
        ctx.fillStyle = acc;
        ctx.font = P.font(62, 'Exo 2', 900);
        // digit roll: small vertical jitter while counting
        const jit = k > 0 && k < 1 ? Math.sin(t * 60) * 3 : 0;
        const tick = t > 3.6 ? Math.floor((t - 3.6) / P.BEAT) * [0.3, 2, 17][i] : 0;
        const bump = t > 3.6 ? 1 + 0.08 * Math.exp(-((t - 3.6) % P.BEAT) * 10) : 1;
        ctx.save();
        ctx.translate(18, 92 + jit);
        ctx.scale(bump, bump);
        ctx.fillText(fmt(roll(val, k) + tick), 0, 0);
        ctx.restore();
        // sparkline
        ctx.beginPath();
        for (let j = 0; j <= 20; j++) {
          const u = j / 20;
          const yy = 160 - (u * 30 + Math.sin(u * 9 + i + t * 3) * 10) * Math.min(1, k * 1.5 + 0.1);
          const xx = 18 + u * (b.w - 36) * Math.min(1, k * 2);
          j ? ctx.lineTo(xx, yy) : ctx.moveTo(xx, yy);
        }
        ctx.strokeStyle = P.rgba(acc, 0.8);
        ctx.lineWidth = 3;
        ctx.stroke();
        ctx.restore();
      });

      // ===== bar chart =====
      {
        const b = cardBox(ctx, 'bars', t, C.lime, 'VENDAS POR MÊS');
        if (b) {
          const bw = 46, gap = (b.w - 40 - BARS.length * bw) / (BARS.length - 1), base = b.h - 30;
          BARS.forEach((v, i) => {
            const tb = 2.0 + i * 0.125;
            const sp = P.spring(t - tb, 2.6, 5);
            const live = t > 3.2 ? 1 + 0.07 * Math.sin(t * 5 + i * 1.3) + 0.05 * Math.exp(-((t - 2) % P.BEAT) * 8) : 1;
            const hgt = v * (b.h - 90) * clamp(sp, 0, 1.4) * live;
            const x = 20 + i * (bw + gap);
            const g = ctx.createLinearGradient(0, base - hgt, 0, base);
            g.addColorStop(0, i === BARS.length - 1 ? C.lime : C.lilacSoft);
            g.addColorStop(1, P.rgba(C.violet, 0.6));
            ctx.fillStyle = g;
            ctx.fillRect(x, base - hgt, bw, hgt);
            if (t > tb) {
              ctx.fillStyle = '#ffffff';
              ctx.fillRect(x, base - hgt, bw, 4);
            }
            // lifter bot riding the bar top while it grows
            if (t > tb - 0.2 && t < tb + 0.5) {
              const a = 1 - prog(t, tb + 0.3, tb + 0.5);
              P.drawBot(ctx, { x: x + bw / 2, y: base - hgt - 40 - (1 - prog(t, tb - 0.2, tb)) * 60, s: 0.6, color: C.lime, t, seed: i, flame: 1, alpha: a, look: [0, -4] });
            }
          });
          ctx.fillStyle = 'rgba(255,255,255,0.15)';
          ctx.fillRect(16, base, b.w - 32, 2);
          ctx.restore();
        }
      }

      // ===== donut =====
      {
        const b = cardBox(ctx, 'donut', t, C.lilac, 'CANAIS');
        if (b) {
          const cx = b.w / 2, cy = b.h / 2 + 14, r = 104;
          const sweep = E.inOutCubic(prog(t, 2.5, 3.5));
          let a0 = -Math.PI / 2 + E.inOutCubic(prog(t, 4.0, 6.0)) * P.TAU * 0.25 + E.inOutCubic(prog(t, 6.0, 7.4)) * P.TAU * 0.75;
          DONUT.forEach(([v, col], i) => {
            const a1 = a0 + v * P.TAU * sweep;
            ctx.beginPath();
            ctx.arc(cx, cy, r + (i === 0 ? 8 * P.pulse(t, T_INSIGHT, 4) * (t > T_INSIGHT ? 1 : 0) : 0), a0, a1);
            ctx.strokeStyle = col;
            ctx.lineWidth = 38;
            ctx.stroke();
            a0 = a1 + 0.03 * sweep;
          });
          ctx.fillStyle = C.paper;
          ctx.font = P.font(52, 'Exo 2', 900);
          ctx.textAlign = 'center';
          ctx.fillText(Math.round(42 * sweep) + '%', cx, cy + 4);
          ctx.font = P.font(15, 'Roboto Mono', 700);
          ctx.fillStyle = P.rgba(C.paper, 0.6);
          ctx.fillText('ORGÂNICO', cx, cy + 40);
          ctx.restore();
        }
      }

      // ===== line chart =====
      {
        const b = cardBox(ctx, 'line', t, C.green, 'TENDÊNCIA');
        if (b) {
          const dk = E.inOutCubic(prog(t, 2.6, 3.9));
          const N = 60;
          const pts = [];
          for (let i = 0; i <= N * dk; i++) {
            const u = i / N;
            const v = 0.15 + u * 0.55 + Math.sin(u * 10) * 0.08 + (u > 0.75 ? (u - 0.75) * 1.0 : 0);
            pts.push([24 + u * (b.w - 48), b.h - 30 - v * (b.h - 80)]);
          }
          if (pts.length > 1) {
            ctx.beginPath();
            pts.forEach((p, i) => (i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1])));
            ctx.lineWidth = 6;
            ctx.lineJoin = 'round';
            ctx.strokeStyle = C.green;
            P.glow(ctx, C.green, 16);
            ctx.stroke();
            P.noGlow(ctx);
            const hd = pts[pts.length - 1];
            ctx.globalCompositeOperation = 'lighter';
            P.radial(ctx, hd[0], hd[1], 40, C.lime, 0.9);
            ctx.globalCompositeOperation = 'source-over';
            ctx.fillStyle = '#fff';
            ctx.beginPath();
            ctx.arc(hd[0], hd[1], 7, 0, P.TAU);
            ctx.fill();
            // INSIGHT callout at the peak
            if (t >= T_INSIGHT - 0.1) {
              const k = t < T_INSIGHT ? prog(t, T_INSIGHT - 0.1, T_INSIGHT) : 1;
              const sc = t < T_INSIGHT ? lerp(2.6, 1, E.inQuad(k)) : 1 - 0.12 * P.wobble(t - T_INSIGHT, 4, 7);
              ctx.save();
              ctx.translate(hd[0] - 110, hd[1] - 54);
              ctx.rotate(-0.06);
              ctx.scale(sc, sc);
              P.rr(ctx, -92, -26, 184, 52, 8);
              ctx.fillStyle = C.lime;
              P.glow(ctx, C.lime, 30);
              ctx.fill();
              P.noGlow(ctx);
              ctx.fillStyle = C.ink;
              ctx.font = P.font(32, 'Oswald', 700);
              ctx.textAlign = 'center';
              ctx.fillText('INSIGHT ✦', 0, 3);
              ctx.restore();
            }
          }
          ctx.restore();
        }
      }

      // ===== heatmap =====
      {
        const b = cardBox(ctx, 'heat', t, C.lime, 'HORÁRIOS DE PICO');
        if (b) {
          const cols = 7, rows = 4, cw = (b.w - 40) / cols, chh = (b.h - 70) / rows;
          for (let r = 0; r < rows; r++)
            for (let c = 0; c < cols; c++) {
              const tf = 3.0 + (r * cols + c) * 0.03;
              const fl = prog(t, tf, tf + 0.2);
              const v = t > 4.2 ? P.hash(r * 9 + c + Math.floor(t * 4) * 0.37, 6) : P.hash(r * 9 + c, 6);
              const sy = Math.abs(Math.cos(fl * Math.PI));
              const col = fl < 0.5 ? P.rgba(C.paper, 0.06) : P.rgba(P.mixc(C.violet, C.lime, v), 0.35 + v * 0.65);
              ctx.fillStyle = col;
              const x = 20 + c * cw, y = 46 + r * chh;
              ctx.fillRect(x + 3, y + 3 + (chh - 6) * (1 - sy) / 2, cw - 6, (chh - 6) * Math.max(0.05, sy));
            }
          ctx.restore();
        }
      }

      // ===== courier bots for each card =====
      ORDER.forEach((key, i) => {
        const [x, y, w, h, ta] = WG[key];
        const { inK, land } = cardK(key, t);
        if (inK <= 0 || land > 0.55) return;
        const e = E.outBack(inK, 1.2);
        const cxp = x + w / 2 + (1 - e) * -(x + w + 200);
        const up = E.inCubic(prog(land, 0.05, 0.55));
        P.drawBot(ctx, { x: cxp + 20, y: y - 46 - Math.sin(inK * Math.PI) * 80 - up * 600, s: 1.0, color: BOT_COLORS[i], t, seed: i, flame: 0.8 + up, sy: 1 + up * 0.3, sx: 1 - up * 0.15, look: [8, 6] });
        // weld sparks at the corners on landing
        if (land > 0) for (const [qx, qy] of [[x, y], [x + w, y], [x, y + h], [x + w, y + h]]) P.sparks(ctx, qx, qy, land, { n: 6, seed: i * 4 + qx, speed: 420, life: 0.35, width: 2 });
      });

      // ===== patrol bot welding the cards =====
      if (t > 4.3 && t < 6.3) {
        const k = prog(t, 4.3, 6.3);
        const path = [[90, 560], [640, 560], [640, 916], [1010, 916], [1010, 560], [660, 344]];
        const seg = Math.min(path.length - 2, Math.floor(k * (path.length - 1)));
        const u = E.inOutCubic(k * (path.length - 1) - seg);
        const [ax, ay] = path[seg], [bx, by] = path[seg + 1];
        const px = lerp(ax, bx, u), py = lerp(ay, by, u);
        const ap = E.outBack(prog(t, 4.3, 4.6), 2) * (1 - E.inBack(prog(t, 6.0, 6.3)));
        P.drawBot(ctx, { x: px, y: py - 46, s: 0.95 * ap, color: C.lilac, t, seed: 77, flame: 0.8, look: [bx > ax ? 8 : -8, 6] });
        P.sparks(ctx, px, py, (t * 8) % 1 * 0.125, { n: 8, seed: Math.floor(t * 8) + 5, speed: 420, life: 0.18, width: 2 });
        ctx.save();
        ctx.globalCompositeOperation = 'lighter';
        P.radial(ctx, px, py, 50, C.lime, 0.8 * ap);
        ctx.restore();
      }
      // ===== INSIGHT scan line =====
      if (t >= T_INSIGHT && t < T_INSIGHT + 0.7) {
        const k = E.inOutCubic(prog(t, T_INSIGHT, T_INSIGHT + 0.7));
        const y = lerp(330, 1220, k);
        ctx.save();
        ctx.globalCompositeOperation = 'lighter';
        const g = ctx.createLinearGradient(0, y - 80, 0, y + 6);
        g.addColorStop(0, P.rgba(C.lime, 0));
        g.addColorStop(1, P.rgba(C.lime, 0.45));
        ctx.fillStyle = g;
        ctx.fillRect(0, y - 80, W, 86);
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, y, W, 3);
        ctx.restore();
      }
      P.shock(ctx, 540, 760, since(t, T_INSIGHT), { r1: 900, dur: 0.8, width: 20, fill: 0.1 });

      // ===== exit bot =====
      if (t > T_EXIT0 - 0.7 && t < T_EXIT1) {
        const ap = E.outBack(prog(t, T_EXIT0 - 0.7, T_EXIT0 - 0.2), 1.6);
        const ex = P.exitRight(t, T_EXIT0, T_EXIT1, 960, 1060);
        const tr = [];
        for (let k = 6; k >= 0; k--) {
          const q = P.exitRight(t - k * 0.025, T_EXIT0, T_EXIT1, 960, 1060);
          tr.push([q.x - 30, q.y + 10]);
        }
        if (ex.go > 0) P.trail(ctx, tr, C.lime, 34);
        P.drawBot(ctx, { x: ex.x, y: ex.y + (1 - ap) * 400, s: 1.3, rot: ex.rot, sx: ex.sx, sy: ex.sy, flame: ex.flame, t, color: C.lime, seed: 9, look: [10, 0], mood: t < T_EXIT0 ? 'happy' : undefined,
          cargo: (cx) => { cx.fillStyle = C.lilac; cx.fillRect(-26, 52, 14, 30); cx.fillStyle = C.lime; cx.fillRect(-6, 40, 14, 42); cx.fillStyle = C.green; cx.fillRect(14, 60, 14, 22); } });
      }
      ctx.restore();

      // ===== pixel title (front) =====
      ctx.save();
      P.applyCam(ctx, cam, 1.12);
      const BL = blocks();
      const blow = prog(t, T_BLOW, 8);
      // emitter bots
      for (let i = 0; i < 3; i++) {
        const on = P.ep(t, 0.4 + i * 0.1, 0.8 + i * 0.1, E.outBack) * (1 - E.inBack(prog(t, 2.6, 3.0)));
        if (on <= 0.01) continue;
        const [ex, ey] = EMIT(i, t);
        P.drawBot(ctx, { x: ex, y: ey + (1 - on) * 400, s: 1.1, color: [C.lime, C.lilac, C.green][i], t, seed: i + 30, flame: 1, look: [0, -8] });
      }
      const lockFlash = t >= 2.5 ? Math.exp(-(t - 2.5) * 5) : 0;
      for (const b of BL) {
        const fl = 0.38;
        const ts = b.ta - fl;
        if (t < ts) continue;
        let x = b.x, y = b.y, col = b.lime ? C.lime : C.paper, a = 1;
        if (t < b.ta) {
          const k = prog(t, ts, b.ta);
          const [ex, ey] = EMIT(b.em, ts);
          const e = E.outCubic(k);
          x = lerp(ex, b.x, e);
          y = lerp(ey, b.y, e) - Math.sin(k * Math.PI) * (80 + b.r * 120);
          col = b.r > 0.5 ? C.lime : '#ffffff';
        } else if (blow > 0) {
          const ang = b.r * P.TAU, sp = 600 + b.r * 900;
          x += Math.cos(ang) * sp * blow;
          y += Math.sin(ang) * sp * blow + 900 * blow * blow;
          a = 1 - blow;
        }
        if (lockFlash > 0.05 && t >= b.ta) col = P.rgba(P.mixc(b.lime ? C.lime : C.paper, '#ffffff', lockFlash));
        ctx.globalAlpha = a;
        ctx.fillStyle = col;
        ctx.fillRect(x, y, BLOCK - 1, BLOCK - 1);
      }
      ctx.globalAlpha = 1;
      // kicker
      if (t > 2.6) {
        const str = 'DECISÃO COM NÚMEROS, NÃO NO ACHISMO';
        const n = Math.floor(prog(t, 2.6, 3.4) * str.length);
        const nd = Math.floor(prog(t, T_BLOW, T_BLOW + 0.3) * str.length);
        ctx.font = P.font(24, 'Roboto Mono', 700);
        ctx.textAlign = 'center';
        ctx.fillStyle = P.rgba(C.paper, 0.8);
        ctx.fillText(str.slice(0, Math.max(0, n - nd)), 540, 288);
      }
      ctx.restore();
    },
    flash(t) {
      const pre = Math.pow(prog(t, 7.7, 8), 2) * 0.8;
      return 0.8 * P.pulse(t, 0, 10) + 0.3 * P.pulse(t, 2.5, 9) * (t >= 2.5 ? 1 : 0) + 0.45 * P.pulse(t, T_INSIGHT, 8) * (t >= T_INSIGHT ? 1 : 0) + pre;
    },
    chroma(t) {
      return (t >= T_INSIGHT ? 10 * P.pulse(t, T_INSIGHT, 7) : 0) + 14 * prog(t, T_BLOW, 8) + 8 * P.pulse(t, 0, 10);
    },
    audio(S) {
      S.groove({ kick: true, snare: true, hats: true, bass: [0, 15], arp: true, pad: true });
      ORDER.forEach((k) => {
        S.whoosh(WG[k][4] - 0.45, 0.45, 0.5, 1);
        S.thud(WG[k][4], 0.9);
      });
      for (let i = 0; i < 24; i++) S.blip(1.0 + i * 0.0625, [76, 79, 83, 88][i % 4] + (i > 12 ? 5 : 0), 0.45, 'square', 0.04);
      S.stamp(2.5, 0.7);
      for (let i = 0; i < 8; i++) S.blip(2.0 + i * 0.125, 72 + i * 2, 0.6, 'triangle', 0.08);
      for (let i = 0; i < 12; i++) S.click(3.0 + i * 0.0625, 0.6, 4500);
      S.stamp(T_INSIGHT, 1);
      S.boom(T_INSIGHT, 0.6);
      S.coin(T_INSIGHT + 0.02, 0.5);
      S.whoosh(T_EXIT0 + 0.2, 0.7, 1, 1);
      S.glitch(T_BLOW, 0.5, 1);
      S.riser(7.2, 0.8, 0.8);
    },
  };
  P.SLIDES[5] = slide;
})();

/* Slide 3 — CAMADAS: shards from slide 2 assemble the prism, it splits into layers, each face pops into a bot.
 * Two stations open: VIDEO EDITING (live preview that cuts on the beat, scopes, timeline + blade) and DEVELOPMENT
 * (code typed live, terminal, BUILD ✓). Bots gather in the corner and leave right. Panels fold on the last beat. */
(function () {
  const P = window.P, { W, H, C, ease: E, clamp, lerp, since, prog } = P;

  const PR = { x: 540, y: 690, size: 380, ry: -0.3, rx: 0.08 };
  const T_ASM = 1.0, T_SPLIT0 = 1.5, T_POP = 2.0, T_OPEN = 2.0, T_TITLE = 2.5, T_BUILD = 5.0;
  const T_GATHER = 6.0, T_LEAVE = 6.9, T_FOLD = 7.5;
  const VP = { x: 60, y: 384, w: 960, h: 420 }; // video panel
  const CP = { x: 60, y: 834, w: 960, h: 372 }; // code panel
  const FACE_COLORS = [C.lime, C.lilac, C.green, C.violet];
  const CUTS = [3.0, 4.0, 5.0, 6.0];

  // exploded "layers": each face slides apart vertically like a stacked diagram
  const LAYER_ORDER = [3, 1, 2, 0]; // top → bottom
  const layerOff = (id, k) => {
    const j = LAYER_ORDER.indexOf(id);
    return [(j - 1.5) * 46 * k, (j - 1.5) * 120 * k];
  };
  const faceCenter = (id, k) => {
    const f = P.prismFaces(PR).find((q) => q.id === id) || { cx: PR.x, cy: PR.y };
    const [dx, dy] = layerOff(id, k);
    return [f.cx + dx, f.cy + dy];
  };
  let SHARDS = null;
  const shards = () => (SHARDS = SHARDS || P.shatter(P.prismFaces(PR), 33, 1));

  // bot stations (after the pop) — [x, y] per face id 0..3
  const STATION = [
    [380, VP.y + VP.h - 70], // lime: blade on the timeline
    [870, CP.y + CP.h - 70], // lilac: typing
    [880, VP.y + 150], // green: scopes
    [610, CP.y + 120], // violet: carries code blocks
  ];
  const GATHER = [[900, 1100], [960, 1040], [840, 1060], [1000, 1110]];

  const panelK = (t) => {
    if (t < T_OPEN) return 0;
    if (t < T_FOLD) return E.outBack(prog(t, T_OPEN, T_OPEN + 0.35), 1.6);
    return 1 - E.inBack(prog(t, T_FOLD, 7.95), 2);
  };

  const CODE = [
    [['kw', 'import'], ['p', ' { '], ['fn', 'sobMedida'], ['p', ' } '], ['kw', 'from'], ['str', " './prisma'"]],
    [],
    [['kw', 'const'], ['p', ' sistema = '], ['fn', 'sobMedida'], ['p', '({']],
    [['p', '  cliente: '], ['str', "'sua-empresa'"], ['p', ',']],
    [['p', '  modulos: ['], ['str', "'vendas'"], ['p', ', '], ['str', "'estoque'"], ['p', ']']],
    [['p', '  automacao: '], ['kw', 'true'], ['p', ',']],
    [['p', '})']],
    [['kw', 'await'], ['p', ' sistema.'], ['fn', 'deploy'], ['p', '()']],
  ];
  const COL = { kw: C.lilacSoft, fn: C.green, str: C.lime, p: 'rgba(244,245,248,0.85)' };
  const CODE_LEN = CODE.reduce((s, l) => s + l.reduce((a, [, x]) => a + x.length, 0), 0);

  const botAt = (i, t) => {
    // returns pose for face-bot i
    const st = STATION[i], ga = GATHER[i];
    const pop = E.outBack(prog(t, T_POP, T_POP + 0.3), 2.5);
    const [fcx, fcy] = faceCenter(i, 1);
    const f = { cx: fcx, cy: fcy };
    let x, y, rot = 0, sx = 1, sy = 1;
    const toSt = E.outBack(prog(t, T_POP + 0.15, T_POP + 0.6), 1.4);
    x = lerp(f.cx, st[0], toSt);
    y = lerp(f.cy, st[1], toSt) - Math.sin(toSt * Math.PI) * 120;
    // work motions
    if (t > T_POP + 0.6 && t < T_GATHER) {
      if (i === 1) y += -Math.abs(Math.sin(t * Math.PI * 8)) * 12; // hammering keys on 16ths
      if (i === 0) x = lerp(st[0], VP.x + 120 + ((t - 2) / 5.5) * (VP.w - 240), 0.6) , y += Math.sin(t * 6) * 6;
      if (i === 2) y += Math.sin(t * 4) * 10;
      if (i === 3) {
        const k = ((t - 2.6) / 1.0) % 1;
        x = lerp(st[0], 300, Math.sin(k * Math.PI));
        y = st[1] + Math.sin(k * Math.PI * 2) * 40;
      }
    }
    // gather in the corner, bouncing
    const g = E.outBack(prog(t, T_GATHER + i * 0.08, T_GATHER + 0.45 + i * 0.08), 1.5);
    if (g > 0) {
      const bx = x, by = y;
      x = lerp(bx, ga[0], g);
      y = lerp(by, ga[1], g) - Math.abs(Math.sin((t - T_GATHER) * Math.PI * 4 + i)) * 26 * g;
    }
    // leave through the right edge, staggered
    const lv = prog(t, T_LEAVE + i * 0.1, T_LEAVE + 0.45 + i * 0.1);
    if (lv > 0) {
      const go = E.inQuart(lv);
      x = lerp(x, W + 200, go);
      y = lerp(y, P.LANE_Y + (i - 1.5) * 40, E.inOutCubic(lv));
      rot = 0.3 * go;
      sx = 1 + 0.5 * go;
      sy = 1 - 0.25 * go;
    }
    const land = P.wobble(t - (T_POP + 0.6), 3, 6);
    return { x, y, s: pop * 1.3, rot, sx: sx + 0.15 * land, sy: sy - 0.2 * land, color: FACE_COLORS[i], flame: 0.7 + (lv > 0 ? 1 : 0), seed: i * 2, t, look: [i === 1 ? -6 : 6, 4], mood: t > T_GATHER && t < T_LEAVE ? 'happy' : undefined, alive: lv < 1 && t >= T_POP };
  };

  const panel = (ctx, R, k, title, icon, t, accent) => {
    if (k <= 0.001) return false;
    ctx.save();
    ctx.translate(R.x + R.w / 2, R.y + R.h / 2);
    ctx.scale(1 + (1 - Math.min(1, k)) * 0.06, k);
    ctx.translate(-(R.x + R.w / 2), -(R.y + R.h / 2));
    P.rr(ctx, R.x, R.y, R.w, R.h, 18);
    ctx.fillStyle = 'rgba(10,16,32,0.92)';
    ctx.fill();
    P.glow(ctx, P.rgba(accent, 0.5), 30);
    ctx.lineWidth = 3;
    ctx.strokeStyle = P.rgba(accent, 0.9);
    ctx.stroke();
    P.noGlow(ctx);
    // header
    ctx.fillStyle = P.rgba(accent, 0.14);
    ctx.fillRect(R.x + 2, R.y + 2, R.w - 4, 44);
    ctx.font = P.font(24, 'Roboto Mono', 700);
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = accent;
    ctx.fillText(icon + '  ' + title, R.x + 22, R.y + 25);
    ctx.restore();
    return true;
  };

  // --- video preview scenes (cut on the beat) ---
  const scene = (ctx, x, y, w, h, t, idx) => {
    ctx.save();
    ctx.beginPath();
    ctx.rect(x, y, w, h);
    ctx.clip();
    const lt = t * 1.0;
    if (idx === 0) {
      const g = ctx.createLinearGradient(0, y, 0, y + h);
      g.addColorStop(0, '#2a1d7a');
      g.addColorStop(0.6, '#7b6cff');
      g.addColorStop(1, '#b8ff3a');
      ctx.fillStyle = g;
      ctx.fillRect(x, y, w, h);
      ctx.fillStyle = '#fff6d6';
      ctx.beginPath();
      ctx.arc(x + w * 0.6, y + h * 0.62 - (lt % 2) * 20, 52, 0, P.TAU);
      ctx.fill();
      for (const [k, col, amp] of [[0.4, '#2c2470', 50], [0.9, '#151040', 34]]) {
        ctx.fillStyle = col;
        ctx.beginPath();
        ctx.moveTo(x, y + h);
        for (let xx = 0; xx <= w; xx += 20) ctx.lineTo(x + xx, y + h * 0.72 + Math.sin(xx * 0.018 + lt * k * 3) * amp * 0.5 + Math.sin(xx * 0.05) * amp * 0.3);
        ctx.lineTo(x + w, y + h);
        ctx.fill();
      }
    } else if (idx === 1) {
      ctx.fillStyle = C.lime;
      ctx.fillRect(x, y, w, h);
      ctx.fillStyle = C.ink;
      ctx.font = P.font(150, 'Oswald', 700);
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('PRISMA', x + w / 2 + Math.sin(lt * 3) * 30, y + h / 2 + 8);
      ctx.fillStyle = C.violet;
      ctx.fillRect(x + ((lt * 400) % (w + 200)) - 100, y + h - 40, 100, 14);
    } else if (idx === 2) {
      ctx.fillStyle = '#0d0a2a';
      ctx.fillRect(x, y, w, h);
      ctx.globalCompositeOperation = 'lighter';
      for (let i = 0; i < 8; i++) {
        const r = ((lt * 120 + i * 60) % 480);
        ctx.strokeStyle = P.rgba(i % 2 ? C.lilac : C.lime, 1 - r / 480);
        ctx.lineWidth = 6;
        ctx.beginPath();
        ctx.arc(x + w / 2, y + h / 2, r, 0, P.TAU);
        ctx.stroke();
      }
      ctx.globalCompositeOperation = 'source-over';
      P.drawPrism(ctx, { x: x + w / 2, y: y + h / 2, size: 150, ry: lt * 2, edges: false });
    } else {
      ctx.fillStyle = '#120f30';
      ctx.fillRect(x, y, w, h);
      for (let i = 0; i < 14; i++) {
        const bh = 60 + P.hash(i, 3) * 160, bx = x + ((i * 46 - lt * 160) % (w + 60) + w + 60) % (w + 60) - 30;
        ctx.fillStyle = i % 3 ? '#2a2366' : '#4b39d9';
        ctx.fillRect(bx, y + h - bh, 40, bh);
        ctx.fillStyle = C.lime;
        for (let wy = y + h - bh + 12; wy < y + h - 10; wy += 22) if (P.hash(i * 7 + wy, 1) > 0.5) ctx.fillRect(bx + 10, wy, 8, 8);
      }
    }
    ctx.restore();
  };

  const slide = {
    n: 3,
    bgOpt: { glowAa: 0.16, glowBa: 0.08 },
    camera(t) {
      return P.camera(t, {
        impacts: [{ t: T_ASM, amp: 18, k: 7 }, { t: T_POP, amp: 14, k: 8 }, { t: T_OPEN + 0.2, amp: 10, k: 9 }, { t: T_BUILD, amp: 16, k: 8 }, ...CUTS.map((c) => ({ t: c, amp: 5, k: 12 }))],
        punches: [{ t: T_ASM, amt: 0.05 }, { t: T_BUILD, amt: 0.03 }],
        drift: 5,
        seed: 3,
      });
    },
    draw(ctx, t, cam) {
      ctx.save();
      P.applyCam(ctx, cam, 1);
      const pk = panelK(t);

      // ===== VIDEO PANEL =====
      if (panel(ctx, VP, pk, 'EDIÇÃO DE VÍDEO', '●', t, C.lime)) {
        ctx.save();
        ctx.translate(VP.x + VP.w / 2, VP.y + VP.h / 2);
        ctx.scale(1, pk);
        ctx.translate(-(VP.x + VP.w / 2), -(VP.y + VP.h / 2));
        // preview monitor
        const px = VP.x + 22, py = VP.y + 62, pw = 548, ph = 268;
        const beatIdx = Math.max(0, Math.floor((t - 2.5) / P.BEAT));
        scene(ctx, px, py, pw, ph, t, t < 2.5 ? 0 : beatIdx % 4);
        const cutFlash = t > 2.5 ? Math.exp(-((t - 2.5) % P.BEAT) * 26) : 0;
        ctx.fillStyle = `rgba(255,255,255,${0.7 * cutFlash})`;
        ctx.fillRect(px, py, pw, ph);
        ctx.strokeStyle = 'rgba(255,255,255,0.25)';
        ctx.lineWidth = 2;
        ctx.strokeRect(px, py, pw, ph);
        // REC + timecode
        ctx.fillStyle = Math.floor(t * 2) % 2 ? '#ff4d6d' : 'rgba(255,77,109,0.3)';
        ctx.beginPath();
        ctx.arc(px + 22, py + 22, 9, 0, P.TAU);
        ctx.fill();
        ctx.font = P.font(20, 'Roboto Mono', 700);
        ctx.fillStyle = '#ffffff';
        ctx.textAlign = 'left';
        const fr = Math.floor(t * 30);
        ctx.fillText(`00:00:0${Math.floor(t)}:${String(fr % 30).padStart(2, '0')}`, px + 40, py + 24);
        // scopes: waveform + colour wheels
        const sx0 = VP.x + 592, sy0 = VP.y + 62;
        ctx.fillStyle = '#05080f';
        ctx.fillRect(sx0, sy0, 346, 130);
        ctx.globalCompositeOperation = 'lighter';
        for (let i = 0; i < 70; i++) {
          const v = 0.5 + 0.35 * Math.sin(i * 0.3 + t * 5) + 0.15 * P.noise(i * 0.4 + t * 8, 2);
          ctx.fillStyle = P.rgba(i % 3 === 0 ? C.lime : C.green, 0.6);
          ctx.fillRect(sx0 + 8 + i * 4.7, sy0 + 120 - v * 100, 3, 3 + v * 20);
        }
        ctx.globalCompositeOperation = 'source-over';
        for (let i = 0; i < 3; i++) {
          const cx = sx0 + 58 + i * 115, cy = sy0 + 205;
          const cg = ctx.createConicGradient(t * 0.5, cx, cy);
          ['#ff4d6d', '#ffd23a', C.lime, '#3ad6ff', C.lilac, '#ff4d6d'].forEach((c, j) => cg.addColorStop(j / 5, c));
          ctx.fillStyle = cg;
          ctx.beginPath();
          ctx.arc(cx, cy, 46, 0, P.TAU);
          ctx.fill();
          P.radial(ctx, cx, cy, 46, '#1a2540', 0.9);
          const a = t * (1.5 + i) + i;
          ctx.fillStyle = '#ffffff';
          ctx.beginPath();
          ctx.arc(cx + Math.cos(a) * 22, cy + Math.sin(a) * 22, 6, 0, P.TAU);
          ctx.fill();
        }
        // timeline
        const tx = VP.x + 22, ty = VP.y + 300 + 46, tw = VP.w - 44;
        const tracks = [[C.lilac, 0], [C.green, 1], [C.lime, 2]];
        tracks.forEach(([col, ti]) => {
          const yy = ty + ti * 22;
          for (let c = 0; c < 6; c++) {
            const grow = E.outBack(prog(t, T_OPEN + 0.1 + c * 0.06 + ti * 0.05, T_OPEN + 0.4 + c * 0.06 + ti * 0.05), 1.5);
            const cx = tx + c * (tw / 6) + 3, cw = (tw / 6 - 6) * grow;
            ctx.fillStyle = P.rgba(col, ti === 2 ? 0.35 : 0.8);
            ctx.fillRect(cx, yy, cw, 18);
            if (ti === 2) {
              ctx.fillStyle = col;
              for (let xx = 0; xx < cw; xx += 5) {
                const a = Math.abs(Math.sin(xx * 0.21 + c)) * 7 + 2;
                ctx.fillRect(cx + xx, yy + 9 - a, 2, a * 2);
              }
            }
          }
        });
        // blade cuts on the beat
        for (const ct of CUTS) {
          if (t < ct) continue;
          const cx = tx + ((ct - 2) / 5.5) * tw;
          const a = Math.exp(-(t - ct) * 3);
          ctx.fillStyle = P.rgba('#ffffff', 0.4 + 0.6 * a);
          ctx.fillRect(cx - 2, ty - 6, 4, 72);
          P.sparks(ctx, cx, ty + 30, t - ct, { n: 16, seed: ct * 10, speed: 600, life: 0.45 });
        }
        // playhead
        const phx = tx + clamp((t - 2) / 5.5) * tw;
        ctx.fillStyle = '#ff4d6d';
        ctx.fillRect(phx - 1.5, ty - 12, 3, 80);
        ctx.beginPath();
        ctx.moveTo(phx - 9, ty - 16); ctx.lineTo(phx + 9, ty - 16); ctx.lineTo(phx, ty - 6);
        ctx.fill();
        ctx.restore();
      }

      // ===== CODE PANEL =====
      if (panel(ctx, CP, pk, 'DESENVOLVIMENTO', '</>', t, C.lilac)) {
        ctx.save();
        ctx.translate(CP.x + CP.w / 2, CP.y + CP.h / 2);
        ctx.scale(1, pk);
        ctx.translate(-(CP.x + CP.w / 2), -(CP.y + CP.h / 2));
        const nChars = Math.floor(prog(t, 2.3, 5.6) * CODE_LEN);
        let shown = 0, cursor = null;
        ctx.font = P.font(23, 'Roboto Mono', 500);
        ctx.textAlign = 'left';
        ctx.textBaseline = 'middle';
        CODE.forEach((line, li) => {
          const y = CP.y + 78 + li * 36;
          ctx.fillStyle = 'rgba(244,245,248,0.25)';
          ctx.fillText(String(li + 1).padStart(2, ' '), CP.x + 20, y);
          let x = CP.x + 66;
          for (const [kind, str] of line) {
            const take = Math.max(0, Math.min(str.length, nChars - shown));
            shown += str.length;
            if (take > 0) {
              ctx.fillStyle = COL[kind];
              const part = str.slice(0, take);
              ctx.fillText(part, x, y);
              x += ctx.measureText(part).width;
            }
            if (take < str.length && !cursor) cursor = [x, y];
          }
          if (!cursor && li === CODE.length - 1) cursor = [x, y];
        });
        if (cursor && Math.floor(t * 4) % 2 === 0) {
          ctx.fillStyle = C.lime;
          ctx.fillRect(cursor[0] + 2, cursor[1] - 14, 12, 28);
        }
        // terminal
        const tx = CP.x + 660, ty = CP.y + 62, tw = 280, th = 286;
        ctx.fillStyle = '#04060c';
        P.rr(ctx, tx, ty, tw, th, 10);
        ctx.fill();
        ctx.font = P.font(18, 'Roboto Mono', 500);
        ctx.fillStyle = C.green;
        ctx.fillText('$ npm run build', tx + 14, ty + 26);
        const bp = prog(t, 3.0, T_BUILD);
        ctx.fillStyle = 'rgba(255,255,255,0.12)';
        ctx.fillRect(tx + 14, ty + 50, tw - 28, 14);
        ctx.fillStyle = C.lime;
        ctx.fillRect(tx + 14, ty + 50, (tw - 28) * E.inOutCubic(bp), 14);
        ctx.fillStyle = 'rgba(244,245,248,0.6)';
        ['compilando módulos', 'testes: 48/48', 'otimizando bundle'].forEach((s, i) => {
          if (bp > i * 0.3 + 0.05) ctx.fillText('› ' + s, tx + 14, ty + 92 + i * 26);
        });
        if (t >= T_BUILD - 0.1) {
          const k = prog(t, T_BUILD - 0.1, T_BUILD);
          const sc = t < T_BUILD ? lerp(2.8, 1, E.inQuad(k)) : 1 - 0.12 * P.wobble(t - T_BUILD, 4, 7);
          ctx.save();
          ctx.translate(tx + tw / 2, ty + 222);
          ctx.rotate(-0.07);
          ctx.scale(sc, sc);
          P.glow(ctx, C.lime, 30);
          P.rr(ctx, -112, -36, 224, 72, 8);
          ctx.fillStyle = C.lime;
          ctx.fill();
          P.noGlow(ctx);
          ctx.fillStyle = C.ink;
          ctx.font = P.font(44, 'Oswald', 700);
          ctx.textAlign = 'center';
          ctx.fillText('BUILD ✓', 0, 3);
          ctx.restore();
          P.shock(ctx, tx + tw / 2, ty + 222, t - T_BUILD, { r1: 300, dur: 0.6, width: 10, fill: 0.1 });
        }
        ctx.restore();
      }

      // ===== handoff bot: arrives from slide 2 on the lane, herding the shards, then zips up =====
      if (t < 1.4) {
        const en = P.enterLeft(t, 0, 0.6, 330, 900);
        const up = E.inCubic(prog(t, 0.9, 1.4));
        const tr = [];
        for (let k = 6; k >= 0; k--) {
          const q = P.enterLeft(t - k * 0.025, 0, 0.6, 330, 900);
          tr.push([q.x - 40, q.y + 10]);
        }
        if (t < 0.6) P.trail(ctx, tr, C.lime, 40);
        P.drawBot(ctx, { x: en.x + up * 260, y: en.y - up * 1100, s: 1.3, rot: en.rot, sx: en.sx - up * 0.1, sy: en.sy + up * 0.3, flame: en.flame + up, t, color: C.lime, seed: 31, look: [10, -4], mood: t > 0.6 && t < 0.9 ? 'happy' : undefined });
      }
      // ===== PRISM ASSEMBLY / SPLIT =====
      if (t < T_POP + 0.3) {
        if (t < T_ASM) {
          // shards fly in from the left edge, snapping in four waves (16ths)
          for (const s of shards()) {
            const wave = s.id % 4;
            const tl = 0.3 + wave * 0.18 + s.r1 * 0.1;
            const k = E.outBack(prog(t, 0, tl), 1.2);
            const x0 = -120 - s.r2 * 300, y0 = P.LANE_Y - 200 + (s.r3 - 0.5) * 500;
            const x = lerp(x0, s.cx, k), y = lerp(y0, s.cy, k) - Math.sin(k * Math.PI) * 140 * s.r1;
            P.drawShard(ctx, s, x, y, (1 - k) * (s.r3 - 0.5) * 12, Math.cos((1 - k) * 6), 1, 1, 12);
            if (t > tl) P.sparks(ctx, s.cx, s.cy, t - tl, { n: 3, seed: s.i, speed: 300, life: 0.25, width: 2 });
          }
        } else {
          const ex = E.outBack(prog(t, T_SPLIT0, T_POP), 1.6);
          const shrink = 1 - E.inBack(prog(t, T_POP - 0.05, T_POP + 0.25), 2);
          const breathe = 1 + 0.04 * P.wobble(t - T_ASM, 3, 5);
          if (ex <= 0.001) P.drawPrism(ctx, { ...PR, size: PR.size * breathe, glow: 1.4, edgeGlow: P.pulse(t, T_ASM, 4) });
          else {
            // one copy per face, slid apart; dashed guides show the stack
            ctx.save();
            ctx.strokeStyle = P.rgba(C.lime, 0.5 * shrink);
            ctx.setLineDash([6, 8]);
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(PR.x - 230, PR.y - 260 * ex); ctx.lineTo(PR.x - 230, PR.y + 260 * ex);
            ctx.moveTo(PR.x + 250, PR.y - 260 * ex); ctx.lineTo(PR.x + 250, PR.y + 260 * ex);
            ctx.stroke();
            ctx.restore();
            for (const id of LAYER_ORDER.slice().reverse()) {
              const [dx, dy] = layerOff(id, ex);
              const [cx, cy] = faceCenter(id, ex);
              ctx.save();
              ctx.translate(cx, cy);
              ctx.scale(shrink, shrink);
              ctx.translate(-cx, -cy);
              const mask = [0, 0, 0, 0, 0, 0];
              mask[id] = 1;
              P.drawPrism(ctx, { ...PR, x: PR.x + dx, y: PR.y + dy, faces: mask, glow: 0, edgeGlow: 0.6 });
              ctx.restore();
            }
          }
        }
        P.shock(ctx, PR.x, PR.y, since(t, T_ASM), { r1: 700, dur: 0.7, width: 18, fill: 0.15 });
      }
      // pops
      for (let i = 0; i < 4; i++) {
        const [fx, fy] = faceCenter(i, 1);
        const f = { cx: fx, cy: fy };
        {
          P.shock(ctx, f.cx, f.cy, t - T_POP, { r1: 150, dur: 0.4, width: 8, color: FACE_COLORS[i], fill: 0.2 });
          P.sparks(ctx, f.cx, f.cy, t - T_POP, { n: 14, seed: i + 70, speed: 700, life: 0.5, color: FACE_COLORS[i] });
        }
      }
      // bots
      for (let i = 0; i < 4; i++) {
        const b = botAt(i, t);
        if (!b.alive || b.s <= 0.01) continue;
        if (t > T_LEAVE + i * 0.1 + 0.1) {
          const tr = [];
          for (let k = 6; k >= 0; k--) {
            const q = botAt(i, t - k * 0.02);
            tr.push([q.x - 20, q.y + 10]);
          }
          P.trail(ctx, tr, b.color, 30);
        }
        P.drawBot(ctx, { ...b, cargo: i === 3 && t < T_GATHER ? (cx) => { cx.font = P.font(40, 'Roboto Mono', 700); cx.fillStyle = C.lilacSoft; cx.textAlign = 'center'; cx.fillText('{ }', 0, 84); } : null });
        if (i === 1 && t > T_POP + 0.6 && t < T_GATHER) P.sparks(ctx, b.x, b.y + 50, (t * 8) % 1 * 0.125, { n: 4, seed: Math.floor(t * 8), speed: 260, life: 0.15, width: 2, color: C.lilac });
      }
      // gather arrow
      if (t > T_GATHER + 0.2 && t < T_LEAVE + 0.3) {
        const a = E.outBack(prog(t, T_GATHER + 0.2, T_GATHER + 0.5), 2) * (1 - prog(t, T_LEAVE, T_LEAVE + 0.3));
        const nudge = Math.abs(Math.sin((t - T_GATHER) * Math.PI * 2)) * 18;
        ctx.save();
        ctx.translate(960 + nudge, 960);
        ctx.scale(a, a);
        P.glow(ctx, C.lime, 30);
        ctx.fillStyle = C.lime;
        ctx.beginPath();
        ctx.moveTo(-60, -22); ctx.lineTo(10, -22); ctx.lineTo(10, -48); ctx.lineTo(60, 0); ctx.lineTo(10, 48); ctx.lineTo(10, 22); ctx.lineTo(-60, 22);
        ctx.closePath();
        ctx.fill();
        ctx.restore();
      }
      ctx.restore();

      // ===== TITLE (front) =====
      ctx.save();
      P.applyCam(ctx, cam, 1.15);
      [['DO CÓDIGO', 196, C.paper, T_TITLE], ['AO CORTE.', 306, C.lime, T_TITLE + 0.5]].forEach(([str, y, col, t0], li) => {
        const L = P.layout(ctx, str, 112, { align: 'left', cx: 70, track: 0.01 });
        L.chars.forEach((c, i) => {
          const tl = t0 + i * 0.045;
          if (t < tl - 0.2) return;
          const fl = E.outBack(prog(t, tl - 0.2, tl), 2);
          const fall = prog(t, T_FOLD + i * 0.015 + li * 0.05, 8);
          ctx.save();
          ctx.translate(c.x, y + 900 * fall * fall);
          ctx.rotate(fall * (P.hash(i, li) - 0.5) * 3);
          ctx.scale(1, Math.max(0.001, fl));
          ctx.fillStyle = col;
          if (li === 1) P.glow(ctx, P.rgba(C.lime, 0.5), 20);
          P.glyph(ctx, c.ch, L.size, 'Oswald', 700, L.cap);
          ctx.restore();
        });
      });
      ctx.restore();
    },
    flash(t) {
      return 0.4 * P.pulse(t, T_ASM, 9) * (t >= T_ASM ? 1 : 0) + 0.25 * P.pulse(t, T_BUILD, 10) * (t >= T_BUILD ? 1 : 0);
    },
    chroma(t) {
      return t >= T_ASM ? 8 * P.pulse(t, T_ASM, 8) : 0;
    },
    audio(S) {
      S.groove({ kick: [2, 16], snare: [4, 15], hats: [0, 16], bass: [4, 15], arp: [4, 16], pad: true });
      for (let i = 0; i < 4; i++) S.click(0.3 + i * 0.18, 1, 4000 + i * 600);
      S.whoosh(0, 0.45, 0.8, 1);
      S.stamp(T_ASM, 1);
      S.boom(T_ASM, 0.5);
      for (let i = 0; i < 4; i++) S.blip(T_POP + i * 0.03, [72, 76, 79, 84][i], 1, 'square', 0.1);
      S.thud(T_OPEN + 0.25, 1);
      S.servo(T_OPEN, 0.3, 1, true);
      for (let s = 0; s < 26; s++) S.key(2.4 + s * 0.125, 0.9);
      for (const c of CUTS) S.zap(c, 0.6, 3400, 900);
      S.stamp(T_BUILD, 1);
      S.coin(T_BUILD + 0.05, 0.6);
      for (let i = 0; i < 4; i++) S.blip(T_GATHER + i * 0.125, [84, 86, 88, 91][i], 0.8);
      for (let i = 0; i < 4; i++) S.whoosh(T_LEAVE + i * 0.1, 0.45, 0.5, 1);
      S.servo(T_FOLD, 0.4, 1, false);
    },
  };
  P.SLIDES[3] = slide;
})();

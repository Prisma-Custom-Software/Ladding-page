/* Prisma carousel engine — music and SFX synthesised with Web Audio (OfflineAudioContext).
 * Each slide renders 8 s at 120 BPM; anything ringing past 8 s is folded back onto the start, so the loop is seamless. */
(function (G) {
  const P = G.P;
  const SR = 48000;
  const TAIL = 3;
  const mtof = (m) => 440 * Math.pow(2, (m - 69) / 12);
  P.mtof = mtof;

  class Synth {
    constructor(ac) {
      this.ac = ac;
      this.master = ac.createGain();
      this.master.gain.value = 0.9;
      const comp = ac.createDynamicsCompressor();
      comp.threshold.value = -14;
      comp.ratio.value = 4;
      comp.attack.value = 0.003;
      comp.release.value = 0.12;
      this.master.connect(comp).connect(ac.destination);
      // music bus with sidechain-style ducking
      this.music = ac.createGain();
      this.music.connect(this.master);
      this.sfx = ac.createGain();
      this.sfx.gain.value = 0.85;
      this.sfx.connect(this.master);
      // reverb
      this.verb = ac.createConvolver();
      this.verb.buffer = this.impulse(2.2, 2.6);
      const vg = ac.createGain();
      vg.gain.value = 0.32;
      this.verb.connect(vg).connect(this.master);
      // ping-pong-ish delay (dotted eighth)
      this.dl = ac.createDelay(2);
      this.dl.delayTime.value = 0.375;
      const fb = ac.createGain();
      fb.gain.value = 0.32;
      const dlf = ac.createBiquadFilter();
      dlf.type = 'lowpass';
      dlf.frequency.value = 3200;
      this.dl.connect(dlf).connect(fb).connect(this.dl);
      const dg = ac.createGain();
      dg.gain.value = 0.28;
      dlf.connect(dg).connect(this.master);
      this.noise = this.makeNoise(2);
    }
    impulse(sec, decay) {
      const len = SR * sec, b = this.ac.createBuffer(2, len, SR), r = P.rng(31);
      for (let c = 0; c < 2; c++) {
        const d = b.getChannelData(c);
        for (let i = 0; i < len; i++) d[i] = (r() * 2 - 1) * Math.pow(1 - i / len, decay);
      }
      return b;
    }
    makeNoise(sec) {
      const len = SR * sec, b = this.ac.createBuffer(1, len, SR), r = P.rng(17), d = b.getChannelData(0);
      for (let i = 0; i < len; i++) d[i] = r() * 2 - 1;
      return b;
    }
    env(g, t, a, d, peak = 1, sus = 0, rel = 0.05, hold = 0) {
      g.gain.setValueAtTime(0, t);
      g.gain.linearRampToValueAtTime(peak, t + a);
      if (hold) g.gain.setValueAtTime(peak, t + a + hold);
      g.gain.exponentialRampToValueAtTime(Math.max(0.0001, sus * peak || 0.0001), t + a + hold + d);
      if (sus) g.gain.exponentialRampToValueAtTime(0.0001, t + a + hold + d + rel);
    }
    out(node, bus = 'sfx', { verb = 0, delay = 0, pan = 0 } = {}) {
      let n = node;
      if (pan) {
        const p = this.ac.createStereoPanner();
        p.pan.value = pan;
        n.connect(p);
        n = p;
      }
      n.connect(bus === 'music' ? this.music : this.sfx);
      if (verb) {
        const g = this.ac.createGain();
        g.gain.value = verb;
        n.connect(g).connect(this.verb);
      }
      if (delay) {
        const g = this.ac.createGain();
        g.gain.value = delay;
        n.connect(g).connect(this.dl);
      }
      return n;
    }
    osc(type, f, t, stop) {
      const o = this.ac.createOscillator();
      o.type = type;
      o.frequency.setValueAtTime(f, t);
      o.start(t);
      o.stop(stop);
      return o;
    }
    noiseSrc(t, stop, rate = 1) {
      const s = this.ac.createBufferSource();
      s.buffer = this.noise;
      s.loop = true;
      s.playbackRate.value = rate;
      s.start(t, (t * 0.37) % 1.5);
      s.stop(stop);
      return s;
    }
    filt(type, f, Q = 1) {
      const b = this.ac.createBiquadFilter();
      b.type = type;
      b.frequency.value = f;
      b.Q.value = Q;
      return b;
    }
    gain(v = 1) {
      const g = this.ac.createGain();
      g.gain.value = v;
      return g;
    }

    // ---------- drums ----------
    kick(t, v = 1) {
      const o = this.osc('sine', 170, t, t + 0.6);
      o.frequency.exponentialRampToValueAtTime(44, t + 0.13);
      const g = this.gain();
      this.env(g, t, 0.002, 0.5, 1.1 * v);
      o.connect(g);
      this.out(g, 'sfx');
      const n = this.noiseSrc(t, t + 0.03), hp = this.filt('highpass', 2500), ng = this.gain();
      this.env(ng, t, 0.001, 0.02, 0.35 * v);
      n.connect(hp).connect(ng);
      this.out(ng, 'sfx');
      // duck the music bus
      const m = this.music.gain;
      m.setValueAtTime(0.35, t);
      m.linearRampToValueAtTime(1, t + 0.22);
    }
    snare(t, v = 1) {
      const n = this.noiseSrc(t, t + 0.3), bp = this.filt('bandpass', 1900, 0.7), g = this.gain();
      this.env(g, t, 0.001, 0.2, 0.7 * v);
      n.connect(bp).connect(g);
      this.out(g, 'sfx', { verb: 0.35 });
      const o = this.osc('triangle', 220, t, t + 0.2);
      o.frequency.exponentialRampToValueAtTime(150, t + 0.1);
      const og = this.gain();
      this.env(og, t, 0.001, 0.12, 0.5 * v);
      o.connect(og);
      this.out(og, 'sfx');
    }
    clap(t, v = 1) {
      for (let i = 0; i < 3; i++) {
        const tt = t + i * 0.011;
        const n = this.noiseSrc(tt, tt + 0.2), bp = this.filt('bandpass', 1300, 1.2), g = this.gain();
        this.env(g, tt, 0.001, i === 2 ? 0.18 : 0.02, 0.6 * v);
        n.connect(bp).connect(g);
        this.out(g, 'sfx', { verb: 0.4 });
      }
    }
    hat(t, v = 1, open = false) {
      const n = this.noiseSrc(t, t + 0.4, 1.3), hp = this.filt('highpass', 7600), g = this.gain();
      this.env(g, t, 0.001, open ? 0.22 : 0.04, 0.28 * v);
      n.connect(hp).connect(g);
      this.out(g, 'sfx', { pan: open ? 0.2 : -0.15 });
    }
    // ---------- tonal ----------
    bass(t, m, dur = 0.24, v = 1) {
      const end = t + dur + 0.1;
      const o1 = this.osc('sawtooth', mtof(m), t, end), o2 = this.osc('square', mtof(m - 12), t, end);
      const lp = this.filt('lowpass', 1400, 6);
      lp.frequency.setValueAtTime(1600, t);
      lp.frequency.exponentialRampToValueAtTime(180, t + dur);
      const g = this.gain();
      this.env(g, t, 0.004, dur, 0.42 * v);
      o1.connect(lp);
      const g2 = this.gain(0.5);
      o2.connect(g2).connect(lp);
      lp.connect(g);
      this.out(g, 'music');
    }
    pluck(t, m, dur = 0.18, v = 1, pan = 0) {
      const end = t + dur + 0.2;
      const o = this.osc('square', mtof(m), t, end), o2 = this.osc('sawtooth', mtof(m) * 1.004, t, end);
      const lp = this.filt('lowpass', 4000, 3);
      lp.frequency.setValueAtTime(5200, t);
      lp.frequency.exponentialRampToValueAtTime(700, t + dur);
      const g = this.gain();
      this.env(g, t, 0.003, dur, 0.1 * v);
      o.connect(lp);
      o2.connect(lp);
      lp.connect(g);
      this.out(g, 'music', { verb: 0.25, delay: 0.35, pan });
    }
    pad(t, ms, dur, v = 1) {
      const end = t + dur + 0.8;
      const lp = this.filt('lowpass', 1500, 0.8), g = this.gain();
      g.gain.setValueAtTime(0, t);
      g.gain.linearRampToValueAtTime(0.06 * v, t + 0.25);
      g.gain.setValueAtTime(0.06 * v, t + dur);
      g.gain.linearRampToValueAtTime(0, t + dur + 0.7);
      for (const m of ms)
        for (const d of [-8, 8]) {
          const o = this.osc('sawtooth', mtof(m), t, end);
          o.detune.value = d;
          o.connect(lp);
        }
      lp.connect(g);
      this.out(g, 'music', { verb: 0.5 });
    }
    // ---------- SFX ----------
    boom(t, v = 1) {
      const o = this.osc('sine', 90, t, t + 1.6);
      o.frequency.exponentialRampToValueAtTime(28, t + 1.2);
      const g = this.gain();
      this.env(g, t, 0.003, 1.4, 1.0 * v);
      o.connect(g);
      this.out(g, 'sfx');
      const n = this.noiseSrc(t, t + 1.4), lp = this.filt('lowpass', 500), ng = this.gain();
      lp.frequency.exponentialRampToValueAtTime(60, t + 1.2);
      this.env(ng, t, 0.002, 1.1, 0.7 * v);
      n.connect(lp).connect(ng);
      this.out(ng, 'sfx', { verb: 0.5 });
    }
    stamp(t, v = 1) {
      const o = this.osc('sine', 140, t, t + 0.5);
      o.frequency.exponentialRampToValueAtTime(48, t + 0.18);
      const g = this.gain();
      this.env(g, t, 0.001, 0.4, 1.0 * v);
      o.connect(g);
      this.out(g, 'sfx', { verb: 0.3 });
      const n = this.noiseSrc(t, t + 0.2), bp = this.filt('bandpass', 900, 0.6), ng = this.gain();
      this.env(ng, t, 0.001, 0.12, 0.8 * v);
      n.connect(bp).connect(ng);
      this.out(ng, 'sfx', { verb: 0.3 });
    }
    thud(t, v = 1, pan = 0) {
      const o = this.osc('sine', 120, t, t + 0.3);
      o.frequency.exponentialRampToValueAtTime(55, t + 0.1);
      const g = this.gain();
      this.env(g, t, 0.001, 0.2, 0.6 * v);
      o.connect(g);
      this.out(g, 'sfx', { pan });
      const n = this.noiseSrc(t, t + 0.08), hp = this.filt('bandpass', 3000, 1), ng = this.gain();
      this.env(ng, t, 0.001, 0.04, 0.25 * v);
      n.connect(hp).connect(ng);
      this.out(ng, 'sfx', { pan });
    }
    laser(t, dur, v = 1) {
      const end = t + dur;
      const o1 = this.osc('sawtooth', 220, t, end + 0.1), o2 = this.osc('square', 331, t, end + 0.1);
      const lfo = this.osc('sine', 32, t, end + 0.1), lg = this.gain(60);
      lfo.connect(lg);
      lg.connect(o1.frequency);
      lg.connect(o2.frequency);
      const bp = this.filt('bandpass', 1200, 2.5);
      bp.frequency.setValueAtTime(600, t);
      bp.frequency.linearRampToValueAtTime(2600, end);
      const g = this.gain();
      g.gain.setValueAtTime(0, t);
      g.gain.linearRampToValueAtTime(0.32 * v, t + 0.03);
      g.gain.setValueAtTime(0.32 * v, end - 0.05);
      g.gain.linearRampToValueAtTime(0, end);
      o1.connect(bp);
      o2.connect(bp);
      bp.connect(g);
      this.out(g, 'sfx', { verb: 0.25 });
      const n = this.noiseSrc(t, end), hp = this.filt('highpass', 5000), ng = this.gain();
      ng.gain.setValueAtTime(0.08 * v, t);
      ng.gain.linearRampToValueAtTime(0, end);
      n.connect(hp).connect(ng);
      this.out(ng, 'sfx');
      this.zap(t, v);
    }
    zap(t, v = 1, f0 = 2600, f1 = 180) {
      const o = this.osc('square', f0, t, t + 0.3);
      o.frequency.exponentialRampToValueAtTime(f1, t + 0.22);
      const g = this.gain(), lp = this.filt('lowpass', 6000);
      this.env(g, t, 0.002, 0.22, 0.22 * v);
      o.connect(lp).connect(g);
      this.out(g, 'sfx', { verb: 0.3, delay: 0.2 });
    }
    shatter(t, v = 1) {
      const r = P.rng(Math.floor(t * 100) + 3);
      for (let i = 0; i < 46; i++) {
        const tt = t + Math.pow(r(), 2) * 0.9;
        const o = this.osc('sine', 2200 + r() * 7000, tt, tt + 0.25), g = this.gain();
        this.env(g, tt, 0.001, 0.05 + r() * 0.16, (0.06 + r() * 0.08) * v);
        o.connect(g);
        this.out(g, 'sfx', { pan: r() * 2 - 1, verb: 0.3 });
      }
      const n = this.noiseSrc(t, t + 1.2), hp = this.filt('highpass', 2800), g = this.gain();
      this.env(g, t, 0.001, 0.9, 0.55 * v);
      n.connect(hp).connect(g);
      this.out(g, 'sfx', { verb: 0.4 });
      this.boom(t, 0.9 * v);
    }
    whoosh(t, dur = 0.6, v = 1, dir = 1) {
      const n = this.noiseSrc(t, t + dur + 0.05), bp = this.filt('bandpass', 400, 1.4), g = this.gain();
      bp.frequency.setValueAtTime(300, t);
      bp.frequency.exponentialRampToValueAtTime(3200, t + dur * 0.7);
      bp.frequency.exponentialRampToValueAtTime(900, t + dur);
      g.gain.setValueAtTime(0, t);
      g.gain.linearRampToValueAtTime(0.5 * v, t + dur * 0.65);
      g.gain.linearRampToValueAtTime(0, t + dur);
      const p = this.ac.createStereoPanner();
      p.pan.setValueAtTime(-0.8 * dir, t);
      p.pan.linearRampToValueAtTime(0.8 * dir, t + dur);
      n.connect(bp).connect(g).connect(p);
      this.out(p, 'sfx', { verb: 0.2 });
    }
    riser(t, dur = 1, v = 1) {
      const n = this.noiseSrc(t, t + dur), hp = this.filt('bandpass', 500, 2), g = this.gain();
      hp.frequency.setValueAtTime(400, t);
      hp.frequency.exponentialRampToValueAtTime(7000, t + dur);
      g.gain.setValueAtTime(0, t);
      g.gain.linearRampToValueAtTime(0.32 * v, t + dur);
      n.connect(hp).connect(g);
      this.out(g, 'sfx', { verb: 0.3 });
      const o = this.osc('sawtooth', 110, t, t + dur), lp = this.filt('lowpass', 2000), og = this.gain();
      o.frequency.exponentialRampToValueAtTime(880, t + dur);
      og.gain.setValueAtTime(0, t);
      og.gain.linearRampToValueAtTime(0.07 * v, t + dur);
      o.connect(lp).connect(og);
      this.out(og, 'sfx');
    }
    blip(t, m = 84, v = 1, type = 'square', dur = 0.07, pan = 0) {
      const o = this.osc(type, mtof(m), t, t + dur + 0.05), g = this.gain();
      this.env(g, t, 0.002, dur, 0.12 * v);
      o.connect(g);
      this.out(g, 'sfx', { delay: 0.25, pan });
    }
    click(t, v = 1, f = 3200, pan = 0) {
      const n = this.noiseSrc(t, t + 0.03), bp = this.filt('bandpass', f, 3), g = this.gain();
      this.env(g, t, 0.0005, 0.018, 0.5 * v);
      n.connect(bp).connect(g);
      this.out(g, 'sfx', { pan });
    }
    key(t, v = 1) {
      this.click(t, 0.55 * v, 2400 + P.hash(t * 100) * 2500, P.hash(t * 37) * 0.6 - 0.3);
    }
    coin(t, v = 1) {
      [[83, 0], [88, 0.08]].forEach(([m, d]) => {
        const o = this.osc('square', mtof(m), t + d, t + d + 0.5), g = this.gain();
        this.env(g, t + d, 0.002, d ? 0.45 : 0.08, 0.14 * v);
        o.connect(g);
        this.out(g, 'sfx', { verb: 0.3, delay: 0.25 });
      });
    }
    powerDown(t, v = 1) {
      const o = this.osc('sawtooth', 900, t, t + 0.55), lp = this.filt('lowpass', 3000), g = this.gain();
      o.frequency.exponentialRampToValueAtTime(30, t + 0.5);
      lp.frequency.exponentialRampToValueAtTime(120, t + 0.5);
      this.env(g, t, 0.005, 0.5, 0.3 * v);
      o.connect(lp).connect(g);
      this.out(g, 'sfx', { verb: 0.3 });
    }
    bootUp(t, v = 1) {
      const o = this.osc('sine', 120, t, t + 0.9), g = this.gain();
      o.frequency.exponentialRampToValueAtTime(1400, t + 0.7);
      this.env(g, t, 0.05, 0.8, 0.18 * v);
      o.connect(g);
      this.out(g, 'sfx', { verb: 0.4 });
    }
    servo(t, dur = 0.5, v = 1, up = true) {
      const o = this.osc('sawtooth', up ? 180 : 420, t, t + dur), bp = this.filt('bandpass', 800, 3), g = this.gain();
      o.frequency.linearRampToValueAtTime(up ? 420 : 180, t + dur);
      g.gain.setValueAtTime(0, t);
      g.gain.linearRampToValueAtTime(0.12 * v, t + 0.04);
      g.gain.setValueAtTime(0.12 * v, t + dur - 0.05);
      g.gain.linearRampToValueAtTime(0, t + dur);
      o.connect(bp).connect(g);
      this.out(g, 'sfx');
    }
    glitch(t, dur = 0.3, v = 1) {
      const r = P.rng(Math.floor(t * 1000));
      for (let tt = t; tt < t + dur; tt += 0.025 + r() * 0.03) {
        const o = this.osc('square', 80 + r() * 1800, tt, tt + 0.03), g = this.gain();
        this.env(g, tt, 0.001, 0.02, 0.12 * v);
        o.connect(g);
        this.out(g, 'sfx', { pan: r() * 1.6 - 0.8 });
      }
    }
    neon(t, dur = 0.6, v = 1) {
      const o = this.osc('sawtooth', 100, t, t + dur), lp = this.filt('lowpass', 900), g = this.gain();
      const r = P.rng(Math.floor(t * 77));
      g.gain.setValueAtTime(0, t);
      for (let tt = t; tt < t + dur; tt += 0.04) g.gain.setValueAtTime(r() > 0.45 ? 0.1 * v : 0, tt);
      g.gain.setValueAtTime(0, t + dur);
      o.connect(lp).connect(g);
      this.out(g, 'sfx');
    }
    rewind(t, dur = 0.5, v = 1) {
      const o = this.osc('sawtooth', 200, t, t + dur), bp = this.filt('bandpass', 1500, 2), g = this.gain();
      o.frequency.exponentialRampToValueAtTime(2400, t + dur);
      const lfo = this.osc('square', 18, t, t + dur), lg = this.gain(0.5);
      g.gain.setValueAtTime(0.12 * v, t);
      lfo.connect(lg).connect(g.gain);
      g.gain.linearRampToValueAtTime(0, t + dur);
      o.connect(bp).connect(g);
      this.out(g, 'sfx', { verb: 0.2 });
    }

    // ---------- arrangement helper ----------
    /** Am | F | C | G at 120 BPM. opts toggle layers; `from`/`to` limit in beats */
    groove(o = {}) {
      const B = P.BEAT;
      const chords = [[57, 60, 64], [53, 57, 60], [48, 52, 55], [55, 59, 62]];
      const roots = [33, 29, 36, 31];
      const inRange = (beat, k) => {
        const r = o[k];
        if (!r) return false;
        if (r === true) return true;
        return beat >= r[0] && beat < r[1];
      };
      for (let beat = 0; beat < 16; beat++) {
        const t = beat * B, bar = Math.floor(beat / 4);
        if (inRange(beat, 'kick')) this.kick(t, 0.95);
        if (inRange(beat, 'snare') && beat % 2 === 1) (beat % 4 === 3 ? this.clap(t, 0.8) : this.snare(t, 0.8));
        if (inRange(beat, 'hats')) {
          this.hat(t + B / 2, 0.9, true);
          this.hat(t + B / 4, 0.45);
          this.hat(t + (3 * B) / 4, 0.45);
        }
        if (inRange(beat, 'bass')) {
          const r = roots[bar];
          [0, 0.5].forEach((h, i) => this.bass(t + h * B, r + (i === 1 && beat % 2 ? 12 : 0), 0.2, 0.9));
        }
        if (inRange(beat, 'arp')) {
          const ch = chords[bar];
          for (let s = 0; s < 4; s++) {
            const idx = (beat * 4 + s) % 4;
            const m = ch[idx % 3] + 12 + (idx === 3 ? 12 : 0);
            this.pluck(t + (s * B) / 4, m, 0.12, 0.85, s % 2 ? 0.3 : -0.3);
          }
        }
        if (inRange(beat, 'pad') && beat % 4 === 0) this.pad(t, chords[bar], 4 * B - 0.1, 0.9);
      }
    }
  }

  /** render a slide's audio; returns {L, R, sr} with seam folded */
  P.renderAudio = async (slide) => {
    const ac = new OfflineAudioContext(2, SR * (P.DUR + TAIL), SR);
    const S = new Synth(ac);
    slide.audio(S);
    const buf = await ac.startRendering();
    const n = SR * P.DUR;
    const L = new Float32Array(n), R = new Float32Array(n);
    const a = buf.getChannelData(0), b = buf.getChannelData(1);
    for (let i = 0; i < buf.length; i++) {
      L[i % n] += a[i];
      R[i % n] += b[i];
    }
    let peak = 0;
    for (let i = 0; i < n; i++) peak = Math.max(peak, Math.abs(L[i]), Math.abs(R[i]));
    // normalise, then a soft tanh limiter with drive pushes loudness toward ~-14 LUFS (Instagram) without clipping
    const g = peak > 0 ? 1 / peak : 1, DRIVE = 2.4, k = 0.88 / Math.tanh(DRIVE);
    for (let i = 0; i < n; i++) {
      L[i] = Math.tanh(L[i] * g * DRIVE) * k;
      R[i] = Math.tanh(R[i] * g * DRIVE) * k;
    }
    return { L, R, sr: SR };
  };
  P.wav = ({ L, R, sr }) => {
    const n = L.length, buf = new ArrayBuffer(44 + n * 4), v = new DataView(buf);
    const ws = (o, s) => [...s].forEach((c, i) => v.setUint8(o + i, c.charCodeAt(0)));
    ws(0, 'RIFF'); v.setUint32(4, 36 + n * 4, true); ws(8, 'WAVE'); ws(12, 'fmt ');
    v.setUint32(16, 16, true); v.setUint16(20, 1, true); v.setUint16(22, 2, true);
    v.setUint32(24, sr, true); v.setUint32(28, sr * 4, true); v.setUint16(32, 4, true); v.setUint16(34, 16, true);
    ws(36, 'data'); v.setUint32(40, n * 4, true);
    let o = 44;
    for (let i = 0; i < n; i++) {
      v.setInt16(o, Math.max(-1, Math.min(1, L[i])) * 32767, true);
      v.setInt16(o + 2, Math.max(-1, Math.min(1, R[i])) * 32767, true);
      o += 4;
    }
    return buf;
  };
})(window);

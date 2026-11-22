"""Trilha original do reel institucional da Prisma, sintetizada em código.

120 BPM, Lá menor (Am - F - C - G), 20 s. Todos os eventos de interface (cliques,
whooshes, pops) vêm do mesmo timeline.json que a animação usa, então caem na batida
e no quadro exato do vídeo.

Uso: python3 video-institucional/music.py   ->  video-institucional/out/trilha.wav
"""
import json
from pathlib import Path

import numpy as np
from scipy.io import wavfile
from scipy.signal import butter, fftconvolve, sosfilt

HERE = Path(__file__).resolve().parent
TL = json.loads((HERE / "timeline.json").read_text())
SR = 48000
DUR = TL["duration"]
BEAT = 60 / TL["bpm"]
N = int(SR * DUR)
rng = np.random.default_rng(7)

L = np.zeros(N)
R = np.zeros(N)
SC = np.ones(N)  # envelope de sidechain (o kick abaixa os pads)


def add(sig, t, gain=1.0, pan=0.0):
    i = int(round(t * SR))
    if i >= N:
        return
    sig = sig[: N - i] * gain
    L[i : i + len(sig)] += sig * np.sqrt(0.5 * (1 - pan))
    R[i : i + len(sig)] += sig * np.sqrt(0.5 * (1 + pan))


def tt(d):
    return np.arange(int(d * SR)) / SR


def env(d, a=0.003, r=None, curve=6.0):
    t = tt(d)
    e = np.minimum(1, t / max(a, 1e-4))
    rel = np.exp(-curve * t / d) if r is None else np.exp(-t / r)
    return e * rel


def lp(x, f, order=2):
    return sosfilt(butter(order, min(f, SR / 2 - 100), "low", fs=SR, output="sos"), x)


def hp(x, f, order=2):
    return sosfilt(butter(order, f, "high", fs=SR, output="sos"), x)


def bp(x, lo, hi):
    return sosfilt(butter(2, [lo, hi], "band", fs=SR, output="sos"), x)


def svf(x, fc, q=0.7, mode="lp"):
    """Filtro de estado variável (Chamberlin) com corte que muda amostra a amostra."""
    fc = np.broadcast_to(np.asarray(fc, dtype=float), x.shape)
    f = 2 * np.sin(np.pi * np.minimum(fc, SR / 6) / SR)
    damp = 1 / q
    low = band = 0.0
    out = np.empty_like(x)
    for i in range(len(x)):
        high = x[i] - low - damp * band
        band += f[i] * high
        low += f[i] * band
        out[i] = low if mode == "lp" else band
    return out


def saw(freq, d, detune=0.0):
    t = tt(d)
    out = np.zeros_like(t)
    for dt in ([0] if detune == 0 else [-detune, 0, detune]):
        ph = (t * freq * (1 + dt)) % 1.0
        out += 2 * ph - 1
    return out / (1 if detune == 0 else 3)


def note(n):  # midi -> Hz
    return 440 * 2 ** ((n - 69) / 12)


# ---------------- instrumentos ----------------
def kick(big=False):
    d = 0.55 if big else 0.38
    t = tt(d)
    f = 45 + (160 if big else 120) * np.exp(-t * 32)
    ph = 2 * np.pi * np.cumsum(f) / SR
    body = np.sin(ph) * np.exp(-t * (5 if big else 8))
    click = hp(rng.standard_normal(len(t)), 2500) * np.exp(-t * 300) * 0.3
    return np.tanh((body + click) * 1.6)


def clap():
    d = 0.25
    t = tt(d)
    n = bp(rng.standard_normal(len(t)), 900, 5000)
    e = np.zeros_like(t)
    for k, o in enumerate([0, 0.011, 0.022]):
        e += np.where(t >= o, np.exp(-(t - o) * (120 if k < 2 else 22)), 0)
    return n * e * 0.8


def hat(open_=False):
    d = 0.18 if open_ else 0.05
    t = tt(d)
    return hp(rng.standard_normal(len(t)), 7000) * np.exp(-t * (18 if open_ else 90))


def bass(freq, d):
    t = tt(d)
    s = saw(freq, d) * 0.6 + np.sin(2 * np.pi * freq * t)
    s = svf(s, 380 + 900 * np.exp(-t * 12))
    return np.tanh(s * 1.5) * env(d, 0.004, curve=3)


def pad(freqs, d):
    s = sum(saw(f, d, 0.006) for f in freqs) / len(freqs)
    s = lp(s, 1800)
    t = tt(d)
    a = np.minimum(1, t / 0.08) * np.minimum(1, (d - t) / 0.15)
    return s * a


def pluck(freq, d=0.22):
    t = tt(d)
    s = np.sign(np.sin(2 * np.pi * freq * t)) * 0.5 + saw(freq * 2, d) * 0.3
    s = svf(s, 1200 + 5000 * np.exp(-t * 30))
    return s * env(d, 0.002, curve=9)


def ui_click():
    t = tt(0.06)
    s = np.sin(2 * np.pi * 2300 * t) * np.exp(-t * 140) + hp(rng.standard_normal(len(t)), 3000) * np.exp(-t * 600) * 0.6
    return s


def tick(i):
    t = tt(0.09)
    return np.sin(2 * np.pi * note(84 + [0, 3, 7, 10, 12, 15, 19][i % 7]) * t) * np.exp(-t * 45)


def pop():
    t = tt(0.1)
    f = 300 + 900 * np.exp(-t * 60)
    return np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 35)


def whoosh(d=0.45, up=True):
    t = tt(d)
    n = rng.standard_normal(len(t))
    x = t / d
    fc = 300 + (6000 * x ** 1.6 if up else 2500 * (1 - x))
    out = svf(n, fc, q=1.4, mode="bp")
    shape = (x ** 2) if up else np.sin(np.pi * x) ** 2
    return out * shape


def key():
    """Tecla de teclado mecânico: estalo agudo + batida grave curta, timbre varia a cada toque."""
    t = tt(0.035)
    f = rng.uniform(2200, 4200)
    snap = svf(rng.standard_normal(len(t)), np.full(len(t), f), q=2.0, mode="bp") * np.exp(-t * 260)
    thump = np.sin(2 * np.pi * rng.uniform(140, 200) * t) * np.exp(-t * 120) * 0.5
    return snap * 1.6 + thump


def ding():
    """Confirmação: duas notas de sino (Mi6 -> Si6), parciais inarmônicos curtos."""
    out = np.zeros(int(0.9 * SR))
    for k, (n, o) in enumerate([(88, 0.0), (95, 0.085)]):
        t = tt(0.8)
        f = note(n)
        s = (np.sin(2 * np.pi * f * t) + 0.35 * np.sin(2 * np.pi * f * 2.76 * t) * np.exp(-t * 9)
             + 0.2 * np.sin(2 * np.pi * f * 5.4 * t) * np.exp(-t * 18))
        s *= np.exp(-t * 5.5) * np.minimum(1, t / 0.002)
        i = int(o * SR)
        out[i : i + len(s)] += s * (0.8 if k == 0 else 1.0)
    return out


def beep(f=1850, d=0.075):
    """Bip de leitor de código: onda quadrada suavizada."""
    t = tt(d)
    s = np.tanh(np.sin(2 * np.pi * f * t) * 4) * np.minimum(1, t / 0.003) * np.minimum(1, (d - t) / 0.006)
    return lp(s, 6000) * 0.6


def impact():
    t = tt(2.2)
    f = 38 + 70 * np.exp(-t * 10)
    sub = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 1.6)
    noise = lp(rng.standard_normal(len(t)), 2500) * np.exp(-t * 6) * 0.5
    return np.tanh((sub + noise) * 1.4)


def riser(d):
    t = tt(d)
    n = rng.standard_normal(len(t))
    out = svf(n, 400 + 7000 * (t / d) ** 2, q=1.6, mode="bp")
    return out * (t / d) ** 2


# ---------------- arranjo ----------------
CHORDS = [  # (raiz do baixo, notas do pad) - 1 acorde por compasso (2 s)
    (45, [57, 60, 64, 69]),  # Am
    (41, [53, 57, 60, 65]),  # F
    (48, [55, 60, 64, 67]),  # C
    (43, [55, 59, 62, 67]),  # G
]
bars = int(DUR / (4 * BEAT))
pads_bus = np.zeros((2, N))

# 1) gancho (0-3 s): um golpe por palavra, drone subindo, virada de caixa antes do drop
for w in TL["words"]:
    add(kick(big=True), w, 0.95)
    add(lp(rng.standard_normal(int(0.3 * SR)), 1800) * env(0.3, curve=10), w, 0.35)
drone_t = tt(3.0)
drone = saw(note(33), 3.0, 0.01) + saw(note(45), 3.0, 0.01) * 0.6
drone = svf(np.array(drone), 200 + 2500 * (drone_t / 3.0) ** 2, q=1.2)
add(drone * np.minimum(1, drone_t / 0.2) * 0.22, 0)
for k in range(8):  # virada em semicolcheias 2,5 -> 3,0
    add(clap() * (0.35 + k * 0.07), 2.5 + k * BEAT / 4, 0.7)
add(riser(1.0), 2.0, 0.35)

# 2) groove (3-17,5 s)
groove_end = TL["logoFaces"][0]
t = 3.0
b = 0
while t < groove_end - 1e-6:
    add(kick(), t, 0.9)
    SC_i = int(t * SR)
    dk = int(0.22 * SR)
    SC[SC_i : SC_i + dk] = np.minimum(SC[SC_i : SC_i + dk], 0.35 + 0.65 * np.linspace(0, 1, len(SC[SC_i : SC_i + dk])) ** 1.5)
    if b % 2 == 1:
        add(clap(), t, 0.55)
    add(hat(open_=(b % 2 == 1)), t + BEAT / 2, 0.22, pan=0.3)
    if t >= 6.0:
        add(hat(), t + BEAT / 4, 0.1, pan=-0.35)
        add(hat(), t + 3 * BEAT / 4, 0.1, pan=-0.35)
    bar = int(t // (4 * BEAT)) % 4
    root = CHORDS[bar][0]
    add(bass(note(root), BEAT / 2 * 0.9), t + BEAT / 2, 0.42)  # baixo no contratempo (house)
    if b % 4 == 3:
        add(bass(note(root + 12), BEAT / 4 * 0.9), t + 3 * BEAT / 4, 0.3)
    t += BEAT
    b += 1

# pads por compasso (3 s em diante), arpejo a partir dos recursos
for bar in range(1, bars):
    t0 = bar * 4 * BEAT
    if t0 >= groove_end:
        break
    ch = CHORDS[bar % 4][1]
    d = min(4 * BEAT, groove_end - t0 + 0.6)
    p = pad([note(n) for n in ch], d)
    i = int(t0 * SR)
    seg = p[: N - i]
    pads_bus[0, i : i + len(seg)] += seg * 0.16
    pads_bus[1, i : i + len(seg)] += np.roll(seg, 180) * 0.16
for k in range(int((groove_end - 6.0) / (BEAT / 4))):
    tk = 6.0 + k * BEAT / 4
    bar = int(tk // (4 * BEAT)) % 4
    ch = CHORDS[bar][1]
    seq = [ch[0] + 12, ch[1] + 12, ch[2] + 12, ch[3] + 12, ch[2] + 12, ch[1] + 12, ch[3], ch[2] + 12]
    gain = 0.09 if tk < 15 else 0.13
    add(pluck(note(seq[k % 8])), tk, gain, pan=0.45 if k % 2 else -0.45)

# prova (15-17,5): riser antes, golpe de entrada, stabs nas batidas
add(riser(1.0), 14.0, 0.3)
add(impact()[: int(0.8 * SR)], 15.0, 0.55)
for k in range(5):
    tk = 15.0 + k * BEAT
    ch = CHORDS[int(tk // 2) % 4][1]
    st = sum(pluck(note(n + 12), 0.18) for n in ch) / 3
    add(st, tk + BEAT / 2, 0.22)

# 3) assinatura (17,5-20): uma nota por face do prisma, golpe final e acorde longo
for i, f in enumerate(TL["logoFaces"]):
    add(pluck(note([69, 72, 76, 81][i]), 0.4), f, 0.3)
    add(pop(), f, 0.25)
hit = TL["logoHit"]
add(impact(), hit, 0.9)
add(kick(big=True), hit, 0.9)
final = pad([note(n) for n in [45, 57, 64, 69, 71, 76]], DUR - hit + 0.2)
final *= np.exp(-tt(len(final) / SR) * 0.6)
i = int(hit * SR)
pads_bus[0, i : i + len(final[: N - i])] += final[: N - i] * 0.3
pads_bus[1, i : i + len(final[: N - i])] += final[: N - i] * 0.3
add(riser(0.9), hit - 0.9, 0.25)

# ---------------- interface na batida (barramento de efeitos) ----------------
# a música fica guardada à parte; os efeitos vão num barramento próprio, mais alto
MUSIC_GAIN, SFX_GAIN = 0.72, 1.9
ML, MR = L.copy(), R.copy()
L[:] = 0
R[:] = 0
for c in TL["clicks"]:
    add(ui_click(), c, 0.5, pan=0.1)
for k, c in enumerate(TL["ticks"]):
    add(tick(k), c, 0.16, pan=-0.2 + 0.07 * k)
for c in TL["pops"]:
    add(pop(), c, 0.22, pan=0.25)
for c in TL["wipes"] + TL["cuts"]:
    w = whoosh(0.42)
    add(w, c - 0.38, 0.32, pan=-0.3)
    add(whoosh(0.3, up=False), c, 0.18, pan=0.3)
add(whoosh(0.4, up=False), TL["packet"], 0.2, pan=0.4)
add(whoosh(0.25), TL["glitch"], 0.25)

# digitação nos títulos (uma rajada por cena, no ritmo de quem digita rápido)
for k, t0 in enumerate(TL["typing"]):
    tk = t0
    for j in range(9):
        add(key(), tk, 0.32, pan=rng.uniform(-0.35, 0.35))
        tk += rng.uniform(0.032, 0.055)
# confirmações: robô concluiu, ponto registrado, lead capturado
for c in TL["dings"]:
    add(ding(), c, 0.3, pan=0.05)
# leitor do crachá: bip ao começar e bip duplo agudo na leitura
for c in TL["beeps"]:
    add(beep(), c, 0.4)
add(beep(2450, 0.05), TL["dings"][2] - 0.12, 0.4)
add(beep(2450, 0.05), TL["dings"][2] - 0.05, 0.4)
# contador do 127 girando: um tique a cada número que muda (mesma curva outExpo do vídeo)
cnt = TL["counter"]
last = -1.0
for v in range(1, cnt["to"] + 1):
    frac = min((v - 0.5) / cnt["to"], 0.9999)
    x = -np.log2(1 - frac) / 10
    tv = cnt["start"] + min(x, 1) * (cnt["end"] - cnt["start"])
    if tv - last < 0.028 and v != cnt["to"]:
        continue
    last = tv
    tq = tt(0.03)
    s_ = np.sin(2 * np.pi * (1400 + 6 * v) * tq) * np.exp(-tq * 160)
    add(s_, tv, 0.22 if v != cnt["to"] else 0.4, pan=-0.15)

# ---------------- mix ----------------
L = ML * MUSIC_GAIN + L * SFX_GAIN
R = MR * MUSIC_GAIN + R * SFX_GAIN
pads_bus *= SC[None, :]
L += pads_bus[0] * MUSIC_GAIN
R += pads_bus[1] * MUSIC_GAIN
# reverb curto (resposta ao impulso de ruído com decaimento)
ir_t = tt(1.6)
ir = rng.standard_normal(len(ir_t)) * np.exp(-ir_t * 3.2)
ir = lp(ir, 6000)
ir /= np.sqrt(np.sum(ir ** 2))
send = 0.18
L = L + fftconvolve(L, ir)[:N] * send
R = R + fftconvolve(R, np.roll(ir, 120))[:N] * send
mix = np.stack([L, R], axis=1)
mix = hp(mix.T, 25).T
mix = np.tanh(mix * 1.2) / np.tanh(1.2)
# fade final curto para não cortar seco
fo = int(0.35 * SR)
mix[-fo:] *= np.linspace(1, 0, fo)[:, None] ** 2
mix /= np.max(np.abs(mix)) / 0.89
(HERE / "out").mkdir(exist_ok=True)
wavfile.write(HERE / "out" / "trilha.wav", SR, (mix * 32767).astype(np.int16))
print(HERE / "out" / "trilha.wav")

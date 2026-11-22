"""Monta a folha de contato (um quadro por batida da história) a partir de out/contato/<fmt>/*.png.

Uso: python3 video-institucional/contact.py 16x9   (ou 9x16)
"""
import json
import sys
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont

HERE = Path(__file__).resolve().parent
FMT = sys.argv[1] if len(sys.argv) > 1 else "16x9"
TL = json.loads((HERE / "timeline.json").read_text())
frames = sorted((HERE / "out" / "contato" / FMT).glob("*.png"))

BEATS = [
    "1 · Gancho — o problema em 5 palavras",
    "2 · Produto — a interface se monta",
    "3 · Recurso 1 — robô lança as tarefas",
    "4 · Recurso 2 — app de ponto, um toque",
    "5 · Recurso 3 — crachá vira lead",
    "6 · Prova — números reais dos robôs",
    "7 · Assinatura — logo da Prisma",
]

if FMT == "9x16":
    tw, th, cols = 300, 533, 7
else:
    tw, th, cols = 600, 338, 4
pad, lab = 24, 64
rows = (len(frames) + cols - 1) // cols
sheet = Image.new("RGB", (pad + cols * (tw + pad), 110 + rows * (th + lab + pad)), (11, 18, 32))
d = ImageDraw.Draw(sheet)
fdir = HERE.parent / "src" / "assets" / "fonts"
try:
    big = ImageFont.truetype("DejaVuSans-Bold.ttf", 30)
    small = ImageFont.truetype("DejaVuSans.ttf", 17 if FMT == "16x9" else 13)
    mono = ImageFont.truetype("DejaVuSansMono.ttf", 15 if FMT == "16x9" else 12)
except OSError:
    big = small = mono = ImageFont.load_default()
d.text((pad, 30), f"PRISMA · reel institucional · folha de contato {FMT.replace('x', ':')}", font=big, fill=(244, 245, 248))
d.text((pad, 72), "20 s · 120 BPM · 1 quadro por batida da história", font=mono, fill=(184, 255, 58))
for i, f in enumerate(frames):
    im = Image.open(f).convert("RGB").resize((tw, th), Image.LANCZOS)
    x = pad + (i % cols) * (tw + pad)
    y = 110 + (i // cols) * (th + lab + pad)
    sheet.paste(im, (x, y))
    d.text((x, y + th + 10), BEATS[i] if i < len(BEATS) else f.name, font=small, fill=(244, 245, 248))
    sc = TL["scenes"][i]
    d.text((x, y + th + 36), f"t = {TL['contact'][i]:.1f} s   ·   cena {sc['start']}–{sc['end']} s", font=mono, fill=(154, 140, 255))
out = HERE / "out" / f"folha-de-contato-{FMT}.png"
sheet.save(out)
print(out)

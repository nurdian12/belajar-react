#!/usr/bin/env python3
"""Video animasi stickman dua angle: "Ditolak itu bukan vonis, itu filter."
Topik: percintaan / penolakan. 720x1280 (9:16), 24 fps, 20 detik, SFX sintetis.

Angle A (panel atas)  : DIA YANG MERATAPI  -> ditolak, lalu terpuruk.
Angle B (panel bawah) : DIA YANG MENYARING -> yang pergi tersaring, yang cocok tinggal.

Pola template: kondisi awal -> aksi -> respons -> hasil, lalu punchline.

Pakai: python3 video/make_video_penolakan.py [output.mp4]
Butuh: Pillow, numpy, ffmpeg.
"""
import math
import os
import subprocess
import sys
import tempfile
import wave

import numpy as np
from PIL import Image, ImageDraw, ImageFilter, ImageFont

W, H, FPS, DUR = 720, 1280, 24, 20.0
PW, PH, S = 640, 450, 2          # ukuran panel dan faktor supersampling
PX, PYA, PYB = 40, 190, 670      # posisi panel di frame
FLOOR = 370
OUT = sys.argv[1] if len(sys.argv) > 1 else os.path.join(
    os.path.dirname(os.path.abspath(__file__)), "penolakan-filter.mp4")

_FM = "/usr/share/fonts/truetype/jetbrains-mono/JetBrainsMono-Bold.ttf"
if not os.path.exists(_FM):
    _FM = "/usr/share/fonts/truetype/dejavu/DejaVuSansMono-Bold.ttf"


def font(n):
    return ImageFont.truetype(_FM, n)


F_TITLE, F_LBL, F_ST = font(27), font(21), font(14)
F_PUNCH, F_SUB = font(58), font(21)

WHITE = (245, 245, 250)
AMBER = (255, 196, 90)
BLUE = (140, 150, 230)
GREY = (170, 176, 192)
SIL = (46, 50, 66)
CORAL = (255, 122, 92)

SIL_X = [330, 400, 470, 540]       # posisi siluet di angle A
ST = [2.0, 3.9, 5.8, 7.7]          # awal tiap penolakan (detik)
B_STOP = [300, 300, 300, 215]      # titik berhenti siluet di angle B
B_HERO_X = 150
RING_RX = 120
IMP_A = [s + 1.25 for s in ST]     # momen "kena" tiap penolakan di angle A
IMP_B = [s + 1.8 for s in ST[:3]]  # momen siluet berbalik pergi di angle B
BURST = 9.5                        # momen bertemu yang cocok di angle B
TEARS = [7.3 + 0.55 * i + 0.13 * (i % 3) for i in range(9)]  # tetes air mata
BLUE_TEAR = (130, 180, 255)
RED = (255, 80, 90)


def clamp(x, a=0.0, b=1.0):
    return max(a, min(b, x))


def ease(x):
    x = clamp(x)
    return x * x * (3 - 2 * x)


def lerp(a, b, u):
    return a + (b - a) * u


# ------------------------------------------------------------------ seni statis
def build_panel_bg():
    img = Image.new("RGB", (PW * S, PH * S))
    d = ImageDraw.Draw(img)
    for y in range(PH * S):
        u = min(1.0, y / (FLOOR * S))
        d.line([0, y, PW * S, y], fill=(int(lerp(10, 22, u)), int(lerp(15, 30, u)),
                                        int(lerp(32, 54, u))))
    cone = Image.new("RGBA", img.size, (0, 0, 0, 0))
    cd = ImageDraw.Draw(cone)
    for cx in (170, 500):
        cd.polygon([((cx - 8) * S, 0), ((cx + 8) * S, 0),
                    ((cx + 60) * S, FLOOR * S), ((cx - 60) * S, FLOOR * S)],
                   fill=(200, 210, 255, 26))
    cone = cone.filter(ImageFilter.GaussianBlur(10 * S))
    img = Image.alpha_composite(img.convert("RGBA"), cone)
    d = ImageDraw.Draw(img)
    d.rectangle([0, FLOOR * S, PW * S, PH * S], fill=(58, 58, 68, 255))
    d.line([0, FLOOR * S, PW * S, FLOOR * S], fill=(150, 150, 160, 255), width=2 * S)
    return img.convert("RGB")


def build_glow(radius):
    n = radius * 2 * S
    yy, xx = np.mgrid[0:n, 0:n]
    r = np.hypot(xx - n / 2, yy - n / 2) / (n / 2)
    a = np.clip(1 - r, 0, 1) ** 2
    return a


GLOW_SMALL, GLOW_BIG = build_glow(150), build_glow(240)
BG = build_panel_bg()


def glow_sprite(arr, k):
    n = arr.shape[0]
    rgba = np.zeros((n, n, 4), np.uint8)
    rgba[..., 0], rgba[..., 1], rgba[..., 2] = 255, 192, 92
    rgba[..., 3] = (arr * 230 * clamp(k)).astype(np.uint8)
    return Image.fromarray(rgba, "RGBA")


def paste_glow(panel, cx, cy, intensity):
    """Cahaya lampu; intensitas >1 menambah lingkar luar."""
    if intensity <= 0.01:
        return
    for arr, rad, k in ((GLOW_SMALL, 150, intensity), (GLOW_BIG, 240, intensity - 1)):
        if k > 0.01:
            sp = glow_sprite(arr, k)
            panel.paste(sp, (int((cx - rad) * S), int((cy - rad) * S)), sp)


# ------------------------------------------------------------------ tokoh
def fig_layer(x, fy, col, f=1, walk=None, lean=0.0, head=0.0, arm_f=70, arm_b=-8,
              sit=0.0, sc=1.15, lamp=None, face=None):
    """Gambar stickman di layer RGBA transparan. lamp=None / warna lentera.
    face: None | hope | sad | hit | calm | happy.
    Mengembalikan (layer, posisi lentera, posisi kepala)."""
    lay = Image.new("RGBA", (PW * S, PH * S), (0, 0, 0, 0))
    d = ImageDraw.Draw(lay)
    L, B, R = 40 * sc, 36 * sc, 14 * sc
    lw = max(2, int(6.5 * sc * S))
    hip = (x, lerp(fy - L, fy - 7 * sc, sit))
    lt = lean + 0.55 * sit
    ux, uy = f * math.sin(lt), -math.cos(lt)
    neck = (hip[0] + B * ux, hip[1] + B * uy)
    hh = lt + head
    hd = (neck[0] + R * 1.05 * f * math.sin(hh), neck[1] - R * 1.05 * math.cos(hh))
    sh = (neck[0] - 5 * sc * ux, neck[1] - 5 * sc * uy)

    def seg(a, b):
        d.line([(a[0] * S, a[1] * S), (b[0] * S, b[1] * S)], fill=col, width=lw)
        r = lw / 2
        d.ellipse([b[0] * S - r, b[1] * S - r, b[0] * S + r, b[1] * S + r], fill=col)

    seg(hip, neck)
    sw = 28 * math.sin(walk) if walk is not None else 0.0
    for base, sit_a in ((sw, 80), (-sw, 68)):
        a = math.radians(lerp(base, sit_a, sit))
        seg(hip, (hip[0] + f * L * math.sin(a), hip[1] + L * math.cos(a)))
    aw = -22 * math.sin(walk) if walk is not None else 0.0
    hand_f = None
    for ang, front in ((arm_f, True), (arm_b + aw, False)):
        a = math.radians(ang)
        hnd = (sh[0] + f * 30 * sc * math.sin(a), sh[1] + 30 * sc * math.cos(a))
        seg(sh, hnd)
        if front:
            hand_f = hnd
    d.ellipse([(hd[0] - R) * S, (hd[1] - R) * S, (hd[0] + R) * S, (hd[1] + R) * S], fill=col)
    if face:
        ink = (28, 30, 42, 255)

        def ln(a, b, w=1.5):
            d.line([(a[0] * S, a[1] * S), (b[0] * S, b[1] * S)], fill=ink, width=int(w * S))

        e1 = (hd[0] + f * R * 0.12, hd[1] - R * 0.18)
        e2 = (hd[0] + f * R * 0.62, hd[1] - R * 0.18)
        mc = (hd[0] + f * R * 0.38, hd[1] + R * 0.42)
        if face in ("hope", "sad", "happy"):
            for e in (e1, e2):
                d.ellipse([(e[0] - 1.7) * S, (e[1] - 1.7) * S, (e[0] + 1.7) * S, (e[1] + 1.7) * S],
                          fill=ink)
        else:  # mata terpejam
            for e in (e1, e2):
                ln((e[0] - 2.2, e[1]), (e[0] + 2.2, e[1] + (0.0 if face == "hit" else 0.0)))
        if face == "sad":
            ln((e1[0] - 2.5 * f, e1[1] - 3.6), (e1[0] + 2.5 * f, e1[1] - 5.4), 1.2)
            ln((e2[0] - 2.5 * f, e2[1] - 5.4), (e2[0] + 2.5 * f, e2[1] - 3.6), 1.2)
        if face == "hit":
            ln((e1[0] - 3, e1[1] - 3), (e1[0] + 3, e1[1] - 1), 1.2)
            ln((e2[0] - 3, e2[1] - 1), (e2[0] + 3, e2[1] - 3), 1.2)
            d.ellipse([(mc[0] - 2) * S, (mc[1] - 1.5) * S, (mc[0] + 2) * S, (mc[1] + 2.5) * S],
                      outline=ink, width=int(1.3 * S))
        else:
            box = [(mc[0] - 3.6) * S, (mc[1] - 2.6) * S, (mc[0] + 3.6) * S, (mc[1] + 2.6) * S]
            if face == "sad":
                d.arc([box[0], box[1] + 3 * S, box[2], box[3] + 3 * S], 200, 340, fill=ink,
                      width=int(1.4 * S))
            else:
                d.arc(box, 20, 160, fill=ink, width=int(1.4 * S))
    lamp_pos = None
    if lamp is not None and hand_f is not None:
        lx, ly = hand_f[0] + f * 3 * sc, hand_f[1] + 7 * sc
        d.rectangle([(lx - 4.5 * sc) * S, (ly - 6 * sc) * S, (lx + 4.5 * sc) * S, (ly + 6 * sc) * S],
                    fill=lamp)
        d.line([(lx - 3 * sc) * S, (ly - 6 * sc) * S, (hand_f[0]) * S, (hand_f[1]) * S],
               fill=col, width=max(2, S))
        lamp_pos = (lx, ly)
    return lay, lamp_pos, hd


def put(panel, lay, alpha=1.0):
    if alpha < 0.999:
        lay.putalpha(lay.getchannel("A").point(lambda v: int(v * alpha)))
    panel.paste(lay, (0, 0), lay)


def heart(panel, cx, cy, s, alpha):
    lay = Image.new("RGBA", (PW * S, PH * S), (0, 0, 0, 0))
    pts = []
    for i in range(64):
        a = i / 64 * 2 * math.pi
        x = 16 * math.sin(a) ** 3
        y = -(13 * math.cos(a) - 5 * math.cos(2 * a) - 2 * math.cos(3 * a) - math.cos(4 * a))
        pts.append(((cx + x * s) * S, (cy + y * s) * S))
    ImageDraw.Draw(lay).polygon(pts, fill=CORAL + (255,))
    put(panel, lay, alpha)


def ring(panel, cx, rx, k):
    """Zona saringan: elips putus-putus di lantai sekitar tokoh."""
    lay = Image.new("RGBA", (PW * S, PH * S), (0, 0, 0, 0))
    d = ImageDraw.Draw(lay)
    box = [(cx - rx) * S, (FLOOR + 2 - 15) * S, (cx + rx) * S, (FLOOR + 2 + 15) * S]
    for i in range(0, 360, 24):
        d.arc(box, i, i + 12, fill=AMBER + (255,), width=2 * S)
    put(panel, lay, 0.35 + 0.5 * k)


# ------------------------------------------------------------------ efek emosi
def blank():
    return Image.new("RGBA", (PW * S, PH * S), (0, 0, 0, 0))


def pulse(dt, dur=0.45):
    return (1 - dt / dur) ** 2 if 0 <= dt < dur else 0.0


def overlay(p, color, alpha):
    if alpha > 0.005:
        p.paste(Image.blend(p, Image.new("RGB", p.size, color), clamp(alpha)))


def _vignette():
    n = (PW * S, PH * S)
    yy, xx = np.mgrid[0:n[1], 0:n[0]]
    r = np.hypot((xx - n[0] / 2) / (n[0] / 2), (yy - n[1] / 2) / (n[1] / 2))
    return np.clip((r - 0.45) / 0.75, 0, 1) ** 1.5


VIG = _vignette()


def vignette(p, k, color=(4, 6, 18)):
    if k > 0.01:
        m = Image.fromarray((VIG * 255 * clamp(k)).astype(np.uint8), "L")
        p.paste(Image.new("RGB", p.size, color), (0, 0), m)


def shock(p, cx, cy, dt, color, rmax=95, dur=0.6):
    if 0 <= dt < dur:
        lay = blank()
        r = lerp(8, rmax, ease(dt / dur))
        ImageDraw.Draw(lay).ellipse([(cx - r) * S, (cy - r) * S, (cx + r) * S, (cy + r) * S],
                                    outline=color + (255,), width=int(3 * S))
        put(p, lay, 1 - dt / dur)


def xmark(p, cx, cy, dt):
    if 0 <= dt < 1.0:
        s = 9 * ease(dt / 0.15)
        lay = blank()
        d = ImageDraw.Draw(lay)
        w = int(3.2 * S)
        d.line([((cx - s) * S, (cy - s) * S), ((cx + s) * S, (cy + s) * S)], fill=RED + (255,), width=w)
        d.line([((cx - s) * S, (cy + s) * S), ((cx + s) * S, (cy - s) * S)], fill=RED + (255,), width=w)
        put(p, lay, 1 - clamp((dt - 0.5) / 0.5))


def tears(p, hd, f, t):
    lay = blank()
    d = ImageDraw.Draw(lay)
    for t0 in TEARS:
        u = (t - t0) / 0.9
        if 0 <= u < 1:
            x = hd[0] + f * 8.5
            y = hd[1] + 2 + 75 * u * u
            r = 2.2
            d.ellipse([(x - r) * S, (y - r * 1.4) * S, (x + r) * S, (y + r) * S],
                      fill=BLUE_TEAR + (int(255 * (1 - u)),))
    put(p, lay)


def rain(p, k, t):
    n = int(34 * clamp(k))
    if n <= 0:
        return
    lay = blank()
    d = ImageDraw.Draw(lay)
    for j in range(n):
        x = (j * 53 + 11) % PW
        y = (t * 250 + j * 97) % (PH + 20) - 10
        d.line([(x * S, y * S), ((x - 4) * S, (y + 14) * S)], fill=(140, 160, 230, 120), width=S)
    put(p, lay)


def broken_heart(p, cx, cy, s, r, fall):
    """Hati yang retak tiap kali ditolak, lalu pecah jatuh di penolakan terakhir."""
    lay = blank()
    d = ImageDraw.Draw(lay)
    pts = []
    for i in range(64):
        a = i / 64 * 2 * math.pi
        pts.append(((cx + 16 * math.sin(a) ** 3 * s) * S,
                    (cy - (13 * math.cos(a) - 5 * math.cos(2 * a) - 2 * math.cos(3 * a)
                           - math.cos(4 * a)) * s) * S))
    d.polygon(pts, fill=lerp_col(CORAL, (120, 92, 112), clamp(r / 3.5)) + (255,))
    if r > 0.5:
        zz = [(cx, cy - 20 * s), (cx - 3.5 * s, cy - 8 * s), (cx + 3.5 * s, cy),
              (cx - 2.5 * s, cy + 8 * s), (cx, cy + 20 * s)]
        d.line([(x * S, y * S) for x, y in zz], fill=(0, 0, 0, 0), width=int(2.2 * S))
    gap = (1.0 + 1.2 * min(r, 3.6)) * S + fall * 45 * S
    dy = fall * 70 * S
    left = lay.crop((0, 0, int(cx * S), PH * S))
    right = lay.crop((int(cx * S), 0, PW * S, PH * S))
    out = blank()
    out.paste(left, (int(-gap), int(dy)), left)
    out.paste(right, (int(cx * S + gap), int(dy)), right)
    put(p, out, 1 - fall)


SPARKS = []
_rs = np.random.RandomState(8)
for _ in range(30):
    SPARKS.append((_rs.uniform(0, 2 * math.pi), _rs.uniform(70, 170), _rs.uniform(2, 3.6)))


def sparks(p, cx, cy, dt):
    if 0 <= dt < 1.1:
        lay = blank()
        d = ImageDraw.Draw(lay)
        for ang, sp, sz in SPARKS:
            x = cx + math.cos(ang) * sp * dt
            y = cy + math.sin(ang) * sp * dt + 90 * dt * dt
            d.ellipse([(x - sz) * S, (y - sz) * S, (x + sz) * S, (y + sz) * S],
                      fill=(255, 214, 120, int(255 * (1 - dt / 1.1))))
        put(p, lay)


def mini_hearts(p, t):
    for i in range(5):
        u = (t - (10.3 + 0.6 * i)) / 1.8
        if 0 <= u < 1:
            heart(p, 150 + 22 * i + 8 * math.sin(u * 6 + i), 200 - 80 * u, 0.36,
                  math.sin(math.pi * u))


def ring_pulse(p, cx, dt):
    if 0 <= dt < 0.9:
        lay = blank()
        k = ease(dt / 0.9)
        rx, ry = lerp(60, 175, k), lerp(8, 26, k)
        ImageDraw.Draw(lay).ellipse([(cx - rx) * S, (FLOOR + 2 - ry) * S, (cx + rx) * S,
                                     (FLOOR + 2 + ry) * S], outline=AMBER + (255,), width=int(2.4 * S))
        put(p, lay, 1 - dt / 0.9)


# ------------------------------------------------------------------ status per panel
def silhouette_A(k, t):
    s = ST[k]
    f, x, fy, sc, al, walk = -1, SIL_X[k], FLOOR, 1.15, 1.0, None
    if t > s + 1.1:
        f = 1
    u = ease((t - (s + 1.4)) / 1.2)
    if u > 0:
        x += 45 * u
        fy -= 24 * u
        sc *= lerp(1, 0.72, u)
        al = 1 - u
        if u < 1:
            walk = t * 9.5
    return x, fy, f, sc, al, walk


def silhouette_B(k, t):
    s = ST[k]
    stop = B_STOP[k]
    f, fy, sc, al, walk = -1, FLOOR, 1.15, 1.0, None
    u = ease((t - s) / 1.3)
    x = lerp(700, stop, u)
    if 0 < u < 1:
        walk = t * 9.5
    if k < 3:
        if t > s + 1.7:
            f = 1
        u2 = ease((t - (s + 1.9)) / 1.1)
        if u2 > 0:
            x = stop + 60 * u2
            fy -= 24 * u2
            sc *= lerp(1, 0.72, u2)
            al = 1 - u2
            if u2 < 1:
                walk = t * 9.5
    return x, fy, f, sc, al, walk


def hero_A_state(t):
    xs = [90] + [SIL_X[k] - 58 for k in range(4)]
    x, walk = float(xs[0]), None
    for k in range(4):
        if t >= ST[k]:
            u = clamp((t - ST[k]) / 1.0)
            x = lerp(xs[k], xs[k + 1], ease(u))
            walk = t * 9.5 if 0 < u < 1 else None
    r = sum(ease((t - (ST[k] + 1.4)) / 1.0) for k in range(4))
    hit = sum(pulse(t - m) for m in IMP_A)
    return x - 16 * hit, walk, r, hit


A_TEXT = [(0.0, ""), (2.1, "KENAPA BUKAN AKU?"), (4.6, "AKU KURANG APA?"),
          (8.0, "DITOLAK LAGI."), (10.4, "MASIH TERPURUK.")]
B_TEXT = [(0.0, ""), (2.1, "TERIMA YANG PERGI."), (4.6, "SATU PER SATU TERSARING."),
          (8.0, "YANG TERSISA YANG COCOK."), (9.7, "TERANG BERDUA.")]


def status(texts, t):
    cur = texts[0]
    for it in texts:
        if t >= it[0]:
            cur = it
    return cur[1], ease((t - cur[0]) / 0.3)


def scale_col(c, k):
    return tuple(int(v * k) for v in c)


# ------------------------------------------------------------------ panel
def panel_A(t):
    """Kembalikan (gambar, shake dx, dy)."""
    p = BG.copy()
    x, walk, r, hit = hero_A_state(t)
    sit = ease((t - 10.4) / 0.8)
    face = "hit" if hit > 0.05 else ("sad" if r > 0.5 else "hope")
    hero, lamp, hd = fig_layer(x, FLOOR, WHITE, f=1, walk=walk, lean=0.04 * r - 0.25 * hit,
                               head=0.12 * r, arm_f=lerp(70, 40, r / 4) + 35 * hit, sit=sit,
                               lamp=(255, 214, 120), face=face)
    flick = 1 - 0.75 * min(1.0, hit * 1.6)
    paste_glow(p, lamp[0], lamp[1], lerp(1.0, 0.18, r / 4) * flick)
    for k in range(4):
        sx, sy, f, sc, al, w = silhouette_A(k, t)
        if al > 0.01:
            lay, _, shd = fig_layer(sx, sy, SIL, f=f, walk=w, sc=sc, arm_f=15, arm_b=-8)
            put(p, lay, al)
            xmark(p, SIL_X[k], 215, t - IMP_A[k])
    put(p, hero)
    for m in IMP_A:
        shock(p, x + 8, 300, t - m, RED)
    fall = ease((t - (IMP_A[3] + 0.5)) / 0.9)
    if r > 0.15 and fall < 1:
        broken_heart(p, x - 4, hd[1] - 44, 1.0, r, fall)
    if t > TEARS[0]:
        tears(p, hd, 1, t)
    rain(p, (r - 0.3) / 2.5, t)
    vignette(p, 0.75 * clamp(r / 4) + 0.35 * hit)
    overlay(p, (200, 40, 55), 0.30 * sum(pulse(t - m, 0.35) for m in IMP_A))
    return p, 9 * hit * math.sin(t * 90), 5 * hit * math.cos(t * 77)


def panel_B(t):
    p = BG.copy()
    close = ease((t - 9.3) / 0.8)
    happy = t >= BURST
    ring(p, B_HERO_X, RING_RX, close)
    for m in IMP_B:
        ring_pulse(p, B_HERO_X, t - m)
    hero, lamp, hd = fig_layer(B_HERO_X, FLOOR, WHITE, f=1, arm_f=lerp(66, 78, close),
                               lamp=(255, 214, 120), face="happy" if happy else "calm")
    paste_glow(p, lamp[0], lamp[1], 1.0 + 0.7 * close + 0.5 * pulse(t - BURST, 0.6))
    for k in range(4):
        sx, sy, f, sc, al, w = silhouette_B(k, t)
        if al > 0.01 and sx < PW + 40:
            lit = k == 3 and close > 0
            lay, _, _ = fig_layer(sx, sy, lerp_col(SIL, (230, 230, 238), close) if lit else SIL,
                                  f=f, walk=w, sc=sc, arm_f=15, arm_b=-8,
                                  face="happy" if lit and happy else None)
            put(p, lay, al)
    put(p, hero)
    shock(p, 182, 300, t - BURST, (255, 214, 140), rmax=150, dur=0.8)
    sparks(p, 182, 290, t - BURST)
    hu = ease((t - 9.7) / 0.5)
    if hu > 0:
        beat = 1 + 0.14 * abs(math.sin(t * 6))
        heart(p, 182, 160 + 3 * math.sin(t * 5), 0.85 * beat, hu)
    mini_hearts(p, t)
    overlay(p, (255, 205, 120), 0.28 * pulse(t - BURST, 0.5))
    return p, 0.0, 0.0


def lerp_col(a, b, u):
    return tuple(int(lerp(x, y, u)) for x, y in zip(a, b))


def finish_panel(scene, label, texts, t, st_col, st_col2=None, t2=None):
    img, dx, dy = scene
    if abs(dx) + abs(dy) > 0.1:
        img = img.transform(img.size, Image.AFFINE, (1, 0, -dx * S, 0, 1, -dy * S),
                            resample=Image.BILINEAR, fillcolor=(4, 6, 14))
    p = img.resize((PW, PH), Image.LANCZOS)
    d = ImageDraw.Draw(p)
    d.text((14, 20), label, font=F_LBL, fill=WHITE, anchor="lm")
    txt, k = status(texts, t)
    col = st_col
    if st_col2 is not None and t >= t2:
        col = st_col2
    if txt:
        d.text((14, 46), txt, font=F_ST, fill=scale_col(col, k), anchor="lm")
    d.rectangle([0, 0, PW - 1, PH - 1], outline=(42, 46, 62))
    return p


# ------------------------------------------------------------------ frame
def spaced(d, text, cx, cy, fnt, fill, sp=4, nchars=None, full=None):
    full = full or text
    ws_full = [d.textlength(c, font=fnt) for c in full]
    x = cx - (sum(ws_full) + sp * (len(full) - 1)) / 2
    for i, c in enumerate(full):
        if nchars is None or i < nchars:
            d.text((x, cy), c, font=fnt, fill=fill, anchor="lm")
        x += ws_full[i] + sp


def spaced_multi(d, segs, cx, cy, fnt, sp=3, alpha=1.0):
    full = "".join(s for s, _ in segs)
    ws = [d.textlength(c, font=fnt) for c in full]
    x = cx - (sum(ws) + sp * (len(full) - 1)) / 2
    i = 0
    for s, col in segs:
        for c in s:
            d.text((x, cy), c, font=fnt, fill=scale_col(col, alpha), anchor="lm")
            x += ws[i] + sp
            i += 1


def render(t):
    fr = Image.new("RGB", (W, H), (0, 0, 0))
    d = ImageDraw.Draw(fr)
    dim = 1 - 0.65 * ease((t - 12.0) / 0.8)

    # judul
    l1 = "DITOLAK ITU BUKAN VONIS."
    n1 = int(len(l1) * clamp((t - 0.2) / 1.4) + 0.999)
    spaced(d, l1, W / 2, 84, F_TITLE, scale_col(WHITE, dim), nchars=n1)
    if t >= 10.0:
        l2 = "JANGAN RATAPI YANG PERGI,"
        n2 = int(len(l2) * clamp((t - 10.0) / 1.3) + 0.999)
        spaced(d, l2, W / 2, 126, F_TITLE, scale_col(WHITE, dim), nchars=n2)

    # panel
    kin = ease(t / 0.8)
    kout = lerp(1.0, 0.10, ease((t - 12.0) / 0.8))
    fade_end = clamp((DUR - t) / 0.5)
    k = kin * kout * fade_end
    black = Image.new("RGB", (PW, PH), (0, 0, 0))
    pa = finish_panel(panel_A(t), "DIA YANG MERATAPI", A_TEXT, t, BLUE)
    pb = finish_panel(panel_B(t), "DIA YANG MENYARING", B_TEXT, t, (170, 180, 200), AMBER, 9.7)
    fr.paste(Image.blend(black, pa, k), (PX, PYA))
    fr.paste(Image.blend(black, pb, k), (PX, PYB))

    # punchline
    pu = ease((t - 12.6) / 0.6) * fade_end
    if pu > 0:
        spaced_multi(d, [("SYUKURI", AMBER), (" YANG", WHITE)], W / 2, 600, F_PUNCH, alpha=pu)
        spaced_multi(d, [("TERSARING.", WHITE)], W / 2, 672, F_PUNCH, alpha=pu)
    su = ease((t - 14.6) / 0.8) * fade_end
    if su > 0:
        spaced(d, "YANG PERGI BUKAN KEHILANGAN.", W / 2, 1000, F_SUB, scale_col(GREY, su), sp=2)
        spaced(d, "YANG TINGGAL BARU PILIHAN.", W / 2, 1038, F_SUB, scale_col(GREY, su), sp=2)

    fade = clamp(1 - t / 0.4)
    if fade > 0:
        fr = Image.blend(fr, Image.new("RGB", (W, H), (0, 0, 0)), fade)
    return fr


# ------------------------------------------------------------------ audio
def make_audio(path):
    sr = 44100
    n = int(sr * DUR)
    t = np.arange(n) / sr
    rs = np.random.RandomState(4)
    out = 0.03 * np.sin(2 * np.pi * 55 * t) + 0.008 * np.convolve(
        rs.randn(n), np.ones(40) / 40, mode="same")

    def add(t0, sig):
        i = int(t0 * sr)
        j = min(n, i + len(sig))
        if i < n:
            out[i:j] += sig[:j - i]

    def burst(dur, amp):
        m = int(sr * dur)
        return amp * np.diff(rs.randn(m), prepend=0) * np.exp(-np.linspace(0, 6, m))

    def tone(f, dur, amp, decay=3.0, attack=0.0):
        m = int(sr * dur)
        x = np.arange(m) / sr
        env = np.exp(-x * decay)
        if attack:
            env *= np.minimum(1, x / attack)
        return amp * np.sin(2 * np.pi * f * x) * env

    def sweep(f0, f1, dur, amp):
        m = int(sr * dur)
        f = np.linspace(f0, f1, m)
        return amp * np.sin(2 * np.pi * np.cumsum(f) / sr) * np.exp(-np.linspace(0, 4, m))

    def steps(t0, dur):
        tt = t0
        while tt < t0 + dur:
            add(tt, tone(95, 0.09, 0.05, 40))
            tt += 0.34

    def lowpass_noise(dur, amp, k=60):
        m = int(sr * dur)
        return amp * np.convolve(rs.randn(m), np.ones(k) / k, mode="same")

    def heartbeat(t0, amp=0.35, f=62):
        add(t0, tone(f, 0.18, amp, 22))
        add(t0 + 0.17, tone(f * 0.85, 0.2, amp * 0.7, 20))

    # hujan di angle A makin deras tiap ditolak
    m = int(sr * (12.0 - ST[1]))
    add(ST[1], lowpass_noise(12.0 - ST[1], 0.05, 6) * np.linspace(0, 1, m) ** 1.5)

    for k in range(4):
        steps(ST[k], 1.0)                    # langkah tokoh A dan siluet B
        h = IMP_A[k]                         # ---- ditolak, kena di angle A
        add(h, tone(52, 0.7, 0.7, 6))        # dentuman dada
        add(h, burst(0.16, 0.22))            # retakan kaca
        add(h, tone(2637, 0.25, 0.03, 18))
        add(h + 0.02, tone(3322, 0.2, 0.025, 20))
        add(h, sweep(380, 150, 0.5, 0.1))    # nada jatuh
        heartbeat(h + 0.45, 0.28 - 0.04 * k, 55)
        heartbeat(h + 0.95, 0.2 - 0.03 * k, 52)
        if k < 3:                            # ---- tersaring di angle B
            b_ = IMP_B[k]
            m = int(sr * 0.5)
            add(b_ - 0.1, lowpass_noise(0.5, 0.09, 12) * np.sin(np.linspace(0, np.pi, m)))
            add(b_, tone(880, 0.7, 0.04, 5))
            add(b_ + 0.1, tone(1318, 0.6, 0.025, 6))
    for tt in TEARS:                         # tetes air mata
        add(tt + 0.7, tone(1500, 0.12, 0.05, 30) * np.linspace(1, 0.4, int(sr * 0.12)))
    add(10.4, lowpass_noise(0.9, 0.12, 30) * np.linspace(1, 0, int(sr * 0.9)))   # hela napas
    for i, fq in enumerate((440.0, 392.0, 329.6)):                            # nada sedih
        add(10.5 + i * 0.45, tone(fq, 1.6, 0.045, 2.6))
    heartbeat(BURST - 0.5, 0.35, 66)         # ---- bertemu yang cocok
    heartbeat(BURST - 0.1, 0.38, 70)
    add(BURST, tone(110, 0.8, 0.35, 5))
    for i, fq in enumerate((1046.5, 1318.5, 1568.0, 2093.0, 2637.0)):         # kilau
        add(BURST + 0.05 + i * 0.07, tone(fq, 1.0, 0.035, 4))
    add(9.7, tone(523.3, 1.8, 0.06, 2.0))
    add(9.7, tone(659.3, 1.8, 0.05, 2.0))
    add(9.7, tone(784.0, 1.8, 0.05, 2.0))
    for i in range(5):                       # hati kecil melayang
        add(10.3 + 0.6 * i + 0.3, tone(1760, 0.35, 0.015, 8))
    m = int(sr * 1.5)                        # riser menuju punchline
    x_ = np.arange(m) / sr
    ph = 2 * np.pi * np.cumsum(180 + 600 * (x_ / 1.5) ** 1.6) / sr
    add(10.5, 0.07 * np.sin(ph) * np.linspace(0, 1, m) ** 1.5)
    add(12.0, tone(50, 1.4, 0.55, 3.2))
    add(12.0, burst(0.28, 0.22))
    for fq in (261.6, 329.6, 392.0, 523.3):
        add(12.1, tone(fq, 7.0, 0.05, 0.45, attack=0.5))
    add(13.0, tone(1568, 1.5, 0.02, 2.5))
    out *= np.clip((DUR - t) / 0.5, 0, 1)
    out = out / max(1e-6, np.abs(out).max()) * 0.8
    with wave.open(path, "wb") as wf:
        wf.setnchannels(1)
        wf.setsampwidth(2)
        wf.setframerate(sr)
        wf.writeframes((out * 32767).astype(np.int16).tobytes())


def main():
    tmp = tempfile.mkdtemp()
    wav = os.path.join(tmp, "a.wav")
    make_audio(wav)
    cmd = ["ffmpeg", "-v", "error", "-y", "-f", "rawvideo", "-pix_fmt", "rgb24",
           "-s", f"{W}x{H}", "-r", str(FPS), "-i", "-", "-i", wav,
           "-c:v", "libx264", "-pix_fmt", "yuv420p", "-crf", "20",
           "-c:a", "aac", "-b:a", "128k", "-shortest", OUT]
    p = subprocess.Popen(cmd, stdin=subprocess.PIPE)
    for i in range(int(DUR * FPS)):
        p.stdin.write(render(i / FPS).tobytes())
    p.stdin.close()
    p.wait()
    print("selesai:", OUT)


if __name__ == "__main__":
    main()

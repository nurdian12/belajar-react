#!/usr/bin/env python3
"""Video animasi stickman: "Mereka bilang aku gak cocok. Sekarang mereka lihat ke atas."
Topik: karier. 720x1280 (9:16), 24 fps, 15 detik, dengan SFX sintetis.

Pakai: python3 video/make_video_karier.py [output.mp4]
Butuh: Pillow, numpy, ffmpeg.
"""
import math
import os
import random
import subprocess
import sys
import tempfile
import wave

import numpy as np
from PIL import Image, ImageDraw, ImageFilter, ImageFont

W, H, FPS, DUR = 720, 1280, 24, 15.0
FLOOR, PIT_L, PIT_R, PIT_B, CX = 760, 380, 600, 1160, 490
LAYER = 400 / 6.0
TOP_FINAL = 430
OUT = sys.argv[1] if len(sys.argv) > 1 else os.path.join(
    os.path.dirname(os.path.abspath(__file__)), "karier-diremehkan-naik.mp4")

FB = "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf"
FM = "/usr/share/fonts/truetype/dejavu/DejaVuSansMono-Bold.ttf"
f_cap = ImageFont.truetype(FB, 32)
f_wm = ImageFont.truetype(FB, 16)
f_lbl = ImageFont.truetype(FM, 20)
f_ex = ImageFont.truetype(FB, 34)

INSULTS = ["GAK COCOK", "MENDING RESIGN", "BELUM SIAP",
           "SIAPA DIA?", "TERLALU JUNIOR", "GAK ADA POTENSI"]


def clamp(x, a=0.0, b=1.0):
    return max(a, min(b, x))


def ease(x):
    x = clamp(x)
    return x * x * (3 - 2 * x)


def lerp(a, b, u):
    return a + (b - a) * u


def stack_h(t):
    """Tinggi tumpukan kertas (px) terhadap dasar lubang."""
    if t < 3.0:
        return 0.0
    if t < 7.0:
        k = (t - 3.0) / 4.0 * 6
        i = int(min(k, 5.999))
        return LAYER * (i + ease((k - i) * 1.6))
    return 400 + 330 * ease((t - 7.0) / 3.0)


# ---------------------------------------------------------------- static art
def build_base():
    img = Image.new("RGB", (W, H))
    px = img.load()
    for y in range(H):
        if y < 760:
            u = y / 760
            c = (int(lerp(12, 66, u ** 1.6)), int(lerp(18, 82, u ** 1.6)),
                 int(lerp(34, 116, u ** 1.6)))
        else:
            c = (10, 12, 18)
        for x in range(W):
            px[x, y] = c
    d = ImageDraw.Draw(img)
    rng = random.Random(3)
    for _ in range(70):
        x, y = rng.randrange(W), rng.randrange(0, 560)
        v = rng.randrange(90, 200)
        d.point((x, y), fill=(v, v, v + 20))
    # lantai kiri/kanan
    d.rectangle([0, FLOOR, PIT_L, H], fill=(16, 20, 30))
    d.rectangle([PIT_R, FLOOR, W, H], fill=(16, 20, 30))
    d.line([0, FLOOR, PIT_L, FLOOR], fill=(44, 56, 80), width=3)
    d.line([PIT_R, FLOOR, W, FLOOR], fill=(44, 56, 80), width=3)
    # lubang (dinding bata)
    d.rectangle([PIT_L, FLOOR, PIT_R, PIT_B], fill=(11, 14, 22))
    for row, y in enumerate(range(FLOOR, PIT_B, 24)):
        d.line([PIT_L, y, PIT_R, y], fill=(22, 28, 40), width=1)
        off = 0 if row % 2 else 28
        for x in range(PIT_L + off, PIT_R, 56):
            d.line([x, y, x, y + 24], fill=(22, 28, 40), width=1)
    d.rectangle([PIT_L, PIT_B, PIT_R, H], fill=(8, 10, 14))
    # jendela kantor samar di kejauhan
    for gx in range(30, 700, 90):
        h = random.Random(gx).randrange(60, 200)
        d.rectangle([gx, FLOOR - h, gx + 60, FLOOR], fill=(20, 28, 46))
        for wy in range(FLOOR - h + 10, FLOOR - 10, 22):
            for wx in (gx + 10, gx + 30):
                if random.Random(gx * wy + wx).random() < 0.35:
                    d.rectangle([wx, wy, wx + 10, wy + 10], fill=(70, 80, 60))
    return img


def build_bands():
    img = Image.new("RGB", (W, H), (0, 0, 0))
    d = ImageDraw.Draw(img)
    cols = [(192, 162, 120), (170, 140, 100)]
    rng = random.Random(11)
    for i in range(13):
        top = PIT_B - (i + 1) * LAYER
        bot = PIT_B - i * LAYER
        d.rectangle([300, top, 680, bot], fill=cols[i % 2])
        d.line([300, bot, 680, bot], fill=(118, 92, 62), width=2)
        for _ in range(26):
            x, y = rng.randrange(330, 650), rng.randrange(int(top), int(bot))
            d.rectangle([x, y, x + 3, y + 2], fill=(130, 102, 70))
    return img


def build_door_glow():
    g = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    ImageDraw.Draw(g).rectangle([436, 108, 544, 270], fill=(255, 205, 100, 255))
    return g.filter(ImageFilter.GaussianBlur(24))


BASE = build_base()
BANDS = build_bands()
DOOR_GLOW = build_door_glow()


# ---------------------------------------------------------------- figures
def figure(d, x, fy, s, arms, legs, lean, col, extra=0, eyes=None, hr=13):
    L, B, R = 36 * s, 34 * s, hr * s
    lw = max(3, int(round(7 * s))) + extra
    hip = (x, fy - L)
    ux, uy = math.sin(lean), -math.cos(lean)
    neck = (hip[0] + B * ux, hip[1] + B * uy)
    head = (neck[0] + R * 1.05 * ux, neck[1] + R * 1.05 * uy)
    sh = (neck[0] - 5 * s * ux, neck[1] - 5 * s * uy)

    def seg(a, b):
        d.line([a, b], fill=col, width=lw)
        r = lw / 2
        d.ellipse([b[0] - r, b[1] - r, b[0] + r, b[1] + r], fill=col)

    seg(hip, neck)
    for a in legs:
        a = math.radians(a)
        seg(hip, (hip[0] + L * math.sin(a), hip[1] + L * math.cos(a)))
    hands = []
    for a in arms:
        a = math.radians(a)
        hnd = (sh[0] + 30 * s * math.sin(a), sh[1] + 30 * s * math.cos(a))
        seg(sh, hnd)
        hands.append(hnd)
    d.ellipse([head[0] - R, head[1] - R, head[0] + R, head[1] + R], fill=col)
    if eyes:
        ex, ey = eyes
        cx_, cy_ = head[0] + ex * R * 0.45, head[1] + ey * R * 0.3
        for o in (-0.3, 0.3):
            r = max(1.6, 2.2 * s)
            d.ellipse([cx_ + o * R - r, cy_ - r, cx_ + o * R + r, cy_ + r],
                      fill=(232, 236, 246, 255))
    return hands


# ---------------------------------------------------------------- crowd
crowd = []
for j in range(5):
    crowd.append(dict(x=68 + j * 56, fy=748, s=1.2, dim=True))
for j in range(7):
    crowd.append(dict(x=48 + j * 43, fy=760, s=1.38, dim=False))

rng = random.Random(7)
throws = []  # (t0, member_idx, x_end)
by_member = {i: [] for i in range(len(crowd))}
for i in range(len(crowd)):
    period = rng.uniform(0.8, 1.2)
    t = 3.0 + rng.uniform(0, period)
    while t < 9.8:
        throws.append((t, i, rng.uniform(430, 550)))
        by_member[i].append(t)
        t += period * rng.uniform(0.9, 1.1)
T_FLY = 0.75


def arm_state(i, t):
    """(sudut lengan kanan, apakah masih memegang kertas)."""
    for t0 in by_member[i]:
        w = t - t0
        if -0.3 <= w < 0:
            return lerp(70, -30, (w + 0.3) / 0.3), True
        if 0 <= w < 0.15:
            return lerp(-30, 150, w / 0.15), False
        if 0.15 <= w < 0.6:
            return lerp(150, 40, (w - 0.15) / 0.45), False
    if t < 10:
        return 70, True
    if t < 13:
        return lerp(70, 8, ease((t - 10) / 0.5)), False
    return lerp(8, 155 if i % 2 == 0 else 120, ease((t - 13) / 0.6)), False


def hero_state(t):
    """(x, feet_y, arms, legs, lean, eyes) atau None bila belum muncul."""
    if t < 1.0:
        return None
    if t < 1.6:  # berjalan masuk dari kanan
        u = (t - 1.0) / 0.6
        sw = 25 * math.sin(t * 14)
        return lerp(715, 625, u), FLOOR, (15, -15), (sw, -sw), 0.0, (1, 0.2)
    if t < 2.0:  # ragu di tepi
        return 625, FLOOR, (8, 8), (4, -4), 0.05, (-0.6, 0.8)
    if t < 2.9:  # jatuh
        u = (t - 2.0) / 0.9
        x = lerp(625, CX, ease(u))
        y = FLOOR + (PIT_B - FLOOR) * u * u
        sw = 40 * math.sin(t * 20)
        return x, y, (150 + sw * 0.4, 205 - sw * 0.4), (30 + sw, -30 - sw), \
            0.5 * math.sin(t * 9), (0, 1)
    h = stack_h(t)
    y = PIT_B - h - 1
    if t < 3.3:  # mendarat, membungkuk
        k = 1 - ease((t - 2.9) / 0.4)
        return CX, y, (10, -10), (14 * k, -14 * k), 0.35 * k, (0.2, 1)
    if t < 7:
        return CX, y, (8, -8), (3, -3), 0.04, (0.8, 0.2)
    if t < 11.5:
        bend = 8 * math.sin(t * 9) if t < 10 else 0
        return CX, y, (20, -20), (bend, -bend), 0.03, (0.9, -0.2)
    up = ease((t - 11.5) / 0.4)
    return CX, y, (lerp(8, 20, up), lerp(-8, 175, up)), (3, -3), 0.0, (0.6, -0.6)


# ---------------------------------------------------------------- text helpers
def text_a(d, xy, s, font, fill, a, stroke=0):
    if a <= 0.02:
        return
    d.text(xy, s, font=font, fill=fill + (int(255 * clamp(a)),), anchor="mm",
           stroke_width=stroke, stroke_fill=(5, 8, 14, int(255 * clamp(a))),
           align="center")


def window(t, a, b, fade=0.25):
    return clamp(min(t - a, b - t) / fade)


# ---------------------------------------------------------------- frame
def render(t):
    fr = BASE.copy()
    d = ImageDraw.Draw(fr, "RGBA")

    # pintu ruang direktur (simbol tujuan)
    da = ease((t - 1.0) / 0.8)
    if da > 0:
        pulse = 0.75 + 0.25 * math.sin(t * 3)
        if t > 12.0:
            pulse = 1.0
        g = DOOR_GLOW.copy()
        a = g.getchannel("A").point([int(v * da * pulse * 0.9) for v in range(256)])
        g.putalpha(a)
        fr.paste(g, (0, 0), g)
        d = ImageDraw.Draw(fr, "RGBA")
        al = int(255 * da)
        d.rounded_rectangle([445, 120, 535, 262], 6, fill=(255, 216, 128, al),
                            outline=(255, 238, 190, al), width=4)
        d.rectangle([457, 134, 490, 190], outline=(214, 160, 70, al), width=2)
        d.rectangle([500, 134, 523, 190], outline=(214, 160, 70, al), width=2)
        d.rectangle([457, 200, 490, 250], outline=(214, 160, 70, al), width=2)
        d.rectangle([500, 200, 523, 250], outline=(214, 160, 70, al), width=2)
        d.ellipse([505, 226, 513, 234], fill=(110, 70, 20, al))

    # tumpukan kertas
    h = stack_h(t)
    if h > 0:
        top = PIT_B - h
        mask = Image.new("L", (W, H), 0)
        md = ImageDraw.Draw(mask)
        md.rectangle([PIT_L, max(top, FLOOR), PIT_R, PIT_B], fill=255)
        hw = 100
        if top < FLOOR:
            hw = lerp(100, 160, (top - TOP_FINAL) / (FLOOR - TOP_FINAL))
            md.polygon([(CX - hw, top), (CX + hw, top), (650, FLOOR),
                        (330, FLOOR)], fill=255)
        fr.paste(BANDS, (0, 0), mask)
        d = ImageDraw.Draw(fr, "RGBA")
        if top < FLOOR:
            d.line([(CX - hw, top), (330, FLOOR)], fill=(118, 92, 62, 255), width=3)
            d.line([(CX + hw, top), (650, FLOOR)], fill=(118, 92, 62, 255), width=3)
            d.line([(CX - hw, top), (CX + hw, top)], fill=(232, 208, 160, 255), width=4)
        else:
            d.line([(PIT_L, top), (PIT_R, top)], fill=(232, 208, 160, 255), width=4)
        # label hinaan di tiap lapisan pit
        for i, s in enumerate(INSULTS):
            cy = PIT_B - (i + 0.5) * LAYER
            vis = clamp((h - (i + 1) * LAYER + 20) / 30)
            if vis > 0:
                text_a(d, (CX, cy), s, f_lbl, (70, 48, 26), vis)
        # label di gundukan saat puncak
        lab = clamp((t - 12.0) / 0.4)
        if lab > 0:
            for k, s in enumerate(["MENDING RESIGN", "GAK COCOK", "GAK ADA POTENSI"]):
                cy = PIT_B - (10 - k + 0.5) * LAYER
                text_a(d, (CX, cy), s, f_lbl, (70, 48, 26), lab)

    # tokoh
    items = []  # (x, fy, s, arms, legs, lean, eyes, kind)
    for i, c in enumerate(crowd):
        sway = 0.05 * math.sin(t * 2 + i)
        ang, _ = arm_state(i, t)
        look = (1, 0.3) if t < 10.4 else (0.3, -1)
        lean = sway if t < 10.2 else -0.12 + sway * 0.5
        items.append((c["x"], c["fy"], c["s"], (ang, 12), (6, -6), lean, look,
                      "dim" if c["dim"] else "crowd"))
    hs = hero_state(t)
    if hs:
        x, fy, arms, legs, lean, eyes = hs
        items.append((x, fy, 1.0, arms, legs, lean, eyes, "hero"))

    gl = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    gd = ImageDraw.Draw(gl)
    gcol = {"dim": (80, 100, 150, 150), "crowd": (112, 142, 205, 190),
            "hero": (210, 224, 255, 240)}
    for x, fy, s, arms, legs, lean, eyes, kind in items:
        figure(gd, x, fy, s, arms, legs, lean, gcol[kind], extra=5)
    gl = gl.filter(ImageFilter.GaussianBlur(3))
    fr.paste(gl, (0, 0), gl)
    d = ImageDraw.Draw(fr, "RGBA")
    hands_by_member = {}
    for n, (x, fy, s, arms, legs, lean, eyes, kind) in enumerate(items):
        col = (4, 6, 10, 255) if kind != "dim" else (10, 13, 20, 255)
        hnds = figure(d, x, fy, s, arms, legs, lean, col, eyes=eyes)
        hands_by_member[n] = hnds
    # kertas di tangan
    for i, c in enumerate(crowd):
        ang, holding = arm_state(i, t)
        if holding and t < 10:
            hx, hy = hands_by_member[i][0]
            d.rectangle([hx - 2, hy - 14, hx + 12, hy + 4], fill=(242, 242, 236, 255))

    # kertas terbang
    for k, (t0, i, xe) in enumerate(throws):
        w = t - t0
        if 0 <= w < T_FLY:
            c = crowd[i]
            sx, sy = c["x"] + 15 * c["s"], c["fy"] - 96 * c["s"]
            ey = PIT_B - stack_h(t0 + T_FLY) - 6
            u = w / T_FLY
            px_, py_ = lerp(sx, xe, u), lerp(sy, ey, u * u) - 190 * 4 * u * (1 - u)
            a = t * 9 + k
            pts = [(px_ + 9 * math.cos(a + o), py_ + 9 * math.sin(a + o))
                   for o in (0.7, 2.4, 3.9, 5.5)]
            d.polygon(pts, fill=(244, 244, 238, 255))

    # tanda seru saat massa kaget
    ex = window(t, 10.2, 11.4, 0.15)
    if ex > 0:
        for i in (5, 7, 9, 11):
            c = crowd[i]
            text_a(d, (c["x"] + 6, c["fy"] - 170 * c["s"] / 1.38 - 8), "!", f_ex,
                   (255, 255, 255), ex)

    # caption
    text_a(d, (360, 1212), "Dia pasti gak lama.", f_cap, (255, 255, 255),
           window(t, 0.1, 1.5), 3)
    text_a(d, (360, 1212), "Tiap penolakan = satu anak tangga.", f_cap,
           (255, 255, 255), window(t, 7.0, 10.0), 3)
    text_a(d, (360, 1215), "Orang yang meremehkanmu\nsedang membangun tanggamu.",
           f_cap, (255, 236, 170), window(t, 13.0, 15.1, 0.4), 3)
    text_a(d, (360, 1262), "KARIER  ·  MINDSET", f_wm, (200, 210, 230), 0.45)

    # cahaya emas di akhir
    r = ease((t - 13.0) / 0.8)
    if r > 0:
        bm = Image.new("RGBA", (W, H), (0, 0, 0, 0))
        bd = ImageDraw.Draw(bm)
        bd.polygon([(455, 262), (525, 262), (360, FLOOR + 10), (20, FLOOR + 10)],
                   fill=(255, 214, 110, int(80 * r)))
        bm = bm.filter(ImageFilter.GaussianBlur(10))
        fr.paste(bm, (0, 0), bm)
        d = ImageDraw.Draw(fr, "RGBA")
        rr = random.Random(5)
        for k in range(46):
            ph = (t * 0.8 + rr.random()) % 1.0
            sx = lerp(490, rr.uniform(30, 350), ph)
            sy = lerp(262, FLOOR, ph)
            d.ellipse([sx - 2, sy - 2, sx + 2, sy + 2], fill=(255, 226, 140, int(220 * r)))
        d.rectangle([0, 0, W, H], fill=(255, 200, 80, int(22 * r)))

    # kilatan saat tiba di puncak
    fl = clamp(1 - (t - 12.0) / 0.35) if 12.0 <= t < 12.35 else 0
    if fl > 0:
        d.rectangle([0, 0, W, H], fill=(255, 245, 220, int(110 * fl)))

    # fade in/out
    fade = max(clamp(1 - t / 0.4), clamp(1 - (DUR - t) / 0.5))
    if fade > 0:
        d.rectangle([0, 0, W, H], fill=(0, 0, 0, int(255 * fade)))
    return fr.convert("RGB")


# ---------------------------------------------------------------- audio
def make_audio(path):
    sr = 44100
    n = int(sr * DUR)
    t = np.arange(n) / sr
    rs = np.random.RandomState(1)
    out = 0.03 * np.sin(2 * np.pi * 55 * t) + 0.012 * np.convolve(
        rs.randn(n), np.ones(40) / 40, mode="same")

    def add(t0, sig):
        i = int(t0 * sr)
        j = min(n, i + len(sig))
        if i < n:
            out[i:j] += sig[:j - i]

    def burst(dur, amp, hp=True):
        m = int(sr * dur)
        z = rs.randn(m)
        if hp:
            z = np.diff(z, prepend=0)
        return amp * z * np.exp(-np.linspace(0, 6, m))

    def tone(f, dur, amp, decay=3.0, attack=0.0):
        m = int(sr * dur)
        x = np.arange(m) / sr
        env = np.exp(-x * decay)
        if attack:
            env *= np.minimum(1, x / attack)
        return amp * np.sin(2 * np.pi * f * x) * env

    add(1.0, burst(0.2, 0.01))
    m = int(sr * 0.9)  # whoosh jatuh
    env = np.linspace(0, 1, m) ** 2
    add(2.0, 0.07 * np.diff(rs.randn(m), prepend=0) * env)
    add(2.9, tone(70, 0.5, 0.5, 8))
    add(2.9, burst(0.2, 0.15, hp=False))
    for t0, _, _ in throws:  # kertas jatuh
        add(t0 + T_FLY, burst(0.07, 0.07))
    m = int(sr * 3.0)  # riser
    x = np.arange(m) / sr
    f = 180 + 340 * (x / 3.0) ** 1.5
    ph = 2 * np.pi * np.cumsum(f) / sr
    add(7.0, 0.1 * np.sin(ph) * np.linspace(0, 1, m) ** 1.5)
    add(12.0, tone(50, 1.2, 0.55, 3.5))
    add(12.0, burst(0.25, 0.25, hp=False))
    for fq in (261.6, 329.6, 392.0, 523.3):  # pad akhir
        add(12.1, tone(fq, 2.9, 0.06, 0.5, attack=0.5))
    add(13.0, tone(1568, 1.5, 0.025, 2.5))
    add(13.0, tone(2093, 1.5, 0.015, 2.5))
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

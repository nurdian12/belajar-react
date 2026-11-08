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
              sit=0.0, sc=1.15, lamp=None):
    """Gambar stickman di layer RGBA transparan. lamp=None / warna lentera.
    Mengembalikan (layer, posisi lentera)."""
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
    lamp_pos = None
    if lamp is not None and hand_f is not None:
        lx, ly = hand_f[0] + f * 3 * sc, hand_f[1] + 7 * sc
        d.rectangle([(lx - 4.5 * sc) * S, (ly - 6 * sc) * S, (lx + 4.5 * sc) * S, (ly + 6 * sc) * S],
                    fill=lamp)
        d.line([(lx - 3 * sc) * S, (ly - 6 * sc) * S, (hand_f[0]) * S, (hand_f[1]) * S],
               fill=col, width=max(2, S))
        lamp_pos = (lx, ly)
    return lay, lamp_pos


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
    return x, walk, r


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
    p = BG.copy()
    x, walk, r = hero_A_state(t)
    sit = ease((t - 10.4) / 0.8)
    hero, lamp = fig_layer(x, FLOOR, WHITE, f=1, walk=walk, lean=0.04 * r, head=0.12 * r,
                           arm_f=lerp(70, 40, r / 4), sit=sit, lamp=(255, 214, 120))
    paste_glow(p, lamp[0], lamp[1], lerp(1.0, 0.18, r / 4))
    for k in range(4):
        sx, sy, f, sc, al, w = silhouette_A(k, t)
        if al > 0.01:
            lay, _ = fig_layer(sx, sy, SIL, f=f, walk=w, sc=sc, arm_f=15, arm_b=-8)
            put(p, lay, al)
    put(p, hero)
    return p


def panel_B(t):
    p = BG.copy()
    close = ease((t - 9.3) / 0.8)
    ring(p, B_HERO_X, RING_RX, close)
    hero, lamp = fig_layer(B_HERO_X, FLOOR, WHITE, f=1, arm_f=lerp(66, 78, close),
                           lamp=(255, 214, 120))
    paste_glow(p, lamp[0], lamp[1], 1.0 + 0.7 * close)
    for k in range(4):
        sx, sy, f, sc, al, w = silhouette_B(k, t)
        if al > 0.01 and sx < PW + 40:
            lit = k == 3 and close > 0
            lay, _ = fig_layer(sx, sy, lerp_col(SIL, (230, 230, 238), close) if lit else SIL,
                               f=f, walk=w, sc=sc, arm_f=15, arm_b=-8)
            put(p, lay, al)
    put(p, hero)
    hu = ease((t - 9.7) / 0.5)
    if hu > 0:
        heart(p, 182, 160 + 3 * math.sin(t * 5), 0.85, hu)
    return p


def lerp_col(a, b, u):
    return tuple(int(lerp(x, y, u)) for x, y in zip(a, b))


def finish_panel(img, label, texts, t, st_col, st_col2=None, t2=None):
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

    for k in range(4):
        steps(ST[k], 1.0)                    # langkah tokoh A dan siluet B
        add(ST[k] + 1.4, sweep(340, 190, 0.45, 0.09))   # ditolak (A)
        if k < 3:
            add(ST[k] + 1.9, tone(880, 0.6, 0.035, 5))   # tersaring (B)
    add(9.7, tone(523.3, 1.6, 0.06, 2.2))
    add(9.7, tone(659.3, 1.6, 0.05, 2.2))
    add(9.7, tone(784.0, 1.6, 0.05, 2.2))
    add(12.0, tone(50, 1.2, 0.5, 3.5))
    add(12.0, burst(0.25, 0.2))
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

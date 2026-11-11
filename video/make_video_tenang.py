#!/usr/bin/env python3
"""Video animasi stickman dua angle: "Debar bukan selalu cinta, pilih yang bikin tenang."
Topik: percintaan / memilih pasangan. 720x1280 (9:16), 24 fps, 20 detik, SFX sintetis.

Angle A (panel atas)  : DIA YANG MENGEJAR DEBAR -> mengejar sosok tarik-ulur, detak makin liar, lalu lelah.
Angle B (panel bawah) : DIA YANG MEMILIH TENANG -> duduk dengan lilin, yang datang pelan duduk di sampingnya.

Di dasar tiap panel ada garis detak jantung (EKG) yang disinkronkan dengan ikon hati dan SFX.
Memakai helper dari make_video_penolakan.py (gambar tokoh, efek emosi, teks).
Pakai: python3 video/make_video_tenang.py [output.mp4]
Butuh: Pillow, numpy, ffmpeg.
"""
import math
import os
import subprocess
import sys
import tempfile
import wave

sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

import numpy as np
from PIL import Image, ImageDraw

import make_video_penolakan as base
from make_video_penolakan import (
    AMBER, BG, BLUE, CORAL, FLOOR, FPS, F_PUNCH, F_SUB, F_TITLE, GREY, H, PH, PW, PX, PYA, PYB,
    RED, S, SIL, W, WHITE, blank, broken_heart, clamp, ease, fig_layer, finish_panel, heart,
    lerp, lerp_col, overlay, paste_glow, pulse, put, ring_pulse, scale_col, shock, sparks,
    spaced, spaced_multi, tears, vignette)

DUR = 20.0
OUT = sys.argv[1] if len(sys.argv) > 1 else os.path.join(
    os.path.dirname(os.path.abspath(__file__)), "pilih-yang-tenang.mp4")

IMP_A = [3.7, 6.3, 8.4]            # momen "kena": dia menjauh lagi
BURST = 8.8                        # duduk berdua dengan tenang (angle B)
CANDLE_X = 330
TEARS = [9.9 + 0.55 * i + 0.13 * (i % 3) for i in range(6)]
base.TEARS[:] = TEARS
SPARK_COL = (255, 150, 120)

A_HERO = [(0, 120), (2.0, 120), (3.0, 200), (4.4, 200), (5.4, 430), (7.0, 430), (8.0, 520), (9.0, 520),
          (9.6, 505), (20, 505)]
A_SPARK = [(0, 430), (2.0, 430), (3.2, 255), (3.6, 255), (4.4, 540), (5.0, 540), (5.8, 485), (6.2, 485),
           (7.0, 600), (7.8, 600), (20, 600)]
B_HERO_X = 255
B_SIL = [(0, 760), (4.0, 760), (7.0, 400), (20, 400)]

A_TEXT = [(0.0, ""), (2.1, "DEBARNYA KENCANG."), (3.7, "DIA MENJAUH."),
          (4.8, "DIA MENDEKAT LAGI."), (6.3, "DIA MENJAUH LAGI."), (8.4, "LELAH."),
          (10.4, "DEBAR, BUKAN TENANG.")]
B_TEXT = [(0.0, ""), (2.1, "TARIK NAPAS."), (3.4, "NYALAKAN LILIN."), (4.0, "DIA DATANG PELAN."),
          (7.0, "TIDAK ADA YANG DIKEJAR."), (8.8, "TENANG BERDUA.")]

# ------------------------------------------------------------------ detak jantung
DT = 1 / 240
TT = np.arange(0, DUR + 0.5, DT)
BPM_A = np.interp(TT, [0, 2.0, 3.0, 3.6, 3.7, 4.2, 5.4, 5.8, 6.3, 6.8, 8.0, 8.4, 8.9, 9.4, 11.0, 13.0, 20],
                  [80, 100, 150, 160, 60, 140, 150, 165, 60, 150, 175, 60, 180, 160, 70, 35, 25])
AMP_A = np.interp(TT, [0, 3, 6, 8, 9.4, 11, 13, 20], [12, 26, 30, 34, 30, 14, 6, 3])
BPM_B = np.interp(TT, [0, 3.4, 5.0, 20], [78, 70, 62, 58])
AMP_B = np.interp(TT, [0, 20], [13, 13])
CUM_A = np.cumsum(BPM_A / 60 * DT)
CUM_B = np.cumsum(BPM_B / 60 * DT)


def beat_times(cum):
    idx = np.where(np.diff(np.floor(cum)) > 0)[0]
    return [TT[i] for i in idx]


def cum_at(cum, t):
    return float(np.interp(t, TT, cum))


def wave_pqrst(ph):
    if 0.08 <= ph < 0.18:
        return 0.12 * math.sin(math.pi * (ph - 0.08) / 0.10)
    if 0.26 <= ph < 0.29:
        return -0.18 * math.sin(math.pi * (ph - 0.26) / 0.03)
    if 0.29 <= ph < 0.34:
        return math.sin(math.pi * (ph - 0.29) / 0.05)
    if 0.34 <= ph < 0.38:
        return -0.3 * math.sin(math.pi * (ph - 0.34) / 0.04)
    if 0.50 <= ph < 0.68:
        return 0.25 * math.sin(math.pi * (ph - 0.50) / 0.18)
    return 0.0


def ecg(p, t, cum, amp_tab, color, flat=1.0):
    """Garis EKG bergulir di dasar panel. flat<1 memperkecil amplitudo (lelah)."""
    lay = blank()
    d = ImageDraw.Draw(lay)
    d.rectangle([0, (FLOOR + 14) * S, PW * S, (PH - 8) * S], fill=(14, 16, 24, 235))
    yc, x0, x1, speed = 412, 22, 618, 105.0
    amp = float(np.interp(t, TT, amp_tab)) * flat
    pts = []
    for px in np.arange(x0, x1 + 1, 2.0):
        tp = t - (x1 - px) / speed
        y = yc if tp < 0 else yc - amp * wave_pqrst(cum_at(cum, tp) % 1.0)
        pts.append((px * S, y * S))
    d.line(pts, fill=color + (255,), width=int(2.2 * S), joint="curve")
    put(p, lay)


def beat_scale(cum, t):
    return 1 + 0.28 * math.exp(-(cum_at(cum, t) % 1.0) * 9)


# ------------------------------------------------------------------ gerak
def track(keys, t):
    x, moving, f = float(keys[0][1]), False, 1
    for (t0, x0), (t1, x1) in zip(keys, keys[1:]):
        if t >= t0:
            if x1 != x0:
                f = 1 if x1 > x0 else -1
            if t < t1:
                u = ease((t - t0) / (t1 - t0))
                x = lerp(x0, x1, u)
                moving = x1 != x0 and 0 < u < 1
            else:
                x = float(x1)
    return x, moving, f


def candle(p, x, flame):
    lay = blank()
    d = ImageDraw.Draw(lay)
    d.rectangle([(x - 4) * S, (FLOOR - 24) * S, (x + 4) * S, FLOOR * S], fill=(238, 228, 200, 255))
    if flame > 0.02:
        h = 12 * flame
        d.polygon([(x * S, (FLOOR - 26 - h) * S), ((x - 3.2) * S, (FLOOR - 25) * S),
                   ((x + 3.2) * S, (FLOOR - 25) * S)], fill=(255, 190, 80, 255))
    put(p, lay)


def sparkle(p, cx, cy, t, k):
    if k <= 0.02:
        return
    lay = blank()
    d = ImageDraw.Draw(lay)
    for j in range(9):
        a = j * 0.7 + t * 3.0
        r = 30 + 10 * math.sin(t * 7 + j * 1.9)
        x, y = cx + math.cos(a) * r, cy + math.sin(a * 1.3) * r * 1.2
        z = 2.5 + 1.6 * math.sin(t * 11 + j)
        d.polygon([(x * S, (y - z) * S), ((x + z * 0.5) * S, y * S), (x * S, (y + z) * S),
                   ((x - z * 0.5) * S, y * S)], fill=(255, 226, 150, 255))
    put(p, lay, k)


# ------------------------------------------------------------------ tokoh A
def hero_A(t):
    x, moving, f = track(A_HERO, t)
    hit = sum(pulse(t - m) for m in IMP_A)
    r = sum(ease((t - (m + 0.15)) / 1.0) for m in IMP_A)
    thrilled = (2.3 <= t < 3.7) or (5.6 <= t < 6.3)
    if hit > 0.05:
        face = "hit"
    elif r > 0.5 and t >= 8.5:
        face = "sad"
    elif thrilled:
        face = "happy"
    else:
        face = "hope"
    pant = 0.03 * math.sin(t * 14) if 8.4 <= t < 12 else 0.0
    return dict(x=x - 16 * hit, f=f, walk=t * 9.5 if moving else None,
                arm=(80 if moving else 30) + 25 * hit, face=face, hit=hit, r=r,
                sit=ease((t - 9.4) / 0.8), lean=0.04 * r - 0.25 * hit + pant)


def panel_A(t):
    p = BG.copy()
    h = hero_A(t)
    flat = 1.0 if t < 11 else max(0.25, 1 - (t - 11) * 0.3)
    ecg(p, t, CUM_A, AMP_A, (255, 110, 100), flat)
    sx, smov, sf = track(A_SPARK, t)
    sal = 1 - ease((t - 7.8) / 0.6)
    if sal > 0.01:
        flick = 0.7 + 0.3 * math.sin(t * 17)
        paste_glow(p, sx, 300, 0.9 * flick * sal)
        lay, _, _ = fig_layer(sx, FLOOR, SPARK_COL, f=-1 if sx > h["x"] else 1,
                              walk=t * 9.5 if smov else None, arm_f=15, arm_b=-8, face="happy")
        put(p, lay, sal)
        sparkle(p, sx, 300, t, sal)
    hero, _, hd = fig_layer(h["x"], FLOOR, WHITE, f=1, walk=h["walk"], lean=h["lean"],
                            head=0.12 * h["r"], arm_f=h["arm"], sit=h["sit"], face=h["face"])
    put(p, hero)
    for m in IMP_A:
        shock(p, h["x"] + 8, 300, t - m, RED)
    fall = ease((t - (IMP_A[2] + 0.6)) / 0.9)
    bs = 0.8 * beat_scale(CUM_A, t) * (1 - 0.5 * clamp((t - 11) / 3))
    if h["r"] < 0.15:
        heart(p, h["x"] - 2, hd[1] - 42, bs, 1.0)
    elif fall < 1:
        broken_heart(p, h["x"] - 2, hd[1] - 42, bs, h["r"], fall)
    if t > TEARS[0]:
        tears(p, hd, 1, t)
    vignette(p, 0.7 * clamp(h["r"] / 3) + 0.35 * h["hit"])
    overlay(p, (200, 40, 55), 0.30 * sum(pulse(t - m, 0.35) for m in IMP_A))
    return p, 9 * h["hit"] * math.sin(t * 90), 5 * h["hit"] * math.cos(t * 77)


# ------------------------------------------------------------------ tokoh B
def panel_B(t):
    p = BG.copy()
    close = ease((t - BURST) / 0.8)
    flame = ease((t - 3.4) / 0.6)
    ecg(p, t, CUM_B, AMP_B, AMBER)
    if flame > 0.02:
        paste_glow(p, CANDLE_X, FLOOR - 30, (0.9 + 0.05 * math.sin(t * 8)) * flame + 0.6 * close)
    candle(p, CANDLE_X, flame)
    breathe = 0.03 * math.sin(t * 2 * math.pi * 0.35)
    face = "happy" if t >= BURST else "calm"
    hero, _, hd = fig_layer(B_HERO_X, FLOOR, WHITE, f=1, arm_f=40, lean=breathe, sit=1.0, face=face)
    put(p, hero)
    sx, smov, _ = track(B_SIL, t)
    if t >= 4.0:
        ssit = ease((t - 7.2) / 0.8)
        lay, _, shd = fig_layer(sx, FLOOR, lerp_col(SIL, (232, 232, 240), close), f=-1,
                                walk=t * 6.5 if smov else None, arm_f=15, arm_b=-8, sit=ssit,
                                face="happy" if t >= BURST else None)
        put(p, lay, ease((t - 4.0) / 0.4))
        if t >= 7.8:
            heart(p, shd[0], shd[1] - 36, 0.5 * beat_scale(CUM_B, t), ease((t - 7.8) / 0.5))
    if t >= 2.0:
        heart(p, hd[0], hd[1] - 36, 0.5 * beat_scale(CUM_B, t), ease((t - 2.0) / 0.5))
    ring_pulse(p, sx, t - 7.0)
    shock(p, CANDLE_X, 300, t - BURST, (255, 214, 140), rmax=130, dur=0.9)
    sparks(p, CANDLE_X, 290, t - BURST)
    for i in range(5):
        u = (t - (10.3 + 0.6 * i)) / 1.8
        if 0 <= u < 1:
            heart(p, 290 + 22 * i + 8 * math.sin(u * 6 + i), 200 - 80 * u, 0.36, math.sin(math.pi * u))
    overlay(p, (255, 205, 120), 0.18 * pulse(t - BURST, 0.6))
    return p, 0.0, 0.0


# ------------------------------------------------------------------ frame
def render(t):
    fr = Image.new("RGB", (W, H), (0, 0, 0))
    d = ImageDraw.Draw(fr)
    dim = 1 - 0.65 * ease((t - 12.0) / 0.8)
    l1 = "DEBAR BUKAN SELALU CINTA."
    n1 = int(len(l1) * clamp((t - 0.2) / 1.4) + 0.999)
    spaced(d, l1, W / 2, 84, F_TITLE, scale_col(WHITE, dim), nchars=n1)
    if t >= 10.0:
        l2 = "CARI YANG BIKIN TENANG,"
        n2 = int(len(l2) * clamp((t - 10.0) / 1.3) + 0.999)
        spaced(d, l2, W / 2, 126, F_TITLE, scale_col(WHITE, dim), nchars=n2)

    fade_end = clamp((DUR - t) / 0.5)
    k = ease(t / 0.8) * lerp(1.0, 0.10, ease((t - 12.0) / 0.8)) * fade_end
    black = Image.new("RGB", (PW, PH), (0, 0, 0))
    pa = finish_panel(panel_A(t), "DIA YANG MENGEJAR DEBAR", A_TEXT, t, BLUE)
    pb = finish_panel(panel_B(t), "DIA YANG MEMILIH TENANG", B_TEXT, t, (170, 180, 200), AMBER, BURST)
    fr.paste(Image.blend(black, pa, k), (PX, PYA))
    fr.paste(Image.blend(black, pb, k), (PX, PYB))

    pu = ease((t - 12.6) / 0.6) * fade_end
    if pu > 0:
        spaced_multi(d, [("PILIH", AMBER)], W / 2, 600, F_PUNCH, alpha=pu)
        spaced_multi(d, [("YANG TENANG.", WHITE)], W / 2, 672, F_PUNCH, alpha=pu)
    su = ease((t - 14.6) / 0.8) * fade_end
    if su > 0:
        spaced(d, "DEBAR ITU SEMENTARA.", W / 2, 1000, F_SUB, scale_col(GREY, su), sp=2)
        spaced(d, "TENANG ITU PULANG.", W / 2, 1038, F_SUB, scale_col(GREY, su), sp=2)
    fade = clamp(1 - t / 0.4)
    if fade > 0:
        fr = Image.blend(fr, Image.new("RGB", (W, H), (0, 0, 0)), fade)
    return fr


# ------------------------------------------------------------------ audio
def make_audio(path):
    sr = 44100
    n = int(sr * DUR)
    t = np.arange(n) / sr
    rs = np.random.RandomState(31)
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

    def lp(dur, amp, k=60):
        return amp * np.convolve(rs.randn(int(sr * dur)), np.ones(k) / k, mode="same")

    def steps(t0, dur, per=0.34):
        tt = t0
        while tt < t0 + dur:
            add(tt, tone(95, 0.09, 0.05, 40))
            tt += per

    def thump(t0, amp, f=62):
        add(t0, tone(f, 0.16, amp, 24))
        add(t0 + 0.14, tone(f * 0.85, 0.16, amp * 0.65, 22))

    # detak jantung di tiap angle (mengikuti irama EKG di layar)
    for bt in beat_times(CUM_A):
        if bt < 14:
            thump(bt, 0.10 + 0.04 * float(np.interp(bt, TT, BPM_A)) / 180)
    for bt in beat_times(CUM_B):
        if 2.0 <= bt < 12.5:
            thump(bt, 0.07, 56)
    # angle A: sosok tarik-ulur
    for a, b in ((2.0, 3.2), (4.4, 5.8), (6.2, 7.0)):
        steps(a, b - a, 0.3)
        for i in range(int((b - a) * 14)):
            add(a + i / 14, burst(0.06, 0.07))   # desis kembang api
    for k, hh in enumerate(IMP_A):
        add(hh - 0.1, sweep(520, 200, 0.4, 0.07))   # menjauh
        add(hh, tone(52, 0.7, 0.7, 6))
        add(hh, burst(0.16, 0.22))
        add(hh, tone(2637, 0.25, 0.03, 18))
        add(hh, sweep(380, 150, 0.5, 0.1))
    steps(3.0, 0.4, 0.3)
    steps(5.0, 1.0, 0.3)
    steps(7.0, 1.0, 0.25)
    add(8.4, lp(1.4, 0.1, 30) * np.sin(np.linspace(0, np.pi, int(sr * 1.4))))   # terengah-engah
    add(9.4, lp(0.7, 0.08, 40) * np.linspace(1, 0, int(sr * 0.7)))               # terduduk
    for tt in TEARS:
        add(tt + 0.7, tone(1500, 0.12, 0.05, 30) * np.linspace(1, 0.4, int(sr * 0.12)))
    for i, fq in enumerate((440.0, 392.0, 329.6)):
        add(10.5 + i * 0.45, tone(fq, 1.6, 0.045, 2.6))
    # angle B: tenang
    add(2.0, lp(1.2, 0.05, 30) * np.sin(np.linspace(0, np.pi, int(sr * 1.2))))   # tarik napas
    add(3.4, burst(0.2, 0.1))                 # korek api / sumbu menyala
    add(3.5, tone(660, 0.8, 0.03, 4))
    add(3.6, lp(0.8, 0.02, 8))
    for i in range(14):                       # lilin berderak pelan
        add(3.8 + rs.uniform(0, 9), tone(2400 + rs.uniform(0, 800), 0.03, 0.02, 90))
    steps(4.0, 3.0, 0.62)                     # yang datang berjalan pelan
    add(7.2, lp(0.6, 0.05, 40) * np.linspace(1, 0, int(sr * 0.6)))   # duduk
    add(7.1, tone(523.3, 1.5, 0.03, 2.5))
    add(BURST, tone(110, 0.8, 0.28, 5))
    for i, fq in enumerate((1046.5, 1318.5, 1568.0, 2093.0)):
        add(BURST + 0.05 + i * 0.09, tone(fq, 1.0, 0.03, 4))
    for fq in (392.0, 523.3, 659.3):
        add(BURST + 0.2, tone(fq, 2.4, 0.045, 1.6))
    for i in range(4):
        add(10.5 + 0.6 * i, tone(1760, 0.35, 0.015, 8))
    m = int(sr * 1.5)
    x_ = np.arange(m) / sr
    add(10.5, 0.07 * np.sin(2 * np.pi * np.cumsum(180 + 600 * (x_ / 1.5) ** 1.6) / sr)
        * np.linspace(0, 1, m) ** 1.5)
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

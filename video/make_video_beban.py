#!/usr/bin/env python3
"""Video animasi stickman dua angle: "Move on bukan melupakan, tapi meletakkan."
Topik: percintaan / move on. 720x1280 (9:16), 24 fps, 20 detik, SFX sintetis.

Angle A (panel atas)  : DIA YANG MENGUBUR   -> mengubur koper kenangan, tapi terus ditarik kembali.
Angle B (panel bawah) : DIA YANG MELETAKKAN -> menaruh koper di bangku, melangkah ringan ke cahaya.

Memakai helper dari make_video_penolakan.py (gambar tokoh, efek emosi, teks).
Pakai: python3 video/make_video_beban.py [output.mp4]
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
    AMBER, BG, BLUE, CORAL, FLOOR, FPS, F_PUNCH, F_SUB, F_TITLE, GREY, H, PH, PW, PX, PYA,
    PYB, RED, S, W, WHITE, blank, broken_heart, clamp, ease, fig_layer, finish_panel, heart,
    lerp, overlay, paste_glow, pulse, put, rain, ring_pulse, scale_col, shock, sparks,
    spaced, spaced_multi, tears, vignette)

DUR = 20.0
OUT = sys.argv[1] if len(sys.argv) > 1 else os.path.join(
    os.path.dirname(os.path.abspath(__file__)), "move-on-meletakkan.mp4")

PIT_X, PIT_W = 440, 64             # lubang kubur (angle A)
IMP_A = [6.0, 7.6, 9.0]            # momen "kena": koper ditarik muncul lagi
BURST = 9.4                        # sampai di cahaya (angle B)
BENCH = (330, 400, FLOOR - 30)     # bangku (angle B)
SUIT_BENCH = (365, FLOOR - 43)     # posisi koper di bangku
TEARS = [9.9 + 0.55 * i + 0.13 * (i % 3) for i in range(6)]
base.TEARS[:] = TEARS
DIRT = (86, 68, 56)

A_KEYS = [(0, 150), (2.0, 150), (3.6, 345), (5.0, 345), (5.9, 265), (6.6, 265), (7.4, 345),
          (8.0, 345), (8.9, 250), (9.0, 250), (9.6, 380), (20, 380)]
B_KEYS = [(0, 150), (2.0, 150), (3.6, 300), (6.2, 300), (9.2, 520), (20, 520)]

A_TEXT = [(0.0, ""), (2.1, "BERAT BANGET."), (3.9, "KUBURKAN SAJA."),
          (6.0, "KENAPA MUNCUL LAGI?"), (7.6, "KUBUR LAGI..."), (9.0, "TETAP BERAT."),
          (10.4, "MASIH MEMIKUL.")]
B_TEXT = [(0.0, ""), (2.1, "BERAT, TAPI DIBAWA."), (3.8, "LETAKKAN SAJA."), (5.0, "LEGA."),
          (6.6, "KENANGAN BOLEH TINGGAL."), (8.3, "LANGKAH RINGAN."), (9.4, "RINGAN, TERANG.")]


def track(keys, t):
    """Posisi x dari keyframe (ease), apakah bergerak, dan arah hadap."""
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


# ------------------------------------------------------------------ benda
def suitcase(p, cx, cy, alpha=1.0):
    lay = blank()
    d = ImageDraw.Draw(lay)
    w, h = 34, 26
    d.rectangle([(cx - 6) * S, (cy - h / 2 - 6) * S, (cx + 6) * S, (cy - h / 2) * S],
                outline=(84, 56, 34, 255), width=2 * S)
    d.rounded_rectangle([(cx - w / 2) * S, (cy - h / 2) * S, (cx + w / 2) * S, (cy + h / 2) * S],
                        radius=3 * S, fill=(142, 98, 62, 255), outline=(84, 56, 34, 255), width=2 * S)
    for dx in (-8, 8):
        d.line([((cx + dx) * S, (cy - h / 2) * S), ((cx + dx) * S, (cy + h / 2) * S)],
               fill=(96, 64, 40, 255), width=2 * S)
    put(p, lay, alpha)


def pit(p):
    lay = blank()
    ImageDraw.Draw(lay).rectangle([(PIT_X - PIT_W / 2) * S, FLOOR * S, (PIT_X + PIT_W / 2) * S,
                                   (FLOOR + 26) * S], fill=(10, 10, 16, 255))
    put(p, lay)


def mound(p, c):
    if c <= 0.01:
        return
    lay = blank()
    pts = [((PIT_X - 38) * S, FLOOR * S)]
    for i in range(0, 37):
        u = i / 36
        pts.append(((PIT_X - 38 + 76 * u) * S, (FLOOR - 18 * c * math.sin(math.pi * u) ** 0.8) * S))
    pts.append(((PIT_X + 38) * S, FLOOR * S))
    ImageDraw.Draw(lay).polygon(pts, fill=DIRT + (255,))
    put(p, lay)


def bench(p):
    lay = blank()
    d = ImageDraw.Draw(lay)
    x0, x1, y = BENCH
    d.rectangle([x0 * S, y * S, x1 * S, (y + 6) * S], fill=(104, 80, 60, 255))
    for lx in (x0 + 5, x1 - 11):
        d.rectangle([lx * S, (y + 6) * S, (lx + 6) * S, FLOOR * S], fill=(78, 60, 46, 255))
    put(p, lay)


def tether(p, hand, tension, alpha):
    """Tali ingatan dari tangan ke koper terkubur: kendur, kencang saat ditarik."""
    if alpha <= 0.01 or hand is None:
        return
    a, b = hand, (PIT_X, FLOOR + 4)
    sag = 26 * (1 - tension)
    pts = []
    for i in range(21):
        u = i / 20
        pts.append(((lerp(a[0], b[0], u)) * S, (lerp(a[1], b[1], u) + sag * 4 * u * (1 - u)) * S))
    lay = blank()
    ImageDraw.Draw(lay).line(pts, fill=(224, 120, 110, 255), width=int(1.6 * S))
    put(p, lay, alpha)


# ------------------------------------------------------------------ tokoh
def hero_A(t):
    x, moving, f = track(A_KEYS, t)
    hit = sum(pulse(t - m) for m in IMP_A)
    r = sum(ease((t - (m + 0.15)) / 1.0) for m in IMP_A)
    carrying = t < 3.85
    if carrying:
        face = "sad"
    elif hit > 0.05:
        face = "hit"
    elif r > 0.5:
        face = "sad"
    else:
        face = "calm" if 4.4 <= t < 6.0 else "hope"
    lean = 0.14 * (1 - ease((t - 3.8) / 0.5)) + 0.04 * r - 0.25 * hit
    arm = (25 if carrying else 35) + 25 * hit
    return dict(x=x + 18 * hit, walk=t * 7.5 if moving else None, f=f, face=face, lean=lean,
                head=0.1 * (1 if carrying else 0) + 0.12 * r, arm=arm,
                sit=ease((t - 9.6) / 0.8), hit=hit, r=r, carrying=carrying)


def draw_hero_A(t):
    h = hero_A(t)
    lay, _, hd = fig_layer(h["x"], FLOOR, WHITE, f=h["f"], walk=h["walk"], lean=h["lean"],
                           head=h["head"], arm_f=h["arm"], sit=h["sit"], face=h["face"])
    return h, lay, hd, base.LAST_HAND


def hero_B(t):
    x, moving, f = track(B_KEYS, t)
    if t < 3.8:
        arm = 25.0
    elif t < 4.6:
        arm = lerp(25, 75, ease((t - 3.8) / 0.8))
    elif t < 5.3:
        arm = lerp(75, 150, ease((t - 4.6) / 0.7))
    elif t < 6.2:
        arm = 150.0
    else:
        arm = lerp(150, 40, ease((t - 6.2) / 0.6))
    lean = 0.14 * (1 - ease((t - 3.9) / 0.8)) - 0.08 * math.sin(math.pi * clamp((t - 4.6) / 1.6))
    face = "happy" if t >= BURST else ("calm" if t >= 4.6 else "sad")
    return dict(x=x, walk=t * 9.5 if moving else None, f=f, face=face, lean=lean, arm=arm,
                head=0.1 if t < 4.6 else 0.0)


def draw_hero_B(t):
    h = hero_B(t)
    lay, _, hd = fig_layer(h["x"], FLOOR, WHITE, f=h["f"], walk=h["walk"], lean=h["lean"],
                           head=h["head"], arm_f=h["arm"], face=h["face"])
    return h, lay, hd, base.LAST_HAND


def hand_pt(hand, f=1):
    return (hand[0] + f * 3, hand[1] + 15)


# ------------------------------------------------------------------ panel
def panel_A(t):
    p = BG.copy()
    h, hero, hd, hand = draw_hero_A(t)
    pit(p)
    e = (0.3 * ease((t - IMP_A[0]) / 0.3) + 0.3 * ease((t - IMP_A[1]) / 0.3)
         + 0.4 * ease((t - IMP_A[2]) / 0.3))
    c = ease((t - 4.4) / 0.6)
    if t < 3.8:
        sp = hand_pt(hand, h["f"])
    elif t < 4.3:
        u = ease((t - 3.8) / 0.5)
        s0 = hand_pt(draw_hero_A(3.8)[3], 1)
        sp = (lerp(s0[0], PIT_X, u), lerp(s0[1], FLOOR + 6, u) - 40 * math.sin(math.pi * u))
    else:
        sp = (PIT_X, FLOOR + 6 - 19 * e)
    suitcase(p, sp[0], sp[1])
    mound(p, c * (1 - 0.85 * e))
    ta = ease((t - 4.8) / 0.4) * (1 - ease((t - 9.6) / 0.4))
    tension = max([pulse(t - m, 0.5) for m in IMP_A] + [0.0])
    tether(p, hand, tension, ta)
    put(p, hero)
    shock(p, PIT_X, FLOOR, t - 4.3, (170, 150, 120), rmax=50, dur=0.4)
    for m in IMP_A:
        shock(p, h["x"] + 8, 300, t - m, RED)
    fall = ease((t - (IMP_A[2] + 0.6)) / 0.9)
    if h["r"] > 0.15 and fall < 1:
        broken_heart(p, h["x"] - 4, hd[1] - 44, 1.0, h["r"], fall)
    if t > TEARS[0]:
        tears(p, hd, h["f"], t)
    rain(p, (h["r"] - 0.3) / 2.0, t)
    vignette(p, 0.75 * clamp(h["r"] / 3) + 0.35 * h["hit"])
    overlay(p, (200, 40, 55), 0.30 * sum(pulse(t - m, 0.35) for m in IMP_A))
    return p, 9 * h["hit"] * math.sin(t * 90), 5 * h["hit"] * math.cos(t * 77)


def panel_B(t):
    p = BG.copy()
    h, hero, hd, hand = draw_hero_B(t)
    glow = ease((t - 6.4) / 2.5) * 1.2 + 0.6 * pulse(t - BURST, 0.6)
    paste_glow(p, 600, 290, glow)
    bench(p)
    if t < 3.8:
        sp = hand_pt(hand, h["f"])
    elif t < 4.6:
        u = ease((t - 3.8) / 0.8)
        s0 = hand_pt(draw_hero_B(3.8)[3], 1)
        sp = (lerp(s0[0], SUIT_BENCH[0], u), lerp(s0[1], SUIT_BENCH[1], u) - 22 * math.sin(math.pi * u))
    else:
        sp = SUIT_BENCH
    suitcase(p, sp[0], sp[1])
    hu = ease((t - 7.0) / 0.5)
    if hu > 0:  # kenangan disimpan dengan hangat, bukan beban
        heart(p, SUIT_BENCH[0], FLOOR - 92 + 2 * math.sin(t * 4), 0.5 * (1 + 0.08 * math.sin(t * 5)), hu)
    ring_pulse(p, SUIT_BENCH[0], t - 4.6)
    put(p, hero)
    shock(p, h["x"] + 10, 300, t - BURST, (255, 214, 140), rmax=150, dur=0.8)
    sparks(p, h["x"] + 10, 290, t - BURST)
    for i in range(5):  # hati kecil melayang
        u = (t - (10.3 + 0.6 * i)) / 1.8
        if 0 <= u < 1:
            heart(p, 470 + 20 * i + 8 * math.sin(u * 6 + i), 210 - 80 * u, 0.36, math.sin(math.pi * u))
    overlay(p, (255, 205, 120), 0.28 * pulse(t - BURST, 0.5) + 0.06 * pulse(t - 4.6, 0.5))
    return p, 0.0, 0.0


# ------------------------------------------------------------------ frame
def render(t):
    fr = Image.new("RGB", (W, H), (0, 0, 0))
    d = ImageDraw.Draw(fr)
    dim = 1 - 0.65 * ease((t - 12.0) / 0.8)
    l1 = "MOVE ON BUKAN MELUPAKAN."
    n1 = int(len(l1) * clamp((t - 0.2) / 1.4) + 0.999)
    spaced(d, l1, W / 2, 84, F_TITLE, scale_col(WHITE, dim), nchars=n1)
    if t >= 10.0:
        l2 = "JANGAN KUBUR KENANGANNYA,"
        n2 = int(len(l2) * clamp((t - 10.0) / 1.3) + 0.999)
        spaced(d, l2, W / 2, 126, F_TITLE, scale_col(WHITE, dim), nchars=n2)

    fade_end = clamp((DUR - t) / 0.5)
    k = ease(t / 0.8) * lerp(1.0, 0.10, ease((t - 12.0) / 0.8)) * fade_end
    black = Image.new("RGB", (PW, PH), (0, 0, 0))
    pa = finish_panel(panel_A(t), "DIA YANG MENGUBUR", A_TEXT, t, BLUE)
    pb = finish_panel(panel_B(t), "DIA YANG MELETAKKAN", B_TEXT, t, (170, 180, 200), AMBER, BURST)
    fr.paste(Image.blend(black, pa, k), (PX, PYA))
    fr.paste(Image.blend(black, pb, k), (PX, PYB))

    pu = ease((t - 12.6) / 0.6) * fade_end
    if pu > 0:
        spaced_multi(d, [("LETAKKAN", AMBER)], W / 2, 600, F_PUNCH, alpha=pu)
        spaced_multi(d, [("BEBANNYA.", WHITE)], W / 2, 672, F_PUNCH, alpha=pu)
    su = ease((t - 14.6) / 0.8) * fade_end
    if su > 0:
        spaced(d, "KENANGAN BOLEH TINGGAL.", W / 2, 1000, F_SUB, scale_col(GREY, su), sp=2)
        spaced(d, "YANG DILEPAS HANYA BEBANNYA.", W / 2, 1038, F_SUB, scale_col(GREY, su), sp=2)
    fade = clamp(1 - t / 0.4)
    if fade > 0:
        fr = Image.blend(fr, Image.new("RGB", (W, H), (0, 0, 0)), fade)
    return fr


# ------------------------------------------------------------------ audio
def make_audio(path):
    sr = 44100
    n = int(sr * DUR)
    t = np.arange(n) / sr
    rs = np.random.RandomState(12)
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

    def steps(t0, dur, per=0.34, drag=False):
        tt = t0
        while tt < t0 + dur:
            add(tt, tone(95, 0.09, 0.05, 40))
            if drag:  # koper diseret
                add(tt + 0.05, lp(0.22, 0.05, 12) * np.linspace(1, 0, int(sr * 0.22)))
            tt += per

    def heartbeat(t0, amp=0.35, f=62):
        add(t0, tone(f, 0.18, amp, 22))
        add(t0 + 0.17, tone(f * 0.85, 0.2, amp * 0.7, 20))

    m = int(sr * (12.0 - IMP_A[0]))  # hujan
    add(IMP_A[0], lp(12.0 - IMP_A[0], 0.05, 6) * np.linspace(0, 1, m) ** 1.5)
    steps(2.0, 1.6, 0.46, drag=True)         # kedua tokoh menyeret koper
    add(3.8, sweep(500, 200, 0.5, 0.05))     # koper dilempar
    add(4.3, tone(58, 0.6, 0.7, 7))          # buk, jatuh ke lubang
    add(4.3, burst(0.25, 0.25))
    for i in range(6):                       # tanah menimbun
        add(4.4 + 0.1 * i, lp(0.12, 0.08, 10) * np.linspace(1, 0, int(sr * 0.12)))
    steps(5.0, 0.9, 0.3)
    steps(6.6, 0.8, 0.3)
    steps(8.0, 0.9, 0.3)
    for k, hh in enumerate(IMP_A):           # ---- ditarik kembali, kena
        add(hh - 0.1, sweep(180, 520, 0.2, 0.08))   # tali menegang
        add(hh, tone(52, 0.7, 0.7, 6))
        add(hh, burst(0.16, 0.22))
        add(hh, tone(2637, 0.25, 0.03, 18))
        add(hh, sweep(380, 150, 0.5, 0.1))
        add(hh + 0.05, tone(70, 0.5, 0.35, 9))      # koper menyembul
        add(hh + 0.05, lp(0.3, 0.09, 14) * np.linspace(1, 0, int(sr * 0.3)))
        heartbeat(hh + 0.45, 0.28 - 0.05 * k, 55)
        heartbeat(hh + 0.95, 0.2 - 0.04 * k, 52)
    steps(9.0, 0.6, 0.2, drag=True)
    for tt in TEARS:
        add(tt + 0.7, tone(1500, 0.12, 0.05, 30) * np.linspace(1, 0.4, int(sr * 0.12)))
    add(10.4, lp(0.9, 0.12, 30) * np.linspace(1, 0, int(sr * 0.9)))
    for i, fq in enumerate((440.0, 392.0, 329.6)):
        add(10.5 + i * 0.45, tone(fq, 1.6, 0.045, 2.6))
    # ---- angle B: meletakkan
    add(4.55, tone(310, 0.12, 0.2, 30))      # tok, koper diletakkan di bangku
    add(4.55, tone(120, 0.25, 0.25, 14))
    add(4.7, lp(0.9, 0.1, 30) * np.linspace(1, 0, int(sr * 0.9)))   # lega
    add(4.7, tone(880, 0.8, 0.04, 4))
    add(4.8, tone(1318, 0.7, 0.03, 5))
    add(7.0, tone(659.3, 1.2, 0.03, 3))      # hati kecil di atas koper
    m = int(sr * 3.0)                        # cahaya menyingsing
    x_ = np.arange(m) / sr
    add(6.4, 0.04 * np.sin(2 * np.pi * np.cumsum(220 + 120 * x_ / 3.0) / sr) * np.sin(np.linspace(0, np.pi, m)))
    steps(6.2, 3.0, 0.3)
    heartbeat(BURST - 0.5, 0.35, 66)
    heartbeat(BURST - 0.1, 0.38, 70)
    add(BURST, tone(110, 0.8, 0.35, 5))
    for i, fq in enumerate((1046.5, 1318.5, 1568.0, 2093.0, 2637.0)):
        add(BURST + 0.05 + i * 0.07, tone(fq, 1.0, 0.035, 4))
    for fq in (523.3, 659.3, 784.0):
        add(BURST + 0.2, tone(fq, 1.8, 0.05, 2.0))
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

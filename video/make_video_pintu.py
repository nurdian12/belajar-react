#!/usr/bin/env python3
"""Video animasi stickman dua angle: "Yang pergi membuka pintu."
Topik: percintaan / ditinggal. 720x1280 (9:16), 24 fps, 20 detik, SFX sintetis.

Angle A (panel atas)  : DIA YANG MENAHAN PINTU -> menahan yang pergi, pintu membanting.
Angle B (panel bawah) : DIA YANG MELIHAT JALAN -> melepas, berbalik, menemukan pintu lain.

Memakai helper dari make_video_penolakan.py (gambar tokoh, efek emosi, teks).
Pakai: python3 video/make_video_pintu.py [output.mp4]
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
    PYB, RED, S, SIL, W, WHITE, blank, broken_heart, clamp, ease, fig_layer, finish_panel,
    heart, lerp, lerp_col, mini_hearts, overlay, paste_glow, pulse, put, rain, scale_col,
    shock, sparks, spaced, spaced_multi, tears, vignette)

DUR = 20.0
OUT = sys.argv[1] if len(sys.argv) > 1 else os.path.join(
    os.path.dirname(os.path.abspath(__file__)), "pintu-membuka-jalan.mp4")

DOOR = (490, 60, 215)              # hinge x, lebar, atas (pintu kanan)
DOOR2 = (30, 50, 215)              # pintu baru di kiri (angle B)
IMP_A = [4.7, 6.3, 8.5]            # momen "kena" di angle A
BURST = 9.8                        # bertemu yang baru di angle B
TEARS = [9.3 + 0.55 * i + 0.13 * (i % 3) for i in range(7)]
base.TEARS[:] = TEARS              # tears() dari modul dasar membaca daftar ini
GLOW_PTS = [70 + 36 * i for i in range(8)]   # batu pijakan cahaya di angle B


# ------------------------------------------------------------------ pintu
def door(p, spec, theta, tint=(255, 208, 130)):
    hx, w, top = spec
    s = math.sin(math.radians(theta))
    c = math.cos(math.radians(theta))
    lay = blank()
    d = ImageDraw.Draw(lay)
    if s > 0.05:  # cahaya tumpah ke lantai
        d.polygon([(hx * S, FLOOR * S), ((hx + w) * S, FLOOR * S),
                   ((hx + w - 60 - 110 * s) * S, (PH - 2) * S), ((hx - 60 - 110 * s) * S, (PH - 2) * S)],
                  fill=tint + (int(70 * s),))
    d.rectangle([hx * S, top * S, (hx + w) * S, FLOOR * S], fill=lerp_col((10, 12, 22), tint, s) + (255,))
    x2 = hx + w * c
    ty, by = top + 16 * s, FLOOR - 5 * s
    d.polygon([(hx * S, top * S), (x2 * S, ty * S), (x2 * S, by * S), (hx * S, FLOOR * S)],
              fill=(112, 84, 60, 255))
    d.line([(x2 * S, ty * S), (x2 * S, by * S)], fill=(160, 128, 96, 255), width=2 * S)
    if c > 0.4:
        mid = (ty + by) / 2 + 6
        d.ellipse([(x2 - 8 * c) * S, (mid - 2) * S, (x2 - 4 * c) * S, (mid + 2) * S], fill=AMBER + (255,))
    d.rectangle([hx * S, top * S, (hx + w) * S, FLOOR * S], outline=(70, 74, 98, 255), width=3 * S)
    put(p, lay)
    return x2


def theta_A(t):
    if t < 5.0:
        return 70.0
    if t < 6.2:
        return lerp(70, 25, ease((t - 5.0) / 1.2))
    if t < 8.4:
        return 25 + 1.4 * math.sin(t * 26)
    return lerp(25, 0, ease((t - 8.4) / 0.12))


def theta_B(t):
    if t < 5.0:
        return 70.0
    if t < 6.2:
        return lerp(70, 25, ease((t - 5.0) / 1.2))
    return lerp(25, 0, ease((t - 6.4) / 0.8))


# ------------------------------------------------------------------ tokoh
def sil_state(t):
    """Yang pergi: jalan ke pintu, menoleh, lalu masuk ke cahaya. -> (x, f, alpha, walk)."""
    f, walk, al = 1, None, 1.0
    if t < 2.0:
        x = 190
    elif t < 4.0:
        x = lerp(190, 470, ease((t - 2.0) / 2.0))
        walk = t * 9.5
    elif t < 4.5:
        x = 470
        f = -1 if t > 4.1 else 1
    else:
        x = lerp(470, 520, ease((t - 4.5) / 0.7))
        if t < 5.2:
            walk = t * 9.5
        al = 1 - clamp((t - 4.8) / 0.5)
    return x, f, al, walk


def hero_A(t):
    walk, arm, lean = None, 70.0, 0.0
    if t < 2.0:
        x = 120.0
    elif t < 3.6:
        x = lerp(120, 330, ease((t - 2.0) / 1.6))
        walk = t * 9.5
    elif t < 5.2:
        x = 330.0
        arm = 70 + 15 * ease((t - 3.8) / 0.6)
    elif t < 6.4:
        x = lerp(330, 455, ease((t - 5.2) / 1.2))
        walk, arm = t * 14, 85.0
    else:
        x, arm = 455.0, 88.0
    if 6.4 <= t < 8.4:
        lean = -0.18 + 0.04 * math.sin(t * 28)
    hit = sum(pulse(t - m) for m in IMP_A)
    r = sum(ease((t - (m + 0.15)) / 1.0) for m in IMP_A)
    sit = ease((t - 9.4) / 0.8)
    return x - 16 * hit, walk, arm, lean, hit, r, sit


def hero_B(t):
    walk, f, arm = None, 1, 70.0
    if t < 2.0:
        x = 120.0
    elif t < 3.6:
        x = lerp(120, 330, ease((t - 2.0) / 1.6))
        walk = t * 9.5
    else:
        x = 330.0
        if t < 5.2:
            arm = 70 + 15 * ease((t - 3.8) / 0.6)
        else:
            arm = lerp(85, 40, ease((t - 5.4) / 0.6))
    if t >= 6.4:
        f = -1
    if t >= 7.0:
        u = ease((t - 7.0) / 2.6)
        x = lerp(330, 200, u)
        walk = t * 9.5 if u < 1 else None
        arm = lerp(40, 66, ease((t - 7.0) / 1.0))
    return x, f, walk, arm


A_TEXT = [(0.0, ""), (2.1, "TUNGGU..."), (4.7, "KENAPA PERGI?"),
          (6.4, "AKU TAHAN PINTUNYA."), (8.5, "TETAP TERTUTUP."), (10.4, "MASIH DI AMBANG.")]
B_TEXT = [(0.0, ""), (2.1, "DIA MAU PERGI."), (5.4, "LEPASKAN TANGANNYA."),
          (7.0, "PINTU INI SELESAI."), (8.2, "ADA PINTU LAIN."), (9.8, "TERANG BERDUA.")]


# ------------------------------------------------------------------ panel
def panel_A(t):
    p = BG.copy()
    x, walk, arm, lean, hit, r, sit = hero_A(t)
    door(p, DOOR, theta_A(t))
    face = "hit" if hit > 0.05 else ("sad" if r > 0.5 else "hope")
    hero, lamp, hd = fig_layer(x, FLOOR, WHITE, f=1, walk=walk, lean=lean + 0.04 * r - 0.25 * hit,
                               head=0.12 * r, arm_f=arm + 25 * hit, sit=sit,
                               lamp=(255, 214, 120), face=face)
    paste_glow(p, lamp[0], lamp[1], lerp(1.0, 0.18, r / 3) * (1 - 0.75 * min(1.0, hit * 1.6)))
    sx, sf, sal, sw = sil_state(t)
    if sal > 0.01:
        lay, _, _ = fig_layer(sx, FLOOR, SIL, f=sf, walk=sw, arm_f=15, arm_b=-8)
        put(p, lay, sal)
    put(p, hero)
    for m in IMP_A:
        shock(p, x + 8, 300, t - m, RED)
    shock(p, 520, 300, t - 8.45, (240, 240, 255), rmax=70, dur=0.4)
    if r > 0.15 and ease((t - (IMP_A[2] + 0.6)) / 0.9) < 1:
        broken_heart(p, x - 4, hd[1] - 44, 1.0, r, ease((t - (IMP_A[2] + 0.6)) / 0.9))
    if t > TEARS[0]:
        tears(p, hd, 1, t)
    rain(p, (r - 0.3) / 2.0, t)
    vignette(p, 0.75 * clamp(r / 3) + 0.35 * hit)
    overlay(p, (200, 40, 55), 0.30 * sum(pulse(t - m, 0.35) for m in IMP_A))
    return p, 9 * hit * math.sin(t * 90), 5 * hit * math.cos(t * 77)


def panel_B(t):
    p = BG.copy()
    close = ease((t - (BURST - 0.4)) / 0.8)
    happy = t >= BURST
    door(p, DOOR, theta_B(t))
    door(p, DOOR2, 70 * ease((t - 7.0) / 1.0))
    lay = blank()
    d = ImageDraw.Draw(lay)
    for i, gx in enumerate(GLOW_PTS):  # jalan setapak cahaya menuju pintu baru
        k = ease((t - (7.2 + 0.1 * i)) / 0.3)
        if k > 0:
            d.ellipse([(gx - 20) * S, (FLOOR + 6 - 4) * S, (gx + 20) * S, (FLOOR + 6 + 4) * S],
                      fill=AMBER + (int(200 * k),))
    put(p, lay)
    hx, hf, hw, harm = hero_B(t)
    face = "happy" if happy else ("calm" if t >= 5.6 else "hope")
    hero, lamp, hd = fig_layer(hx, FLOOR, WHITE, f=hf, walk=hw, arm_f=harm, lamp=(255, 214, 120), face=face)
    paste_glow(p, lamp[0], lamp[1], 1.0 + 0.7 * close + 0.5 * pulse(t - BURST, 0.6))
    sx, sf, sal, sw = sil_state(t)
    if sal > 0.01:
        lay2, _, _ = fig_layer(sx, FLOOR, SIL, f=sf, walk=sw, arm_f=15, arm_b=-8)
        put(p, lay2, sal)
    if t >= 8.1:  # yang baru keluar dari pintu kiri
        nx = lerp(55, 120, ease((t - 8.2) / 1.1))
        nw = t * 9.5 if t < 9.3 else None
        lay3, _, _ = fig_layer(nx, FLOOR, lerp_col(SIL, (232, 232, 240), close), f=1, walk=nw,
                               arm_f=15, arm_b=-8, face="happy" if happy else None)
        put(p, lay3, ease((t - 8.1) / 0.3))
    put(p, hero)
    shock(p, 160, 300, t - BURST, (255, 214, 140), rmax=150, dur=0.8)
    sparks(p, 160, 290, t - BURST)
    hu = ease((t - (BURST + 0.2)) / 0.5)
    if hu > 0:
        heart(p, 160, 160 + 3 * math.sin(t * 5), 0.85 * (1 + 0.14 * abs(math.sin(t * 6))), hu)
    mini_hearts(p, t)
    soft = pulse(t - 7.2, 0.5)  # klik pintu menutup, lembut
    overlay(p, (255, 205, 120), 0.28 * pulse(t - BURST, 0.5) + 0.08 * soft)
    return p, 0.0, 0.0


# ------------------------------------------------------------------ frame
def render(t):
    fr = Image.new("RGB", (W, H), (0, 0, 0))
    d = ImageDraw.Draw(fr)
    dim = 1 - 0.65 * ease((t - 12.0) / 0.8)
    l1 = "YANG PERGI MEMBUKA PINTU."
    n1 = int(len(l1) * clamp((t - 0.2) / 1.4) + 0.999)
    spaced(d, l1, W / 2, 84, F_TITLE, scale_col(WHITE, dim), nchars=n1)
    if t >= 10.0:
        l2 = "JANGAN TAHAN DI AMBANG,"
        n2 = int(len(l2) * clamp((t - 10.0) / 1.3) + 0.999)
        spaced(d, l2, W / 2, 126, F_TITLE, scale_col(WHITE, dim), nchars=n2)

    fade_end = clamp((DUR - t) / 0.5)
    k = ease(t / 0.8) * lerp(1.0, 0.10, ease((t - 12.0) / 0.8)) * fade_end
    black = Image.new("RGB", (PW, PH), (0, 0, 0))
    pa = finish_panel(panel_A(t), "DIA YANG MENAHAN PINTU", A_TEXT, t, BLUE)
    pb = finish_panel(panel_B(t), "DIA YANG MELIHAT JALAN", B_TEXT, t, (170, 180, 200), AMBER, 9.8)
    fr.paste(Image.blend(black, pa, k), (PX, PYA))
    fr.paste(Image.blend(black, pb, k), (PX, PYB))

    pu = ease((t - 12.6) / 0.6) * fade_end
    if pu > 0:
        spaced_multi(d, [("MELANGKAHLAH", AMBER)], W / 2, 600, F_PUNCH, alpha=pu)
        spaced_multi(d, [("KE JALAN BARU.", WHITE)], W / 2, 672, F_PUNCH, alpha=pu)
    su = ease((t - 14.6) / 0.8) * fade_end
    if su > 0:
        spaced(d, "YANG PERGI TIDAK MENUTUP HIDUPMU.", W / 2, 1000, F_SUB, scale_col(GREY, su), sp=2)
        spaced(d, "DIA MEMBUKA RUANG UNTUK YANG BARU.", W / 2, 1038, F_SUB, scale_col(GREY, su), sp=2)
    fade = clamp(1 - t / 0.4)
    if fade > 0:
        fr = Image.blend(fr, Image.new("RGB", (W, H), (0, 0, 0)), fade)
    return fr


# ------------------------------------------------------------------ audio
def make_audio(path):
    sr = 44100
    n = int(sr * DUR)
    t = np.arange(n) / sr
    rs = np.random.RandomState(9)
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

    def heartbeat(t0, amp=0.35, f=62):
        add(t0, tone(f, 0.18, amp, 22))
        add(t0 + 0.17, tone(f * 0.85, 0.2, amp * 0.7, 20))

    def creak(t0, dur, amp):
        m = int(sr * dur)
        f = 150 + 60 * np.sin(np.linspace(0, 9, m)) + np.linspace(0, -40, m)
        ph = 2 * np.pi * np.cumsum(f) / sr
        sig = np.sin(ph) + 0.5 * np.sin(2 * ph) + 0.25 * np.sin(3 * ph)
        add(t0, amp * sig * (0.6 + 0.4 * rs.rand(m)) * np.sin(np.linspace(0, np.pi, m)))

    m = int(sr * (12.0 - 4.7))  # hujan makin deras setelah ditinggal
    add(4.7, lp(12.0 - 4.7, 0.05, 6) * np.linspace(0, 1, m) ** 1.5)
    steps(2.0, 1.6)                      # tokoh A / B mendekat
    steps(2.0, 2.0)                      # yang pergi jalan ke pintu
    steps(4.5, 0.7)
    steps(5.2, 1.2, 0.24)                # A berlari ke pintu
    creak(5.0, 1.3, 0.05)                # pintu mulai menutup
    for k, h in enumerate(IMP_A):        # ---- kena di angle A
        add(h, tone(52, 0.7, 0.7, 6))
        add(h, burst(0.16, 0.22))
        add(h, tone(2637, 0.25, 0.03, 18))
        add(h, sweep(380, 150, 0.5, 0.1))
        heartbeat(h + 0.45, 0.28 - 0.05 * k, 55)
        heartbeat(h + 0.95, 0.2 - 0.04 * k, 52)
    creak(6.4, 2.0, 0.035)               # pintu ditarik-tahan
    add(8.4, tone(42, 1.0, 0.95, 5))     # BRAK, pintu membanting
    add(8.4, burst(0.35, 0.4))
    add(8.4, tone(220, 0.25, 0.2, 25))
    for tt in TEARS:
        add(tt + 0.7, tone(1500, 0.12, 0.05, 30) * np.linspace(1, 0.4, int(sr * 0.12)))
    add(10.4, lp(0.9, 0.12, 30) * np.linspace(1, 0, int(sr * 0.9)))
    for i, fq in enumerate((440.0, 392.0, 329.6)):
        add(10.5 + i * 0.45, tone(fq, 1.6, 0.045, 2.6))
    # ---- angle B: melepas dengan tenang
    add(6.4, tone(1200, 0.06, 0.05, 60))     # klik pintu menutup lembut
    add(6.4, tone(80, 0.3, 0.2, 12))
    for i in range(len(GLOW_PTS)):           # jalan cahaya menyala
        add(7.2 + 0.1 * i, tone(900 + 70 * i, 0.3, 0.025, 12))
    add(7.0, sweep(300, 760, 1.0, 0.05))     # pintu baru terbuka, hangat
    steps(7.0, 2.6)
    steps(8.2, 1.1)
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

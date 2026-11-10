#!/usr/bin/env python3
"""Video animasi stickman dua angle: "Jangan minta dicintai, jadilah rumahnya."
Topik: percintaan / jadi pribadi yang hangat. 720x1280 (9:16), 24 fps, 20 detik, SFX sintetis.

Angle A (panel atas)  : DIA YANG MENGETUK    -> mengetuk rumah orang di tengah hujan, tak dibukakan.
Angle B (panel bawah) : DIA YANG JADI RUMAH  -> menyalakan lampu rumahnya sendiri, ada yang singgah.

Memakai helper dari make_video_penolakan.py (gambar tokoh, efek emosi, teks).
Pakai: python3 video/make_video_rumah.py [output.mp4]
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
    AMBER, BG, BLUE, FLOOR, FPS, F_PUNCH, F_SUB, F_TITLE, GREY, H, PH, PW, PX, PYA, PYB, RED,
    S, SIL, W, WHITE, blank, broken_heart, clamp, ease, fig_layer, finish_panel, heart, lerp,
    lerp_col, overlay, paste_glow, pulse, put, rain, ring_pulse, scale_col, shock, sparks,
    spaced, spaced_multi, tears, vignette)

DUR = 20.0
OUT = sys.argv[1] if len(sys.argv) > 1 else os.path.join(
    os.path.dirname(os.path.abspath(__file__)), "jadilah-rumah.mp4")

HOUSE_A = 470                      # rumah orang lain (angle A)
HOUSE_B = 330                      # rumah sendiri (angle B)
IMP_A = [4.9, 6.8, 8.8]            # momen "kena": lampu mati, pintu menutup, beranda gelap
KNOCKS = [3.6, 3.9, 4.2, 5.4, 5.6, 5.8, 6.0, 6.2, 6.4, 7.6, 7.8, 8.0, 8.2, 8.4, 8.6]
BURST = 9.2                        # bertemu di beranda (angle B)
TEARS = [9.9 + 0.55 * i + 0.13 * (i % 3) for i in range(6)]
base.TEARS[:] = TEARS

A_KEYS = [(0, 130), (2.0, 130), (3.3, 452), (9.0, 452), (9.7, 432), (20, 432)]
B_KEYS = [(0, 130), (2.0, 130), (3.2, 255), (7.4, 255), (8.2, 300), (20, 300)]
WAND_KEYS = [(0, 760), (5.0, 760), (6.2, 430), (7.4, 430), (8.8, 352), (20, 352)]

A_TEXT = [(0.0, ""), (2.1, "PERMISI..."), (3.6, "BOLEH MASUK?"), (4.9, "LAMPUNYA MATI."),
          (6.8, "TETAP TIDAK DIBUKA."), (8.8, "KEDINGINAN."), (10.4, "MASIH DI LUAR.")]
B_TEXT = [(0.0, ""), (2.1, "TIDAK MENGETUK."), (3.4, "NYALAKAN LAMPUMU."),
          (4.6, "BUKA PINTUNYA."), (5.8, "ADA YANG MENDEKAT."), (8.0, "SILAKAN MASUK."),
          (9.2, "HANGAT BERDUA.")]


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


# ------------------------------------------------------------------ benda
def house(p, cx, win, door_open, porch):
    lay = blank()
    d = ImageDraw.Draw(lay)
    # badan dan atap
    d.rectangle([(cx - 60) * S, (FLOOR - 100) * S, (cx + 60) * S, FLOOR * S],
                fill=(28, 32, 48, 255), outline=(54, 60, 84, 255), width=2 * S)
    d.polygon([((cx - 72) * S, (FLOOR - 100) * S), (cx * S, (FLOOR - 150) * S),
               ((cx + 72) * S, (FLOOR - 100) * S)], fill=(46, 38, 54, 255))
    # jendela
    wc = lerp_col((14, 16, 26), (255, 212, 130), win)
    d.rectangle([(cx - 46) * S, (FLOOR - 76) * S, (cx - 16) * S, (FLOOR - 46) * S], fill=wc + (255,),
                outline=(70, 76, 100, 255), width=2 * S)
    d.line([((cx - 31) * S, (FLOOR - 76) * S), ((cx - 31) * S, (FLOOR - 46) * S)],
           fill=(40, 44, 64, 255), width=S)
    d.line([((cx - 46) * S, (FLOOR - 61) * S), ((cx - 16) * S, (FLOOR - 61) * S)],
           fill=(40, 44, 64, 255), width=S)
    # pintu
    dl, dw = cx + 8, 28
    d.rectangle([dl * S, (FLOOR - 62) * S, (dl + dw) * S, FLOOR * S],
                fill=lerp_col((14, 16, 26), (255, 200, 120), door_open) + (255,))
    lw = dw * (1 - 0.85 * door_open)
    d.rectangle([dl * S, (FLOOR - 62) * S, (dl + lw) * S, FLOOR * S], fill=(112, 84, 60, 255),
                outline=(150, 118, 88, 255), width=S)
    if door_open < 0.5:
        d.ellipse([(dl + lw - 6) * S, (FLOOR - 30) * S, (dl + lw - 2) * S, (FLOOR - 26) * S],
                  fill=AMBER + (255,))
    d.rectangle([(cx + 4) * S, (FLOOR - 4) * S, (cx + 40) * S, FLOOR * S], fill=(70, 70, 82, 255))
    # lampu beranda
    d.ellipse([(cx + 18) * S, (FLOOR - 76) * S, (cx + 26) * S, (FLOOR - 68) * S],
              fill=lerp_col((50, 50, 60), (255, 214, 130), porch) + (255,))
    put(p, lay)
    if win > 0.02:
        paste_glow(p, cx - 31, FLOOR - 61, 0.6 * win)
    if porch > 0.02:
        paste_glow(p, cx + 22, FLOOR - 72, 0.55 * porch)
    if door_open > 0.05:
        paste_glow(p, cx + 22, FLOOR - 30, 0.5 * door_open)


def lantern(p, x, y):
    lay = blank()
    d = ImageDraw.Draw(lay)
    d.rectangle([(x - 4.5) * S, (y - 6) * S, (x + 4.5) * S, (y + 6) * S], fill=(255, 214, 120, 255))
    d.rectangle([(x - 3) * S, (y - 9) * S, (x + 3) * S, (y - 6) * S], outline=(120, 100, 60, 255), width=S)
    put(p, lay)


# ------------------------------------------------------------------ tokoh
def hero_A(t):
    x, moving, f = track(A_KEYS, t)
    hit = sum(pulse(t - m) for m in IMP_A)
    r = sum(ease((t - (m + 0.15)) / 1.0) for m in IMP_A)
    knocking = any(k - 0.05 <= t < k + 0.2 for k in KNOCKS)
    arm = 40.0
    if t >= 3.3:
        arm = 78.0
        for k in KNOCKS:
            arm += 16 * pulse(t - k, 0.25)
    face = "hit" if hit > 0.05 else ("sad" if r > 0.5 else "hope")
    return dict(x=x - 16 * hit, f=f, walk=t * 9.5 if moving else None, arm=arm + 25 * hit, hit=hit,
                r=r, face=face, sit=ease((t - 9.3) / 0.8), lean=0.04 * r - 0.25 * hit + (0.05 if knocking else 0))


def win_A(t):
    return 1.0 if 4.2 <= t < 4.9 else 0.0


def door_A(t):
    return 0.25 * math.sin(math.pi * clamp((t - 6.5) / 0.7))


def porch_A(t):
    if t < 8.5:
        return 0.6
    if t < 8.8:
        return 0.6 if int(t * 20) % 2 else 0.1
    return 0.0


def hero_B(t):
    x, moving, f = track(B_KEYS, t)
    if t < 3.4:
        arm = 25.0
    elif t < 4.0:
        arm = lerp(25, 80, ease((t - 3.4) / 0.6))
    elif t < 4.6:
        arm = lerp(80, 30, ease((t - 4.0) / 0.6))
    elif t < 5.3:
        arm = lerp(30, 100, ease((t - 4.6) / 0.7))
    elif t < 6.2:
        arm = 100.0
    elif t < 7.4:
        arm = 140 + 18 * math.sin(t * 9)
    elif t < 8.2:
        arm = 90.0
    else:
        arm = 40.0
    face = "happy" if t >= BURST else ("calm" if t >= 4.6 else "hope")
    return dict(x=x, f=f, walk=t * 9.5 if moving else None, arm=arm, face=face)


# ------------------------------------------------------------------ panel
def panel_A(t):
    p = BG.copy()
    h = hero_A(t)
    door_x = HOUSE_A + 22
    house(p, HOUSE_A, win_A(t), door_A(t), porch_A(t))
    hero, lamp, hd = fig_layer(h["x"], FLOOR, WHITE, f=h["f"], walk=h["walk"], lean=h["lean"],
                               head=0.12 * h["r"], arm_f=h["arm"], sit=h["sit"], lamp=(255, 214, 120),
                               face=h["face"])
    paste_glow(p, lamp[0], lamp[1], lerp(1.0, 0.18, h["r"] / 3) * (1 - 0.75 * min(1.0, h["hit"] * 1.6)))
    put(p, hero)
    for k in KNOCKS:
        shock(p, door_x - 8, FLOOR - 36, t - k, (215, 215, 232), rmax=22, dur=0.25)
    for m in IMP_A:
        shock(p, h["x"] + 8, 300, t - m, RED)
    fall = ease((t - (IMP_A[2] + 0.6)) / 0.9)
    if h["r"] > 0.15 and fall < 1:
        broken_heart(p, h["x"] - 4, hd[1] - 44, 1.0, h["r"], fall)
    if t > TEARS[0]:
        tears(p, hd, h["f"], t)
    rain(p, 0.5 + h["r"] / 2.0, t)
    vignette(p, 0.75 * clamp(h["r"] / 3) + 0.35 * h["hit"])
    overlay(p, (200, 40, 55), 0.30 * sum(pulse(t - m, 0.35) for m in IMP_A))
    return p, 9 * h["hit"] * math.sin(t * 90), 5 * h["hit"] * math.cos(t * 77)


def panel_B(t):
    p = BG.copy()
    h = hero_B(t)
    win = ease((t - 3.9) / 0.4)
    house(p, HOUSE_B, win, ease((t - 4.6) / 0.6), ease((t - 4.2) / 0.4))
    hero, _, hd = fig_layer(h["x"], FLOOR, WHITE, f=h["f"], walk=h["walk"], arm_f=h["arm"], face=h["face"])
    hand = base.LAST_HAND
    win_pos = (HOUSE_B - 31, FLOOR - 58)
    if t < 3.4:
        lp = (hand[0] + 3, hand[1] + 15)
        paste_glow(p, lp[0], lp[1], 1.0)
    elif t < 4.0:
        u = ease((t - 3.4) / 0.6)
        lp = (lerp(hand[0] + 3, win_pos[0], u), lerp(hand[1] + 15, win_pos[1], u) - 14 * math.sin(math.pi * u))
        paste_glow(p, lp[0], lp[1], 1.0)
    else:
        lp = win_pos
    lantern(p, lp[0], lp[1])
    put(p, hero)
    # yang singgah
    wx, wmov, _ = track(WAND_KEYS, t)
    if t >= 5.0:
        close = ease((t - 8.8) / 0.6)
        lean = 0.12 * (1 - close)
        lay, _, _ = fig_layer(wx, FLOOR, lerp_col(SIL, (232, 232, 240), close), f=-1,
                              walk=t * 8 if wmov else None, lean=lean, head=0.1 * (1 - close),
                              arm_f=15, arm_b=-8, face="happy" if t >= BURST else None)
        put(p, lay, ease((t - 5.0) / 0.4))
    ring_pulse(p, HOUSE_B + 8, t - 4.6)
    shock(p, 322, 300, t - BURST, (255, 214, 140), rmax=150, dur=0.8)
    sparks(p, 322, 290, t - BURST)
    hu = ease((t - (BURST + 0.2)) / 0.5)
    if hu > 0:
        heart(p, 322, 160 + 3 * math.sin(t * 5), 0.85 * (1 + 0.14 * abs(math.sin(t * 6))), hu)
    for i in range(5):
        u = (t - (10.3 + 0.6 * i)) / 1.8
        if 0 <= u < 1:
            heart(p, 290 + 22 * i + 8 * math.sin(u * 6 + i), 200 - 80 * u, 0.36, math.sin(math.pi * u))
    rain(p, 0.6 * (1 - ease((t - 8.2) / 0.8)), t)
    overlay(p, (255, 205, 120), 0.28 * pulse(t - BURST, 0.5) + 0.06 * pulse(t - 4.6, 0.5))
    return p, 0.0, 0.0


# ------------------------------------------------------------------ frame
def render(t):
    fr = Image.new("RGB", (W, H), (0, 0, 0))
    d = ImageDraw.Draw(fr)
    dim = 1 - 0.65 * ease((t - 12.0) / 0.8)
    l1 = "JANGAN MINTA DICINTAI,"
    n1 = int(len(l1) * clamp((t - 0.2) / 1.4) + 0.999)
    spaced(d, l1, W / 2, 84, F_TITLE, scale_col(WHITE, dim), nchars=n1)
    if t >= 10.0:
        l2 = "JANGAN MENGETUK PINTU ORANG,"
        n2 = int(len(l2) * clamp((t - 10.0) / 1.3) + 0.999)
        spaced(d, l2, W / 2, 126, F_TITLE, scale_col(WHITE, dim), nchars=n2)

    fade_end = clamp((DUR - t) / 0.5)
    k = ease(t / 0.8) * lerp(1.0, 0.10, ease((t - 12.0) / 0.8)) * fade_end
    black = Image.new("RGB", (PW, PH), (0, 0, 0))
    pa = finish_panel(panel_A(t), "DIA YANG MENGETUK", A_TEXT, t, BLUE)
    pb = finish_panel(panel_B(t), "DIA YANG JADI RUMAH", B_TEXT, t, (170, 180, 200), AMBER, BURST)
    fr.paste(Image.blend(black, pa, k), (PX, PYA))
    fr.paste(Image.blend(black, pb, k), (PX, PYB))

    pu = ease((t - 12.6) / 0.6) * fade_end
    if pu > 0:
        spaced_multi(d, [("JADILAH", AMBER)], W / 2, 600, F_PUNCH, alpha=pu)
        spaced_multi(d, [("RUMAHNYA.", WHITE)], W / 2, 672, F_PUNCH, alpha=pu)
    su = ease((t - 14.6) / 0.8) * fade_end
    if su > 0:
        spaced(d, "YANG LELAH AKAN SINGGAH", W / 2, 1000, F_SUB, scale_col(GREY, su), sp=2)
        spaced(d, "DI TEMPAT YANG HANGAT.", W / 2, 1038, F_SUB, scale_col(GREY, su), sp=2)
    fade = clamp(1 - t / 0.4)
    if fade > 0:
        fr = Image.blend(fr, Image.new("RGB", (W, H), (0, 0, 0)), fade)
    return fr


# ------------------------------------------------------------------ audio
def make_audio(path):
    sr = 44100
    n = int(sr * DUR)
    t = np.arange(n) / sr
    rs = np.random.RandomState(21)
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

    m = int(sr * 18.0)  # hujan sepanjang video, makin deras di angle A, mereda di akhir
    env = np.clip(np.linspace(0.4, 1.0, m), 0, 1) * (1 - np.clip((np.arange(m) / sr - 8.2) / 0.8, 0, 0.55))
    add(0.0, lp(18.0, 0.05, 6) * env)
    steps(2.0, 1.3)
    for k in KNOCKS:                          # ketukan
        add(k, tone(190, 0.1, 0.22, 30))
        add(k, burst(0.05, 0.12))
    add(4.2, tone(1046, 0.5, 0.025, 6))      # lampu jendela menyala sesaat
    add(4.9, tone(2200, 0.04, 0.12, 80))      # klik mati
    creak(6.5, 0.7, 0.04)                    # pintu terbuka sedikit
    add(7.1, tone(70, 0.4, 0.4, 12))          # lalu menutup
    for tt in (8.5, 8.6, 8.7, 8.75):          # lampu beranda berkedip
        add(tt, tone(1800, 0.03, 0.05, 90))
    for k, hh in enumerate(IMP_A):            # kena di angle A
        add(hh, tone(52, 0.7, 0.7, 6))
        add(hh, burst(0.16, 0.22))
        add(hh, tone(2637, 0.25, 0.03, 18))
        add(hh, sweep(380, 150, 0.5, 0.1))
        heartbeat(hh + 0.45, 0.28 - 0.05 * k, 55)
        heartbeat(hh + 0.95, 0.2 - 0.04 * k, 52)
    for tt in TEARS:
        add(tt + 0.7, tone(1500, 0.12, 0.05, 30) * np.linspace(1, 0.4, int(sr * 0.12)))
    add(10.4, lp(0.9, 0.12, 30) * np.linspace(1, 0, int(sr * 0.9)))
    for i, fq in enumerate((440.0, 392.0, 329.6)):
        add(10.5 + i * 0.45, tone(fq, 1.6, 0.045, 2.6))
    # ---- angle B: jadi rumah
    add(3.45, sweep(300, 620, 0.5, 0.04))     # lentera dibawa ke jendela
    add(4.0, tone(1318, 0.15, 0.05, 25))      # tink, ditaruh
    add(4.0, tone(880, 1.2, 0.04, 3))         # jendela menyala hangat
    add(4.2, tone(1568, 0.5, 0.02, 6))        # lampu beranda
    creak(4.6, 0.8, 0.03)                     # pintu dibuka
    add(4.7, tone(523.3, 1.5, 0.04, 2.5))
    add(4.7, tone(659.3, 1.5, 0.035, 2.5))
    steps(5.0, 1.3, 0.5)                      # yang singgah mendekat
    add(6.4, tone(1046, 0.4, 0.03, 6))        # sapaan
    steps(7.4, 1.5, 0.5)
    steps(7.4, 0.8, 0.34)
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

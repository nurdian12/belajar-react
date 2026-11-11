#!/usr/bin/env python3
"""Video animasi stickman dua angle: "Kesepian bukan tanda kamu kurang."
Topik: percintaan / kesepian. 720x1280 (9:16), 24 fps, 20 detik, SFX sintetis.

Angle A (panel atas)  : DIA YANG MENGISI KOSONG -> gelas bocor diisi orang lain, selalu habis lagi.
Angle B (panel bawah) : DIA YANG MENEMANI DIRI  -> mengisi gelas sendiri sampai penuh, baru berbagi.

Memakai helper dari make_video_penolakan.py (gambar tokoh, efek emosi, teks).
Pakai: python3 video/make_video_gelas.py [output.mp4]
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
    lerp_col, overlay, paste_glow, pulse, put, scale_col, shock, sparks, spaced, spaced_multi,
    tears, vignette)

DUR = 20.0
OUT = sys.argv[1] if len(sys.argv) > 1 else os.path.join(
    os.path.dirname(os.path.abspath(__file__)), "kesepian-gelas.mp4")

WATER_A = (120, 170, 255)          # air pemberian orang (dingin)
WATER_B = (255, 196, 90)           # air dari diri sendiri (hangat)
HERO_A_X = 300
GS = 1.6                           # skala gelas
DON_S = [2.0, 4.3, 6.6]            # awal tiap donor (angle A)
IMP_A = [s + 2.5 for s in DON_S]   # momen "kena": air habis lagi
BURST = 9.4
HERO_B_X, TABLE_X = 240, 170
VIS_X = 345
TEARS = [10.3 + 0.55 * i + 0.13 * (i % 3) for i in range(6)]
base.TEARS[:] = TEARS
VIS_KEYS = [(0, 760), (5.6, 760), (7.2, VIS_X), (20, VIS_X)]

A_TEXT = [(0.0, ""), (2.1, "AKU KOSONG."), (3.5, "DIA MENGISIKU."), (4.8, "DIA PERGI. HABIS."),
          (6.9, "KOSONG LAGI."), (9.1, "BOCOR. SELALU BOCOR."), (10.5, "MASIH KOSONG.")]
B_TEXT = [(0.0, ""), (2.1, "ISI DARI DIRI SENDIRI."), (4.5, "PELAN-PELAN PENUH."), (6.2, "CUKUP."),
          (7.2, "ADA YANG DATANG."), (8.3, "BAGI SEDIKIT."), (9.4, "PENUH BERDUA.")]


def track(keys, t):
    x, moving = float(keys[0][1]), False
    for (t0, x0), (t1, x1) in zip(keys, keys[1:]):
        if t >= t0:
            if t < t1:
                u = ease((t - t0) / (t1 - t0))
                x = lerp(x0, x1, u)
                moving = x1 != x0 and 0 < u < 1
            else:
                x = float(x1)
    return x, moving


# ------------------------------------------------------------------ benda
def glass(p, cx, cy, level, color, crack=0.0, t=0.0, leak=False):
    """Gelas berpusat di (cx, cy); level 0..1; crack 0..1 menampilkan retakan dan tetesan bocor."""
    g = GS
    lay = blank()
    d = ImageDraw.Draw(lay)
    tl, tr, br, bl = (cx - 12 * g, cy - 14 * g), (cx + 12 * g, cy - 14 * g), (cx + 9 * g, cy + 14 * g), (cx - 9 * g, cy + 14 * g)
    if level > 0.01:
        yl = cy + 14 * g - 27 * g * level
        w = lerp(9, 12, (cy + 14 * g - yl) / (28 * g)) * g
        d.polygon([((cx - w + 1) * S, yl * S), ((cx + w - 1) * S, yl * S), ((cx + 8 * g) * S, (cy + 13 * g) * S),
                   ((cx - 8 * g) * S, (cy + 13 * g) * S)], fill=color + (235,))
    d.polygon([(x * S, y * S) for x, y in (tl, tr, br, bl)], fill=(210, 225, 245, 28),
              outline=(215, 225, 240, 255), width=int(1.8 * S))
    if crack > 0.05:
        pts = [(cx - 3 * g, cy - 14 * g), (cx + 2 * g, cy - 5 * g), (cx - 2 * g, cy + 3 * g), (cx + 1.5 * g, cy + 14 * g)]
        d.line([(x * S, y * S) for x, y in pts], fill=(14, 16, 26, 255), width=int((1.0 + 1.4 * crack) * S))
    put(p, lay)
    if leak and crack > 0.05 and level > 0.03:
        lay2 = blank()
        d2 = ImageDraw.Draw(lay2)
        for i in range(4):
            u = (t * 2.6 + i * 0.25) % 1.0
            y = cy + 14 * g + 34 * u * u
            if y < FLOOR:
                d2.ellipse([(cx + 1.5 * g - 2.4) * S, (y - 3.2) * S, (cx + 1.5 * g + 2.4) * S, (y + 2.4) * S],
                           fill=color + (int(230 * (1 - u * 0.6)),))
        put(p, lay2)


def stream(p, a, b, color, w=2.6, k=1.0):
    if k <= 0.02:
        return
    lay = blank()
    pts = []
    for i in range(13):
        u = i / 12
        pts.append((lerp(a[0], b[0], u) * S, (lerp(a[1], b[1], u) + 10 * math.sin(math.pi * u) * 0.0 + 14 * u * u) * S))
    ImageDraw.Draw(lay).line(pts, fill=color + (255,), width=int(w * S), joint="curve")
    put(p, lay, k)


def pitcher(p, hand, color=(200, 214, 240)):
    lay = blank()
    d = ImageDraw.Draw(lay)
    x, y = hand
    d.rectangle([(x - 6) * S, (y - 4) * S, (x + 6) * S, (y + 10) * S], fill=color + (255,),
                outline=(120, 130, 150, 255), width=S)
    put(p, lay)


def table(p):
    lay = blank()
    d = ImageDraw.Draw(lay)
    d.rectangle([(TABLE_X - 32) * S, (FLOOR - 38) * S, (TABLE_X + 32) * S, (FLOOR - 32) * S], fill=(104, 80, 60, 255))
    for lx in (TABLE_X - 22, TABLE_X + 17):
        d.rectangle([lx * S, (FLOOR - 32) * S, (lx + 5) * S, FLOOR * S], fill=(78, 60, 46, 255))
    put(p, lay)


# ------------------------------------------------------------------ angle A
def level_A(t):
    lv = 0.0
    for s in DON_S:
        if s + 1.2 <= t < s + 2.5:
            lv = 0.9 * ease((t - (s + 1.2)) / 1.0)
        elif s + 2.5 <= t < s + 3.4:
            lv = 0.9 * (1 - ease((t - (s + 2.5)) / 0.8))
    return lv


def donor_A(k, t):
    s = DON_S[k]
    x, fy, sc, al, walk, f = 395, FLOOR, 1.15, 1.0, None, -1
    u = ease((t - s) / 1.2)
    x = lerp(740, 395, u)
    if 0 < u < 1:
        walk = t * 9.5
    if t > s + 2.3:
        f = 1
    u2 = ease((t - (s + 2.5)) / 1.1)
    if u2 > 0:
        x += 50 * u2
        fy -= 24 * u2
        sc *= lerp(1, 0.72, u2)
        al = 1 - u2
        if u2 < 1:
            walk = t * 9.5
    return x, fy, f, sc, al, walk


def panel_A(t):
    p = BG.copy()
    hit = sum(pulse(t - m) for m in IMP_A)
    r = sum(ease((t - (m + 0.15)) / 1.0) for m in IMP_A)
    lv = level_A(t)
    sit = ease((t - 10.2) / 0.8)
    face = "hit" if hit > 0.05 else ("happy" if lv > 0.4 else "sad")
    hx = HERO_A_X - 16 * hit
    hero, _, hd = fig_layer(hx, FLOOR, WHITE, f=1, lean=0.04 * r - 0.25 * hit + 0.1 * sit, head=0.12 * r,
                            arm_f=62 + 20 * hit, sit=sit, face=face)
    hand = base.LAST_HAND
    gpos = (hand[0] + 4, hand[1] + 16)
    # pemberi
    for k in range(3):
        dx, dy, f, sc, al, w = donor_A(k, t)
        if al > 0.01 and dx < PW + 60:
            lay, _, _ = fig_layer(dx, dy, SIL, f=f, walk=w, sc=sc, arm_f=70, arm_b=-8)
            dh = base.LAST_HAND
            put(p, lay, al)
            s = DON_S[k]
            if s + 0.8 <= t < s + 2.4 and al > 0.5:
                pitcher(p, dh)
                stream(p, (dh[0] - 4, dh[1] + 8), (gpos[0] + 1, gpos[1] - 14 * GS), WATER_A,
                       k=ease((t - (s + 1.2)) / 0.2) * (1 - ease((t - (s + 2.2)) / 0.2)))
    put(p, hero)
    glass(p, gpos[0], gpos[1], lv, WATER_A, crack=min(1.0, 0.3 + 0.35 * r), t=t, leak=True)
    for m in IMP_A:
        shock(p, hx + 8, 300, t - m, RED)
    fall = ease((t - (IMP_A[2] + 0.6)) / 0.9)
    if r > 0.15 and fall < 1:
        broken_heart(p, hx - 4, hd[1] - 44, 1.0, r, fall)
    if t > TEARS[0]:
        tears(p, hd, 1, t)
    vignette(p, 0.7 * clamp(r / 3) + 0.35 * hit)
    overlay(p, (200, 40, 55), 0.30 * sum(pulse(t - m, 0.35) for m in IMP_A))
    return p, 9 * hit * math.sin(t * 90), 5 * hit * math.cos(t * 77)


# ------------------------------------------------------------------ angle B
def panel_B(t):
    p = BG.copy()
    own = ease((t - 2.4) / 3.6)                     # gelas sendiri terisi pelan
    vis = 0.85 * ease((t - 8.4) / 0.9)              # gelas tamu terisi dari luapan
    close = ease((t - BURST) / 0.8)
    f = -1 if t < 7.6 else 1
    arm = 85.0 if t < 7.6 else lerp(85, 100, ease((t - 7.6) / 0.4))
    face = "happy" if t >= 6.2 else "calm"
    paste_glow(p, TABLE_X, FLOOR - 60, 0.9 * own ** 1.4 + 0.5 * close)
    table(p)
    hero, _, hd = fig_layer(HERO_B_X, FLOOR, WHITE, f=f, arm_f=arm, lean=0.08, face=face)
    hand = base.LAST_HAND
    put(p, hero)
    own_pos = (TABLE_X, FLOOR - 60)
    if t >= 2.0:
        pitcher(p, hand, (230, 200, 130))
    if 2.2 <= t < 6.0:
        stream(p, (hand[0] - 4, hand[1] + 8), (own_pos[0] + 2, own_pos[1] - 14 * GS), WATER_B,
               k=ease((t - 2.2) / 0.3) * (1 - ease((t - 5.8) / 0.2)))
    glass(p, own_pos[0], own_pos[1], own, WATER_B)
    # tamu
    vx, vmov = track(VIS_KEYS, t)
    if t >= 5.6 and vx < PW + 40:
        lay, _, shd = fig_layer(vx, FLOOR, lerp_col(SIL, (232, 232, 240), close), f=-1,
                                walk=t * 9.5 if vmov else None, arm_f=70, arm_b=-8,
                                face="happy" if t >= BURST else None)
        vhand = base.LAST_HAND
        put(p, lay, ease((t - 5.6) / 0.4))
        vpos = (vhand[0] - 3, vhand[1] + 16)
        if 8.3 <= t < 9.4:
            stream(p, (hand[0] + 4, hand[1] + 8), (vpos[0], vpos[1] - 14 * GS), WATER_B,
                   k=ease((t - 8.3) / 0.2) * (1 - ease((t - 9.2) / 0.2)))
        glass(p, vpos[0], vpos[1], vis, WATER_B)
    shock(p, 290, 300, t - BURST, (255, 214, 140), rmax=140, dur=0.8)
    sparks(p, 290, 290, t - BURST)
    hu = ease((t - (BURST + 0.2)) / 0.5)
    if hu > 0:
        heart(p, 290, 158 + 3 * math.sin(t * 5), 0.85 * (1 + 0.14 * abs(math.sin(t * 6))), hu)
    for i in range(5):
        u = (t - (10.3 + 0.6 * i)) / 1.8
        if 0 <= u < 1:
            heart(p, 240 + 22 * i + 8 * math.sin(u * 6 + i), 200 - 80 * u, 0.36, math.sin(math.pi * u))
    overlay(p, (255, 205, 120), 0.28 * pulse(t - BURST, 0.5) + 0.08 * pulse(t - 6.0, 0.5))
    return p, 0.0, 0.0


# ------------------------------------------------------------------ frame
def render(t):
    fr = Image.new("RGB", (W, H), (0, 0, 0))
    d = ImageDraw.Draw(fr)
    dim = 1 - 0.65 * ease((t - 12.0) / 0.8)
    l1 = "KESEPIAN BUKAN TANDA KURANG."
    n1 = int(len(l1) * clamp((t - 0.2) / 1.4) + 0.999)
    spaced(d, l1, W / 2, 84, F_TITLE, scale_col(WHITE, dim), nchars=n1)
    if t >= 10.0:
        l2 = "JANGAN DIISI ORANG LAIN,"
        n2 = int(len(l2) * clamp((t - 10.0) / 1.3) + 0.999)
        spaced(d, l2, W / 2, 126, F_TITLE, scale_col(WHITE, dim), nchars=n2)

    fade_end = clamp((DUR - t) / 0.5)
    k = ease(t / 0.8) * lerp(1.0, 0.10, ease((t - 12.0) / 0.8)) * fade_end
    black = Image.new("RGB", (PW, PH), (0, 0, 0))
    pa = finish_panel(panel_A(t), "DIA YANG MENGISI KOSONG", A_TEXT, t, BLUE)
    pb = finish_panel(panel_B(t), "DIA YANG MENEMANI DIRI", B_TEXT, t, (170, 180, 200), AMBER, BURST)
    fr.paste(Image.blend(black, pa, k), (PX, PYA))
    fr.paste(Image.blend(black, pb, k), (PX, PYB))

    pu = ease((t - 12.6) / 0.6) * fade_end
    if pu > 0:
        spaced_multi(d, [("PENUHI", AMBER)], W / 2, 600, F_PUNCH, alpha=pu)
        spaced_multi(d, [("DIRIMU DULU.", WHITE)], W / 2, 672, F_PUNCH, alpha=pu)
    su = ease((t - 14.6) / 0.8) * fade_end
    if su > 0:
        spaced(d, "KALAU SUDAH PENUH,", W / 2, 1000, F_SUB, scale_col(GREY, su), sp=2)
        spaced(d, "BARU BERBAGI.", W / 2, 1038, F_SUB, scale_col(GREY, su), sp=2)
    fade = clamp(1 - t / 0.4)
    if fade > 0:
        fr = Image.blend(fr, Image.new("RGB", (W, H), (0, 0, 0)), fade)
    return fr


# ------------------------------------------------------------------ audio
def make_audio(path):
    sr = 44100
    n = int(sr * DUR)
    t = np.arange(n) / sr
    rs = np.random.RandomState(41)
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

    def pour(t0, dur, amp, rising=True):
        """Suara air dituang: derau pita sedang dengan gelembung kecil; nada naik saat gelas terisi."""
        m = int(sr * dur)
        noise = np.convolve(rs.randn(m), np.ones(5) / 5, mode="same") - np.convolve(
            rs.randn(m), np.ones(40) / 40, mode="same")
        env = np.sin(np.linspace(0, np.pi, m)) ** 0.6
        add(t0, amp * noise * env)
        if rising:
            add(t0, sweep(300, 900, dur, amp * 0.5) * 0.5)

    def steps(t0, dur, per=0.34):
        tt = t0
        while tt < t0 + dur:
            add(tt, tone(95, 0.09, 0.05, 40))
            tt += per

    def heartbeat(t0, amp=0.35, f=62):
        add(t0, tone(f, 0.18, amp, 22))
        add(t0 + 0.17, tone(f * 0.85, 0.2, amp * 0.7, 20))

    for k, s in enumerate(DON_S):             # angle A
        steps(s, 1.2)
        pour(s + 1.2, 1.0, 0.08)
        add(s + 2.2, tone(2093, 0.3, 0.03, 12))   # ting gelas hampir penuh
        h = IMP_A[k]
        add(h - 0.05, sweep(500, 140, 0.9, 0.06))  # air meluncur habis
        for i in range(8):                         # tetes bocor
            add(h + 0.1 * i, tone(1400, 0.08, 0.04, 40) * np.linspace(1, 0.4, int(sr * 0.08)))
        add(h, tone(52, 0.7, 0.7, 6))
        add(h, burst(0.16, 0.22))
        add(h, tone(2637, 0.25, 0.03, 18))
        add(h, sweep(380, 150, 0.5, 0.1))
        heartbeat(h + 0.45, 0.28 - 0.05 * k, 55)
        heartbeat(h + 0.95, 0.2 - 0.04 * k, 52)
    for tt in TEARS:
        add(tt + 0.7, tone(1500, 0.12, 0.05, 30) * np.linspace(1, 0.4, int(sr * 0.12)))
    add(10.2, lp(0.7, 0.08, 40) * np.linspace(1, 0, int(sr * 0.7)))
    for i, fq in enumerate((440.0, 392.0, 329.6)):
        add(10.5 + i * 0.45, tone(fq, 1.6, 0.045, 2.6))
    # angle B
    pour(2.2, 3.8, 0.06)                      # mengisi sendiri, pelan
    add(6.0, tone(1568, 0.8, 0.04, 5))       # penuh: ting hangat
    add(6.0, tone(1046.5, 1.2, 0.03, 3))
    steps(5.6, 1.6, 0.42)
    pour(8.3, 1.0, 0.05)                      # berbagi
    add(9.3, tone(1318.5, 0.5, 0.03, 8))
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

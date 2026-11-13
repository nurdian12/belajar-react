#!/usr/bin/env python3
"""Video storytelling: "Cerita Lentera" - Raka yang memberikan seluruh cahayanya.
Topik: percintaan / memberi tanpa menghabiskan diri. 720x1280 (9:16), 24 fps, 46 detik, SFX sintetis.

Satu cerita utuh (bukan A/B), dengan tokoh bernama, narasi teks di bawah layar, kamera yang bergeser,
dan alur: pembuka -> bertemu -> memberi -> ditinggal -> bangkit -> bertemu yang tepat -> pesan.

  Raka  (putih)   : yang membawa lentera
  Laras (merah muda): yang diberi lentera lalu pergi
  Sekar (biru muda) : yang datang membawa lenteranya sendiri

Memakai helper dari make_video_penolakan.py (gambar tokoh, efek emosi, teks).
Pakai: python3 video/make_video_cerita_lentera.py [output.mp4]
Butuh: Pillow, numpy, ffmpeg.
"""
import math
import os
import re
import subprocess
import sys
import tempfile
import wave

sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

import numpy as np
from PIL import Image, ImageDraw, ImageFont

import make_video_penolakan as base
from make_video_penolakan import (
    AMBER, BG, FLOOR, FPS, F_PUNCH, F_SUB, GREY, H, PH, PW, RED, S, W, WHITE, blank,
    broken_heart, clamp, ease, fig_layer, heart, lerp, overlay, paste_glow, pulse, put, rain,
    scale_col, shock, sparks, spaced, spaced_multi, tears, vignette)

DUR = 46.0
OUT = sys.argv[1] if len(sys.argv) > 1 else os.path.join(
    os.path.dirname(os.path.abspath(__file__)), "cerita-lentera.mp4")

RAKA, LARAS, SEKAR = (245, 245, 250), (255, 186, 204), (176, 218, 255)
LAMP = (255, 214, 120)
IMP = [15.7, 17.9]                 # Laras pergi: cahaya meninggalkan Raka
BURST = 36.2                       # dua lentera bertemu
TEARS = [19.8 + 0.55 * i + 0.13 * (i % 3) for i in range(7)]
base.TEARS[:] = TEARS
PROP_X = 318                       # lentera kecil di tanah
STAGE_W, STAGE_H, STAGE_Y = 720, 760, 130

RAKA_KEYS = [(0, 130), (5.3, 300), (5.8, 300), (7.3, 415), (23.3, 415), (25.2, 350), (27.5, 350),
             (30.0, 470), (60, 470)]
LARAS_KEYS = [(0, 470), (15.0, 470), (18.5, 760), (60, 760)]
SEKAR_KEYS = [(0, 760), (30.5, 760), (33.5, 560), (60, 560)]
CAM_KEYS = [(0, 250), (5.5, 330), (9, 420), (15, 450), (19, 400), (25, 340), (31, 400), (36, 470), (46, 470)]
DARK_T = [0, 9.0, 15.5, 18.0, 24.0, 26.0, 30.0, 34.0, 36.0, 60]
DARK_V = [0.0, 0.0, 0.50, 0.62, 0.62, 0.55, 0.35, 0.18, 0.0, 0.0]

CAPTIONS = [
    (0.5, 5.3, ["Raka selalu membawa [lentera].", "Katanya, cahaya itu untuk", "orang yang ia [sayang]."]),
    (5.6, 7.9, ["Lalu ia bertemu [Laras]."]),
    (8.0, 12.2, ["Raka memberikan [lenteranya].", "Seluruhnya."]),
    (12.4, 15.5, ["Laras makin terang.", "Raka makin [gelap]."]),
    (15.7, 19.0, ["Lalu Laras pergi,", "membawa [semua cahayanya]."]),
    (19.4, 22.9, ["Raka duduk sendirian di gelap.", "Sampai ia sadar..."]),
    (23.2, 26.0, ["masih ada [bara kecil]", "di dadanya."]),
    (26.2, 30.0, ["Ia menyalakan lentera barunya.", "Kecil. Tapi [miliknya]."]),
    (30.6, 36.0, ["Suatu malam, ada yang datang", "membawa [lenteranya sendiri]."]),
    (36.4, 38.4, ["Tidak meminta cahaya Raka."]),
]


def font(n):
    return ImageFont.truetype(base._FM, n)


F_CAP = font(32)
F_SMALL = font(20)


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


def lantern(p, x, y, lit=1.0):
    lay = blank()
    d = ImageDraw.Draw(lay)
    body = (255, 214, 120) if lit > 0.05 else (120, 104, 76)
    d.rectangle([(x - 4.5) * S, (y - 6) * S, (x + 4.5) * S, (y + 6) * S], fill=body + (255,))
    d.rectangle([(x - 3) * S, (y - 9) * S, (x + 3) * S, (y - 6) * S], outline=(120, 100, 60, 255), width=S)
    put(p, lay)


def lamp_pos(hand, f, sc=1.15):
    """Posisi lentera yang digambar fig_layer(lamp=...) dari posisi tangan depan."""
    return (hand[0] + f * 3 * sc, hand[1] + 7 * sc)


# ------------------------------------------------------------------ dunia
def world(t):
    p = BG.copy()
    dark = float(np.interp(t, DARK_T, DARK_V))
    overlay(p, (0, 0, 8), dark)
    if t > 33.0:  # bintang muncul setelah hujan reda
        lay = blank()
        d = ImageDraw.Draw(lay)
        rs = np.random.RandomState(11)
        for i in range(36):
            x, y = rs.uniform(10, 630), rs.uniform(10, 190)
            tw = 0.6 + 0.4 * math.sin(t * 3 + i)
            z = rs.uniform(1.2, 2.6)
            d.ellipse([(x - z) * S, (y - z) * S, (x + z) * S, (y + z) * S], fill=(255, 240, 200, int(220 * tw)))
        put(p, lay, ease((t - 33.0) / 2.0))
    return p, dark


def stage(t):
    p, dark = world(t)
    hit = sum(pulse(t - m) for m in IMP)
    r = sum(ease((t - (m + 0.15)) / 1.0) for m in IMP)
    close = ease((t - BURST) / 0.8)

    # ---- Raka
    rx, rmov, rf = track(RAKA_KEYS, t)
    rx -= 16 * hit
    sit = ease((t - 18.4) / 0.9) * (1 - ease((t - 23.3) / 0.8))
    if t < 7.3 and t >= 7.0:
        pass
    if t < 7.6:
        arm = 70.0
    elif t < 8.2:
        arm = lerp(70, 92, ease((t - 7.6) / 0.6))
    elif t < 9.4:
        arm = lerp(92, 40, ease((t - 8.2) / 1.2))
    elif 15.0 <= t < 18.0:
        arm = 110.0
    elif t < 18.6:
        arm = lerp(110, 25, ease((t - 18.0) / 0.6))
    elif t < 24.0:
        arm = 25.0
    else:
        arm = 60.0
    if t < 8.0:
        face = "calm"
    elif hit > 0.05:
        face = "hit"
    elif t < 15.4:
        face = "happy"
    elif t < 25.5:
        face = "sad"
    elif t < BURST:
        face = "calm"
    else:
        face = "happy"
    has_lamp = t < 8.0 or t >= 27.2
    raka, rlamp, rhd = fig_layer(rx, FLOOR, RAKA, f=rf, walk=t * 9.5 if rmov else None,
                                 lean=0.04 * r - 0.25 * hit, head=0.12 * r, arm_f=arm, sit=sit,
                                 lamp=LAMP if has_lamp else None, face=face)
    rhand = base.LAST_HAND

    # ---- Laras
    lx, lmov, lf = track(LARAS_KEYS, t)
    if t < 15.0:
        lf = -1
    lal = ease((t - 5.2) / 0.5)
    larm = lerp(40, 88, ease((t - 7.6) / 0.5)) if t < 9.4 else 62.0
    if t >= 9.4:
        larm = 62.0
    llamp_on = t >= 9.0
    laras = llamp = lhand = None
    if lal > 0.01:
        laras, llamp, _ = fig_layer(lx, FLOOR, LARAS, f=lf, walk=t * 9.5 if lmov else None, arm_f=larm,
                                    lamp=LAMP if llamp_on else None,
                                    face="happy" if t >= 9.0 else "calm")
        lhand = base.LAST_HAND

    # ---- Sekar
    sx, smov, sf = track(SEKAR_KEYS, t)
    sekar = slamp = None
    if t >= 30.4:
        sekar, slamp, _ = fig_layer(sx, FLOOR, SEKAR, f=-1, walk=t * 9.5 if smov else None, arm_f=62,
                                    lamp=LAMP, face="happy" if t >= BURST else "calm")

    # ---- cahaya (di belakang tokoh)
    if has_lamp and rlamp:
        k = 1.0 if t < 8.0 else (0.7 + 0.9 * close)
        paste_glow(p, rlamp[0], rlamp[1], k)
    if 8.0 <= t < 9.0 and rhand and lhand:
        u = ease((t - 8.0) / 1.0)
        a, b = lamp_pos(rhand, rf), lamp_pos(lhand, lf)
        lp = (lerp(a[0], b[0], u), lerp(a[1], b[1], u) - 16 * math.sin(math.pi * u))
        paste_glow(p, lp[0], lp[1], 1.0)
    if llamp and t >= 9.0 and lal > 0.01:
        paste_glow(p, llamp[0], llamp[1], 1.0 + 0.9 * ease((t - 9.0) / 6.0))
    if slamp:
        paste_glow(p, slamp[0], slamp[1], (0.7 + 0.9 * close) * ease((t - 30.4) / 0.6))
    # lentera kecil di tanah
    if t >= 22.8:
        lit = ease((t - 26.0) / 0.6)
        al = ease((t - 22.8) / 0.5)
        if t < 26.4:
            if lit > 0.02:
                paste_glow(p, PROP_X, FLOOR - 8, 0.6 * lit)
            lay = blank()
            ImageDraw.Draw(lay).rectangle([(PROP_X - 4.5) * S, (FLOOR - 14) * S, (PROP_X + 4.5) * S, (FLOOR - 2) * S],
                                          fill=((255, 214, 120) if lit > 0.05 else (120, 104, 76)) + (255,))
            put(p, lay, al)

    # ---- gambar tokoh
    if laras is not None:
        put(p, laras, lal)
    if sekar is not None:
        put(p, sekar, ease((t - 30.4) / 0.5))
    put(p, raka)
    # lentera yang sedang dipindah
    if 8.0 <= t < 9.0 and rhand and lhand:
        lantern(p, lp[0], lp[1])
    if 26.4 <= t < 27.2 and rhand:  # diambil Raka dari tanah
        u = ease((t - 26.4) / 0.8)
        b = lamp_pos(rhand, rf)
        pos = (lerp(PROP_X, b[0], u), lerp(FLOOR - 8, b[1], u) - 10 * math.sin(math.pi * u))
        paste_glow(p, pos[0], pos[1], 0.7)
        lantern(p, pos[0], pos[1])

    # ---- bara di dada Raka
    chest = (rhd[0] - rf * 3, rhd[1] + 26)
    if 21.5 <= t < 26.0:
        k = ease((t - 21.5) / 0.8)
        beat = 1 + 0.18 * abs(math.sin(t * 5))
        if t < 25.2:
            pos = chest
        else:
            u = ease((t - 25.2) / 0.8)
            pos = (lerp(chest[0], PROP_X, u), lerp(chest[1], FLOOR - 8, u) - 20 * math.sin(math.pi * u))
        paste_glow(p, pos[0], pos[1], 0.6 * k * beat)
        heart(p, pos[0], pos[1], 0.28 * beat, k)

    # ---- efek emosi
    for m in IMP:
        shock(p, rx + 8, 300, t - m, RED)
    fall = ease((t - 20.2) / 0.8)
    if r > 0.15 and fall < 1:
        broken_heart(p, rx - 2, rhd[1] - 42, 1.0, r, fall)
    if 19.8 <= t < 24.0:
        tears(p, rhd, rf, t)
    rk = (0.55 + 0.35 * ease((t - 12) / 4)) * (1 - ease((t - 30.0) / 2.8))
    rain(p, rk, t)
    vignette(p, 0.7 * dark + 0.35 * hit)
    overlay(p, (200, 40, 55), 0.30 * sum(pulse(t - m, 0.35) for m in IMP))
    # ---- pertemuan dua lentera
    mid = (515, 300)
    shock(p, mid[0], mid[1], t - BURST, (255, 214, 140), rmax=170, dur=0.9)
    sparks(p, mid[0], 290, t - BURST)
    hu = ease((t - (BURST + 0.2)) / 0.5)
    if hu > 0:
        heart(p, mid[0], 150 + 3 * math.sin(t * 5), 0.9 * (1 + 0.14 * abs(math.sin(t * 6))), hu)
    for i in range(5):
        u = (t - (37.0 + 0.5 * i)) / 1.8
        if 0 <= u < 1:
            heart(p, 470 + 22 * i + 8 * math.sin(u * 6 + i), 210 - 80 * u, 0.36, math.sin(math.pi * u))
    overlay(p, (255, 205, 120), 0.25 * pulse(t - BURST, 0.5))
    dx, dy = 9 * hit * math.sin(t * 90), 5 * hit * math.cos(t * 77)
    return p, dx, dy


# alias supaya skrip thumbnail bisa mengambil adegan dengan antarmuka yang sama dengan video A/B
panel_A = panel_B = stage


def camera(scene, t, dx, dy):
    if abs(dx) + abs(dy) > 0.1:
        scene = scene.transform(scene.size, Image.AFFINE, (1, 0, -dx * S, 0, 1, -dy * S),
                                resample=Image.BILINEAR, fillcolor=(4, 6, 14))
    cx = float(np.interp(t, [k[0] for k in CAM_KEYS], [k[1] for k in CAM_KEYS]))
    cw = 855
    left = int(clamp(cx * S - cw / 2, 0, 1280 - cw))
    return scene.crop((left, 0, left + cw, 900)).resize((STAGE_W, STAGE_H), Image.LANCZOS)


EDGE = None


def edge_mask():
    global EDGE
    if EDGE is None:
        m = np.full((STAGE_H, STAGE_W), 255, np.float32)
        ramp = np.linspace(0, 1, 56)
        m[:56, :] *= ramp[:, None]
        m[-56:, :] *= ramp[::-1][:, None]
        EDGE = Image.fromarray(m.astype(np.uint8), "L")
    return EDGE


def caption_segments(line):
    segs, pos = [], 0
    for m in re.finditer(r"\[(.+?)\]", line):
        if m.start() > pos:
            segs.append((line[pos:m.start()], WHITE))
        segs.append((m.group(1), AMBER))
        pos = m.end()
    if pos < len(line):
        segs.append((line[pos:], WHITE))
    return segs


def draw_caption(d, lines, t0, t1, t):
    chars_total = 0
    shown = int((t - t0) * 42)
    fade = clamp((t1 - t) / 0.3)
    y = 985
    for line in lines:
        segs = caption_segments(line)
        full = "".join(s for s, _ in segs)
        cw = d.textlength(full, font=F_CAP)
        x = W / 2 - cw / 2
        for s, col in segs:
            for ch in s:
                if chars_total < shown:
                    d.text((x, y), ch, font=F_CAP, fill=scale_col(col, fade), anchor="lm")
                x += d.textlength(ch, font=F_CAP)
                chars_total += 1
        y += 50


def render(t):
    fr = Image.new("RGB", (W, H), (0, 0, 0))
    d = ImageDraw.Draw(fr)
    # penanda atas: progres cerita
    d.text((W / 2, 58), "LENTERA  ·  CERITA 01", font=F_SMALL, fill=scale_col(GREY, 0.9), anchor="mm")
    d.rectangle([40, 88, W - 40, 91], fill=(34, 38, 54))
    d.rectangle([40, 88, 40 + (W - 80) * clamp(t / DUR), 91], fill=AMBER)

    scene, dx, dy = stage(t)
    img = camera(scene, t, dx, dy)
    fadeend = clamp((DUR - t) / 0.5)
    endk = lerp(1.0, 0.10, ease((t - 38.4) / 0.8))
    k = ease(t / 0.8) * endk * fadeend
    black = Image.new("RGB", img.size, (0, 0, 0))
    img = Image.blend(black, img, k)
    fr.paste(img, (0, STAGE_Y), edge_mask())

    for t0, t1, lines in CAPTIONS:
        if t0 <= t < t1:
            draw_caption(d, lines, t0, t1, t)
    pu = ease((t - 39.0) / 0.6) * fadeend
    if pu > 0:
        spaced_multi(d, [("BAGI CAHAYAMU,", AMBER)], W / 2, 540, F_PUNCH, alpha=pu)
        spaced_multi(d, [("JANGAN HABISKAN.", WHITE)], W / 2, 612, F_PUNCH, alpha=pu)
    su = ease((t - 41.2) / 0.8) * fadeend
    if su > 0:
        spaced(d, "YANG TEPAT DATANG MEMBAWA", W / 2, 960, F_SUB, scale_col(GREY, su), sp=2)
        spaced(d, "LENTERANYA SENDIRI.", W / 2, 998, F_SUB, scale_col(GREY, su), sp=2)
    fade = clamp(1 - t / 0.4)
    if fade > 0:
        fr = Image.blend(fr, Image.new("RGB", (W, H), (0, 0, 0)), fade)
    return fr


# ------------------------------------------------------------------ audio
def make_audio(path):
    sr = 44100
    n = int(sr * DUR)
    t = np.arange(n) / sr
    rs = np.random.RandomState(51)
    out = np.zeros(n)

    def add(t0, sig):
        i = int(t0 * sr)
        j = min(n, i + len(sig))
        if 0 <= i < n:
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

    def heartbeat(t0, amp=0.3, f=60):
        add(t0, tone(f, 0.18, amp, 22))
        add(t0 + 0.17, tone(f * 0.85, 0.2, amp * 0.7, 20))

    # hujan: kecil, makin deras, reda menjelang pertemuan
    env = np.interp(t, [0, 8, 15, 18, 30, 33, 34, 60], [0.03, 0.05, 0.08, 0.11, 0.10, 0.03, 0.0, 0.0])
    out += np.convolve(rs.randn(n), np.ones(6) / 6, mode="same") * env * 0.5
    # pad: minor (sedih) lalu mayor (hangat)
    minor = sum(tone(f, DUR, 0.022, 0.0, attack=2.0) for f in (110.0, 164.8, 220.0, 261.6))
    major = sum(tone(f, DUR, 0.026, 0.0, attack=2.0) for f in (130.8, 196.0, 261.6, 329.6))
    mix = np.clip((t - 24.0) / 3.0, 0, 1)
    out += minor * (1 - mix) * np.clip((DUR - t) / 2, 0, 1) + major * mix
    # langkah
    for a, b in ((0.5, 5.3), (5.8, 7.3), (23.3, 25.2), (27.5, 30.0), (15.0, 18.4), (30.5, 33.5)):
        steps(a, b - a, 0.4 if b - a > 3 else 0.34)
    # lentera berpindah
    add(8.0, sweep(500, 900, 0.9, 0.05))
    add(9.0, tone(1046.5, 1.5, 0.05, 3))
    add(9.05, tone(1568.0, 1.2, 0.03, 3))
    # Laras pergi: kena
    for k, hh in enumerate(IMP):
        amp = 1.0 if k == 0 else 0.6
        add(hh, tone(52, 0.8, 0.7 * amp, 6))
        add(hh, burst(0.2, 0.24 * amp))
        add(hh, tone(2637, 0.3, 0.03 * amp, 18))
        add(hh, sweep(380, 140, 0.7, 0.1 * amp))
    for i in range(7):
        heartbeat(16.4 + 0.95 * i, 0.26 - 0.025 * i, 55)
    for tt in TEARS:
        add(tt + 0.7, tone(1500, 0.12, 0.05, 30) * np.linspace(1, 0.4, int(sr * 0.12)))
    add(18.4, lp(0.9, 0.1, 30) * np.linspace(1, 0, int(sr * 0.9)))
    for i, fq in enumerate((440.0, 392.0, 329.6)):
        add(19.4 + i * 0.5, tone(fq, 1.8, 0.05, 2.4))
    # bara: detak lembut, melayang, menyala
    for i in range(5):
        add(21.6 + 0.7 * i, tone(392.0, 0.5, 0.025 + 0.004 * i, 5))
        add(21.6 + 0.7 * i, tone(75, 0.25, 0.09, 12))
    add(25.2, sweep(400, 1300, 0.8, 0.05))
    add(26.0, burst(0.2, 0.12))
    add(26.0, tone(880, 1.0, 0.05, 4))
    add(26.1, tone(1318.5, 0.9, 0.03, 4))
    add(27.2, tone(1568.0, 0.5, 0.03, 8))
    # Sekar datang
    add(31.0, tone(1046.5, 0.8, 0.03, 4))
    add(33.5, tone(1318.5, 0.9, 0.03, 4))
    heartbeat(BURST - 0.6, 0.32, 66)
    heartbeat(BURST - 0.2, 0.36, 70)
    add(BURST, tone(110, 0.9, 0.35, 5))
    for i, fq in enumerate((1046.5, 1318.5, 1568.0, 2093.0, 2637.0)):
        add(BURST + 0.05 + i * 0.07, tone(fq, 1.2, 0.035, 4))
    for fq in (523.3, 659.3, 784.0):
        add(BURST + 0.2, tone(fq, 2.0, 0.05, 1.8))
    for i in range(5):
        add(37.0 + 0.5 * i, tone(1760, 0.35, 0.015, 8))
    m = int(sr * 1.8)
    x_ = np.arange(m) / sr
    add(36.8, 0.05 * np.sin(2 * np.pi * np.cumsum(220 + 600 * (x_ / 1.8) ** 1.6) / sr) * np.linspace(0, 1, m) ** 1.5)
    # penutup
    add(39.0, tone(50, 1.6, 0.5, 3.0))
    add(39.0, burst(0.3, 0.2))
    add(41.0, tone(1568, 1.8, 0.02, 2.0))
    out *= np.clip((DUR - t) / 1.0, 0, 1)
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

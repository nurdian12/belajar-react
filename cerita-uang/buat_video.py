#!/usr/bin/env python3
"""Contoh video 'Warung rame, kas kosong' (720x1280, 30fps) + SFX sintetis.

Gaya mengikuti referensi: latar gelap, stickman, tumpukan blok, toples tabungan, caption kata-per-kata.
Pakai:  python3 buat_video.py [out.mp4]
Butuh:  Pillow, numpy, ffmpeg
"""
import math, os, subprocess, sys, wave
from multiprocessing import Pool
import numpy as np
from PIL import Image, ImageDraw, ImageFont, ImageFilter

W, H, FPS, S = 720, 1280, 30, 2
DUR = 15.5
GROUND = 868
INK = (22, 24, 34)
CREAM = (236, 230, 218)
AMBER = (245, 166, 35)
WHITE = (245, 246, 250)
GRAY = (150, 156, 172)
FONT = "/usr/share/fonts/opentype/inter/Inter-Bold.otf"
FONT_BLACK = "/usr/share/fonts/opentype/inter/Inter-Black.otf"

# ------------------------------------------------------------ linimasa (detik)
HOOK = [("Warung", .4), ("rame", .65), ("tiap", .9), ("hari,", 1.15),
        ("tapi", 1.6), ("kas-nya", 1.85), ("nggak", 2.1), ("nambah.", 2.35)]
HOOK_OUT = 3.0
LEAKS = [(4.2, "STOK", "R", 690), (5.3, "LISTRIK", "L", 730), (6.4, "SEWA", "R", 760), (7.5, "BON", "L", 790), (8.6, "PRIBADI", "R", 820)]
B_WORDS = [("Omzetnya", 9.0), ("naik,", 9.25), ("untungnya", 9.9), ("tetap", 10.15), ("nol.", 10.4)]
B_OUT = 12.0
JAR_ZERO = 10.4
C_WORDS = [("Omzet", 12.3), ("bukan", 12.55), ("untung.", 12.8)]
C_SUB = 13.4

# ------------------------------------------------------------ util
def clamp(x, a=0., b=1.): return max(a, min(b, x))
def lerp(a, b, k): return a + (b - a) * k
def ease_out(p): return 1 - (1 - clamp(p)) ** 3
def ease_in(p): return clamp(p) ** 2
def back(p):
    p = clamp(p); c = 1.70158
    return 1 + (c + 1) * (p - 1) ** 3 + c * (p - 1) ** 2

_fonts = {}
def font(path, px):
    k = (path, px)
    if k not in _fonts: _fonts[k] = ImageFont.truetype(path, int(px * S))
    return _fonts[k]

def P(v): return int(round(v * S))

def rrect(d, box, r, fill, outline=None, w=3):
    x0, y0, x1, y1 = box
    d.rounded_rectangle([P(x0), P(y0), P(x1), P(y1)], P(r), fill=fill, outline=outline, width=P(w) if outline else 0)

def line(d, pts, w, fill):
    q = [(P(x), P(y)) for x, y in pts]
    d.line(q, fill=fill, width=P(w), joint="curve")
    for x, y in (q[0], q[-1]):
        d.ellipse([x - P(w) / 2, y - P(w) / 2, x + P(w) / 2, y + P(w) / 2], fill=fill)

def limb(d, pts, w=9):
    line(d, pts, w + 5, INK)
    line(d, pts, w, CREAM)

# ------------------------------------------------------------ latar (sekali dibuat)
def make_bg():
    yy, xx = np.mgrid[0:H, 0:W].astype(np.float32)
    base = np.array([16, 21, 33], np.float32)
    v = 1 - .55 * (((xx - W / 2) / (W * .8)) ** 2 + ((yy - 520) / (H * .75)) ** 2)
    img = base[None, None, :] * np.clip(v, .25, 1.1)[:, :, None]
    ground = (yy > GROUND - 2)
    g = np.clip((yy - GROUND) / 380, 0, 1)[:, :, None]
    img = np.where(ground[:, :, None], img * 1.2 * (1 - .75 * g) + 3, img)
    img[GROUND - 2:GROUND, :, :] += 14
    return Image.fromarray(np.clip(img, 0, 255).astype(np.uint8)).resize((W * S, H * S), Image.BILINEAR)

def make_glow():
    g = Image.new("RGBA", (260 * S, 340 * S), (0, 0, 0, 0))
    d = ImageDraw.Draw(g)
    d.rounded_rectangle([P(80), P(110), P(180), P(270)], P(18), outline=(255, 170, 40, 255), width=P(10))
    return g.filter(ImageFilter.GaussianBlur(P(14)))

BG = make_bg(); GLOW = make_glow()

# ------------------------------------------------------------ ember bocor
CX, TOPY, BOTY, HWT, HWB = 400, 600, 860, 100, 78
def hw(y): return lerp(HWT, HWB, (y - TOPY) / (BOTY - TOPY))
LAND = {"R": [545, 615, 680], "L": [275, 195]}
def leak_geo(i):
    t0, label, side, y = LEAKS[i]
    idx = sum(1 for j in range(i) if LEAKS[j][2] == side)
    hx = CX + (hw(y) if side == "R" else -hw(y))
    return hx, y, LAND[side][idx]

def coin(d, x, y, r=8):
    d.ellipse([P(x - r), P(y - r), P(x + r), P(y + r)], fill=(250, 190, 50), outline=(150, 96, 20), width=P(2))
    d.ellipse([P(x - r / 2), P(y - r / 2), P(x + r / 2), P(y + r / 2)], outline=(255, 226, 130), width=P(1.5))

def rnd(k): return (math.sin(k * 12.9898) * 43758.5453) % 1

def pile_h(t):
    if t < 3.4: return 0
    up = 46 * ease_out((t - 3.4) / .8)
    down = clamp((t - 4.2) / (JAR_ZERO - 4.2))
    return max(0, up * (1 - down))

def draw_bucket(img, d, t):
    done = t >= JAR_ZERO
    edge = AMBER if done else (128, 142, 172)
    body = [(CX - HWT, TOPY), (CX + HWT, TOPY), (CX + HWB, BOTY), (CX - HWB, BOTY)]
    d.polygon([(P(x), P(y)) for x, y in body], fill=(34, 42, 60))
    ph = pile_h(t)
    if ph > 1:
        rrect(d, (CX - HWB + 5, BOTY - 4 - ph, CX + HWB - 5, BOTY - 4), 6, (232, 170, 52))
    # corong omzet
    ka = clamp((t - 2.9) / .4)
    if ka > 0:
        d.polygon([(P(CX - 54), P(390)), (P(CX + 54), P(390)), (P(CX + 14), P(452)), (P(CX - 14), P(452))], fill=(88, 102, 132), outline=INK)
        d.polygon([(P(CX - 14), P(452)), (P(CX + 14), P(452)), (P(CX + 14), P(470)), (P(CX - 14), P(470))], fill=(88, 102, 132))
    # koin masuk (omzet makin deras)
    for k in range(400):
        ts = 3.4 + k * .08
        if t < ts: break
        a = t - ts
        y = 470 + 640 * a
        if y > BOTY - 6 - ph or a > 1.6: continue
        coin(d, CX + (rnd(k) - .5) * 24, y)
    for k in range(400):
        ts = 6.0 + k * .05
        if t < ts: break
        a = t - ts
        y = 470 + 640 * a
        if y > BOTY - 6 - ph or a > 1.6: continue
        coin(d, CX + (rnd(k + 50) - .5) * 24, y)
    line(d, body + [body[0]], 5, edge)
    # lubang bocor + koin keluar
    for i, (t0, label, side, yy) in enumerate(LEAKS):
        if t < t0: continue
        hx, hy, lx = leak_geo(i)
        s = back((t - t0) / .25)
        r = 9 * max(s, .01)
        d.ellipse([P(hx - r), P(hy - r), P(hx + r), P(hy + r)], fill=INK, outline=(255, 120, 90), width=P(2))
        drop = GROUND - 10 - hy; g = 1800.; T = math.sqrt(2 * drop / g); vx = (lx - hx) / T
        for k in range(200):
            ts = t0 + k * .2
            if t < ts: break
            a = t - ts
            if a > T: continue
            coin(d, hx + vx * a, hy + .5 * g * a * a, 7)
    if done:
        s = back((t - JAR_ZERO) / .35)
        d.text((P(CX), P(690)), "Rp 0", font=font(FONT_BLACK, 52 * max(s, .01)), fill=AMBER, anchor="mm")

def draw_blocks(d, t): pass
def draw_jar(img, d, t): draw_bucket(img, d, t)

# ------------------------------------------------------------ stickman
def bump(t, t0):
    u = t - t0
    if u < 0 or u > .9: return 0.
    return ease_out(u / .2) if u < .5 else 1 - ease_in((u - .5) / .4)

def draw_man(d, t):
    x = 100
    g = max(bump(t, l[0] - .1) for l in LEAKS)
    shrug = ease_out((t - JAR_ZERO - .1) / .35) if t > JAR_ZERO else 0
    sway = math.sin(t * 2.2) * 1.6
    hip, sh = (x + sway * .3, 780), (x + sway * .6, 700)
    head = (sh[0] + sway * .4 + 3 * shrug, 662 + 1.5 * math.sin(t * 4))
    def arm(a1, a2, la=36, lb=34):
        e = (sh[0] + math.sin(math.radians(a1)) * la, sh[1] + math.cos(math.radians(a1)) * la)
        h = (e[0] + math.sin(math.radians(a2)) * lb, e[1] + math.cos(math.radians(a2)) * lb)
        return [sh, e, h]
    # kaki
    limb(d, [hip, (hip[0] - 9, 826), (hip[0] - 10 + sway * .2, GROUND - 5)], 10)
    limb(d, [hip, (hip[0] + 9, 826), (hip[0] + 10, GROUND - 5)], 10)
    # lengan belakang
    ls = lerp(-8, -42, shrug); lb2 = lerp(-4, -140, shrug)
    limb(d, arm(ls + sway, lb2 + sway), 9)
    limb(d, [sh, hip], 11)
    # lengan depan (menunjuk saat blok jatuh, angkat bahu di akhir)
    a1 = lerp(lerp(8, 100, g), 42, shrug); a2 = lerp(lerp(5, 118, g), 140, shrug)
    limb(d, arm(a1 + sway, a2 + sway), 9)
    # kepala
    r = 27
    d.ellipse([P(head[0] - r - 3), P(head[1] - r - 3), P(head[0] + r + 3), P(head[1] + r + 3)], fill=INK)
    d.ellipse([P(head[0] - r), P(head[1] - r), P(head[0] + r), P(head[1] + r)], fill=CREAM)
    # tanda tanya setelah toples nol
    if t > JAR_ZERO + .6:
        s = back((t - JAR_ZERO - .6) / .3)
        d.text((P(head[0] + 40), P(head[1] - 48)), "?", font=font(FONT_BLACK, 46 * max(s, .01)), fill=AMBER, anchor="mm")

# ------------------------------------------------------------ caption & label
def draw_words(over, lines, t, y0, size, colors, out_t=None, gap=64, base=WHITE):
    d = ImageDraw.Draw(over)
    f = font(FONT, size)
    fade = 1.0 if out_t is None else 1 - clamp((t - out_t) / .25)
    if fade <= 0: return
    for li, words in enumerate(lines):
        total = sum(f.getlength(w) for w, _ in words) + f.getlength(" ") * (len(words) - 1)
        x = (W * S - total) / 2; y = P(y0 + li * gap)
        for w, tw in words:
            if t >= tw:
                p = ease_out((t - tw) / .22)
                col = colors.get(w, base)
                d.text((x, y + P(10) * (1 - p)), w, font=f, fill=col + (int(255 * p * fade),), anchor="lm")
            x += f.getlength(w) + f.getlength(" ")

def draw_labels(d, t):
    a = int(255 * clamp(t / .6) * .5)
    d.text((P(CX), P(GROUND + 52)), "A R U S   K A S   W A R U N G", font=font(FONT, 12), fill=(110, 116, 132, a), anchor="mm")
    f = font(FONT, 15)
    if t > 2.9:
        d.text((P(CX), P(372)), "O M Z E T  \u2191".replace("\u2191", ""), font=f, fill=WHITE + (int(255 * clamp((t - 2.9) / .4)),), anchor="mm")
    for i, (t0, label, side, y) in enumerate(LEAKS):
        if t < t0: continue
        _, _, lx = leak_geo(i)
        al = int(255 * clamp((t - t0 - .5) / .3))
        d.text((P(lx), P(GROUND + 22)), label, font=f, fill=(255, 150, 120, al), anchor="mm")

# ------------------------------------------------------------ frame
def frame(i):
    t = i / FPS
    img = BG.copy().convert("RGBA")
    d = ImageDraw.Draw(img)
    draw_jar(img, d, t)
    draw_blocks(d, t)
    draw_man(d, t)
    over = Image.new("RGBA", img.size, (0, 0, 0, 0))
    od = ImageDraw.Draw(over)
    draw_labels(od, t)
    draw_words(over, [HOOK[:4], HOOK[4:]], t, 250, 44, {}, HOOK_OUT)
    draw_words(over, [B_WORDS[:2], B_WORDS[2:]], t, 250, 44, {"nol.": AMBER}, B_OUT)
    draw_words(over, [C_WORDS], t, 270, 52, {"untung.": AMBER})
    if t >= C_SUB:
        draw_words(over, [[("Catat dulu, baru senang.", C_SUB)]], t, 345, 30, {}, None, base=GRAY)
    img.alpha_composite(over)
    fadein = clamp(t / .35)
    out = img.convert("RGB")
    if fadein < 1: out = Image.blend(Image.new("RGB", out.size, (10, 12, 18)), out, fadein)
    return out.resize((W, H), Image.LANCZOS).tobytes()

# ------------------------------------------------------------ audio (SFX + bgm)
SR = 44100
N = int(SR * DUR)
rng = np.random.default_rng(11)
def tt(d): return np.arange(int(d * SR)) / SR
def fil(x, kind, fc):
    X = np.fft.rfft(x); f = np.fft.rfftfreq(len(x), 1 / SR); f[0] = 1e-6
    Hh = 1 / np.sqrt(1 + (f / fc) ** 4) if kind == "lp" else 1 / np.sqrt(1 + (fc / f) ** 4)
    return np.fft.irfft(X * Hh, len(x))
def put(buf, x, t0, vol=1.0):
    i = int(t0 * SR)
    if i >= len(buf): return
    x = x[:len(buf) - i]; buf[i:i + len(x)] += x * vol
def sine(f, d, dec, amp=1.0):
    t = tt(d); return amp * np.sin(2 * np.pi * f * t) * np.exp(-t / dec) * np.minimum(1, t / .003)
def sweep(f0, f1, d, dec, amp=1.0):
    t = tt(d); f = f0 * (f1 / f0) ** (t / d); ph = 2 * np.pi * np.cumsum(f) / SR
    return amp * np.sin(ph) * np.exp(-t / dec) * np.minimum(1, t / .003)

def s_tick(): return sine(1500, .05, .012, .5) + np.pad(sine(2250, .04, .008, .2), (0, int(.01 * SR)))
def s_whoosh():
    d = .28; t = tt(d); n = rng.standard_normal(len(t))
    n = fil(fil(n, "hp", 700), "lp", 3500)
    return n * np.sin(np.pi * t / d) ** 2 * .35
def _coin2():
    x = np.zeros(int(.6 * SR)); x[int(.07 * SR):] += sine(1760, .53, .16, .55); return x
def s_thunk():
    n = fil(rng.standard_normal(int(.05 * SR)), "lp", 900) * np.exp(-tt(.05) / .01) * .5
    x = sweep(210, 75, .22, .07, .9); x[:len(n)] += n; return x
def s_impact():
    x = sweep(90, 38, .7, .22, 1.0); n = fil(rng.standard_normal(int(.3 * SR)), "lp", 700) * np.exp(-tt(.3) / .06) * .5
    x[:len(n)] += n; return x
def _note(f0, f1, d, dec):
    t = tt(d); f = np.linspace(f0, f1, len(t)) * (1 + .006 * np.sin(2 * np.pi * 5.5 * t)); ph = 2 * np.pi * np.cumsum(f) / SR
    x = np.sin(ph) + .5 * np.sin(2 * ph) + .33 * np.sin(3 * ph) + .2 * np.sin(4 * ph)
    return fil(x, "lp", 1400) * np.exp(-t / dec) * np.minimum(1, t / .02) * .5
def s_womp():
    x = np.zeros(int(1.2 * SR)); a = _note(233, 220, .42, .4); b = _note(196, 130, .75, .45)
    x[:len(a)] += a; x[int(.42 * SR):int(.42 * SR) + len(b)] += b; return x * .9
def s_chime():
    x = np.zeros(int(1.6 * SR))
    for k, f in enumerate((659.3, 880, 1318.5)):
        s = sine(f, 1.5, .5, .4); x[int(k * .09 * SR):int(k * .09 * SR) + len(s)] += s[:len(x) - int(k * .09 * SR)]
    return x

SFX = dict(tick=s_tick, whoosh=s_whoosh, coin=_coin2, thunk=s_thunk, impact=s_impact, womp=s_womp, chime=s_chime)

def cues():
    c = []
    for _, tw in HOOK + B_WORDS + C_WORDS: c.append((tw, "tick", .45))
    c.append((C_SUB, "tick", .35))
    c += [(2.9, "whoosh", .5)]
    k = 3.4
    while k < 10.3: c.append((k, "coin", .22)); k += .33
    for t0, *_ in LEAKS:
        c += [(t0 - .02, "whoosh", .5), (t0, "thunk", .8)]
    c += [(JAR_ZERO, "impact", .8), (JAR_ZERO + .05, "womp", .75), (C_WORDS[0][1] - .05, "chime", .6)]
    return c

def bgm():
    out = np.zeros(N); beat = .6
    chords = [(57, 60, 64), (53, 57, 60), (48, 52, 55), (55, 59, 62)]
    mf = lambda m: 440 * 2 ** ((m - 69) / 12)
    bar = beat * 4; i = 0; t0 = .0
    while t0 < DUR:
        ch = chords[i % 4]; t = tt(bar + .6)
        e = np.minimum(1, t / .5) * np.exp(-np.maximum(0, t - bar) / .25)
        pad = sum(np.sin(2 * np.pi * mf(m + 12) * t) + .4 * np.sin(2 * np.pi * mf(m + 12) * 1.004 * t) for m in ch) * e * .035
        put(out, pad, t0)
        put(out, sine(mf(ch[0] - 12), beat * 1.8, .5, .22), t0)
        for b in range(4):
            tk = t0 + b * beat
            h = fil(rng.standard_normal(int(.03 * SR)), "hp", 6000) * np.exp(-tt(.03) / .008) * .06
            put(out, h, tk + beat / 2)
            if b in (0, 2): put(out, sweep(120, 50, .25, .08, .3), tk)
        t0 += bar; i += 1
    return out

def build_audio(path):
    sf = np.zeros(N)
    for t0, name, vol in cues(): put(sf, SFX[name](), t0, vol)
    mix = bgm() * .7 + sf
    n = np.arange(N) / SR
    mix *= np.minimum(1, n / .2) * np.minimum(1, (DUR - n) / 1.2)
    mix = np.tanh(mix * 1.2); mix = mix / np.max(np.abs(mix)) * .89
    st = np.repeat((mix * 32767).astype("<i2")[:, None], 2, axis=1)
    with wave.open(path, "wb") as w:
        w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR); w.writeframes(st.tobytes())

# ------------------------------------------------------------ main
def main():
    out = os.path.abspath(sys.argv[1] if len(sys.argv) > 1 else "contoh-omzet-rame-kas-kosong.mp4")
    wav = out.replace(".mp4", ".wav")
    build_audio(wav)
    nf = int(DUR * FPS)
    cmd = ["ffmpeg", "-v", "error", "-y", "-f", "rawvideo", "-pix_fmt", "rgb24", "-s", f"{W}x{H}", "-r", str(FPS), "-i", "-",
           "-i", wav, "-c:v", "libx264", "-pix_fmt", "yuv420p", "-crf", "18", "-c:a", "aac", "-b:a", "192k", "-shortest", out]
    pr = subprocess.Popen(cmd, stdin=subprocess.PIPE)
    with Pool(4) as pool:
        for k, fr in enumerate(pool.imap(frame, range(nf), chunksize=6)):
            pr.stdin.write(fr)
            if k % 60 == 0: print("frame", k, "/", nf, flush=True)
    pr.stdin.close(); pr.wait(); os.remove(wav)
    print("selesai:", out)

if __name__ == "__main__":
    main()

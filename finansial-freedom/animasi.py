#!/usr/bin/env python3
"""Buat 100 video animasi pendek (720x1280) dari konten.txt + adegan.txt, dengan SFX.
Enam tipe visual: leak (ember bocor), burden (beban menumpuk), scale (timbangan),
lines (dua grafik garis), glow (cahaya hangat), bars (batang bandingan).
  python3 animasi.py 1 5        # render nomor 1..5
  python3 animasi.py all        # semua yang belum ada
Hasil: video/NNN.mp4"""
import math, os, re, subprocess, sys, wave
from multiprocessing import Pool
import numpy as np
from PIL import Image, ImageDraw, ImageFont, ImageFilter

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, os.path.join(HERE, "..", "cerita-uang"))
import buat_video as bv
from buat_video import (W, H, FPS, S, P, GROUND, INK, CREAM, AMBER, WHITE, GRAY, FONT, FONT_BLACK, SR, SFX,
                        clamp, lerp, ease_out, ease_in, back, rrect, line, limb, font, put, rng)

BG_RGBA = bv.BG.convert("RGBA")
SLATE, SLATE_D = (106, 120, 148), (30, 36, 52)
RED = (255, 150, 120)

def rnd(k): return (math.sin(k * 12.9898) * 43758.5453) % 1

# ------------------------------------------------------------------ data
def load_items():
    cat, items = None, []
    for l in open(os.path.join(HERE, "konten.txt"), encoding="utf8"):
        l = l.rstrip("\n")
        if not l.strip(): continue
        if l.startswith("## "): cat = l[3:]; continue
        hook, isi, key = l.split("|"); items.append(dict(kategori=cat, hook=hook, isi=isi, kunci=key))
    scenes = [l.strip() for l in open(os.path.join(HERE, "adegan.txt"), encoding="utf8") if l.strip()]
    assert len(items) == len(scenes) == 100, (len(items), len(scenes))
    for it, sc in zip(items, scenes):
        typ, rest = sc.split(":", 1)
        it["tipe"] = typ.rstrip("+"); it["positif"] = typ.endswith("+") or typ == "glow"; it["spec"] = rest
    return items

def wrap_words(words, size, maxw):
    f = font(FONT, size); sp = f.getlength(" "); lines, cur, w = [], [], 0
    for item in words:
        wl = f.getlength(item[0])
        if cur and w + sp + wl > P(maxw): lines.append(cur); cur, w = [item], wl
        else: w = w + (sp if cur else 0) + wl; cur.append(item)
    if cur: lines.append(cur)
    return lines

class Video:
    def __init__(self, n, it):
        self.n, self.it, self.typ, self.pos = n, it, it["tipe"], it["positif"]
        spec = it["spec"]
        if self.typ == "scale":
            l, r = spec.split("|"); self.left, self.right = l.split(","), r.split(",")
            self.labels = self.left + self.right
        elif self.typ == "lines":
            self.labels = spec.split("|")
        elif self.typ == "bars":
            self.labels, self.vals = [], []
            for x in spec.split(","): a, b = x.rsplit("=", 1); self.labels.append(a); self.vals.append(float(b))
        else:
            self.labels = spec.split(",")
        # hook
        hw = it["hook"].split(" "); gap = min(.26, 2.2 / len(hw)); s = it["hook"].find(it["kunci"]); e = s + len(it["kunci"]); pos = 0; hook = []
        for i, w in enumerate(hw):
            a = pos; b = pos + len(w); pos = b + 1
            hook.append((w, .4 + i * gap, AMBER if (a < e and b > s) else WHITE))
        self.hook_lines = wrap_words(hook, 46, 600); self.hook_out = max(hook[-1][1] + 1.0, 3.1)
        # visual
        n_ev = {"lines": 2, "glow": len(self.labels)}.get(self.typ, len(self.labels))
        self.n_ev = n_ev; self.step = clamp(5.6 / n_ev, .9, 1.5); self.E0 = max(3.9, self.hook_out + .3)
        self.E = [self.E0 + k * self.step for k in range(n_ev)]
        if self.typ == "lines": self.E = [self.E0, self.E0 + .6]; self.tr = self.E0 + 6.4
        else: self.tr = self.E[-1] + .9
        self.tc = self.tr + .9
        # penutup (isi)
        sents = re.split(r"(?<=[.!?])\s+", it["isi"].strip()); words = []; t = self.tc
        for si, sent in enumerate(sents):
            col = AMBER if (len(sents) > 1 and si == len(sents) - 1) else WHITE
            for w in sent.split(" "): words.append((w, t, col)); t += .21
        self.isi_lines = wrap_words(words, 38, 600); self.last_word = words[-1][1]
        self.dur = self.last_word + 1.8
        self.manx = 360 if self.typ == "burden" else 100

# ------------------------------------------------------------------ util gambar
def chip(d, cx, cy, text, size=17, fill=SLATE, edge=SLATE_D, col=WHITE, w=None):
    f = font(FONT, size); tw = f.getlength(text) / S; w = w or tw + 34
    rrect(d, (cx - w / 2, cy - 19, cx + w / 2, cy + 19), 10, fill, edge, 3)
    d.text((P(cx), P(cy)), text, font=f, fill=col, anchor="mm")

def coin(d, x, y, r=8):
    d.ellipse([P(x - r), P(y - r), P(x + r), P(y + r)], fill=(250, 190, 50), outline=(150, 96, 20), width=P(2))
    d.ellipse([P(x - r / 2), P(y - r / 2), P(x + r / 2), P(y + r / 2)], outline=(255, 226, 130), width=P(1.5))

def fall(t, t0, dur=.4, height=260):
    """kembalikan (offset_y, squash) untuk benda yang jatuh mulai t0."""
    p = (t - t0) / dur
    if p < 0: return None
    if p < 1: return -height * (1 - ease_in(p)), 1.0
    q = (t - t0 - dur) / .14
    return 0, (1 - .13 * math.sin(math.pi * clamp(q)) if q < 1 else 1.0)

# ------------------------------------------------------------------ tipe visual
def t_leak(img, d, t, V):
    n = len(V.labels); E = V.E
    CX, TOP, BOT, HT, HB = 400, 650, 860, 88, 68
    hw = lambda y: lerp(HT, HB, (y - TOP) / (BOT - TOP))
    Ti = E[0] - .5
    done = t >= V.tr
    edge = AMBER if done else (128, 142, 172)
    body = [(CX - HT, TOP), (CX + HT, TOP), (CX + HB, BOT), (CX - HB, BOT)]
    d.polygon([(P(x), P(y)) for x, y in body], fill=(34, 42, 60))
    ph = 0 if t < Ti else max(0, 40 * ease_out((t - Ti) / .8) * (1 - clamp((t - E[0]) / (V.tr - E[0]))))
    if ph > 1: rrect(d, (CX - HB + 5, BOT - 4 - ph, CX + HB - 5, BOT - 4), 6, (232, 170, 52))
    ka = clamp((t - Ti + .4) / .4)
    if ka > 0:
        d.polygon([(P(CX - 50), P(545)), (P(CX + 50), P(545)), (P(CX + 13), P(608)), (P(CX - 13), P(608))], fill=(88, 102, 132), outline=INK)
        d.polygon([(P(CX - 13), P(608)), (P(CX + 13), P(608)), (P(CX + 13), P(625)), (P(CX - 13), P(625))], fill=(88, 102, 132))
        d.text((P(CX), P(520)), "U A N G   M A S U K", font=font(FONT, 14), fill=WHITE + (int(255 * ka),), anchor="mm")
    for start, rate in ((Ti, .08), (Ti + 2.6, .05)):
        for k in range(400):
            ts = start + k * rate
            if t < ts: break
            a = t - ts; y = 625 + 640 * a
            if y > BOT - 6 - ph or a > 1.6: continue
            coin(d, CX + (rnd(k + start) - .5) * 22, y)
    line(d, body + [body[0]], 5, edge)
    R = [545, 615, 680]; L = [275, 195]; ri = li = 0
    for i, lab in enumerate(V.labels):
        side = "R" if i % 2 == 0 else "L"
        y = lerp(TOP + 45, BOT - 35, i / (n - 1)) if n > 1 else 760
        lx = R[ri % 3] if side == "R" else L[li % 2]
        if side == "R": ri += 1
        else: li += 1
        hx = CX + (hw(y) if side == "R" else -hw(y))
        if t < E[i]: continue
        s = back((t - E[i]) / .25); r = 9 * max(s, .01)
        d.ellipse([P(hx - r), P(y - r), P(hx + r), P(y + r)], fill=INK, outline=(255, 120, 90), width=P(2))
        drop = GROUND - 10 - y; g = 1800.; T = math.sqrt(2 * drop / g); vx = (lx - hx) / T
        for k in range(200):
            ts = E[i] + k * .2
            if t < ts: break
            a = t - ts
            if a > T: continue
            coin(d, hx + vx * a, y + .5 * g * a * a, 7)
        al = int(255 * clamp((t - E[i] - .5) / .3))
        d.text((P(lx), P(GROUND + 22)), lab, font=font(FONT, 14), fill=RED + (al,), anchor="mm")
    if done:
        s = back((t - V.tr) / .35)
        d.text((P(CX), P(735)), "Rp 0", font=font(FONT_BLACK, 50 * max(s, .01)), fill=AMBER, anchor="mm")

def t_burden(img, d, t, V):
    n = len(V.labels); E = V.E; x0 = V.manx
    base = burden_base(t, V)
    for i, lab in enumerate(V.labels):
        f = fall(t, E[i], .4, 240)
        if f is None: continue
        dy, sq = f
        cx = x0 + (rnd(i + V.n) - .5) * 14; cy = base - 24 - i * 46 + dy
        last = i == n - 1
        h = 40 * sq; bottom = cy + 20
        rrect(d, (cx - 80, bottom - h, cx + 80, bottom), 10, SLATE if not last else (122, 104, 70), SLATE_D if not last else (60, 44, 20), 3)
        if sq > .97: d.text((P(cx), P(cy)), lab, font=font(FONT, 18), fill=WHITE, anchor="mm")

def burden_squat(t, V):
    landed = sum(1 for e in V.E if t >= e + .4)
    return landed / len(V.E)

def burden_base(t, V): return 627 + burden_squat(t, V) * 26

def t_scale(img, d, t, V):
    nl, nr = len(V.left), len(V.right); E = V.E
    cl = sum(1 for k in range(nl) if t >= E[k] + .3); cr = sum(1 for k in range(nr) if t >= E[nl + k] + .3)
    target = clamp((cr - cl) * 9, -18, 18); ang = math.radians(target * ease_out((t - E[0]) / .8)) if t > E[0] else 0
    px, py, arm = 360, 640, 170
    line(d, [(px, GROUND - 4), (px, py)], 12, (70, 80, 104))
    d.polygon([(P(px - 50), P(GROUND - 4)), (P(px + 50), P(GROUND - 4)), (P(px + 28), P(GROUND - 26)), (P(px - 28), P(GROUND - 26))], fill=(70, 80, 104))
    ex = lambda s: (px + s * arm * math.cos(ang), py + s * arm * math.sin(ang))
    line(d, [ex(-1), ex(1)], 10, (150, 160, 186))
    d.ellipse([P(px - 11), P(py - 11), P(px + 11), P(py + 11)], fill=AMBER)
    for s, items, off in ((-1, V.left, 0), (1, V.right, nl)):
        bx, by = ex(s); pan_y = by + 84
        line(d, [(bx, by), (bx - 62, pan_y)], 3, (110, 120, 146)); line(d, [(bx, by), (bx + 62, pan_y)], 3, (110, 120, 146))
        line(d, [(bx - 70, pan_y), (bx + 70, pan_y)], 8, (150, 160, 186))
        for k, lab in enumerate(items):
            f = fall(t, E[off + k], .35, 200)
            if f is None: continue
            dy, sq = f; cy = pan_y - 24 - k * 40 + dy; h = 34 * sq
            rrect(d, (bx - 62, cy + 17 - h, bx + 62, cy + 17), 9, SLATE if s < 0 else (122, 104, 70), SLATE_D if s < 0 else (60, 44, 20), 3)
            if sq > .97: d.text((P(bx), P(cy)), lab, font=font(FONT, 15), fill=WHITE, anchor="mm")

def t_lines(img, d, t, V):
    x0, x1, yb, yt = 190, 640, 840, 480
    line(d, [(x0, yt - 20), (x0, yb), (x1 + 20, yb)], 3, (74, 82, 104))
    p = clamp((t - V.E0) / 6.0)
    pa = clamp((t - V.E[0]) / 6.0); pb = clamp((t - V.E[1]) / 5.6)
    pts = lambda k, amp, pw: [(x0 + (x1 - x0) * u, yb - amp * (u ** pw)) for u in [i / 40 * k for i in range(41)]]
    lineB = pts(pb, 110, .9); lineA = pts(pa, 330, 1.7)
    if pb > .01 and len(lineB) > 1: line(d, lineB, 8, (200, 206, 224))
    if pa > .01 and len(lineA) > 1: line(d, lineA, 8, AMBER)
    if pa > .01:
        ax, ay = lineA[-1]; d.ellipse([P(ax - 9), P(ay - 9), P(ax + 9), P(ay + 9)], fill=AMBER)
        d.text((P(min(ax, 600)), P(ay - 34)), V.labels[0], font=font(FONT, 20), fill=AMBER, anchor="mm")
    if pb > .01:
        bx, by = lineB[-1]; d.ellipse([P(bx - 9), P(by - 9), P(bx + 9), P(by + 9)], fill=(200, 206, 224)); d.text((P(min(bx, 600)), P(by + 34)), V.labels[1], font=font(FONT, 20), fill=(200, 206, 224), anchor="mm")
    if pa > .99 and pb > .99:
        ax, ay = lineA[-1]; bx, by = lineB[-1]; a = int(255 * clamp((t - V.E[0] - 6.0) / .4))
        d.line([(P(x1 + 24), P(ay)), (P(x1 + 24), P(by))], fill=AMBER + (a,) if False else AMBER, width=P(3))

def t_glow(img, d, t, V):
    n = len(V.labels); E = V.E; cx, cy = 400, 715
    k = sum(1 for e in E if t >= e)
    r = 34 + 16 * k + (10 if t >= V.tr else 0) + 3 * math.sin(t * 4)
    spr = glow_sprite(); size = int(2 * r * 3.2 * S); g = spr.resize((size, size), Image.BILINEAR)
    img.alpha_composite(g, (P(cx) - size // 2, P(cy) - size // 2))
    pos = [(-150, -105), (150, -105), (0, -190), (0, 165)]
    for i, lab in enumerate(V.labels):
        if t < E[i]: continue
        s = back((t - E[i]) / .3); px, py = cx + pos[i][0], cy + pos[i][1]
        line(d, [(cx, cy), (lerp(cx, px, clamp(s)), lerp(cy, py, clamp(s)))], 3, (214, 160, 60))
    d.ellipse([P(cx - r), P(cy - r), P(cx + r), P(cy + r)], fill=(255, 196, 80), outline=(255, 232, 160), width=P(4))
    for i, lab in enumerate(V.labels):
        if t < E[i]: continue
        s = back((t - E[i]) / .3); px, py = cx + pos[i][0], cy + pos[i][1]
        if s > .5: chip(d, px, py, lab, 18, (70, 60, 40), (240, 170, 40), WHITE)

_gs = None
def glow_sprite():
    global _gs
    if _gs is None:
        n = 220; yy, xx = np.mgrid[0:n, 0:n].astype(np.float32); rr = np.hypot(xx - n / 2, yy - n / 2) / (n / 2)
        a = np.clip(1 - rr, 0, 1) ** 2.2 * 190
        arr = np.zeros((n, n, 4), np.uint8); arr[..., 0] = 255; arr[..., 1] = 176; arr[..., 2] = 50; arr[..., 3] = a.astype(np.uint8)
        _gs = Image.fromarray(arr, "RGBA")
    return _gs

def t_bars(img, d, t, V):
    n = len(V.labels); E = V.E; x0, wmax = 190, 470
    for i, (lab, v) in enumerate(zip(V.labels, V.vals)):
        if t < E[i]: continue
        y = 520 + i * (330 / n); k = ease_out((t - E[i]) / .8); a = int(255 * clamp((t - E[i]) / .3))
        last = i == n - 1
        d.text((P(x0), P(y)), lab, font=font(FONT, 20), fill=(AMBER if last else WHITE) + (a,), anchor="lm")
        rrect(d, (x0, y + 14, x0 + wmax, y + 42), 9, (28, 34, 50))
        w = max(10, wmax * v / 100 * k)
        rrect(d, (x0, y + 14, x0 + w, y + 42), 9, AMBER if last else SLATE)

TIPE = dict(leak=t_leak, burden=t_burden, scale=t_scale, lines=t_lines, glow=t_glow, bars=t_bars)

# ------------------------------------------------------------------ stickman
def bump(t, t0):
    u = t - t0
    if u < 0 or u > .9: return 0.
    return ease_out(u / .2) if u < .5 else 1 - ease_in((u - .5) / .4)

def draw_man(d, t, V):
    x = V.manx; typ = V.typ
    g = 0. if typ in ("burden", "glow") else max(bump(t, e - .1) for e in V.E)
    after = ease_out((t - V.tr - .1) / .35) if t > V.tr else 0
    squat = burden_squat(t, V) if typ == "burden" else 0
    sway = math.sin(t * 2.2) * 1.6
    dy = squat * 26
    hip, sh = (x + sway * .3, 780 + dy * .55), (x + sway * .6, 700 + dy)
    head = (sh[0] + sway * .4, 662 + dy + 1.5 * math.sin(t * 4))
    def arm(a1, a2, la=36, lb=34):
        e = (sh[0] + math.sin(math.radians(a1)) * la, sh[1] + math.cos(math.radians(a1)) * la)
        h = (e[0] + math.sin(math.radians(a2)) * lb, e[1] + math.cos(math.radians(a2)) * lb)
        return [sh, e, h]
    kn = squat * 14
    limb(d, [hip, (hip[0] - 9 - kn, (hip[1] + GROUND) / 2), (hip[0] - 10 + sway * .2, GROUND - 5)], 10)
    limb(d, [hip, (hip[0] + 9 + kn, (hip[1] + GROUND) / 2), (hip[0] + 10, GROUND - 5)], 10)
    if typ == "burden": up = ease_out((t - V.E[0] + .3) / .5); la1, la2, ra1, ra2 = lerp(-8, -150, up), lerp(-4, -175, up), lerp(8, 150, up), lerp(5, 175, up)
    elif V.pos: la1, la2 = lerp(-8, -150, after), lerp(-4, -172, after); ra1, ra2 = lerp(lerp(8, 100, g), 150, after), lerp(lerp(5, 118, g), 172, after)
    else: la1, la2 = lerp(-8, -42, after), lerp(-4, -140, after); ra1, ra2 = lerp(lerp(8, 100, g), 42, after), lerp(lerp(5, 118, g), 140, after)
    limb(d, arm(la1 + sway, la2 + sway), 9); limb(d, [sh, hip], 11); limb(d, arm(ra1 + sway, ra2 + sway), 9)
    r = 27
    d.ellipse([P(head[0] - r - 3), P(head[1] - r - 3), P(head[0] + r + 3), P(head[1] + r + 3)], fill=INK)
    d.ellipse([P(head[0] - r), P(head[1] - r), P(head[0] + r), P(head[1] + r)], fill=CREAM)
    if t > V.tr + .6 and typ != "burden":
        s = back((t - V.tr - .6) / .3)
        d.text((P(head[0] + 40), P(head[1] - 48)), "!" if V.pos else "?", font=font(FONT_BLACK, 46 * max(s, .01)), fill=AMBER, anchor="mm")

# ------------------------------------------------------------------ caption
def draw_cap(over, lines, t, y0, size, lh, out_t=None):
    d = ImageDraw.Draw(over); f = font(FONT, size)
    fade = 1.0 if out_t is None else 1 - clamp((t - out_t) / .25)
    if fade <= 0: return
    for li, ln in enumerate(lines):
        sp = f.getlength(" "); tw = sum(f.getlength(w) for w, _, _ in ln) + sp * (len(ln) - 1)
        x = (W * S - tw) / 2; y = P(y0 + li * lh)
        for w, tw0, col in ln:
            if t >= tw0:
                p = ease_out((t - tw0) / .22)
                d.text((x, y + P(10) * (1 - p)), w, font=f, fill=col + (int(255 * p * fade),), anchor="lm")
            x += f.getlength(w) + sp

CUR = None
def frame(i):
    V = CUR; t = i / FPS
    img = BG_RGBA.copy(); d = ImageDraw.Draw(img)
    TIPE[V.typ](img, d, t, V); draw_man(d, t, V)
    dim = .6 * clamp((t - V.tc) / .4)
    if dim > 0: img = Image.blend(BG_RGBA, img, 1 - dim)
    over = Image.new("RGBA", img.size, (0, 0, 0, 0)); od = ImageDraw.Draw(over)
    a = int(255 * clamp(t / .6) * .45)
    od.text((P(360), P(GROUND + 52)), "F I N A N S I A L   F R E E D O M", font=font(FONT, 12), fill=(110, 116, 132, a), anchor="mm")
    draw_cap(over, V.hook_lines, t, 215, 46, 62, V.hook_out)
    draw_cap(over, V.isi_lines, t, 240, 38, 54)
    img.alpha_composite(over)
    out = img.convert("RGB")
    if t < .35: out = Image.blend(Image.new("RGB", out.size, (10, 12, 18)), out, clamp(t / .35))
    return out.resize((W, H), Image.LANCZOS).tobytes()

# ------------------------------------------------------------------ audio
def cues(V):
    c = []
    for ln in V.hook_lines:
        for w, tw, _ in ln: c.append((tw, "tick", .45))
    for ln in V.isi_lines:
        for w, tw, _ in ln: c.append((tw, "tick", .3))
    E = V.E
    if V.typ == "leak":
        k = E[0] - .5
        while k < V.tr: c.append((k, "coin", .2)); k += .33
        for e in E: c += [(e - .02, "whoosh", .5), (e, "thunk", .8)]
    elif V.typ in ("burden", "scale"):
        for e in E: c += [(e - .02, "whoosh", .45), (e + (.4 if V.typ == "burden" else .35), "thunk", .8)]
    elif V.typ == "bars":
        for e in E: c += [(e, "whoosh", .4), (e + .3, "coin", .35)]
    elif V.typ == "lines":
        k = E[0]
        while k < E[0] + 6: c.append((k, "coin", .22)); k += .4
        c += [(E[0], "whoosh", .5), (E[1], "whoosh", .4)]
    elif V.typ == "glow":
        for i, e in enumerate(E): c += [(e, "whoosh", .4), (e + .12, "coin" if i % 2 else "chime", .5)]
    if V.pos: c += [(V.tr, "chime", .7)]
    else: c += [(V.tr, "impact", .8), (V.tr + .05, "womp", .75)]
    return c

def build_audio(V, path):
    N = int(SR * V.dur); bv.N = N; bv.DUR = V.dur
    sf = np.zeros(N)
    for t0, name, vol in cues(V): put(sf, SFX[name](), t0, vol)
    mix = bv.bgm() * .7 + sf; n = np.arange(N) / SR
    mix *= np.minimum(1, n / .2) * np.minimum(1, (V.dur - n) / 1.2)
    mix = np.tanh(mix * 1.2); mix = mix / np.max(np.abs(mix)) * .89
    st = np.repeat((mix * 32767).astype("<i2")[:, None], 2, axis=1)
    with wave.open(path, "wb") as w:
        w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR); w.writeframes(st.tobytes())

def render(n, items, outdir):
    global CUR
    V = Video(n, items[n - 1]); CUR = V
    out = os.path.join(outdir, f"{n:03d}.mp4"); wav = out.replace(".mp4", ".wav")
    build_audio(V, wav)
    nf = int(V.dur * FPS)
    cmd = ["ffmpeg", "-v", "error", "-y", "-f", "rawvideo", "-pix_fmt", "rgb24", "-s", f"{W}x{H}", "-r", str(FPS), "-i", "-", "-i", wav,
           "-c:v", "libx264", "-pix_fmt", "yuv420p", "-crf", "20", "-c:a", "aac", "-b:a", "160k", "-shortest", out]
    pr = subprocess.Popen(cmd, stdin=subprocess.PIPE)
    with Pool(4) as pool:
        for fr in pool.imap(frame, range(nf), chunksize=6): pr.stdin.write(fr)
    pr.stdin.close(); pr.wait(); os.remove(wav)
    print(f"{n:03d} {V.typ:6s} {V.dur:5.1f}s {it_title(items[n-1])}", flush=True)

def it_title(it): return it["hook"][:50]

def main():
    items = load_items(); outdir = os.path.join(HERE, "video"); os.makedirs(outdir, exist_ok=True)
    a = sys.argv[1:] or ["all"]
    nums = range(1, 101) if a[0] == "all" else (range(int(a[0]), int(a[-1]) + 1) if len(a) > 1 else [int(a[0])])
    for n in nums:
        if os.path.exists(os.path.join(outdir, f"{n:03d}.mp4")) and a[0] == "all": continue
        render(n, items, outdir)

if __name__ == "__main__":
    main()

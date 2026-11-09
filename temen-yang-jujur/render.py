#!/usr/bin/env python3
"""Render animasi 2D 'Temen yang Selalu Support (tapi Jujur)' -> MP4 (960x720, 24fps).

Pakai:  python3 render.py <out.mp4> [work_dir]
Butuh:  Pillow, numpy, ffmpeg
"""
import math, os, sys, subprocess, wave, shutil
from multiprocessing import Pool
import numpy as np
from PIL import Image, ImageDraw, ImageFont, ImageFilter

W, H, FPS, S = 960, 720, 24, 2          # S = supersampling
INK = (28, 28, 34)
SKIN = (255, 248, 240)
import importlib
EP = importlib.import_module("episodes." + os.environ.get("EPISODE", "ep1"))
CAPTION, SEQS = EP.CAPTION, EP.SEQS

FB = "/usr/share/fonts/truetype/liberation/LiberationSans-Bold.ttf"
FDJ = "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf"

# ------------------------------------------------------------------ naskah
RAKA = dict(name="Raka", shirt=(78, 124, 196), pants=(86, 120, 170), hair=(24, 24, 28), glasses=True, pitch=235)
BIMA = dict(name="Bima", shirt=(34, 34, 40), pants=(86, 120, 170), hair=(24, 24, 28), glasses=False, pitch=165)
CH = {"raka": RAKA, "bima": BIMA}

LINE_MIN, PER_CHAR, GAP = 1.3, 0.06, 0.12
SPECIAL = {"ride": 3.4, "credits": 5.0}

VOICE_DIR = os.environ.get("VOICE_DIR", os.path.join(os.path.dirname(os.path.abspath(__file__)), EP.VOICE_SUBDIR))

def voice_file(idx, who):
    p = os.path.join(VOICE_DIR, f"{idx:03d}_{who}.mp3")
    return p if os.path.exists(p) else None

def audio_len(path):
    out = subprocess.run(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", path],
                         capture_output=True, text=True).stdout.strip()
    return float(out)

def build_timeline():
    tl, t, idx = [], 0.0, 0
    for seq, lines in SEQS:
        for who, text, view in lines:
            vf = voice_file(idx, who) if who and view != "narr" and text else None
            vlen = audio_len(vf) if vf else None
            if vlen:
                d = max(0.9, vlen + 0.06 + GAP)
            elif view == "narr":
                d = max(2.0, 0.8 + 0.055 * len(text))
            else:
                d = SPECIAL.get(view, max(LINE_MIN, 0.5 + PER_CHAR * len(text)) + GAP)
            tl.append(dict(seq=seq, who=who, text=text, view=view, t0=t, t1=t + d, voice=vf, vlen=vlen))
            t += d
            idx += 1
    return tl, t

TL, TOTAL = build_timeline()
HAS_VOICE = any(e.get('voice') for e in TL)
NFRAMES = int(TOTAL * FPS)

# ------------------------------------------------------------------ util
_fonts = {}
def font(path, size):
    k = (path, size)
    if k not in _fonts:
        _fonts[k] = ImageFont.truetype(path, size)
    return _fonts[k]

def thick(d, p1, p2, w, fill):
    d.line([p1, p2], fill=fill, width=int(w))
    r = w / 2
    for p in (p1, p2):
        d.ellipse([p[0] - r, p[1] - r, p[0] + r, p[1] + r], fill=fill)

def lerp(a, b, t): return a + (b - a) * t
def clamp(v, a=0, b=1): return max(a, min(b, v))

# ------------------------------------------------------------------ latar
_bg = {}
def bushes(img, seed, base, rows):
    rnd = np.random.RandomState(seed)
    d = ImageDraw.Draw(img)
    for row, (y, rr, col) in enumerate(rows):
        for x in range(-100, W * S + 100, int(rr * 0.9)):
            yy = y + rnd.randint(-30, 30)
            c = tuple(int(v + rnd.randint(-8, 8)) for v in col)
            d.ellipse([x - rr, yy - rr, x + rr, yy + rr], fill=c)

def bg_park():
    img = Image.new("RGB", (W * S, H * S), (206, 220, 226))
    d = ImageDraw.Draw(img)
    for i in range(H * S):
        c = int(lerp(214, 190, i / (H * S)))
        d.line([(0, i), (W * S, i)], fill=(c, c + 10, c + 14))
    # tiang listrik samar
    d.rectangle([380 * S, 40 * S, 392 * S, 420 * S], fill=(150, 158, 160))
    d.rectangle([330 * S, 90 * S, 440 * S, 100 * S], fill=(150, 158, 160))
    bushes(img, 3, 0, [(430 * S, 120 * S, (90, 150, 84)), (500 * S, 110 * S, (70, 128, 70)), (560 * S, 100 * S, (58, 112, 62))])
    img = img.filter(ImageFilter.GaussianBlur(14))
    d = ImageDraw.Draw(img)
    # tanah
    d.rectangle([0, 600 * S, W * S, H * S], fill=(170, 118, 70))
    d.rectangle([0, 592 * S, W * S, 606 * S], fill=(120, 150, 90))
    # pagar hijau
    green, dark = (46, 176, 84), (30, 130, 62)
    d.rectangle([0, 150 * S, W * S, 166 * S], fill=green)
    d.rectangle([0, 330 * S, W * S, 344 * S], fill=green)
    for x in range(40, W, 150):
        d.rectangle([x * S, 90 * S, (x + 20) * S, 600 * S], fill=green)
        d.rectangle([(x + 14) * S, 90 * S, (x + 20) * S, 600 * S], fill=dark)
    return img

def bg_warung():
    img = Image.new("RGB", (W * S, H * S), (216, 210, 200))
    d = ImageDraw.Draw(img)
    d.rectangle([0, 520 * S, W * S, H * S], fill=(190, 186, 180))
    d.rectangle([0, 514 * S, W * S, 524 * S], fill=(150, 146, 140))
    for x in range(0, W, 120):
        d.line([(x * S, 0), (x * S, 514 * S)], fill=(206, 200, 190), width=3 * S)
    # papan nama
    d.rounded_rectangle([60 * S, 60 * S, 380 * S, 150 * S], 12 * S, fill=(120, 80, 54))
    d.text((220 * S, 105 * S), "WARUNG KOPI", font=font(FB, 38 * S), fill=(250, 235, 200), anchor="mm")
    return img

def draw_cart(d, x, y, sc=1.0):
    """gerobak kopi. (x,y) = titik tanah tengah."""
    X = lambda u: (x + u * sc) * S
    Y = lambda v: (y + v * sc) * S
    d.polygon([(X(-150), Y(-190)), (X(150), Y(-190)), (X(170), Y(-150)), (X(-170), Y(-150))], fill=(240, 90, 60))
    for i in range(-150, 150, 60):
        d.polygon([(X(i), Y(-190)), (X(i + 30), Y(-190)), (X(i + 35), Y(-150)), (X(i + 5), Y(-150))], fill=(255, 250, 240))
    d.rounded_rectangle([X(-140), Y(-150), X(140), Y(-50)], 10 * S, fill=(248, 190, 40), outline=INK, width=3 * S)
    d.text((X(0), Y(-100)), "KOPI FILOSOFI", font=font(FB, int(26 * sc * S)), fill=INK, anchor="mm")
    d.rectangle([X(-130), Y(-190), X(-124), Y(-50)], fill=INK)
    d.rectangle([X(124), Y(-190), X(130), Y(-50)], fill=INK)
    for wx in (-90, 90):
        d.ellipse([X(wx - 34), Y(-70), X(wx + 34), Y(-2)], fill=INK)
        d.ellipse([X(wx - 14), Y(-50), X(wx + 14), Y(-22)], fill=(200, 200, 200))

def bg_garasi():
    img = Image.new("RGB", (W * S, H * S), (205, 201, 194))
    d = ImageDraw.Draw(img)
    d.rectangle([0, 540 * S, W * S, H * S], fill=(150, 148, 144))
    d.rectangle([0, 534 * S, W * S, 546 * S], fill=(110, 108, 104))
    # pintu rolling (kiri tengah)
    d.rectangle([250 * S, 90 * S, 710 * S, 534 * S], fill=(186, 190, 196), outline=(120, 124, 130), width=4 * S)
    for y in range(100, 534, 26):
        d.line([(252 * S, y * S), (708 * S, y * S)], fill=(150, 154, 160), width=3 * S)
    # rak + kardus (kiri)
    d.rectangle([20 * S, 160 * S, 220 * S, 534 * S], fill=(122, 92, 62))
    for y in (250, 340, 430):
        d.rectangle([14 * S, y * S, 226 * S, (y + 10) * S], fill=(88, 64, 42))
    for (x, y, w_, h_) in [(36, 190, 70, 58), (118, 200, 80, 48), (40, 280, 90, 58), (140, 290, 60, 48), (30, 370, 100, 58)]:
        d.rectangle([x * S, y * S, (x + w_) * S, (y + h_) * S], fill=(196, 150, 96), outline=(120, 90, 56), width=2 * S)
    # lampu neon
    d.rounded_rectangle([320 * S, 40 * S, 640 * S, 58 * S], 8 * S, fill=(255, 252, 230))
    return img

def draw_ringlight(d, x, y, sc=1.0, on=True):
    """tripod + ring light + HP. (x,y) = titik tanah."""
    X = lambda u: (x + u * sc) * S
    Y = lambda v: (y + v * sc) * S
    for sx in (-70, 0, 70):
        thick(d, (X(0), Y(-230)), (X(sx), Y(0)), 8 * sc * S, INK)
    thick(d, (X(0), Y(-420)), (X(0), Y(-230)), 10 * sc * S, INK)
    cx, cy = 0, -520
    d.ellipse([X(cx - 120), Y(cy - 120), X(cx + 120), Y(cy + 120)], fill=(255, 250, 225) if on else (230, 230, 230), outline=INK, width=int(6 * sc * S))
    d.ellipse([X(cx - 82), Y(cy - 82), X(cx + 82), Y(cy + 82)], fill=(60, 64, 72), outline=INK, width=int(4 * sc * S))
    d.rounded_rectangle([X(cx - 26), Y(cy - 46), X(cx + 26), Y(cy + 46)], 8 * sc * S, fill=(30, 32, 38))
    d.ellipse([X(cx - 8), Y(cy - 34), X(cx + 8), Y(cy - 18)], fill=(80, 120, 200))

def bg_stairs():
    img = Image.new("RGB", (W * S, H * S), (210, 218, 214))
    d = ImageDraw.Draw(img)
    bushes(img, 5, 0, [(300 * S, 110 * S, (96, 150, 90))])
    d = ImageDraw.Draw(img)
    # dinding oranye (kiri) & tosca (kanan), perspektif
    d.polygon([(0, 150 * S), (330 * S, 300 * S), (330 * S, 520 * S), (0, 720 * S)], fill=(238, 132, 40))
    d.polygon([(960 * S, 150 * S), (630 * S, 300 * S), (630 * S, 520 * S), (960 * S, 720 * S)], fill=(28, 168, 150))
    d.polygon([(0, 150 * S), (330 * S, 300 * S), (330 * S, 330 * S), (0, 190 * S)], fill=(250, 170, 80))
    # tangga bergaris
    for i in range(14):
        a = i / 14
        y0 = lerp(520, 720, a ** 1.4)
        y1 = lerp(520, 720, ((i + 1) / 14) ** 1.4)
        xl, xr = lerp(330, 0, a ** 1.4), lerp(630, 960, a ** 1.4)
        col = (250, 210, 70) if i % 2 == 0 else (40, 170, 160)
        d.rectangle([xl * S, y0 * S, xr * S, y1 * S], fill=col)
    return img

def bg_road(offset):
    img = Image.new("RGB", (W * S, H * S), (206, 220, 226))
    bushes(img, 7, 0, [(380 * S, 110 * S, (96, 150, 92)), (460 * S, 100 * S, (70, 130, 72))])
    img = img.filter(ImageFilter.GaussianBlur(10))
    d = ImageDraw.Draw(img)
    d.rectangle([0, 470 * S, W * S, H * S], fill=(104, 106, 112))
    d.rectangle([0, 462 * S, W * S, 476 * S], fill=(170, 170, 160))
    for k in range(-1, 10):
        x = (k * 160 + offset) % (W + 160) - 160
        d.rectangle([x * S, 600 * S, (x + 90) * S, 612 * S], fill=(238, 238, 232))
    return img

def bg_dark():
    return Image.new("RGB", (W * S, H * S), (14, 14, 18))

def get_bg(name, offset=0):
    if name == "road":
        return bg_road(offset)
    if name not in _bg:
        _bg[name] = {"park": bg_park, "warung": bg_warung, "garasi": bg_garasi, "syuting": bg_garasi, "stairs": bg_stairs, "phone": bg_park, "credits": bg_dark}[name]()
    return _bg[name].copy()

# ------------------------------------------------------------------ karakter
def draw_char(d, x, y, s, cfg, t, talk=False, phone=False, helmet=False, arm_gesture=True, seated=False):
    X = lambda u: (x + u * s) * S
    Y = lambda v: (y + v * s) * S
    R = lambda r: r * s * S
    ow = max(2, int(3 * s * S / 1.5))
    bob = math.sin(t * 2.2 + cfg["pitch"]) * 2.0 * s
    y_b = y + bob
    Yb = lambda v: (y_b + v * s) * S

    if not seated:
        for side in (-1, 1):
            thick(d, (X(side * 20), Yb(-110)), (X(side * 20), Yb(-22)), R(11), INK)
            thick(d, (X(side * 20), Yb(-110)), (X(side * 20), Yb(-22)), R(7), SKIN)
            d.ellipse([X(side * 20 - 22), Yb(-26), X(side * 20 + 22), Yb(0)], fill=(250, 250, 250), outline=INK, width=ow)
        d.rounded_rectangle([X(-46), Yb(-168), X(46), Yb(-96)], R(14), fill=cfg["pants"], outline=INK, width=ow)
    d.rounded_rectangle([X(-48), Yb(-282), X(48), Yb(-150)], R(24), fill=cfg["shirt"], outline=INK, width=ow)

    # lengan
    w = 2 * math.pi * 1.4 * t
    def arm(side, th, th2):
        sh = (X(side * 46), Yb(-258))
        e = (sh[0] + side * math.sin(math.radians(th)) * 56 * s * S, sh[1] + math.cos(math.radians(th)) * 56 * s * S)
        h = (e[0] + side * math.sin(math.radians(th2)) * 52 * s * S, e[1] + math.cos(math.radians(th2)) * 52 * s * S)
        thick(d, sh, e, R(31), INK)
        thick(d, sh, e, R(25), cfg["shirt"])
        thick(d, e, h, R(11), INK)
        thick(d, e, h, R(6), SKIN)
        d.ellipse([h[0] - R(11), h[1] - R(11), h[0] + R(11), h[1] + R(11)], fill=SKIN, outline=INK, width=ow)
        return h
    arm(-1, 10 + 4 * math.sin(w * 0.5), 18)
    if phone:
        h = arm(1, 70, 172)
        d.rounded_rectangle([h[0] - R(2), h[1] - R(10), h[0] + R(20), h[1] + R(28)], R(5), fill=(40, 44, 54), outline=INK, width=ow)
    elif talk and arm_gesture:
        arm(1, 42 + 22 * math.sin(w * 1.7), 110 + 38 * math.sin(w * 1.7 + 1))
    else:
        arm(1, 10 + 4 * math.sin(w * 0.5 + 2), 18)

    # kepala
    cx, cy = 0, -332
    d.ellipse([X(cx - 60), Yb(cy - 54), X(cx + 60), Yb(cy + 54)], fill=SKIN, outline=INK, width=ow)
    for side in (-1, 1):
        d.ellipse([X(side * 60 - 8), Yb(cy - 6), X(side * 60 + 8), Yb(cy + 14)], fill=SKIN, outline=INK, width=ow)
    if not helmet:
        d.pieslice([X(cx - 63), Yb(cy - 60), X(cx + 63), Yb(cy + 52)], 188, 352, fill=cfg["hair"])
        d.polygon([(X(-52), Yb(cy - 34)), (X(-20), Yb(cy - 22)), (X(10), Yb(cy - 36)), (X(34), Yb(cy - 20)), (X(56), Yb(cy - 38)),
                   (X(52), Yb(cy - 48)), (X(-52), Yb(cy - 48))], fill=cfg["hair"])
    # mata
    blink = (t % 3.4) < 0.12
    for side in (-1, 1):
        ex, ey = side * 21, cy + 6
        ry = 1.5 if blink else 11
        d.ellipse([X(ex - 8), Yb(ey - ry), X(ex + 8), Yb(ey + ry)], fill=INK)
        if not blink:
            d.ellipse([X(ex - 3), Yb(ey - 7), X(ex + 3), Yb(ey - 1)], fill=(255, 255, 255))
        by = ey - 20 - (4 if talk else 0)
        d.line([(X(ex - 10), Yb(by + 2)), (X(ex + 10), Yb(by - 1 * side))], fill=INK, width=max(2, int(R(3))))
    if cfg["glasses"]:
        for side in (-1, 1):
            ex, ey = side * 21, cy + 6
            d.ellipse([X(ex - 20), Yb(ey - 20), X(ex + 20), Yb(ey + 20)], outline=INK, width=max(2, int(R(3))))
        d.line([(X(-1), Yb(cy + 6)), (X(1), Yb(cy + 6))], fill=INK, width=max(2, int(R(3))))
    # mulut
    my = cy + 34
    if talk and math.sin(2 * math.pi * 7.5 * t) > -0.25:
        k = 5 + 8 * abs(math.sin(2 * math.pi * 3.7 * t))
        d.ellipse([X(-12), Yb(my - k / 2), X(12), Yb(my + k)], fill=(96, 28, 36), outline=INK, width=ow)
    else:
        d.arc([X(-11), Yb(my - 8), X(11), Yb(my + 6)], 20, 160, fill=INK, width=max(2, int(R(3))))
    if helmet:
        d.pieslice([X(cx - 72), Yb(cy - 78), X(cx + 72), Yb(cy + 38)], 180, 360, fill=(176, 180, 188), outline=INK, width=ow)
        d.rectangle([X(cx - 72), Yb(cy - 20), X(cx - 56), Yb(cy + 14)], fill=(176, 180, 188), outline=INK, width=ow)
        d.rectangle([X(cx + 56), Yb(cy - 20), X(cx + 72), Yb(cy + 14)], fill=(176, 180, 188), outline=INK, width=ow)
        d.arc([X(cx - 50), Yb(cy - 40), X(cx + 50), Yb(cy + 12)], 200, 340, fill=(130, 134, 142), width=max(2, int(R(6))))

# ------------------------------------------------------------------ teks
def wrap(text, fnt, maxw, d):
    words, lines, cur = text.split(), [], ""
    for w_ in words:
        test = (cur + " " + w_).strip()
        if d.textlength(test, font=fnt) <= maxw or not cur:
            cur = test
        else:
            lines.append(cur); cur = w_
    lines.append(cur)
    return lines

def draw_sub(d, text, y=H - 70):
    if not text:
        return
    fnt = font(FDJ if "☎" in text else FB, 30 * S)
    lines = wrap(text, fnt, (W - 160) * S, d)
    for i, ln in enumerate(reversed(lines)):
        d.text((W * S / 2, (y - i * 38) * S), ln, font=fnt, fill=(255, 255, 255), anchor="mm", stroke_width=3 * S, stroke_fill=(10, 10, 12))

def draw_caption(d):
    d.multiline_text((22 * S, 18 * S), CAPTION, font=font(FB, 22 * S), fill=(255, 255, 255), stroke_width=2 * S, stroke_fill=(20, 20, 24), spacing=4 * S)

def draw_box(d, text):
    fnt = font(FB, 30 * S)
    lines = wrap(text, fnt, 560 * S, d)
    bw = max(d.textlength(l, font=fnt) for l in lines) / S + 56
    bh = 44 * len(lines) + 30
    x0 = (W - bw) / 2
    d.rounded_rectangle([x0 * S, 60 * S, (x0 + bw) * S, (60 + bh) * S], 14 * S, fill=(44, 62, 48))
    for i, ln in enumerate(lines):
        d.text((W * S / 2, (60 + 15 + 22 + i * 44) * S), ln, font=fnt, fill=(255, 255, 255), anchor="mm")

# ------------------------------------------------------------------ frame
def current(t):
    for i, e in enumerate(TL):
        if e["t0"] <= t < e["t1"]:
            return i, e
    return len(TL) - 1, TL[-1]

def render_frame(n):
    t = n / FPS
    i, e = current(t)
    lt = t - e["t0"]
    seq, view = e["seq"], e["view"]
    img = get_bg(seq if seq != "road" else "road", offset=-(t * 420))
    d = ImageDraw.Draw(img)

    who = e["who"]
    talk_end = (0.06 + e["vlen"]) if e.get("vlen") else (e["t1"] - e["t0"] - GAP * 0.8)
    talking = who is not None and view != "narr" and lt < talk_end and lt > 0.04

    def cart_here():
        draw_cart(d, 700, 640, 0.9)

    if seq in ("park", "warung", "garasi", "syuting"):
        garage = seq in ("garasi", "syuting")
        if view == "wide":
            if seq == "warung":
                draw_cart(d, 600, 650, 0.78)
            if garage:
                draw_cart(d, 860, 640, 0.5)                      # gerobak kopi ngangkrak di pojok
                draw_ringlight(d, 480, 660, 0.62, on=(seq == "syuting"))
            draw_char(d, 250 if not seq == "warung" else 200, 650, 0.9, RAKA, t, talk=(who == "raka" and talking))
            draw_char(d, 700 if not seq == "warung" else 780, 650, 0.9, BIMA, t, talk=(who == "bima" and talking))
        else:
            if seq == "warung":
                draw_cart(d, 780, 740, 1.5) if who == "raka" else draw_cart(d, 180, 740, 1.5)
            if garage:  # lingkar ring light di belakang kepala pembicara
                d.ellipse([(480 - 235) * S, (500 - 235) * S, (480 + 235) * S, (500 + 235) * S], fill=(255, 250, 225), outline=INK, width=6 * S)
                d.ellipse([(480 - 170) * S, (500 - 170) * S, (480 + 170) * S, (500 + 170) * S], fill=(196, 200, 206), outline=INK, width=4 * S)
            draw_char(d, 480, 1290, 2.4, CH[who], t, talk=talking)
    elif seq == "stairs":
        draw_char(d, 480, 640, 0.95, RAKA, t, talk=False)
        draw_box(d, e["text"])
    elif seq == "road":
        # motor lewat
        px = lerp(1180, -260, clamp(lt / 3.4))
        py = 560
        d.rounded_rectangle([(px - 90) * S, (py - 80) * S, (px + 70) * S, (py - 40) * S], 14 * S, fill=(248, 190, 40), outline=INK, width=3 * S)
        d.rounded_rectangle([(px - 10) * S, (py - 110) * S, (px + 20) * S, (py - 80) * S], 8 * S, fill=(248, 190, 40), outline=INK, width=3 * S)
        for wx in (-70, 60):
            d.ellipse([(px + wx - 34) * S, (py - 66) * S, (px + wx + 34) * S, (py + 2) * S], fill=INK)
            d.ellipse([(px + wx - 14) * S, (py - 46) * S, (px + wx + 14) * S, (py - 18) * S], fill=(200, 200, 200))
        draw_char(d, px - 20, py - 40, 0.42, dict(RAKA, pants=(86, 120, 170)), t, helmet=True, seated=True)
    elif seq == "phone":
        draw_char(d, 480, 1290, 2.4, RAKA, t, talk=(who == "raka" and talking), phone=True, helmet=True)
    elif seq == "credits":
        pass

    # tulisan
    if seq == "credits":
        a = clamp(lt / 1.0)
        c = int(255 * a)
        d.text((W * S / 2, 250 * S), EP.CREDIT_TITLE, font=font(FB, 40 * S), fill=(c, c, c), anchor="mm", align="center", spacing=8 * S)
        meta = ["Director: (isi nama sutradara)", "Producer: (isi nama produser)", "Animator: (isi nama animator)", "Song: (isi judul lagu)"]
        for k, m in enumerate(meta):
            d.text((W * S / 2, (370 + k * 38) * S), m, font=font(FB, 22 * S), fill=(int(c * .8),) * 3, anchor="mm")
        d.text((W * S / 2, 640 * S), "Gaya visual terinspirasi video referensi • cerita & dialog original", font=font(FB, 16 * S), fill=(int(c * .5),) * 3, anchor="mm")
    else:
        if seq not in ("road",):
            draw_sub(d, e["text"] if view not in ("narr",) else "")
        draw_caption(d)

    # fade antar sekuen
    k = SEQS_START.get((i, "in"))
    if lt < 0.18 and e["t0"] in SEQ_T0:
        a = 1 - lt / 0.18
        ov = Image.new("RGB", img.size, (0, 0, 0))
        img = Image.blend(img, ov, a)
    if seq == "credits" and lt > 0 and False:
        pass
    return img.resize((W, H), Image.LANCZOS)

SEQ_T0, SEQS_START = set(), {}
_t = 0.0
for _seq, _lines in SEQS:
    SEQ_T0.add(next(e["t0"] for e in TL if e["seq"] == _seq))

def work(args):
    n, outdir = args
    render_frame(n).save(os.path.join(outdir, f"f_{n:05d}.png"), compress_level=1)
    return n

# ------------------------------------------------------------------ audio
def make_audio(path):
    sr = 22050
    N = int(TOTAL * sr) + sr
    y = np.zeros(N, dtype=np.float32)
    # musik: arpeggio Am F C G, ~96 bpm
    chords = [[220.0, 261.6, 329.6], [174.6, 220.0, 261.6], [261.6, 329.6, 392.0], [196.0, 246.9, 293.7]]
    step = 60 / 96 / 2
    k = 0
    tt = 0.0
    while tt < TOTAL:
        ch = chords[(k // 8) % 4]
        f = ch[[0, 1, 2, 1][k % 4]] * (2 if k % 2 else 1)
        n0 = int(tt * sr)
        L = int(0.35 * sr)
        x = np.arange(L) / sr
        pl = np.sin(2 * np.pi * f * x) * np.exp(-x * 9) * (0.035 if HAS_VOICE else 0.07)
        y[n0:n0 + L] += pl[: max(0, min(L, N - n0))]
        if k % 8 == 0:
            b = np.sin(2 * np.pi * ch[0] / 2 * x) * np.exp(-x * 3) * (0.04 if HAS_VOICE else 0.08)
            y[n0:n0 + L] += b[: max(0, min(L, N - n0))]
        tt += step
        k += 1
    # suara asli (Edge TTS) bila ada, selain itu bunyi blip
    for e in TL:
        if e.get("voice"):
            flt = "highpass=f=400,lowpass=f=3400,volume=1.2" if e["text"].startswith("\u260e") else "volume=1.0"
            raw = subprocess.run(["ffmpeg", "-v", "error", "-i", e["voice"], "-af", flt, "-ac", "1", "-ar", str(sr), "-f", "f32le", "-"],
                                 capture_output=True).stdout
            v = np.frombuffer(raw, dtype=np.float32)
            n0 = int((e["t0"] + 0.06) * sr)
            n1 = min(N, n0 + len(v))
            y[n0:n1] += v[: n1 - n0] * 0.9
            continue
        if e["who"] and e["view"] != "narr" and e["text"]:
            f0 = CH[e["who"]]["pitch"]
            n0, n1 = int((e["t0"] + 0.12) * sr), int((e["t1"] - GAP * 0.8) * sr)
            tx = np.arange(n1 - n0) / sr
            syl = (np.sin(2 * np.pi * 7.5 * (e["t0"] + 0.12 + tx)) > -0.25).astype(np.float32)
            wob = f0 * (1 + 0.12 * np.sin(2 * np.pi * 3.1 * tx + len(e["text"])))
            ph = np.cumsum(2 * np.pi * wob / sr)
            v = (np.sign(np.sin(ph)) * 0.5 + np.sin(ph) * 0.5) * syl * 0.10
            v = np.convolve(v, np.ones(6) / 6, mode="same")
            y[n0:n1] += v.astype(np.float32)
    fade = int(1.5 * sr)
    y[int(TOTAL * sr) - fade:int(TOTAL * sr)] *= np.linspace(1, 0, fade)
    y = np.clip(y[: int(TOTAL * sr)], -1, 1)
    with wave.open(path, "wb") as w_:
        w_.setnchannels(1); w_.setsampwidth(2); w_.setframerate(sr)
        w_.writeframes((y * 32000).astype(np.int16).tobytes())

# ------------------------------------------------------------------ main
if __name__ == "__main__":
    out = sys.argv[1] if len(sys.argv) > 1 else "temen-yang-jujur.mp4"
    work_dir = sys.argv[2] if len(sys.argv) > 2 else "/tmp/tyj_frames"
    shutil.rmtree(work_dir, ignore_errors=True)
    os.makedirs(work_dir)
    print(f"durasi {TOTAL:.1f}s, {NFRAMES} frame", flush=True)
    with Pool(os.cpu_count()) as p:
        for i, _ in enumerate(p.imap_unordered(work, [(n, work_dir) for n in range(NFRAMES)], chunksize=8)):
            if i % 200 == 0:
                print(i, flush=True)
    wav = os.path.join(work_dir, "a.wav")
    make_audio(wav)
    subprocess.run(["ffmpeg", "-v", "error", "-y", "-framerate", str(FPS), "-i", os.path.join(work_dir, "f_%05d.png"), "-i", wav,
                    "-c:v", "libx264", "-pix_fmt", "yuv420p", "-crf", "20", "-c:a", "aac", "-b:a", "128k", "-shortest", out], check=True)
    print("selesai", out)

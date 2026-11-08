"""Video 20 dtk 1080x1920: 'Love bombing' - stick figure + caption + SFX."""
import importlib.util, math, os, subprocess, sys, wave
import numpy as np
from multiprocessing import Pool
from PIL import Image, ImageDraw, ImageOps

HERE = os.path.dirname(os.path.abspath(__file__))
_argv = sys.argv; sys.argv = [sys.argv[0]]
spec = importlib.util.spec_from_file_location("mv", HERE + "/make_video.py")
mv = importlib.util.module_from_spec(spec); spec.loader.exec_module(mv)
sys.argv = _argv
OUT = sys.argv[1] if len(sys.argv) > 1 else "lovebomb.mp4"
W, H, FPS, DUR, S, PW = mv.W, mv.H, mv.FPS, mv.DUR, mv.S, mv.PW
PH = 1000
F, WHITE, GREY, GOLD = mv.F, mv.WHITE, mv.GREY, mv.GOLD
seg, clamp, fade, text_c = mv.seg, mv.clamp, mv.fade, mv.text_c
RED, GREEN, BG, PINK = (255, 120, 110), (120, 210, 150), (12, 16, 28), (255, 110, 130)
BASE = PH - 90
# (waktu, sisi, teks, y, hilang_pada)
MSGS = [(1.6, "B", "kamu spesial banget", 190, 6.2), (2.4, "B", "belum pernah ngerasa gini", 265, 6.2),
        (3.2, "B", "kita pasti jodoh", 340, 6.2), (4.0, "B", "aku sayang kamu", 415, 6.2),
        (7.0, "B", "lagi sibuk", 190, 9.4), (9.5, "A", "kamu berubah...", 190, 99),
        (10.8, "A", "dulu kamu gak gini", 265, 99), (12.2, "B", "kamu lebay", 340, 99)]
GIFTS = [1.9 + 0.45 * k for k in range(9)]   # waktu lempar hadiah
GCOL = [(255, 110, 130), (255, 196, 70), (90, 170, 255), (190, 90, 220)]

def heart(d, x, y, r, col):
    d.ellipse([x - r, y - r, x, y], fill=col); d.ellipse([x, y - r, x + r, y], fill=col)
    d.polygon([(x - r, y - r * 0.35), (x + r, y - r * 0.35), (x, y + r * 1.1)], fill=col)

def gift(d, x, y, s, col, bg):
    d.rectangle([x - s, y - s, x + s, y + s], fill=col)
    d.rectangle([x - s * 0.18, y - s, x + s * 0.18, y + s], fill=bg)
    d.rectangle([x - s, y - s * 0.18, x + s, y + s * 0.18], fill=bg)

def phase(t):
    for a, b, s in [(1.0, 6.0, "FASE 1 · DIBANJIRI"), (6.0, 9.0, "FASE 2 · MENDADAK DINGIN"), (9.0, 14.0, "FASE 3 · KAMU MENGEJAR")]:
        if a <= t < b: return s
    return ""

def day(t):
    if t < 1.5: return 0
    if t < 6: return 1 + int((t - 1.5) / 4.5 * 6.99)
    return 7 + int(seg(t, 6, 9) * 23)

def panel(t):
    S_ = S; size = (PW * S, PH * S)
    img = Image.new("RGB", size, BG)
    cone = Image.new("RGBA", size, (0, 0, 0, 0))
    ImageDraw.Draw(cone).polygon([(PW * S_ // 2 - 60 * S_, 0), (PW * S_ // 2 + 60 * S_, 0), (PW * S_ // 2 + 380 * S_, 900 * S_), (PW * S_ // 2 - 380 * S_, 900 * S_)], fill=(150, 170, 220, 18))
    img.paste(cone, (0, 0), cone); d = ImageDraw.Draw(img)
    fl = BASE * S_
    d.rectangle([0, fl, size[0], size[1]], fill=(62, 64, 72)); d.line([0, fl, size[0], fl], fill=(110, 112, 122), width=2 * S_)
    big, small = F(30 * S_), F(20 * S_, False)
    ph = phase(t)
    if ph: text_c(d, (PW * S_ / 2, 34 * S_), ph, F(26 * S_), GOLD if "DINGIN" in ph else WHITE, sp=3 * S_)
    d.text((26 * S_, 34 * S_), "KAMU", font=F(24 * S_), fill=WHITE, anchor="lm")
    d.text(((PW - 26) * S_, 34 * S_), "DIA", font=F(24 * S_), fill=WHITE, anchor="rm")
    # bar perhatian + hari
    ba = seg(t, 1.2, 1.6)
    if ba > 0:
        val = seg(t, 1.5, 3.8) * (1 - 0.92 * seg(t, 6.0, 9.0))
        d.text((40 * S_, 110 * S_), "PERHATIAN", font=F(22 * S_), fill=fade(WHITE, ba, BG), anchor="lm")
        x0, x1 = 230 * S_, 660 * S_
        d.rounded_rectangle([x0, 96 * S_, x1, 124 * S_], 14 * S_, outline=fade(GREY, ba, BG), width=2 * S_)
        if val > 0.01: d.rounded_rectangle([x0, 96 * S_, x0 + (x1 - x0) * val, 124 * S_], 14 * S_, fill=fade(GREEN if val > 0.5 else RED, ba, BG))
        d.text((690 * S_, 110 * S_), f"{int(val * 100)}%", font=F(24 * S_), fill=fade(WHITE, ba, BG), anchor="lm")
        dd = day(t)
        if dd: d.text(((PW - 40) * S_, 110 * S_), f"HARI {dd}", font=F(40 * S_), fill=GOLD if dd > 7 else WHITE, anchor="rm")
    # tokoh
    xa = 300 + 260 * seg(t, 9.2, 12.5)
    xb = 700 + 140 * seg(t, 6.2, 8.8) + 40 * seg(t, 9.2, 12.5)
    lean = seg(t, 9.2, 12.5) * 0.9
    hA = mv.figure(d, xa, BASE, WHITE, math.sin(t * 2) * 0.2 + 0.5 * math.sin(t * 9) * seg(t, 9.2, 12.5), lean=lean)
    lay = Image.new("RGBA", size, (0, 0, 0, 0)); ld = ImageDraw.Draw(lay)
    away = t > 6.4
    colB = (200, 200, 205, 255) if t < 6 else (150, 150, 158, 255)
    if away: mv.figure(ld, xb, BASE, colB, 0.1)
    else: mv.figure(ld, PW - xb, BASE, colB, math.sin(t * 6) * 0.5)
    if not away: lay = ImageOps.mirror(lay)
    img.paste(lay, (0, 0), lay); d = ImageDraw.Draw(img)
    # hadiah terbang & menumpuk
    for k, gt in enumerate(GIFTS):
        if t < gt: continue
        p = clamp((t - gt) / 0.7); col = GCOL[k % 4]
        tx, ty = xa + 70 + (k % 3) * 44, BASE - 22 - (k // 3) * 36
        sx, sy = xb - 70, BASE - 230
        x = sx + (tx - sx) * p; y = sy + (ty - sy) * p - math.sin(p * math.pi) * 150
        a = 1 - seg(t, 6.0, 6.8)
        if a > 0: gift(d, x * S_, y * S_, 18 * S_, fade(col, a, BG), fade(WHITE, a, BG))
    # hati hujan
    if 1.6 < t < 6.3:
        a = seg(t, 1.6, 2.2) * (1 - seg(t, 5.6, 6.3))
        for k in range(14):
            pp = (t * 0.45 + k / 14) % 1
            heart(d, (120 + (k * 61) % 520) * S_, (150 + pp * 600) * S_, int(16 * S_), fade(PINK, a * 0.85 * (1 - pp * 0.5), BG))
    # bubbles
    for mt, side, txt, y, off in MSGS:
        if t < mt: continue
        a = seg(t, mt, mt + 0.25) * (1 - seg(t, off - 0.3, off))
        if a <= 0: continue
        w = d.textlength(txt, font=big) + 44 * S_
        x = 40 * S_ if side == "A" else (PW - 40) * S_ - w
        yy = (y + 30 - 12 * (1 - a)) * S_
        fill = (36, 110, 190) if side == "A" else ((140, 70, 100) if mt < 6 else (60, 62, 74))
        d.rounded_rectangle([x, yy, x + w, yy + 62 * S_], 22 * S_, fill=fade(fill, a, BG))
        d.text((x + 22 * S_, yy + 31 * S_), txt, font=big, fill=fade(WHITE, a, BG), anchor="lm")
    # bendera merah
    if 4.6 < t < 6.2:
        a = seg(t, 4.6, 5.0) * (1 - seg(t, 5.9, 6.2)); fx, fy = PW * S_ / 2, 600 * S_
        d.line([fx, fy, fx, fy + 90 * S_], fill=fade(WHITE, a, BG), width=5 * S_)
        d.polygon([(fx, fy), (fx + 80 * S_, fy + 22 * S_), (fx, fy + 44 * S_)], fill=fade(RED, a, BG))
        d.text((fx + 100 * S_, fy + 22 * S_), "TERLALU CEPAT?", font=F(26 * S_), fill=fade(RED, a, BG), anchor="lm")
    # tanda tanya
    if t > 11.8:
        qa = seg(t, 11.8, 12.2)
        for k, dx in enumerate((-30, 10, 50)):
            d.text(((xa + 20 + dx) * S_ + lean * 30 * S_, (BASE - 330 - 12 * math.sin(t * 4 + k)) * S_), "?", font=F(54 * S_), fill=fade(GOLD, qa, BG), anchor="mm")
    img = img.resize((PW, PH), Image.LANCZOS)
    ImageDraw.Draw(img).rectangle([0, 0, PW - 1, PH - 1], outline=(40, 48, 66), width=2)
    return img

TITLE = "LOVE BOMBING."
CAPS = [(0.4, 2.4, "Kenalan sama love bombing."), (2.4, 6.0, "Awalnya dibanjiri hadiah dan kata manis."),
        (6.0, 9.0, "Belum sebulan... semuanya berhenti."), (9.0, 12.5, "Kamu yang ngejar. Kamu yang disalahin."),
        (12.5, 14.0, "Itu bukan cinta. Itu taktik."), (14.3, 17.2, "Terlalu cepat, terlalu banyak? Waspada."),
        (17.7, 19.8, "Yang tulus, pelan-pelan.")]

def caption(img, t):
    d = ImageDraw.Draw(img); f = F(52)
    for a, b, s in CAPS:
        if a <= t < b:
            al = min(seg(t, a, a + 0.2), 1 - seg(t, b - 0.15, b))
            words = s.split(" "); lines = []; cur = ""
            for w in words:
                if d.textlength((cur + " " + w).strip(), font=f) > 940 and cur: lines.append(cur); cur = w
                else: cur = (cur + " " + w).strip()
            lines.append(cur)
            y0 = 1745 - 34 * (len(lines) - 1)
            idx = min(int(clamp((t - a) / (b - a - 0.2)) * len(words)), len(words) - 1); n = 0
            for li, ln in enumerate(lines):
                x = W / 2 - d.textlength(ln, font=f) / 2
                for w in ln.split(" "):
                    d.text((x, y0 + li * 68), w, font=f, fill=fade(GOLD if n == idx else WHITE, al), anchor="lm", stroke_width=5, stroke_fill=(0, 0, 0))
                    x += d.textlength(w + " ", font=f); n += 1
            return

def frame(i):
    t = i / FPS
    img = Image.new("RGB", (W, H), (0, 0, 0)); d = ImageDraw.Draw(img)
    n = int(clamp(t / 1.0) * len(TITLE)); text_c(d, (W / 2, 140), TITLE[:n], F(48), WHITE, sp=10)
    a = seg(t, 1.0, 1.4) * (1 - seg(t, 13.6, 14.4))
    if a > 0: text_c(d, (W / 2, 215), "love bombing = dibanjiri perhatian di awal, lalu ditinggal", F(24, False), fade(GREY, a), sp=1)
    dim = 1 - 0.88 * seg(t, 13.6, 14.6)
    p = panel(t); blk = Image.new("RGB", p.size, (0, 0, 0))
    if dim < 1: p = Image.blend(blk, p, dim)
    if t > 0.3:
        s = seg(t, 0.3, 0.9); q = p if s >= 1 else Image.blend(blk, p, s)
        img.paste(q, (60, int(290 + 30 * (1 - s))))
    d = ImageDraw.Draw(img)
    def line(txt, y, a0, col=WHITE, font=None, sp=6):
        a = seg(t, a0, a0 + 0.5)
        if a > 0: text_c(d, (W / 2, y + 24 * (1 - a)), txt, font or F(88), fade(col, a), sp=sp)
    if 14.2 <= t < 17.4:
        line("TERLALU CEPAT,", 780, 14.2, font=F(76)); line("TERLALU BANYAK?", 880, 14.6, font=F(76))
        line("WASPADA.", 1040, 15.9, col=GOLD, font=F(120))
    if t >= 17.4:
        d.rectangle([0, 700, W, 1300], fill=(0, 0, 0))
        line("CINTA YANG SEHAT", 880, 17.7, font=F(72)); line("PELAN-PELAN.", 1000, 18.0, col=GOLD, font=F(104))
        line("konsisten, bukan cuma heboh di awal.", 1160, 18.7, col=GREY, font=F(28, False), sp=3)
    caption(img, t)
    return img

def build_audio(path, sr=44100):
    n = sr * DUR; t = np.arange(n) / sr; a = np.zeros(n); rng = np.random.default_rng(9)
    for s, e, fs in [(0, 6, [130.8, 164.8, 196, 261.6]), (6, 14, [110, 130.8, 155.6]), (14, 20, [110, 164.8, 220, 261.6])]:
        m = (t >= s) & (t < e); env = np.clip((t - s) / 1.2, 0, 1) * np.clip((e - t) / 1.2, 0, 1)
        for f in fs: a += np.where(m, np.sin(2 * np.pi * f * t) * env * 0.045, 0)
    def add(at, w):
        i0 = int(at * sr)
        if i0 < n: a[i0:i0 + len(w)] += w[: n - i0]
    def tone(at, f, dur, vol, decay=8, f2=None):
        tt = np.arange(int(dur * sr)) / sr; ff = f if f2 is None else f + (f2 - f) * tt / dur
        add(at, np.sin(2 * np.pi * np.cumsum(ff) / sr) * np.exp(-decay * tt) * vol)
    def noise(at, dur, vol, decay=10, lp=1):
        tt = np.arange(int(dur * sr)) / sr; w = rng.standard_normal(len(tt))
        if lp > 1: w = np.convolve(w, np.ones(lp) / lp, "same")
        add(at, w * np.exp(-decay * tt) * vol)
    for k, gt in enumerate(GIFTS):                                  # lempar hadiah + ting
        noise(gt, 0.15, 0.1, 15, 20); tone(gt + 0.65, 1568 + 60 * (k % 3), 0.3, 0.12, 10)
    for mt, side, txt, y, off in MSGS:
        if side == "B": tone(mt, 1000, 0.15, 0.2, 18); tone(mt + 0.09, 1400, 0.25, 0.18, 12)
        else:
            for k in range(5): noise(mt - 0.6 + k * 0.1, 0.03, 0.3, 120)
            noise(mt - 0.05, 0.2, 0.15, 8, 30); tone(mt - 0.05, 500, 0.25, 0.1, 8, 1300)
    for k in range(10): tone(1.5 + k * 0.23, 500 + k * 90, 0.1, 0.07, 30)       # bar naik cepat
    tone(4.6, 330, 0.2, 0.25, 10); tone(4.85, 330, 0.4, 0.25, 6)                # alarm red flag
    noise(6.0, 0.8, 0.3, 4, 4); tone(6.0, 900, 1.5, 0.2, 2.5, 90)                # semua turun
    tone(7.0, 400, 0.6, 0.15, 4, 150)
    tone(12.2, 220, 0.5, 0.25, 6); noise(12.2, 0.1, 0.25, 50, 8)                 # "kamu lebay"
    tone(14.3, 55, 1.4, 0.4, 3); noise(14.3, 0.4, 0.15, 12, 40)
    for f in (440, 554.4, 659.3): tone(17.7, f, 2.2, 0.12, 2)
    tone(17.7, 2093, 0.6, 0.06, 6)
    a = np.tanh(a * 1.3); a[-sr:] *= np.linspace(1, 0, sr)
    with wave.open(path, "w") as w:
        w.setnchannels(1); w.setsampwidth(2); w.setframerate(sr); w.writeframes((a * 32000).astype(np.int16).tobytes())

def work(a): i, tmp = a; frame(i).save(f"{tmp}/{i:04d}.png")

if __name__ == "__main__":
    tmp = os.path.dirname(os.path.abspath(OUT)) + "/_frames_lb"; os.makedirs(tmp, exist_ok=True)
    with Pool(4) as p: p.map(work, [(i, tmp) for i in range(FPS * DUR)], chunksize=10)
    build_audio(tmp + "/a.wav")
    subprocess.run(["ffmpeg", "-y", "-v", "error", "-framerate", str(FPS), "-i", tmp + "/%04d.png", "-i", tmp + "/a.wav",
                    "-c:v", "libx264", "-pix_fmt", "yuv420p", "-crf", "18", "-c:a", "aac", "-b:a", "160k", "-shortest",
                    "-movflags", "+faststart", OUT], check=True)
    print("ok")

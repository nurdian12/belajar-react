"""Video 20 dtk 1080x1920: 'HTS / situationship' - stick figure + caption + SFX."""
import importlib.util, math, os, subprocess, sys, wave
import numpy as np
from multiprocessing import Pool
from PIL import Image, ImageDraw, ImageOps

HERE = os.path.dirname(os.path.abspath(__file__))
_argv = sys.argv; sys.argv = [sys.argv[0]]
spec = importlib.util.spec_from_file_location("mv", HERE + "/make_video.py")
mv = importlib.util.module_from_spec(spec); spec.loader.exec_module(mv)
sys.argv = _argv
OUT = sys.argv[1] if len(sys.argv) > 1 else "hts.mp4"
W, H, FPS, DUR, S, PW = mv.W, mv.H, mv.FPS, mv.DUR, mv.S, mv.PW
PH = 1000
F, WHITE, GREY, GOLD = mv.F, mv.WHITE, mv.GREY, mv.GOLD
seg, clamp, fade, text_c = mv.seg, mv.clamp, mv.fade, mv.text_c
RED, GREEN, BG, PINK = (255, 120, 110), (120, 210, 150), (12, 16, 28), (255, 110, 130)
BASE = PH - 90

ACTS = [(1.6, "makan bareng tiap minggu", 190), (3.0, "chat tiap malam, VC sampai pagi", 270), (4.4, "nganter pulang, cemburuan", 350)]

def heart(d, x, y, r, col):
    d.ellipse([x - r, y - r, x, y], fill=col); d.ellipse([x, y - r, x + r, y], fill=col)
    d.polygon([(x - r, y - r * 0.35), (x + r, y - r * 0.35), (x, y + r * 1.1)], fill=col)

def phase(t):
    for a, b, s in [(1.0, 8.0, "FASE 1 · RASA PACARAN"), (8.0, 12.4, "FASE 2 · TANYA STATUS"), (12.4, 14.0, "FASE 3 · ZONA ABU-ABU")]:
        if a <= t < b: return s
    return ""

def pill(d, cx, y, w, txt, font, fill, tcol, S_):
    d.rounded_rectangle([cx - w / 2, y, cx + w / 2, y + 62 * S_], 22 * S_, fill=fill)
    d.text((cx, y + 31 * S_), txt, font=font, fill=tcol, anchor="mm")

def bubble(d, side, txt, y, a, big, S_, fill):
    w = d.textlength(txt, font=big) + 44 * S_
    x = 40 * S_ if side == "A" else (PW - 40) * S_ - w
    yy = (y - 12 * (1 - a)) * S_
    d.rounded_rectangle([x, yy, x + w, yy + 62 * S_], 22 * S_, fill=fade(fill, a, BG))
    d.text((x + 22 * S_, yy + 31 * S_), txt, font=big, fill=fade(WHITE, a, BG), anchor="lm")

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
    if ph: text_c(d, (PW * S_ / 2, 34 * S_), ph, F(26 * S_), GOLD if "ABU" in ph else WHITE, sp=3 * S_)
    d.text((26 * S_, 34 * S_), "KAMU", font=F(24 * S_), fill=WHITE, anchor="lm")
    d.text(((PW - 26) * S_, 34 * S_), "DIA", font=F(24 * S_), fill=WHITE, anchor="rm")
    # bar perhatian & komitmen
    ba = seg(t, 1.2, 1.6)
    if ba > 0:
        att = seg(t, 1.6, 7.2); fa = fade(WHITE, ba, BG)
        for lab, y, val, col in (("PERHATIAN", 96, att, GREEN), ("KOMITMEN", 144, 0.0, RED)):
            d.text((40 * S_, (y + 14) * S_), lab, font=F(22 * S_), fill=fa, anchor="lm")
            x0, x1 = 260 * S_, 840 * S_
            d.rounded_rectangle([x0, y * S_, x1, (y + 28) * S_], 14 * S_, outline=fade(GREY, ba, BG), width=2 * S_)
            if val > 0.01: d.rounded_rectangle([x0, y * S_, x0 + (x1 - x0) * val, (y + 28) * S_], 14 * S_, fill=fade(col, ba, BG))
            pc = int(val * 100)
            blink = 1.0 if (lab == "PERHATIAN" or t < 7.2) else (0.5 + 0.5 * math.sin(t * 8))
            d.text(((PW - 40) * S_, (y + 14) * S_), f"{pc}%", font=F(26 * S_), fill=fade(col if lab == "PERHATIAN" else RED, ba * (blink if lab != "PERHATIAN" else 1), BG), anchor="rm")
    # kegiatan
    fo = 1 - seg(t, 7.6, 8.0)
    for mt, txt, y in ACTS:
        if t < mt: continue
        a = seg(t, mt, mt + 0.3) * fo
        if a <= 0: continue
        w = d.textlength(txt, font=big) + 44 * S_
        pill(d, PW * S_ / 2, (y + 20 - 12 * (1 - a)) * S_ / S_ * S_ if False else (y + 20 - 12 * (1 - a)) * S_, w, txt, big, fade((38, 90, 80), a, BG), fade(WHITE, a, BG), S_)
    # chat tanya status
    for mt, side, txt, y, fill in ((8.3, "A", "kita ini apa sih?", 230, (36, 110, 190)), (10.3, "B", "jalanin aja dulu...", 310, (60, 62, 74))):
        if t >= mt: bubble(d, side, txt, y, seg(t, mt, mt + 0.25), big, S_, fill)
    # tokoh
    gap = seg(t, 10.3, 11.8)
    xa, xb = 330, 640 + 200 * gap
    lean = seg(t, 10.3, 13) * 0.9
    d.line([0, 0, 0, 0])
    colA = WHITE
    hA = mv.figure(d, xa, BASE, colA, math.sin(t * 2) * 0.2, lean=lean)
    mv.phone(d, hA, 1, face=(60, 120, 200)) if False else None
    lay = Image.new("RGBA", size, (0, 0, 0, 0)); ld = ImageDraw.Draw(lay)
    mv.figure(ld, PW - xb, BASE, (200, 200, 205, 255), math.sin(t * 2.5) * 0.3 + (0.8 * seg(t, 10.3, 10.8)))
    lay = ImageOps.mirror(lay); img.paste(lay, (0, 0), lay); d = ImageDraw.Draw(img)
    # tangan bergandengan (fase 1) / putus
    if t < 10.3:
        mx, my = (xa + xb) / 2 * S_, (BASE - 140) * S_
        d.line([hA[0], hA[1], xb * S_ - 78 * S_ * 1, hA[1]], fill=WHITE, width=9 * S_)
        for k in range(3):
            tk = (t * 0.5 + k / 3) % 1
            if 1.6 < t < 8: heart(d, mx + 40 * S_ * math.sin(k * 2 + t), my - tk * 260 * S_, int(18 * S_), fade(PINK, 1 - tk, BG))
    # status melayang
    if 1.2 < t < 8.0:
        a = seg(t, 1.2, 1.6) * (1 - seg(t, 7.6, 8.0))
        txt = "STATUS: " + ("???" if int(t * 3) % 2 == 0 else "...")
        d.text((PW * S_ / 2, 560 * S_), txt, font=F(34 * S_), fill=fade(GOLD, a * 0.9, BG), anchor="mm")
    # tanda tanya + tag
    if t > 11.6:
        qa = seg(t, 11.6, 12.0)
        for k, dx in enumerate((-30, 10, 50)):
            yy = (BASE - 330 - 12 * math.sin(t * 4 + k)) * S_
            d.text(((xa + 20 + dx) * S_ + lean * 30 * S_, yy), "?", font=F(54 * S_), fill=fade(GOLD, qa, BG), anchor="mm")
    for mt, txt, y in ((12.5, "bukan pacar", 370), (12.9, "bukan teman", 445)):
        if t >= mt:
            a = seg(t, mt, mt + 0.25)
            w = d.textlength(txt, font=big) + 90 * S_
            cx = PW * S_ / 2
            d.rounded_rectangle([cx - w / 2, y * S_, cx + w / 2, (y + 62) * S_], 22 * S_, outline=fade(RED, a, BG), width=3 * S_)
            d.text((cx - w / 2 + 22 * S_, (y + 31) * S_), "X", font=F(30 * S_), fill=fade(RED, a, BG), anchor="lm")
            d.text((cx + 22 * S_, (y + 31) * S_), txt, font=big, fill=fade(WHITE, a, BG), anchor="mm")
    img = img.resize((PW, PH), Image.LANCZOS)
    ImageDraw.Draw(img).rectangle([0, 0, PW - 1, PH - 1], outline=(40, 48, 66), width=2)
    return img

TITLE = "HTS."
CAPS = [(0.4, 2.5, "Kenalan sama HTS."), (2.5, 5.8, "Makan bareng, chat tiap malam, cemburuan..."),
        (5.8, 8.0, "Perhatian 100%. Komitmen... nol."), (8.0, 10.3, "Kamu tanya: \"kita ini apa?\""),
        (10.3, 12.4, "Dia jawab: \"jalanin aja dulu.\""), (12.5, 14.0, "Bukan pacar. Bukan teman. Bingung sendiri."),
        (14.3, 17.2, "Rasa pacaran, tanpa status."), (17.7, 19.8, "Yang serius berani kasih status.")]

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
    n = int(clamp(t / 0.7) * len(TITLE)); text_c(d, (W / 2, 140), TITLE[:n], F(54), WHITE, sp=12)
    a = seg(t, 0.9, 1.3) * (1 - seg(t, 13.6, 14.4))
    if a > 0: text_c(d, (W / 2, 215), "HTS = hubungan tanpa status", F(28, False), fade(GREY, a), sp=2)
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
        line("ITU NAMANYA", 780, 14.2, font=F(80)); line("HTS.", 910, 14.6, col=GOLD, font=F(130))
        line("RASA PACARAN,", 1080, 15.9, font=F(76)); line("TANPA STATUS.", 1175, 16.2, font=F(76))
    if t >= 17.4:
        d.rectangle([0, 700, W, 1300], fill=(0, 0, 0))
        line("YANG SERIUS", 830, 17.7, font=F(84)); line("BERANI KASIH", 935, 17.9, font=F(84)); line("STATUS.", 1070, 18.2, col=GOLD, font=F(120))
        line("bukan yang nyaman tanpa komitmen.", 1210, 18.8, col=GREY, font=F(28, False), sp=3)
    caption(img, t)
    return img

def build_audio(path, sr=44100):
    n = sr * DUR; t = np.arange(n) / sr; a = np.zeros(n); rng = np.random.default_rng(7)
    for s, e, fs in [(0, 8, [130.8, 164.8, 196, 246.9]), (8, 14, [110, 130.8, 164.8]), (14, 20, [110, 164.8, 220, 261.6])]:
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
    for mt, _, _ in ACTS:                                           # ding kegiatan manis
        tone(mt, 1320, 0.3, 0.16, 9); tone(mt + 0.08, 1760, 0.4, 0.14, 7)
    for k in range(3): tone(2.0 + k * 1.6, 70, 0.2, 0.25, 14); tone(2.28 + k * 1.6, 70, 0.2, 0.25, 14)  # detak
    for k in range(10): tone(1.6 + k * 0.56, 600 + k * 70, 0.1, 0.08, 30)    # bar naik
    tone(7.0, 1568, 0.5, 0.15, 5)
    for k in range(6): noise(7.6 + k * 0.1, 0.03, 0.3, 120)         # ketik tanya
    tone(8.3, 500, 0.25, 0.1, 8, 1300); tone(8.3, 1000, 0.15, 0.12, 14)
    noise(10.1, 0.5, 0.35, 5, 3); tone(10.1, 1800, 0.5, 0.18, 6, 120)   # record scratch
    tone(10.3, 1000, 0.15, 0.2, 18); tone(10.4, 1400, 0.25, 0.18, 12)  # jawaban
    tone(10.9, 400, 1.0, 0.2, 3, 140)                                   # womp
    for tt_ in (12.5, 12.9): tone(tt_, 220, 0.25, 0.25, 12); noise(tt_, 0.08, 0.25, 60, 8)  # tag X
    tone(11.7, 880, 0.15, 0.1, 20); tone(11.85, 784, 0.25, 0.1, 10)
    tone(14.3, 55, 1.4, 0.4, 3); noise(14.3, 0.4, 0.15, 12, 40)
    for f in (440, 554.4, 659.3): tone(17.7, f, 2.2, 0.12, 2)
    tone(17.7, 2093, 0.6, 0.06, 6)
    a = np.tanh(a * 1.3); a[-sr:] *= np.linspace(1, 0, sr)
    with wave.open(path, "w") as w:
        w.setnchannels(1); w.setsampwidth(2); w.setframerate(sr); w.writeframes((a * 32000).astype(np.int16).tobytes())

def work(a): i, tmp = a; frame(i).save(f"{tmp}/{i:04d}.png")

if __name__ == "__main__":
    tmp = os.path.dirname(os.path.abspath(OUT)) + "/_frames_hts"; os.makedirs(tmp, exist_ok=True)
    with Pool(4) as p: p.map(work, [(i, tmp) for i in range(FPS * DUR)], chunksize=10)
    build_audio(tmp + "/a.wav")
    subprocess.run(["ffmpeg", "-y", "-v", "error", "-framerate", str(FPS), "-i", tmp + "/%04d.png", "-i", tmp + "/a.wav",
                    "-c:v", "libx264", "-pix_fmt", "yuv420p", "-crf", "18", "-c:a", "aac", "-b:a", "160k", "-shortest",
                    "-movflags", "+faststart", OUT], check=True)
    print("ok")

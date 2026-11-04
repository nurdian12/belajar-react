"""Video 20 dtk 1080x1920: 'Ghosting' - stick figure berubah jadi hantu, + caption + SFX."""
import importlib.util, math, os, subprocess, sys, wave
import numpy as np
from multiprocessing import Pool
from PIL import Image, ImageDraw, ImageOps

HERE = os.path.dirname(os.path.abspath(__file__))
_argv = sys.argv; sys.argv = [sys.argv[0]]
spec = importlib.util.spec_from_file_location("mv", HERE + "/make_video.py")
mv = importlib.util.module_from_spec(spec); spec.loader.exec_module(mv)
sys.argv = _argv
OUT = sys.argv[1] if len(sys.argv) > 1 else "ghosting.mp4"
W, H, FPS, DUR, S, PW = mv.W, mv.H, mv.FPS, mv.DUR, mv.S, mv.PW
PH = 1000
F, WHITE, GREY, GOLD, BLUE = mv.F, mv.WHITE, mv.GREY, mv.GOLD, mv.BLUE
seg, clamp, fade, text_c = mv.seg, mv.clamp, mv.fade, mv.text_c
RED, GREEN, BG = (255, 120, 110), (120, 210, 150), (12, 16, 28)
BASE = PH - 90

# (waktu, sisi, teks, y, label)
MSGS = [(1.6, "A", "pagi! udah makan?", 110, None), (2.4, "B", "udah dong, kamu?", 190, ("balas: 1 menit", GREY)),
        (3.3, "A", "kangen deh", 270, None), (4.0, "B", "aku juga", 350, ("balas: 1 menit", GREY)),
        (5.4, "A", "lagi sibuk ya?", 430, None), (7.0, "B", "hm", 510, ("balas: 5 JAM", RED)),
        (9.0, "A", "kamu kemana?", 110, "belum"), (9.9, "A", "halo?", 200, "belum"),
        (10.8, "A", "kok ngilang?", 290, "belum"), (11.8, "A", "aku salah apa?", 380, "belum")]

def heart(d, x, y, r, col):
    d.ellipse([x - r, y - r, x, y], fill=col); d.ellipse([x, y - r, x + r, y], fill=col)
    d.polygon([(x - r, y - r * 0.35), (x + r, y - r * 0.35), (x, y + r * 1.1)], fill=col)

def ghost(d, gx, gy, w=150, h=200):
    c = (245, 247, 255, 255)
    d.ellipse([gx - w / 2, gy - h / 2, gx + w / 2, gy - h / 2 + w], fill=c)
    d.rectangle([gx - w / 2, gy - h / 2 + w / 2, gx + w / 2, gy + h / 2 - w / 6], fill=c)
    for k in range(3):
        cx = gx - w / 3 + k * w / 3; r = w / 6
        d.ellipse([cx - r, gy + h / 2 - w / 3, cx + r, gy + h / 2], fill=c)
    for ex in (-0.2, 0.2):
        d.ellipse([gx + ex * w - 9, gy - h / 5 - 13, gx + ex * w + 9, gy - h / 5 + 13], fill=(20, 24, 40, 255))
    d.ellipse([gx - 11, gy - h / 12, gx + 11, gy + h / 12 + 6], fill=(20, 24, 40, 255))

def scale_alpha(layer, k):
    r, g, b, a = layer.split(); return Image.merge("RGBA", (r, g, b, a.point(lambda v: int(v * k))))

def phase(t):
    for a, b, s in [(1.0, 5.0, "FASE 1 · HANGAT"), (5.0, 8.4, "FASE 2 · MULAI DINGIN"), (8.4, 11.0, "FASE 3 · MENGHILANG"), (11.0, 14.0, "FASE 4 · KAMU BINGUNG")]:
        if a <= t < b: return s
    return ""

def panel(t):
    S_ = S; size = (PW * S, PH * S)
    img = Image.new("RGB", size, BG)
    cone = Image.new("RGBA", size, (0, 0, 0, 0))
    ImageDraw.Draw(cone).polygon([(PW * S_ // 2 - 60 * S_, 0), (PW * S_ // 2 + 60 * S_, 0), (PW * S_ // 2 + 380 * S_, 900 * S_), (PW * S_ // 2 - 380 * S_, 900 * S_)], fill=(150, 170, 220, 18))
    img.paste(cone, (0, 0), cone); d = ImageDraw.Draw(img)
    fl = BASE * S_
    d.rectangle([0, fl, size[0], size[1]], fill=(62, 64, 72)); d.line([0, fl, size[0], fl], fill=(110, 112, 122), width=2 * S_)
    big, small = F(32 * S_), F(19 * S_, False)
    # header
    ph = phase(t)
    if ph: text_c(d, (PW * S_ / 2, 34 * S_), ph, F(26 * S_), GOLD if "MENGHILANG" in ph else WHITE, sp=3 * S_)
    d.text((26 * S_, 34 * S_), "KAMU", font=F(24 * S_), fill=WHITE, anchor="lm")
    d.text(((PW - 26) * S_, 34 * S_), "DIA", font=F(24 * S_), fill=WHITE, anchor="rm")
    if t < 5: st, sc = "online", GREEN
    elif t < 8.4: st, sc = "terakhir dilihat 5 jam lalu", GREY
    else: st, sc = "terakhir dilihat: lama banget", RED
    d.text(((PW - 26) * S_, 66 * S_), st, font=small, fill=sc, anchor="rm")
    # bubbles
    fade_old = 1 - seg(t, 8.5, 8.9)
    for (mt, side, txt, y, lab) in MSGS:
        if t < mt: continue
        a = seg(t, mt, mt + 0.25)
        if mt < 8.5: a *= fade_old
        if a <= 0: continue
        w = d.textlength(txt, font=big) + 44 * S_
        x = 40 * S_ if side == "A" else (PW - 40) * S_ - w
        fill = (36, 110, 190) if side == "A" else (60, 62, 74)
        yy = (y - 12 * (1 - a)) * S_
        d.rounded_rectangle([x, yy, x + w, yy + 62 * S_], 22 * S_, fill=fade(fill, a, BG))
        d.text((x + 22 * S_, yy + 31 * S_), txt, font=big, fill=fade(WHITE, a, BG), anchor="lm")
        if side == "B" and lab:
            d.text(((PW - 40) * S_, yy + 74 * S_), lab[0], font=small, fill=fade(lab[1], a, BG), anchor="rm")
        if lab == "belum":
            last = max(m[0] for m in MSGS if m[3] and m[1] == "A" and m[0] >= 9 and m[0] <= t)
            if mt == last:
                d.text((40 * S_, yy + 76 * S_), "Terkirim · belum dibaca", font=small, fill=fade(RED, a, BG), anchor="lm")
    # hati fase 1
    if 4.1 < t < 5.4:
        k = (t - 4.1) / 1.3
        heart(d, PW * S_ * 0.5, (430 - 120 * k) * S_, 22 * S_, fade((255, 110, 130), 1 - k, BG))
    # counter
    if t > 12.6:
        a = seg(t, 12.6, 12.9); pulse = 1 + 0.05 * math.sin(t * 10)
        txt = "27 CHAT BELUM DIBALAS"
        d.text((40 * S_, 500 * S_), txt, font=F(int(30 * S_ * pulse)), fill=fade(RED, a, BG), anchor="lm")
    # tokoh A
    lean = seg(t, 9, 13) * 0.9
    col = fade(WHITE, 1 - 0.3 * seg(t, 12, 14))
    hand = mv.figure(d, 240, BASE, col, math.sin(t * (2 + 6 * seg(t, 5, 12))) * (0.15 + 0.6 * seg(t, 8, 12)), lean=lean)
    gs = 0.5 * (1 - 0.75 * seg(t, 5, 12))
    gl = mv.glow_layer(size, hand, 190 * S_, (255, 205, 110), gs); img.paste(gl, (0, 0), gl); d = ImageDraw.Draw(img)
    mv.phone(d, hand, 1, face=(60, 120, 200))
    if t > 11.2:  # tanda tanya
        qa = seg(t, 11.2, 11.6)
        for k, dx in enumerate((-30, 10, 50)):
            yy = (BASE - 330 - 12 * math.sin(t * 4 + k)) * S_
            d.text(((240 + 20 + dx) * S_ + lean * 30 * S_, yy), "?", font=F(54 * S_), fill=fade(GOLD, qa, BG), anchor="mm")
    # tokoh B (digambar di layer, dicerminkan)
    lay = Image.new("RGBA", size, (0, 0, 0, 0)); ld = ImageDraw.Draw(lay)
    sa = (1 - 0.65 * seg(t, 5, 8.2)) * (1 - seg(t, 8.2, 9.0))
    if sa > 0.01:
        h2 = mv.figure(ld, PW - 720, BASE, (200, 200, 205, 255), math.sin(t * 3) * 0.3)
        mv.phone(ld, h2, 1, face=(150, 160, 175))
        lay2 = ImageOps.mirror(scale_alpha(lay, sa)); img.paste(lay2, (0, 0), lay2)
    ga = 0.95 * seg(t, 8.4, 9.2) * (1 - seg(t, 10.2, 11.8))
    if ga > 0.01:
        gl_ = Image.new("RGBA", size, (0, 0, 0, 0)); gd = ImageDraw.Draw(gl_)
        gx = (720 + 70 * seg(t, 9.2, 11.8)) * S_
        gy = (BASE - 150 - 170 * seg(t, 9.0, 11.8) + 10 * math.sin(t * 4)) * S_
        glow = mv.glow_layer(size, (gx, gy), 230 * S_, (190, 215, 255), 0.35 * ga); img.paste(glow, (0, 0), glow)
        ghost(gd, gx, gy, 150 * S_, 200 * S_)
        gl_ = scale_alpha(gl_, ga); img.paste(gl_, (0, 0), gl_)
    img = img.resize((PW, PH), Image.LANCZOS)
    ImageDraw.Draw(img).rectangle([0, 0, PW - 1, PH - 1], outline=(40, 48, 66), width=2)
    return img

TITLE = "GHOSTING."
CAPS = [(0.4, 2.5, "Kenalan sama ghosting."), (2.5, 5.0, "Awalnya chat tiap hari, balas cepet."),
        (5.0, 8.1, "Terus balasnya makin lama... makin dingin."), (8.3, 10.8, "Lalu dia hilang. Tanpa penjelasan."),
        (10.9, 14.0, "Kamu nunggu, bingung, nyalahin diri sendiri."), (14.3, 17.2, "Menghilang tanpa kabar itu bukan salahmu."),
        (17.7, 19.8, "Kamu berhak dapat kejelasan.")]

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
    n = int(clamp(t / 0.9) * len(TITLE)); text_c(d, (W / 2, 140), TITLE[:n], F(48), WHITE, sp=10)
    a = seg(t, 1.0, 1.4) * (1 - seg(t, 13.6, 14.4))
    if a > 0: text_c(d, (W / 2, 215), "ghosting = menghilang tanpa kabar", F(28, False), fade(GREY, a), sp=2)
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
        line("ITU NAMANYA", 780, 14.2, font=F(80)); line("GHOSTING.", 900, 14.6, col=GOLD, font=F(118))
        line("BUKAN KAMU", 1080, 15.9, font=F(76)); line("YANG SALAH.", 1175, 16.2, font=F(76))
    if t >= 17.4:
        d.rectangle([0, 700, W, 1300], fill=(0, 0, 0))
        line("KAMU BERHAK", 860, 17.7, font=F(88)); line("KEJELASAN.", 990, 18.0, col=GOLD, font=F(112))
        line("bukan ditinggal tanpa kabar.", 1150, 18.6, col=GREY, font=F(30, False), sp=3)
    caption(img, t)
    return img

def build_audio(path, sr=44100):
    n = sr * DUR; t = np.arange(n) / sr; a = np.zeros(n); rng = np.random.default_rng(5)
    for s, e, fs in [(0, 5, [130.8, 164.8, 196]), (5, 8.4, [110, 130.8, 164.8]), (8.4, 14, [98, 116.5, 138.6]), (14, 20, [110, 164.8, 220, 261.6])]:
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
    for mt, side, txt, y, lab in MSGS:
        if side == "A":
            for k in range(6): noise(mt - 0.7 + k * 0.1, 0.03, 0.3, 120)
            noise(mt - 0.05, 0.25, 0.16, 8, 30); tone(mt - 0.05, 500, 0.25, 0.1, 8, 1300)   # kirim
        else:
            tone(mt, 1000, 0.15, 0.2, 18); tone(mt + 0.09, 1400, 0.25, 0.18, 12)           # terima
    for k in range(2): tone(4.1 + k * 0.28, 70, 0.2, 0.35, 14)                                 # detak jantung
    for k, tt_ in enumerate(np.arange(5.4, 8.4, 0.5)): tone(tt_, 1800 if k % 2 == 0 else 1300, 0.06, 0.12, 70)  # tik-tok makin dingin
    # hantu: theremin turun + angin
    dur = 3.0; tt = np.arange(int(dur * sr)) / sr; fr = 820 - 420 * tt / dur + 18 * np.sin(2 * np.pi * 6 * tt)
    env = np.sin(np.pi * np.clip(tt / dur, 0, 1)) ** 1.5
    add(8.4, np.sin(2 * np.pi * np.cumsum(fr) / sr) * env * 0.14 + np.sin(4 * np.pi * np.cumsum(fr) / sr) * env * 0.04)
    noise(8.5, 2.5, 0.12, 1.2, 80); tone(8.4, 60, 0.6, 0.3, 6)
    tone(9.0, 1500, 0.08, 0.1, 40)
    for tt_ in (9.9, 10.8, 11.8): tone(tt_ + 0.1, 330, 0.5, 0.12, 6, 260)                      # "tak dibaca"
    for k in range(5): tone(12.6 + k * 0.08, 900 + k * 120, 0.06, 0.15, 40)                    # counter naik
    tone(13.0, 520, 0.9, 0.2, 3, 150)                                                           # womp
    tone(14.3, 55, 1.4, 0.4, 3); noise(14.3, 0.4, 0.15, 12, 40)
    for f in (440, 554.4, 659.3): tone(17.7, f, 2.2, 0.12, 2)
    tone(17.7, 2093, 0.6, 0.06, 6)
    a = np.tanh(a * 1.3); a[-sr:] *= np.linspace(1, 0, sr)
    with wave.open(path, "w") as w:
        w.setnchannels(1); w.setsampwidth(2); w.setframerate(sr); w.writeframes((a * 32000).astype(np.int16).tobytes())

def work(a): i, tmp = a; frame(i).save(f"{tmp}/{i:04d}.png")

if __name__ == "__main__":
    tmp = os.path.dirname(os.path.abspath(OUT)) + "/_frames_ghost"; os.makedirs(tmp, exist_ok=True)
    with Pool(4) as p: p.map(work, [(i, tmp) for i in range(FPS * DUR)], chunksize=10)
    build_audio(tmp + "/a.wav")
    subprocess.run(["ffmpeg", "-y", "-v", "error", "-framerate", str(FPS), "-i", tmp + "/%04d.png", "-i", tmp + "/a.wav",
                    "-c:v", "libx264", "-pix_fmt", "yuv420p", "-crf", "18", "-c:a", "aac", "-b:a", "160k", "-shortest",
                    "-movflags", "+faststart", OUT], check=True)
    print("ok")

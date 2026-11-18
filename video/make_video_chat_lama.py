"""Video 20 dtk 1080x1920: 'Dia lama balas. Kamu yang ngarang.' (angle baru, kerangka ATM).

Kerangka (hasil AMATI video chat sebelumnya, ditiru): hook kontra -> konflik (2 panel) -> bukti -> CTA.
MODIFIKASI: bukan soal prioritas / seen, tapi soal cerita yang dikarang kepala sendiri saat menunggu.
Pakai helper dari make_video.py.
"""
import importlib.util, math, os, subprocess, sys, wave
import numpy as np
from multiprocessing import Pool
from PIL import Image, ImageDraw

HERE = os.path.dirname(os.path.abspath(__file__))
sys.argv, _argv = [sys.argv[0]], sys.argv
spec = importlib.util.spec_from_file_location("mv", HERE + "/make_video.py")
mv = importlib.util.module_from_spec(spec); spec.loader.exec_module(mv)
sys.argv = _argv
OUT = sys.argv[1] if len(sys.argv) > 1 else "chat-lama-cerita-kepala.mp4"
W, H, FPS, DUR, S, PW, PH = mv.W, mv.H, mv.FPS, mv.DUR, mv.S, mv.PW, mv.PH
F, WHITE, GREY, GOLD, BLUE = mv.F, mv.WHITE, mv.GREY, mv.GOLD, mv.BLUE
seg, clamp, fade, text_c = mv.seg, mv.clamp, mv.fade, mv.text_c
RED = (255, 120, 110)
GREEN = (120, 210, 150)
BG = (12, 16, 28)

THOUGHTS = [(3.2, "dia ilfeel ya?"), (5.6, "pasti ada yang lain"), (8.0, "aku salah ngomong")]

def elapsed(t):
    for a, b, s in [(3.0, 5.4, "+10 MENIT"), (5.4, 7.4, "+1 JAM"), (7.4, 9.6, "+3 JAM"), (9.6, 12.6, "+6 JAM")]:
        if a <= t < b: return s
    return "" if t < 3.0 else "+6 JAM"

def thought(d, x, y, s, font, a, shake=0.0):
    w = d.textlength(s, font=font) + 44 * S
    h = 62 * S
    y = y + shake
    d.rounded_rectangle([x, y, x + w, y + h], 30 * S, fill=fade((52, 34, 46), a, BG), outline=fade(RED, a, BG), width=2 * S)
    d.text((x + 22 * S, y + h / 2), s, font=font, fill=fade(WHITE, a, BG), anchor="lm")
    for k, r in enumerate((5, 8)):  # ekor awan pikiran
        cx, cy = x - (14 - k * 9) * S, y + (h + 6 + k * 3) * S / S - 0
        d.ellipse([cx - r * S, cy - r * S, cx + r * S, cy + r * S], fill=fade((52, 34, 46), a, BG), outline=fade(RED, a, BG), width=S)

def panel(t, which):
    img = Image.new("RGB", (PW * S, PH * S), BG); d = ImageDraw.Draw(img)
    cx = (600 if which == "A" else 700) * S
    cone = Image.new("RGBA", img.size, (0, 0, 0, 0))
    ImageDraw.Draw(cone).polygon([(cx - 40 * S, 0), (cx + 40 * S, 0), (cx + 230 * S, 520 * S), (cx - 230 * S, 520 * S)], fill=(150, 170, 220, 22))
    img.paste(cone, (0, 0), cone); d = ImageDraw.Draw(img)
    floor = (PH - 90) * S; base = PH - 90
    d.rectangle([0, floor, PW * S, PH * S], fill=(62, 64, 72)); d.line([0, floor, PW * S, floor], fill=(110, 112, 122), width=2 * S)
    f_lab, f_sub, big = F(26 * S), F(21 * S, False), F(28 * S)
    caps = []
    if which == "A":
        d.text((26 * S, 36 * S), "YANG ADA DI KEPALAMU", font=f_lab, fill=WHITE, anchor="lm")
        caps = [(0.8, 2.8, "KIRIM CHAT, TERKIRIM", GREY), (3.0, 9.0, "BELUM DIBALAS... MULAI MENGARANG", RED),
                (9.0, 12.6, "CERITANYA MAKIN GELAP", RED), (12.6, 13.6, "CUMA ITU?", GOLD)]
        look = clamp((t - 2.6) / 8)
        col = fade(WHITE, 1 - 0.3 * seg(t, 12.6, 13.5))
        hand = mv.figure(d, 200, base, col, math.sin(t * (2 + 9 * look)) * (0.2 + look) * (t > 1), lean=look * 0.9)
        gs = 0.5 * (1 - 0.6 * seg(t, 3, 12)) * (0.9 + 0.1 * math.sin(t * 6))
        gl = mv.glow_layer(img.size, hand, 190 * S, (255, 205, 110), gs); img.paste(gl, (0, 0), gl); d = ImageDraw.Draw(img)
        mv.phone(d, hand, 1, face=(60, 120, 200))
        el = elapsed(t)
        if el: d.text(((PW - 30) * S, 44 * S), el, font=F(40 * S), fill=RED, anchor="rm")
        a = seg(t, 1.2, 1.5)
        if a > 0: mv.bubble(d, 330 * S, (400 - 14 * (1 - a)) * S, "kamu lagi apa?", big, (36, 110, 190), WHITE, alpha=a)
        if t > 2.2:
            d.text((330 * S, 484 * S), "Terkirim" if t < 3.0 else "Dibaca", font=F(18 * S, False), fill=GREY if t < 3.0 else BLUE, anchor="lm")
        fa = 1 - seg(t, 12.0, 12.5)
        for i, (t0, s_) in enumerate(THOUGHTS):
            a = seg(t, t0, t0 + 0.3) * fa
            if a > 0:
                thought(d, 330 * S, (118 + i * 66 - 12 * (1 - a)) * S, s_, big, a, shake=math.sin(t * 14 + i) * 2 * S * clamp((t - t0) / 3))
        a = seg(t, 12.7, 13.0)
        if a > 0: mv.bubble(d, 330 * S, 190 * S, "ketiduran, maaf ya", big, (60, 62, 74), WHITE, alpha=a)
    else:
        d.text((26 * S, 36 * S), "YANG SEBENARNYA TERJADI", font=f_lab, fill=WHITE, anchor="lm")
        caps = [(0.8, 4.0, "SEHARIAN CAPEK BANGET", GREY), (4.0, 8.0, "KETIDURAN. HP DI-CHARGE JAUH", GREY),
                (8.0, 10.4, "HP GETAR. DIA GAK DENGAR.", GOLD), (10.4, 12.0, "BANGUN: \"ASTAGA...\"", GREY),
                (12.0, 13.6, "LANGSUNG BALAS", GOLD)]
        awake = t >= 10.6
        px = 300
        # colokan + kabel + hp di lantai
        d.rounded_rectangle([40 * S, (base - 70) * S, 70 * S, (base - 38) * S], 5 * S, fill=(40, 44, 56), outline=GREY, width=2 * S)
        d.line([70 * S, (base - 54) * S, 150 * S, (base - 54) * S, 230 * S, (base - 6) * S, (px - 20) * S, (base - 6) * S], fill=GREY, width=2 * S, joint="curve")
        buzz = (t > 8.0 and t < 10.6 and (int(t * 10) % 2 == 0)) * 2
        lit = 8.0 <= t < 12.0
        d.rounded_rectangle([(px - 28) * S, (base - 12 + buzz) * S, (px + 28) * S, (base + buzz) * S], 3 * S,
                            fill=(90, 160, 255) if lit else (30, 36, 50), outline=WHITE, width=2 * S)
        if lit:
            gl = mv.glow_layer(img.size, (px * S, (base - 6) * S), 120 * S, (150, 190, 255), 0.4); img.paste(gl, (0, 0), gl); d = ImageDraw.Draw(img)
        if not awake:
            bx = 560  # tempat tidur
            d.rounded_rectangle([(bx - 30) * S, (base - 24) * S, (bx + 260) * S, base * S], 8 * S, fill=(52, 70, 104))
            d.rounded_rectangle([(bx - 30) * S, (base - 36) * S, (bx + 10) * S, (base - 20) * S], 8 * S, fill=(200, 205, 220))
            lw = 9 * S
            d.line([(bx + 20) * S, (base - 36) * S, (bx + 230) * S, (base - 36) * S], fill=(200, 200, 205), width=lw)
            hr = 26 * S
            d.ellipse([(bx + 14) * S - hr, (base - 58) * S - hr, (bx + 14) * S + hr, (base - 58) * S + hr], fill=(200, 200, 205))
            d.rounded_rectangle([(bx + 60) * S, (base - 50) * S, (bx + 260) * S, (base - 22) * S], 10 * S, fill=(70, 96, 140))  # selimut
            for k in range(3):
                zt = (t * 0.9 + k * 0.33) % 1.0
                d.text(((bx + 10 + zt * 60 + k * 10) * S, (base - 95 - zt * 90) * S), "z", font=F(int((20 + 10 * k) * S)),
                       fill=fade(GREY, 1 - zt, BG), anchor="mm")
        else:
            wk = seg(t, 10.6, 11.0)
            hand = mv.figure(d, 700 - 160 * seg(t, 11.0, 12.0), base, (200, 200, 205), math.sin(t * 6) * 0.3)
            if t >= 11.6:
                mv.phone(d, hand, 1, face=(60, 120, 200))
            if t > 10.7 and t < 11.4:
                d.text((hand[0], (hand[1] - 120 - 10 * wk) * S / S), "!", font=F(70 * S), fill=GOLD, anchor="mm")
            if 12.0 <= t < 12.7:
                mv.bubble(d, 330 * S, 170 * S, "mengetik" + "." * (int(t * 4) % 4), big, (60, 62, 74), WHITE)
            elif t >= 12.7:
                mv.bubble(d, 330 * S, 170 * S, "ketiduran, maaf ya", big, (60, 62, 74), WHITE)
        d.text(((PW - 30) * S, 44 * S), "03.12" if not awake else "07.40", font=F(40 * S), fill=GREY if not awake else GOLD, anchor="rm")
    for a, b, s_, c in caps:
        if a <= t < b:
            al = min(seg(t, a, a + 0.25), 1 - seg(t, b - 0.2, b))
            d.text((26 * S, 78 * S), s_, font=f_sub, fill=fade(c, al, BG), anchor="lm")
    img = img.resize((PW, PH), Image.LANCZOS)
    ImageDraw.Draw(img).rectangle([0, 0, PW - 1, PH - 1], outline=(40, 48, 66), width=2)
    return img

TITLE = "DIA LAMA BALAS. KAMU NGARANG."
CAPS = [(0.4, 2.4, "Kamu kirim chat..."), (2.4, 4.4, "Dibaca. Belum dibalas."), (4.4, 7.0, "Kepala mulai bikin cerita."),
        (7.0, 9.4, "\"Dia ilfeel. Ada yang lain.\""), (9.4, 11.0, "Padahal dia cuma ketiduran."),
        (11.0, 13.6, "Bangun, langsung bales."), (14.3, 17.0, "Kamu sakit hati 3 kali."),
        (17.7, 19.8, "Sekali telat itu wajar.")]

def caption(img, t):
    d = ImageDraw.Draw(img)
    for a, b, s in CAPS:
        if a <= t < b:
            al = min(seg(t, a, a + 0.2), 1 - seg(t, b - 0.15, b))
            f = F(52)
            words = s.split(" "); lines = []; cur = ""
            for w in words:
                if d.textlength((cur + " " + w).strip(), font=f) > 940 and cur: lines.append(cur); cur = w
                else: cur = (cur + " " + w).strip()
            lines.append(cur)
            y0 = 1745 - 34 * (len(lines) - 1)
            idx = min(int(clamp((t - a) / (b - a - 0.2)) * len(words)), len(words) - 1)
            n = 0
            for li, ln in enumerate(lines):
                tw = d.textlength(ln, font=f); x = W / 2 - tw / 2
                for w in ln.split(" "):
                    c = fade(GOLD if n == idx else WHITE, al)
                    d.text((x, y0 + li * 68), w, font=f, fill=c, anchor="lm", stroke_width=5, stroke_fill=(0, 0, 0))
                    x += d.textlength(w + " ", font=f); n += 1
            return

def frame(i):
    t = i / FPS
    img = Image.new("RGB", (W, H), (0, 0, 0)); d = ImageDraw.Draw(img)
    n = int(clamp(t / 1.2) * len(TITLE)); text_c(d, (W / 2, 170), TITLE[:n], F(32), WHITE, sp=5)
    dim = 1 - 0.88 * seg(t, 13.6, 14.6)
    pa, pb = panel(t, "A"), panel(t, "B")
    blk = Image.new("RGB", pa.size, (0, 0, 0))
    if dim < 1: pa, pb = Image.blend(blk, pa, dim), Image.blend(blk, pb, dim)
    if t > 0.3:
        s = seg(t, 0.3, 0.9)
        for p, y in ((pa, 330), (pb, 990)):
            q = p if s >= 1 else Image.blend(blk, p, s)
            img.paste(q, (60, int(y + 30 * (1 - s))))
    d = ImageDraw.Draw(img)
    def line(txt, y, a0, col=WHITE, font=None, sp=6):
        a = seg(t, a0, a0 + 0.5)
        if a > 0: text_c(d, (W / 2, y + 24 * (1 - a)), txt, font or F(88), fade(col, a), sp=sp)
    if 14.2 <= t < 17.4:
        line("KAMU SAKIT HATI", 760, 14.2, font=F(70))
        line("3 KALI.", 900, 15.2, col=RED, font=F(110))
        line("sebelum dia sempat balas.", 1040, 16.0, col=GREY, font=F(32, False), sp=3)
    if t >= 17.4:
        d.rectangle([0, 700, W, 1250], fill=(0, 0, 0))
        line("TUNGGU", 840, 17.7, font=F(96)); line("SAMBIL HIDUP.", 970, 18.0, col=GOLD, font=F(100))
        line("kalau terus-terusan begitu, itu pola. bukan sekali.", 1120, 18.6, col=GREY, font=F(26, False), sp=2)
    caption(img, t)
    return img

def build_audio(path, sr=44100):
    n = sr * DUR; t = np.arange(n) / sr; a = np.zeros(n); rng = np.random.default_rng(7)
    for s, e, fs in [(0, 9, [110, 130.8, 164.8]), (9, 14, [98, 116.5, 146.8]), (14, 20, [110, 164.8, 220, 261.6])]:
        m = (t >= s) & (t < e); env = np.clip((t - s) / 1.5, 0, 1) * np.clip((e - t) / 1.5, 0, 1)
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
    noise(1.2, 0.35, 0.22, 7, 30); tone(1.25, 500, 0.3, 0.12, 8, 1400)             # whoosh kirim
    tone(2.6, 1500, 0.12, 0.2, 30); tone(2.68, 2000, 0.2, 0.18, 20)                 # dibaca
    for k, (t0, _) in enumerate(THOUGHTS):                                          # pikiran makin gelap
        tone(t0, 700 - k * 110, 0.35, 0.16, 7, 520 - k * 110); tone(t0 + 0.02, 140, 0.4, 0.14, 6)
    for k, tt_ in enumerate(np.arange(3.0, 12.6, 0.55)):                            # tik-tok
        tone(tt_, 1800 if k % 2 == 0 else 1300, 0.06, 0.12, 70)
    for k in range(6): tone(4.0 + k * 1.2, 90 + k % 2 * 12, 0.9, 0.05, 2)           # dengkur samar (B)
    for k in range(4): tone(8.0 + k * 0.5, 95, 0.1, 0.3, 40)                        # hp getar
    tone(8.0, 880, 0.15, 0.2, 20); tone(8.15, 1175, 0.3, 0.18, 10)                  # notif
    tone(10.6, 330, 0.4, 0.14, 8, 660)                                              # bangun
    tone(12.0, 1100, 0.15, 0.12, 20); tone(12.7, 660, 0.5, 0.2); tone(12.88, 880, 0.5, 0.18)  # balasan
    tone(14.3, 55, 1.4, 0.4, 3); noise(14.3, 0.4, 0.15, 12, 40)                     # hit
    for f in (440, 554.4, 659.3): tone(17.7, f, 2.2, 0.12, 2)                       # resolusi
    tone(17.7, 2093, 0.6, 0.06, 6)
    a = np.tanh(a * 1.3); a[-sr:] *= np.linspace(1, 0, sr)
    with wave.open(path, "w") as w:
        w.setnchannels(1); w.setsampwidth(2); w.setframerate(sr); w.writeframes((a * 32000).astype(np.int16).tobytes())

def work(a): i, tmp = a; frame(i).save(f"{tmp}/{i:04d}.png")

if __name__ == "__main__":
    tmp = os.path.dirname(os.path.abspath(OUT)) + "/_frames_chatlama"; os.makedirs(tmp, exist_ok=True)
    only = os.environ.get("ONLY")
    if only:  # cek cepat satu frame: ONLY=12.5 python3 make_video_chat_lama.py
        frame(int(float(only) * FPS)).save(tmp + "/_preview.png"); print("preview"); sys.exit()
    with Pool(4) as p: p.map(work, [(i, tmp) for i in range(FPS * DUR)], chunksize=10)
    build_audio(tmp + "/a.wav")
    subprocess.run(["ffmpeg", "-y", "-v", "error", "-framerate", str(FPS), "-i", tmp + "/%04d.png", "-i", tmp + "/a.wav",
                    "-c:v", "libx264", "-pix_fmt", "yuv420p", "-crf", "18", "-c:a", "aac", "-b:a", "160k", "-shortest",
                    "-movflags", "+faststart", OUT], check=True)
    print("ok")

"""Video 20 dtk 1080x1920: 'Seen doang' - stick figure + caption + SFX (pakai helper dari make_video.py)."""
import importlib.util, math, os, subprocess, sys, wave
import numpy as np
from multiprocessing import Pool
from PIL import Image, ImageDraw

HERE = os.path.dirname(os.path.abspath(__file__))
sys.argv, _argv = [sys.argv[0]], sys.argv
spec = importlib.util.spec_from_file_location("mv", HERE + "/make_video.py")
mv = importlib.util.module_from_spec(spec); spec.loader.exec_module(mv)
sys.argv = _argv
OUT = sys.argv[1] if len(sys.argv) > 1 else "seen.mp4"
W, H, FPS, DUR, S, PW, PH = mv.W, mv.H, mv.FPS, mv.DUR, mv.S, mv.PW, mv.PH
F, WHITE, GREY, GOLD, BLUE = mv.F, mv.WHITE, mv.GREY, mv.GOLD, mv.BLUE
seg, clamp, fade, text_c = mv.seg, mv.clamp, mv.fade, mv.text_c
RED = (255, 120, 110)
BG = (12, 16, 28)

def elapsed(t):
    for a, b, s in [(6.0, 7.4, "+5 MENIT"), (7.4, 8.8, "+1 JAM"), (8.8, 10.2, "+SEMALAM"), (10.2, 13.6, "+3 HARI")]:
        if a <= t < b: return s
    return "20.14" if t > 0.8 else ""

def panel(t, which):
    img = Image.new("RGB", (PW * S, PH * S), BG); d = ImageDraw.Draw(img)
    cx = (600 if which == "A" else 700) * S
    cone = Image.new("RGBA", img.size, (0, 0, 0, 0))
    ImageDraw.Draw(cone).polygon([(cx - 40 * S, 0), (cx + 40 * S, 0), (cx + 230 * S, 520 * S), (cx - 230 * S, 520 * S)], fill=(150, 170, 220, 22))
    img.paste(cone, (0, 0), cone); d = ImageDraw.Draw(img)
    floor = (PH - 90) * S; base = PH - 90
    d.rectangle([0, floor, PW * S, PH * S], fill=(62, 64, 72)); d.line([0, floor, PW * S, floor], fill=(110, 112, 122), width=2 * S)
    f_lab, f_sub, big = F(26 * S), F(21 * S, False), F(30 * S)
    caps = []
    if which == "A":
        d.text((26 * S, 36 * S), "DIA YANG CURHAT", font=f_lab, fill=WHITE, anchor="lm")
        caps = [(0.8, 2.6, "NGETIK PANJANG LEBAR", GREY), (2.6, 4.0, "TERKIRIM", GREY), (4.0, 6.0, "DIBACA.", BLUE),
                (6.0, 9.4, "NUNGGU... NUNGGU...", GREY), (9.4, 11.0, "ADA NOTIF! TERNYATA PROMO", RED), (11.0, 13.6, "\"GAPAPA KOK\"", GOLD)]
        look = clamp((t - 4) / 8)
        col = mv.fade(WHITE, 1 - 0.35 * seg(t, 11.3, 13.5))
        slump = look
        hand = mv.figure(d, 220, base, col, math.sin(t * (2 + 8 * look)) * (0.2 + look) * (t > 1), lean=slump * 0.9)
        flare = seg(t, 9.4, 9.6) * (1 - seg(t, 10.2, 10.8))
        gs = (0.5 * (1 - 0.75 * seg(t, 6, 12)) + 0.5 * flare) * (0.9 + 0.1 * math.sin(t * 6))
        gl = mv.glow_layer(img.size, hand, 190 * S, (255, 205, 110), gs); img.paste(gl, (0, 0), gl); d = ImageDraw.Draw(img)
        mv.phone(d, hand, 1, face=(60, 120, 200))
        d.text(((PW - 30) * S, 44 * S), elapsed(t), font=F(46 * S), fill=RED if 6 <= t < 13.6 else WHITE, anchor="rm")
        if 1.2 < t < 2.6:
            d.text((330 * S, 200 * S), "mengetik" + "." * (int(t * 4) % 4), font=big, fill=GREY, anchor="lm")
        a1, a2 = seg(t, 2.6, 2.9), seg(t, 2.85, 3.15)
        if a1 > 0: mv.bubble(d, 330 * S, (150 - 14 * (1 - a1)) * S, "tadi aku sedih banget...", big, (36, 110, 190), WHITE, alpha=a1)
        if a2 > 0: mv.bubble(d, 330 * S, (230 - 14 * (1 - a2)) * S, "boleh cerita gak?", big, (36, 110, 190), WHITE, alpha=a2)
        if t > 3.2:
            st = ("Dibaca 20.14", BLUE) if t > 4.0 else ("Terkirim", GREY)
            d.text((330 * S, 318 * S), st[0], font=F(20 * S, False), fill=st[1], anchor="lm")
        a = seg(t, 9.4, 9.7) * (1 - seg(t, 10.7, 11.0))
        if a > 0:
            d.rounded_rectangle([300 * S, 350 * S, 700 * S, 420 * S], 16 * S, fill=fade((70, 40, 40), a, BG), outline=fade(RED, a, BG), width=2 * S)
            d.text((320 * S, 385 * S), "PROMO FLASH SALE 50%!", font=F(24 * S), fill=fade(WHITE, a, BG), anchor="lm")
        a = seg(t, 11.6, 12.0)
        if a > 0: mv.bubble(d, 330 * S, (350 - 14 * (1 - a)) * S, "gapapa kok", big, (60, 62, 74), WHITE, alpha=a)
    else:
        d.text((26 * S, 36 * S), "DIA YANG MEMBACA", font=f_lab, fill=WHITE, anchor="lm")
        caps = [(0.8, 3.6, "ONLINE... TAPI SIBUK?", GREY), (3.6, 5.8, "BACA SEMUA PESANNYA", GREY),
                (5.8, 9.0, "HP DITELUNGKUPKAN", GOLD), (9.0, 13.6, "MENGHILANG", GREY)]
        walk = seg(t, 6.2, 8.8)
        x = 730 + 520 * walk
        col = (200, 200, 205)
        hand = mv.figure(d, x, base, col, math.sin(t * (8 if walk else 3)) * 0.3)
        if 3.6 <= t < 5.8:
            gl = mv.glow_layer(img.size, hand, 150 * S, (190, 215, 255), 0.45); img.paste(gl, (0, 0), gl); d = ImageDraw.Draw(img)
            mv.phone(d, hand, 1, face=(230, 236, 250))
            for k in range(4):
                d.line([hand[0] - 9 * S, hand[1] - (14 - k * 8) * S, hand[0] + 9 * S, hand[1] - (14 - k * 8) * S], fill=(120, 130, 150), width=2 * S)
        elif t < 3.6 and t > 0.8:
            pass
        if t >= 5.8:  # hp telungkup di lantai
            px = 600 * S
            d.rounded_rectangle([px - 28 * S, (base - 8) * S, px + 28 * S, base * S], 3 * S, fill=(30, 36, 50), outline=WHITE, width=2 * S)
        d.text(((PW - 30) * S, 44 * S), "online" if t < 6 else "terakhir dilihat", font=F(26 * S, False), fill=(120, 210, 150) if t < 6 else GREY, anchor="rm")
    for a, b, s_, c in caps:
        if a <= t < b:
            al = min(seg(t, a, a + 0.25), 1 - seg(t, b - 0.2, b))
            d.text((26 * S, 78 * S), s_, font=f_sub, fill=fade(c, al, BG), anchor="lm")
    img = img.resize((PW, PH), Image.LANCZOS)
    ImageDraw.Draw(img).rectangle([0, 0, PW - 1, PH - 1], outline=(40, 48, 66), width=2)
    return img

TITLE = "SEEN DOANG."
CAPS = [(0.4, 2.5, "Kamu curhat panjang banget..."), (2.5, 4.0, "Terkirim."), (4.0, 5.7, "Dibaca. Seen."),
        (5.7, 7.4, "Terus... hilang."), (7.4, 9.3, "5 menit. 1 jam. Semalaman."), (9.3, 11.0, "Ada notif — ternyata promo."),
        (11.0, 13.6, "Kamu bales sendiri: \"gapapa kok.\""), (14.3, 17.0, "Seen itu tanda dia tau."),
        (17.7, 19.8, "Jangan ngemis perhatian.")]

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
            # kata ter-highlight (kuning) mengikuti waktu
            idx = int(clamp((t - a) / (b - a - 0.2)) * len(words)); idx = min(idx, len(words) - 1)
            n = 0
            for li, ln in enumerate(lines):
                ws = ln.split(" "); tw = d.textlength(ln, font=f); x = W / 2 - tw / 2
                for w in ws:
                    c = GOLD if n == idx else WHITE
                    c = fade(c, al)
                    d.text((x, y0 + li * 68), w, font=f, fill=c, anchor="lm", stroke_width=5, stroke_fill=(0, 0, 0))
                    x += d.textlength(w + " ", font=f); n += 1
            return

def frame(i):
    t = i / FPS
    img = Image.new("RGB", (W, H), (0, 0, 0)); d = ImageDraw.Draw(img)
    n = int(clamp(t / 1.0) * len(TITLE)); text_c(d, (W / 2, 170), TITLE[:n], F(40), WHITE, sp=8)
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
        line("SEEN BUKAN LUPA.", 800, 14.2, font=F(80))
        line("ITU PILIHAN.", 960, 15.6, font=F(96))
    if t >= 17.4:
        d.rectangle([0, 700, W, 1250], fill=(0, 0, 0))
        line("PILIH YANG", 860, 17.7, font=F(92)); line("MEMBALAS.", 990, 18.0, col=GOLD, font=F(112))
        line("bukan yang cuma membaca.", 1150, 18.6, col=GREY, font=F(30, False), sp=3)
    caption(img, t)
    return img

def build_audio(path, sr=44100):
    n = sr * DUR; t = np.arange(n) / sr; a = np.zeros(n); rng = np.random.default_rng(3)
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
    for k in range(14): noise(1.2 + k * 0.1, 0.03, 0.35, 120)                # ketik
    for k in range(14): tone(1.2 + k * 0.1, 3000, 0.02, 0.05, 150)
    noise(2.55, 0.35, 0.22, 7, 30); tone(2.6, 500, 0.3, 0.12, 8, 1400)         # whoosh kirim
    tone(2.62, 1000, 0.3, 0.12); tone(2.85, 1200, 0.25, 0.1)                    # bubble pop
    tone(4.0, 1500, 0.12, 0.2, 30); tone(4.08, 2000, 0.2, 0.18, 20)             # "dibaca" pop
    for k in range(3): tone(3.6 + k * 0.12, 90, 0.08, 0.3, 40)                  # hp getar (B)
    noise(5.8, 0.12, 0.6, 40, 20); tone(5.8, 70, 0.3, 0.35, 15)                 # hp dilempar telungkup
    for k, tt_ in enumerate(np.arange(6.0, 13.0, 0.5 - 0.0)):                   # tik-tok jam
        tone(tt_, 1800 if k % 2 == 0 else 1300, 0.06, 0.13, 70)
    tone(9.4, 880, 0.15, 0.22, 20); tone(9.55, 1175, 0.3, 0.2, 10)             # notif promo
    tone(10.7, 600, 0.9, 0.2, 3, 150)                                           # womp turun
    tone(11.7, 400, 0.25, 0.1, 8, 300); tone(11.6, 1100, 0.15, 0.12, 20)       # kirim "gapapa"
    tone(14.3, 55, 1.4, 0.4, 3); noise(14.3, 0.4, 0.15, 12, 40)                 # hit
    noise(15.5, 0.25, 0.08, 10, 30)
    for f in (440, 554.4, 659.3): tone(17.7, f, 2.2, 0.12, 2)                   # resolusi
    tone(17.7, 2093, 0.6, 0.06, 6)
    a = np.tanh(a * 1.3); a[-sr:] *= np.linspace(1, 0, sr)
    with wave.open(path, "w") as w:
        w.setnchannels(1); w.setsampwidth(2); w.setframerate(sr); w.writeframes((a * 32000).astype(np.int16).tobytes())

def work(a): i, tmp = a; frame(i).save(f"{tmp}/{i:04d}.png")

if __name__ == "__main__":
    tmp = os.path.dirname(os.path.abspath(OUT)) + "/_frames_seen"; os.makedirs(tmp, exist_ok=True)
    with Pool(4) as p: p.map(work, [(i, tmp) for i in range(FPS * DUR)], chunksize=10)
    build_audio(tmp + "/a.wav")
    subprocess.run(["ffmpeg", "-y", "-v", "error", "-framerate", str(FPS), "-i", tmp + "/%04d.png", "-i", tmp + "/a.wav",
                    "-c:v", "libx264", "-pix_fmt", "yuv420p", "-crf", "18", "-c:a", "aac", "-b:a", "160k", "-shortest",
                    "-movflags", "+faststart", OUT], check=True)
    print("ok")

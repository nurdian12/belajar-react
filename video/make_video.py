"""Video 20 dtk 1080x1920: 'Chat jam 1, dibalas jam 12' (gaya stick-figure ala referensi)."""
import math, subprocess, sys, wave, os
import numpy as np
from PIL import Image, ImageDraw, ImageFont
from multiprocessing import Pool

W, H, FPS, DUR = 1080, 1920, 30, 20
OUT = sys.argv[1] if len(sys.argv) > 1 else "out.mp4"
FD = "/usr/share/fonts/truetype/jetbrains-mono/JetBrainsMono-"
def F(sz, b=True): return ImageFont.truetype(FD + ("Bold" if b else "Regular") + ".ttf", sz)
GOLD, WHITE, GREY, BLUE = (255, 196, 70), (240, 240, 240), (140, 145, 160), (90, 170, 255)

def clamp(x, a=0.0, b=1.0): return max(a, min(b, x))
def ease(x): x = clamp(x); return x * x * (3 - 2 * x)
def seg(t, a, b): return ease((t - a) / (b - a))

def text_c(d, xy, s, font, fill, sp=0):
    w = sum(d.textlength(c, font=font) + sp for c in s) - sp
    x = xy[0] - w / 2
    for c in s:
        d.text((x, xy[1]), c, font=font, fill=fill, anchor="lm"); x += d.textlength(c, font=font) + sp

def fade(c, a, bg=(0, 0, 0)): return tuple(int(bg[i] + (c[i] - bg[i]) * a) for i in range(3))

def clock_str(t):
    # 01:00 -> 12:00 antara t=3 dan t=11 (makin cepat), lalu 12:00
    p = clamp((t - 3.2) / (11.0 - 3.2))
    mins = 60 + (12 * 60 - 60) * (p ** 1.6)
    mins = int(mins) if p < 1 else 720
    return "%02d:%02d" % (mins // 60, mins % 60)

PW, PH = 960, 600  # panel
S = 2              # supersample

def figure(d, x, base, color, pose, phone=None, lean=0.0, s=1.0):
    """stick figure; pose 'hold' = lengan memegang hp di depan."""
    u = S * s
    X, Y = x * S, base * S
    hip = (X + lean * 6 * S, Y - 120 * u)
    sh = (X + lean * 14 * S, Y - 215 * u)
    head = (sh[0] + lean * 6 * S, sh[1] - 38 * u)
    lw = int(9 * S)
    d.line([hip, (X - 22 * u, Y), ], fill=color, width=lw)
    d.line([hip, (X + 22 * u, Y)], fill=color, width=lw)
    d.line([hip, sh], fill=color, width=lw)
    r = 30 * u
    d.ellipse([head[0] - r, head[1] - r, head[0] + r, head[1] + r], fill=color)
    hand = (sh[0] + 78 * u, sh[1] + 35 * u + pose * 10 * u)
    d.line([sh, (sh[0] + 35 * u, sh[1] + 60 * u), hand], fill=color, width=lw, joint="curve")
    d.line([sh, (sh[0] - 35 * u, sh[1] + 75 * u)], fill=color, width=lw)
    return hand

def phone(d, hand, glow, S_=1.0, face=None):
    x, y = hand
    w, h = 34 * S, 56 * S
    if glow > 0:
        for i in range(6, 0, -1):
            rr = i * 26 * S
            a = glow * (0.05)
            col = fade((255, 210, 120), a, (12, 16, 28))
            d.ellipse([x - rr, y - rr, x + rr, y + rr], fill=col) if False else None
    d.rounded_rectangle([x - w / 2, y - h / 2, x + w / 2, y + h / 2], 5 * S, fill=(30, 36, 50), outline=WHITE, width=2 * S)
    d.rounded_rectangle([x - w / 2 + 4 * S, y - h / 2 + 5 * S, x + w / 2 - 4 * S, y + h / 2 - 5 * S], 3 * S, fill=face or (60, 120, 200))

def glow_layer(size, pos, rad, color, strength):
    """glow lembut (gradient radial) sebagai RGBA."""
    gw, gh = size
    yy, xx = np.mgrid[0:gh, 0:gw]
    dist = np.sqrt((xx - pos[0]) ** 2 + (yy - pos[1]) ** 2) / rad
    a = np.clip(1 - dist, 0, 1) ** 2 * strength
    arr = np.zeros((gh, gw, 4), np.uint8)
    arr[..., 0], arr[..., 1], arr[..., 2] = color
    arr[..., 3] = (a * 255).astype(np.uint8)
    return Image.fromarray(arr, "RGBA")

def bubble(d, x, y, s, font, fill, tcol, tail="l", alpha=1.0):
    w = d.textlength(s, font=font) + 44 * S
    h = 62 * S
    d.rounded_rectangle([x, y, x + w, y + h], 22 * S, fill=fade(fill, alpha, (12, 16, 28)))
    d.text((x + 22 * S, y + h / 2), s, font=font, fill=fade(tcol, alpha, (12, 16, 28)), anchor="lm")
    return w, h

def panel(t, which):
    img = Image.new("RGB", (PW * S, PH * S), (12, 16, 28))
    d = ImageDraw.Draw(img)
    bg = (12, 16, 28)
    # spotlight
    cone = Image.new("RGBA", img.size, (0, 0, 0, 0)); cd = ImageDraw.Draw(cone)
    cx = (620 if which == "A" else 700) * S
    cd.polygon([(cx - 40 * S, 0), (cx + 40 * S, 0), (cx + 230 * S, 520 * S), (cx - 230 * S, 520 * S)], fill=(150, 170, 220, 22))
    img.paste(cone, (0, 0), cone)
    d = ImageDraw.Draw(img)
    floor = (PH - 90) * S
    d.rectangle([0, floor, PW * S, PH * S], fill=(62, 64, 72))
    d.line([0, floor, PW * S, floor], fill=(110, 112, 122), width=2 * S)
    base = PH - 90
    f_lab, f_sub, f_clk = F(26 * S), F(21 * S, False), F(54 * S)
    big = F(30 * S)

    if which == "A":
        d.text((26 * S, 36 * S), "DIA YANG MENUNGGU", font=f_lab, fill=WHITE, anchor="lm")
        caps = [(0.8, 3.0, "KIRIM CHAT JAM 01.00", GREY), (3.0, 5.5, "CENTANG DUA. SUDAH DIBACA.", GREY),
                (5.5, 8.0, "MASIH MENUNGGU...", GREY), (8.0, 11.0, "CEK HP SETIAP 5 MENIT", GREY),
                (11.0, 13.5, "JAM 12.00: \"MAAF BARU BALAS\"", GOLD)]
        figx = 220
        look = clamp((t - 3) / 8)
        col = fade(WHITE, 1 - 0.35 * seg(t, 11.3, 13.5))
        hand = figure(d, figx, base, col, math.sin(t * (2 + 10 * look)) * (0.2 + look) * (t > 3), lean=look * 0.8)
        # glow dari hp
        gl = glow_layer(img.size, (hand[0], hand[1]), 190 * S, (255, 205, 110), 0.55 * (1 - 0.8 * seg(t, 11.5, 13.5)) * (0.85 + 0.15 * math.sin(t * 6)))
        img.paste(gl, (0, 0), gl); d = ImageDraw.Draw(img)
        face = (60, 120, 200)
        phone(d, hand, 1, face=face)
        # jam
        cs = clock_str(t) if t > 0.8 else "--:--"
        ccol = GOLD if t > 11 else WHITE
        d.text(((PW - 30) * S, 44 * S), cs, font=f_clk, fill=ccol, anchor="rm")
        # bubble terkirim
        a = seg(t, 1.4, 1.9)
        if a > 0:
            w, h = bubble(d, 360 * S, (210 - 20 * (1 - a)) * S, "udah makan belum?", big, (36, 110, 190), WHITE, alpha=a)
            ck = seg(t, 3.0, 3.4)
            if t < 3.0: d.text((360 * S + w + 10 * S, 240 * S), "v", font=f_sub, fill=GREY, anchor="lm")
            else:
                d.text((360 * S + w + 10 * S, 240 * S), "vv", font=f_sub, fill=fade(GREY, 1 - ck) if False else BLUE, anchor="lm")
        # titik tunggu
        if 5.5 < t < 11.5:
            n = int(t * 2.5) % 4
            d.text((365 * S, 330 * S), "." * n, font=F(60 * S), fill=GREY, anchor="lm")
        # balasan masuk
        a = seg(t, 12.0, 12.4)
        if a > 0:
            bubble(d, 330 * S, (330 - 20 * (1 - a)) * S, "maaf baru bales ya", big, (60, 62, 74), WHITE, alpha=a)
    else:
        d.text((26 * S, 36 * S), "DIA YANG SIBUK", font=f_lab, fill=WHITE, anchor="lm")
        caps = [(0.8, 5.5, "BUKA REELS DULU", GREY), (5.5, 8.0, "SCROLL LAGI DAN LAGI", GREY),
                (8.0, 11.0, "\"BALAS NANTI AH\"", GREY), (11.0, 13.5, "AKHIRNYA NGETIK...", GOLD)]
        figx = 730
        col = (200, 200, 205) if t < 11 else fade((200, 200, 205), 1)
        lean = -0.5
        hand = figure(d, figx, base, col, math.sin(t * 5) * 0.4)
        hand = (hand[0] - 150 * S, hand[1] - 0 * S) if False else hand
        # layar hp discroll
        gl = glow_layer(img.size, (hand[0], hand[1]), 150 * S, (190, 90, 220) if t < 11 else (255, 205, 110), 0.35)
        img.paste(gl, (0, 0), gl); d = ImageDraw.Draw(img)
        phone(d, hand, 1, face=(150, 70, 200) if t < 11 else (60, 120, 200))
        # mini feed (reels/story) di sebelah kiri
        if 0.8 < t < 11:
            fx, fy = 420 * S, 150 * S
            d.rounded_rectangle([fx, fy, fx + 170 * S, fy + 300 * S], 14 * S, outline=GREY, width=2 * S)
            off = (t * 140) % 100
            for i in range(-1, 4):
                yy = fy + (i * 100 + off) * S
                y0, y1 = max(fy + 8 * S, yy + 8 * S), min(fy + 300 * S - 8 * S, yy + 92 * S)
                if y1 > y0:
                    c = [(190, 90, 220), (240, 120, 100), (90, 170, 255), (120, 210, 150)][i % 4]
                    d.rounded_rectangle([fx + 10 * S, y0, fx + 160 * S, y1], 8 * S, fill=fade(c, 0.55, bg))
            if t > 8:
                d.text((fx + 85 * S, fy + 330 * S), "1 chat belum dibalas", font=F(17 * S, False), fill=GREY, anchor="mm")
        # mini jam
        d.text(((PW - 30) * S, 44 * S), clock_str(t) if t > 0.8 else "--:--", font=F(40 * S), fill=GOLD if t > 11 else GREY, anchor="rm")
        # mengetik -> terkirim
        if t > 11:
            n = int(t * 4) % 4
            if t < 12.0:
                bubble(d, 360 * S, 170 * S, "mengetik" + "." * n, big, (60, 62, 74), WHITE, alpha=seg(t, 11, 11.3))
            else:
                bubble(d, 330 * S, 170 * S, "maaf baru bales ya", big, (60, 62, 74), WHITE)
    for a, b, s_, c in caps:
        if a <= t < b:
            al = min(seg(t, a, a + 0.25), 1 - seg(t, b - 0.2, b))
            d.text((26 * S, 78 * S), s_, font=f_sub, fill=fade(c, al, bg), anchor="lm")
    img = img.resize((PW, PH), Image.LANCZOS)
    ImageDraw.Draw(img).rectangle([0, 0, PW - 1, PH - 1], outline=(40, 48, 66), width=2)
    return img

TITLE = "CHAT ITU SOAL PRIORITAS."
def frame(i):
    t = i / FPS
    img = Image.new("RGB", (W, H), (0, 0, 0)); d = ImageDraw.Draw(img)
    # judul typewriter
    n = int(clamp(t / 1.2) * len(TITLE))
    text_c(d, (W / 2, 170), TITLE[:n], F(34), WHITE, sp=6)
    dim = 1 - 0.88 * seg(t, 13.6, 14.6)
    pa, pb = panel(t, "A"), panel(t, "B")
    if dim < 1:
        for p in (pa, pb):
            pass
        pa = Image.blend(Image.new("RGB", pa.size, (0, 0, 0)), pa, dim)
        pb = Image.blend(Image.new("RGB", pb.size, (0, 0, 0)), pb, dim)
    if t > 0.3:
        s = seg(t, 0.3, 0.9)
        img.paste(pa, (60, int(330 + 30 * (1 - s)))) if s >= 1 else img.paste(Image.blend(Image.new("RGB", pa.size, (0, 0, 0)), pa, s), (60, int(330 + 30 * (1 - s))))
        img.paste(pb, (60, 990)) if s >= 1 else img.paste(Image.blend(Image.new("RGB", pb.size, (0, 0, 0)), pb, s), (60, int(990 + 30 * (1 - s))))
    if t > 13.6:
        dim_t = seg(t, 13.6, 14.6)
        img_t = ImageDraw.Draw(img)
        # judul meredup
        pass
    # teks akhir
    d = ImageDraw.Draw(img)
    big = F(88)
    def line(txt, y, a0, col=WHITE, font=big, sp=6, up=True):
        a = seg(t, a0, a0 + 0.6)
        if a > 0: text_c(d, (W / 2, y + 24 * (1 - a)), txt, font, fade(col, a), sp=sp)
    if t >= 14.2:
        line("DIA GAK SIBUK.", 800, 14.2)
        line("KAMU BUKAN", 1000, 15.8, font=F(78)); line("PRIORITASNYA.", 1100, 16.1, font=F(78), col=WHITE)
    if t >= 17.4:
        # ganti ke kalimat penutup (hapus yang sebelumnya dengan overlay hitam)
        fa = seg(t, 17.2, 17.7)
        d.rectangle([0, 700, W, 1250], fill=(0, 0, 0)) if fa >= 1 else None
    if t >= 17.7:
        line("PILIH YANG", 880, 17.7, font=F(92)); line("NYEMPETIN.", 1000, 18.0, col=GOLD, font=F(104))
        line("bukan yang nyari alasan.", 1160, 18.6, col=GREY, font=F(30, False), sp=3)
    return img

def build_audio(path, sr=44100):
    n = sr * DUR; t = np.arange(n) / sr; a = np.zeros(n)
    # pad lembut (Am - F)
    chords = [(0, 8, [110, 164.8, 220]), (8, 14, [87.3, 130.8, 174.6]), (14, 20, [110, 164.8, 220, 261.6])]
    for s, e, fs in chords:
        m = (t >= s) & (t < e)
        env = np.clip((t - s) / 1.5, 0, 1) * np.clip((e - t) / 1.5, 0, 1)
        for f in fs: a += np.where(m, np.sin(2 * np.pi * f * t) * env * 0.05, 0)
    def tone(at, f, dur, vol, decay=8):
        i0 = int(at * sr); l = int(dur * sr); tt = np.arange(l) / sr
        w = np.sin(2 * np.pi * f * tt) * np.exp(-decay * tt) * vol
        a[i0:i0 + l] += w[: max(0, min(l, n - i0))]
    # tick-tock jam, makin cepat
    tt_ = 3.2; k = 0
    while tt_ < 11.0:
        tone(tt_, 1800 if k % 2 == 0 else 1300, 0.08, 0.18, 60)
        p = (tt_ - 3.2) / 7.8; tt_ += 0.55 - 0.38 * p; k += 1
    tone(1.4, 880, 0.4, 0.25); tone(1.55, 1320, 0.5, 0.2)     # terkirim
    tone(3.0, 1100, 0.3, 0.18)                                 # dibaca
    tone(12.0, 660, 0.5, 0.25); tone(12.18, 495, 0.7, 0.22)   # balasan telat
    tone(14.4, 110, 1.2, 0.3, 3)                               # thud
    for f in (440, 554.4, 659.3): tone(17.7, f, 2.2, 0.12, 2)  # resolusi
    a = np.tanh(a * 1.3); a[-sr:] *= np.linspace(1, 0, sr)
    pcm = (a * 32000).astype(np.int16)
    with wave.open(path, "w") as w:
        w.setnchannels(1); w.setsampwidth(2); w.setframerate(sr); w.writeframes(pcm.tobytes())

if __name__ == "__main__":
    tmp = os.path.dirname(os.path.abspath(OUT)) + "/_frames"; os.makedirs(tmp, exist_ok=True)
    def work(i): frame(i).save(f"{tmp}/{i:04d}.png"); return i
    with Pool(4) as p: p.map(work, range(FPS * DUR), chunksize=10)
    wav = tmp + "/a.wav"; build_audio(wav)
    subprocess.run(["ffmpeg", "-y", "-v", "error", "-framerate", str(FPS), "-i", tmp + "/%04d.png", "-i", wav,
                    "-c:v", "libx264", "-pix_fmt", "yuv420p", "-crf", "18", "-c:a", "aac", "-b:a", "160k", "-shortest",
                    "-movflags", "+faststart", OUT], check=True)
    print("ok", OUT)

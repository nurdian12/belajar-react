#!/usr/bin/env python3
"""Buat 100 kartu gambar (1080x1350) + caption dari konten.txt -> out/NNN.jpg dan manifest.json.
Pakai:  python3 buat_kartu.py
Butuh:  Pillow, numpy"""
import json, os
import numpy as np
from PIL import Image, ImageDraw, ImageFont

HERE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(HERE, "out"); os.makedirs(OUT, exist_ok=True)
W, H = 1080, 1350
FB = "/usr/share/fonts/opentype/inter/Inter-ExtraBold.otf"
FM = "/usr/share/fonts/opentype/inter/Inter-Medium.otf"
FSB = "/usr/share/fonts/opentype/inter/Inter-SemiBold.otf"
WHITE, AMBER, GRAY = (246, 247, 251), (245, 166, 35), (165, 172, 190)
CTA = {"KERJA": "Setuju nggak? Tag rekan kerja yang perlu baca ini.",
       "UANG": "Simpan postingan ini supaya nggak lupa. Kamu sudah mulai dari mana?",
       "KELUARGA": "Bagikan ke keluargamu. Cerita kamu apa? Tulis di komentar.",
       "USAHA KECIL": "Punya usaha? Tulis kendalamu di komentar, kita bahas bareng."}
TAGS = {"KERJA": "#karier #gaji", "UANG": "#keuangan #nabung", "KELUARGA": "#keluarga #keuangankeluarga", "USAHA KECIL": "#usahakecil #umkm"}

def load():
    cat, items = None, []
    for l in open(os.path.join(HERE, "konten.txt"), encoding="utf8"):
        l = l.rstrip("\n")
        if not l.strip(): continue
        if l.startswith("## "): cat = l[3:]; continue
        hook, isi, key = l.split("|")
        items.append(dict(kategori=cat, hook=hook, isi=isi, kunci=key))
    return items

def background():
    yy, xx = np.mgrid[0:H, 0:W].astype(np.float32)
    v = 1 - .5 * (((xx - W / 2) / (W * .85)) ** 2 + ((yy - H * .42) / (H * .8)) ** 2)
    img = np.array([17, 23, 36], np.float32)[None, None, :] * np.clip(v, .3, 1.1)[:, :, None]
    return Image.fromarray(np.clip(img, 0, 255).astype(np.uint8))
BG = background()

def wrap(words, f, maxw):
    lines, cur = [], []
    for w in words:
        t = " ".join(x[0] for x in cur + [w])
        if cur and f.getlength(t) > maxw: lines.append(cur); cur = [w]
        else: cur.append(w)
    if cur: lines.append(cur)
    return lines

def words_with_key(text, key):
    s = text.find(key); e = s + len(key); pos = 0; out = []
    for w in text.split(" "):
        a = pos; b = pos + len(w); pos = b + 1
        out.append((w, s >= 0 and a < e and b > s))
    return out

def draw_lines(d, lines, f, x0, y, lh, maxw, normal, hi, center=True):
    for ln in lines:
        sp = f.getlength(" ")
        tw = sum(f.getlength(w) for w, _ in ln) + sp * (len(ln) - 1)
        x = (W - tw) / 2 if center else x0
        for w, k in ln:
            d.text((x, y), w, font=f, fill=hi if k else normal, anchor="lm")
            x += f.getlength(w) + sp
        y += lh
    return y

def kartu(i, it):
    img = BG.copy(); d = ImageDraw.Draw(img)
    chip = ImageFont.truetype(FSB, 30); d.rounded_rectangle([72, 72, 72 + chip.getlength(it["kategori"]) + 56 + 12 * (len(it["kategori"]) - 1), 132], 30, outline=AMBER, width=3)
    d.text((100, 102), " ".join(it["kategori"]), font=chip, fill=AMBER, anchor="lm")
    d.text((W - 72, 102), f"{i:03d} / 100", font=ImageFont.truetype(FM, 30), fill=(110, 118, 138), anchor="rm")
    # hook: turunkan ukuran font sampai muat maksimal 6 baris
    for size in (92, 84, 76, 68, 60):
        f = ImageFont.truetype(FB, size); lines = wrap(words_with_key(it["hook"], it["kunci"]), f, W - 170)
        if len(lines) <= 6: break
    lh = int(size * 1.22); block = len(lines) * lh
    fi = ImageFont.truetype(FM, 38); isi_lines = wrap([(w, False) for w in it["isi"].split(" ")], fi, W - 190)
    total = block + 70 + len(isi_lines) * 56
    y = 190 + (H - 190 - 170 - total) / 2 + lh / 2
    y = draw_lines(d, lines, f, 0, y, lh, W - 170, WHITE, AMBER)
    d.rounded_rectangle([W / 2 - 50, y + 4, W / 2 + 50, y + 11], 4, fill=AMBER)
    draw_lines(d, isi_lines, fi, 0, y + 70, 56, W - 190, GRAY, GRAY)
    ff = ImageFont.truetype(FSB, 28)
    d.text((W / 2, H - 80), "F I N A N S I A L   F R E E D O M", font=ff, fill=(120, 128, 148), anchor="mm")
    return img

def main():
    items = load(); assert len(items) == 100, len(items)
    manifest = []
    for i, it in enumerate(items, 1):
        fn = f"{i:03d}.jpg"; kartu(i, it).save(os.path.join(OUT, fn), quality=90)
        cap = f"{it['hook']}\n\n{it['isi']}\n\n{CTA[it['kategori']]}\n\n#finansialfreedom #literasikeuangan {TAGS[it['kategori']]}"
        manifest.append(dict(n=i, kategori=it["kategori"], hook=it["hook"], file=fn, caption=cap))
    json.dump(manifest, open(os.path.join(HERE, "manifest.json"), "w", encoding="utf8"), ensure_ascii=False, indent=1)
    print("selesai:", len(manifest), "kartu")

if __name__ == "__main__":
    main()

#!/usr/bin/env python3
"""Buat 40 carousel (7 slide, 1080x1350) dari carousel.txt -> carousel/NN/sK.jpg dan manifest_carousel.json.
Pakai:  python3 buat_carousel.py   (butuh Pillow, numpy)"""
import json, os
import numpy as np
from PIL import Image, ImageDraw, ImageFont

HERE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(HERE, "carousel")
W, H = 1080, 1350
FB, FM, FSB, FBL = (f"/usr/share/fonts/opentype/inter/Inter-{n}.otf" for n in ("ExtraBold", "Medium", "SemiBold", "Black"))
WHITE, AMBER, GRAY, DIM = (246, 247, 251), (245, 166, 35), (170, 177, 195), (110, 118, 138)
CTA = {"KERJA": "Setuju? Tag rekan kerja yang perlu baca ini.",
       "UANG": "Simpan supaya nggak lupa. Kamu sudah menerapkan yang mana?",
       "KELUARGA": "Bagikan ke keluargamu. Tulis pengalamanmu di komentar.",
       "USAHA KECIL": "Punya usaha? Tulis kendalamu di komentar, kita bahas bareng."}
TAGS = {"KERJA": "#karier #gaji", "UANG": "#keuangan #nabung", "KELUARGA": "#keluarga #keuangankeluarga", "USAHA KECIL": "#usahakecil #umkm"}

def load():
    cat, items = None, []
    for l in open(os.path.join(HERE, "carousel.txt"), encoding="utf8"):
        l = l.rstrip("\n")
        if not l.strip(): continue
        if l.startswith("## "): cat = l[3:]; continue
        parts = l.split("|"); pts = [tuple(p.split("::")) for p in parts[1:]]
        assert len(pts) == 5 and all(len(p) == 2 for p in pts), l
        items.append(dict(kategori=cat, judul=parts[0], poin=pts))
    return items

def bg():
    yy, xx = np.mgrid[0:H, 0:W].astype(np.float32)
    v = 1 - .5 * (((xx - W / 2) / (W * .85)) ** 2 + ((yy - H * .42) / (H * .8)) ** 2)
    return Image.fromarray(np.clip(np.array([17, 23, 36], np.float32)[None, None] * np.clip(v, .3, 1.1)[:, :, None], 0, 255).astype(np.uint8))
BG = bg()
def F(p, s): return ImageFont.truetype(p, s)

def wrap(text, f, maxw):
    lines, cur = [], ""
    for w in text.split(" "):
        t = (cur + " " + w).strip()
        if cur and f.getlength(t) > maxw: lines.append(cur); cur = w
        else: cur = t
    return lines + [cur]

def frame(kat, idx, total, footer=True):
    img = BG.copy(); d = ImageDraw.Draw(img)
    chip = F(FSB, 30); cw = chip.getlength(kat) + 56 + 12 * (len(kat) - 1)
    d.rounded_rectangle([72, 72, 72 + cw, 132], 30, outline=AMBER, width=3)
    d.text((100, 102), " ".join(kat), font=chip, fill=AMBER, anchor="lm")
    d.text((W - 72, 102), f"{idx} / {total}", font=F(FM, 30), fill=DIM, anchor="rm")
    if footer: d.text((W / 2, H - 80), "F I N A N S I A L   F R E E D O M", font=F(FSB, 28), fill=(120, 128, 148), anchor="mm")
    return img, d

def center_block(d, lines, f, lh, y, fill, x=None, anchor="mm"):
    for i, ln in enumerate(lines): d.text((x if x is not None else W / 2, y + i * lh), ln, font=f, fill=fill, anchor=anchor)
    return y + len(lines) * lh

def cover(it, n, total=7):
    img, d = frame(it["kategori"], 1, total)
    for size in (104, 94, 84, 74):
        f = F(FB, size); lines = wrap(it["judul"], f, W - 170)
        if len(lines) <= 5: break
    lh = int(size * 1.22); y0 = (H - len(lines) * lh) / 2 - 20
    for i, ln in enumerate(lines): d.text((W / 2, y0 + i * lh), ln, font=f, fill=AMBER if i == 0 else WHITE, anchor="mm")
    d.rounded_rectangle([W / 2 - 50, y0 + len(lines) * lh + 8, W / 2 + 50, y0 + len(lines) * lh + 15], 4, fill=AMBER)
    d.text((W / 2, H - 200), "Geser untuk baca   →", font=F(FSB, 38), fill=GRAY, anchor="mm")
    d.text((W / 2, H - 150), f"Seri {n:02d} / 40", font=F(FM, 26), fill=DIM, anchor="mm")
    return img

def point(it, k, total=7):
    head, body = it["poin"][k]
    img, d = frame(it["kategori"], k + 2, total)
    d.ellipse([72, 330, 72 + 150, 330 + 150], fill=AMBER)
    d.text((72 + 75, 330 + 78), str(k + 1), font=F(FBL, 96), fill=(28, 24, 14), anchor="mm")
    f = F(FB, 80); lines = wrap(head, f, W - 160)
    if len(lines) > 3: f = F(FB, 66); lines = wrap(head, f, W - 160)
    y = center_block(d, lines, f, 100, 590, WHITE, x=80, anchor="lm")
    d.rounded_rectangle([80, y - 24, 180, y - 17], 4, fill=AMBER)
    fb = F(FM, 46); center_block(d, wrap(body, fb, W - 170), fb, 68, y + 50, GRAY, x=80, anchor="lm")
    return img

def closing(it, total=7):
    img, d = frame(it["kategori"], total, total)
    d.text((W / 2, 260), "Rangkuman", font=F(FB, 76), fill=AMBER, anchor="mm")
    y = 380
    for i, (head, _) in enumerate(it["poin"]):
        d.ellipse([90, y - 22, 134, y + 22], fill=AMBER); d.text((112, y + 2), str(i + 1), font=F(FBL, 28), fill=(28, 24, 14), anchor="mm")
        f = F(FSB, 44); ls = wrap(head, f, W - 270)
        for j, ln in enumerate(ls): d.text((160, y + j * 54), ln, font=f, fill=WHITE, anchor="lm")
        y += max(1, len(ls)) * 54 + 36
    d.rounded_rectangle([90, y + 10, 190, y + 17], 4, fill=AMBER)
    d.text((W / 2, H - 190), "Simpan dan bagikan", font=F(FB, 54), fill=WHITE, anchor="mm")
    return img

def main():
    items = load(); assert len(items) == 40, len(items); manifest = []
    for n, it in enumerate(items, 1):
        dr = os.path.join(OUT, f"{n:02d}"); os.makedirs(dr, exist_ok=True)
        slides = [cover(it, n)] + [point(it, k) for k in range(5)] + [closing(it)]
        files = []
        for i, im in enumerate(slides, 1):
            fn = f"s{i}.jpg"; im.save(os.path.join(dr, fn), quality=90); files.append(f"{n:02d}/{fn}")
        poin = "\n".join(f"{i}. {h}: {b}" for i, (h, b) in enumerate(it["poin"], 1))
        cap = f"{it['judul']}\n\n{poin}\n\n{CTA[it['kategori']]}\n\n#finansialfreedom #literasikeuangan {TAGS[it['kategori']]}"
        manifest.append(dict(n=n, kategori=it["kategori"], judul=it["judul"], files=files, caption=cap))
    json.dump(manifest, open(os.path.join(HERE, "manifest_carousel.json"), "w", encoding="utf8"), ensure_ascii=False, indent=1)
    print("selesai:", len(manifest), "carousel,", len(manifest) * 7, "slide")

if __name__ == "__main__":
    main()

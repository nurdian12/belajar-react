#!/usr/bin/env python3
"""Thumbnail / cover Instagram (1080x1920) untuk seri video percintaan.

Tiap cover: judul besar + dua panel (angle A redup vs angle B terang) yang diambil
dari momen paling kuat di videonya. Elemen penting ada di area aman crop grid 3:4
(y 240-1680) dan crop 1:1 (y 420-1500 hampir seluruhnya).

Menghasilkan dua set: feed/grid (thumb-*.png) dan Reels (reels/reels-*.png).\nPakai: python3 video/make_thumbnails.py [folder_output]
Butuh: Pillow, numpy (modul video di folder yang sama).
"""
import os
import sys

sys.dont_write_bytecode = True
HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
OUT_DIR = sys.argv[1] if len(sys.argv) > 1 else os.path.join(HERE, "thumbnail")
sys.argv = sys.argv[:1]  # modul video membaca argv[1] sebagai nama output

import numpy as np
from PIL import Image, ImageDraw, ImageFilter, ImageFont

import make_video_penolakan as pen
PEN_TEARS = list(pen.TEARS)
import make_video_pintu as pintu
import make_video_beban as beban
import make_video_rumah as rumah
import make_video_tenang as tenang
import make_video_gelas as gelas
import make_video_cerita_lentera as cerita

W, H = 1080, 1920
BG = (8, 10, 18)
WHITE = (245, 245, 250)
AMBER = (255, 196, 90)
BLUE = (140, 150, 230)
GREY = (150, 156, 176)
FONT = pen._FM


def font(n):
    return ImageFont.truetype(FONT, n)


def fit(text, maxw, start=100, sp=0):
    n = start
    while n > 30:
        f = font(n)
        if ImageDraw.Draw(Image.new("RGB", (1, 1))).textlength(text, font=f) + sp * len(text) <= maxw:
            return f
        n -= 2
    return font(30)


def center_text(d, text, y, f, fill, sp=2):
    ws = [d.textlength(c, font=f) for c in text]
    x = W / 2 - (sum(ws) + sp * (len(text) - 1)) / 2
    for c, w in zip(text, ws):
        d.text((x, y), c, font=f, fill=fill, anchor="lm")
        x += w + sp


def panel_img(scene, label, label_col, bg_chip, top=150):
    """Potong adegan panel (1280x900) jadi 960x500 dengan chip label."""
    img = scene[0].crop((0, top, 1280, top + 667)).resize((960, 500), Image.LANCZOS)
    d = ImageDraw.Draw(img, "RGBA")
    f = font(30)
    tw = d.textlength(label, font=f)
    d.rounded_rectangle([22, 22, 22 + tw + 40, 22 + 54], radius=14, fill=bg_chip + (235,))
    d.text((42, 49), label, font=f, fill=label_col, anchor="lm")
    mask = Image.new("L", img.size, 0)
    ImageDraw.Draw(mask).rounded_rectangle([0, 0, img.size[0] - 1, img.size[1] - 1], radius=30, fill=255)
    img.putalpha(mask)
    return img


def make_cover(path, series, line1, line2, a_scene, b_scene, a_label, b_label, hint, top=150):
    cv = Image.new("RGB", (W, H), BG)
    # cahaya hangat di belakang panel B
    glow = Image.new("RGB", (W, H), (0, 0, 0))
    ImageDraw.Draw(glow).ellipse([80, 1050, 1000, 1800], fill=(70, 46, 14))
    glow = glow.filter(ImageFilter.GaussianBlur(160))
    cv = Image.fromarray(np.clip(np.asarray(cv, dtype="int16") + np.asarray(glow, dtype="int16"),
                                 0, 255).astype("uint8"))
    d = ImageDraw.Draw(cv)

    d.text((60, 190), series, font=font(30), fill=GREY, anchor="lm")
    f1 = fit(line1, 920, 92)
    f2 = fit(line2, 920, 110)
    center_text(d, line1, 330, f1, WHITE)
    center_text(d, line2, 330 + int(f1.size * 1.25), f2, AMBER)

    pa = panel_img(a_scene, a_label, BLUE, (28, 32, 60), top)
    pb = panel_img(b_scene, b_label, AMBER, (62, 44, 18), top)
    cv.paste(pa, (60, 600), pa)
    cv.paste(pb, (60, 1130), pb)
    # garis penghubung A -> B
    d.text((W / 2, 1115), "VS" if series.startswith("PERCINTAAN") else "LALU", font=font(30), fill=GREY, anchor="mm")
    center_text(d, hint, 1770, font(30), GREY, sp=3)
    cv.save(path)
    print("tersimpan:", path)


def panel_reels(scene, label, label_col, bg_chip, top):
    """Potong adegan panel jadi 880x400 (rasio 2.2) dengan chip label."""
    img = scene[0].crop((0, top, 1280, top + 582)).resize((880, 400), Image.LANCZOS)
    d = ImageDraw.Draw(img, "RGBA")
    f = font(26)
    tw = d.textlength(label, font=f)
    d.rounded_rectangle([18, 18, 18 + tw + 36, 18 + 48], radius=12, fill=bg_chip + (235,))
    d.text((36, 42), label, font=f, fill=label_col, anchor="lm")
    mask = Image.new("L", img.size, 0)
    ImageDraw.Draw(mask).rounded_rectangle([0, 0, img.size[0] - 1, img.size[1] - 1], radius=28, fill=255)
    img.putalpha(mask)
    return img


def make_reels_cover(path, num, line1, line2, a_scene, b_scene, a_label, b_label, top):
    """Cover Reels 1080x1920 yang menghindari area tertutup UI Reels.

    Semua elemen penting ada di y 280-1500 (atas 250 px dan bawah 380 px dipakai UI Reels),
    dan x 100-980 (kolom kanan dipakai tombol like/komentar). Juga aman untuk crop grid 3:4.
    """
    cv = Image.new("RGB", (W, H), BG)
    glow = Image.new("RGB", (W, H), (0, 0, 0))
    ImageDraw.Draw(glow).ellipse([100, 1000, 980, 1560], fill=(70, 46, 14))
    glow = glow.filter(ImageFilter.GaussianBlur(150))
    cv = Image.fromarray(np.clip(np.asarray(cv, dtype="int16") + np.asarray(glow, dtype="int16"),
                                 0, 255).astype("uint8"))
    d = ImageDraw.Draw(cv)
    # lencana seri
    badge = f"SERI PERCINTAAN  {num:02d}" if isinstance(num, int) else num
    bf = font(28)
    bw = d.textlength(badge, font=bf) + 56
    d.rounded_rectangle([W / 2 - bw / 2, 286, W / 2 + bw / 2, 342], radius=28, fill=(30, 34, 52))
    d.text((W / 2, 314), badge, font=bf, fill=GREY, anchor="mm")
    # hook
    f1 = fit(line1, 880, 88)
    f2 = fit(line2, 880, 120)
    center_text(d, line1, 440, f1, WHITE)
    center_text(d, line2, 440 + int(f1.size * 1.3), f2, AMBER)
    # dua angle
    pa = panel_reels(a_scene, a_label, BLUE, (28, 32, 60), top)
    pb = panel_reels(b_scene, b_label, AMBER, (62, 44, 18), top)
    cv.paste(pa, (100, 660), pa)
    cv.paste(pb, (100, 1090), pb)
    d.text((W / 2, 1075), "VS" if isinstance(num, int) else "LALU", font=font(28), fill=GREY, anchor="mm")
    cv.save(path)
    print("tersimpan:", path)


COVERS = [
    # slug, no, baris1, baris2, label A, label B, modul, t_A, t_B, crop feed, crop reels, air mata
    ("penolakan", 1, "DITOLAK BUKAN VONIS,", "ITU FILTER.", "DIA YANG MERATAPI",
     "DIA YANG MENYARING", pen, 8.9, 10.0, 150, 190),
    ("pintu", 2, "YANG PERGI", "MEMBUKA PINTU.", "DIA YANG MENAHAN PINTU",
     "DIA YANG MELIHAT JALAN", pintu, 8.6, 10.1, 150, 190),
    ("move-on", 3, "MOVE ON BUKAN MELUPAKAN,", "TAPI MELETAKKAN.", "DIA YANG MENGUBUR",
     "DIA YANG MELETAKKAN", beban, 9.3, 10.4, 150, 190),
    ("rumah", 4, "JANGAN MINTA DICINTAI,", "JADILAH RUMAHNYA.", "DIA YANG MENGETUK",
     "DIA YANG JADI RUMAH", rumah, 8.2, 10.3, 150, 190),
    ("tenang", 5, "DEBAR BUKAN SELALU CINTA,", "PILIH YANG TENANG.", "DIA YANG MENGEJAR DEBAR",
     "DIA YANG MEMILIH TENANG", tenang, 8.6, 10.0, 205, 280),
    ("gelas", 6, "KESEPIAN BUKAN TANDA KURANG,", "PENUHI DIRIMU DULU.", "DIA YANG MENGISI KOSONG",
     "DIA YANG MENEMANI DIRI", gelas, 9.3, 10.7, 150, 190),
    ("cerita-lentera", "CERITA 01", "BAGI CAHAYAMU,", "JANGAN HABISKAN.", "MEMBERI SAMPAI HABIS",
     "MENYALAKAN SENDIRI", cerita, 16.6, 37.4, 150, 190),
]


def main():
    reels_dir = os.path.join(OUT_DIR, "reels")
    os.makedirs(reels_dir, exist_ok=True)
    for slug, num, l1, l2, la, lb, mod, ta, tb, top_feed, top_reels in COVERS:
        pen.TEARS[:] = PEN_TEARS if mod is pen else list(mod.TEARS)
        sa, sb = mod.panel_A(ta), mod.panel_B(tb)
        make_cover(os.path.join(OUT_DIR, f"thumb-{slug}.png"), (f"PERCINTAAN  #{num:02d}" if isinstance(num, int) else num),
                   l1, l2, sa, sb, la, lb, "TONTON SAMPAI AKHIR", top=top_feed)
        make_reels_cover(os.path.join(reels_dir, f"reels-{slug}.png"), num, l1, l2, sa, sb, la, lb,
                         top_reels)


if __name__ == "__main__":
    main()

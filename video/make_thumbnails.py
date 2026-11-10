#!/usr/bin/env python3
"""Thumbnail / cover Instagram (1080x1920) untuk seri video percintaan.

Tiap cover: judul besar + dua panel (angle A redup vs angle B terang) yang diambil
dari momen paling kuat di videonya. Elemen penting ada di area aman crop grid 3:4
(y 240-1680) dan crop 1:1 (y 420-1500 hampir seluruhnya).

Pakai: python3 video/make_thumbnails.py [folder_output]
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


def panel_img(scene, label, label_col, bg_chip):
    """Potong adegan panel (1280x900) jadi 960x500 dengan chip label."""
    img = scene[0].crop((0, 150, 1280, 817)).resize((960, 500), Image.LANCZOS)
    d = ImageDraw.Draw(img, "RGBA")
    f = font(30)
    tw = d.textlength(label, font=f)
    d.rounded_rectangle([22, 22, 22 + tw + 40, 22 + 54], radius=14, fill=bg_chip + (235,))
    d.text((42, 49), label, font=f, fill=label_col, anchor="lm")
    mask = Image.new("L", img.size, 0)
    ImageDraw.Draw(mask).rounded_rectangle([0, 0, img.size[0] - 1, img.size[1] - 1], radius=30, fill=255)
    img.putalpha(mask)
    return img


def make_cover(path, series, line1, line2, a_scene, b_scene, a_label, b_label, hint):
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

    pa = panel_img(a_scene, a_label, BLUE, (28, 32, 60))
    pb = panel_img(b_scene, b_label, AMBER, (62, 44, 18))
    cv.paste(pa, (60, 600), pa)
    cv.paste(pb, (60, 1130), pb)
    # garis penghubung A -> B
    d.text((W / 2, 1115), "VS", font=font(30), fill=GREY, anchor="mm")
    center_text(d, hint, 1770, font(30), GREY, sp=3)
    cv.save(path)
    print("tersimpan:", path)


def main():
    os.makedirs(OUT_DIR, exist_ok=True)
    # 1. penolakan
    pen.TEARS[:] = PEN_TEARS
    make_cover(os.path.join(OUT_DIR, "thumb-penolakan.png"), "PERCINTAAN  #01",
               "DITOLAK BUKAN VONIS,", "ITU FILTER.",
               pen.panel_A(8.9), pen.panel_B(10.0), "DIA YANG MERATAPI", "DIA YANG MENYARING",
               "TONTON SAMPAI AKHIR")
    # 2. pintu
    base_t = list(pintu.TEARS)
    pen.TEARS[:] = base_t
    make_cover(os.path.join(OUT_DIR, "thumb-pintu.png"), "PERCINTAAN  #02",
               "YANG PERGI", "MEMBUKA PINTU.",
               pintu.panel_A(8.6), pintu.panel_B(10.1), "DIA YANG MENAHAN PINTU",
               "DIA YANG MELIHAT JALAN", "TONTON SAMPAI AKHIR")
    # 3. beban
    pen.TEARS[:] = list(beban.TEARS)
    make_cover(os.path.join(OUT_DIR, "thumb-move-on.png"), "PERCINTAAN  #03",
               "MOVE ON BUKAN MELUPAKAN,", "TAPI MELETAKKAN.",
               beban.panel_A(9.3), beban.panel_B(10.4), "DIA YANG MENGUBUR",
               "DIA YANG MELETAKKAN", "TONTON SAMPAI AKHIR")
    # 4. rumah
    pen.TEARS[:] = list(rumah.TEARS)
    make_cover(os.path.join(OUT_DIR, "thumb-rumah.png"), "PERCINTAAN  #04",
               "JANGAN MINTA DICINTAI,", "JADILAH RUMAHNYA.",
               rumah.panel_A(8.2), rumah.panel_B(10.3), "DIA YANG MENGETUK",
               "DIA YANG JADI RUMAH", "TONTON SAMPAI AKHIR")


if __name__ == "__main__":
    main()

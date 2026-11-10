#!/usr/bin/env python3
"""Thumbnail YouTube 1280x720. Pakai: python3 thumb.py [out.png]"""
import sys
from PIL import Image, ImageDraw, ImageFilter
import render as r

TW, TH, S = 1280, 720, r.S
FB = r.FB

def stroke_text(d, xy, text, size, fill, stroke=10, anchor="mm", spacing=0):
    d.text((xy[0] * S, xy[1] * S), text, font=r.font(FB, size * S), fill=fill, anchor=anchor,
           stroke_width=stroke * S, stroke_fill=(15, 15, 20))

def main(out):
    T = r.EP.THUMB
    bg = r.get_bg(T.get("bg", "park")).resize((TW * S, TH * S), Image.LANCZOS)
    # sorot terang di tengah supaya fokus
    glow = Image.new("RGB", bg.size, (255, 244, 200))
    mask = Image.new("L", bg.size, 0)
    ImageDraw.Draw(mask).ellipse([TW * S * 0.15, TH * S * 0.25, TW * S * 0.85, TH * S * 1.2], fill=90)
    bg = Image.composite(glow, bg, mask.filter(ImageFilter.GaussianBlur(120)))
    d = ImageDraw.Draw(bg)

    # karakter besar, kepala di tengah-bawah
    r.draw_char(d, 350, 1010, 1.85, r.RAKA, 0.31, talk=True)     # kaget / mulut terbuka
    r.draw_char(d, 930, 1010, 1.85, r.BIMA, 1.9, talk=False)

    # gelembung dialog
    def bubble(x0, y0, x1, y1, tail, text, size):
        d.rounded_rectangle([x0 * S, y0 * S, x1 * S, y1 * S], 36 * S, fill=(255, 255, 255), outline=r.INK, width=6 * S)
        d.polygon([(a * S, b * S) for a, b in tail], fill=(255, 255, 255), outline=r.INK)
        d.text(((x0 + x1) / 2 * S, (y0 + y1) / 2 * S), text, font=r.font(FB, size * S), fill=r.INK, anchor="mm", align="center", spacing=4 * S)
    bubble(190, 200, 480, 280, [(300, 278), (350, 278), (345, 312)], T["bubbleL"], 34)
    bubble(790, 200, 1080, 280, [(880, 278), (930, 278), (925, 312)], T["bubbleR"], 34)

    # judul
    stroke_text(d, (TW / 2, 62), T["line1"], 78, (255, 255, 255), 12)
    stroke_text(d, (TW / 2, 150), T["line2"], 96, (255, 214, 10), 14)

    # badge merah
    d.rounded_rectangle([330 * S, 590 * S, 950 * S, 700 * S], 26 * S, fill=(226, 44, 44), outline=(255, 255, 255), width=6 * S)
    d.text((640 * S, 645 * S), T["badge"], font=r.font(FB, (70 if len(T["badge"]) < 14 else 60 if len(T["badge"]) <= 18 else 42) * S), fill=(255, 255, 255), anchor="mm", stroke_width=3 * S, stroke_fill=(120, 10, 10))

    # label episode
    d.rounded_rectangle([24 * S, 640 * S, 200 * S, 696 * S], 14 * S, fill=(20, 20, 26))
    d.text((112 * S, 668 * S), T["eps"], font=r.font(FB, 32 * S), fill=(255, 214, 10), anchor="mm")

    bg.resize((TW, TH), Image.LANCZOS).save(out)
    print("ok", out)

def vertical(out):
    """Cover 9:16 (1080x1920) untuk Reels/TikTok/Shorts. Zona aman: hindari ~250px atas & ~450px bawah."""
    T = r.EP.THUMB
    VW, VH = 1080, 1920
    bg = r.get_bg(T.get("bg", "park"))
    k = VH * S / bg.height                                  # skala agar tinggi pas
    bg = bg.resize((int(bg.width * k), VH * S), Image.LANCZOS)
    x0 = (bg.width - VW * S) // 2
    bg = bg.crop((x0, 0, x0 + VW * S, VH * S))
    glow = Image.new("RGB", bg.size, (255, 244, 200))
    mask = Image.new("L", bg.size, 0)
    ImageDraw.Draw(mask).ellipse([VW * S * 0.05, VH * S * 0.30, VW * S * 0.95, VH * S * 0.85], fill=90)
    bg = Image.composite(glow, bg, mask.filter(ImageFilter.GaussianBlur(160)))
    d = ImageDraw.Draw(bg)

    # karakter (kepala di sekitar y~1000)
    r.draw_char(d, 275, 1990, 2.9, r.RAKA, 0.31, talk=True)
    r.draw_char(d, 805, 1990, 2.9, r.BIMA, 1.9, talk=False)

    def bubble(x0, y0, x1, y1, tail, text, size):
        d.rounded_rectangle([x0 * S, y0 * S, x1 * S, y1 * S], 44 * S, fill=(255, 255, 255), outline=r.INK, width=7 * S)
        d.polygon([(a * S, b * S) for a, b in tail], fill=(255, 255, 255), outline=r.INK)
        d.text(((x0 + x1) / 2 * S, (y0 + y1) / 2 * S), text, font=r.font(FB, size * S), fill=r.INK, anchor="mm", align="center", spacing=6 * S)
    bubble(40, 690, 520, 830, [(250, 828), (320, 828), (300, 872)], T["bubbleL"], 46)
    bubble(560, 690, 1040, 830, [(790, 828), (860, 828), (830, 872)], T["bubbleR"], 46)

    # judul (di bawah zona UI atas)
    stroke_text(d, (VW / 2, 330), T["line1"], 82, (255, 255, 255), 14)
    stroke_text(d, (VW / 2, 470), T["line2"], 170, (255, 214, 10), 18)

    # badge merah (di atas zona UI bawah)
    bt = T["badge"]
    d.rounded_rectangle([60 * S, 1330 * S, 1020 * S, 1480 * S], 36 * S, fill=(226, 44, 44), outline=(255, 255, 255), width=8 * S)
    d.text((540 * S, 1405 * S), bt, font=r.font(FB, (84 if len(bt) < 14 else 70 if len(bt) <= 18 else 56) * S),
           fill=(255, 255, 255), anchor="mm", stroke_width=4 * S, stroke_fill=(120, 10, 10))
    # label episode
    d.rounded_rectangle([420 * S, 585 * S, 660 * S, 650 * S], 20 * S, fill=(20, 20, 26))
    d.text((540 * S, 618 * S), T["eps"], font=r.font(FB, 38 * S), fill=(255, 214, 10), anchor="mm")

    bg.resize((VW, VH), Image.LANCZOS).save(out)
    print("ok", out)

if __name__ == "__main__":
    args = [a for a in sys.argv[1:] if not a.startswith("--")]
    out = args[0] if args else "thumbnail.png"
    (vertical if "--vertical" in sys.argv else main)(out)

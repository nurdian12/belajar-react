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
    bg = r.get_bg("park").resize((TW * S, TH * S), Image.LANCZOS)
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
    bubble(190, 200, 480, 280, [(300, 278), (350, 278), (345, 312)], "Gue mau\nRESIGN!", 34)
    bubble(790, 200, 1080, 280, [(880, 278), (930, 278), (925, 312)], "Udah ada\nmodal?", 34)

    # judul
    stroke_text(d, (TW / 2, 62), "TEMEN YANG SELALU", 78, (255, 255, 255), 12)
    stroke_text(d, (TW / 2, 150), "SUPPORT", 96, (255, 214, 10), 14)

    # badge merah
    d.rounded_rectangle([330 * S, 590 * S, 950 * S, 700 * S], 26 * S, fill=(226, 44, 44), outline=(255, 255, 255), width=6 * S)
    d.text((640 * S, 645 * S), "(tapi JUJUR!)", font=r.font(FB, 70 * S), fill=(255, 255, 255), anchor="mm", stroke_width=3 * S, stroke_fill=(120, 10, 10))

    # label episode
    d.rounded_rectangle([24 * S, 640 * S, 200 * S, 696 * S], 14 * S, fill=(20, 20, 26))
    d.text((112 * S, 668 * S), "EPS. 1", font=r.font(FB, 32 * S), fill=(255, 214, 10), anchor="mm")

    bg.resize((TW, TH), Image.LANCZOS).save(out)
    print("ok", out)

if __name__ == "__main__":
    main(sys.argv[1] if len(sys.argv) > 1 else "thumbnail.png")

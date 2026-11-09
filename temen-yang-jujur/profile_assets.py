#!/usr/bin/env python3
"""Aset profil sosmed: avatar 1080x1080 + banner YouTube 2560x1440 (area aman tengah 1546x423)."""
from PIL import Image, ImageDraw, ImageFilter
import render as r

S = r.S
def new(w, h): return Image.new("RGB", (w * S, h * S), (255, 214, 10))

def avatar(out):
    img = new(540, 540)                      # 540*2 = 1080
    d = ImageDraw.Draw(img)
    # lingkaran latar hijau (aman untuk crop bulat)
    d.ellipse([10 * S, 10 * S, 530 * S, 530 * S], fill=(46, 176, 84))
    d.ellipse([10 * S, 10 * S, 530 * S, 530 * S], outline=(20, 100, 50), width=6 * S)
    # dua kepala berdampingan
    r.draw_char(d, 175, 760, 1.45, r.RAKA, 0.3, talk=True)
    r.draw_char(d, 370, 760, 1.45, r.BIMA, 1.9, talk=False)
    # mask bulat
    mask = Image.new("L", img.size, 0)
    ImageDraw.Draw(mask).ellipse([10 * S, 10 * S, 530 * S, 530 * S], fill=255)
    out_img = Image.new("RGB", img.size, (255, 214, 10))
    out_img.paste(img, (0, 0), mask)
    out_img.resize((1080, 1080), Image.LANCZOS).save(out)

def banner(out):
    W, H = 1280, 720                         # x2 = 2560x1440
    img = new(W, H)
    bg = r.get_bg("park").resize((W * S, H * S), Image.LANCZOS)
    img.paste(bg)
    d = ImageDraw.Draw(img)
    # karakter di kiri & kanan (di luar area aman, tampil di TV/desktop lebar)
    r.draw_char(d, 110, 760, 1.5, r.RAKA, 0.3, talk=True)
    r.draw_char(d, 1170, 760, 1.5, r.BIMA, 1.9, talk=False)
    # area aman tengah: 773x211 (logical)
    sx0, sy0, sx1, sy1 = 640 - 386, 360 - 105, 640 + 386, 360 + 105
    d.rounded_rectangle([sx0 * S, sy0 * S, sx1 * S, sy1 * S], 24 * S, fill=(20, 22, 28))
    d.text((640 * S, 318 * S), "TEMEN YANG SELALU SUPPORT", font=r.font(r.FB, 46 * S), fill=(255, 255, 255), anchor="mm")
    d.text((640 * S, 368 * S), "(tapi jujur)", font=r.font(r.FB, 40 * S), fill=(255, 214, 10), anchor="mm")
    d.text((640 * S, 410 * S), "Animasi komedi pertemanan • episode baru tiap pekan", font=r.font(r.FB, 21 * S), fill=(220, 220, 220), anchor="mm")
    img.save(out)

if __name__ == "__main__":
    avatar("profil-avatar.png"); banner("profil-banner-youtube.png"); print("ok")

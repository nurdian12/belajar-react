#!/usr/bin/env python3
"""Aset profil kanal YouTube untuk seri animasi stickman percintaan.

Menghasilkan (di folder output, default video/youtube/):
  - profile-picture.png : 800x800 (tampil bulat; tokoh dan cahaya di tengah)
  - banner.png          : 2560x1440 (area aman semua perangkat 1546x423 di tengah)
  - preview.png         : pratinjau banner dengan area aman dan foto profil bulat

Pakai: python3 video/make_youtube_profile.py [folder_output] [NAMA_KANAL]
Butuh: Pillow, numpy (helper dari make_video_penolakan.py).
"""
import math
import os
import sys

sys.dont_write_bytecode = True
HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
OUT_DIR = sys.argv[1] if len(sys.argv) > 1 else os.path.join(HERE, "youtube")
CHANNEL = sys.argv[2] if len(sys.argv) > 2 else "LENTERA"
TAGLINE = "Cinta, dari dua sisi."
sys.argv = sys.argv[:1]  # modul video membaca argv[1] sebagai nama output

import numpy as np
from PIL import Image, ImageDraw, ImageFilter, ImageFont

import make_video_penolakan as base
from make_video_penolakan import AMBER, CORAL, S, SIL, WHITE, fig_layer, paste_glow

GREY = (150, 156, 176)


def font(n):
    return ImageFont.truetype(base._FM, n)


def gradient(size, top=(10, 14, 30), bottom=(5, 7, 14), glow_center=None, glow_rgb=(60, 40, 12)):
    w, h = size
    yy, xx = np.mgrid[0:h, 0:w]
    u = yy / h
    img = np.zeros((h, w, 3), np.float32)
    for c in range(3):
        img[..., c] = top[c] * (1 - u) + bottom[c] * u
    if glow_center:
        cx, cy, rad = glow_center
        a = np.clip(1 - np.hypot(xx - cx, yy - cy) / rad, 0, 1) ** 2
        for c in range(3):
            img[..., c] += glow_rgb[c] * a
    return Image.fromarray(np.clip(img, 0, 255).astype(np.uint8))


def put_fig(canvas, cx, feet_y, col, sc, **kw):
    """Gambar stickman: pusat x dan kaki y dalam piksel kanvas. Mengembalikan posisi lentera (piksel)."""
    ux, fy = 320, 400  # koordinat di dalam layer (satuan panel)
    lay, lamp, _ = fig_layer(ux, fy, col, sc=sc, **kw)
    ox, oy = int(cx - ux * S), int(feet_y - fy * S)
    canvas.paste(lay, (ox, oy), lay)
    if lamp:
        return (ox + lamp[0] * S, oy + lamp[1] * S)
    return None


def heart(canvas, cx, cy, s, rgb=CORAL):
    lay = Image.new("RGBA", canvas.size, (0, 0, 0, 0))
    pts = []
    for i in range(64):
        a = i / 64 * 2 * math.pi
        pts.append((cx + 16 * math.sin(a) ** 3 * s,
                    cy - (13 * math.cos(a) - 5 * math.cos(2 * a) - 2 * math.cos(3 * a) - math.cos(4 * a)) * s))
    ImageDraw.Draw(lay).polygon(pts, fill=rgb + (255,))
    canvas.paste(lay, (0, 0), lay)


def glow(canvas, x, y, k):
    paste_glow(canvas, x / S, y / S, k)  # paste_glow memakai satuan panel


# ------------------------------------------------------------------ foto profil
def make_profile(path):
    N = 1280
    cv = gradient((N, N), glow_center=(N / 2, 700, 700))
    d = ImageDraw.Draw(cv)
    # bayangan di lantai
    sh = Image.new("RGBA", (N, N), (0, 0, 0, 0))
    ImageDraw.Draw(sh).ellipse([350, 985, 930, 1045], fill=(0, 0, 0, 140))
    cv.paste(sh, (0, 0), sh)
    hand = None
    lay_pos = put_fig(cv, N / 2 - 40, 1010, WHITE, 3.0, f=1, arm_f=70, lamp=(255, 214, 120), face="happy")
    glow(cv, lay_pos[0], lay_pos[1], 1.9)
    # gambar ulang tokoh di atas cahaya supaya tetap putih bersih
    put_fig(cv, N / 2 - 40, 1010, WHITE, 3.0, f=1, arm_f=70, lamp=(255, 214, 120), face="happy")
    # percikan cahaya
    rs = np.random.RandomState(5)
    sp = Image.new("RGBA", (N, N), (0, 0, 0, 0))
    sd = ImageDraw.Draw(sp)
    for _ in range(34):
        a, r = rs.uniform(0, 2 * math.pi), rs.uniform(110, 420)
        x, y = lay_pos[0] + math.cos(a) * r, lay_pos[1] + math.sin(a) * r * 0.8
        z = rs.uniform(3, 7)
        sd.ellipse([x - z, y - z, x + z, y + z], fill=(255, 214, 120, int(rs.uniform(70, 200))))
    cv.paste(sp, (0, 0), sp)
    cv = cv.resize((800, 800), Image.LANCZOS)
    cv.save(path)
    return cv


# ------------------------------------------------------------------ banner
def make_banner(path):
    W, H = 2560, 1440
    floor = 1170
    cv = gradient((W, H), glow_center=(2230, 960, 900))
    d = ImageDraw.Draw(cv, "RGBA")
    d.rectangle([0, floor, W, H], fill=(36, 38, 50, 255))
    d.line([0, floor, W, floor], fill=(110, 114, 130, 255), width=4)
    # kerucut sorot
    cone = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    cd = ImageDraw.Draw(cone)
    for cx in (600, 1900):
        cd.polygon([(cx - 30, 0), (cx + 30, 0), (cx + 260, floor), (cx - 260, floor)], fill=(200, 210, 255, 20))
    cone = cone.filter(ImageFilter.GaussianBlur(30))
    cv.paste(cone, (0, 0), cone)

    # sisi kiri: sendirian di tengah hujan, lampu redup
    rs = np.random.RandomState(7)
    rain = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    rd = ImageDraw.Draw(rain)
    for _ in range(90):
        x, y = rs.uniform(0, 520), rs.uniform(0, floor)
        rd.line([(x, y), (x - 10, y + 34)], fill=(140, 160, 230, 90), width=2)
    cv.paste(rain, (0, 0), rain)
    lp = put_fig(cv, 300, floor - 4, WHITE, 2.4, f=1, arm_f=40, lean=0.05, head=0.15,
                 lamp=(255, 214, 120), face="sad")
    glow(cv, lp[0], lp[1], 0.35)
    put_fig(cv, 300, floor - 4, WHITE, 2.4, f=1, arm_f=40, lean=0.05, head=0.15,
            lamp=(255, 214, 120), face="sad")

    # sisi kanan: berdua, hangat
    lp2 = put_fig(cv, 2150, floor - 4, WHITE, 2.4, f=1, arm_f=70, lamp=(255, 214, 120), face="happy")
    glow(cv, lp2[0], lp2[1], 1.9)
    put_fig(cv, 2150, floor - 4, WHITE, 2.4, f=1, arm_f=70, lamp=(255, 214, 120), face="happy")
    put_fig(cv, 2310, floor - 4, (232, 232, 240), 2.4, f=-1, arm_f=15, arm_b=-8, face="happy")
    heart(cv, 2232, 585, 6)
    sp = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    sd = ImageDraw.Draw(sp)
    for _ in range(40):
        a, r = rs.uniform(0, 2 * math.pi), rs.uniform(120, 460)
        x, y = 2240 + math.cos(a) * r, 880 + math.sin(a) * r * 0.7
        z = rs.uniform(3, 8)
        sd.ellipse([x - z, y - z, x + z, y + z], fill=(255, 214, 120, int(rs.uniform(60, 190))))
    cv.paste(sp, (0, 0), sp)

    # teks di area aman tengah (1546x423 -> x 507..2053, y 508..931)
    d = ImageDraw.Draw(cv)
    d.text((W / 2, 660), CHANNEL, font=font(190 if len(CHANNEL) <= 10 else 150), fill=WHITE, anchor="mm")
    # garis pemisah dua warna: redup (kiri) -> hangat (kanan)
    d.rectangle([W / 2 - 330, 790, W / 2 - 8, 796], fill=(120, 130, 220))
    d.rectangle([W / 2 + 8, 790, W / 2 + 330, 796], fill=AMBER)
    d.text((W / 2, 870), TAGLINE, font=font(62), fill=AMBER, anchor="mm")
    cv.save(path)
    return cv


def make_preview(path, banner, profile):
    pv = banner.copy().resize((1280, 720), Image.LANCZOS)
    d = ImageDraw.Draw(pv, "RGBA")
    sx, sy = 1280 / 2560, 720 / 1440
    d.rectangle([507 * sx, 508 * sy, 2053 * sx, 931 * sy], outline=(255, 255, 255, 200), width=2)
    d.text((507 * sx + 6, 508 * sy - 14), "area aman 1546x423", font=font(14), fill=(255, 255, 255, 220), anchor="lm")
    # foto profil bulat
    r = 120
    pic = profile.resize((2 * r, 2 * r), Image.LANCZOS)
    m = Image.new("L", pic.size, 0)
    ImageDraw.Draw(m).ellipse([0, 0, 2 * r - 1, 2 * r - 1], fill=255)
    pv.paste(pic, (60, 720 - 2 * r - 40), m)
    pv.save(path)


def main():
    os.makedirs(OUT_DIR, exist_ok=True)
    prof = make_profile(os.path.join(OUT_DIR, "profile-picture.png"))
    ban = make_banner(os.path.join(OUT_DIR, "banner.png"))
    make_preview(os.path.join(OUT_DIR, "preview.png"), ban, prof)
    print("tersimpan di:", OUT_DIR)


if __name__ == "__main__":
    main()

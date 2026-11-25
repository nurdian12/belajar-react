# Potong lembar 3x3 ekspresi kartun jadi 9 stiker transparan (latar putih luar dibuang)
from PIL import Image, ImageDraw, ImageFilter
import numpy as np
im = Image.open('ekspresi_kartun.jpg').convert('RGB'); W, H = im.size; a = np.array(im).astype(int)
nonw = (a.sum(2) < 690)
def gaps(mask1d, n):  # n-1 celah putih terpanjang -> titik potong
    runs = []; s = None
    for i, v in enumerate(mask1d):
        if not v and s is None: s = i
        if v and s is not None:
            if s > 0: runs.append((i - s, (s + i) // 2))
            s = None
    return sorted(r[1] for r in sorted(runs, reverse=True)[:n - 1])
ys = [0] + gaps(nonw.sum(1) > 3, 3) + [H]
print('baris', ys)
for r in range(3):
    band = nonw[ys[r]:ys[r + 1]]
    xs = [0] + gaps(band.sum(0) > 3, 3) + [W]
    for c in range(3):
        cell = im.crop((xs[c], ys[r], xs[c + 1], ys[r + 1])); w, h = cell.size
        mk = cell.copy()
        for pt in [(0, 0), (w - 1, 0), (0, h - 1), (w - 1, h - 1), (w // 2, 0), (0, h // 2), (w - 1, h // 2)]:
            if sum(mk.getpixel(pt)) > 690: ImageDraw.floodfill(mk, pt, (255, 0, 255), thresh=30)
        b = np.array(mk).astype(int); bg = (b[:, :, 0] > 240) & (b[:, :, 1] < 20) & (b[:, :, 2] > 240)
        alpha = Image.fromarray(((~bg) * 255).astype('uint8')).filter(ImageFilter.GaussianBlur(1))
        out = cell.convert('RGBA'); out.putalpha(alpha)
        out = out.crop(alpha.point(lambda v: 255 if v > 40 else 0).getbbox()); out.save(f'face{r * 3 + c}.png'); print(r * 3 + c, out.size)

# Potong lembar 3x3 ekspresi jadi 9 stiker transparan (latar putih dibuang lewat flood fill dari tepi)
from PIL import Image, ImageDraw, ImageFilter
import numpy as np
im = Image.open('ekspresi.jpg').convert('RGB'); W, H = im.size; cw, ch = W // 3, H // 3
for r in range(3):
    for c in range(3):
        cell = im.crop((c * cw, max(0, r * ch - 12), (c + 1) * cw, (r + 1) * ch - 5)).copy(); ch2 = cell.size[1]
        mk = cell.copy()
        for pt in [(0, 0), (cw - 1, 0), (0, ch2 - 1), (cw - 1, ch2 - 1), (cw // 2, 0), (cw // 2, ch2 - 1), (0, ch2 // 2), (cw - 1, ch2 // 2)]:
            if sum(mk.getpixel(pt)) > 690: ImageDraw.floodfill(mk, pt, (255, 0, 255), thresh=38)
        a = np.array(mk).astype(int); bg = (a[:, :, 0] > 240) & (a[:, :, 1] < 20) & (a[:, :, 2] > 240)
        alpha = Image.fromarray(((~bg) * 255).astype('uint8')).filter(ImageFilter.GaussianBlur(1.2))
        out = cell.convert('RGBA'); out.putalpha(alpha)
        bb = alpha.point(lambda v: 255 if v > 40 else 0).getbbox(); out = out.crop(bb)
        out.save(f'face{r * 3 + c}.png')
print('ok')

# Potong 9 kepala ekspresi (tokoh stickman) jadi stiker transparan face0-8
from PIL import Image, ImageDraw, ImageFilter
import numpy as np
im = Image.open('ekspresi_stick.jpg').convert('RGB')
BOX = [(215, 35, 505, 391), (10, 40, 225, 305), (10, 345, 225, 605), (10, 640, 225, 905), (10, 945, 225, 1200),
       (535, 40, 750, 305), (535, 345, 750, 605), (535, 640, 765, 905), (535, 940, 750, 1200)]
for i, b in enumerate(BOX):
    cell = im.crop(b); w, h = cell.size; mk = cell.copy()
    for pt in [(0, 0), (w - 1, 0), (0, h - 1), (w - 1, h - 1), (w // 2, 0), (0, h // 2), (w - 1, h // 2), (w // 2, h - 1)]:
        if sum(mk.getpixel(pt)) > 690: ImageDraw.floodfill(mk, pt, (255, 0, 255), thresh=45)
    a = np.array(mk).astype(int); bg = (a[:, :, 0] > 240) & (a[:, :, 1] < 20) & (a[:, :, 2] > 240)
    alpha = Image.fromarray(((~bg) * 255).astype('uint8')).filter(ImageFilter.GaussianBlur(.8))
    out = cell.convert('RGBA'); out.putalpha(alpha); out = out.crop(alpha.point(lambda v: 255 if v > 40 else 0).getbbox())
    out = out.resize((out.width * 2, out.height * 2), Image.LANCZOS); out.save(f'face{i}.png'); print(i, out.size)

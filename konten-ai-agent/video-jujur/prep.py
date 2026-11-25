# Siapkan stiker wajah (dari selfie) dan potongan sosok berjas (latar abu jadi putih)
from PIL import Image, ImageDraw, ImageFilter
import numpy as np
s = Image.open('selfie.jpg').convert('RGB')
box = (470, 300, 1930, 2110); f = s.crop(box); w, h = f.size
m = Image.new('L', (w, h), 0); ImageDraw.Draw(m).ellipse((10, 10, w - 10, h - 10), fill=255); m = m.filter(ImageFilter.GaussianBlur(3))
f.putalpha(m); f = f.resize((w // 2, h // 2), Image.LANCZOS); f.save('face.png')
j = np.array(Image.open('jas.jpg').convert('RGB')).astype(int)
bgc = j[5:25, 5:25].reshape(-1, 3).mean(0); d = np.abs(j - bgc).sum(2)
try:
    from scipy import ndimage
    lab, n = ndimage.label(d < 28); border = set(np.unique(np.concatenate([lab[0], lab[-1], lab[:, 0], lab[:, -1]]))) - {0}
    bgmask = np.isin(lab, list(border))
except Exception as e:
    print('noscipy', e); bgmask = d < 28
j[bgmask] = 255
Image.fromarray(j.astype('uint8')).save('jas_putih.jpg'); print('ok', bgc)

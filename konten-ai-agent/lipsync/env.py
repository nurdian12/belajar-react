# Hitung envelope volume suara per frame (30 fps) -> JSON nilai 0..1 untuk menggerakkan mulut.
# python3 env.py voice.wav out.json
import sys, json, wave, numpy as np
w = wave.open(sys.argv[1]); sr = w.getframerate(); ch = w.getnchannels(); a = np.frombuffer(w.readframes(w.getnframes()), dtype=np.int16).astype(float)
if ch > 1: a = a.reshape(-1, ch).mean(1)
a /= 32768.0; FPS = 30; n = int(len(a) / sr * FPS) + 1; win = int(sr * 0.028); r = np.zeros(n)
for i in range(n):
    c = int(i / FPS * sr); seg = a[max(0, c - win): c + win]; r[i] = np.sqrt((seg ** 2).mean()) if len(seg) else 0
p = np.percentile(r[r > r.max() * 0.03], 90) if (r > r.max() * 0.03).any() else r.max()
e = np.clip((r / p - 0.28) / 0.62, 0, 1)
o = np.zeros(n); v = 0.0
for i in range(n):  # buka cepat, tutup lebih pelan
    v = v + (e[i] - v) * (0.85 if e[i] > v else 0.55); o[i] = v
json.dump([round(float(x), 3) for x in o], open(sys.argv[2], 'w')); print(n, 'frame, rata-rata', round(float(o.mean()), 3))

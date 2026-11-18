"""Audio sinematik video 'Sangkar Emas' (18 dtk). usage: make_audio5.py cues.json out.wav"""
import sys, json, wave
import numpy as np
import make_audio as ma

SR = ma.SR; DUR = 18.0; N = int(SR * DUR); n_ = ma.noise; tarr = ma.tarr

def sfx_slide():
    d = .45; t = tarr(d); a = ma.bandpass(n_(d), 800, 4500) * np.sin(np.pi * t / d) * .45
    k = ma.tone(2600, .3, .01, 6) * .08; a[:len(k)] += k; return a
def sfx_clack():
    y = np.zeros(int(.4 * SR))
    for s0, f in ((0, 1800), (.075, 2300)):
        c = ma.bandpass(n_(.02), 1500, 7000) * ma.adsr(.02, .0005, .02, 5) * 1.1; r = ma.tone(f, .22, .001, 9, (1, .4)) * .3
        s = int(s0 * SR); y[s:s + len(c)] += c; y[s:s + len(r)] += r
    return y
def sfx_rattle():
    d = .5; t = tarr(d); n = ma.bandpass(n_(d), 2000, 7500) * (.5 + .5 * np.sign(np.sin(2 * np.pi * 26 * t))) * np.sin(np.pi * t / d) ** .8
    return n * .5 + ma.tone(3200, d, .01, 5, (1, .3)) * .08
def sfx_creak():
    d = .9; t = tarr(d); f = 150 + 90 * np.sin(np.pi * t / d) + 12 * np.sin(2 * np.pi * 11 * t)
    saw = 2 * ((np.cumsum(f) / SR) % 1) - 1; return ma.fft_filter(saw, 'lp', 900) * np.sin(np.pi * t / d) ** .7 * .5
def sfx_crumble():
    d = 1.3; y = ma.fft_filter(n_(d), 'lp', 2200) * ma.adsr(d, .01, d, 2.8) * .45
    for i in range(26):
        s0 = np.random.default_rng(i).random() * .9; f = 1500 + np.random.default_rng(i + 40).random() * 2800
        k = ma.tone(f, .12, .001, 10, (1, .3)) * .18; s = int(s0 * SR); y[s:s + len(k)] += k[:len(y) - s]
    return y
SFX = dict(ma.SFX); SFX.update(slide=sfx_slide, clack=sfx_clack, rattle=sfx_rattle, creak=sfx_creak, crumble=sfx_crumble)

def build_bgm():
    out = np.zeros(N); NOTE = ma.NOTE; t = tarr(DUR)
    # 0-7: music box + soft pad, turns minor at 5.5
    maj = [84, 88, 91, 88]; mnr = [84, 87, 91, 87]
    k = 0.3; i = 0
    while k < 10.4:
        m = (maj if k < 5.5 else mnr)[i % 4]; v = .17 * (1 - ma.np.clip((k - 7) / 3.4, 0, 1)) if hasattr(ma, 'np') else .17
        if k > 7: v = .17 * max(0, 1 - (k - 7) / 3.4)
        ma.place(out, ma.pluck(m, .55, v), k); k += .5; i += 1
    ma.place(out, ma.pad((60, 64, 67), 5.4, .07, False), 0.2); ma.place(out, ma.pad((60, 63, 67), 5.2, .09, False), 5.5)
    # 7-11: drone + heartbeat
    dr = (np.sin(2 * np.pi * NOTE(36) * t) + .6 * np.sin(2 * np.pi * NOTE(43) * t)) * .17 * np.clip((t - 6.5) / 1.5, 0, 1) * (t < 11.05)
    out += dr
    kk = 7.2
    while kk < 11.0:
        v = .35 + .5 * (kk - 7.2) / 3.8; ma.place(out, ma.kick(v * .85), kk); ma.place(out, ma.kick(v * .55), kk + .24); kk += .95
    # reveal swell
    ma.place(out, ma.pad((60, 64, 67, 71), 1.6, .24, True), 11.25)
    for j, m in enumerate([72, 76, 79, 84, 88, 91, 96]): ma.place(out, ma.pluck(m, .6, .2), 11.3 + j * .13)
    # dawn groove 12.6 -> end
    ch = [(60, 64, 67), (55, 59, 62), (57, 60, 64), (53, 57, 60)]; arps = [(72, 76, 79, 84), (71, 74, 79, 83), (72, 76, 81, 84), (69, 72, 77, 81)]
    beat = .625; bar = beat * 4; t0 = 12.6; i = 0
    while t0 < DUR:
        c = ch[i % 4]; ma.place(out, ma.pad(c, bar + .3, .15, True), t0); ma.place(out, ma.bass(c[0] - 12, beat * 1.6, .38), t0)
        for b in range(4):
            tt = t0 + b * beat
            if tt >= DUR: break
            if b in (0, 2): ma.place(out, ma.kick(.5), tt)
            if b in (1, 3): ma.place(out, ma.clap(.22), tt)
            ma.place(out, ma.hat(.08), tt + beat / 2)
            for q in range(2): ma.place(out, ma.pluck(arps[i % 4][(b * 2 + q) % 4], .4, .13), tt + q * beat / 2)
        t0 += bar; i += 1
    gap = (t > 11.02) & (t < 11.22); out[gap] *= .1
    e = np.zeros(N); sh = int(.375 * SR); e[sh:] = out[:-sh] * .33; sh2 = int(.75 * SR); e[sh2:] += out[:-sh2] * .16
    return out + e

def main():
    cues = json.load(open(sys.argv[1])); outp = sys.argv[2]; sf = np.zeros(N)
    for c in cues:
        t0, name = c[0], c[1]; vol = c[2] if len(c) > 2 else 1.0
        if name not in SFX: print('skip', name); continue
        ma.place(sf, SFX[name](), t0, vol)
    bgm = build_bgm(); env = np.abs(sf); k = int(.08 * SR); env = np.convolve(env, np.ones(k) / k, mode='same'); duck = 1 - .4 * np.clip(env * 4, 0, 1)
    mix = bgm * .85 * duck + sf
    mix *= np.minimum(1, (DUR - np.arange(N) / SR) / 1.0) * np.minimum(1, np.arange(N) / SR / .3)
    mix = np.tanh(mix * 1.1); mix = mix / max(1e-6, np.max(np.abs(mix))) * .89
    st = (mix * 32767).astype('<i2'); st2 = np.repeat(st[:, None], 2, axis=1)
    with wave.open(outp, 'wb') as w: w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR); w.writeframes(st2.tobytes())
    print('wrote', outp, 'peak', float(np.max(np.abs(mix))), 'rms', float(np.sqrt(np.mean(mix ** 2))))
if __name__ == '__main__': main()

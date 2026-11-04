"""Audio sinematik untuk video 'ditimbun jadi tangga' (18 dtk). usage: make_audio4.py cues.json out.wav"""
import sys, json, wave
import numpy as np
import make_audio as ma

SR = ma.SR; DUR = 18.0; N = int(SR * DUR)
n_ = ma.noise; tarr = ma.tarr

def sfx_fall():
    d = 1.25; t = tarr(d); p = t / d
    w = ma.bandpass(n_(d), 300, 3500) * (p ** 1.4) * .5
    s = ma.sweep_sine(900, 140, d) * (p ** 1.2) * .35
    return (w + s) * np.minimum((d - t) / .05, 1)
def sfx_impact():
    d = 1.4; y = ma.sweep_sine(110, 28, d) * ma.adsr(d, .002, d, 4.5) * 1.1
    r = ma.fft_filter(n_(d), 'lp', 380) * ma.adsr(d, .003, d, 3.2) * .8
    c = ma.bandpass(n_(.05), 400, 4000) * ma.adsr(.05, .001, .05, 6); y[:len(c)] += c * .6
    return y + r
def sfx_dirt():
    d = .18; r = ma.fft_filter(n_(d), 'lp', 650) * ma.adsr(d, .002, d, 9); s = ma.sweep_sine(120, 60, d) * ma.adsr(d, .002, d, 10)
    return (r * .7 + s * .5)
def sfx_scrape():
    d = .28; t = tarr(d); a = ma.bandpass(n_(d), 1200, 6000) * np.sin(np.pi * t / d) ** 1.5 * .5
    k = ma.tone(3100, .1, .001, 9) * .12; y = a.copy(); s = int(.12 * ma.SR); y[s:s + len(k)] += k[:len(y) - s]; return y
def sfx_streak():
    d = 1.2; t = tarr(d); p = t / d
    n = ma.fft_filter(n_(d), 'hp', 3500) * np.sin(np.pi * p) ** 2 * .45
    s = ma.sweep_sine(700, 4200, d, expo=True) * np.sin(np.pi * p) ** 1.5 * .25
    y = n + s; sp = ma.sfx_sparkle(); k = int(.55 * SR); y[k:k + len(sp)] += sp[:len(y) - k] * .7; return y

SFX = dict(ma.SFX); SFX.update(fall=sfx_fall, impact=sfx_impact, dirt=sfx_dirt, scrape=sfx_scrape, streak=sfx_streak)

def build_bgm():
    out = np.zeros(N); NOTE = ma.NOTE
    # drone (Dm)
    t = tarr(DUR)
    drone = (np.sin(2 * np.pi * NOTE(38) * t) + .6 * np.sin(2 * np.pi * NOTE(45) * t) + .35 * np.sin(2 * np.pi * NOTE(50) * t * (1 + .002 * np.sin(2 * np.pi * .3 * t))))
    drone *= np.minimum(t / 1.5, 1) * .16 * (1 - .5 * ma.seg(t, 13.7, 14.4) if hasattr(ma, 'seg') else 1)
    out += drone
    # heartbeat 3.3 -> 12.3
    k = 3.3
    while k < 12.3:
        v = .25 + .6 * (k - 3.3) / 9
        ma.place(out, ma.kick(v * .9), k); ma.place(out, ma.kick(v * .6), k + .24); k += 1.0
    # pad crescendo (Dm) 3.3 -> 12.3, then resolve to D major
    for i, (a, b, ch) in enumerate([(3.3, 7.3, (50, 53, 57)), (7.3, 11.3, (46, 50, 53)), (11.3, 12.3, (47, 50, 54))]):
        d = b - a; p = ma.pad(ch, d + .4, .10 + .05 * i, False); ma.place(out, p, a)
    # tension tremolo high sine
    tt = tarr(4.2); trem = np.sin(2 * np.pi * NOTE(81) * tt) * (.5 + .5 * np.sin(2 * np.pi * (4 + 6 * tt / 4.2) * tt)) * (tt / 4.2) ** 2 * .07
    ma.place(out, trem, 8.2)
    # silence gap just before the reveal
    gap = (t > 12.42) & (t < 13.62); out[gap] *= .12
    # resolution: D major swell + bell arps
    ma.place(out, ma.pad((50, 54, 57, 62), 1.2, .22, True), 13.65)
    arp = [74, 78, 81, 86, 81, 78]
    for i, m in enumerate(arp): ma.place(out, ma.pluck(m, .5, .2), 13.7 + i * .12)
    # tableau: sustained strings + sparse bells until the end
    ma.place(out, ma.pad((50, 57, 62, 66), 3.9, .2, True), 14.4)
    for i, (m, dt) in enumerate([(69, 14.9), (74, 15.5), (78, 16.1), (81, 16.7), (86, 17.2)]): ma.place(out, ma.pluck(m, .9, .16), dt)
    # echo
    e = np.zeros(N); sh = int(.38 * SR); e[sh:] = out[:-sh] * .35; sh2 = int(.76 * SR); e[sh2:] += out[:-sh2] * .18
    return out + e

def main():
    cues = json.load(open(sys.argv[1])); outp = sys.argv[2]
    sf = np.zeros(N)
    for c in cues:
        t0, name = c[0], c[1]; vol = c[2] if len(c) > 2 else 1.0
        if name not in SFX: print('skip', name); continue
        ma.place(sf, SFX[name](), t0, vol)
    bgm = build_bgm()
    env = np.abs(sf); k = int(.08 * SR); env = np.convolve(env, np.ones(k) / k, mode='same'); duck = 1 - .4 * np.clip(env * 4, 0, 1)
    mix = bgm * .85 * duck + sf
    mix *= np.minimum(1, (DUR - np.arange(N) / SR) / 1.0) * np.minimum(1, np.arange(N) / SR / .4)
    mix = np.tanh(mix * 1.1); mix = mix / max(1e-6, np.max(np.abs(mix))) * .89
    st = (mix * 32767).astype('<i2'); st2 = np.repeat(st[:, None], 2, axis=1)
    with wave.open(outp, 'wb') as w: w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR); w.writeframes(st2.tobytes())
    print('wrote', outp, 'peak', float(np.max(np.abs(mix))), 'rms', float(np.sqrt(np.mean(mix ** 2))))

if __name__ == '__main__': main()

"""Audio sinematik 'Si Pengejar vs Si Penghindar' (18 dtk). usage: make_audio6.py cues.json out.wav"""
import sys, json, wave
import numpy as np
import make_audio as ma

SR = ma.SR; DUR = 18.0; N = int(SR * DUR); n_ = ma.noise; tarr = ma.tarr
def sfx_step():
    d = .07; return ma.bandpass(n_(d), 120, 900) * ma.adsr(d, .002, d, 8) * .6
def sfx_snuff():
    d = .9; t = tarr(d); s = ma.sweep_sine(700, 110, d) * ma.adsr(d, .005, d, 3.5) * .3
    n = ma.fft_filter(n_(d), 'hp', 2500) * ma.adsr(.9, .01, .9, 6) * .25; return s + n
SFX = dict(ma.SFX); SFX.update(step=sfx_step, snuff=sfx_snuff, impact=ma.sfx_thud)

def piano(m, d=1.4, vol=.2):
    t = tarr(d); f = ma.NOTE(m); y = np.sin(2 * np.pi * f * t) + .5 * np.sin(2 * np.pi * f * 2 * t) * np.exp(-3 * t) + .25 * np.sin(2 * np.pi * f * 3 * t) * np.exp(-5 * t)
    return y * np.minimum(t / .004, 1) * np.exp(-2.2 * t) * vol

def build_bgm():
    out = np.zeros(N); NOTE = ma.NOTE
    ch = [(57, 60, 64), (53, 57, 60), (50, 53, 57), (52, 56, 59)]; mel = [[76, 72, 69, 72], [72, 69, 65, 69], [69, 65, 62, 65], [71, 68, 64, 68]]
    for k, tc in enumerate([1.6, 5.0, 8.4, 11.8]):
        end = 13.2 if k == 3 else tc + 3.4
        ma.place(out, ma.pad(ch[k], min(3.6, end - tc + .2), .13 + .02 * k, False), tc - .2)
        ma.place(out, ma.bass(ch[k][0] - 24, 1.4, .34), tc); ma.place(out, ma.bass(ch[k][0] - 24, 1.2, .26), tc + 1.7)
        for j, m in enumerate(mel[k]):
            if tc + j * .8 < 13.2: ma.place(out, piano(m, 1.2, .16), tc + .2 + j * .8)
    # opening: lone piano + pad
    ma.place(out, ma.pad((57, 60, 64), 1.8, .08, False), 0.0)
    for j, m in enumerate([76, 72]): ma.place(out, piano(m, 1.2, .14), .5 + j * .6)
    # chase: hats + heartbeat ramp 1.6 -> 13.2
    k = 1.6; i = 0
    while k < 13.2:
        v = .05 + .08 * (k - 1.6) / 11.6; ma.place(out, ma.hat(v), k)
        if i % 4 == 0: ma.place(out, ma.kick(.2 + .5 * (k - 1.6) / 11.6), k); ma.place(out, ma.kick(.12 + .3 * (k - 1.6) / 11.6), k + .22)
        k += .32; i += 1
    t = tarr(DUR); dr = (np.sin(2 * np.pi * NOTE(33) * t) + .5 * np.sin(2 * np.pi * NOTE(40) * t)) * .1 * np.clip((t - 1) / 2, 0, 1) * (t < 13.2) ; out += dr
    # silence at the stumble, then lonely piano + ending chord
    out[(t > 13.15) & (t < 14.2)] *= .08
    for j, m in enumerate([69, 72, 76, 72, 69, 64]): ma.place(out, piano(m, 2.2, .2), 14.3 + j * .62)
    ma.place(out, ma.pad((57, 60, 64, 71), 3.2, .2, True), 15.4)
    ma.place(out, ma.pad((53, 57, 60, 64), 2.6, .14, True), 17.0)
    e = np.zeros(N); sh = int(.43 * SR); e[sh:] = out[:-sh] * .35; sh2 = int(.86 * SR); e[sh2:] += out[:-sh2] * .18
    return out + e

def main():
    cues = json.load(open(sys.argv[1])); outp = sys.argv[2]; sf = np.zeros(N)
    for c in cues:
        t0, name = c[0], c[1]; vol = c[2] if len(c) > 2 else 1.0
        if name not in SFX: print('skip', name); continue
        ma.place(sf, SFX[name](), t0, vol)
    bgm = build_bgm(); env = np.abs(sf); k = int(.08 * SR); env = np.convolve(env, np.ones(k) / k, mode='same'); duck = 1 - .35 * np.clip(env * 4, 0, 1)
    mix = bgm * .9 * duck + sf
    mix *= np.minimum(1, (DUR - np.arange(N) / SR) / 1.2) * np.minimum(1, np.arange(N) / SR / .3)
    mix = np.tanh(mix * 1.1); mix = mix / max(1e-6, np.max(np.abs(mix))) * .89
    st = (mix * 32767).astype('<i2'); st2 = np.repeat(st[:, None], 2, axis=1)
    with wave.open(outp, 'wb') as w: w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR); w.writeframes(st2.tobytes())
    print('wrote', outp, 'peak', float(np.max(np.abs(mix))), 'rms', float(np.sqrt(np.mean(mix ** 2))))
if __name__ == '__main__': main()

"""Audio 'Red Flag vs Green Flag' (22 dtk). usage: make_audio11.py cues.json out.wav"""
import sys, json, wave
import numpy as np
import make_audio as ma
import make_audio6 as m6

SR = ma.SR; DUR = 22.0; N = int(SR * DUR); tarr = ma.tarr
SFX = dict(m6.SFX); piano = m6.piano
T0, TEND = 1.6, 18.6

def build_bgm():
    out = np.zeros(N); beat = .6; bar = beat * 4
    ch = [(60, 64, 67), (55, 59, 62), (57, 60, 64), (53, 57, 60)]
    arp = [[72, 76, 79, 76], [71, 74, 79, 74], [69, 72, 76, 72], [65, 69, 72, 69]]
    ma.place(out, ma.pad(ch[0], 1.9, .12, False), 0.0)
    for j in range(3): ma.place(out, ma.hat(.06), .3 + j * .5)
    t0 = T0 - .2; i = 0
    while t0 < TEND:
        c = ch[i % 4]; ma.place(out, ma.pad(c, bar + .3, .13, True), t0); ma.place(out, ma.bass(c[0] - 12, beat * 1.7, .4), t0); ma.place(out, ma.bass(c[0] - 12, beat * 1.2, .3), t0 + beat * 2.5)
        for b in range(4):
            tt = t0 + b * beat
            if tt >= TEND: break
            if b in (0, 2): ma.place(out, ma.kick(.75), tt)
            if b in (1, 3): ma.place(out, ma.clap(.3), tt)
            ma.place(out, ma.hat(.1), tt); ma.place(out, ma.hat(.07, True), tt + beat / 2)
            for q in range(2): ma.place(out, ma.pluck(arp[i % 4][(b * 2 + q) % 4], .4, .13), tt + q * beat / 2)
        t0 += bar; i += 1
    # outro: calm pad + piano resolution
    ma.place(out, ma.pad((53, 57, 60, 64), 4.0, .16, True), TEND)
    for j, m in enumerate([77, 74, 72, 69, 72]): ma.place(out, piano(m, 2.4, .18), TEND + .4 + j * .65)
    e = np.zeros(N); sh = int(.3 * SR); e[sh:] = out[:-sh] * .22
    return out + e

def main():
    cues = json.load(open(sys.argv[1])); outp = sys.argv[2]; sf = np.zeros(N)
    for c in cues:
        t0, name = c[0], c[1]; vol = c[2] if len(c) > 2 else 1.0
        if name not in SFX: print('skip', name); continue
        ma.place(sf, SFX[name](), t0, vol)
    bgm = build_bgm(); env = np.abs(sf); k = int(.08 * SR); env = np.convolve(env, np.ones(k) / k, mode='same'); duck = 1 - .35 * np.clip(env * 4, 0, 1)
    mix = bgm * .85 * duck + sf
    mix *= np.minimum(1, (DUR - np.arange(N) / SR) / 1.4) * np.minimum(1, np.arange(N) / SR / .2)
    mix = np.tanh(mix * 1.1); mix = mix / max(1e-6, np.max(np.abs(mix))) * .89
    st = (mix * 32767).astype('<i2'); st2 = np.repeat(st[:, None], 2, axis=1)
    with wave.open(outp, 'wb') as w: w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR); w.writeframes(st2.tobytes())
    print('wrote', outp, 'peak', float(np.max(np.abs(mix))), 'rms', float(np.sqrt(np.mean(mix ** 2))))
if __name__ == '__main__': main()

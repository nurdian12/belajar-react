"""Audio 'Mencintai vs Dicintai' (20 dtk). usage: make_audio7.py cues.json out.wav"""
import sys, json, wave
import numpy as np
import make_audio as ma
import make_audio6 as m6

SR = ma.SR; DUR = 20.0; N = int(SR * DUR); tarr = ma.tarr
SFX = dict(m6.SFX)
piano = m6.piano

def build_bgm():
    out = np.zeros(N); T_STOP = 9.4
    ch = [(57, 60, 64), (53, 57, 60), (48, 52, 55), (55, 59, 62)]
    arp = [[69, 72, 76, 72], [65, 69, 72, 69], [64, 67, 72, 67], [62, 67, 71, 67]]
    # phase 1: gentle effortful arpeggios, slowing down as energy drops
    k = .3; i = 0
    while k < T_STOP - .3:
        slow = 1 + 1.2 * max(0, (k - 6.5) / 2.9); step = .5 * slow; q = (i // 4) % 4
        ma.place(out, piano(arp[q][i % 4], 1.1, .17 * (1 - .4 * max(0, (k - 6.5) / 2.9))), k); k += step; i += 1
    for j, tt in enumerate([0.2, 2.5, 4.8, 7.1]): ma.place(out, ma.pad(ch[j], 2.7, .1, False), tt)
    kk = .8
    while kk < 7.4: ma.place(out, ma.hat(.05), kk); ma.place(out, ma.hat(.03), kk + .5); kk += 1.0
    # silence at the stop, then lonely notes
    t = tarr(DUR); out[(t > T_STOP - .02) & (t < T_STOP + .55)] *= .05
    for j, m in enumerate([69, 64, 60, 57]): ma.place(out, piano(m, 2.4, .2), 9.9 + j * 1.1)
    ma.place(out, ma.pad((45, 52, 57), 3.4, .12, False), 9.8)
    # realization swell
    ma.place(out, ma.pad((50, 53, 57, 60), 3.6, .16, True), 12.6)
    for j, m in enumerate([62, 65, 69, 74]): ma.place(out, piano(m, 2.0, .2), 13.1 + j * .55)
    # resolution
    ma.place(out, ma.pad((57, 60, 64, 71), 4.2, .2, True), 16.0)
    for j, m in enumerate([76, 72, 69, 64, 69]): ma.place(out, piano(m, 2.4, .18), 16.1 + j * .65)
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

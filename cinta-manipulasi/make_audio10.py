"""Audio 'Cinta karena Tampilan / Ketulusan' (20 dtk). usage: make_audio10.py cues.json out.wav F|T"""
import sys, json, wave
import numpy as np
import make_audio as ma
import make_audio6 as m6

SR = ma.SR; DUR = 20.0; N = int(SR * DUR); tarr = ma.tarr
SFX = dict(m6.SFX); piano = m6.piano

def build_bgm(kind):
    out = np.zeros(N); REV = 8.0; t = tarr(DUR)
    ch = [(60, 64, 67), (55, 59, 62), (57, 60, 64), (53, 57, 60)]
    arp = [[72, 76, 79, 76], [71, 74, 79, 74], [69, 72, 76, 72], [65, 69, 72, 69]]
    k = .3; i = 0
    while k < REV - .2:
        ma.place(out, piano(arp[(i // 4) % 4][i % 4], 1.1, .17), k); k += .5; i += 1
    for j, tt in enumerate([.2, 2.0, 4.0, 6.0]): ma.place(out, ma.pad(ch[j], 2.2, .1, False), tt)
    out[(t > REV - .02) & (t < REV + .55)] *= .05
    if kind == 'F':
        for j, m in enumerate([69, 64, 60, 57, 52]): ma.place(out, piano(m, 2.6, .2), 8.8 + j * 1.0)
        ma.place(out, ma.pad((45, 52, 57), 4.0, .12, False), 8.8)
        ma.place(out, ma.pad((45, 52, 57, 64), 4.6, .17, True), 15.4)
        for j, m in enumerate([64, 60, 57]): ma.place(out, piano(m, 2.6, .17), 16.3 + j * .9)
    else:
        for j, m in enumerate([69, 65, 64, 60]): ma.place(out, piano(m, 2.0, .18), 8.7 + j * .8)
        ma.place(out, ma.pad((57, 60, 64), 3.0, .12, False), 8.7)
        ma.place(out, ma.pad((48, 52, 55, 62), 2.6, .17, True), 11.6)
        for j, m in enumerate([67, 71, 74, 79, 83]): ma.place(out, piano(m, 1.6, .2), 11.8 + j * .4)
        ma.place(out, ma.pad((53, 57, 60, 67), 3.0, .2, True), 13.0)
        for j, m in enumerate([77, 74, 79, 83]): ma.place(out, piano(m, 2.0, .18), 13.1 + j * .45)
        ma.place(out, ma.pad((53, 57, 60, 64, 71), 4.2, .2, True), 16.0)
        for j, m in enumerate([77, 74, 72, 69, 72]): ma.place(out, piano(m, 2.4, .17), 16.1 + j * .65)
    e = np.zeros(N); sh = int(.43 * SR); e[sh:] = out[:-sh] * .35; sh2 = int(.86 * SR); e[sh2:] += out[:-sh2] * .18
    return out + e

def main():
    cues = json.load(open(sys.argv[1])); outp = sys.argv[2]; kind = sys.argv[3]; sf = np.zeros(N)
    for c in cues:
        t0, name = c[0], c[1]; vol = c[2] if len(c) > 2 else 1.0
        if name not in SFX: print('skip', name); continue
        ma.place(sf, SFX[name](), t0, vol)
    bgm = build_bgm(kind); env = np.abs(sf); k = int(.08 * SR); env = np.convolve(env, np.ones(k) / k, mode='same'); duck = 1 - .35 * np.clip(env * 4, 0, 1)
    mix = bgm * .9 * duck + sf
    mix *= np.minimum(1, (DUR - np.arange(N) / SR) / 1.2) * np.minimum(1, np.arange(N) / SR / .3)
    mix = np.tanh(mix * 1.1); mix = mix / max(1e-6, np.max(np.abs(mix))) * .89
    st = (mix * 32767).astype('<i2'); st2 = np.repeat(st[:, None], 2, axis=1)
    with wave.open(outp, 'wb') as w: w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR); w.writeframes(st2.tobytes())
    print('wrote', outp, 'peak', float(np.max(np.abs(mix))), 'rms', float(np.sqrt(np.mean(mix ** 2))))
if __name__ == '__main__': main()

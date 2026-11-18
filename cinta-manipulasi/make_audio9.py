"""Audio 'Cinta Tulus vs Cinta Fisik' versi B ditinggal (20 dtk). usage: make_audio9.py cues.json out.wav"""
import sys, json, wave
import numpy as np
import make_audio as ma
import make_audio6 as m6

SR = ma.SR; DUR = 20.0; N = int(SR * DUR); tarr = ma.tarr
SFX = dict(m6.SFX); piano = m6.piano

def build_bgm():
    out = np.zeros(N); T_CHG, T_LEAVE = 6.8, 9.8
    ch = [(60, 64, 67), (55, 59, 62), (57, 60, 64), (53, 57, 60)]
    arp = [[72, 76, 79, 76], [71, 74, 79, 74], [69, 72, 76, 72], [65, 69, 72, 69]]
    k = .3; i = 0
    while k < T_CHG - .1:
        ma.place(out, piano(arp[(i // 4) % 4][i % 4], 1.1, .17), k); k += .5; i += 1
    for j, tt in enumerate([.2, 1.9, 3.6, 5.3]): ma.place(out, ma.pad(ch[j], 2.0, .1, False), tt)
    for j, m in enumerate([69, 65, 64, 60]): ma.place(out, piano(m, 2.0, .18), 6.9 + j * .75)
    ma.place(out, ma.pad((57, 60, 64), 3.2, .12, False), 6.8)
    t = tarr(DUR); out[(t > T_LEAVE - .05) & (t < T_LEAVE + .5)] *= .06
    for j, m in enumerate([64, 60, 57]): ma.place(out, piano(m, 2.4, .2), 10.0 + j * .8)
    ma.place(out, ma.pad((45, 52, 57), 2.4, .1, False), 10.0)
    # A rises: bright, hopeful (12.4 -> 14.6)
    ma.place(out, ma.pad((48, 52, 55, 62), 2.4, .17, True), 12.4)
    for j, m in enumerate([67, 71, 74, 79, 83, 79]): ma.place(out, piano(m, 1.4, .2), 12.6 + j * .33)
    ma.place(out, ma.hat(.08), 13.0); ma.place(out, ma.kick(.5), 13.0); ma.place(out, ma.kick(.5), 13.65); ma.place(out, ma.kick(.5), 14.3)
    # B arrives -> music cuts, then bittersweet minor
    out[(t > 14.55) & (t < 15.15)] *= .05
    for j, m in enumerate([69, 64, 60, 57, 52]): ma.place(out, piano(m, 2.6, .2), 15.2 + j * .85)
    ma.place(out, ma.pad((45, 52, 57, 64), 4.8, .17, True), 15.2)
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

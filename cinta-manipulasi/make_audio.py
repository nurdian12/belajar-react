"""Sintesis SFX + musik latar untuk video kenalipolanya.
usage: python3 make_audio.py cues.json out.wav [reveal_time]
cues.json = [[waktu_detik, 'nama_sfx', volume?], ...]
"""
import sys, json, wave
import numpy as np

SR = 44100
DUR = 20.0
N = int(SR * DUR)
rng = np.random.default_rng(7)


def tarr(d):
    return np.arange(int(d * SR)) / SR


def fft_filter(x, kind, fc, order=2):
    X = np.fft.rfft(x)
    f = np.fft.rfftfreq(len(x), 1 / SR)
    f[0] = 1e-6
    if kind == 'lp':
        H = 1 / np.sqrt(1 + (f / fc) ** (2 * order))
    elif kind == 'hp':
        H = 1 / np.sqrt(1 + (fc / f) ** (2 * order))
    else:
        raise ValueError(kind)
    return np.fft.irfft(X * H, len(x))


def bandpass(x, lo, hi):
    return fft_filter(fft_filter(x, 'hp', lo), 'lp', hi)


def noise(d):
    return rng.standard_normal(int(d * SR))


def sweep_sine(f0, f1, d, expo=True):
    t = tarr(d)
    if expo:
        k = (f1 / f0) ** (1 / d)
        ph = 2 * np.pi * f0 * (k ** t - 1) / np.log(k)
    else:
        ph = 2 * np.pi * (f0 * t + (f1 - f0) * t ** 2 / (2 * d))
    return np.sin(ph)


def adsr(d, a=.004, r=None, curve=3.0):
    t = tarr(d)
    r = r if r is not None else d - a
    e = np.minimum(t / a, 1) * np.exp(-curve * t / max(r, 1e-3))
    return e


def tone(f, d, a=.003, curve=5.0, harm=(1.0,)):
    t = tarr(d)
    y = sum(h * np.sin(2 * np.pi * f * (i + 1) * t) for i, h in enumerate(harm))
    return y * adsr(d, a, d, curve)


# ---------------- SFX ----------------
def sfx_pop(): return sweep_sine(700, 260, .14) * adsr(.14, .002, .14, 6) * .9
def sfx_tick(): return bandpass(noise(.03), 2500, 6500) * adsr(.03, .001, .03, 6) * .6
def sfx_ding():
    d = 1.1; t = tarr(d)
    y = sum(a * np.sin(2 * np.pi * f * t) * np.exp(-r * t) for f, a, r in [(1046, 1, 3.2), (2093, .5, 4.5), (3136, .25, 6)])
    return y * .55
def sfx_notif():
    a = tone(880, .16, .003, 7, (1, .3)); b = tone(1318, .3, .003, 5, (1, .3))
    y = np.zeros(int(.5 * SR)); y[:len(a)] += a; s = int(.13 * SR); y[s:s + len(b)] += b; return y * .6
def sfx_buzz():
    d = .38; t = tarr(d); y = np.sign(np.sin(2 * np.pi * 140 * t)) * (0.6 + .4 * np.sign(np.sin(2 * np.pi * 22 * t)))
    return fft_filter(y, 'lp', 1800) * adsr(d, .004, d, 2.0) * .55
def sfx_anger():
    d = .5; t = tarr(d); y = np.sign(np.sin(2 * np.pi * 85 * t * (1 + .15 * np.sin(2 * np.pi * 9 * t)))) * (.5 + .5 * np.sin(2 * np.pi * 13 * t))
    return fft_filter(y, 'lp', 700) * adsr(d, .01, d, 2.2) * .7
def sfx_thud():
    d = .5; y = sweep_sine(150, 42, d) * adsr(d, .002, d, 7)
    click = bandpass(noise(.02), 500, 3000) * adsr(.02, .0005, .02, 6); y[:len(click)] += click * .5
    return y * 1.1
def sfx_stone():
    d = .55; y = sweep_sine(95, 38, d) * adsr(d, .002, d, 6)
    r = fft_filter(noise(d), 'lp', 400) * adsr(d, .003, d, 5) * .6; return (y + r) * 1.0
def sfx_whoosh(d=.45, up=True):
    n = noise(d); t = tarr(d); p = t / d
    lo, mi, hi = fft_filter(n, 'lp', 700), bandpass(n, 900, 2500), fft_filter(n, 'hp', 3500)
    w1, w2, w3 = (1 - p, 1 - np.abs(2 * p - 1), p) if up else (p, 1 - np.abs(2 * p - 1), 1 - p)
    y = lo * w1 + mi * w2 + hi * w3 * .7
    return y * np.sin(np.pi * p) ** 1.5 * .5
def sfx_riser():
    d = 1.15; t = tarr(d); p = t / d
    n = fft_filter(noise(d), 'hp', 800) * p ** 2
    s = sweep_sine(220, 1500, d, expo=True) * p ** 2 * .6
    return (n * .5 + s) * .6
def sfx_reveal():
    y = np.zeros(int(1.4 * SR)); th = sfx_thud() * 1.0; y[:len(th)] += th
    dg = sfx_ding(); y[:len(dg)] += dg * .9
    w = sfx_whoosh(.4, False); y[:len(w)] += w * .7; return y
def sfx_sparkle():
    notes = [1568, 1976, 2349, 3136, 3951]; y = np.zeros(int(.9 * SR))
    for i, f in enumerate(notes):
        a = tone(f, .35, .002, 7, (1, .25)); s = int(i * .055 * SR); y[s:s + len(a)] += a
    return y * .45
def sfx_heart():
    y = np.zeros(int(.8 * SR))
    for s0 in (0, .16):
        a = sweep_sine(110, 55, .22) * adsr(.22, .003, .22, 8); s = int(s0 * SR); y[s:s + len(a)] += a
    c = tone(1318, .4, .003, 6, (1, .3)); s = int(.32 * SR); y[s:s + len(c)] += c * .5; return y * .9
def sfx_sad():
    freqs = [311, 294, 277, 247]; durs = [.22, .22, .22, .7]; y = np.zeros(int(1.5 * SR)); pos = 0
    for f, d in zip(freqs, durs):
        t = tarr(d); vib = 1 + (.02 * np.sin(2 * np.pi * 6 * t) if d > .5 else 0)
        saw = 2 * ((f * vib * t) % 1) - 1; a = fft_filter(saw, 'lp', 1100) * np.minimum(t / .02, 1) * np.exp(-2.0 * t / d)
        y[pos:pos + len(a)] += a; pos += int(d * SR * .95)
    return y * .55
def sfx_coin():
    a = tone(988, .09, .001, 6, (1, .4)); b = tone(1319, .4, .001, 4.5, (1, .4)); y = np.zeros(int(.55 * SR)); y[:len(a)] += a; s = int(.075 * SR); y[s:s + len(b)] += b; return y * .6
def sfx_snip():
    y = np.zeros(int(.3 * SR))
    for s0 in (0, .06):
        c = bandpass(noise(.018), 2500, 9000) * adsr(.018, .0005, .018, 5); r = tone(4200, .12, .001, 9) * .25
        s = int(s0 * SR); y[s:s + len(c)] += c; y[s:s + len(r)] += r
    return y * 1.0
def sfx_record():
    d = .5; t = tarr(d); p = t / d
    n = bandpass(noise(d), 600, 5000) * (1 - p) ** .7
    saw = 2 * (np.cumsum(np.linspace(520, 50, len(t))) / SR % 1) - 1
    return (n * .7 + fft_filter(saw, 'lp', 1500) * .5) * np.minimum(t / .01, 1) * .8
def sfx_crack():
    d = .7; y = bandpass(noise(d), 900, 8000) * adsr(d, .001, d, 6) * .8
    for s0 in (.05, .12, .2, .33):
        c = bandpass(noise(.012), 1500, 7000) * adsr(.012, .0003, .012, 4); s = int(s0 * SR); y[s:s + len(c)] += c * 1.2
    return y * .8

SFX = dict(pop=sfx_pop, tick=sfx_tick, ding=sfx_ding, notif=sfx_notif, buzz=sfx_buzz, anger=sfx_anger, thud=sfx_thud, stone=sfx_stone,
           whoosh=sfx_whoosh, riser=sfx_riser, reveal=sfx_reveal, sparkle=sfx_sparkle, heart=sfx_heart, sad=sfx_sad, coin=sfx_coin,
           snip=sfx_snip, record=sfx_record, crack=sfx_crack)


def place(buf, y, t0, vol=1.0):
    s = int(t0 * SR)
    if s >= len(buf): return
    e = min(len(buf), s + len(y)); buf[s:e] += y[:e - s] * vol


# ---------------- BGM ----------------
NOTE = lambda m: 440 * 2 ** ((m - 69) / 12)

def pad(notes, d, vol=.12, bright=False):
    t = tarr(d); y = np.zeros(len(t))
    for m in notes:
        f = NOTE(m)
        y += np.sin(2 * np.pi * f * t) + .35 * np.sin(2 * np.pi * f * 2.003 * t) + (.25 if bright else .12) * np.sin(2 * np.pi * f * 3 * t)
        y += .6 * np.sin(2 * np.pi * f * 1.004 * t)
    env = np.minimum(t / .25, 1) * np.minimum((d - t) / .35, 1)
    return y * env * vol / len(notes)

def kick(vol=.9):
    d = .28; y = sweep_sine(130, 45, d) * adsr(d, .002, d, 9); return y * vol
def clap(vol=.35):
    d = .22; return bandpass(noise(d), 900, 6000) * adsr(d, .002, d, 11) * vol
def hat(vol=.12, open_=False):
    d = .22 if open_ else .05; return fft_filter(noise(d), 'hp', 6500) * adsr(d, .001, d, 8 if open_ else 12) * vol
def bass(m, d=.5, vol=.4):
    t = tarr(d); y = np.sin(2 * np.pi * NOTE(m) * t) + .3 * np.sin(2 * np.pi * NOTE(m) * 2 * t); return y * np.minimum(t / .01, 1) * np.exp(-3.0 * t / d) * vol
def pluck(m, d=.4, vol=.18):
    t = tarr(d); f = NOTE(m); y = np.sin(2 * np.pi * f * t) + .4 * np.sin(2 * np.pi * f * 2 * t) + .2 * np.sin(2 * np.pi * f * 3 * t); return y * adsr(d, .002, d, 6) * vol


def build_bgm(reveal, bpm=96):
    out = np.zeros(N); beat = 60 / bpm; bar = beat * 4
    # tense section (minor): sparse pad, heartbeat kick, ticking hats
    chords_t = [(57, 60, 64), (53, 57, 60), (55, 59, 62), (52, 56, 59)]  # Am F G E
    t0 = 0.0; i = 0
    while t0 < reveal - .35:
        d = min(bar, reveal - .35 - t0); place(out, pad(chords_t[i % 4], d, .16), t0)
        for b in range(4):
            tt = t0 + b * beat
            if tt < reveal - .4:
                if b in (0, 2): place(out, kick(.55), tt)
                place(out, hat(.07), tt + beat / 2)
        place(out, bass(chords_t[i % 4][0] - 12, bar * .9, .35), t0)
        t0 += bar; i += 1
    # bright section (major) after reveal
    chords_b = [(60, 64, 67), (55, 59, 62), (57, 60, 64), (53, 57, 60)]  # C G Am F
    arps = [(72, 76, 79, 76), (71, 74, 79, 74), (72, 76, 81, 76), (69, 72, 77, 72)]
    t0 = reveal; i = 0
    while t0 < DUR:
        d = min(bar, DUR - t0); ch = chords_b[i % 4]
        place(out, pad(ch, d, .17, True), t0)
        place(out, bass(ch[0] - 12, beat * 1.8, .45), t0); place(out, bass(ch[0] - 12, beat * 1.2, .35), t0 + beat * 2.5)
        for b in range(4):
            tt = t0 + b * beat
            if tt >= DUR: break
            if b in (0, 2): place(out, kick(.8), tt)
            if b in (1, 3): place(out, clap(.34), tt)
            place(out, hat(.12), tt); place(out, hat(.09, True), tt + beat / 2)
            for k in range(2):
                m = arps[i % 4][(b * 2 + k) % 4]; place(out, pluck(m, .35, .16), tt + k * beat / 2)
        t0 += bar; i += 1
    return out


def main():
    cues = json.load(open(sys.argv[1])); outp = sys.argv[2]; reveal = float(sys.argv[3]) if len(sys.argv) > 3 else 8.5
    sf = np.zeros(N)
    for c in cues:
        t0, name = c[0], c[1]; vol = c[2] if len(c) > 2 else 1.0
        if name not in SFX: print('skip', name); continue
        y = SFX[name](); place(sf, y, t0, vol)
    bgm = build_bgm(reveal)
    # ducking: lower bgm slightly when sfx active
    env = np.abs(sf); k = int(.08 * SR); env = np.convolve(env, np.ones(k) / k, mode='same'); duck = 1 - .45 * np.clip(env * 4, 0, 1)
    mix = bgm * .8 * duck + sf * 1.0
    fo = np.minimum(1, (DUR - np.arange(N) / SR) / .6); mix *= fo
    mix = np.tanh(mix * 1.1)
    mix = mix / max(1e-6, np.max(np.abs(mix))) * .89
    st = (mix * 32767).astype('<i2'); st2 = np.repeat(st[:, None], 2, axis=1)
    with wave.open(outp, 'wb') as w:
        w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR); w.writeframes(st2.tobytes())
    print('wrote', outp, 'peak', float(np.max(np.abs(mix))), 'rms', float(np.sqrt(np.mean(mix ** 2))))


if __name__ == '__main__':
    main()

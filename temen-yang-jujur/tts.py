#!/usr/bin/env python3
"""Buat voice over per baris dialog pakai Edge TTS -> voice/NNN_tokoh.mp3

Pakai:  python3 tts.py [voice_dir]
Butuh:  pip install edge-tts   (dan akses ke speech.platform.bing.com)
Proxy diambil otomatis dari HTTPS_PROXY bila ada.
"""
import asyncio, os, subprocess, sys
import edge_tts
import render

# Hanya ada dua suara Indonesia di Edge TTS: Ardi (pria) & Gadis (wanita).
# Dua tokoh sama-sama pria, jadi dibedakan lewat nada dan kecepatan.
VOICES = {
    "raka": dict(voice="id-ID-ArdiNeural", pitch="+28Hz", rate="+10%"),
    "bima": dict(voice="id-ID-ArdiNeural", pitch="-22Hz", rate="-6%"),
}

# Emosi per baris: index baris global -> (preset, teks pengganti untuk penekanan/jeda)
# Preset = (delta pitch Hz, delta rate %, delta volume %)
PRESET = {
    "gelisah":  (+4, -6, 0),      # ragu, mulai curhat
    "kaget":    (+14, +10, +22),  # terkejut, keras
    "yakin":    (+16, -2, +18),   # tegas penuh semangat
    "tegas":    (-8, -8, +20),    # jelas, berat, menekan
    "bangga":   (+18, +4, +20),
    "semangat": (+26, +12, +22),  # excited / membela diri
    "sarkas":   (-10, -12, +4),   # datar menyindir
    "pasrah":   (-14, -16, -4),   # menghela napas
    "santai":   (+2, -2, 0),
    "hangat":   (+6, -10, +6),    # tulus, pelan
    "ragu":     (+10, -14, -6),   # pelan, gamang
    "protes":   (+16, +6, +20),
    "lega":     (0, -6, +4),
}
EMO = {
    0:  ("gelisah", "Bim... gue kepikiran, mau resign."),
    1:  ("kaget",   "Hah?! Serius lu?"),
    2:  ("yakin",   "Serius! Gue mau buka usaha."),
    3:  ("tegas",   "Udah ada modal?"),
    4:  ("bangga",  "Ada! Delapan puluh ribu."),
    5:  ("sarkas",  "Hmm..."),
    6:  ("semangat", "Tapi ide gue gila, Bim! Kopi literan... ada filosofinya!"),
    7:  ("sarkas",  "Kopi literan di sini... udah ada empat puluh."),
    8:  ("protes",  "Beda! Punya gue, ada quotes di tutupnya!"),
    9:  ("pasrah",  "Ya ampun..."),
    10: ("bangga",  "Nih, gerobaknya! Gue beli kemarin."),
    11: ("kaget",   "Lu udah beli duluan?!"),
    12: ("santai",  "Cicilan, tenang... dua belas bulan."),
    13: ("sarkas",  "Lu mau bayar pake apa? Filosofi?"),
    14: ("protes",  "Makanya gue mau resign! Biar fokus."),
    15: ("hangat",  "Tunggu, tunggu. Gue support lu."),
    16: ("tegas",   "Tapi jangan resign dulu. Kopi jalan, baru keluar."),
    17: ("ragu",    "Kalau kopinya... nggak jalan?"),
    18: ("santai",  "Ya lu masih punya gaji. Bisa traktir gue."),
    19: ("protes",  "Itu mah lu doang yang untung!"),
    26: ("lega",    "Bim, gue udah ngomong sama bos."),
    27: ("tegas",   "Gue nggak jadi resign. Ambil lembur dulu."),
    28: ("santai",  "Oh iya, gerobaknya gue taro di garasi lu, ya."),
    29: ("kaget",   "Hah?! Garasi gue?!"),
    30: ("hangat",  "Makasih ya, Bim. Lu emang temen yang selalu support."),
    31: ("tegas",   "Cicilannya, bayar sendiri, ya."),
}

# Mastering: kompresor + EQ supaya lantang, jelas, dan konsisten
MASTER = ("highpass=f=90,equalizer=f=250:t=q:w=1:g=-2,equalizer=f=3200:t=q:w=1.2:g=3.5,"
          "acompressor=threshold=-20dB:ratio=3.5:attack=4:release=90:makeup=4,"
          "loudnorm=I=-15:TP=-1.5:LRA=7")

def lines():
    i = 0
    for _seq, items in render.SEQS:
        for who, text, view in items:
            if who and view != "narr" and text:
                yield i, who, text.replace("☎ ", "")
            i += 1

def fmt(v, unit): return f"{'+' if v >= 0 else '-'}{abs(v)}{unit}"

async def one(i, who, text, out):
    v = VOICES[who]
    preset, text = EMO.get(i, ("santai", text))
    dp, dr, dv = PRESET[preset]
    base_p, base_r = int(v["pitch"][:-2]), int(v["rate"][:-1])
    kw = {}
    proxy = os.environ.get("HTTPS_PROXY")
    if proxy:
        kw["proxy"] = proxy
    for attempt in range(3):
        try:
            raw = out + ".raw.mp3"
            await edge_tts.Communicate(text, v["voice"], rate=fmt(base_r + dr, "%"), pitch=fmt(base_p + dp, "Hz"),
                                       volume=fmt(dv, "%"), **kw).save(raw)
            subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", raw, "-af", MASTER, "-ar", "24000", "-ac", "1", "-b:a", "96k", out], check=True)
            os.remove(raw)
            return
        except Exception as e:  # jaringan putus sesaat
            if attempt == 2:
                raise
            await asyncio.sleep(2)

async def main(out_dir):
    os.makedirs(out_dir, exist_ok=True)
    sem = asyncio.Semaphore(3)
    async def run(i, who, text):
        async with sem:
            out = os.path.join(out_dir, f"{i:03d}_{who}.mp3")
            await one(i, who, text, out)
            print("ok", out, "-", text, flush=True)
    await asyncio.gather(*(run(i, w, t) for i, w, t in lines()))

if __name__ == "__main__":
    asyncio.run(main(sys.argv[1] if len(sys.argv) > 1 else os.path.join(os.path.dirname(os.path.abspath(__file__)), "voice")))

#!/usr/bin/env python3
"""Buat voice over per baris dialog pakai Edge TTS -> voice/NNN_tokoh.mp3

Pakai:  python3 tts.py [voice_dir]
Butuh:  pip install edge-tts   (dan akses ke speech.platform.bing.com)
Proxy diambil otomatis dari HTTPS_PROXY bila ada.
"""
import asyncio, os, sys
import edge_tts
import render

# Hanya ada dua suara Indonesia di Edge TTS: Ardi (pria) & Gadis (wanita).
# Dua tokoh sama-sama pria, jadi dibedakan lewat nada dan kecepatan.
VOICES = {
    "raka": dict(voice="id-ID-ArdiNeural", pitch="+28Hz", rate="+10%"),
    "bima": dict(voice="id-ID-ArdiNeural", pitch="-22Hz", rate="-6%"),
}

def lines():
    i = 0
    for _seq, items in render.SEQS:
        for who, text, view in items:
            if who and view != "narr" and text:
                yield i, who, text.replace("☎ ", "")
            i += 1

async def one(i, who, text, out):
    v = VOICES[who]
    kw = {}
    proxy = os.environ.get("HTTPS_PROXY")
    if proxy:
        kw["proxy"] = proxy
    for attempt in range(3):
        try:
            await edge_tts.Communicate(text, v["voice"], rate=v["rate"], pitch=v["pitch"], **kw).save(out)
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

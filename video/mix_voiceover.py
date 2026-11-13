#!/usr/bin/env python3
"""Tempelkan rekaman voice-over ke video: suara video (SFX/musik) otomatis mengecil saat ada suara.

Pakai:
  python3 video/mix_voiceover.py video/cerita-lentera.mp4 rekaman.wav -o video/cerita-lentera-vo.mp4
Opsi:
  --offset 0.4   detik jeda sebelum rekaman mulai (default 0.4; sesuaikan agar kalimat pertama
                 jatuh di sekitar detik 0:00-0:01)
  --bed 0.8      volume suara latar video (0-1, default 0.8)
  --duck 8       kekuatan pengecilan suara latar saat ada suara (rasio, default 8)
  --no-norm      jangan normalisasi loudness suara
Rekaman boleh .wav / .mp3 / .m4a. Butuh ffmpeg.
"""
import argparse
import json
import os
import subprocess
import sys


def duration(path):
    out = subprocess.check_output(
        ["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "json", path])
    return float(json.loads(out)["format"]["duration"])


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("video")
    ap.add_argument("voice")
    ap.add_argument("-o", "--output", default=None)
    ap.add_argument("--offset", type=float, default=0.4)
    ap.add_argument("--bed", type=float, default=0.8)
    ap.add_argument("--duck", type=float, default=8.0)
    ap.add_argument("--no-norm", action="store_true")
    a = ap.parse_args()

    for f in (a.video, a.voice):
        if not os.path.exists(f):
            sys.exit(f"File tidak ditemukan: {f}")
    out = a.output or os.path.splitext(a.video)[0] + "-vo.mp4"
    dv, da = duration(a.video), duration(a.voice) + a.offset
    if da > dv + 0.2:
        print(f"Peringatan: suara ({da:.1f} dtk termasuk offset) lebih panjang dari video ({dv:.1f} dtk); "
              "bagian akhir suara akan terpotong. Percepat sedikit atau kurangi jeda.", file=sys.stderr)

    ms = int(a.offset * 1000)
    norm = "" if a.no_norm else "loudnorm=I=-16:TP=-1.5:LRA=11,"
    graph = (
        f"[1:a]aformat=sample_rates=44100:channel_layouts=stereo,adelay={ms}|{ms},{norm}"
        f"asplit=2[vo][vosc];"
        f"[0:a]aformat=sample_rates=44100:channel_layouts=stereo,volume={a.bed}[bed];"
        f"[bed][vosc]sidechaincompress=threshold=0.02:ratio={a.duck}:attack=20:release=400[ducked];"
        f"[ducked][vo]amix=inputs=2:duration=first:normalize=0,alimiter=limit=0.95[a]"
    )
    cmd = ["ffmpeg", "-v", "error", "-y", "-i", a.video, "-i", a.voice, "-filter_complex", graph,
           "-map", "0:v", "-map", "[a]", "-c:v", "copy", "-c:a", "aac", "-b:a", "160k",
           "-t", f"{dv:.3f}", out]
    subprocess.check_call(cmd)
    print("selesai:", out)


if __name__ == "__main__":
    main()

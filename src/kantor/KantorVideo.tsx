import React from 'react';
import {AbsoluteFill, Audio, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';

/** Gaya "Teks Kinetik": latar polos, satu kalimat per layar, kata menyala mengikuti suara. */

export type Kata = {k: string; mulai: number; selesai: number};
export type Kalimat = {teks: string; mulai: number; selesai: number; kata: Kata[]};
export type KantorProps = {
  judul: string;
  /** path relatif ke folder public/, mis. "kantor/3.mp3" */
  audio: string | null;
  durasi: number;
  kalimat: Kalimat[];
};

export const KANTOR_DEFAULT: KantorProps = {
  judul: 'Contoh judul video',
  audio: null,
  durasi: 6,
  kalimat: [
    {
      teks: 'Ini contoh kalimat pertama.',
      mulai: 0,
      selesai: 2.5,
      kata: [
        {k: 'Ini', mulai: 0, selesai: 0.5},
        {k: 'contoh', mulai: 0.5, selesai: 1.1},
        {k: 'kalimat', mulai: 1.1, selesai: 1.8},
        {k: 'pertama.', mulai: 1.8, selesai: 2.5},
      ],
    },
    {
      teks: 'Lalu kalimat kedua muncul.',
      mulai: 3,
      selesai: 5.4,
      kata: [
        {k: 'Lalu', mulai: 3, selesai: 3.5},
        {k: 'kalimat', mulai: 3.5, selesai: 4.1},
        {k: 'kedua', mulai: 4.1, selesai: 4.7},
        {k: 'muncul.', mulai: 4.7, selesai: 5.4},
      ],
    },
  ],
};

const BG = '#f6f1ea';
const INK = '#1f1b16';
const ACCENT = '#d9622b';

export const KantorVideo: React.FC<KantorProps> = ({judul, audio, kalimat}) => {
  const frame = useCurrentFrame();
  const {fps, durationInFrames} = useVideoConfig();
  const t = frame / fps;

  // Kalimat aktif = yang terakhir sudah dimulai; tetap tampil di jeda sampai kalimat berikutnya.
  let idx = -1;
  kalimat.forEach((s, i) => {
    if (t >= s.mulai - 0.05) idx = i;
  });
  const s = idx >= 0 ? kalimat[idx] : null;
  const masuk = s ? spring({frame: frame - Math.round(s.mulai * fps), fps, config: {damping: 200}}) : 0;

  return (
    <AbsoluteFill style={{backgroundColor: BG, fontFamily: 'Helvetica, Arial, sans-serif'}}>
      {audio ? <Audio src={staticFile(audio)} /> : null}

      <div style={{position: 'absolute', top: 120, left: 90, right: 90, fontSize: 38, fontWeight: 700, letterSpacing: 2, color: ACCENT, textTransform: 'uppercase'}}>
        {judul}
      </div>

      <AbsoluteFill style={{justifyContent: 'center', padding: '0 90px'}}>
        {s ? (
          <div
            style={{
              fontSize: 96,
              lineHeight: 1.18,
              fontWeight: 800,
              color: INK,
              opacity: interpolate(masuk, [0, 1], [0, 1]),
              transform: `translateY(${interpolate(masuk, [0, 1], [40, 0])}px)`,
            }}
          >
            {s.kata.map((w, i) => {
              const nyala = t >= w.mulai;
              return (
                <span key={i} style={{color: nyala ? ACCENT : INK, opacity: nyala ? 1 : 0.28}}>
                  {w.k}{' '}
                </span>
              );
            })}
          </div>
        ) : null}
      </AbsoluteFill>

      <div style={{position: 'absolute', left: 0, bottom: 0, height: 14, width: `${(frame / durationInFrames) * 100}%`, backgroundColor: ACCENT}} />
    </AbsoluteFill>
  );
};

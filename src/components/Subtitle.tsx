import React from 'react';
import {useCurrentFrame, useVideoConfig} from 'remotion';
import {C} from '../theme';
import {Word} from '../data/script';

// Subtitle karaoke: kata yang sedang diucapkan diberi kotak hijau.
export const Subtitle: React.FC<{words: Word[]; windowSize?: number}> = ({
  words,
  windowSize = 4,
}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const t = frame / fps;

  let active = words.findIndex((w) => t >= w.from && t < w.to);
  if (active === -1) {
    active = words.reduce((a, w, i) => (w.to <= t ? i : a), -1);
    if (active === -1 || t - words[active].to > 0.6) return null;
  }
  const start = Math.floor(active / windowSize) * windowSize;
  const visible = words.slice(start, start + windowSize);

  return (
    <div
      style={{
        position: 'absolute',
        left: 0,
        right: 0,
        bottom: 300,
        display: 'flex',
        justifyContent: 'center',
        gap: 12,
        fontFamily: 'Arial, Helvetica, sans-serif',
        fontWeight: 800,
        fontSize: 56,
        color: '#fff',
        textShadow: '0 3px 6px rgba(0,0,0,.6)',
      }}
    >
      {visible.map((w, i) => (
        <span
          key={start + i}
          style={{
            padding: '2px 10px',
            borderRadius: 8,
            background: start + i === active ? C.subtitleHi : 'transparent',
          }}
        >
          {w.text}
        </span>
      ))}
    </div>
  );
};

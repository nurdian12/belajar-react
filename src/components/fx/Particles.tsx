import React from 'react';
import {random, useCurrentFrame} from 'remotion';
import {HEIGHT, WIDTH} from '../../theme';

// Debu/bokeh emas melayang pelan (loop ambient).
export const Particles: React.FC<{count?: number}> = ({count = 24}) => {
  const frame = useCurrentFrame();
  return (
    <>
      {Array.from({length: count}).map((_, i) => {
        const x = random(`x${i}`) * WIDTH;
        const speed = 0.3 + random(`s${i}`) * 0.6;
        const y = (random(`y${i}`) * HEIGHT + frame * speed) % HEIGHT;
        const size = 3 + random(`z${i}`) * 5;
        return (
          <div
            key={i}
            style={{
              position: 'absolute',
              left: x + Math.sin(frame / 40 + i) * 12,
              top: y,
              width: size,
              height: size,
              borderRadius: '50%',
              background: 'rgba(255,230,160,.55)',
            }}
          />
        );
      })}
    </>
  );
};

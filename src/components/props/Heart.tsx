import React from 'react';
import {spring, useCurrentFrame, useVideoConfig} from 'remotion';

// Hati pop-in (overshoot) lalu melayang naik-turun.
export const Heart: React.FC<{x: number; y: number; size?: number; delay?: number}> = ({
  x,
  y,
  size = 90,
  delay = 0,
}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const s = spring({frame: frame - delay, fps, config: {damping: 8, stiffness: 160}});
  const bob = Math.sin((frame - delay) / 10) * 8;
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      style={{position: 'absolute', left: x, top: y + bob, transform: `scale(${s})`}}
    >
      <path
        d="M16 28 C2 17 3 6 10 5 C13 5 15 7 16 9 C17 7 19 5 22 5 C29 6 30 17 16 28Z"
        fill="#e8333f"
        stroke="#1a1a1a"
        strokeWidth="1.5"
      />
    </svg>
  );
};

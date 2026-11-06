import React from 'react';
import {useCurrentFrame} from 'remotion';
import {C, STROKE} from '../../theme';

type P = {x: number; y: number};

// Ular: rantai segmen follow-the-leader. `path` = jalur kepala→ekor (titik kontrol),
// tiap segmen bergelombang sinus dengan delay sehingga terlihat menjalar.
export const Snake: React.FC<{
  anchor: P;
  length?: number;
  thickness?: number;
  wave?: number;
  segments?: number;
  head?: P;
}> = ({anchor, length = 700, thickness = 46, wave = 28, segments = 40, head}) => {
  const frame = useCurrentFrame();
  const pts: P[] = Array.from({length: segments}, (_, i) => {
    const t = i / (segments - 1);
    const phase = frame / 8 - i * 0.45;
    return {
      x: anchor.x - t * length,
      y: anchor.y + Math.sin(phase) * wave * (0.3 + t),
    };
  });
  const h = head ?? pts[0];
  pts[0] = h;
  const d = pts.map((p, i) => `${i ? 'L' : 'M'}${p.x} ${p.y}`).join(' ');

  return (
    <g strokeLinecap="round" strokeLinejoin="round" fill="none">
      <path d={d} stroke={C.outline} strokeWidth={thickness + STROKE * 2} />
      <path d={d} stroke={C.snake} strokeWidth={thickness} />
      <path d={d} stroke={C.snakePattern} strokeWidth={thickness - 14} strokeDasharray="14 26" />
      {/* kepala */}
      <ellipse cx={h.x} cy={h.y} rx={thickness * 0.9} ry={thickness * 0.75} fill={C.snake} stroke={C.outline} strokeWidth={STROKE} />
      <circle cx={h.x - 12} cy={h.y - 6} r={5} fill={C.outline} />
      <circle cx={h.x + 14} cy={h.y - 6} r={5} fill={C.outline} />
      <path d={`M${h.x - 14} ${h.y + 12} q14 10 28 0`} stroke={C.outline} strokeWidth={4} />
    </g>
  );
};

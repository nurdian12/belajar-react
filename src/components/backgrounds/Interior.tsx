import React from 'react';
import {C, HEIGHT, WIDTH} from '../../theme';

// Ruang dalam: dinding papan kayu + jendela + lantai karpet.
export const Interior: React.FC<{night?: boolean}> = ({night = false}) => (
  <svg width={WIDTH} height={HEIGHT} style={{position: 'absolute', inset: 0}}>
    <rect width={WIDTH} height={HEIGHT} fill={C.woodLight} />
    {Array.from({length: 12}).map((_, i) => (
      <line key={i} x1={i * 100} y1={0} x2={i * 100} y2={1500} stroke={C.woodDark} strokeWidth={3} opacity={0.5} />
    ))}
    <rect x={380} y={380} width={320} height={380} fill={night ? '#243a5a' : '#bfe6f5'} stroke={C.outline} strokeWidth={8} />
    <line x1={540} y1={380} x2={540} y2={760} stroke={C.outline} strokeWidth={6} />
    <line x1={380} y1={570} x2={700} y2={570} stroke={C.outline} strokeWidth={6} />
    <rect x={300} y={380} width={80} height={380} fill="#8fcaa0" stroke={C.outline} strokeWidth={6} />
    <rect x={700} y={380} width={80} height={380} fill="#8fcaa0" stroke={C.outline} strokeWidth={6} />
    <rect y={1500} width={WIDTH} height={HEIGHT - 1500} fill={C.woodDark} />
    <rect x={160} y={1300} width={760} height={260} fill="#f4e6b0" stroke={C.outline} strokeWidth={5} />
  </svg>
);

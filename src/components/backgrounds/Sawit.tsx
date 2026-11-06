import React from 'react';
import {C, HEIGHT, WIDTH} from '../../theme';

const Palm: React.FC<{x: number; h: number}> = ({x, h}) => (
  <g stroke={C.outline} strokeWidth={5} strokeLinecap="round">
    <line x1={x} y1={1400} x2={x} y2={1400 - h} />
    {[-70, -35, 0, 35, 70].map((a) => (
      <path key={a} d={`M${x} ${1400 - h} q${a} -60 ${a * 2} ${a < 0 ? 40 : 40}`} fill="none" stroke="#3f7d3a" strokeWidth={10} />
    ))}
  </g>
);

export const Sawit: React.FC = () => (
  <svg width={WIDTH} height={HEIGHT} style={{position: 'absolute', inset: 0}}>
    <defs>
      <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#e9f5d8" />
        <stop offset="1" stopColor="#a8d98a" />
      </linearGradient>
    </defs>
    <rect width={WIDTH} height={HEIGHT} fill="url(#sky)" />
    <rect y={1400} width={WIDTH} height={HEIGHT - 1400} fill={C.grass} />
    <Palm x={120} h={620} />
    <Palm x={940} h={700} />
    <Palm x={260} h={480} />
    <g transform="translate(640 1300)">
      <rect width={300} height={70} fill="#f1e4c0" stroke={C.outline} strokeWidth={5} />
      <text x={150} y={45} textAnchor="middle" fontSize={26} fontWeight={700} fontFamily="Arial">KEBUN SAWIT IAN</text>
    </g>
  </svg>
);

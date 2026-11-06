import React from 'react';
import {useCurrentFrame} from 'remotion';
import {C, STROKE} from '../../theme';

export type IanMood = 'happy' | 'neutral' | 'panic' | 'angry';

// Pak Ian: kapsul marun, kepala bulat putih, peci hitam. Titik jangkar = telapak kaki (0,0).
export const Ian: React.FC<{x: number; y: number; scale?: number; mood?: IanMood}> = ({
  x,
  y,
  scale = 1,
  mood = 'happy',
}) => {
  const frame = useCurrentFrame();
  const breathe = Math.sin(frame / 12) * 3;
  const blink = frame % 90 > 85;
  const eyes = mood === 'happy' || blink;
  const brow = mood === 'angry' ? -6 : mood === 'panic' ? 6 : 0;

  return (
    <g transform={`translate(${x} ${y}) scale(${scale})`} stroke={C.outline} strokeWidth={STROKE} strokeLinecap="round">
      {/* kaki */}
      <line x1={-18} y1={-170} x2={-22} y2={0} fill="none" />
      <line x1={18} y1={-170} x2={22} y2={0} fill="none" />
      {/* badan */}
      <rect x={-45} y={-400 + breathe} width={90} height={240} rx={40} fill={C.ianShirt} />
      {/* tangan */}
      <path d="M-45 -360 Q-85 -300 -55 -250" fill="none" />
      <path d="M45 -360 Q85 -300 55 -250" fill="none" />
      {/* kepala */}
      <circle cx={0} cy={-470 + breathe} r={62} fill={C.skin} />
      {/* peci */}
      <rect x={-52} y={-565 + breathe} width={104} height={50} rx={8} fill={C.peci} />
      {/* mata */}
      {eyes ? (
        <>
          <path d={`M-30 ${-475 + breathe} q10 -12 20 0`} fill="none" strokeWidth={4} />
          <path d={`M10 ${-475 + breathe} q10 -12 20 0`} fill="none" strokeWidth={4} />
        </>
      ) : (
        <>
          <circle cx={-20} cy={-475 + breathe} r={5} fill={C.outline} />
          <circle cx={20} cy={-475 + breathe} r={5} fill={C.outline} />
        </>
      )}
      <line x1={-34} y1={-492 + brow + breathe} x2={-8} y2={-492 + breathe} strokeWidth={4} />
      <line x1={8} y1={-492 + breathe} x2={34} y2={-492 + brow + breathe} strokeWidth={4} />
      {/* mulut */}
      <ellipse cx={0} cy={-440 + breathe} rx={16} ry={mood === 'happy' ? 7 : 4} fill={C.outline} />
    </g>
  );
};

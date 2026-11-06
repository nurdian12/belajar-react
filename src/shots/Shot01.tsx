import React from 'react';
import {AbsoluteFill} from 'remotion';
import {Sawit} from '../components/backgrounds/Sawit';
import {Ian} from '../components/characters/Ian';
import {Camera} from '../components/fx/Camera';
import {HEIGHT, WIDTH} from '../theme';

export const Shot01: React.FC<{duration: number}> = ({duration}) => (
  <AbsoluteFill>
    <Camera duration={duration} from={{scale: 1}} to={{scale: 1.08}}>
      <Sawit />
      <svg width={WIDTH} height={HEIGHT} style={{position: 'absolute', inset: 0}}>
        <Ian x={420} y={1400} scale={1.2} mood="neutral" />
      </svg>
    </Camera>
  </AbsoluteFill>
);

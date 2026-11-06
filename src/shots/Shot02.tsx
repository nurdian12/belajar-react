import React from 'react';
import {AbsoluteFill} from 'remotion';
import {Interior} from '../components/backgrounds/Interior';
import {Ian} from '../components/characters/Ian';
import {Snake} from '../components/characters/Snake';
import {Heart} from '../components/props/Heart';
import {Camera} from '../components/fx/Camera';
import {HEIGHT, WIDTH} from '../theme';

// Shot 02–03 digabung sementara: Pak Ian duduk, ular menjalar, hati pop.
export const Shot02: React.FC<{duration: number}> = ({duration}) => (
  <AbsoluteFill>
    <Camera duration={duration} from={{scale: 1}} to={{scale: 1.12, y: 20}}>
      <Interior />
      <svg width={WIDTH} height={HEIGHT} style={{position: 'absolute', inset: 0}}>
        <Ian x={540} y={1420} scale={1.1} mood="happy" />
        <Snake anchor={{x: 700, y: 1480}} length={620} head={{x: 640, y: 1330}} />
      </svg>
      <Heart x={260} y={330} delay={45} />
    </Camera>
  </AbsoluteFill>
);

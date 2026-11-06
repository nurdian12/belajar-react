import React from 'react';
import {Composition} from 'remotion';
import {PelukanVideo} from './Video';
import {FPS, HEIGHT, WIDTH} from './theme';
import {TOTAL_FRAMES} from './data/timeline';

export const RemotionRoot: React.FC = () => (
  <Composition
    id="PelukanVideo"
    component={PelukanVideo}
    durationInFrames={TOTAL_FRAMES}
    fps={FPS}
    width={WIDTH}
    height={HEIGHT}
    defaultProps={{withAudio: false}}
  />
);

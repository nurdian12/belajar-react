import React from 'react';
import {Composition} from 'remotion';
import {PelukanVideo} from './Video';
import {FPS, HEIGHT, WIDTH} from './theme';
import {TOTAL_FRAMES} from './data/timeline';
import {KANTOR_DEFAULT, KantorProps, KantorVideo} from './kantor/KantorVideo';

export const RemotionRoot: React.FC = () => (
  <>
    <Composition
      id="PelukanVideo"
      component={PelukanVideo}
      durationInFrames={TOTAL_FRAMES}
      fps={FPS}
      width={WIDTH}
      height={HEIGHT}
      defaultProps={{withAudio: false}}
    />
    <Composition
      id="KantorVideo"
      component={KantorVideo}
      durationInFrames={Math.ceil((KANTOR_DEFAULT.durasi + 1) * 30)}
      fps={30}
      width={1080}
      height={1920}
      defaultProps={KANTOR_DEFAULT}
      calculateMetadata={({props}: {props: KantorProps}) => ({
        durationInFrames: Math.max(30, Math.ceil((props.durasi + 1) * 30)),
      })}
    />
  </>
);

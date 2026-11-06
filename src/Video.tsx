import React from 'react';
import {AbsoluteFill, Sequence, Audio, staticFile} from 'remotion';
import {SHOTS} from './data/timeline';
import {WORDS} from './data/script';
import {Subtitle} from './components/Subtitle';
import {Particles} from './components/fx/Particles';
import {Shot01} from './shots/Shot01';
import {Shot02} from './shots/Shot02';
import {HEIGHT, WIDTH} from './theme';

type ShotC = React.FC<{duration: number}>;

// Shot yang sudah dibuat; sisanya tampil placeholder sampai M4–M6.
const IMPLEMENTED: Record<string, ShotC> = {'01': Shot01, '02': Shot02};

const Placeholder: React.FC<{id: string; title: string}> = ({id, title}) => (
  <AbsoluteFill style={{background: '#444', color: '#fff', justifyContent: 'center', alignItems: 'center', fontFamily: 'Arial', textAlign: 'center'}}>
    <div style={{fontSize: 140, fontWeight: 800}}>#{id}</div>
    <div style={{fontSize: 48, padding: 60}}>{title}</div>
  </AbsoluteFill>
);

export const PelukanVideo: React.FC<{withAudio?: boolean}> = ({withAudio = false}) => (
  <AbsoluteFill style={{width: WIDTH, height: HEIGHT, background: '#000'}}>
    {SHOTS.map((s) => {
      const dur = s.end - s.start;
      const Comp = IMPLEMENTED[s.id];
      return (
        <Sequence key={s.id} from={s.start} durationInFrames={dur} name={`Shot ${s.id}`}>
          {Comp ? <Comp duration={dur} /> : <Placeholder id={s.id} title={s.title} />}
        </Sequence>
      );
    })}
    <Particles />
    <Subtitle words={WORDS} />
    {withAudio ? <Audio src={staticFile('audio/vo.mp3')} /> : null}
  </AbsoluteFill>
);

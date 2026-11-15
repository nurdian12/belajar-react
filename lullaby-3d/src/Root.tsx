import {Composition} from 'remotion';
import {Lullaby, DURATION} from './Lullaby';
export const Root = () => (
  <Composition id="Lullaby" component={Lullaby} durationInFrames={DURATION} fps={30} width={1280} height={720} />
);

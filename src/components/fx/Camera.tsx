import React from 'react';
import {interpolate, useCurrentFrame, Easing} from 'remotion';

// Kamera digital: zoom + pan dari nilai awal ke akhir sepanjang shot.
export const Camera: React.FC<{
  duration: number;
  from?: {scale?: number; x?: number; y?: number};
  to?: {scale?: number; x?: number; y?: number};
  shake?: number;
  children: React.ReactNode;
}> = ({duration, from = {}, to = {}, shake = 0, children}) => {
  const frame = useCurrentFrame();
  const p = (a = 0, b = 0) =>
    interpolate(frame, [0, duration], [a, b], {
      easing: Easing.inOut(Easing.cubic),
      extrapolateRight: 'clamp',
    });
  const scale = p(from.scale ?? 1, to.scale ?? from.scale ?? 1);
  const x = p(from.x, to.x ?? from.x) + Math.sin(frame * 3.1) * shake;
  const y = p(from.y, to.y ?? from.y) + Math.cos(frame * 2.7) * shake;
  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        transform: `translate(${x}px, ${y}px) scale(${scale})`,
        transformOrigin: '50% 50%',
      }}
    >
      {children}
    </div>
  );
};

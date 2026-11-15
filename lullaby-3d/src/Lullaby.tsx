import React from 'react';
import {AbsoluteFill, Audio, interpolate, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import {ThreeCanvas} from '@remotion/three';
import {useThree} from '@react-three/fiber';
import * as THREE from 'three';

const FPS = 30;
export const DURATION = 32 * FPS;

const clamp = (x: number, a = 0, b = 1) => Math.min(b, Math.max(a, x));
const ss = (a: number, b: number, t: number) => {
  const x = clamp((t - a) / (b - a));
  return x * x * (3 - 2 * x);
};
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const mixCol = (a: string, b: string, t: number) => new THREE.Color(a).lerp(new THREE.Color(b), t);

const Ball: React.FC<{p?: [number, number, number]; s?: [number, number, number] | number; c: string; r?: number}> = ({p = [0, 0, 0], s = 1, c, r = 1}) => (
  <mesh position={p} scale={s as any}>
    <sphereGeometry args={[r, 32, 24]} />
    <meshStandardMaterial color={c} roughness={0.7} />
  </mesh>
);

const Eye: React.FC<{p: [number, number, number]; open: number; r?: number}> = ({p, open, r = 0.07}) => (
  <group position={p} scale={[1, Math.max(0.08, open), 1]}>
    <Ball c="#1b1220" r={r} />
    <Ball p={[r * 0.3, r * 0.35, r * 0.7]} c="#ffffff" r={r * 0.3} />
  </group>
);

const Cheek: React.FC<{p: [number, number, number]}> = ({p}) => <Ball p={p} s={[1, 0.65, 0.4]} c="#ff9a9a" r={0.1} />;

// ---------- characters ----------
const Girl: React.FC<{t: number; night: number}> = ({t, night}) => {
  const covering = 1 - ss(5.6, 6.6, t); // hands over eyes
  const eyesOpen = (1 - covering) * (1 - ss(24, 25.5, t));
  const bounce = ss(7, 8, t) * (1 - ss(15, 16, t)) * Math.abs(Math.sin((t - 7) * 5)) * 0.18;
  const look = ss(17, 21, t) * 0.5 - ss(24, 26, t) * 0.2;
  const sleepTilt = ss(25, 28, t) * 0.25;
  const hand = (side: number) => {
    const x = lerp(side * 0.45, side * 0.16, covering);
    const y = lerp(0.9, 1.5, covering);
    const z = lerp(0.1, 0.5, covering);
    return [x, y, z] as [number, number, number];
  };
  return (
    <group position={[0, 0.0 + bounce, 1.4]} rotation={[0, look, sleepTilt]}>
      {/* dress */}
      <mesh position={[0, 0.45, 0]}>
        <coneGeometry args={[0.75, 0.95, 32]} />
        <meshStandardMaterial color="#e5553f" roughness={0.8} />
      </mesh>
      <mesh position={[0, 0.82, 0]}>
        <cylinderGeometry args={[0.38, 0.62, 0.3, 32]} />
        <meshStandardMaterial color="#e5553f" roughness={0.8} />
      </mesh>
      {/* legs */}
      <Ball p={[-0.25, 0.08, 0.35]} s={[1, 0.8, 1.4]} c="#f2b894" r={0.16} />
      <Ball p={[0.25, 0.08, 0.35]} s={[1, 0.8, 1.4]} c="#f2b894" r={0.16} />
      {/* head */}
      <Ball p={[0, 1.55, 0]} c="#f5c3a0" r={0.68} />
      {/* hair */}
      <Ball p={[0, 1.78, -0.12]} s={[1, 0.8, 0.95]} c="#8a4a2a" r={0.7} />
      {[-1, 1].map((s) => (
        <group key={s}>
          {[0, 1, 2, 3].map((i) => (
            <Ball key={i} p={[s * (0.68 + i * 0.05), 1.3 - i * 0.28, -0.1]} s={[0.8, 1.2, 0.8]} c="#8a4a2a" r={0.17} />
          ))}
        </group>
      ))}
      <Eye p={[-0.24, 1.55, 0.6]} open={eyesOpen} r={0.085} />
      <Eye p={[0.24, 1.55, 0.6]} open={eyesOpen} r={0.085} />
      <Ball p={[0, 1.43, 0.67]} c="#ee9a86" r={0.06} />
      <Cheek p={[-0.42, 1.38, 0.52]} />
      <Cheek p={[0.42, 1.38, 0.52]} />
      {/* smile */}
      <mesh position={[0, 1.3, 0.64]} rotation={[0, 0, Math.PI]}>
        <torusGeometry args={[0.1, 0.018, 8, 20, Math.PI]} />
        <meshStandardMaterial color="#b4504a" />
      </mesh>
      {/* hands */}
      <Ball p={hand(-1)} c="#f5c3a0" r={0.2} />
      <Ball p={hand(1)} c="#f5c3a0" r={0.2} />
    </group>
  );
};

const Elephant: React.FC<{t: number; night: number}> = ({t, night}) => {
  const reveal = ss(6, 8, t);
  const hop = ss(8, 9, t) * (1 - ss(15, 16, t)) * Math.abs(Math.sin((t - 8.4) * 5)) * 0.25;
  const sleep = ss(24, 26.5, t);
  const breathe = 1 + Math.sin(t * 2) * 0.03 * sleep;
  const x = lerp(3.8, 2.3, reveal);
  const z = lerp(-1.3, 0.1, reveal);
  const eyeOpen = 1 - sleep;
  const earFlap = Math.sin(t * 4) * 0.12 * (1 - sleep);
  const g = '#9ca3b8';
  return (
    <group position={[x, hop, z]} rotation={[0, -0.5 + ss(8, 9.5, t) * 0.3, 0]} scale={[breathe, breathe * (1 - sleep * 0.08), breathe]}>
      <Ball p={[0, 0.9, 0]} s={[1.1, 0.95, 1.2]} c={g} r={0.9} />
      <Ball p={[0, 1.7, 0.55]} c={g} r={0.62} />
      {[-1, 1].map((s) => (
        <group key={s}>
          <mesh position={[s * 0.62, 1.8, 0.4]} rotation={[0, s * (0.5 + earFlap), 0]} scale={[1, 1, 0.22]}>
            <sphereGeometry args={[0.62, 32, 24]} />
            <meshStandardMaterial color="#b6bccf" roughness={0.8} />
          </mesh>
          <Ball p={[s * 0.5, 0.15, 0.55]} s={[1, 1, 1.1]} c={g} r={0.28} />
          <Ball p={[s * 0.5, 0.15, -0.55]} s={[1, 1, 1.1]} c={g} r={0.28} />
          <Eye p={[s * 0.24, 1.82, 1.1]} open={eyeOpen} r={0.07} />
          <Cheek p={[s * 0.4, 1.62, 1.0]} />
        </group>
      ))}
      {/* trunk */}
      {[0, 1, 2, 3].map((i) => (
        <Ball key={i} p={[0, 1.5 - i * 0.2, 1.1 + i * 0.13 + (i === 3 ? 0.08 : 0)]} c={g} r={0.2 - i * 0.015} />
      ))}
      <Ball p={[0, 0.9, -1.1]} c={g} r={0.1} />
    </group>
  );
};

const Lion: React.FC<{t: number; night: number}> = ({t, night}) => {
  const reveal = ss(6.5, 8.5, t);
  const hop = ss(8, 9, t) * (1 - ss(15, 16, t)) * Math.abs(Math.sin((t - 8) * 5)) * 0.25;
  const sleep = ss(24, 26.5, t);
  const breathe = 1 + Math.sin(t * 2.2) * 0.03 * sleep;
  const x = lerp(-3.4, -2.2, reveal);
  const z = lerp(-1.0, 0.5, reveal);
  const fur = '#e8b35a';
  return (
    <group position={[x, hop, z]} rotation={[0, 0.5, 0]} scale={[breathe, breathe, breathe]}>
      <Ball p={[0, 0.55, -0.1]} s={[1, 0.9, 1.2]} c={fur} r={0.65} />
      {/* mane */}
      {Array.from({length: 14}).map((_, i) => {
        const a = (i / 14) * Math.PI * 2;
        return <Ball key={i} p={[Math.cos(a) * 0.62, 1.38 + Math.sin(a) * 0.62, 0.35]} c="#c9822f" r={0.26} />;
      })}
      <Ball p={[0, 1.38, 0.38]} c="#c9822f" r={0.55} />
      <Ball p={[0, 1.38, 0.55]} c={fur} r={0.5} />
      {[-1, 1].map((s) => (
        <group key={s}>
          <Ball p={[s * 0.36, 1.82, 0.5]} c={fur} r={0.14} />
          <Eye p={[s * 0.2, 1.45, 1.0]} open={1 - sleep} r={0.065} />
          <Cheek p={[s * 0.34, 1.28, 0.95]} />
          <Ball p={[s * 0.32, 0.1, 0.4]} s={[1, 0.8, 1.2]} c={fur} r={0.2} />
        </group>
      ))}
      <Ball p={[0, 1.32, 1.02]} s={[1.2, 0.8, 0.8]} c="#7a3b2a" r={0.08} />
      <Ball p={[0, 1.2, 0.95]} s={[1.6, 0.9, 0.9]} c="#f6d89a" r={0.14} />
      {/* tail */}
      <Ball p={[0, 0.5, -0.95 - Math.sin(t * 3) * 0.05]} c={fur} r={0.1} />
      <Ball p={[0, 0.7, -1.15]} c="#c9822f" r={0.15} />
    </group>
  );
};

const Crab: React.FC<{t: number}> = ({t}) => {
  const x = 1.0 + Math.sin(t * 0.8) * 0.9;
  const claw = Math.sin(t * 6) * 0.15;
  return (
    <group position={[x, 0.12, 2.8]}>
      <Ball s={[1.3, 0.7, 1]} c="#e84a2f" r={0.17} />
      <Ball p={[-0.25, 0.1 + claw, 0.12]} c="#e84a2f" r={0.09} />
      <Ball p={[0.25, 0.1 - claw, 0.12]} c="#e84a2f" r={0.09} />
      <Ball p={[-0.05, 0.17, 0.1]} c="#fff" r={0.04} />
      <Ball p={[0.05, 0.17, 0.1]} c="#fff" r={0.04} />
    </group>
  );
};

const Palm: React.FC<{p: [number, number, number]; lean: number; t: number}> = ({p, lean, t}) => (
  <group position={p} rotation={[0, 0, lean]}>
    <mesh position={[0, 2.2, 0]}>
      <cylinderGeometry args={[0.22, 0.34, 4.4, 12]} />
      <meshStandardMaterial color="#8a6a45" roughness={0.9} />
    </mesh>
    <group position={[0, 4.4, 0]}>
      {Array.from({length: 7}).map((_, i) => (
        <group key={i} rotation={[0, (i / 7) * Math.PI * 2, 0]}>
          <mesh position={[1.1, -0.15 + Math.sin(t * 1.5 + i) * 0.05, 0]} rotation={[0, 0, -0.5]} scale={[1, 0.08, 0.35]}>
            <sphereGeometry args={[1.5, 16, 8]} />
            <meshStandardMaterial color="#2f9a4f" roughness={0.8} side={THREE.DoubleSide} />
          </mesh>
        </group>
      ))}
    </group>
  </group>
);

const Stars: React.FC<{opacity: number}> = ({opacity}) => {
  const geo = React.useMemo(() => {
    const pts: number[] = [];
    let seed = 7;
    const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
    for (let i = 0; i < 260; i++) {
      const a = rnd() * Math.PI * 2;
      const h = 0.15 + rnd() * 0.75;
      pts.push(Math.cos(a) * 60, 6 + h * 40, -20 - Math.abs(Math.sin(a)) * 30);
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(pts, 3));
    return g;
  }, []);
  return (
    <points geometry={geo}>
      <pointsMaterial color="#ffffff" size={0.25} transparent opacity={opacity} sizeAttenuation />
    </points>
  );
};

const Rig: React.FC<{t: number}> = ({t}) => {
  const {camera} = useThree();
  // slow cinematic moves
  const push = ss(0, 6, t); // close on girl's face
  const wide = ss(6, 10, t);
  const dusk = ss(16, 24, t);
  const end = ss(26, 32, t);
  const x = lerp(0, 0.6, push) * (1 - wide) + Math.sin(t * 0.2) * 0.6 * wide + dusk * 1.0;
  const y = lerp(2.0, 2.6, wide) + dusk * 0.2 + end * 1.8;
  const z = lerp(4.0, 8.5, wide) - dusk * 1.5 + end * 2;
  camera.position.set(x, y, z);
  camera.lookAt(0 + dusk * 0.3, lerp(1.5, 1.2, wide) + end * 2.2, 0.6);
  (camera as THREE.PerspectiveCamera).fov = lerp(38, 42, wide);
  (camera as THREE.PerspectiveCamera).updateProjectionMatrix();
  return null;
};

const Scene: React.FC = () => {
  const frame = useCurrentFrame();
  const t = frame / FPS;
  const dusk = ss(12, 20, t);
  const night = ss(19, 25, t);

  const sky = mixCol('#7fd0f2', '#f2a07a', dusk).lerp(new THREE.Color('#16255c'), night);
  const sunDir = mixCol('#fff1cf', '#ff9b6a', dusk).lerp(new THREE.Color('#6f8cff'), night);
  const sand = mixCol('#f3e2b8', '#e6b894', dusk).lerp(new THREE.Color('#6a76a8'), night);
  const sea = mixCol('#3fc7d8', '#6a7cb8', dusk).lerp(new THREE.Color('#1f4590'), night);

  const moonY = lerp(-2, 9, night);
  const moonGlow = night;

  return (
    <>
      <color attach="background" args={[sky]} />
      <fog attach="fog" args={[sky, 25, 80]} />
      <Rig t={t} />
      <ambientLight intensity={lerp(0.9, 1.1, night)} color={mixCol('#ffffff', '#a9baff', night)} />
      <directionalLight position={[lerp(6, -6, dusk), lerp(10, 3, dusk), 6]} intensity={lerp(2.0, 1.2, night)} color={sunDir} />
      <pointLight position={[-8, moonY, -10]} intensity={night * 60} color="#aab8ff" />
      <hemisphereLight args={[sky, sand, 0.4]} />

      {/* ground */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]}>
        <planeGeometry args={[60, 30]} />
        <meshStandardMaterial color={sand} roughness={1} />
      </mesh>
      {/* sea */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02 + Math.sin(t) * 0.01, -18]}>
        <planeGeometry args={[120, 30]} />
        <meshStandardMaterial color={sea} roughness={0.25} metalness={0.2} />
      </mesh>
      {/* wave foam line */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.03, -3.6 + Math.sin(t * 1.2) * 0.3]}>
        <planeGeometry args={[60, 0.3]} />
        <meshStandardMaterial color="#ffffff" transparent opacity={0.55} />
      </mesh>
      {/* sun / moon */}
      <mesh position={[lerp(8, 12, dusk), lerp(7, 1.2, dusk) - night * 10, -35]}>
        <sphereGeometry args={[2.4, 32, 24]} />
        <meshBasicMaterial color={mixCol('#fff6d0', '#ff8a4c', dusk)} />
      </mesh>
      <mesh position={[-9, moonY, -35]}>
        <sphereGeometry args={[2.6, 32, 24]} />
        <meshBasicMaterial color="#fff9e0" />
      </mesh>
      <mesh position={[-9, moonY, -35.5]}>
        <sphereGeometry args={[4.4, 32, 24]} />
        <meshBasicMaterial color="#aab8ff" transparent opacity={0.18 * moonGlow} />
      </mesh>
      {/* moon reflection on water */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[-9, 0.05, -14]}>
        <planeGeometry args={[2.2, 20]} />
        <meshBasicMaterial color="#e8ecff" transparent opacity={0.35 * moonGlow * (0.8 + 0.2 * Math.sin(t * 3))} />
      </mesh>
      <Stars opacity={night} />

      <Palm p={[5.2, 0, -1.5]} lean={-0.12} t={t} />
      <Palm p={[-6.5, 0, -3]} lean={0.1} t={t} />
      {/* rock */}
      <Ball p={[-3.6, 0.3, -1.4]} s={[1.4, 0.8, 1]} c={'#7a7f8c'} r={0.7} />

      <Girl t={t} night={night} />
      <Elephant t={t} night={night} />
      <Lion t={t} night={night} />
      <Crab t={t} />

      {/* blanket in the last scene */}
      <mesh position={[0, 0.15, 0.7]} scale={[1, ss(26, 28, t), 1]} visible={t > 26}>
        <boxGeometry args={[6.2, 0.12, 1.3]} />
        <meshStandardMaterial color="#ffffff" roughness={1} transparent opacity={0.0} />
      </mesh>

      {/* fireflies */}
      {Array.from({length: 18}).map((_, i) => {
        const a = i * 2.4 + t * 0.4;
        return (
          <mesh key={i} position={[Math.cos(a) * (2 + (i % 5)), 1 + (i % 4) * 0.6 + Math.sin(t * 2 + i) * 0.2, Math.sin(a * 1.3) * 2 + 1]}>
            <sphereGeometry args={[0.05, 8, 8]} />
            <meshBasicMaterial color="#fff2a0" transparent opacity={ss(18, 22, t) * (0.5 + 0.5 * Math.sin(t * 3 + i))} />
          </mesh>
        );
      })}
    </>
  );
};

const LINES: {from: number; to: number; text: string}[] = [
  {from: 1.5, to: 6, text: 'If one day you can’t find me…'},
  {from: 7, to: 12, text: 'just close your eyes and sing'},
  {from: 13, to: 18, text: 'you’ll find me.'},
  {from: 19, to: 24, text: 'Under the moon, I’m always near'},
  {from: 26, to: 31, text: 'Goodnight, little one 🌙'},
];

export const Lullaby: React.FC = () => {
  const frame = useCurrentFrame();
  const {width, height} = useVideoConfig();
  const t = frame / FPS;
  const fadeIn = interpolate(frame, [0, 20], [1, 0], {extrapolateRight: 'clamp'});
  const fadeOut = interpolate(frame, [DURATION - 45, DURATION], [0, 1], {extrapolateLeft: 'clamp'});
  return (
    <AbsoluteFill style={{backgroundColor: '#000'}}>
      <Audio src={staticFile('music.wav')} />
      <ThreeCanvas width={width} height={height} camera={{fov: 38, position: [0, 2, 4], near: 0.1, far: 200}} shadows={false}>
        <Scene />
      </ThreeCanvas>
      {LINES.map((l, i) => {
        const o = interpolate(t, [l.from, l.from + 0.6, l.to - 0.6, l.to], [0, 1, 1, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
        return (
          <div
            key={i}
            style={{
              position: 'absolute', bottom: 70, width: '100%', textAlign: 'center', opacity: o,
              transform: `translateY(${(1 - o) * 12}px)`,
              fontFamily: 'Georgia, serif', fontStyle: 'italic', fontSize: 46, color: '#fff',
              textShadow: '0 2px 12px rgba(0,0,0,.55)',
            }}
          >
            {l.text}
          </div>
        );
      })}
      <AbsoluteFill style={{backgroundColor: '#000', opacity: Math.max(fadeIn, fadeOut), pointerEvents: 'none'}} />
    </AbsoluteFill>
  );
};

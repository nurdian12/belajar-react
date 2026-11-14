import React from 'react';
import {AbsoluteFill, Audio, Easing, Img, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';

/** Video tur: tangkapan layar dashboard di dalam jendela, zoom ke bagian penting, lencana langkah, subtitle kata menyala. */

export type TurKata = {k: string; mulai: number; selesai: number};
export type TurAdegan = {
  mulai: number;
  selesai: number;
  teks: string;
  kata: TurKata[];
  /** path relatif ke public/, mis. "tur/kantor-idle.jpg" */
  gambar: string;
  /** rasio lebar/tinggi gambar */
  rasio: number;
  /** pusat zoom (0..1) dan zoom akhir */
  fokus: {x: number; y: number; zoom: number};
  lencana?: {nomor?: string; teks: string};
  /** bila ada, adegan ini kartu judul */
  judul?: {besar: string; kecil: string};
};
export type TurProps = {audio: string | null; durasi: number; adegan: TurAdegan[]};

export const TUR_DEFAULT: TurProps = {audio: null, durasi: 4, adegan: []};

const AKSEN = '#5eead4';
const MASUK = 0.35;
const KELUAR = 0.25;

const Jendela: React.FC<{a: TurAdegan; t: number; fps: number}> = ({a, t, fps}) => {
  const lama = Math.max(0.5, a.selesai - a.mulai);
  const p = interpolate(t, [a.mulai, a.mulai + lama], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.inOut(Easing.cubic)});
  const zoom = interpolate(p, [0, 1], [1, a.fokus.zoom]);
  const maksW = a.judul ? 1560 : 1500, maksH = 790;
  let w = maksW, h = w / a.rasio;
  if (h > maksH) { h = maksH; w = h * a.rasio; }
  // Satu jendela pada satu waktu: yang lama memudar habis tepat saat yang baru mulai muncul.
  const opacity = Math.min(
    a.mulai <= 0 ? 1 : interpolate(t, [a.mulai, a.mulai + MASUK], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'}),
    interpolate(t, [a.selesai - KELUAR, a.selesai], [1, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'}),
  );
  if (t < a.mulai || t >= a.selesai || opacity <= 0) return null;
  return (
    <AbsoluteFill style={{alignItems: 'center', justifyContent: 'center', opacity, paddingBottom: 150}}>
      <div style={{width: w, borderRadius: 22, overflow: 'hidden', boxShadow: '0 24px 48px rgba(0,0,0,.45)', background: '#fff', transform: `scale(${interpolate(opacity, [0, 1], [0.97, 1])})`}}>
        <div style={{height: 44, background: '#e9edef', display: 'flex', alignItems: 'center', gap: 10, padding: '0 18px'}}>
          {['#ff5f57', '#febc2e', '#28c840'].map((c) => <i key={c} style={{width: 14, height: 14, borderRadius: 7, background: c, display: 'block'}} />)}
          <div style={{marginLeft: 24, padding: '3px 22px', borderRadius: 14, background: '#fff', color: '#5b6b68', fontSize: 20, fontFamily: 'system-ui, sans-serif'}}>127.0.0.1:4321</div>
        </div>
        <div style={{width: w, height: h, overflow: 'hidden', position: 'relative', background: '#fff'}}>
          <Img src={staticFile(a.gambar)} style={{width: '100%', height: '100%', display: 'block', transformOrigin: `${a.fokus.x * 100}% ${a.fokus.y * 100}%`, transform: `scale(${zoom})`, filter: a.judul ? 'brightness(.55) saturate(.9)' : undefined}} />
          {a.judul ? (
            <AbsoluteFill style={{alignItems: 'center', justifyContent: 'center', textAlign: 'center', fontFamily: 'Helvetica, Arial, sans-serif', color: '#fff'}}>
              <div style={{fontSize: 150, fontWeight: 800, letterSpacing: -3, textShadow: '0 6px 30px rgba(0,0,0,.5)'}}>{a.judul.besar}</div>
              <div style={{marginTop: 18, padding: '10px 30px', borderRadius: 40, background: 'rgba(0,0,0,.45)', fontSize: 38, fontWeight: 600}}>{a.judul.kecil}</div>
            </AbsoluteFill>
          ) : null}
        </div>
      </div>
    </AbsoluteFill>
  );
};

export const TurKantor: React.FC<TurProps> = ({audio, adegan}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const t = frame / fps;

  let idx = -1;
  adegan.forEach((a, i) => { if (t >= a.mulai - 0.02) idx = i; });
  const a = idx >= 0 ? adegan[idx] : null;
  const masuk = a ? spring({frame: frame - Math.round(a.mulai * fps), fps, config: {damping: 18, stiffness: 120}}) : 0;

  return (
    <AbsoluteFill style={{background: 'linear-gradient(135deg, #0b1f1c 0%, #16313a 55%, #2a2150 100%)', fontFamily: 'Helvetica, Arial, sans-serif'}}>
      <AbsoluteFill style={{background: 'radial-gradient(circle at 25% 20%, rgba(94,234,212,.18), transparent 45%), radial-gradient(circle at 80% 80%, rgba(167,139,250,.16), transparent 50%)'}} />
      {audio ? <Audio src={staticFile(audio)} /> : null}
      {adegan.map((x, i) => <Jendela key={i} a={x} t={t} fps={fps} />)}

      {a?.lencana ? (
        <div style={{position: 'absolute', left: 150, bottom: 200, display: 'flex', alignItems: 'center', gap: 16, padding: '12px 26px 12px 14px', borderRadius: 22, background: 'rgba(12,24,28,.82)', color: '#fff', border: '1px solid rgba(255,255,255,.18)',
          opacity: interpolate(masuk, [0, 1], [0, 1]), transform: `translateY(${interpolate(masuk, [0, 1], [24, 0])}px)`}}>
          {a.lencana.nomor ? <div style={{width: 50, height: 50, borderRadius: 14, background: AKSEN, color: '#06211c', display: 'grid', placeItems: 'center', fontSize: 30, fontWeight: 800}}>{a.lencana.nomor}</div> : null}
          <div style={{fontSize: 40, fontWeight: 700}}>{a.lencana.teks}</div>
        </div>
      ) : null}

      {a ? (
        <div style={{position: 'absolute', left: 0, right: 0, bottom: 62, display: 'flex', justifyContent: 'center', padding: '0 120px'}}>
          <div style={{padding: '12px 34px', borderRadius: 18, background: 'rgba(8,16,18,.6)', fontSize: 46, fontWeight: 700, lineHeight: 1.25, textAlign: 'center', color: 'rgba(255,255,255,.88)', maxWidth: 1500}}>
            {a.kata.map((w, i) => (
              <span key={i} style={{color: t >= w.mulai ? AKSEN : undefined}}>{w.k}{' '}</span>
            ))}
          </div>
        </div>
      ) : null}
    </AbsoluteFill>
  );
};

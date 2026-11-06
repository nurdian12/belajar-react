import {FPS} from '../theme';

export type ShotDef = {id: string; start: number; end: number; title: string};

// Detik awal-akhir tiap shot (perkiraan dari referensi, sesuaikan dengan VO final)
const raw: [string, number, number, string][] = [
  ['01', 0, 4, 'Pak Ian di kebun sawit'],
  ['02', 4, 8, 'Duduk di kursi, ular menjalar'],
  ['03', 8, 12, 'Ular melilit kursi, hati melayang'],
  ['04', 12, 22, 'Sore di teras, pasangan lewat'],
  ['05', 22, 26, 'Kepala ular muncul, esoknya'],
  ['06', 26, 30, 'Kalender hari ke-3'],
  ['07', 30, 34, 'Pak Ian panik, ayam'],
  ['08', 34, 38, 'Telepon dokter'],
  ['09', 38, 46, 'Dokter bertanya'],
  ['10', 46, 52, 'Jawaban Pak Ian'],
  ['11', 52, 58, 'Debat: dilepas?'],
  ['12', 58, 64, 'Close-up ular'],
  ['13', 64, 70, 'X-ray 172cm / 45cm'],
  ['14', 70, 74, 'Pak Ian terdiam'],
  ['15', 74, 78, 'Thought bubble pelukan'],
  ['16', 78, 82, 'Jalan sore + rambu'],
  ['17', 82, 85, 'Teras malam, pembeli'],
  ['18', 85, 88, 'Uang disodorkan'],
];

export const SHOTS: ShotDef[] = raw.map(([id, s, e, title]) => ({
  id,
  start: Math.round(s * FPS),
  end: Math.round(e * FPS),
  title,
}));

export const TOTAL_FRAMES = SHOTS[SHOTS.length - 1].end;

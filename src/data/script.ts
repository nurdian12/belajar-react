// Narasi + timestamp per kata (detik). Ganti dengan hasil transkripsi VO final.
export type Word = {text: string; from: number; to: number};

export const WORDS: Word[] = [
  {text: 'Ular', from: 4.0, to: 4.4},
  {text: 'itu', from: 4.4, to: 4.7},
  {text: 'ia', from: 4.7, to: 4.9},
  {text: 'pelihara', from: 4.9, to: 5.5},
  {text: 'sendiri.', from: 5.5, to: 6.2},
];

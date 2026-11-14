// Membuat video tur: narasi (ElevenLabs bila ada kunci, kalau tidak senyap) + render Remotion.
// Pakai: npm run kantor:tur  ->  kantor/data/tur.mp4
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { join } from "node:path";
import { DATA, ROOT } from "../core/db.ts";
import { buatNarasi } from "../core/suara.ts";
import { render } from "../core/video.ts";
import { SKRIP } from "./skrip.ts";

const manifest = JSON.parse(readFileSync(join(ROOT, "..", "public", "tur", "manifest.json"), "utf8")) as Record<string, { w: number; h: number }>;

const teks = SKRIP.map((s) => s.teks).join(" ");
const narasi = await buatNarasi(9000, teks);
if (narasi.kalimat.length !== SKRIP.length)
  throw new Error(`Narasi terbaca ${narasi.kalimat.length} kalimat, papan cerita ${SKRIP.length}. Pastikan tiap langkah satu kalimat dan tanpa titik di tengah.`);

const akhir = narasi.durasi + 0.6;
const adegan = SKRIP.map((s, i) => {
  const k = narasi.kalimat[i];
  const m = manifest[s.gambar];
  if (!m) throw new Error(`Gambar "${s.gambar}" tidak ada di manifest. Jalankan rekam.cjs dulu.`);
  return {
    mulai: i === 0 ? 0 : Math.max(0, k.mulai - 0.2),
    selesai: i === SKRIP.length - 1 ? akhir : Math.max(0, narasi.kalimat[i + 1].mulai - 0.2),
    teks: k.teks, kata: k.kata, gambar: `tur/${s.gambar}.jpg`, rasio: m.w / m.h,
    fokus: s.fokus, lencana: s.lencana, judul: s.judul,
  };
});

mkdirSync(join(DATA), { recursive: true });
const propsFile = join(DATA, "props-tur.json");
writeFileSync(propsFile, JSON.stringify({ audio: narasi.audio, durasi: akhir, adegan }));
const out = join(DATA, "tur.mp4");
console.log(`Narasi: ${narasi.sumber}, ${narasi.durasi.toFixed(1)} dtk. Merender…`);
await render(propsFile, out, "TurKantor");
console.log(`Selesai: ${out}`);

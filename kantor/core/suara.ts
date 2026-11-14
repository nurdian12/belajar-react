import { writeFileSync, mkdirSync } from "node:fs";
import { join } from "node:path";
import { ROOT } from "./db.ts";

export type Kata = { k: string; mulai: number; selesai: number };
export type Kalimat = { teks: string; mulai: number; selesai: number; kata: Kata[] };
export type Narasi = { kalimat: Kalimat[]; durasi: number; audio: string | null; sumber: "elevenlabs" | "senyap" };

/** File audio ditaruh di public/kantor/ supaya bisa dibaca Remotion lewat staticFile(). */
export const PUBLIC_AUDIO = join(ROOT, "..", "public", "kantor");

const bagiKalimat = (teks: string) =>
  (teks.replace(/\s+/g, " ").trim().match(/[^.!?…]+[.!?…]*/g) ?? []).map((s) => s.trim()).filter(Boolean);

/** Bangun narasi: ElevenLabs bila ada API key, kalau tidak video dibuat senyap dengan perkiraan waktu. */
export async function buatNarasi(id: number, teks: string): Promise<Narasi> {
  mkdirSync(PUBLIC_AUDIO, { recursive: true });
  const key = process.env.ELEVENLABS_API_KEY;
  if (key && process.env.KANTOR_MOCK !== "1") return elevenlabs(id, teks, key);
  return senyap(id, teks);
}

// ---------- ElevenLabs (alignment per karakter -> waktu per kata) ----------
async function elevenlabs(id: number, teks: string, key: string): Promise<Narasi> {
  const voice = process.env.ELEVENLABS_VOICE_ID || "21m00Tcm4TlvDq8ikWAM";
  const model = process.env.ELEVENLABS_MODEL || "eleven_v3";
  const res = await fetch(
    `https://api.elevenlabs.io/v1/text-to-speech/${voice}/with-timestamps?output_format=mp3_44100_128`,
    {
      method: "POST",
      headers: { "xi-api-key": key, "content-type": "application/json" },
      body: JSON.stringify({ text: teks, model_id: model, language_code: "id" }),
    },
  );
  if (!res.ok) throw new Error(`ElevenLabs ${res.status}: ${(await res.text()).slice(0, 300)}`);
  const j = (await res.json()) as {
    audio_base64: string;
    alignment: { characters: string[]; character_start_times_seconds: number[]; character_end_times_seconds: number[] };
  };
  writeFileSync(join(PUBLIC_AUDIO, `${id}.mp3`), Buffer.from(j.audio_base64, "base64"));

  const { characters: c, character_start_times_seconds: st, character_end_times_seconds: en } = j.alignment;
  const kata: Kata[] = [];
  let buf = "", mulai = 0, selesai = 0;
  c.forEach((ch, i) => {
    if (/\s/.test(ch)) {
      if (buf) { kata.push({ k: buf, mulai, selesai }); buf = ""; }
    } else {
      if (!buf) mulai = st[i];
      buf += ch; selesai = en[i];
    }
  });
  if (buf) kata.push({ k: buf, mulai, selesai });
  return { kalimat: kelompokkan(kata), durasi: en[en.length - 1] ?? 0, audio: `kantor/${id}.mp3`, sumber: "elevenlabs" };
}

/** Kelompokkan kata ke kalimat berdasarkan tanda baca akhir. */
function kelompokkan(kata: Kata[]): Kalimat[] {
  const out: Kalimat[] = [];
  let cur: Kata[] = [];
  const tutup = () => {
    if (!cur.length) return;
    out.push({ teks: cur.map((w) => w.k).join(" "), mulai: cur[0].mulai, selesai: cur[cur.length - 1].selesai, kata: cur });
    cur = [];
  };
  for (const w of kata) { cur.push(w); if (/[.!?…]$/.test(w.k)) tutup(); }
  tutup();
  return out;
}

// ---------- Fallback: tanpa suara, waktu diperkirakan ----------
const DETIK_PER_KATA = 0.36;
const JEDA_KALIMAT = 0.3;

function senyap(id: number, teks: string): Narasi {
  let t = 0.3;
  const kalimat: Kalimat[] = bagiKalimat(teks).map((s) => {
    const mulai = t;
    const kata = s.split(" ").map((k) => {
      const w = { k, mulai: t, selesai: t + DETIK_PER_KATA * Math.max(1, k.length / 6) };
      t = w.selesai;
      return w;
    });
    const k: Kalimat = { teks: s, mulai, selesai: t, kata };
    t += JEDA_KALIMAT;
    return k;
  });
  const durasi = t + 0.3;
  writeFileSync(join(PUBLIC_AUDIO, `${id}.wav`), wavSenyap(durasi));
  return { kalimat, durasi, audio: `kantor/${id}.wav`, sumber: "senyap" };
}

function wavSenyap(detik: number): Buffer {
  const rate = 8000, n = Math.ceil(detik * rate), data = n * 2;
  const b = Buffer.alloc(44 + data);
  b.write("RIFF", 0); b.writeUInt32LE(36 + data, 4); b.write("WAVE", 8); b.write("fmt ", 12);
  b.writeUInt32LE(16, 16); b.writeUInt16LE(1, 20); b.writeUInt16LE(1, 22);
  b.writeUInt32LE(rate, 24); b.writeUInt32LE(rate * 2, 28); b.writeUInt16LE(2, 32); b.writeUInt16LE(16, 34);
  b.write("data", 36); b.writeUInt32LE(data, 40);
  return b;
}

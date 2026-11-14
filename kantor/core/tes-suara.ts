import { copyFileSync } from "node:fs";
import { join } from "node:path";
import { buatNarasi, PUBLIC_AUDIO } from "./suara.ts";

// Tes suara tanpa membuat video: npm run kantor:tes-suara -- "teks opsional"
const teks = process.argv.slice(2).join(" ").trim() || "Halo, ini tes suara dari Kantor. Kalau kamu mendengar ini, ElevenLabs sudah terhubung.";
console.log(`Kunci API: ${process.env.ELEVENLABS_API_KEY ? "ada" : "TIDAK ADA (akan senyap)"}`);
console.log(`Model: ${process.env.ELEVENLABS_MODEL || "eleven_v3"} · Voice: ${process.env.ELEVENLABS_VOICE_ID || "21m00Tcm4TlvDq8ikWAM (default)"}`);

try {
  const n = await buatNarasi(0, teks);
  const file = n.audio!.replace("kantor/", "");
  const hasil = join(process.cwd(), `tes-suara${file.slice(file.lastIndexOf("."))}`);
  copyFileSync(join(PUBLIC_AUDIO, file), hasil);
  console.log(`Sumber: ${n.sumber} · durasi ${n.durasi.toFixed(1)} dtk · tersimpan: ${hasil}`);
  for (const k of n.kalimat) console.log(`  [${k.mulai.toFixed(1)}–${k.selesai.toFixed(1)}] ${k.teks}`);
} catch (e) {
  console.error("GAGAL:", e instanceof Error ? e.message : e);
  process.exit(1);
}

import { spawn } from "node:child_process";
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { db, DATA, ROOT } from "./db.ts";
import { buatNarasi } from "./suara.ts";
import { mulaiTugas, akhiriTugas, catat } from "./aktivitas.ts";

const REPO = join(ROOT, "..");
export const VIDEO_DIR = join(DATA, "video");
const MAKS_PER_HARI = Number(process.env.KANTOR_MAKS_VIDEO_PER_HARI ?? 5);

const set = (id: number, kolom: string, ...v: unknown[]) =>
  db.prepare(`UPDATE video SET ${kolom} WHERE id=?`).run(...(v as any[]), id);

/** Mulai pembuatan video dari naskah yang sudah disetujui. Mengembalikan id video. */
export function buatVideo(naskahId: number): number {
  const n = db.prepare("SELECT * FROM naskah WHERE id=?").get(naskahId) as any;
  if (!n) throw new Error("Naskah tidak ditemukan");
  if (n.status !== "disetujui") throw new Error("Naskah harus disetujui dulu");
  const aktif = db.prepare("SELECT id FROM video WHERE naskah_id=? AND status IN ('menyiapkan','suara','render')").get(naskahId);
  if (aktif) throw new Error("Video untuk naskah ini sedang dibuat");
  const hariIni = (db.prepare("SELECT COUNT(*) c FROM video WHERE date(dibuat)=date('now') AND status!='gagal'").get() as any).c;
  if (hariIni >= MAKS_PER_HARI) throw new Error(`Batas ${MAKS_PER_HARI} video per hari tercapai`);

  const id = Number(db.prepare("INSERT INTO video (naskah_id, status) VALUES (?, 'menyiapkan')").run(naskahId).lastInsertRowid);
  void proses(id, n);
  return id;
}

async function proses(id: number, n: any) {
  const judul = String(n.judul ?? n.topik).slice(0, 60);
  let tugas = mulaiTugas("animator", `menyiapkan suara: ${judul}`);
  catat("animator", `mulai membuat video "${judul}"`);
  try {
    set(id, "status='suara'");
    const narasi = await buatNarasi(id, n.isi);
    set(id, "sumber_suara=?, durasi=?", narasi.sumber, narasi.durasi);
    catat("animator", narasi.sumber === "elevenlabs" ? "suara narasi selesai (ElevenLabs)" : "tanpa suara (kunci ElevenLabs belum diisi), waktu kata diperkirakan");

    akhiriTugas(tugas); tugas = mulaiTugas("animator", `merender video: ${judul}`);
    set(id, "status='render'");
    mkdirSync(VIDEO_DIR, { recursive: true });
    const props = { judul: n.judul ?? n.topik, audio: narasi.audio, durasi: narasi.durasi, kalimat: narasi.kalimat };
    const propsFile = join(DATA, `props-${id}.json`);
    writeFileSync(propsFile, JSON.stringify(props));
    await render(propsFile, join(VIDEO_DIR, `${id}.mp4`));
    set(id, "status='selesai', file=?, selesai=datetime('now')", `${id}.mp4`);
    catat("animator", `video "${judul}" selesai (${Math.round(narasi.durasi)} dtk)`, "selesai");
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error(`[video] #${id} gagal:`, msg);
    set(id, "status='gagal', error=?, selesai=datetime('now')", msg.slice(0, 2000));
    catat("animator", `video "${judul}" gagal: ${msg.slice(0, 100)}`, "gagal");
  } finally {
    akhiriTugas(tugas);
  }
}

export function render(propsFile: string, out: string, komposisi = "KantorVideo", batasMenit = 15) {
  const cli = join(REPO, "node_modules", "@remotion", "cli", "remotion-cli.js");
  // Argumen tambahan, mis. KANTOR_RENDER_ARGS="--browser-executable=/opt/pw-browsers/chromium --gl=swangle"
  const extra = (process.env.KANTOR_RENDER_ARGS ?? "").split(/\s+/).filter(Boolean);
  const args = [cli, "render", "src/index.ts", komposisi, out, `--props=${propsFile}`, "--log=error", ...extra];
  return new Promise<void>((ok, gagal) => {
    const p = spawn(process.execPath, args, { cwd: REPO, stdio: ["ignore", "pipe", "pipe"] });
    let log = "";
    p.stdout.on("data", (d) => (log += d));
    p.stderr.on("data", (d) => (log += d));
    const timer = setTimeout(() => { p.kill(); gagal(new Error(`Render melebihi ${batasMenit} menit`)); }, batasMenit * 60_000);
    p.on("error", (e) => { clearTimeout(timer); gagal(e); });
    p.on("close", (code) => {
      clearTimeout(timer);
      code === 0 ? ok() : gagal(new Error(`Render gagal (kode ${code}): ${log.slice(-1500)}`));
    });
  });
}

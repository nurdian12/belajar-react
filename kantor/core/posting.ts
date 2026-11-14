import { join } from "node:path";
import { db } from "./db.ts";
import { VIDEO_DIR } from "./video.ts";
import { jadwalkan, susunBody, type PermintaanPosting } from "./repliz.ts";
import { bacaPengaturan } from "./pipeline.ts";

/** Jadwalkan posting untuk sebuah video. Memencet tombol "Jadwalkan" di dashboard = persetujuan kamu. */
export async function buatPosting(videoId: number, akunId: string, caption: string, jadwal: string): Promise<number> {
  const v = db.prepare("SELECT v.*, n.judul, n.topik FROM video v JOIN naskah n ON n.id=v.naskah_id WHERE v.id=?").get(videoId) as any;
  if (!v) throw new Error("Video tidak ditemukan");
  if (v.status !== "selesai") throw new Error("Video belum selesai dibuat");
  if (!akunId) throw new Error("Pilih akun tujuan");
  const waktu = new Date(jadwal);
  if (Number.isNaN(waktu.getTime())) throw new Error("Waktu jadwal tidak valid");
  if (waktu.getTime() < Date.now() + 60_000) throw new Error("Waktu jadwal harus di masa depan");
  if (db.prepare("SELECT id FROM posting WHERE video_id=? AND akun_id=? AND status IN ('terjadwal','dry-run')").get(videoId, akunId))
    throw new Error("Video ini sudah dijadwalkan ke akun tersebut");

  const req: PermintaanPosting = {
    akunId, judul: v.judul ?? v.topik, caption: caption.trim() || (v.judul ?? v.topik),
    jadwalISO: waktu.toISOString(), fileVideo: join(VIDEO_DIR, v.file), privasi: bacaPengaturan().repliz?.privasi,
  };
  const id = Number(db.prepare(
    "INSERT INTO posting (video_id, akun_id, caption, jadwal, status) VALUES (?,?,?,?, 'menyiapkan')",
  ).run(videoId, akunId, req.caption, req.jadwalISO).lastInsertRowid);

  // Default AMAN: dry-run (hanya mencatat apa yang akan dikirim). Aktifkan "kirimNyata" di pengaturan.json.
  if (!bacaPengaturan().repliz?.kirimNyata) {
    db.prepare("UPDATE posting SET status='dry-run', respons=? WHERE id=?").run(JSON.stringify(susunBody(req)), id);
    return id;
  }
  try {
    const r = await jadwalkan(req);
    db.prepare("UPDATE posting SET status='terjadwal', respons=? WHERE id=?").run(JSON.stringify(r).slice(0, 4000), id);
  } catch (e) {
    db.prepare("UPDATE posting SET status='gagal', error=? WHERE id=?").run(e instanceof Error ? e.message : String(e), id);
  }
  return id;
}

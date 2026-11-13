import { db } from "./db.ts";
import { runAgent, ekstrakJson } from "./runner.ts";

type Draf = { judul: string; naskah: string; rencana_visual: string[] };

/** Buat naskah baru dari topik. Mengembalikan id segera; penulisan jalan di latar belakang. */
export function buatNaskah(topik: string): number {
  const { lastInsertRowid } = db
    .prepare("INSERT INTO naskah (topik, status) VALUES (?, 'menyusun')")
    .run(topik);
  const id = Number(lastInsertRowid);
  void tulis(id, `Tulis naskah video pendek tentang topik: ${topik}`, 1);
  return id;
}

/** Minta revisi: penulis memperbaiki naskah sebelumnya sesuai catatan. */
export function revisiNaskah(id: number, catatan: string) {
  const n = db.prepare("SELECT * FROM naskah WHERE id=?").get(id) as any;
  if (!n) throw new Error("Naskah tidak ditemukan");
  db.prepare("UPDATE naskah SET status='menyusun', catatan=? WHERE id=?").run(catatan, id);
  const prompt =
    `Topik: ${n.topik}\n\nNaskah sebelumnya:\n${n.isi}\n\nCatatan revisi dari bos:\n${catatan}\n\nPerbaiki naskahnya.`;
  void tulis(id, prompt, n.versi + 1);
}

export function setStatus(id: number, status: "disetujui" | "ditolak") {
  db.prepare("UPDATE naskah SET status=? WHERE id=? AND status='menunggu'").run(status, id);
}

async function tulis(id: number, prompt: string, versi: number) {
  try {
    const r = await runAgent("penulis", prompt);
    const d = ekstrakJson<Draf>(r.text);
    db.prepare(
      "UPDATE naskah SET judul=?, isi=?, rencana_visual=?, status='menunggu', versi=?, job_id=? WHERE id=?",
    ).run(d.judul, d.naskah, JSON.stringify(d.rencana_visual ?? []), versi, r.jobId, id);
  } catch (e) {
    console.error(`[penulis] naskah #${id} gagal:`, e instanceof Error ? e.message : e);
    db.prepare("UPDATE naskah SET status='gagal' WHERE id=?").run(id);
  }
}

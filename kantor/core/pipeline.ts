import { readFileSync } from "node:fs";
import { join } from "node:path";
import { db, ROOT } from "./db.ts";
import { runAgent, ekstrakJson } from "./runner.ts";

type Draf = { judul: string; naskah: string; rencana_visual: string[] };

type Riset = { topik: { judul: string; ringkasan?: string; sumber?: string[] }[] };

let risetBerjalan = false;
export const sedangRiset = () => risetBerjalan;

/** Periset mencari topik baru, menyimpannya, lalu (opsional) menyuruh penulis bekerja. */
export async function riset(): Promise<number> {
  if (risetBerjalan) throw new Error("Riset sedang berjalan");
  risetBerjalan = true;
  try {
    const dipakai = (db.prepare("SELECT judul FROM topik ORDER BY id DESC LIMIT 40").all() as { judul: string }[])
      .map((t) => `- ${t.judul}`).join("\n");
    const prompt =
      `Hari ini ${new Date().toISOString().slice(0, 10)}. Cari 3 topik baru.\n` +
      (dipakai ? `Sudah pernah dipakai, jangan diulang:\n${dipakai}` : "");
    const r = await runAgent("periset", prompt);
    const { topik } = ekstrakJson<Riset>(r.text);
    const ins = db.prepare("INSERT INTO topik (judul, ringkasan, sumber, job_id) VALUES (?,?,?,?)");
    const ids = (topik ?? []).filter((t) => t.judul).map((t) =>
      Number(ins.run(t.judul, t.ringkasan ?? "", JSON.stringify(t.sumber ?? []), r.jobId).lastInsertRowid));
    const p = bacaPengaturan();
    if (p.naskahOtomatis) ids.slice(0, p.maksNaskahOtomatis ?? 1).forEach((id) => tulisDariTopik(id));
    return ids.length;
  } finally {
    risetBerjalan = false;
  }
}

/** Buat naskah dari topik hasil riset dan tandai topiknya terpakai. */
export function tulisDariTopik(topikId: number): number {
  const t = db.prepare("SELECT * FROM topik WHERE id=?").get(topikId) as any;
  if (!t) throw new Error("Topik tidak ditemukan");
  db.prepare("UPDATE topik SET status='dipakai' WHERE id=?").run(topikId);
  const sumber = (JSON.parse(t.sumber || "[]") as string[]).join(", ");
  return buatNaskah(`${t.judul}. ${t.ringkasan ?? ""}${sumber ? ` (sumber: ${sumber})` : ""}`);
}

export function buangTopik(id: number) {
  db.prepare("UPDATE topik SET status='dibuang' WHERE id=? AND status='baru'").run(id);
}

export type Pengaturan = {
  jadwal: { agent: string; jam: string }[];
  naskahOtomatis: boolean;
  maksNaskahOtomatis?: number;
  repliz?: { kirimNyata: boolean; jamPosting?: string[] };
};
export function bacaPengaturan(): Pengaturan {
  return JSON.parse(readFileSync(join(ROOT, "pengaturan.json"), "utf8"));
}

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

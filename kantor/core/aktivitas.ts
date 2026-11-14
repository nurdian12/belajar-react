import { db } from "./db.ts";

/**
 * Aktivitas nyata kantor: (1) tugas yang sedang berjalan (di memori) dan (2) catatan aktivitas (tersimpan).
 * Dashboard menerima keduanya secara langsung lewat SSE (/api/aliran). Tidak ada data contoh di sini.
 */
export type Tugas = { agent: string; teks: string; sejak: number };
export type Aktivitas = { id: number; waktu: string; agent: string; teks: string; jenis: string };

/** id agen di folder `agents/` -> kunci karyawan yang dipakai dashboard */
export const KUNCI: Record<string, string> = { periset: "rina", penulis: "maya", animator: "dewi", marketing: "laras", "cs-wa": "putri", pandu: "pandu" };
export const kunciAgen = (id: string) => KUNCI[id] ?? id;

const aktif = new Map<number, Tugas>();
let urut = 0;
const pendengar = new Set<(ev: "aktivitas" | "ubah", data?: Aktivitas) => void>();
export const langgan = (fn: (ev: "aktivitas" | "ubah", data?: Aktivitas) => void) => { pendengar.add(fn); return () => pendengar.delete(fn); };
const sebar = (ev: "aktivitas" | "ubah", data?: Aktivitas) => pendengar.forEach((f) => { try { f(ev, data); } catch { /* klien putus */ } });

/** Tandai sebuah tugas mulai dikerjakan. Mengembalikan pegangan untuk `akhiriTugas`. */
export function mulaiTugas(agent: string, teks: string): number {
  const id = ++urut;
  aktif.set(id, { agent: kunciAgen(agent), teks, sejak: Date.now() });
  sebar("ubah");
  return id;
}
export function akhiriTugas(id: number) { if (aktif.delete(id)) sebar("ubah"); }

/** Tugas yang sedang berjalan per karyawan (yang terbaru menang bila ada beberapa). */
export function tugasAktif(): Record<string, { teks: string; sejak: number }> {
  const out: Record<string, { teks: string; sejak: number }> = {};
  for (const t of aktif.values()) out[t.agent] = { teks: t.teks, sejak: t.sejak };
  return out;
}

/** Catat satu kejadian ke riwayat dan kirim ke dashboard. */
export function catat(agent: string, teks: string, jenis: "info" | "selesai" | "gagal" | "kamu" = "info"): Aktivitas {
  const k = kunciAgen(agent), t = teks.slice(0, 300);
  const { lastInsertRowid } = db.prepare("INSERT INTO aktivitas (agent, teks, jenis) VALUES (?,?,?)").run(k, t, jenis);
  db.prepare("DELETE FROM aktivitas WHERE id <= ?").run(Number(lastInsertRowid) - 300);   // simpan 300 terakhir
  const baris = db.prepare("SELECT * FROM aktivitas WHERE id=?").get(Number(lastInsertRowid)) as Aktivitas;
  sebar("aktivitas", baris);
  return baris;
}

export const riwayat = (n = 30): Aktivitas[] => (db.prepare("SELECT * FROM aktivitas ORDER BY id DESC LIMIT ?").all(n) as Aktivitas[]).reverse();

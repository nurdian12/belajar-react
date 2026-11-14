/**
 * Adapter Repliz. SEMUA yang spesifik Repliz ada di file ini.
 *
 * STATUS: bentuk request di bawah berasal dari rujukan pihak ketiga (skill/MCP komunitas),
 * BELUM diverifikasi dengan dokumentasi resmi Repliz:
 *   - base URL https://api.repliz.com, Basic Auth (access key : secret key)
 *   - GET  /public/account   -> daftar akun sosmed
 *   - POST /public/schedule  -> jadwalkan posting
 * Cara mengunggah file video TIDAK diketahui, jadi kirim nyata sengaja belum diaktifkan (lihat siapkanMedia).
 */
const BASE = process.env.REPLIZ_BASE_URL || "https://api.repliz.com";

export const adaKunciRepliz = () => Boolean(process.env.REPLIZ_ACCESS_KEY && process.env.REPLIZ_SECRET_KEY);

async function panggil(path: string, init: RequestInit = {}) {
  if (!adaKunciRepliz()) throw new Error("REPLIZ_ACCESS_KEY dan REPLIZ_SECRET_KEY belum diisi di kantor/.env");
  const auth = Buffer.from(`${process.env.REPLIZ_ACCESS_KEY}:${process.env.REPLIZ_SECRET_KEY}`).toString("base64");
  const res = await fetch(BASE + path, {
    ...init,
    headers: { authorization: `Basic ${auth}`, "content-type": "application/json", ...(init.headers ?? {}) },
  });
  const teks = await res.text();
  if (!res.ok) throw new Error(`Repliz ${res.status}: ${teks.slice(0, 400)}`);
  try { return JSON.parse(teks); } catch { return teks; }
}

export type Akun = { id: string; nama: string; platform?: string };

/** Daftar akun yang terhubung. Bentuk respons belum pasti, jadi dibaca longgar. */
export async function daftarAkun(): Promise<{ akun: Akun[]; mentah: unknown }> {
  const r = await panggil("/public/account?page=1&limit=50");
  const baris: any[] = Array.isArray(r) ? r : (r?.docs ?? r?.data ?? r?.items ?? []);
  const akun = baris.map((a) => ({
    id: String(a._id ?? a.id ?? ""),
    nama: String(a.name ?? a.username ?? a.displayName ?? a._id ?? "?"),
    platform: a.type ?? a.platform,
  })).filter((a) => a.id);
  return { akun, mentah: r };
}

export type PermintaanPosting = { akunId: string; judul: string; caption: string; jadwalISO: string; fileVideo: string };

/** Susun body POST /public/schedule (tanpa media). Dipakai juga untuk dry-run. */
export function susunBody(p: PermintaanPosting, medias: unknown[] = []) {
  return { title: p.judul, description: p.caption, type: "video", medias, scheduleAt: p.jadwalISO, accountId: p.akunId };
}

/** BELUM DIIMPLEMENTASI: butuh dokumentasi cara unggah/tautan media di Repliz. */
async function siapkanMedia(_p: PermintaanPosting): Promise<unknown[]> {
  throw new Error(
    "Pengiriman nyata ke Repliz belum aktif: cara mengunggah video ke Repliz belum diketahui. " +
    "Kirim dokumentasi API Repliz (bagian upload media & schedule) agar bagian ini diisi.",
  );
}

export async function jadwalkan(p: PermintaanPosting) {
  const medias = await siapkanMedia(p);
  return panggil("/public/schedule", { method: "POST", body: JSON.stringify(susunBody(p, medias)) });
}

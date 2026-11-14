import "./env.ts";
import { readFile, stat } from "node:fs/promises";
import { basename } from "node:path";

/**
 * Adapter Repliz. SEMUA yang spesifik Repliz ada di file ini.
 *
 * Mengikuti dokumentasi Repliz (Storage Upload + Schedule):
 *   - base URL https://api.repliz.com, Basic Auth (access key : secret key)
 *   - POST /public/storage/file/init            -> {id, upload, key, url}
 *   - PUT  <upload>  (biner mentah, tanpa Authorization, Content-Type sama dengan mimetype)
 *   - POST /public/storage/file/{id}/complete
 *   - POST /public/schedule                      -> jadwalkan posting dengan medias[].url
 *   - GET  /public/account                       -> daftar akun (bentuk respons dibaca longgar)
 * Alur nyata ini baru dites terhadap server tiruan, BELUM terhadap akun Repliz asli.
 */
const BASE = () => process.env.REPLIZ_BASE_URL || "https://api.repliz.com";

export const adaKunciRepliz = () => Boolean(process.env.REPLIZ_ACCESS_KEY && process.env.REPLIZ_SECRET_KEY);

function auth() {
  if (!adaKunciRepliz()) throw new Error("REPLIZ_ACCESS_KEY dan REPLIZ_SECRET_KEY belum diisi di kantor/.env");
  return "Basic " + Buffer.from(`${process.env.REPLIZ_ACCESS_KEY}:${process.env.REPLIZ_SECRET_KEY}`).toString("base64");
}

async function panggil(path: string, init: RequestInit = {}) {
  const res = await fetch(BASE() + path, {
    ...init,
    headers: { authorization: auth(), "content-type": "application/json", ...(init.headers ?? {}) },
    signal: AbortSignal.timeout(60_000),
  });
  const teks = await res.text();
  if (!res.ok) {
    const petunjuk = res.status === 402 ? " (penyimpanan Repliz penuh: hapus file lama atau tambah Addon Storage)" : "";
    throw new Error(`Repliz ${res.status}${petunjuk}: ${teks.slice(0, 400)}`);
  }
  try { return JSON.parse(teks); } catch { return teks; }
}

export type Akun = { id: string; nama: string; platform?: string };

/** Daftar akun yang terhubung. Bentuk respons dibaca longgar. */
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

export type PermintaanPosting = { akunId: string; judul: string; caption: string; jadwalISO: string; fileVideo: string; privasi?: string };

/** Body POST /public/schedule. Tanpa `url` media dipakai penanda untuk dry-run. */
export function susunBody(p: PermintaanPosting, urlMedia = "(diisi setelah video diunggah ke Repliz)") {
  return {
    title: p.judul,
    description: p.caption,
    type: "video",
    medias: [{ alt: "", type: "video", thumbnail: "", url: urlMedia }],
    meta: { title: "", description: "", url: "" },
    additionalInfo: {
      isAiGenerated: false, isDraft: false, isAutoAddMusic: false, isShareToFeed: false,
      privacy: p.privasi || "public",
      trialParams: { graduationStrategy: "" }, collaborators: [],
      music: { id: "", artist: "", name: "", thumbnail: "", volume: { video: 50, music: 100 } },
      products: [], tags: [], mentions: [], targetCountries: [],
    },
    replies: [],
    topic: "",
    accountId: p.akunId,
    scheduleAt: p.jadwalISO,
  };
}

/** Unggah video lewat alur init -> PUT -> complete. Mengembalikan URL publik file di Repliz. */
export async function unggahVideo(file: string, mimetype = "video/mp4"): Promise<{ id: string; url: string }> {
  const isi = await readFile(file);
  const { size } = await stat(file);
  const init = await panggil("/public/storage/file/init", { method: "POST", body: JSON.stringify({ filename: basename(file), size, mimetype }) });
  if (!init?.id || !init?.upload || !init?.url) throw new Error(`Respons init Repliz tidak lengkap: ${JSON.stringify(init).slice(0, 200)}`);

  // Presigned URL sudah memuat kredensial: JANGAN kirim Authorization di sini.
  const put = await fetch(init.upload, { method: "PUT", headers: { "content-type": mimetype }, body: isi, signal: AbortSignal.timeout(10 * 60_000) });
  if (!put.ok) throw new Error(`Unggah ke penyimpanan Repliz gagal (${put.status}): ${(await put.text()).slice(0, 200)}`);

  await panggil(`/public/storage/file/${encodeURIComponent(init.id)}/complete`, { method: "POST", body: "{}" });
  return { id: String(init.id), url: String(init.url) };
}

export async function jadwalkan(p: PermintaanPosting) {
  const { url } = await unggahVideo(p.fileVideo);
  return panggil("/public/schedule", { method: "POST", body: JSON.stringify(susunBody(p, url)) });
}

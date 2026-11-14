import { readFileSync } from "node:fs";
import { join } from "node:path";
import { db, ROOT } from "./db.ts";
import { runAgent, ekstrakJson } from "./runner.ts";
import { loadAgent } from "./agents.ts";

export const PLATFORM = ["tiktok", "instagram", "youtube", "facebook", "threads", "x", "umum"] as const;
export type Platform = (typeof PLATFORM)[number];

let menyusun = false;
export const sedangMenyusun = () => menyusun;

const gaya = () => readFileSync(join(ROOT, "agents", "penulis", "skills", "gaya-channel.md"), "utf8");
const pot = (s: unknown, n: number) => String(s ?? "").trim().slice(0, n);

// ---------- rencana konten 7 hari ----------
export function promptRencana(): string {
  const baris = (sql: string) => (db.prepare(sql).all() as { t: string }[]).map((r) => `- ${r.t}`);
  const dipakai = [
    ...baris("SELECT judul t FROM naskah WHERE judul IS NOT NULL ORDER BY id DESC LIMIT 30"),
    ...baris("SELECT judul t FROM rencana ORDER BY id DESC LIMIT 30"),
    ...baris("SELECT judul t FROM topik ORDER BY id DESC LIMIT 20"),
  ];
  return `<tugas>rencana</tugas>\n\n<gaya_channel>\n${gaya()}\n</gaya_channel>\n\n<sudah_dipakai>\n${dipakai.join("\n") || "(belum ada)"}\n</sudah_dipakai>\n\nSusun 7 ide konten untuk 7 hari ke depan.`;
}
export const promptRencanaManual = () => `${loadAgent("marketing").systemPrompt}\n\n---\n\n${promptRencana()}`;

/** Simpan ide dari balasan Laras (JSON). Mengembalikan jumlah ide yang tersimpan. */
export function simpanRencana(teks: string, jobId: number | null = null): number {
  const d = ekstrakJson<{ ide?: any[] }>(teks);
  const ins = db.prepare("INSERT INTO rencana (judul, sudut, pilar, alasan, job_id) VALUES (?,?,?,?,?)");
  let n = 0;
  for (const i of (Array.isArray(d.ide) ? d.ide : []).slice(0, 7)) {
    const judul = pot(i?.judul, 160);
    if (!judul) continue;
    ins.run(judul, pot(i.sudut, 400), pot(i.pilar, 30), pot(i.alasan, 400), jobId); n++;
  }
  if (!n) throw new Error("Balasan tidak berisi ide yang valid");
  return n;
}

export async function susunRencana(): Promise<number> {
  if (menyusun) throw new Error("Laras sedang menyusun rencana");
  menyusun = true;
  try {
    const r = await runAgent("marketing", promptRencana(), "menyusun rencana ide konten 7 hari");
    return simpanRencana(r.text, r.jobId);
  } finally { menyusun = false; }
}

// ---------- caption & hashtag ----------
function video(videoId: number) {
  const v = db.prepare("SELECT v.id, n.judul, n.topik, n.isi FROM video v JOIN naskah n ON n.id=v.naskah_id WHERE v.id=?").get(videoId) as any;
  if (!v) throw new Error("Video tidak ditemukan");
  return v;
}
const cekPlatform = (p: string): Platform => ((PLATFORM as readonly string[]).includes(p) ? p : "umum") as Platform;

export function promptCaption(videoId: number, platform: string): string {
  const v = video(videoId), p = cekPlatform(platform);
  return `<tugas>caption</tugas>\n<platform>${p}</platform>\n\n<gaya_channel>\n${gaya()}\n</gaya_channel>\n\n<naskah>\nJudul: ${v.judul ?? v.topik}\n${v.isi ?? ""}\n</naskah>\n\nTulis caption dan hashtag untuk platform ${p}.`;
}
export const promptCaptionManual = (videoId: number, platform: string) =>
  `${loadAgent("marketing").systemPrompt}\n\n---\n\n${promptCaption(videoId, platform)}`;

/** Hashtag dibersihkan: tanpa spasi/simbol, tanpa duplikat, maksimal 8. */
export function rapikanHashtag(h: unknown): string[] {
  const seen = new Set<string>(), out: string[] = [];
  for (const t of Array.isArray(h) ? h : []) {
    const b = String(t ?? "").replace(/^#+/, "").replace(/[^\p{L}\p{N}_]/gu, "").slice(0, 40);
    if (b && !seen.has(b.toLowerCase())) { seen.add(b.toLowerCase()); out.push("#" + b); }
  }
  return out.slice(0, 8);
}

export function rakitCaption(teks: string): string {
  let caption = teks.trim(), tag: string[] = [];
  try {
    const d = ekstrakJson<{ caption?: string; hashtag?: unknown }>(teks);
    if (typeof d.caption === "string" && d.caption.trim()) { caption = d.caption.trim(); tag = rapikanHashtag(d.hashtag); }
  } catch { /* teks biasa dari Claude manual dipakai apa adanya */ }
  return (caption.slice(0, 1800) + (tag.length ? "\n\n" + tag.join(" ") : "")).trim();
}

export async function buatCaption(videoId: number, platform: string, tempel?: string): Promise<string> {
  if (typeof tempel === "string" && tempel.trim()) return rakitCaption(tempel);
  video(videoId);
  const r = await runAgent("marketing", promptCaption(videoId, platform), `menulis caption ${cekPlatform(platform)} untuk video #${videoId}`);
  return rakitCaption(r.text);
}

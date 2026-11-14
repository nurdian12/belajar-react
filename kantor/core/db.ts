import "./env.ts";
import { DatabaseSync } from "node:sqlite";
import { mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

export const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");

export const DATA = process.env.KANTOR_DATA || join(ROOT, "data");
mkdirSync(DATA, { recursive: true });

export const db = new DatabaseSync(join(DATA, "kantor.sqlite"));

db.exec(`
CREATE TABLE IF NOT EXISTS jobs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  agent TEXT NOT NULL,
  status TEXT NOT NULL,            -- berjalan | selesai | gagal
  input TEXT,
  output TEXT,
  error TEXT,
  biaya_usd REAL,
  dibuat TEXT NOT NULL DEFAULT (datetime('now')),
  selesai TEXT
);
CREATE TABLE IF NOT EXISTS topik (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  judul TEXT NOT NULL,
  ringkasan TEXT,
  sumber TEXT,                     -- JSON array URL
  status TEXT NOT NULL DEFAULT 'baru',  -- baru | dipakai | dibuang
  job_id INTEGER,
  dibuat TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE TABLE IF NOT EXISTS jadwal_log (
  kunci TEXT PRIMARY KEY,          -- "agent|YYYY-MM-DD|HH:MM"
  dijalankan TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE TABLE IF NOT EXISTS video (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  naskah_id INTEGER NOT NULL,
  status TEXT NOT NULL,            -- menyiapkan | suara | render | selesai | gagal
  sumber_suara TEXT,               -- elevenlabs | senyap
  durasi REAL,
  file TEXT,                       -- nama file di data/video/
  error TEXT,
  dibuat TEXT NOT NULL DEFAULT (datetime('now')),
  selesai TEXT
);
CREATE TABLE IF NOT EXISTS aktivitas (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  waktu TEXT NOT NULL DEFAULT (datetime('now')),   -- UTC
  agent TEXT NOT NULL,                             -- rina | maya | dewi | laras | putri | pandu | kamu
  teks TEXT NOT NULL,
  jenis TEXT NOT NULL DEFAULT 'info'               -- info | selesai | gagal | kamu
);
CREATE TABLE IF NOT EXISTS rencana (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  judul TEXT NOT NULL,
  sudut TEXT,
  pilar TEXT,
  alasan TEXT,
  status TEXT NOT NULL DEFAULT 'baru',   -- baru | dipakai | dibuang
  job_id INTEGER,
  dibuat TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE TABLE IF NOT EXISTS percakapan (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  saluran TEXT NOT NULL,           -- simulasi | whatsapp
  kontak TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'baru',   -- baru | draf | butuh-kamu | dibalas | selesai
  alasan TEXT,
  diperbarui TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE (saluran, kontak)
);
CREATE TABLE IF NOT EXISTS pesan (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  percakapan_id INTEGER NOT NULL,
  arah TEXT NOT NULL,              -- masuk | keluar | draf
  teks TEXT NOT NULL,
  catatan TEXT,
  dibuat TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE TABLE IF NOT EXISTS posting (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  video_id INTEGER NOT NULL,
  akun_id TEXT NOT NULL,
  caption TEXT,
  jadwal TEXT NOT NULL,            -- ISO UTC
  status TEXT NOT NULL,            -- menyiapkan | dry-run | terjadwal | gagal
  respons TEXT,
  error TEXT,
  dibuat TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE TABLE IF NOT EXISTS naskah (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  topik TEXT NOT NULL,
  judul TEXT,
  isi TEXT,
  rencana_visual TEXT,             -- JSON array
  status TEXT NOT NULL,            -- menyusun | menunggu | disetujui | ditolak | gagal
  catatan TEXT,
  versi INTEGER NOT NULL DEFAULT 1,
  job_id INTEGER,
  dibuat TEXT NOT NULL DEFAULT (datetime('now'))
);
`);

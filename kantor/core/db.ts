import { DatabaseSync } from "node:sqlite";
import { mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

export const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
mkdirSync(join(ROOT, "data"), { recursive: true });

export const db = new DatabaseSync(join(ROOT, "data", "kantor.sqlite"));

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

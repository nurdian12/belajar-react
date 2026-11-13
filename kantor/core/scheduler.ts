import { db } from "./db.ts";
import { bacaPengaturan, riset } from "./pipeline.ts";

const pad = (n: number) => String(n).padStart(2, "0");

/** Cek tiap 30 detik: jalankan entri jadwal yang jamnya sudah lewat hari ini dan belum pernah jalan. */
export function mulaiScheduler() {
  const tick = async () => {
    const now = new Date();
    const tanggal = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
    const menit = now.getHours() * 60 + now.getMinutes();
    let jadwal: ReturnType<typeof bacaPengaturan>["jadwal"] = [];
    try { jadwal = bacaPengaturan().jadwal; } catch (e) { console.error("[jadwal] pengaturan.json rusak:", e); return; }

    for (const j of jadwal) {
      const [h, m] = j.jam.split(":").map(Number);
      if (menit < h * 60 + m) continue;
      const kunci = `${j.agent}|${tanggal}|${j.jam}`;
      // Tandai dulu: bila gagal, tidak diulang terus-menerus; jalankan manual dari dashboard.
      const baru = db.prepare("INSERT OR IGNORE INTO jadwal_log (kunci) VALUES (?)").run(kunci).changes;
      if (!baru) continue;
      console.log(`[jadwal] menjalankan ${j.agent} (${j.jam})`);
      try {
        if (j.agent === "periset") console.log(`[jadwal] riset selesai, ${await riset()} topik baru`);
        else console.warn(`[jadwal] agent "${j.agent}" belum punya aksi terjadwal`);
      } catch (e) {
        console.error(`[jadwal] ${j.agent} gagal:`, e instanceof Error ? e.message : e);
      }
    }
  };
  void tick();
  return setInterval(tick, 30_000);
}

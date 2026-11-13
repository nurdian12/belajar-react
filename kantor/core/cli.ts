import { db } from "./db.ts";
import { buatNaskah } from "./pipeline.ts";

const topik = process.argv.slice(2).join(" ").trim();
if (!topik) {
  console.error('Pakai: npm run kantor:tulis -- "topik video"');
  process.exit(1);
}

const id = buatNaskah(topik);
console.log(`Naskah #${id} sedang ditulis…`);
const t = setInterval(() => {
  const n = db.prepare("SELECT * FROM naskah WHERE id=?").get(id) as any;
  if (n.status === "menyusun") return;
  clearInterval(t);
  if (n.status === "gagal") {
    console.error("Gagal. Lihat tabel jobs untuk errornya.");
    process.exit(1);
  }
  console.log(`\n${n.judul}\n\n${n.isi}\n\nVisual:\n- ${JSON.parse(n.rencana_visual).join("\n- ")}`);
  console.log("\nSetujui di dashboard: npm run kantor");
  process.exit(0);
}, 500);

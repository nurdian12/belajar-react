// Mengisi database contoh untuk rekaman tur. Jalankan dengan KANTOR_DATA=<folder kosong> KANTOR_MOCK=1.
import { db } from "../core/db.ts";
import { buatVideo } from "../core/video.ts";

const TOPIK = [
  ["Katanya musim hujan, kok masih panas?", "Musim hujan diprediksi datang lebih lambat di sebagian wilayah. Sudut cerita: dilema jemuran dan siap-siap payung.", ["https://nu.or.id/nasional/bmkg-musim-hujan", "https://www.cnbcindonesia.com/tech/bmkg-awal-musim-hujan"]],
  ["Habis 11.11, ketemu Harbolnas: dompet kuat atau khilaf?", "Promo tanggal kembar baru lewat, Harbolnas menyusul. Sudut cerita: checkout dulu, mikir belakangan.", ["https://www.jawapos.com/ekonomi/promo-1111", "https://katadata.co.id/digital/harbolnas"]],
  ["#CuekinBuzzer: kenapa kita gampang ikut yang viral?", "Tagar ramai di media sosial. Sudut cerita: cara santai tetap tenang saat timeline ribut.", ["https://katadata.co.id/digital/cuekinbuzzer"]],
] as const;

const N1 = {
  judul: "Musim Hujan Telat, Jemuran Bingung",
  isi: "Sudah masuk November, tapi kok siang masih panas? Musim hujan tahun ini diperkirakan datang lebih lambat di banyak daerah. Akibatnya kita bingung: jemur baju atau tidak, bawa payung atau tidak. Tenang, simpan satu payung lipat di tas dan cek prakiraan cuaca sebelum berangkat. Simpan videonya, biar kamu ingat saat langit mulai mendung.",
  visual: ["Langit cerah tapi kalender November", "Jemuran dan payung bergantian", "Payung lipat masuk tas"],
};
const N2 = {
  judul: "Checkout Dulu, Mikir Belakangan",
  isi: "Habis tanggal kembar, promo belanja online belum juga berhenti. Harbolnas sebentar lagi, dan jari kita sudah gatal untuk checkout. Sebelum belanja, tulis dulu daftar yang benar-benar kamu butuhkan. Lalu tunggu satu malam. Kalau besok masih ingin, baru beli. Bagikan ke temanmu yang suka checkout dulu, mikir belakangan.",
  visual: ["Keranjang belanja penuh", "Daftar belanja di catatan", "Jam menunjukkan esok hari"],
};

const ins = db.prepare("INSERT INTO topik (judul, ringkasan, sumber) VALUES (?,?,?)");
for (const [j, r, s] of TOPIK) ins.run(j, r, JSON.stringify(s));

const nas = db.prepare("INSERT INTO naskah (topik, judul, isi, rencana_visual, status, versi) VALUES (?,?,?,?,?,1)");
nas.run(TOPIK[0][0], N1.judul, N1.isi, JSON.stringify(N1.visual), "disetujui");
nas.run(TOPIK[1][0], N2.judul, N2.isi, JSON.stringify(N2.visual), "menunggu");

const job = db.prepare("INSERT INTO jobs (agent, status, input, output, biaya_usd, selesai) VALUES (?, 'selesai', ?, ?, ?, datetime('now'))");
job.run("periset", "Cari 3 topik baru", "{}", 0.136); job.run("penulis", "Tulis naskah", "{}", 0.021); job.run("penulis", "Tulis naskah", "{}", 0.019);

const id = buatVideo(1);
console.log(`Membuat video #${id}…`);
for (let i = 0; i < 120; i++) {
  await new Promise((r) => setTimeout(r, 2000));
  const v = db.prepare("SELECT status, error FROM video WHERE id=?").get(id) as any;
  if (v.status === "selesai") { console.log("Video siap."); process.exit(0); }
  if (v.status === "gagal") { console.error("Video gagal:", v.error); process.exit(1); }
}
console.error("Timeout menunggu video"); process.exit(1);

import { adaKunciRepliz, daftarAkun } from "./repliz.ts";

// Tes read-only: hanya MEMBACA daftar akun, tidak membuat posting apa pun.
console.log(`Kunci Repliz: ${adaKunciRepliz() ? "ada" : "TIDAK ADA (isi REPLIZ_ACCESS_KEY & REPLIZ_SECRET_KEY di kantor/.env)"}`);
try {
  const { akun, mentah } = await daftarAkun();
  if (!akun.length) console.log("Tidak ada akun terbaca. Respons mentah:\n", JSON.stringify(mentah, null, 2).slice(0, 1500));
  for (const a of akun) console.log(`- ${a.nama}${a.platform ? ` (${a.platform})` : ""}  id=${a.id}`);
} catch (e) {
  console.error("GAGAL:", e instanceof Error ? e.message : e);
  process.exit(1);
}

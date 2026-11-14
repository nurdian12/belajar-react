/**
 * Papan cerita video tur. Satu kalimat narasi = satu adegan.
 * `gambar` = nama file di public/tur/ (dibuat oleh rekam.cjs), `fokus` = pusat & zoom akhir (0..1).
 * Hindari titik di tengah kalimat: pemisah adegan memakai tanda baca akhir.
 */
export type Langkah = {
  teks: string;
  gambar: "kantor-idle" | "kantor-rina" | "kantor-maya" | "kantor-dewi" | "kantor-kamu" | "topik" | "naskah" | "kartu-video";
  fokus: { x: number; y: number; zoom: number };
  lencana?: { nomor?: string; teks: string };
  judul?: { besar: string; kecil: string };
};

export const SKRIP: Langkah[] = [
  { teks: "Ini Kantor, kantor virtual yang diisi karyawan AI.", gambar: "kantor-idle", fokus: { x: 0.5, y: 0.5, zoom: 1.06 },
    judul: { besar: "Tur Kantor", kecil: "Kantor virtual berisi karyawan AI" } },
  { teks: "Kamu jadi bosnya, mereka yang bekerja.", gambar: "kantor-idle", fokus: { x: 0.5, y: 0.5, zoom: 1.35 } },
  { teks: "Setiap pagi, Rina meriset topik keseharian yang sedang ramai.", gambar: "kantor-rina", fokus: { x: 0.46, y: 0.27, zoom: 1.9 }, lencana: { nomor: "1", teks: "Riset" } },
  { teks: "Hasilnya tiga topik lengkap dengan sumber, kamu tinggal memilih.", gambar: "topik", fokus: { x: 0.5, y: 0.45, zoom: 1.2 }, lencana: { nomor: "1", teks: "Riset" } },
  { teks: "Lalu Maya menulis naskah dengan gaya channel kamu.", gambar: "kantor-maya", fokus: { x: 0.58, y: 0.34, zoom: 1.9 }, lencana: { nomor: "2", teks: "Naskah" } },
  { teks: "Naskahnya muncul di sini, kamu setujui, revisi, atau tolak.", gambar: "naskah", fokus: { x: 0.35, y: 0.88, zoom: 1.5 }, lencana: { nomor: "2", teks: "Naskah" } },
  { teks: "Setelah disetujui, Dewi membuat suara narasi dan merender videonya.", gambar: "kantor-dewi", fokus: { x: 0.72, y: 0.5, zoom: 1.9 }, lencana: { nomor: "3", teks: "Video" } },
  { teks: "Hasilnya langsung bisa diputar di dashboard.", gambar: "kartu-video", fokus: { x: 0.12, y: 0.45, zoom: 1.7 }, lencana: { nomor: "3", teks: "Video" } },
  { teks: "Terakhir, pilih akun dan jam posting, lalu jadwalkan lewat Repliz.", gambar: "kartu-video", fokus: { x: 0.5, y: 0.9, zoom: 1.5 }, lencana: { nomor: "4", teks: "Posting" } },
  { teks: "Semuanya jalan di komputer kamu, tugasmu cuma menyetujui.", gambar: "kantor-kamu", fokus: { x: 0.46, y: 0.5, zoom: 1.8 } },
];

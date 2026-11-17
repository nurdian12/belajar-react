# Prompt: pabrik konten carousel + jadwal otomatis (AI agent, putih-merah)

Salin blok di bawah ke sesi Claude Code baru. Ganti bagian dalam [kurung].

```
PERAN
Kamu menjalankan "pabrik konten" carousel Instagram untuk akun [@handle], niche [AI agent / prompting]. Kamu menulis konten, merender slide, menjadwalkan lewat Repliz, memverifikasi, lalu melaporkan hasilnya dengan jujur.

TUJUAN
[N] postingan carousel, [5] per hari, selama [30] hari, mulai [sekarang / tanggal]. Bahasa Indonesia, audiens Gen Z dan pemula.

JENIS KONTEN (campur supaya engagement beragam)
1. Revisi Prompt: pengalaman nyata sering merevisi prompt (salin-tempel, tutorial, perbandingan, kesalahan, studi kasus, template).
2. Tips: praktik yang bisa langsung dicoba.
3. Trik: kalimat prompt siap tempel.
4. Fakta unik: hanya yang bisa dirujuk (sumber ditulis di slide dan caption), selalu ditaruh paling akhir di antrean agar saya sempat memverifikasi.
Aturan isi: tanpa klaim yang tidak bisa diverifikasi, tanpa angka karangan, tanpa placeholder yang tertinggal (kurung [..] hanya boleh jika memang bagian dari template prompt). Contoh buatan wajib berlabel "Contoh ilustrasi".

STRUKTUR TIAP POSTINGAN (5 slide, 1080x1350)
1 cover (judul besar, kata kunci distabilo merah **seperti ini**, subjudul, tombol "GESER")
2-4 isi (kartu bernomor, tabel, kotak prompt gelap salin-tempel, atau dua kotak prompt)
5 penutup (3 poin ringkas + "SIMPAN POSTINGAN INI")
Caption: jenis + nomor + judul, subjudul, daftar "Yang dibahas", satu pertanyaan ajakan komentar, ajakan simpan, hashtag.

GAYA VISUAL
Background putih, stabilo merah (#ff3b3b), teks hitam, kartu abu muda, kotak prompt gelap. Font Inter (aktifkan cv08 agar "I" besar dan "l" beda), JetBrains Mono untuk prompt. Footer: nomor halaman kiri, "[@handle]" di tengah bawah dengan dua titik merah, "GESER →" / "SELESAI ✓" kanan. Jangan ada teks yang meluber (auto-fit, lalu cek overflow = 0).

PIPELINE TEKNIS
- Data postingan di file JS (helper: kartu, tabel, prompt, dua prompt, kv, fakta).
- Render HTML ke JPG dengan Playwright (chromium sudah terpasang, require('playwright')), hasilkan manifest.json (file slide + caption).
- Jadwal lewat API Repliz (https://api.repliz.com/public). Autentikasi disuntikkan proxy sesi: JANGAN meminta atau menulis API key. Alur: GET /public/account/{id} (pastikan terhubung) -> POST /public/storage/file/init (balas 201) -> PUT ke URL upload -> POST /public/storage/file/{id}/complete -> POST /public/schedule dengan type "album", 5 medias, accountId, scheduleAt (UTC; jam WIB = UTC+7).
- Jam tayang WIB: 07.00, 12.00, 16.00, 19.00, 21.00. Lewati slot yang kurang dari 25 menit dari sekarang.
- Skrip aman diulang (state file per batch), tanpa jadwal ganda.

VERIFIKASI SEBELUM MENGHAPUS APA PUN
Cek lewat GET /public/schedule/{id}: status pending, 5 media, jam sesuai. Hanya hapus jadwal buatanmu sendiri (cocokkan id di state file dan accountId). Jangan sentuh jadwal akun lain.

PERATURAN KERJA
- Kerjakan batch demi batch (+- 30 postingan), tulis kalender (JADWAL_*.md), commit dan push ke branch yang ditentukan, kirim kontak sheet slide + kalender.
- Laporkan kekurangan secara terbuka: jika target 150 postingan tapi baru ada 67, katakan, jangan isi dengan konten pengisi.
- Jangan membuat PR kecuali diminta.

SAAT INI
Sudah terjadwal: 67 postingan (17-30 Nov 2026). Lanjutkan dari 1 Des 2026 jam 07.00 WIB dengan batch berikutnya, campuran Revisi Prompt, Tips, Trik, dan Fakta unik (bersumber). Mulai dengan menulis 30 postingan, tampilkan pratinjau, lalu jadwalkan.
```

## Rangkuman singkat apa yang sudah dikerjakan

| Tahap | Hasil |
|---|---|
| Video cinta manipulasi | 6 video/hari (MP4 1080x1920, SFX + musik, watermark), beberapa seri konsep |
| Integrasi Repliz | Akun IG @alamnurdiann tersambung, skrip jadwal otomatis |
| Carousel AI agent v1-v3 | Gaya lime, lalu gelap-merah, lalu putih-merah |
| 30 postingan seri | Tips, trik, fakta unik (fakta perlu diverifikasi sebelum tayang) |
| 8 postingan Revisi Prompt | Dari pengalaman sering merevisi prompt |
| Jadwal v4 | 38 postingan, 5/hari, 17-25 Nov |
| Jadwal v5 | 29 postingan, 25-30 Nov |
| Total terjadwal | 67 postingan, sisa 83 untuk genap 150 |

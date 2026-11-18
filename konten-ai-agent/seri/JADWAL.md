# Jadwal seri AI agent: Instagram @alamnurdiann

Tayang **19.00 WIB** setiap hari, 18 November sampai 17 Desember 2026. 30 carousel, 5 slide per postingan. Status di Repliz: semua `pending` (menunggu jam tayang).

| Hari | Tanggal | Jenis | Judul | ID jadwal Repliz |
|---|---|---|---|---|
| 1 | Wed 18 Nov 2026 | TIPS #1 | Mulai dari workflow, bukan agent. | `6afc24fcf5e53449c9ddf2a2` |
| 2 | Thu 19 Nov 2026 | TRIK #1 | Minta rencana dulu, baru eksekusi. | `6afc251b3a2dd8aca9166a95` |
| 3 | Fri 20 Nov 2026 | FAKTA UNIK #1 | Termostat adalah agent paling sederhana. | `6afc25243a2dd8aca9166d16` |
| 4 | Sat 21 Nov 2026 | TIPS #2 | Tulis instruksi seperti brief ke karyawan baru. | `6afc252d3a2dd8aca9166f8f` |
| 5 | Sun 22 Nov 2026 | TRIK #2 | Minta agent menjelaskan alasan tiap aksi. | `6afc2536f5e53449c9de0571` |
| 6 | Mon 23 Nov 2026 | FAKTA UNIK #2 | ELIZA (1966) hanya menyusun ulang kalimatmu. | `6afc25413a2dd8aca916795b` |
| 7 | Tue 24 Nov 2026 | TIPS #3 | Satu contoh lebih kuat dari satu paragraf aturan. | `6afc254af5e53449c9de0fb0` |
| 8 | Wed 25 Nov 2026 | TRIK #3 | Minta hasil dalam format tetap. | `6afc2556f5e53449c9de12b0` |
| 9 | Thu 26 Nov 2026 | FAKTA UNIK #3 | Pola ReAct: berpikir, lalu bertindak, bergantian. | `6afc2560f5e53449c9de1640` |
| 10 | Fri 27 Nov 2026 | TIPS #4 | Batasi langkah dan biaya sejak awal. | `6afc25693a2dd8aca916892b` |
| 11 | Sat 28 Nov 2026 | TRIK #4 | Pakai mode simulasi sebelum aksi nyata. | `6afc25723a2dd8aca9168c1a` |
| 12 | Sun 29 Nov 2026 | FAKTA UNIK #4 | Teks biasa bisa membajak agent: prompt injection. | `6afc257c7dbdee5939aeb0b9` |
| 13 | Mon 30 Nov 2026 | TIPS #5 | Sediakan jalan keluar: tanya manusia. | `6afc25877dbdee5939aeb3db` |
| 14 | Tue 01 Dec 2026 | TRIK #5 | Pecah tugas panjang jadi checkpoint. | `6afc2590f5e53449c9de2b94` |
| 15 | Wed 02 Dec 2026 | FAKTA UNIK #5 | MCP: seperti colokan USB-C untuk alat AI. | `6afc259a3a2dd8aca9169dea` |
| 16 | Thu 03 Dec 2026 | TIPS #6 | Uji dengan 10 kasus nyata sebelum dilepas. | `6afc25a5f5e53449c9de326e` |
| 17 | Fri 04 Dec 2026 | TRIK #6 | Beri agent catatan kerja agar tidak lupa. | `6afc25b07dbdee5939aec700` |
| 18 | Sat 05 Dec 2026 | FAKTA UNIK #6 | 25 agent AI hidup di kota simulasi. | `6afc25bb3a2dd8aca916ac8c` |
| 19 | Sun 06 Dec 2026 | TIPS #7 | Catat log tiap langkah agent. | `6afc25c6f5e53449c9de42c8` |
| 20 | Mon 07 Dec 2026 | TRIK #7 | Pakai agent kedua sebagai pemeriksa. | `6afc25d0f5e53449c9de4aad` |
| 21 | Tue 08 Dec 2026 | FAKTA UNIK #7 | Voyager: agent Minecraft yang menulis skill-nya sendiri. | `6afc25dc7dbdee5939aee0a9` |
| 22 | Wed 09 Dec 2026 | TIPS #8 | Satu agent, satu peran. | `6afc25e67dbdee5939aee77f` |
| 23 | Thu 10 Dec 2026 | TRIK #8 | Tulis daftar larangan yang jelas. | `6afc25f07dbdee5939aeeae0` |
| 24 | Fri 11 Dec 2026 | FAKTA UNIK #8 | Info di tengah konteks panjang lebih sering terlewat. | `6afc25fcf5e53449c9de6212` |
| 25 | Sat 12 Dec 2026 | TIPS #9 | Beri akses minimum saja. | `6afc26067dbdee5939aef44e` |
| 26 | Sun 13 Dec 2026 | TRIK #9 | Tulis deskripsi alat yang jelas. | `6afc2611f5e53449c9de6a91` |
| 27 | Mon 14 Dec 2026 | FAKTA UNIK #9 | Agent diuji dengan masalah GitHub nyata. | `6afc261bf5e53449c9de7198` |
| 28 | Tue 15 Dec 2026 | TIPS #10 | Pilih tugas yang hasilnya bisa dicek. | `6afc26243a2dd8aca916e450` |
| 29 | Wed 16 Dec 2026 | TRIK #10 | Ringkas hasil alat sebelum diberikan lagi. | `6afc262ef5e53449c9de7b18` |
| 30 | Thu 17 Dec 2026 | FAKTA UNIK #10 | Model tidak menjalankan alat. Kodemu yang menjalankan. | `6afc263af5e53449c9de7e33` |

## Cara mengubah atau membatalkan
- Hapus satu jadwal: `DELETE /public/schedule/{ID jadwal}` (atau lewat dasbor Repliz).
- Ganti konten: ubah `posts.js`, jalankan `node gen.js`, hapus jadwal lama, lalu `python3 post_series.py --start 2026-11-18 --go`.
- Skrip aman dijalankan ulang: hari yang sudah ada di `schedule_state.json` dilewati.

## Cek sebelum tayang
Fakta unik (hari 3, 6, 9, 12, 15, 18, 21, 24, 27, 30) menyebut tahun, nama peneliti, dan istilah. Semuanya dari pengetahuan umum yang saya yakini benar, tapi tolong cek ulang ke sumber aslinya sebelum tayang, terutama sebelum hari ke-3 (20 Nov).

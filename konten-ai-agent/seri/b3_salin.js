const { c, p, pp, t, m } = require('./b3_lib.js'); const K = 'salin';
module.exports = [
m(K,'**Instruksi sistem** untuk agent riset.','Salin, lalu ganti bagian [kurung].',[
 c('Isi yang perlu ada',['Peran dan tujuan.','Aturan sumber dan kejujuran.','Format hasil.']),
 p('Salin-tempel (1/2)',['Ganti [topik] dan [audiens].','Simpan sebagai template.'],'PERAN: asisten riset untuk [audiens].\nTUJUAN: kumpulkan informasi tentang [topik].\nATURAN:\n1) Tulis hanya yang ada di sumber yang kuberikan.\n2) Kalau tidak ada datanya, tulis "tidak ada di data".'),
 p('Salin-tempel (2/2)',['Lanjutan dari slide sebelumnya.','Sesuaikan jumlah poin.'],'FORMAT HASIL:\n- Ringkasan 3 poin\n- Hal yang belum jelas\n- Pertanyaan lanjutan untukku')],['Tentukan peran dan tujuan.','Tulis aturan sumber.','Tentukan format hasil.']),
m(K,'Template **brief tugas** untuk agent.','Anggap agent sebagai karyawan baru.',[
 c('Kenapa brief',['Karyawan baru butuh konteks lengkap.','Agent tidak tahu apa yang ada di kepalamu.','Brief jelas mengurangi revisi.']),
 p('Salin-tempel',['Isi semua bagian.','Hapus bagian yang tidak relevan.'],'TUGAS: ...\nLATAR BELAKANG: ...\nHASIL YANG KUHARAPKAN: ...\nYANG BOLEH DILAKUKAN: ...\nYANG TIDAK BOLEH: ...\nKALAU RAGU: tanya aku dulu.'),
 c('Cara memakainya',['Isi dengan kalimat pendek.','Beri satu contoh hasil.','Simpan brief yang berhasil.'])],['Tulis brief lengkap.','Beri contoh hasil.','Simpan yang berhasil.']),
m(K,'**Checklist** sebelum agent dilepas.','Lima menit yang menghemat banyak masalah.',[
 p('Salin-tempel',['Centang satu per satu.','Tambah poin dari pengalamanmu.'],'[ ] Tujuan dan kriteria selesai jelas\n[ ] Akses dibatasi seperlunya\n[ ] Ada batas langkah dan biaya\n[ ] Sudah diuji dengan 10 kasus\n[ ] Ada log dan cara berhenti\n[ ] Ada orang yang meninjau hasil'),
 c('Cara memakainya',['Jalankan sebelum setiap rilis.','Jangan lewati poin yang tidak nyaman.','Perbarui daftar tiap ada insiden.']),
 c('Kalau ada yang belum',['Tunda rilis.','Perbaiki satu poin sekali jalan.','Ulangi checklist.'])],['Pakai checklist tiap rilis.','Jangan lewati poin.','Perbarui dari insiden.']),
m(K,'Prompt agent **perangkum email**.','Template umum untuk ringkasan harian.',[
 c('Sebelum memakai',['Samarkan data pribadi.','Tentukan siapa penerima ringkasan.','Tentukan panjang maksimal.']),
 p('Salin-tempel',['Ganti [kurung].','Jalankan manual dulu.'],'Ringkas email berikut untuk [penerima]. Maksimal 5 poin. Tandai yang butuh balasan dengan "BALAS" dan beri tenggat kalau disebut. Jangan menambah info yang tidak ada di email.'),
 c('Cek hasilnya',['Apakah ada yang terlewat?','Apakah tenggat benar?','Sesuaikan bila perlu.'])],['Samarkan data.','Batasi panjang.','Cek hasilnya.']),
m(K,'Aturan **izin**: boleh dan tidak boleh.','Pagar sederhana untuk agent.',[
 c('Kenapa perlu',['Agent butuh batas yang tegas.','Tanpa batas, ia memilih sendiri.','Batas tertulis mudah diaudit.']),
 p('Salin-tempel',['Sesuaikan dengan tugasmu.','Tambahkan daftar spesifik.'],'BOLEH: membaca file di folder [A], menulis draf di folder [B].\nTIDAK BOLEH: menghapus file, mengirim pesan ke orang lain, mengubah pengaturan.\nBUTUH IZIN DULU: apa pun di luar daftar BOLEH.'),
 c('Tips',['Mulai ketat, longgarkan perlahan.','Uji dengan permintaan yang melanggar.','Catat pelanggaran.'])],['Tulis boleh dan tidak.','Uji pelanggaran.','Longgarkan perlahan.']),
m(K,'Template **laporan akhir** agent.','Biar hasilnya mudah ditinjau.',[
 c('Isi laporan yang berguna',['Apa yang dikerjakan.','Apa yang belum selesai.','Apa yang perlu keputusanmu.']),
 p('Salin-tempel',['Tempel di akhir instruksi.','Minta urutan yang konsisten.'],'Setelah selesai, buat laporan: 1) YANG DIKERJAKAN, 2) YANG BELUM SELESAI dan alasannya, 3) KEPUTUSAN YANG KUBUTUHKAN. Maksimal 150 kata.'),
 c('Manfaat',['Tinjauan lebih cepat.','Tidak ada kejutan.','Mudah dibandingkan antartugas.'])],['Minta laporan tetap.','Sebut yang belum selesai.','Tinjau cepat.']),
m(K,'Prompt agent **pemeriksa** hasil.','Mata kedua sebelum kamu menerima hasil.',[
 c('Idenya',['Satu agent menulis, satu memeriksa.','Pemeriksa tidak melihat alasan penulis.','Hasil pemeriksaan jadi daftar perbaikan.']),
 p('Salin-tempel',['Berikan kriteria yang jelas.','Minta bukti per temuan.'],'Periksa hasil berikut dengan kriteria: [kriteria]. Daftar semua masalah dengan kutipan bagian yang bermasalah. Kalau tidak ada masalah, tulis "tidak ditemukan masalah". Jangan menulis ulang.'),
 c('Catatan',['Pemeriksa bisa salah juga.','Tetap tinjau temuan penting.','Gunakan kriteria yang sama berulang.'])],['Pisahkan penulis dan pemeriksa.','Beri kriteria.','Tinjau temuan.']),
m(K,'Template **deskripsi alat** untuk agent.','Deskripsi jelas, pemilihan alat lebih tepat.',[
 c('Yang perlu ada',['Fungsi dalam satu kalimat.','Kapan dipakai dan kapan tidak.','Contoh masukan dan keluaran.']),
 p('Salin-tempel',['Satu blok per alat.','Beri nama yang jelas.'],'NAMA: [cari_dokumen]\nFUNGSI: mencari dokumen berdasarkan kata kunci.\nPAKAI KETIKA: pengguna menanyakan isi dokumen.\nJANGAN PAKAI KETIKA: pertanyaan umum.\nMASUKAN: kata_kunci (teks).'),
 c('Periksa',['Apakah dua alat terdengar mirip?','Apakah ada contoh?','Uji dengan permintaan ambigu.'])],['Tulis fungsi.','Tulis kapan dipakai.','Beri contoh.']),
m(K,'Prompt agar agent **bertanya saat ragu**.','Lebih baik bertanya daripada menebak.',[
 c('Kapan agent harus bertanya',['Informasi penting tidak ada.','Ada dua tafsiran yang berbeda jauh.','Aksinya sulit dibatalkan.']),
 p('Salin-tempel',['Tempel di instruksi sistem.','Batasi agar tidak terlalu cerewet.'],'Kalau informasi penting belum jelas atau ada lebih dari satu tafsiran, tanyakan satu pertanyaan singkat sebelum bertindak. Jangan bertanya untuk hal yang bisa kamu simpulkan sendiri.'),
 c('Tips',['Uji dengan permintaan yang sengaja samar.','Cek apakah terlalu sering bertanya.','Sesuaikan ambangnya.'])],['Izinkan bertanya.','Batasi pertanyaan.','Uji dengan permintaan samar.']),
m(K,'Template **catatan kerja** agent.','Biar tugas panjang tidak tercecer.',[
 c('Kenapa perlu',['Percakapan panjang membuat detail terlupa.','Catatan jadi pegangan setelah jeda.','Mudah kamu tinjau.']),
 p('Salin-tempel',['Minta agent memperbaruinya.','Simpan di satu berkas.'],'CATATAN KERJA\nTUJUAN: ...\nSUDAH SELESAI: ...\nSEDANG DIKERJAKAN: ...\nKEPUTUSAN PENTING: ...\nLANGKAH BERIKUTNYA: ...'),
 c('Cara memakainya',['Perbarui tiap selesai satu bagian.','Mulai sesi baru dari catatan.','Hapus yang usang.'])],['Simpan catatan kerja.','Perbarui tiap bagian.','Mulai sesi dari catatan.']),
m(K,'Prompt **10 kasus uji** untuk agent.','Mulai menguji tanpa ribet.',[
 c('Komposisi kasus',['4 kasus biasa.','3 kasus tepi (kosong, panjang, aneh).','3 kasus yang sengaja salah.']),
 p('Salin-tempel',['Minta model membuat kasus uji.','Periksa sebelum dipakai.'],'Buat 10 kasus uji untuk agent yang tugasnya [tugas]: 4 biasa, 3 kasus tepi, 3 permintaan yang sengaja salah atau melanggar aturan. Untuk tiap kasus tulis hasil yang diharapkan.'),
 c('Setelah itu',['Jalankan semua kasus.','Catat hasil sebenarnya.','Perbaiki yang gagal, ulangi.'])],['Buat 10 kasus uji.','Sertakan kasus salah.','Ulangi setelah perbaikan.']),
];

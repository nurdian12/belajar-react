const { c, p, pp, t, m } = require('./b3_lib.js'); const K = 'kesalahan';
module.exports = [
m(K,'Langsung bangun agent padahal **workflow** cukup.','Kesalahan paling mahal untuk pemula.',[
 c('Kenapa jadi masalah',['Agent lebih sulit diuji dan diprediksi.','Alur yang sudah pasti tidak butuh keputusan model.','Biayanya lebih besar tanpa manfaat tambahan.']),
 c('Cara memeriksanya',['Bisa kamu tulis langkahnya dari awal sampai akhir?','Apakah urutannya selalu sama?','Kalau ya, mulai dari workflow.']),
 c('Perbaikannya',['Tulis alurnya sebagai langkah tetap.','Pakai model hanya di langkah yang butuh bahasa.','Naik ke agent kalau jalurnya benar-benar bervariasi.'])],['Cek dulu apakah alurnya pasti.','Mulai dari workflow.','Naik ke agent kalau perlu.']),
m(K,'Memberi agent **akses terlalu luas**.','Semakin luas akses, semakin besar dampak kalau salah.',[
 c('Kesalahannya',['Memberi akses ke semua folder atau semua akun.','Memakai kunci yang bisa mengubah dan menghapus.','Tidak membedakan baca dan tulis.']),
 c('Dampaknya',['Salah paham kecil bisa jadi kerusakan besar.','Sulit memulihkan data yang terhapus.','Kamu tidak tahu apa yang tersentuh.']),
 c('Perbaikannya',['Beri akses minimum yang dibutuhkan tugas.','Mulai dari akses baca saja.','Pisahkan akun uji dari akun asli.'])],['Beri akses minimum.','Mulai dari baca saja.','Pisahkan akun uji.']),
m(K,'Tidak ada **batas langkah** dan biaya.','Agent yang tidak dibatasi bisa terus berputar.',[
 c('Gejalanya',['Agent mengulang langkah yang sama.','Tugas sederhana memakan waktu lama.','Tagihan naik tanpa hasil jelas.']),
 c('Penyebabnya',['Tidak ada kondisi berhenti.','Tidak ada batas jumlah langkah.','Tidak ada pemantau saat berjalan.']),
 p('Perbaikannya',['Tulis batas di instruksi.','Pasang batas juga di sistemmu.'],'Berhenti dan laporkan jika: sudah 10 langkah, tugas selesai, atau kamu butuh izin. Jangan mengulang langkah yang sama lebih dari 2 kali.')],['Batasi jumlah langkah.','Tulis kondisi berhenti.','Pantau saat berjalan.']),
m(K,'Instruksi **campur aduk** dalam satu paragraf.','Tujuan, aturan, dan format bertabrakan.',[
 c('Tanda instruksimu campur',['Tujuan dan aturan ada di kalimat yang sama.','Aturan muncul di beberapa tempat.','Sulit menunjuk bagian yang bermasalah.']),
 c('Akibatnya',['Agent mengabaikan sebagian aturan.','Revisi satu hal merusak hal lain.','Kamu sulit melacak penyebab salah.']),
 p('Perbaikannya',['Pisahkan jadi bagian.','Satu aturan per baris.'],'TUJUAN: ...\nKONTEKS: ...\nATURAN:\n1) ...\n2) ...\nFORMAT HASIL: ...')],['Pisahkan bagian.','Satu aturan per baris.','Mudah dilacak.']),
m(K,'Tidak menguji dengan **kasus nyata**.','Lolos satu contoh bukan berarti siap pakai.',[
 c('Kesalahannya',['Mencoba satu contoh yang mulus.','Langsung dipakai untuk pekerjaan sungguhan.','Tidak mencoba kasus aneh.']),
 c('Kenapa berbahaya',['Kasus nyata lebih berantakan dari contoh.','Kegagalan baru ketahuan setelah merugikan.','Kamu tidak tahu batas kemampuannya.']),
 c('Perbaikannya',['Kumpulkan 10 kasus: mudah, biasa, aneh.','Jalankan semua sebelum dilepas.','Catat mana yang gagal.'])],['Uji dengan banyak kasus.','Sertakan kasus aneh.','Catat yang gagal.']),
m(K,'Percaya hasil agent **tanpa memeriksa**.','Hasil rapi belum tentu benar.',[
 c('Kesalahannya',['Menyalin hasil mentah.','Menganggap yang yakin itu benar.','Tidak mengecek angka dan nama.']),
 c('Yang perlu dicek',['Angka, tanggal, dan nama.','Klaim yang butuh sumber.','Tindakan yang tidak kamu minta.']),
 c('Perbaikannya',['Minta penanda bagian yang ragu.','Cek sampel secara acak.','Jangan lepas tugas berisiko tanpa tinjauan.'])],['Periksa hasil penting.','Minta penanda ragu.','Tinjau tugas berisiko.']),
m(K,'Memberi **terlalu banyak alat** sekaligus.','Pilihan banyak membuat agent salah pilih.',[
 c('Masalahnya',['Alat yang mirip membingungkan.','Deskripsi panjang menyita ruang konteks.','Lebih sulit mencari penyebab salah.']),
 c('Gejalanya',['Agent memakai alat yang tidak pas.','Agent ragu lalu tidak melakukan apa-apa.','Hasil berbeda tiap dijalankan.']),
 c('Perbaikannya',['Mulai dari 2 atau 3 alat.','Beri deskripsi yang jelas dan berbeda.','Tambah alat satu per satu.'])],['Mulai dengan sedikit alat.','Deskripsi yang jelas.','Tambah bertahap.']),
m(K,'Tidak **mencatat log** langkah agent.','Tanpa jejak, kamu tidak bisa memperbaiki.',[
 c('Akibatnya',['Tidak tahu di langkah mana agent salah.','Tidak bisa membuktikan apa yang terjadi.','Mengulang kesalahan yang sama.']),
 c('Yang sebaiknya dicatat',['Input yang diterima.','Alat yang dipanggil beserta hasilnya.','Keputusan dan alasannya.']),
 c('Perbaikannya',['Simpan log per tugas.','Beri waktu dan nomor langkah.','Baca log saat hasil meleset.'])],['Catat tiap langkah.','Beri waktu dan nomor.','Baca saat meleset.']),
m(K,'Tugas **tanpa kriteria selesai**.','Agent tidak tahu kapan harus berhenti.',[
 c('Contoh tugas samar',['"Rapikan data ini."','"Cari info tentang topik ini."','"Buat lebih baik."']),
 c('Kenapa bermasalah',['Hasil bisa dianggap selesai terlalu cepat.','Atau tidak pernah dianggap selesai.','Kamu sulit menilainya.']),
 p('Perbaikannya',['Tulis tanda selesai.','Tulis format hasil.'],'Tugas dianggap selesai jika: [kriteria 1], [kriteria 2]. Tulis hasil dalam format: [format].')],['Tulis kriteria selesai.','Tulis format hasil.','Nilai berdasarkan kriteria.']),
m(K,'Satu agent **mengerjakan semuanya**.','Peran yang campur membuat hasil sulit dikontrol.',[
 c('Masalahnya',['Instruksi jadi panjang dan bentrok.','Satu kegagalan merusak seluruh alur.','Sulit menguji tiap bagian.']),
 c('Contoh pemisahan',['Satu peran mengumpulkan data.','Satu peran menulis draf.','Satu peran memeriksa hasil.'],'Contoh ilustrasi.'),
 c('Perbaikannya',['Pisahkan berdasarkan peran.','Uji tiap peran sendiri.','Gabungkan setelah masing-masing stabil.'])],['Satu peran satu tugas.','Uji terpisah.','Gabungkan bertahap.']),
m(K,'Menaruh **data sensitif** di prompt sembarangan.','Rapi dan cepat tidak boleh mengorbankan privasi.',[
 c('Yang sering terjadi',['Menempel data pelanggan mentah.','Menaruh kunci akses di instruksi.','Tidak tahu ke mana data dikirim.']),
 c('Risikonya',['Data bocor atau tersimpan di tempat tak terduga.','Melanggar aturan privasi.','Sulit ditarik kembali.']),
 c('Perbaikannya',['Samarkan nama dan nomor sebelum ditempel.','Simpan kunci di tempat khusus, bukan di prompt.','Baca kebijakan data layananmu.'])],['Samarkan data pribadi.','Jangan tempel kunci.','Baca kebijakan data.']),
];

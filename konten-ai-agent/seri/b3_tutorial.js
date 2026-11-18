const { c, p, pp, t, m } = require('./b3_lib.js'); const K = 'tutorial';
module.exports = [
m(K,'Agent pertamamu dalam **5 langkah**.','Konsep dasar yang berlaku untuk alat apa pun.',[
 c('Langkah 1-2',['Pilih satu tugas kecil dan berulang.','Tulis kriteria selesai.']),
 c('Langkah 3-4',['Beri satu atau dua alat saja.','Tulis instruksi dengan bagian yang rapi.']),
 c('Langkah 5',['Uji dengan 10 kasus.','Tinjau hasil sebelum dipercaya.','Baru perluas tugasnya.'])],['Mulai dari tugas kecil.','Beri alat sedikit.','Uji sebelum perluas.']),
m(K,'Cara menulis **deskripsi alat** yang jelas.','Tiga langkah sederhana.',[
 c('Langkah 1: nama dan fungsi',['Nama menjelaskan tindakan.','Fungsi dalam satu kalimat.']),
 c('Langkah 2: kapan dipakai',['Tulis kondisi pemakaian.','Tulis juga kapan jangan dipakai.']),
 c('Langkah 3: contoh',['Beri contoh masukan.','Beri contoh keluaran.','Uji dengan permintaan ambigu.'])],['Nama dan fungsi jelas.','Tulis kondisi pakai.','Beri contoh.']),
m(K,'Membuat **checkpoint persetujuan** manusia.','Agent berhenti dulu sebelum aksi penting.',[
 c('Langkah 1: tentukan aksi berisiko',['Mengirim pesan ke orang lain.','Menghapus atau mengubah data.','Mengeluarkan uang.']),
 p('Langkah 2: tulis aturannya',['Tempel di instruksi.','Sesuaikan daftar aksi.'],'Sebelum melakukan aksi berisiko (kirim pesan, ubah data, atau hapus), tampilkan rencanamu dan tunggu aku menulis "SETUJU".'),
 c('Langkah 3: uji',['Minta aksi berisiko dan lihat apakah berhenti.','Coba setujui dan tolak.','Catat hasilnya.'])],['Tentukan aksi berisiko.','Minta persetujuan.','Uji berhenti dan lanjut.']),
m(K,'Menguji agent dengan **10 kasus**.','Dari tidak menguji sampai punya set uji.',[
 c('Langkah 1: kumpulkan',['Ambil 10 permintaan nyata.','Campur mudah, biasa, aneh.']),
 c('Langkah 2: jalankan',['Jalankan semua dengan instruksi yang sama.','Simpan hasil di satu tabel.']),
 c('Langkah 3: nilai',['Tandai lolos atau gagal.','Cari pola kegagalan.','Perbaiki satu hal, ulangi.'])],['Kumpulkan 10 kasus.','Jalankan semuanya.','Nilai dan perbaiki.']),
m(K,'Cara **membatasi akses** agent.','Prinsip akses minimum, langkah demi langkah.',[
 c('Langkah 1: daftar kebutuhan',['Apa saja yang harus dibaca?','Apa saja yang harus ditulis?']),
 c('Langkah 2: potong akses',['Beri baca saja kalau cukup.','Batasi ke folder atau akun tertentu.']),
 c('Langkah 3: uji batas',['Minta agent melakukan hal di luar batas.','Pastikan ditolak.','Catat dan perketat.'])],['Daftar kebutuhan.','Potong akses.','Uji batasnya.']),
m(K,'Membuat agent **pemeriksa**.','Tambahkan mata kedua ke alurmu.',[
 c('Langkah 1: kriteria',['Tulis 3 sampai 5 kriteria yang bisa dicek.','Hindari kriteria samar seperti "bagus".']),
 c('Langkah 2: instruksi',['Minta daftar masalah beserta kutipan.','Minta tidak menulis ulang.']),
 c('Langkah 3: sambungkan',['Hasil penulis masuk ke pemeriksa.','Temuan kembali ke penulis atau ke kamu.','Batasi jumlah putaran.'])],['Tulis kriteria.','Pisahkan pemeriksa.','Batasi putaran.']),
m(K,'Alur kerja **tiga langkah** sederhana.','Mulai dari workflow sebelum agent penuh.',[
 c('Langkah 1: ambil',['Kumpulkan bahan masukan.','Contoh: daftar catatan atau email.']),
 c('Langkah 2: olah',['Model meringkas atau mengelompokkan.','Satu tugas per langkah.']),
 c('Langkah 3: keluarkan',['Hasil dalam format tetap.','Kamu tinjau sebelum dipakai.','Perbaiki langkah yang paling lemah.'])],['Ambil, olah, keluarkan.','Satu tugas per langkah.','Tinjau hasilnya.']),
m(K,'Mencatat **log** langkah agent.','Supaya salah bisa dilacak.',[
 c('Langkah 1: tentukan isi log',['Waktu dan nomor langkah.','Alat yang dipanggil.','Hasil singkat tiap langkah.']),
 p('Langkah 2: minta agent mencatat',['Tempel di instruksi.','Simpan ke berkas.'],'Di akhir tiap langkah tulis satu baris log: nomor, aksi, hasil singkat, dan alasan memilih aksi itu.'),
 c('Langkah 3: baca log',['Saat hasil meleset, mulai dari log.','Cari langkah pertama yang salah.','Perbaiki bagian itu.'])],['Tentukan isi log.','Minta pencatatan.','Baca saat meleset.']),
m(K,'Memecah **tugas besar** jadi kecil.','Supaya agent tidak kewalahan.',[
 c('Langkah 1: tulis hasil akhir',['Apa bentuk hasil akhirnya?','Siapa yang memakainya?']),
 c('Langkah 2: pecah',['Bagi jadi bagian yang bisa dicek sendiri.','Tiap bagian punya hasil jelas.']),
 c('Langkah 3: jalankan bertahap',['Kerjakan satu bagian.','Tinjau, lalu lanjut.','Simpan catatan kerja.'])],['Tulis hasil akhir.','Pecah jadi bagian.','Jalankan bertahap.']),
m(K,'Memilih **tugas pertama** untuk diotomatisasi.','Pilih yang aman dan terasa manfaatnya.',[
 c('Langkah 1: daftar tugas',['Tulis tugas berulang di minggumu.','Perkirakan waktunya.']),
 c('Langkah 2: saring',['Aturannya jelas.','Salah sedikit tidak fatal.','Hasilnya mudah dicek.']),
 c('Langkah 3: pilih satu',['Ambil yang paling sering dan paling aman.','Jalankan manual beberapa kali.','Baru otomatisasi.'])],['Daftar tugas.','Saring dengan tiga syarat.','Pilih satu.']),
m(K,'Mengevaluasi agent **tiap minggu**.','Rutinitas 15 menit supaya tetap sehat.',[
 c('Langkah 1: kumpulkan',['Lihat log dan hasil minggu ini.','Tandai kegagalan.']),
 c('Langkah 2: analisis',['Apa pola kegagalannya?','Apakah ada aturan yang usang?']),
 c('Langkah 3: perbaiki',['Ubah satu hal.','Jalankan ulang set uji.','Catat perubahannya.'])],['Kumpulkan hasil.','Cari pola.','Perbaiki satu hal.']),
];

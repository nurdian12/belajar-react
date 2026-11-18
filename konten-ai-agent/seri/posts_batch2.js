// Batch 2: 29 postingan (tanpa klaim fakta eksternal). Tips #11-20, Trik #11-19, Revisi Prompt #9-18.
const tg = ' #aiagent #claude #prompting #belajarai #aiindonesia';
const c = (h, items, note) => ({ t: 'cards', h, items, note });
const p = (h, items, prompt) => ({ t: 'prompt', h, items, prompt });
const p2 = (h, prompts) => ({ t: 'prompts2', h, prompts });
const tb = (h, cols, rows, foot) => ({ t: 'table', h, cols, rows, foot });
const mk = (kind, title, sub, s, ci, cap) => ({ kind, title, sub, s, close: { h: 'Ringkasnya:', items: ci }, caption: cap });
const tips = [
mk('tips','Tulis **tujuan akhir**, bukan langkahnya.','Agent memilih jalannya sendiri kalau tujuannya jelas.',[
 c('Langkah vs tujuan',['Langkah kaku mudah rusak saat kondisi berubah.','Tujuan jelas memberi agent ruang memilih cara.','Tetap tulis batasan yang tidak boleh dilanggar.']),
 tb('Contoh perbandingan',['','LANGKAH','TUJUAN'],[['Isi','Buka file, salin baris 3, tempel','Rangkum keluhan pelanggan minggu ini'],['Risiko','Rusak kalau format berubah','Perlu kriteria hasil']],'Contoh ilustrasi.'),
 p('Template tujuan',['Sebut hasil akhirnya.','Sebut batasannya.'],'TUJUAN: ...\nHASIL YANG DIANGGAP BENAR: ...\nBATASAN: ...')],['Tulis tujuan dulu.','Tambahkan batasan.','Sebut hasil yang dianggap benar.']),
mk('tips','Beri contoh **hasil buruk** juga.','Contoh yang salah mempersempit tebakan model.',[
 c('Kenapa contoh buruk berguna',['Model tahu apa yang harus dihindari.','Kamu tidak perlu menjelaskan panjang lebar.','Cocok untuk gaya bahasa dan format.']),
 p2('Cara menulisnya',['Contoh BENAR: [tempel hasil yang kamu suka]','Contoh SALAH: [tempel hasil yang tidak kamu mau], karena [alasan singkat].']),
 c('Jaga tetap singkat',['Satu contoh benar, satu contoh salah.','Beri alasan satu kalimat.','Jangan tempel lebih dari dua pasang.'])],['Beri contoh benar.','Beri contoh salah.','Tulis alasan singkat.']),
mk('tips','Pisahkan **fakta** dan asumsi.','Biar agent tidak mengarang di bagian yang kosong.',[
 c('Masalahnya',['Bagian yang kosong sering diisi tebakan.','Tebakan terdengar yakin, padahal belum tentu benar.','Kamu sulit membedakannya saat membaca.']),
 p('Minta pemisahan',['Pisahkan dua daftar.','Cek asumsinya sendiri.'],'Tulis jawabanmu dalam dua bagian: FAKTA (dari data yang kuberikan) dan ASUMSI (tebakanmu). Beri tanda kalau ada yang belum ada datanya.'),
 c('Tindak lanjut',['Verifikasi asumsi penting.','Lengkapi data yang kurang.','Minta ulang dengan data baru.'])],['Pisahkan fakta dan asumsi.','Verifikasi asumsi penting.','Lengkapi data lalu ulangi.']),
mk('tips','Minta agent **bertanya dulu** sebelum mulai.','Satu pertanyaan di awal menghemat tiga revisi.',[
 c('Kapan cocok',['Tugasnya punya banyak kemungkinan arah.','Kamu belum yakin semua detailnya.','Hasilnya mahal kalau salah.']),
 p('Kalimatnya',['Tempel di akhir prompt.','Batasi jumlah pertanyaan.'],'Sebelum mulai, ajukan maksimal 3 pertanyaan yang paling menentukan hasil. Tunggu jawabanku dulu.'),
 c('Jawab dengan singkat',['Jawab per nomor.','Tulis "terserah" kalau memang bebas.','Lanjutkan setelah semua terjawab.'])],['Minta tiga pertanyaan.','Jawab per nomor.','Lanjutkan setelah jelas.']),
mk('tips','Mulai dari tugas **kecil dan berulang**.','Hasilnya gampang dicek, manfaatnya terasa cepat.',[
 c('Ciri tugas yang pas',['Dikerjakan berulang tiap minggu.','Aturannya jelas.','Salah sedikit tidak fatal.']),
 c('Contoh tugas',['Merapikan catatan rapat jadi poin.','Menyusun draf balasan pesan rutin.','Mengelompokkan daftar ide.'],'Contoh ilustrasi.'),
 c('Naikkan bertahap',['Jalankan manual beberapa kali dulu.','Catat bagian yang sering salah.','Baru tambahkan otomatisasi.'])],['Pilih tugas berulang.','Cek hasilnya manual.','Otomatiskan bertahap.']),
mk('tips','Tentukan **kapan agent harus berhenti**.','Tanpa titik berhenti, agent bisa terus mencoba.',[
 c('Tiga batas yang berguna',['Batas jumlah langkah.','Batas waktu atau biaya.','Kondisi sukses yang jelas.']),
 p('Contoh kalimat',['Tempel di prompt.','Sesuaikan angkanya.'],'Berhenti dan laporkan kalau: (1) sudah 10 langkah, (2) hasil sudah memenuhi [kriteria], atau (3) kamu butuh izin untuk aksi di luar tugas ini.'),
 c('Saat berhenti',['Minta ringkasan apa yang sudah dilakukan.','Minta daftar yang belum selesai.','Putuskan sendiri langkah berikutnya.'])],['Batasi langkah.','Tulis kondisi sukses.','Minta laporan saat berhenti.']),
mk('tips','**Simpan** prompt yang berhasil.','Prompt bagus yang hilang itu sayang.',[
 c('Kenapa perlu',['Kamu tidak mulai dari nol lagi.','Kamu bisa membandingkan versi.','Bisa dibagikan ke tim atau teman.']),
 tb('Contoh catatan',['NAMA','KAPAN DIPAKAI','VERSI'],[['Ringkas rapat','Setelah rapat mingguan','V3'],['Balas pelanggan','Keluhan harga','V2']],'Contoh ilustrasi.'),
 c('Kebiasaan kecil',['Simpan di Notes atau spreadsheet.','Tulis kapan prompt itu cocok.','Perbarui saat kamu merevisi.'])],['Simpan prompt yang berhasil.','Catat kapan dipakai.','Perbarui tiap revisi.']),
mk('tips','Cek hasil pakai **checklist**.','Cepat, konsisten, tidak bergantung perasaan.',[
 c('Isi checklist dasar',['Sesuai permintaan?','Format benar?','Ada klaim yang perlu dicek sumbernya?']),
 p('Minta agent memakainya',['Biar agent memeriksa dirinya.','Tetap cek sendiri bagian penting.'],'Sebelum menjawab, cek jawabanmu dengan daftar ini: sesuai tujuan, format benar, tidak ada klaim tanpa dasar. Tulis hasil ceknya di akhir.'),
 c('Sesuaikan',['Tambah poin dari kesalahan lama.','Hapus poin yang tidak pernah relevan.','Pakai daftar yang sama berulang.'])],['Buat checklist pendek.','Minta agent memakainya.','Tambah poin dari kesalahan lama.']),
mk('tips','Satu **sumber data** yang disepakati.','Biar agent tidak menggabungkan data yang saling bentrok.',[
 c('Masalah umum',['Dua dokumen berisi angka berbeda.','Agent memilih salah satu tanpa bilang.','Hasilnya tampak rapi tapi keliru.']),
 p('Aturan sumber',['Sebut sumber utama.','Minta lapor kalau bentrok.'],'Pakai dokumen [A] sebagai sumber utama. Kalau ada data yang berbeda di dokumen lain, jangan pilih sendiri. Laporkan perbedaannya.'),
 c('Rawat sumbernya',['Perbarui satu tempat saja.','Beri tanggal pada dokumen.','Hapus versi lama.'])],['Tetapkan sumber utama.','Minta lapor bentrok.','Rawat satu sumber.']),
mk('tips','Tinjau ulang prompt **seminggu sekali**.','Lima menit untuk membuang aturan yang sudah usang.',[
 c('Yang dicek',['Aturan yang sudah tidak relevan.','Aturan yang saling bertentangan.','Bagian yang sering diabaikan model.']),
 tb('Contoh catatan tinjauan',['ATURAN','STATUS','TINDAKAN'],[['Maks 100 kata','Masih dipakai','Pertahankan'],['Pakai emoji','Bentrok dengan nada formal','Hapus']],'Contoh ilustrasi.'),
 c('Jadikan rutinitas',['Pilih hari tetap.','Revisi satu hal saja.','Catat perubahannya.'])],['Jadwalkan tinjauan.','Hapus aturan usang.','Catat perubahannya.']),
];
const trik = [
mk('trik','Minta **3 versi**, pilih satu.','Membandingkan lebih mudah daripada menebak.',[
 c('Kenapa efektif',['Kamu melihat variasi sekaligus.','Kamu tahu arah mana yang cocok.','Revisi berikutnya lebih terarah.']),
 p('Kalimatnya',['Tentukan perbedaan antarversi.','Pilih satu lalu revisi.'],'Buat 3 versi dengan nada berbeda: santai, netral, dan tegas. Beri label A, B, C.'),
 c('Setelah memilih',['Sebut versi yang kamu pilih.','Sebut bagian yang masih kurang.','Minta penyempurnaan satu versi itu.'])],['Minta tiga versi.','Pilih satu.','Revisi yang terpilih.']),
mk('trik','Minta agent **mengkritik** hasilnya sendiri.','Putaran kedua sering menangkap kekurangan putaran pertama.',[
 c('Alurnya',['Minta hasil pertama.','Minta daftar kekurangannya.','Minta versi yang diperbaiki.']),
 p('Kalimat kritik',['Tempel setelah hasil pertama.','Minta kritik yang spesifik.'],'Kritik jawabanmu tadi: sebutkan 3 kelemahan paling serius, lalu buat versi yang memperbaikinya.'),
 c('Catatan',['Tetap baca hasil akhirnya.','Kritik tidak selalu benar.','Hentikan setelah satu atau dua putaran.'])],['Minta kritik.','Minta versi perbaikan.','Tetap cek sendiri.']),
mk('trik','Pakai **peran** untuk ganti sudut pandang.','Satu naskah, tiga pembaca berbeda.',[
 c('Contoh peran',['Pembaca pemula yang belum paham istilah.','Atasan yang hanya punya satu menit.','Editor yang teliti.']),
 p('Kalimatnya',['Sebut perannya.','Minta masukan, bukan tulis ulang.'],'Baca teks ini sebagai [peran]. Sebutkan 3 bagian yang membingungkan atau terlalu panjang. Jangan tulis ulang dulu.'),
 c('Gunakan hasilnya',['Pilih masukan yang masuk akal.','Revisi teksnya sendiri.','Ulangi dengan peran lain.'])],['Pilih satu peran.','Minta masukan.','Revisi sendiri.']),
mk('trik','Minta format **tabel** untuk perbandingan.','Lebih cepat dibaca daripada paragraf panjang.',[
 c('Cocok untuk',['Membandingkan dua atau tiga pilihan.','Daftar kelebihan dan kekurangan.','Ringkasan data per kategori.']),
 p('Kalimatnya',['Sebut kolomnya.','Batasi jumlah baris.'],'Bandingkan [A] dan [B] dalam tabel dengan kolom: aspek, [A], [B]. Maksimal 5 baris, tiap sel di bawah 10 kata.'),
 c('Tips',['Sebutkan kolom yang kamu mau.','Minta satu baris kesimpulan.','Salin ke spreadsheet kalau perlu.'])],['Sebut kolom.','Batasi baris.','Minta satu kesimpulan.']),
mk('trik','Tempel **contoh tulisanmu** sendiri.','Gaya bahasamu lebih mudah ditiru daripada dijelaskan.',[
 c('Alurnya',['Pilih 2 atau 3 tulisan terbaikmu.','Tempel di awal prompt.','Minta meniru gaya, bukan isinya.']),
 p('Kalimatnya',['Jangan lupa batasi peniruan.','Minta penjelasan gaya dulu.'],'Berikut contoh tulisanku: [tempel]. Jelaskan ciri gayanya dalam 3 poin, lalu tulis [topik] dengan gaya yang sama.'),
 c('Periksa',['Apakah terdengar seperti kamu?','Apakah isinya akurat?','Sunting bagian yang kaku.'])],['Tempel contohmu.','Minta ciri gaya.','Sunting hasilnya.']),
mk('trik','Minta **ringkasan dulu**, baru detail.','Kamu bisa menghentikan arah yang salah lebih awal.',[
 c('Kenapa',['Jawaban panjang yang salah arah memakan waktu.','Ringkasan 3 baris cepat dibaca.','Kamu bisa menyetujui sebelum dikembangkan.']),
 p('Kalimatnya',['Dua tahap dalam satu prompt.','Tunggu persetujuanmu.'],'Beri ringkasan 3 poin pendekatanmu dulu. Tunggu aku setuju, baru tulis versi lengkapnya.'),
 c('Setelah setuju',['Minta pengembangan poin per poin.','Minta panjang yang kamu inginkan.','Revisi per bagian.'])],['Minta ringkasan.','Setujui arahnya.','Kembangkan per bagian.']),
mk('trik','Pakai **batas kata** yang tegas.','Angka lebih jelas daripada "singkat saja".',[
 c('Lebih jelas dengan angka',['"Singkat" artinya beda untuk tiap orang.','"Maksimal 80 kata" bisa dicek.','Sebut juga jumlah poin.']),
 tb('Contoh',['KALIMAT SAMAR','KALIMAT TEGAS'],[['Buat yang singkat','Maksimal 80 kata'],['Beberapa poin','Tepat 3 poin'],['Bahasa santai','Kalimat di bawah 15 kata']],'Contoh ilustrasi.'),
 c('Kalau melenceng',['Sebut selisihnya: "lebih 30 kata".','Minta pangkas bagian tertentu.','Hitung ulang sendiri.'])],['Pakai angka.','Sebut jumlah poin.','Koreksi dengan selisih.']),
mk('trik','Tanya **"apa yang kamu tidak yakin?"**','Cara cepat menemukan bagian yang perlu dicek.',[
 c('Kenapa berguna',['Model tidak selalu memberi tanda ragu.','Pertanyaan ini memancing penandaan.','Kamu tahu apa yang perlu diverifikasi.']),
 p('Kalimatnya',['Tempel setelah jawaban.','Minta urut dari yang paling berisiko.'],'Dari jawabanmu tadi, bagian mana yang paling kamu tidak yakin atau mungkin keliru? Urutkan dari yang paling berisiko.'),
 c('Lanjutannya',['Cek bagian itu lewat sumber lain.','Minta revisi setelah dicek.','Jangan anggap daftar itu lengkap.'])],['Tanya bagian yang ragu.','Verifikasi sendiri.','Revisi setelahnya.']),
mk('trik','Tandai bagian yang **boleh diganti**.','Template yang rapi bisa dipakai berulang.',[
 c('Idenya',['Tulis bagian tetap sebagai teks biasa.','Tulis bagian variabel dalam [kurung].','Isi kurung tiap kali memakai.']),
 p('Contoh template',['Ganti isi kurung saja.','Simpan sebagai template.'],'Tulis email ke [nama] tentang [topik]. Nada: [nada]. Maksimal [N] kalimat. Akhiri dengan ajakan [aksi].'),
 c('Rawat template',['Beri nama yang jelas.','Simpan di satu tempat.','Perbarui kalau sering direvisi.'])],['Tandai bagian variabel.','Simpan sebagai template.','Perbarui rutin.']),
];
const rev = [
mk('revisi','Hasilnya **salah format**? Begini perbaikannya.','Tunjuk bentuk yang kamu mau, jangan hanya bilang "salah".',[
 c('Penyebab umum',['Format yang kamu mau belum disebut.','Contoh format tidak ada.','Aturan format tertimbun di tengah prompt.']),
 p2('Dua kalimat revisi',['Ubah ke format tabel dengan kolom [A], [B], [C]. Isi tetap sama.','Ikuti persis format contoh ini: [tempel contoh]. Jangan tambahkan bagian lain.']),
 c('Cegah ke depannya',['Taruh format di akhir prompt.','Beri satu contoh.','Simpan versi yang berhasil.'])],['Sebut format yang kamu mau.','Beri satu contoh.','Simpan versi yang berhasil.']),
mk('revisi','Hasil terlalu panjang? **3 cara** memangkasnya.','Kalimat revisi yang bisa dicoba.',[
 c('Tiga cara',['Beri batas angka.','Sebut bagian yang boleh dibuang.','Minta ringkasan berlapis.']),
 p2('Salin-tempel',['Pangkas jadi maksimal [N] kata. Pertahankan angka, nama, dan kesimpulan.','Hapus pembuka dan penutup basa-basi. Sisakan isinya saja.']),
 c('Yang perlu dijaga',['Jangan buang angka penting.','Cek apakah makna berubah.','Simpan versi panjangnya.'])],['Beri batas angka.','Buang basa-basi.','Cek maknanya.']),
mk('revisi','Saat AI **mengarang**: minta batas dan bukti.','Revisi supaya model mengaku tidak tahu.',[
 c('Tanda jawaban mengarang',['Terlalu rinci tanpa sumber.','Nama atau angka yang tidak kamu berikan.','Tidak pernah bilang "tidak tahu".']),
 p('Kalimat revisi',['Beri izin untuk tidak tahu.','Minta penanda bagian tebakan.'],'Jawab hanya dari data yang kuberikan. Kalau datanya tidak ada, tulis "tidak ada di data". Tandai bagian yang kamu tebak.'),
 c('Tetap cek sendiri',['Verifikasi angka penting.','Cek nama dan tanggal.','Jangan menyalin mentah.'])],['Beri izin bilang tidak tahu.','Minta penanda tebakan.','Verifikasi sendiri.']),
mk('revisi','Revisi **nada**: dari kaku jadi santai.','Tiga kalimat yang bisa kamu tempel.',[
 p2('Ubah nada',['Ubah nadanya jadi santai dan ramah, tapi tetap sopan. Isi jangan berubah.','Ganti istilah teknis dengan kata sehari-hari. Beri contoh di tempat yang perlu.']),
 p2('Kalau terlalu santai',['Nadanya terlalu santai. Buat lebih rapi dan profesional, tanpa terdengar kaku.','Pertahankan kalimat pendek. Hapus kata gaul dan emoji.']),
 c('Cara menilai',['Baca keras-keras.','Apakah terdengar seperti kamu?','Sunting satu dua kata sendiri.'])],['Sebut nada yang diinginkan.','Pertahankan isi.','Baca keras-keras.']),
mk('revisi','Kapan sebaiknya **mulai chat baru**?','Kadang mengulang bersih lebih cepat daripada menambal.',[
 c('Tanda perlu chat baru',['Hasil makin melenceng setelah banyak revisi.','Aturan lama bentrok dengan aturan baru.','Kamu sendiri bingung versi mana yang aktif.']),
 p('Cara pindah',['Minta rangkuman dulu.','Tempel di chat baru.'],'Rangkum tujuan, aturan yang berlaku sekarang, dan hasil terbaik sejauh ini dalam satu prompt yang bisa kupakai di percakapan baru.'),
 c('Setelah pindah',['Mulai dari rangkuman itu.','Revisi satu hal sekali jalan.','Simpan versi terbaik.'])],['Kenali tanda melenceng.','Minta rangkuman.','Mulai bersih.']),
mk('revisi','Revisi dengan **contoh sebelum dan sesudah**.','Menunjukkan lebih jelas daripada menjelaskan.',[
 c('Idenya',['Tempel hasil yang kurang pas.','Tulis versi yang kamu mau.','Minta model meniru polanya.']),
 p('Template',['Satu pasang contoh sudah cukup.','Beri alasan satu kalimat.'],'SEBELUM: [hasil kurang pas]\nSESUDAH: [versi yang kuinginkan]\nALASAN: [satu kalimat]\nTerapkan pola yang sama ke: [teks baru]'),
 c('Tips',['Pilih contoh yang mewakili.','Jangan ubah banyak hal sekaligus.','Simpan pasangan contoh yang bagus.'])],['Tulis sebelum dan sesudah.','Beri alasan.','Simpan pasangannya.']),
mk('revisi','Cara **membaca** hasil yang meleset.','Diagnosis dulu, revisi belakangan.',[
 tb('Gejala dan perbaikan',['GEJALA','KEMUNGKINAN','REVISI'],[['Terlalu umum','Konteks kurang','Tambah konteks'],['Format salah','Format belum disebut','Beri contoh format'],['Mengarang','Data tidak cukup','Beri data, izinkan "tidak tahu"']],'Pola umum dari pengalaman, bukan aturan mutlak.'),
 c('Langkah diagnosis',['Baca hasilnya dengan tenang.','Tentukan satu jenis masalah.','Ubah satu hal yang sesuai.']),
 c('Hindari',['Menulis ulang semuanya.','Menambah "PENTING!!!".','Mengulang tanpa mengubah apa pun.'])],['Diagnosis dulu.','Tentukan satu masalah.','Revisi satu hal.']),
mk('revisi','Prompt revisi untuk **tulisan konten**.','Untuk caption, naskah, atau artikel.',[
 p2('Kalimat siap pakai',['Bagian pembukanya lemah. Tulis 3 alternatif pembuka yang langsung menyebut masalah pembaca.','Hapus kalimat yang tidak menambah informasi. Pertahankan contoh dan angka.']),
 p2('Untuk penutup',['Ganti penutupnya dengan satu ajakan yang jelas dan tidak memaksa.','Beri 3 pilihan pertanyaan penutup yang mengundang komentar.']),
 c('Aturan sederhana',['Revisi satu bagian per putaran.','Pilih sendiri versi terbaik.','Baca ulang sebelum posting.'])],['Revisi per bagian.','Minta beberapa alternatif.','Baca ulang sebelum posting.']),
mk('revisi','Revisi untuk **hasil kode**: 3 kalimat awal.','Berlaku sebagai pola umum, sesuaikan dengan proyekmu.',[
 p2('Saat ada error',['Ini pesan error-nya: [tempel]. Jelaskan penyebab paling mungkin sebelum mengubah kode.','Ubah hanya fungsi [nama]. Jangan sentuh bagian lain.']),
 p2('Saat hasilnya melenceng',['Kode ini jalan, tapi perilakunya beda dari yang kuminta: [jelaskan]. Perbaiki bagian yang terkait saja.','Tulis tes sederhana untuk membuktikan perbaikannya.']),
 c('Kebiasaan baik',['Jalankan dan cek sendiri.','Simpan versi yang jalan.','Minta perubahan kecil per putaran.'])],['Tempel pesan error.','Batasi bagian yang diubah.','Uji tiap perubahan.']),
mk('revisi','Rutinitas revisi prompt **10 menit**.','Cara singkat supaya revisi tidak berantakan.',[
 tb('Pembagian waktu',['MENIT','KEGIATAN'],[['0-2','Tulis tujuan dan hasil yang diharapkan'],['2-5','Jalankan V1, baca hasilnya'],['5-8','Revisi satu hal, jalankan V2'],['8-10','Catat versi terbaik']],'Contoh jadwal yang bisa kamu ubah.'),
 c('Aturan main',['Satu revisi, satu perubahan.','Maksimal beberapa putaran.','Berhenti kalau hasil sudah cukup.']),
 c('Setelah selesai',['Simpan prompt terbaik.','Tulis pelajarannya satu kalimat.','Pakai lagi minggu depan.'])],['Tentukan tujuan.','Revisi satu hal.','Simpan yang terbaik.']),
];
module.exports = { tips, trik, rev };

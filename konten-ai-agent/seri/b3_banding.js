const { c, p, pp, t, m } = require('./b3_lib.js'); const K = 'banding';
const IL = 'Perbandingan umum, bukan hasil pengukuran.';
module.exports = [
m(K,'**Workflow** vs agent.','Kapan memilih yang mana.',[
 t('Perbedaan utama',['ASPEK','WORKFLOW','AGENT'],[['Alur','Tetap, sudah ditentukan','Dipilih model saat jalan'],['Mudah diuji','Lebih mudah','Lebih sulit'],['Cocok untuk','Tugas yang pasti','Tugas yang bervariasi']],IL),
 c('Pilih workflow kalau',['Langkahnya selalu sama.','Kamu butuh hasil yang konsisten.','Biaya dan risiko harus rendah.']),
 c('Pilih agent kalau',['Jalurnya berbeda tiap kasus.','Perlu memilih alat sendiri.','Kamu siap menguji dan memantau.'])],['Alur pasti: workflow.','Alur bervariasi: agent.','Mulai dari yang sederhana.']),
m(K,'**Satu agent** vs banyak agent.','Lebih banyak tidak selalu lebih baik.',[
 t('Perbandingan',['ASPEK','SATU AGENT','BANYAK AGENT'],[['Sederhana','Ya','Lebih rumit'],['Pemisahan peran','Tidak ada','Jelas'],['Pelacakan salah','Mudah','Lebih sulit']],IL),
 c('Satu agent cocok',['Tugas masih kecil.','Kamu baru mulai.','Peran tidak saling bentrok.']),
 c('Banyak agent cocok',['Tugas punya tahap berbeda.','Perlu pemeriksa terpisah.','Kamu sudah punya pengujian.'])],['Mulai dari satu.','Pisahkan saat peran bentrok.','Siapkan pengujian.']),
m(K,'Otomatis penuh vs **persetujuan manusia**.','Kecepatan lawan keamanan.',[
 t('Perbandingan',['ASPEK','OTOMATIS PENUH','PERSETUJUAN'],[['Kecepatan','Paling cepat','Lebih lambat'],['Risiko salah','Lebih tinggi','Lebih rendah'],['Cocok untuk','Aksi mudah dibatalkan','Aksi penting']],IL),
 c('Otomatis penuh cocok',['Aksi mudah dibatalkan.','Dampak salah kecil.','Sudah teruji berulang.']),
 c('Pakai persetujuan untuk',['Mengirim ke orang lain.','Mengubah atau menghapus data.','Hal yang melibatkan uang.'])],['Otomatis untuk aksi ringan.','Persetujuan untuk aksi penting.','Longgarkan setelah teruji.']),
m(K,'Prompt **panjang** vs terstruktur.','Panjang belum tentu jelas.',[
 t('Perbandingan',['ASPEK','PANJANG','TERSTRUKTUR'],[['Mudah dibaca','Sulit','Mudah'],['Mudah direvisi','Sulit','Mudah'],['Mudah dilacak','Sulit','Mudah']],IL),
 c('Ciri prompt terstruktur',['Bagian terpisah dan berlabel.','Satu aturan per baris.','Format hasil ditulis jelas.']),
 c('Kapan panjang tidak apa-apa',['Isinya memang banyak konteks.','Bagiannya tetap rapi.','Kamu bisa menunjuk tiap aturan.'])],['Rapi lebih penting dari panjang.','Pisahkan bagian.','Satu aturan per baris.']),
m(K,'**Chatbot** vs agent.','Dua hal yang sering dianggap sama.',[
 t('Perbedaan',['ASPEK','CHATBOT','AGENT'],[['Tugas','Menjawab pesan','Mengerjakan tugas'],['Alat','Biasanya tanpa alat','Memakai alat'],['Langkah','Satu giliran','Beberapa langkah']],IL),
 c('Chatbot cocok untuk',['Tanya jawab.','Menulis dan merangkum.','Hal yang cukup satu jawaban.']),
 c('Agent cocok untuk',['Tugas beberapa langkah.','Perlu membaca atau menulis ke alat.','Perlu memilih tindakan.'])],['Jawab: chatbot.','Kerjakan: agent.','Pilih sesuai tugas.']),
m(K,'**Agent** vs skrip biasa.','Tidak semua hal perlu model.',[
 t('Perbandingan',['ASPEK','SKRIP BIASA','AGENT'],[['Hasil','Selalu sama','Bisa bervariasi'],['Mengerti bahasa','Tidak','Ya'],['Biaya jalan','Rendah','Lebih tinggi']],IL),
 c('Skrip cocok kalau',['Aturannya pasti.','Datanya terstruktur.','Kamu butuh hasil identik.']),
 c('Agent cocok kalau',['Masukannya bahasa bebas.','Perlu menafsirkan maksud.','Aturan tidak bisa ditulis habis.'])],['Pasti: skrip.','Bahasa bebas: agent.','Gabungkan keduanya.']),
m(K,'Memori **percakapan** vs catatan eksternal.','Dua cara agent mengingat.',[
 t('Perbandingan',['ASPEK','PERCAKAPAN','CATATAN'],[['Bertahan','Selama sesi','Antar sesi'],['Bisa kamu tinjau','Terbatas','Mudah'],['Risiko lupa','Lebih tinggi','Lebih rendah']],IL),
 c('Percakapan cukup untuk',['Tugas singkat.','Sekali selesai.','Tidak perlu diulang.']),
 c('Catatan lebih baik untuk',['Tugas panjang.','Dikerjakan berkali-kali.','Butuh jejak yang bisa diaudit.'])],['Tugas singkat: percakapan.','Tugas panjang: catatan.','Tinjau catatannya.']),
m(K,'Tugas **cocok** dan tidak cocok untuk agent.','Panduan memilih tugas pertama.',[
 t('Perbandingan',['','COCOK','BELUM COCOK'],[['Aturan','Jelas','Samar'],['Dampak salah','Kecil','Besar'],['Cek hasil','Mudah','Sulit']],IL),
 c('Contoh cocok',['Merapikan catatan.','Mengelompokkan ide.','Menyusun draf balasan.'],'Contoh ilustrasi.'),
 c('Contoh belum cocok',['Keputusan keuangan tanpa tinjauan.','Pesan sensitif tanpa persetujuan.','Hal yang tidak bisa dibatalkan.'],'Contoh ilustrasi.')],['Pilih aturan jelas.','Pilih dampak kecil.','Pilih yang mudah dicek.']),
m(K,'Uji **manual** vs uji otomatis.','Mulai dari yang bisa kamu kerjakan hari ini.',[
 t('Perbandingan',['ASPEK','MANUAL','OTOMATIS'],[['Mulai','Langsung','Perlu disiapkan'],['Skala','Kecil','Besar'],['Konsisten','Bergantung kamu','Lebih konsisten']],IL),
 c('Manual cocok untuk',['Tahap awal.','Kasus yang masih berubah.','Menemukan masalah baru.']),
 c('Otomatis cocok untuk',['Kasus yang sudah stabil.','Dijalankan sering.','Mencegah kemunduran.'])],['Mulai manual.','Otomatiskan yang stabil.','Gabungkan keduanya.']),
m(K,'Alat **sedikit** vs alat banyak.','Pilihan memengaruhi akurasi pemilihan.',[
 t('Perbandingan',['ASPEK','SEDIKIT','BANYAK'],[['Pemilihan alat','Lebih mudah','Lebih sulit'],['Kemampuan','Terbatas','Luas'],['Pelacakan','Mudah','Lebih rumit']],IL),
 c('Sedikit cocok untuk',['Tahap awal.','Tugas yang sempit.','Pengujian yang mudah.']),
 c('Banyak cocok untuk',['Tugas yang beragam.','Deskripsi alat sudah jelas.','Kamu sudah terbiasa memantau.'])],['Mulai sedikit.','Tambah bertahap.','Jaga deskripsi tetap jelas.']),
m(K,'Agent **cepat** vs agent hati-hati.','Dua gaya yang berbeda.',[
 t('Perbandingan',['ASPEK','CEPAT','HATI-HATI'],[['Waktu','Singkat','Lebih lama'],['Pemeriksaan','Minim','Berlapis'],['Cocok untuk','Aksi ringan','Aksi penting']],IL),
 c('Cepat cocok untuk',['Draf awal.','Aksi mudah dibatalkan.','Tugas yang akan kamu tinjau.']),
 c('Hati-hati cocok untuk',['Aksi yang tidak bisa ditarik.','Data penting.','Hasil yang langsung dipakai.'])],['Sesuaikan dengan risiko.','Cepat untuk draf.','Hati-hati untuk aksi penting.']),
];

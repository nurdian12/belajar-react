// Gaya "tweet + skrip": slide teks polos dan slide KONDISI / JANGAN / TULIS. Contoh isi AI agent (tanpa klaim hasil).
module.exports = [
{ id: 37, name: 'alam nurdiann', handle: '@alamnurdiann', slides: [
 { t: 'teks', p: ['Kamu suruh agent "rapikan data ini", hasilnya beda dari maumu?', 'Belum tentu agent-nya yang error. Bisa jadi instruksinya belum bilang kapan tugas dianggap selesai. Coba tulis kayak gini.'] },
 { t: 'skrip', kondisi: 'Bentuk hasil belum jelas', jangan: 'Rapikan data ini.', tulis: ['Rapikan data ini jadi tabel: nama, tugas, tenggat.', 'Satu baris per tugas.'] },
 { t: 'skrip', kondisi: 'Agent berhenti terlalu cepat', jangan: 'Lanjutkan lagi.', tulis: ['Tugas selesai kalau semua baris punya tenggat.', 'Cek dulu, lalu sebut yang belum.'] },
 { t: 'skrip', kondisi: 'Datanya tidak lengkap', jangan: 'Isi sebisanya.', tulis: ['Kalau datanya tidak ada, tulis "belum jelas".', 'Jangan menebak.'] },
 { t: 'skrip', kondisi: 'Agent mengulang terus', jangan: 'Coba lagi sampai benar.', tulis: ['Berhenti setelah 3 percobaan.', 'Laporkan bagian yang belum terpenuhi.'] },
 { t: 'teks', p: ['Intinya: agent butuh tanda selesai.', 'Simpan dan coba di tugasmu. Komen AGENT kalau mau paket template-nya.'] },
] },
{ id: 10, name: 'alam nurdiann', handle: '@alamnurdiann', slides: [
 { t: 'teks', p: ['Pelanggan tanya jam buka, agent langsung balas, ternyata jamnya salah?', 'Itu belum tentu tanda agent tidak berguna. Bisa jadi ia belum punya panduan dan belum dikasih pagar. Coba atur kayak gini.'] },
 { t: 'skrip', kondisi: 'Pertanyaan ada di panduan', jangan: 'Jawab saja sebisanya.', tulis: ['Jawab hanya dari panduan ini: [tempel].', 'Tulis sebagai draf, jangan kirim.'] },
 { t: 'skrip', kondisi: 'Pelanggan minta diskon', jangan: 'Kasih saja biar cepat.', tulis: ['Jangan menjanjikan diskon.', 'Tulis: "Aku cek dulu ke tim ya."'] },
 { t: 'skrip', kondisi: 'Pertanyaan tidak ada di panduan', jangan: 'Perkirakan jawabannya.', tulis: ['Tulis "perlu dicek manusia".', 'Lalu berhenti.'] },
 { t: 'skrip', kondisi: 'Sebelum dikirim', jangan: 'Kirim otomatis biar hemat waktu.', tulis: ['Aku baca drafnya, edit, lalu aku yang kirim.'] },
 { t: 'teks', p: ['Draf dulu, kirim belakangan.', 'Simpan buat dipakai. Komen AGENT kalau mau template-nya.'] },
] },
];

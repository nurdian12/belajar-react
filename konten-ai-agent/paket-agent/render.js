// Hadiah AGENT: PDF template + checklist.  node render.js -> Paket-AGENT-alamnurdiann.pdf
const { chromium } = require('playwright'); const fs = require('fs'), path = require('path');
const esc = s => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const T = (no, title, use, text) => `<section class="blk"><div class="no">${no}</div><h2>${title}</h2><p class="use">${use}</p><pre>${esc(text)}</pre></section>`;
const CK = (no, title, items, note) => `<section class="blk"><div class="no">${no}</div><h2>${title}</h2><ul class="ck">${items.map(i => `<li><span></span>${esc(i)}</li>`).join('')}</ul>${note ? `<p class="use">${note}</p>` : ''}</section>`;
const body = [
 T('01', 'Brief tugas untuk agent', 'Anggap agent sebagai karyawan baru. Isi semua bagian, lalu simpan versi yang berhasil.', 'TUGAS: [apa yang harus dikerjakan]\nLATAR BELAKANG: [konteks singkat]\nHASIL YANG DIHARAPKAN: [bentuk dan panjang]\nYANG BOLEH DILAKUKAN: [daftar]\nYANG TIDAK BOLEH: [daftar]\nKALAU RAGU: tanya aku dulu.'),
 T('02', 'Instruksi sistem: agent riset', 'Untuk agent yang merangkum bahan yang kamu berikan.', 'PERAN: asisten riset untuk [audiens].\nTUJUAN: kumpulkan informasi tentang [topik].\nATURAN:\n1) Tulis hanya yang ada di sumber yang kuberikan.\n2) Kalau tidak ada datanya, tulis "tidak ada di data".\n3) Tandai bagian yang kamu tebak.\nFORMAT HASIL:\n- Ringkasan 3 poin\n- Hal yang belum jelas\n- Pertanyaan lanjutan untukku'),
 T('03', 'Aturan izin', 'Pagar sederhana. Mulai ketat, longgarkan setelah terbukti aman.', 'BOLEH: membaca file di folder [A], menulis draf di folder [B].\nTIDAK BOLEH: menghapus file, mengirim pesan ke orang lain, mengubah pengaturan.\nBUTUH IZIN DULU: apa pun di luar daftar BOLEH.\nSebelum aksi berisiko, tampilkan rencanamu dan tunggu aku menulis "SETUJU".'),
 T('04', 'Laporan akhir agent', 'Tempel di akhir instruksi supaya hasilnya mudah ditinjau.', 'Setelah selesai, buat laporan:\n1) YANG DIKERJAKAN\n2) YANG BELUM SELESAI dan alasannya\n3) KEPUTUSAN YANG KUBUTUHKAN\nMaksimal 150 kata.'),
 T('05', 'Catatan kerja', 'Untuk tugas panjang. Minta agent memperbaruinya tiap selesai satu bagian.', 'CATATAN KERJA\nTUJUAN: ...\nSUDAH SELESAI: ...\nSEDANG DIKERJAKAN: ...\nKEPUTUSAN PENTING: ...\nLANGKAH BERIKUTNYA: ...'),
 T('06', 'Agent pemeriksa', 'Mata kedua sebelum kamu menerima hasil. Temuan tetap kamu tinjau sendiri.', 'Periksa hasil berikut dengan kriteria: [kriteria].\nDaftar semua masalah beserta kutipan bagian yang bermasalah.\nKalau tidak ada masalah, tulis "tidak ditemukan masalah".\nJangan menulis ulang.'),
 T('07', 'Deskripsi alat', 'Satu blok per alat. Deskripsi jelas membantu agent memilih alat yang tepat.', 'NAMA: [cari_dokumen]\nFUNGSI: [satu kalimat]\nPAKAI KETIKA: [kondisi]\nJANGAN PAKAI KETIKA: [kondisi]\nMASUKAN: [parameter]\nCONTOH: [satu contoh]'),
 T('08', 'Agent bertanya saat ragu', 'Satu pertanyaan di awal menghemat beberapa revisi.', 'Kalau informasi penting belum jelas atau ada lebih dari satu tafsiran, tanyakan satu pertanyaan singkat sebelum bertindak.\nJangan bertanya untuk hal yang bisa kamu simpulkan sendiri.'),
 T('09', '10 kasus uji', 'Minta model membuat kasus uji, lalu periksa sebelum dipakai.', 'Buat 10 kasus uji untuk agent yang tugasnya [tugas]: 4 biasa, 3 kasus tepi (kosong, panjang, aneh), 3 permintaan yang sengaja salah atau melanggar aturan.\nUntuk tiap kasus tulis hasil yang diharapkan.'),
 CK('10', 'Checklist sebelum agent dilepas', ['Tujuan dan kriteria selesai jelas', 'Akses dibatasi seperlunya', 'Ada batas langkah dan biaya', 'Sudah diuji dengan 10 kasus', 'Ada log dan cara berhenti', 'Ada orang yang meninjau hasil']),
 CK('11', 'Kapan agent layak dibangun? (4 pertanyaan)', ['FREKUENSI: seberapa sering tugas ini dikerjakan?', 'RISIKO: kalau salah, apa dampaknya?', 'BIAYA: waktu membangun dan memantau sudah dihitung?', 'BISA DICEK: apakah hasilnya mudah dinilai?'], 'Kalau dua atau lebih jawabannya tidak meyakinkan, pertimbangkan workflow atau kerjakan manual dulu.'),
 CK('12', 'Menilai tool agent baru (5 pertanyaan)', ['AKSES: apa saja yang bisa dibaca dan diubah?', 'LOG: apakah tiap langkah bisa dilihat?', 'BATAS: bisa membatasi langkah, biaya, dan izin?', 'BIAYA: tarifnya jelas dan bisa dibatasi?', 'KELUAR: data bisa diekspor dan akses bisa dicabut?'], 'Coba di akun uji dengan data palsu sebelum memakai akun asli.'),
].join('');
const html = `<!doctype html><html lang="id"><head><meta charset="utf-8"><style>
@page{size:A4;margin:0}*{box-sizing:border-box;margin:0;padding:0}
body{font-family:'Inter','DejaVu Sans',sans-serif;font-feature-settings:'cv08' 1;color:#0e0f13;font-size:11.5pt}
.cover{height:297mm;padding:30mm 22mm;background:radial-gradient(500px 420px at 100% 0,rgba(255,59,59,.18),transparent 62%),#fff;position:relative;page-break-after:always;border-left:10px solid #ff3b3b}
.chip{display:inline-block;border:2px solid #ff3b3b;color:#e02d2d;border-radius:99px;padding:6px 16px;font-weight:800;letter-spacing:.16em;font-size:9pt}
.cover h1{font-size:54pt;line-height:1;letter-spacing:-.04em;margin:18mm 0 8mm;font-weight:800}
.hl{background:#ff3b3b;color:#fff;padding:0 10px;border-radius:8px}
.cover p{font-size:15pt;color:#3b404b;max-width:150mm;line-height:1.35}
.cover .meta{position:absolute;left:22mm;bottom:22mm;font-weight:800;font-size:13pt}
.cover .cat{margin-top:16mm;font-size:10.5pt;color:#6f7684;line-height:1.7;columns:2;max-width:150mm}
.page{padding:16mm 20mm 14mm;min-height:297mm;page-break-after:always;position:relative}
.blk{border:1.5px solid #e3e5ea;border-left:7px solid #ff3b3b;border-radius:14px;background:#f8f9fb;padding:11px 16px;margin-bottom:11px;break-inside:avoid}
.no{display:inline-block;background:#ff3b3b;color:#fff;font-weight:800;border-radius:8px;padding:2px 9px;font-size:10pt;margin-right:8px}
h2{display:inline;font-size:14pt;letter-spacing:-.02em}.use{color:#5a6070;font-size:10pt;margin:5px 0 7px}
pre{white-space:pre-wrap;font-family:'JetBrains Mono','DejaVu Sans Mono',monospace;font-size:9.5pt;line-height:1.5;background:#14161b;color:#f6f2ea;padding:10px 13px;border-radius:10px}
.ck{list-style:none;margin-top:8px}.ck li{display:flex;gap:10px;align-items:flex-start;padding:5px 0;font-size:11pt}.ck span{width:15px;height:15px;border:2px solid #14161b;border-radius:4px;flex:none;margin-top:2px}
.foot{position:absolute;left:20mm;right:20mm;bottom:8mm;font-size:9pt;color:#6f7684;display:flex;justify-content:space-between}
.warn{font-size:10pt;color:#6f7684;margin-top:6mm;line-height:1.5}
</style></head><body>
<div class="cover"><span class="chip">PAKET AGENT · GRATIS</span><h1>Template &amp; Checklist <span class="hl">AI Agent</span></h1><p>12 template dan checklist praktis untuk membuat agent yang jelas, dibatasi, dan bisa diperiksa. Salin, isi bagian [kurung], lalu sesuaikan dengan tugasmu.</p>
<div class="cat">01 Brief tugas<br>02 Instruksi agent riset<br>03 Aturan izin<br>04 Laporan akhir<br>05 Catatan kerja<br>06 Agent pemeriksa<br>07 Deskripsi alat<br>08 Agent bertanya saat ragu<br>09 10 kasus uji<br>10 Checklist sebelum dilepas<br>11 Kapan layak dibangun<br>12 Menilai tool baru</div>
<div class="meta">@alamnurdiann</div></div>
<div class="page">${body}<p class="warn">Template ini bersifat umum dan perlu kamu uji di tugasmu sendiri. Hasil bisa berbeda tergantung alat dan model yang dipakai. Jangan menempelkan data pribadi atau kunci akses ke prompt.</p><div class="foot"><span>@alamnurdiann</span><span>Paket AGENT</span></div></div>
</body></html>`;
fs.writeFileSync(path.join(__dirname, 'paket.html'), html);
(async () => { const b = await chromium.launch(); const pg = await b.newPage(); await pg.goto('file://' + path.join(__dirname, 'paket.html')); await pg.evaluate(() => document.fonts.ready);
  await pg.pdf({ path: path.join(__dirname, 'Paket-AGENT-alamnurdiann.pdf'), format: 'A4', printBackground: true, margin: { top: 0, bottom: 0, left: 0, right: 0 } }); await b.close(); console.log('ok'); })();

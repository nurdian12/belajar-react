// Hadiah AGENT: PDF template + checklist.  node render.js -> Template-Prompt-Jasa-Travel-alamnurdiann.pdf
const { chromium } = require('playwright'); const fs = require('fs'), path = require('path');
const esc = s => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const T = (no, title, use, text) => `<section class="blk"><div class="no">${no}</div><h2>${title}</h2><p class="use">${use}</p><pre>${esc(text)}</pre></section>`;
const CK = (no, title, items, note) => `<section class="blk"><div class="no">${no}</div><h2>${title}</h2><ul class="ck">${items.map(i => `<li><span></span>${esc(i)}</li>`).join('')}</ul>${note ? `<p class="use">${note}</p>` : ''}</section>`;
const body = [
 T('01', 'Caption promosi paket', 'Isi data paketmu sendiri. Jangan biarkan AI menebak harga, tanggal, atau fasilitas.', 'Tulis 3 caption Instagram untuk paket [jenis, misalnya keluarga] [N] hari ke [tujuan].\nFasilitas (hanya ini): [daftar].\nPembaca: [siapa].\nNada: hangat, maksimal 40 kata per caption.\nJangan menyebut harga, tanggal, atau diskon. Jangan menjanjikan cuaca atau pengalaman tertentu.'),
 T('02', 'Balasan pertanyaan pelanggan (draf)', 'Agent menyusun draf dari panduan resmimu. Kamu yang membaca dan mengirim.', 'Jawab pertanyaan pelanggan di bawah hanya dari panduan ini:\n[tempel panduan: jam layanan, cara pesan, kebijakan]\nKalau jawabannya tidak ada di panduan, tulis "perlu dicek tim".\nNada ramah, maksimal 60 kata. Jangan menjanjikan harga atau ketersediaan.\nPERTANYAAN: [tempel pertanyaan, samarkan data pribadi]'),
 T('03', 'Draf rencana perjalanan (itinerary)', 'Hasilnya draf. Jadwal, jarak, dan jam buka wajib kamu cek ke sumber resmi sebelum dipakai.', 'Susun draf rencana perjalanan [N] hari untuk [jenis peserta].\nTujuan: [tempat]. Aktivitas yang sudah pasti: [daftar].\nFormat: tabel hari, pagi, siang, sore.\nTandai "perlu dicek" pada setiap jam, jarak, atau biaya.\nJangan menambah tempat atau aktivitas di luar daftar.'),
 T('04', 'FAQ dari pertanyaan yang sering masuk', 'Buat FAQ dari pertanyaan nyata pelangganmu.', 'Dari daftar pertanyaan di bawah, kelompokkan yang mirip dan pilih 10 yang paling sering.\nTulis jawaban singkat hanya dari panduan resmiku: [tempel].\nKalau jawabannya tidak ada, tandai "perlu dijawab manusia".\nPERTANYAAN: [tempel, samarkan data pribadi]'),
 T('05', 'Pengingat pembayaran atau dokumen (draf)', 'Sopan dan jelas. Kamu cek nama dan nominal sebelum mengirim.', 'Tulis draf pesan pengingat yang sopan kepada [nama] tentang [pembayaran / kelengkapan dokumen] untuk [nama paket].\nSebut batas waktu: [tanggal]. Tawarkan bantuan jika ada kendala.\nMaksimal 60 kata. Jangan mengancam atau menyebut denda yang tidak ada di kebijakan.'),
 T('06', 'Rangkuman ulasan peserta', 'Cari pola, lalu baca ulasan aslinya.', 'Dari ulasan di bawah, kelompokkan menjadi pujian, keluhan, dan saran.\nBeri 2 kutipan pendek tiap kelompok. Jangan menambah info.\nTandai ulasan yang tidak jelas.\nULASAN: [tempel, samarkan nama]'),
 T('07', 'Brief konten mingguan', 'Satu halaman supaya kontenmu searah.', 'PRIORITAS MINGGU INI (maks 3): [paket yang ingin dipromosikan]\nYANG BOLEH DIBANTU AGENT: draf caption, jadwal posting, balasan umum\nYANG KUPUTUSKAN SENDIRI: harga, tanggal, janji kepada pelanggan\nBATAS: tidak ada klaim yang tidak bisa dibuktikan'),
 CK('08', 'Batas janji untuk jasa travel', ['Harga dan diskon hanya dari daftar resmiku', 'Tanggal dan ketersediaan hanya yang sudah kukonfirmasi', 'Tidak menjanjikan cuaca, hasil, atau pengalaman tertentu', 'Tidak menulis syarat visa, imigrasi, atau kesehatan tanpa sumber resmi', 'Hal yang tidak ada di panduan: tulis "perlu dicek tim"']),
 CK('09', 'Cek sebelum tayang atau dikirim', ['Nama, nominal, dan tanggal sudah benar', 'Fasilitas yang disebut sesuai paket sebenarnya', 'Info penting sudah dicek ke sumber resmi', 'Tidak ada data pribadi pelanggan yang terbawa', 'Kamu sudah membaca ulang dan menyetujuinya'], 'AI membantu menyusun draf. Tanggung jawab atas isi tetap di kamu.'),
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
<div class="cover"><span class="chip">PAKET TRAVEL · GRATIS</span><h1>Template Prompt <span class="hl">Jasa Travel</span></h1><p>9 template dan checklist untuk pemilik jasa travel: caption, balasan pelanggan, itinerary, FAQ, pengingat, dan batas janji. Salin, isi bagian [kurung] dengan data paketmu sendiri.</p>
<div class="cat">01 Caption promosi<br>02 Balasan pelanggan<br>03 Draf itinerary<br>04 FAQ<br>05 Pengingat<br>06 Rangkuman ulasan<br>07 Brief mingguan<br>08 Batas janji<br>09 Cek sebelum tayang</div>
<div class="meta">@alamnurdiann</div></div>
<div class="page">${body}<p class="warn">Template ini bersifat umum dan perlu kamu uji di tugasmu sendiri. Hasil bisa berbeda tergantung alat dan model yang dipakai. Jangan menempelkan data pribadi atau kunci akses ke prompt.</p><div class="foot"><span>@alamnurdiann</span><span>Template Jasa Travel</span></div></div>
</body></html>`;
fs.writeFileSync(path.join(__dirname, 'paket.html'), html);
(async () => { const b = await chromium.launch(); const pg = await b.newPage(); await pg.goto('file://' + path.join(__dirname, 'paket.html')); await pg.evaluate(() => document.fonts.ready);
  await pg.pdf({ path: path.join(__dirname, 'Template-Prompt-Jasa-Travel-alamnurdiann.pdf'), format: 'A4', printBackground: true, margin: { top: 0, bottom: 0, left: 0, right: 0 } }); await b.close(); console.log('ok'); })();

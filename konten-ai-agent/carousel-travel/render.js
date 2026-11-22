// Carousel 7 slide "Rumus 4 bagian prompt" gaya modern, futuristik, minimalis. node render.js -> slides/*.jpg
const { chromium } = require('playwright'); const fs = require('fs'), path = require('path');
const B = '#1d6fe8', HANDLE = '@alamnurdiann';
const ring = (inner) => `<svg viewBox="0 0 400 400" class="art"><defs><radialGradient id="g"><stop offset="0" stop-color="${B}" stop-opacity=".35"/><stop offset="1" stop-color="${B}" stop-opacity="0"/></radialGradient></defs><circle cx="200" cy="200" r="190" fill="url(#g)"/><circle cx="200" cy="200" r="150" fill="none" stroke="${B}" stroke-width="3" opacity=".55"/><circle cx="200" cy="200" r="110" fill="none" stroke="${B}" stroke-width="2" stroke-dasharray="6 10" opacity=".6"/>${inner}</svg>`;
const arts = [
  ring(`<path d="M200 110c-50 0-80 36-80 78 0 56 80 110 80 110s80-54 80-110c0-42-30-78-80-78z" fill="${B}"/><circle cx="200" cy="190" r="28" fill="#fff"/>`),
  ring(`<rect x="110" y="140" width="130" height="64" rx="22" fill="#fff" stroke="${B}" stroke-width="4"/><rect x="170" y="215" width="120" height="64" rx="22" fill="${B}"/><path d="M130 172h70M190 247h80" stroke="${B}" stroke-width="6" stroke-linecap="round" opacity=".7"/><path d="M190 247h80" stroke="#fff" stroke-width="6" stroke-linecap="round"/>`),
  ring(`<path d="M200 90v220M90 200h220" stroke="${B}" stroke-width="3" opacity=".5"/>${[['T',140,150],['K',260,150],['F',140,250],['B',260,250]].map(a => `<circle cx="${a[1]}" cy="${a[2]}" r="38" fill="#fff" stroke="${B}" stroke-width="4"/><text x="${a[1]}" y="${a[2] + 14}" text-anchor="middle" font-size="40" font-weight="800" fill="${B}" font-family="Inter,sans-serif">${a[0]}</text>`).join('')}`),
  ring(`<circle cx="150" cy="160" r="38" fill="#fff" stroke="${B}" stroke-width="4"/><circle cx="250" cy="240" r="38" fill="#fff" stroke="${B}" stroke-width="4"/><path d="M180 180l40 40" stroke="${B}" stroke-width="5" stroke-linecap="round"/><text x="150" y="174" text-anchor="middle" font-size="40" font-weight="800" fill="${B}" font-family="Inter,sans-serif">T</text><text x="250" y="254" text-anchor="middle" font-size="40" font-weight="800" fill="${B}" font-family="Inter,sans-serif">K</text>`),
  ring(`<circle cx="150" cy="240" r="38" fill="#fff" stroke="${B}" stroke-width="4"/><circle cx="250" cy="160" r="38" fill="#fff" stroke="${B}" stroke-width="4"/><path d="M180 220l40-40" stroke="${B}" stroke-width="5" stroke-linecap="round"/><text x="150" y="254" text-anchor="middle" font-size="40" font-weight="800" fill="${B}" font-family="Inter,sans-serif">F</text><text x="250" y="174" text-anchor="middle" font-size="40" font-weight="800" fill="${B}" font-family="Inter,sans-serif">B</text>`),
  ring(`<rect x="90" y="150" width="100" height="110" rx="18" fill="#fff" stroke="#9aa3b2" stroke-width="3"/><rect x="210" y="150" width="100" height="110" rx="18" fill="${B}"/><path d="M110 185h60M110 210h40" stroke="#9aa3b2" stroke-width="6" stroke-linecap="round"/><path d="M230 185h60M230 210h60M230 235h40" stroke="#fff" stroke-width="6" stroke-linecap="round"/>`),
  ring(`<path d="M150 110h100v190l-50-36-50 36z" fill="${B}"/><path d="M175 160h50" stroke="#fff" stroke-width="6" stroke-linecap="round"/>`),
];
const slides = [
  { k: 'HOOK', h: 'Caption travel-mu terasa <em>generik</em>? Cek instruksinya.', s: 'Rumus 4 bagian untuk pemilik jasa travel.' },
  { k: 'MASALAH', h: 'AI tidak tahu <em>paketmu</em>.', s: 'Kamu mengetik "buatkan caption paket wisata". Hasilnya penuh kata klise dan tidak menyebut kekhasan jasamu. Calon pelanggan sulit membedakanmu dari penyedia lain.' },
  { k: 'INTI', h: 'Empat bagian untuk <em>jasa travel</em>.', s: 'TUJUAN: jenis konten. KONTEKS: data paket dan pelanggannya. FORMAT: bentuk hasil. BATAS: hal yang tidak boleh dijanjikan. AI hanya memakai yang kamu tulis.' },
  { k: 'LANGKAH 1', h: 'Isi <em>Tujuan</em> dan Konteks dengan data nyata.', s: 'TUJUAN: caption promosi paket 3 hari. KONTEKS: rute, fasilitas, dan pembaca (misalnya keluarga muda). Tulis data paketmu sendiri. Jangan biarkan AI menebak.' },
  { k: 'LANGKAH 2', h: 'Tentukan <em>Format</em> dan batas janji.', s: 'FORMAT: 3 opsi caption, maksimal 40 kata. BATAS: jangan menyebut harga, tanggal, atau diskon yang tidak kuberikan. Kalau ragu, tanya dulu.' },
  { k: 'CONTOH', h: 'Sebelum dan <em>sesudah</em>.', s: 'SEBELUM: "Buatkan caption paket wisata." SESUDAH: "Tulis 3 caption untuk paket keluarga 3 hari [rute]. Fasilitas: [daftar]. Nada hangat, maks 40 kata. Jangan sebut harga." (Contoh ilustrasi.)' },
  { k: 'KESIMPULAN', h: 'Data benar, janji <em>terjaga</em>.', s: 'Isi hanya data paket yang benar dan cek info penting ke sumber resmi sebelum tayang. Simpan, coba untuk satu paketmu, lalu komen TRAVEL untuk contoh prompt jasa travel.' },
];

const css = `*{margin:0;padding:0;box-sizing:border-box}body{background:#ccc;font-family:'Inter','DejaVu Sans',sans-serif;font-feature-settings:'cv08' 1;color:#0b1020}
.s{width:1080px;height:1350px;position:relative;overflow:hidden;margin-bottom:20px;background:#f6f8fc;
 background-image:linear-gradient(rgba(29,111,232,.06) 1px,transparent 1px),linear-gradient(90deg,rgba(29,111,232,.06) 1px,transparent 1px);background-size:60px 60px}
.s:before{content:'';position:absolute;right:-220px;top:-220px;width:640px;height:640px;border-radius:50%;background:radial-gradient(circle,rgba(29,111,232,.28),transparent 65%)}
.k{position:absolute;left:90px;top:96px;font-size:26px;font-weight:800;letter-spacing:.28em;color:${B};display:flex;gap:18px;align-items:center}.k i{width:44px;height:3px;background:${B};display:inline-block}
.n{position:absolute;right:90px;top:96px;font-size:26px;font-weight:700;color:#7b859a;letter-spacing:.14em}
.art{position:absolute;right:50px;top:170px;width:420px;height:420px}
.h{position:absolute;left:90px;right:90px;top:620px;font-size:92px;line-height:1.04;font-weight:800;letter-spacing:-.035em}.h em{font-style:normal;color:${B}}
.t .h{top:190px;right:520px;font-size:74px}
.s2{position:absolute;left:90px;right:90px;top:960px;font-size:40px;line-height:1.38;color:#2a3350;font-weight:500}
.t .s2{top:900px}.long .s2{top:880px;font-size:38px}.long .h{top:600px}
.cover .h{top:640px;font-size:100px}.cover .s2{top:1040px;font-size:46px;color:${B};font-weight:700}
.ft{position:absolute;left:90px;right:90px;bottom:60px;display:grid;grid-template-columns:1fr auto 1fr;align-items:center;font-size:26px;color:${B};font-weight:700;letter-spacing:.1em}.ft b{color:#0b1020;font-size:30px;letter-spacing:.04em;display:flex;gap:12px;align-items:center}.ft i{width:11px;height:11px;border-radius:50%;background:${B};display:inline-block}.ft span:last-child{text-align:right}`;
const html = `<!doctype html><html><head><meta charset="utf-8"><style>${css}</style></head><body>${slides.map((d, i) => `<div class="s ${i === 0 ? 'cover' : i === 5 ? 'long' : ''}"><div class="k"><i></i>${d.k}</div><div class="n">${String(i + 1).padStart(2, '0')} / 07</div>${arts[i]}<div class="h">${d.h}</div><div class="s2">${d.s}</div><div class="ft"><span>${i + 1} / 7</span><b><i></i>${HANDLE}<i></i></b><span>${i < 6 ? 'GESER →' : 'SELESAI ✓'}</span></div></div>`).join('')}</body></html>`;
const dir = __dirname; fs.mkdirSync(path.join(dir, 'slides'), { recursive: true }); fs.writeFileSync(path.join(dir, 'carousel.html'), html);
(async () => { const b = await chromium.launch(); const pg = await b.newPage({ viewport: { width: 1080, height: 1350 } }); await pg.goto('file://' + path.join(dir, 'carousel.html')); await pg.evaluate(() => document.fonts.ready);
  const els = await pg.$$('.s'); for (let i = 0; i < els.length; i++) await els[i].screenshot({ path: path.join(dir, 'slides', `slide${i + 1}.jpg`), type: 'jpeg', quality: 93 }); await b.close(); console.log('ok'); })();

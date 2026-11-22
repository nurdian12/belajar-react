// Carousel 7 slide "Rumus 4 bagian prompt" gaya modern, futuristik, minimalis. node render.js -> slides/*.jpg
const { chromium } = require('playwright'); const fs = require('fs'), path = require('path');
const B = '#1d6fe8', HANDLE = '@alamnurdiann';
const ring = (inner) => `<svg viewBox="0 0 400 400" class="art"><defs><radialGradient id="g"><stop offset="0" stop-color="${B}" stop-opacity=".35"/><stop offset="1" stop-color="${B}" stop-opacity="0"/></radialGradient></defs><circle cx="200" cy="200" r="190" fill="url(#g)"/><circle cx="200" cy="200" r="150" fill="none" stroke="${B}" stroke-width="3" opacity=".55"/><circle cx="200" cy="200" r="110" fill="none" stroke="${B}" stroke-width="2" stroke-dasharray="6 10" opacity=".6"/>${inner}</svg>`;
const arts = [
  ring(`<path d="M120 120h160l-48 70v70l-64 30v-100z" fill="${B}"/><circle cx="290" cy="120" r="18" fill="#fff" stroke="${B}" stroke-width="4"/>`),
  ring(`<rect x="110" y="140" width="130" height="64" rx="22" fill="#fff" stroke="${B}" stroke-width="4"/><rect x="170" y="215" width="120" height="64" rx="22" fill="${B}"/><path d="M130 172h70" stroke="${B}" stroke-width="6" stroke-linecap="round" opacity=".7"/><path d="M190 247h80" stroke="#fff" stroke-width="6" stroke-linecap="round"/>`),
  ring(`${[0,1,2,3,4].map(i=>`<rect x="${200-(150-i*28)/2}" y="${130+i*34}" width="${150-i*28}" height="26" rx="13" fill="${B}" opacity="${1-i*0.14}"/>`).join('')}`),
  ring(`<circle cx="130" cy="200" r="38" fill="#fff" stroke="${B}" stroke-width="4"/><circle cx="270" cy="200" r="38" fill="${B}"/><path d="M170 200h60" stroke="${B}" stroke-width="5" stroke-linecap="round"/><path d="M222 188l12 12-12 12" fill="none" stroke="${B}" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/><text x="130" y="214" text-anchor="middle" font-size="34" font-weight="800" fill="${B}" font-family="Inter,sans-serif">AI</text><text x="270" y="213" text-anchor="middle" font-size="22" font-weight="800" fill="#fff" font-family="Inter,sans-serif">KAMU</text>`),
  ring(`<rect x="100" y="130" width="200" height="140" rx="22" fill="#0b1020"/><path d="M130 170h90M130 200h140M130 230h70" stroke="#7fb0ff" stroke-width="7" stroke-linecap="round"/>`),
  ring(`<path d="M110 290h180" stroke="#9aa3b2" stroke-width="3"/>${[[130,60],[170,100],[210,140],[250,180]].map(b=>`<rect x="${b[0]-14}" y="${290-b[1]}" width="28" height="${b[1]}" rx="6" fill="${B}" opacity="${0.4+b[1]/220}"/>`).join('')}`),
  ring(`<path d="M150 110h100v190l-50-36-50 36z" fill="${B}"/><path d="M175 160h50" stroke="#fff" stroke-width="6" stroke-linecap="round"/>`),
];
const slides = [
  { k: 'STUDI KASUS (ILUSTRASI)', h: 'Chat masuk banyak, tapi yang <em>booking</em> sedikit?', s: 'Skenario fiktif jasa travel, dibedah ala marketing engineer.' },
  { k: 'SITUASI', h: 'Masalahnya <em>bocor</em> di mana?', s: 'Skenario fiktif: calon peserta bertanya lewat Instagram. Balasan telat, follow-up sering lupa, dan tidak ada catatan dari mana chat berasal. Pemilik hanya merasa "kok sepi".' },
  { k: 'DIAGNOSA', h: 'Pecah jadi <em>funnel</em>.', s: 'Konten, chat masuk, penawaran, follow-up, booking. Ukur tiap tahap dan cari yang paling bocor. Mulai dari data yang dicatat, bukan dari tebakan.' },
  { k: 'RANCANGAN', h: 'AI untuk yang <em>ringan</em>, kamu untuk yang menentukan.', s: 'AI: menyusun draf balasan dari panduan, memilah chat per tahap, mengingatkan follow-up. Kamu: harga, janji, dan menekan tombol kirim.' },
  { k: 'PROMPT', h: 'Satu prompt untuk <em>follow-up</em>.', s: '"Kelompokkan chat ini: baru tanya, minta penawaran, ragu, siap bayar. Tulis draf follow-up sopan untuk yang ragu. Jangan menyebut harga." (Samarkan data pribadi dulu.)' },
  { k: 'UKUR', h: 'Catat, lalu <em>bandingkan</em>.', s: 'Catat per minggu: jumlah chat, waktu balasan, penawaran terkirim, follow-up terkirim, booking. Bandingkan beberapa minggu sebelum dan sesudah. Isi dengan angka milikmu sendiri.' },
  { k: 'KESIMPULAN', h: 'Rancang sistemnya, <em>ukur</em> hasilnya.', s: 'Ini skenario ilustrasi, bukan hasil nyata. Simpan, ukur satu tahap funnel minggu ini. Punya kasus nyata? Komen KASUS, nanti kita bedah bersama.' },
];

const css = `*{margin:0;padding:0;box-sizing:border-box}body{background:#ccc;font-family:'Inter','DejaVu Sans',sans-serif;font-feature-settings:'cv08' 1;color:#0b1020}
.s{width:1080px;height:1350px;position:relative;overflow:hidden;margin-bottom:20px;background:#f6f8fc;
 background-image:linear-gradient(rgba(29,111,232,.06) 1px,transparent 1px),linear-gradient(90deg,rgba(29,111,232,.06) 1px,transparent 1px);background-size:60px 60px}
.s:before{content:'';position:absolute;right:-220px;top:-220px;width:640px;height:640px;border-radius:50%;background:radial-gradient(circle,rgba(29,111,232,.28),transparent 65%)}
.k{position:absolute;left:90px;top:96px;font-size:24px;font-weight:800;letter-spacing:.28em;color:${B};display:flex;gap:18px;align-items:center}.k i{width:44px;height:3px;background:${B};display:inline-block}
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

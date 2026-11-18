// Gaya koran: kertas krem, huruf serif, garis ganda, kolom. Isi sama dengan b6.js.  ONLY=37 OUT=v12 node koran.js
const { chromium } = require('playwright'); const fs = require('fs'), path = require('path');
const posts = require('./b6.js').filter(p => !process.env.ONLY || String(p.id) === process.env.ONLY);
const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const HANDLE = '@alamnurdiann';
const lines = s => String(s).split('|').map(x => `<p>${esc(x)}</p>`).join('');
const mast = p => `<div class="mast"><div class="top"><span>EDISI PRAKTIS</span><span>No. ${p.id}</span><span>${HANDLE}</span></div><div class="name">KABAR AI AGENT</div><div class="rule"></div></div>`;
const foot = (i, n) => `<div class="foot"><span>Halaman ${i} dari ${n}</span><b>${HANDLE}</b><span>${i < n ? 'Bersambung →' : 'Selesai ✓'}</span></div>`;
const slidesOf = p => [
  `<div class="art"><div class="kick">KABAR UTAMA</div><h1>${esc(p.a)}</h1><div class="dbl"></div><p class="deck">${esc(p.b)}</p></div>`,
  ...p.k.map((k, i) => `<div class="art"><div class="kick">KONDISI ${i + 1}</div><h2>${esc(k[0])}</h2><div class="dbl"></div><div class="cols"><div class="c1"><div class="l">JANGAN</div><p class="no">${esc(k[1])}</p></div><div class="c2"><div class="l">${esc(k[3] || 'TULIS')}</div>${lines(k[2])}</div></div></div>`),
  `<div class="art"><div class="kick">CATATAN REDAKSI</div><h1 class="end">${esc(p.e1)}</h1><div class="dbl"></div><p class="deck">${esc(p.e2)}</p></div>`,
];
const css = `*{margin:0;padding:0;box-sizing:border-box}body{background:#bbb;font-family:'Liberation Serif','Times New Roman',serif;color:#1a1a1a}
.s{width:1080px;height:1350px;position:relative;margin-bottom:20px;overflow:hidden;background:#f1ebdc}
.s:before{content:'';position:absolute;inset:0;background:radial-gradient(ellipse at 50% 45%,transparent 55%,rgba(110,85,40,.22) 100%);z-index:2;pointer-events:none}
.s:after{content:'';position:absolute;inset:0;opacity:.35;mix-blend-mode:multiply;z-index:3;pointer-events:none;background-image:url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='300' height='300'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='.9' numOctaves='2' seed='7'/><feColorMatrix values='0 0 0 0 .35  0 0 0 0 .3  0 0 0 0 .2  0 0 0 .9 0'/></filter><rect width='300' height='300' filter='url(%23n)'/></svg>")}
.mast{position:absolute;left:80px;right:80px;top:70px;text-align:center}
.top{display:flex;justify-content:space-between;font-size:22px;letter-spacing:.18em;border-top:4px solid #1a1a1a;border-bottom:1.5px solid #1a1a1a;padding:10px 0;font-weight:700}
.name{font-size:84px;font-weight:700;letter-spacing:.04em;line-height:1.1;margin-top:14px}
.rule{height:8px;border-top:4px solid #1a1a1a;border-bottom:1.5px solid #1a1a1a;margin-top:10px}
.art{position:absolute;left:80px;right:80px;top:330px}
.kick{display:inline-block;background:#c8261f;color:#f6f1e4;font-size:24px;font-weight:700;letter-spacing:.2em;padding:6px 16px;margin-bottom:28px;font-family:'Liberation Sans','DejaVu Sans',sans-serif}
h1{font-size:92px;line-height:1.08;font-weight:700;letter-spacing:-.01em}h1.end{font-size:100px}
h2{font-size:74px;line-height:1.1;font-weight:700}
.dbl{margin:32px 0;border-top:4px solid #1a1a1a;border-bottom:1.5px solid #1a1a1a;height:9px}
.deck{font-size:52px;line-height:1.35;font-style:italic;color:#2a2a2a}
.cols{display:grid;grid-template-columns:1fr 1fr}
.c1{padding-right:36px;border-right:2px solid #1a1a1a}.c2{padding-left:44px}
.l{font-family:'Liberation Sans','DejaVu Sans',sans-serif;font-size:24px;font-weight:700;letter-spacing:.22em;color:#c8261f;border-bottom:2px solid #c8261f;padding-bottom:10px;margin-bottom:24px}
.no{font-size:48px;line-height:1.35;color:#c8261f;text-decoration:line-through;text-decoration-thickness:3px}
.c2 p{font-size:48px;line-height:1.35;margin-bottom:22px}
.foot{position:absolute;left:80px;right:80px;bottom:64px;border-top:1.5px solid #1a1a1a;padding-top:14px;display:flex;justify-content:space-between;font-size:24px;color:#c8261f;font-style:italic;z-index:4}.foot b{font-style:normal;color:#1a1a1a;font-size:26px;letter-spacing:.06em}
.sm1 h1{font-size:76px}.sm1 .deck{font-size:44px}.sm1 .c2 p,.sm1 .no{font-size:42px}`;
const html = `<!doctype html><html><head><meta charset="utf-8"><style>${css}</style></head><body>${posts.map(p => slidesOf(p).map((b, i, a) => `<div class="s">${mast(p)}${b}${foot(i + 1, a.length)}</div>`).join('')).join('')}</body></html>`;
const dir = path.join(__dirname, process.env.OUT || 'v12'); fs.mkdirSync(path.join(dir, 'slides'), { recursive: true }); fs.writeFileSync(path.join(dir, 'series.html'), html);
(async () => {
  const b = await chromium.launch(); const pg = await b.newPage({ viewport: { width: 1080, height: 1350 } });
  await pg.goto('file://' + path.join(dir, 'series.html')); await pg.evaluate(() => document.fonts.ready);
  const els = await pg.$$('.s'); let k = 0;
  for (const p of posts) for (let j = 0; j < 6; j++) {
    const el = els[k++];
    const over = () => el.evaluate(s => s.querySelector('.art').getBoundingClientRect().bottom - s.getBoundingClientRect().top - 1230);
    let o = await over(); if (o > 0) { await el.evaluate(s => { s.className = 's sm1'; }); o = await over(); }
    if (o > 0) console.log('OVERFLOW', p.id, j + 1, Math.round(o));
    await el.screenshot({ path: path.join(dir, 'slides', `${String(p.id).padStart(2, '0')}-s${j + 1}.jpg`), type: 'jpeg', quality: 92 });
  }
  await b.close(); console.log('ok', k);
})();

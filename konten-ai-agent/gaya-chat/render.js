const { chromium } = require('playwright'); const fs = require('fs'), path = require('path');
const posts = require('./data.js'); const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const head = p => `<div class="head"><div class="av">${esc(p.name[0].toUpperCase())}</div><div><div class="nm">${esc(p.name)}</div><div class="hd">${esc(p.handle)}</div></div></div>`;
const body = s => s.t === 'teks'
  ? `<div class="txt">${s.p.map(x => `<p>${esc(x)}</p>`).join('')}</div>`
  : `<div class="kd"><div class="lb">KONDISI</div><div class="pill">${esc(s.kondisi)}</div></div><div class="cols"><div class="c1"><div class="l">JANGAN</div><p class="no">${esc(s.jangan)}</p></div><div class="c2"><div class="l r">TULIS</div>${s.tulis.map(x => `<p>${esc(x)}</p>`).join('')}</div></div>`;
const html = `<!doctype html><html><head><meta charset="utf-8"><style>
*{margin:0;padding:0;box-sizing:border-box}body{background:#ddd;font-family:'Inter','DejaVu Sans',sans-serif;font-feature-settings:'cv08' 1;color:#111}
.s{width:1080px;height:1350px;background:#fff;position:relative;margin-bottom:20px;border:3px solid #ececec;overflow:hidden}
.head{position:absolute;left:126px;top:188px;display:flex;align-items:center;gap:34px}
.av{width:180px;height:180px;border-radius:50%;background:#e9eaee;display:flex;align-items:center;justify-content:center;font-size:84px;font-weight:700;color:#8a8f9c}
.nm{font-size:36px;font-weight:700}.hd{font-size:36px;color:#80848e;margin-top:6px}
.txt{position:absolute;left:128px;right:110px;top:490px}.txt p{font-size:64px;line-height:1.3;margin-bottom:48px;font-weight:450}
.kd{position:absolute;left:124px;top:390px}.lb{font-size:22px;color:#6b6f79;letter-spacing:.04em;margin-bottom:14px}
.pill{display:inline-block;background:#efeff1;border-radius:44px;padding:20px 34px;font-size:32px;font-weight:500}
.cols{position:absolute;left:114px;right:40px;top:568px;display:grid;grid-template-columns:1fr 1fr;height:580px}
.c1{padding-right:34px;border-right:2px solid #d6d6da}.c2{padding-left:58px}
.l{font-size:23px;letter-spacing:.2em;font-weight:700;color:#8a8a8e;margin-bottom:30px}.l.r{color:#e02d2d}
.c1 .no{font-size:38px;line-height:1.45;color:#b9b9bd}.c2 p{font-size:38px;line-height:1.45;margin-bottom:20px}
</style></head><body>${posts.map(p => p.slides.map(s => `<div class="s">${head(p)}${body(s)}</div>`).join('')).join('')}</body></html>`;
fs.writeFileSync(path.join(__dirname, 'contoh.html'), html);
(async () => { const b = await chromium.launch(); const pg = await b.newPage({ viewport: { width: 1080, height: 1350 } }); await pg.goto('file://' + path.join(__dirname, 'contoh.html')); await pg.evaluate(() => document.fonts.ready);
  const els = await pg.$$('.s'); fs.mkdirSync(path.join(__dirname, 'slides'), { recursive: true }); let k = 0;
  for (let i = 0; i < posts.length; i++) for (let j = 0; j < posts[i].slides.length; j++) await els[k++].screenshot({ path: path.join(__dirname, 'slides', `p${posts[i].id}-s${j + 1}.jpg`), type: 'jpeg', quality: 92 });
  await b.close(); console.log('ok', k); })();

// Render 62 carousel gaya tweet + skrip -> v10/slides + manifest.json.  node build.js
const { chromium } = require('playwright'); const fs = require('fs'), path = require('path');
const posts = require('./b6.js').filter(p => !process.env.ONLY || String(p.id) === process.env.ONLY); const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const NAME = 'alam nurdiann', HANDLE = '@alamnurdiann';
const NOFOTO = !!process.env.NOFOTO;
const head = NOFOTO ? '' : `<div class="head"><div class="av">A</div><div><div class="nm">${NAME}</div><div class="hd">${HANDLE}</div></div></div>`;
const lines = s => String(s).split('|').map(x => `<p>${esc(x)}</p>`).join('');
const slidesOf = p => [
  `<div class="txt">${[p.a, p.b].map(x => `<p>${esc(x)}</p>`).join('')}</div>`,
  ...p.k.map(k => `<div class="kd"><div class="lb">KONDISI</div><div class="pill">${esc(k[0])}</div></div><div class="cols"><div class="c1"><div class="l">JANGAN</div><p class="no">${esc(k[1])}</p></div><div class="c2"><div class="l r">${esc(k[3] || 'TULIS')}</div>${lines(k[2])}</div></div>`),
  `<div class="txt">${[p.e1, p.e2].map(x => `<p>${esc(x)}</p>`).join('')}</div>`,
];
const css = `*{margin:0;padding:0;box-sizing:border-box}body{background:#ddd;font-family:'Inter','DejaVu Sans',sans-serif;font-feature-settings:'cv08' 1;color:#111}
.s{width:1080px;height:1350px;background:#fff;position:relative;margin-bottom:20px;border:3px solid #ececec;overflow:hidden}
.head{position:absolute;left:126px;top:188px;display:flex;align-items:center;gap:34px}
.av{width:180px;height:180px;border-radius:50%;background:#e9eaee;display:flex;align-items:center;justify-content:center;font-size:84px;font-weight:700;color:#8a8f9c}
.nm{font-size:36px;font-weight:700}.hd{font-size:36px;color:#80848e;margin-top:6px}
.txt{position:absolute;left:128px;right:110px;top:490px}.txt p{font-size:64px;line-height:1.3;margin-bottom:48px;font-weight:450}
.kd{position:absolute;left:124px;top:390px;right:60px}.lb{font-size:22px;color:#6b6f79;letter-spacing:.04em;margin-bottom:14px}
.pill{display:inline-block;background:#efeff1;border-radius:44px;padding:20px 34px;font-size:32px;font-weight:500;max-width:100%}
.cols{position:absolute;left:114px;right:40px;top:568px;display:grid;grid-template-columns:1fr 1fr}
.c1{padding-right:34px;border-right:2px solid #d6d6da;min-height:560px}.c2{padding-left:58px}
.l{font-size:23px;letter-spacing:.2em;font-weight:700;color:#8a8a8e;margin-bottom:30px}.l.r{color:#e02d2d}
.c1 .no{font-size:38px;line-height:1.45;color:#b9b9bd}.c2 p{font-size:38px;line-height:1.45;margin-bottom:20px}
.nf .txt{top:300px}.nf .kd{top:210px}.nf .cols{top:388px}.nf .c1{min-height:700px}
.ft{position:absolute;left:128px;right:110px;bottom:70px;display:flex;justify-content:space-between;align-items:center;font-size:26px;color:#8a8f9c;font-weight:600}.ft b{color:#111;font-size:30px;font-weight:700;display:flex;gap:12px;align-items:center}.ft i{width:11px;height:11px;border-radius:50%;background:#e02d2d;display:inline-block}
.sm1 .txt p{font-size:56px}.sm2 .txt p{font-size:50px}.sm3 .txt p{font-size:44px}
.sm1 .c2 p,.sm1 .c1 .no{font-size:34px}.sm2 .c2 p,.sm2 .c1 .no{font-size:30px}.sm3 .c2 p,.sm3 .c1 .no{font-size:27px}`;
const html = `<!doctype html><html><head><meta charset="utf-8"><style>${css}</style></head><body>${posts.map(p => slidesOf(p).map((b, i) => `<div class="s${NOFOTO ? ' nf' : ''}">${head}${b}${NOFOTO ? `<div class="ft"><span>${i + 1} / 6</span><b><i></i>${HANDLE}<i></i></b><span>${i < 5 ? 'GESER →' : 'SELESAI ✓'}</span></div>` : ''}</div>`).join('')).join('')}</body></html>`;
const dir = path.join(__dirname, process.env.OUT || 'v10'); fs.mkdirSync(path.join(dir, 'slides'), { recursive: true }); fs.writeFileSync(path.join(dir, 'series.html'), html);
const tags = '#aiagent #aiautomation #belajarai #aiindonesia #produktivitas';
(async () => {
  const b = await chromium.launch(); const pg = await b.newPage({ viewport: { width: 1080, height: 1350 } });
  await pg.goto('file://' + path.join(dir, 'series.html')); await pg.evaluate(() => document.fonts.ready);
  const els = await pg.$$('.s'); let k = 0, warn = 0; const man = [];
  for (const p of posts) {
    const files = [];
    for (let j = 0; j < 6; j++) {
      const el = els[k++];
      const over = () => el.evaluate(s => { let m = 0; s.querySelectorAll('.txt,.cols').forEach(e => { m = Math.max(m, e.getBoundingClientRect().bottom - s.getBoundingClientRect().top); }); return m - 1270; });
      let o = await over();
      for (const c of ['sm1', 'sm2', 'sm3']) if (o > 0) { await el.evaluate((s, c) => { s.className = 's ' + c; }, c); o = await over(); }
      if (o > 0) { warn++; console.log('OVERFLOW', p.id, j + 1, Math.round(o)); }
      const f = `${String(p.id).padStart(2, '0')}-s${j + 1}.jpg`; await el.screenshot({ path: path.join(dir, 'slides', f), type: 'jpeg', quality: 92 }); files.push(f);
    }
    const cap = `${p.a}\n\n${p.b}\n\nGeser buat lihat skripnya. 👉\n\n${p.e2}${p.opini ? '\n\nCatatan: ini opini pribadi, bukan aturan mutlak.' : ''}${p.il ? '\n\nCatatan: ini contoh ilustrasi, bukan hasil nyata.' : ''}\n\n${tags}`;
    man.push({ id: p.id, files, caption: cap });
  }
  fs.writeFileSync(path.join(dir, 'manifest.json'), JSON.stringify(man, null, 1)); console.log('posts', man.length, 'warnings', warn); await b.close();
})();

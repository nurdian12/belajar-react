// Format perbandingan cara lama vs cara sederhana (biru, putih, tanpa foto).  OUT=v16 node bandingkan.js
const { chromium } = require('playwright'); const fs = require('fs'), path = require('path');
const posts = require('./b8.js').filter(p => !process.env.ONLY || String(p.id) === process.env.ONLY);
const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const HANDLE = '@alamnurdiann'; const IL = 'Contoh ilustrasi, bukan hasil nyata.';
const foot = (i, n) => `<div class="ft"><span>${i} / ${n}</span><b><i></i>${HANDLE}<i></i></b><span>${i < n ? 'GESER →' : 'SELESAI ✓'}</span></div>`;
const steps = (arr, cls) => `<div class="list ${cls}">${arr.map((t, i) => `<div class="it"><div class="no">${i + 1}</div><p>${esc(t)}</p></div>`).join('')}</div>`;
const slidesOf = p => [
  `<div class="txt">${[p.a, p.b].map(x => `<p>${esc(x)}</p>`).join('')}</div>`,
  `<div class="blk"><div class="chip old">CARA LAMA</div><h2>${esc(p.tugas)}</h2>${steps(p.lama, 'old')}<div class="note">${IL}</div></div>`,
  `<div class="blk"><div class="chip new">CARA SEDERHANA</div><h2>${esc(p.tugas)}</h2>${steps(p.baru, 'new')}<div class="note">${IL}</div></div>`,
  `<div class="blk"><div class="chip old">SEBELUM vs SESUDAH</div><h2>Bedanya di mana?</h2><div class="tbl"><div class="r h"><div></div><div>LAMA</div><div>SEDERHANA</div></div>${p.rows.map(r => `<div class="r"><div>${esc(r[0])}</div><div>${esc(r[1])}</div><div>${esc(r[2])}</div></div>`).join('')}</div><div class="note">${IL}</div></div>`,
  `<div class="blk"><div class="chip new">TETAP DI TANGANMU</div><h2>Yang jangan diserahkan</h2><div class="list new">${p.tetap.map(t => `<div class="it"><div class="no ck">✓</div><p>${esc(t)}</p></div>`).join('')}</div></div>`,
  `<div class="txt">${[p.e1, p.e2].map(x => `<p>${esc(x)}</p>`).join('')}</div>`,
];
const css = `*{margin:0;padding:0;box-sizing:border-box}body{background:#ccc;font-family:'Inter','DejaVu Sans',sans-serif;font-feature-settings:'cv08' 1;color:#111}
.s{width:1080px;height:1350px;position:relative;margin-bottom:20px;overflow:hidden;background:#fff;border:3px solid #ececec}
.txt{position:absolute;left:128px;right:110px;top:300px}.txt p{font-size:64px;line-height:1.3;margin-bottom:48px;font-weight:450}
.blk{position:absolute;left:100px;right:90px;top:180px}
.chip{display:inline-block;font-size:26px;font-weight:800;letter-spacing:.18em;padding:12px 26px;border-radius:40px;margin-bottom:30px}
.chip.old{background:#111;color:#fff}.chip.new{background:#1d6fe8;color:#fff}
h2{font-size:68px;line-height:1.1;font-weight:800;letter-spacing:-.03em;margin-bottom:46px}
.list{display:flex;flex-direction:column;gap:22px}
.it{display:flex;gap:26px;align-items:center;border-radius:28px;padding:26px 32px}
.list.old .it{background:#f1f2f4}.list.new .it{background:#eaf2ff;border:2px solid #b9d3ff}
.no{width:60px;height:60px;border-radius:50%;flex:none;display:flex;align-items:center;justify-content:center;font-size:32px;font-weight:800;color:#fff}
.old .no{background:#6b6f79}.new .no{background:#1d6fe8}
.it p{font-size:42px;line-height:1.25;font-weight:600}
.note{margin-top:34px;font-size:26px;color:#1d6fe8;font-weight:600}
.tbl{border:2px solid #d7d9de;border-radius:28px;overflow:hidden}
.tbl .r{display:grid;grid-template-columns:1.1fr 1fr 1fr;border-top:2px solid #e3e5ea}
.tbl .r.h{border-top:0;background:#111;color:#fff;font-weight:800;letter-spacing:.12em;font-size:26px}.tbl .r.h>div:last-child{background:#1d6fe8}
.tbl .r>div{padding:26px 24px;font-size:36px;line-height:1.25;font-weight:600}
.tbl .r>div:last-child{background:#eaf2ff;color:#0f4fb8;font-weight:800}.tbl .r.h>div:last-child{color:#fff}
.ft{position:absolute;left:70px;right:70px;bottom:60px;display:grid;grid-template-columns:1fr auto 1fr;align-items:center;font-size:26px;color:#1d6fe8;font-weight:600}.ft b{color:#111;font-size:30px;display:flex;gap:12px;align-items:center}.ft i{width:11px;height:11px;border-radius:50%;background:#1d6fe8;display:inline-block}.ft span:last-child{text-align:right}
.sm1 .it p{font-size:36px}.sm1 h2{font-size:58px}.sm2 .it p{font-size:32px}.sm2 .tbl .r>div{font-size:30px}`;
const html = `<!doctype html><html><head><meta charset="utf-8"><style>${css}</style></head><body>${posts.map(p => slidesOf(p).map((b, i, a) => `<div class="s">${b}${foot(i + 1, a.length)}</div>`).join('')).join('')}</body></html>`;
const dir = path.join(__dirname, process.env.OUT || 'v16'); fs.mkdirSync(path.join(dir, 'slides'), { recursive: true }); fs.writeFileSync(path.join(dir, 'series.html'), html);
const tags = '#aiagent #aiautomation #belajarai #aiindonesia #produktivitas';
(async () => {
  const b = await chromium.launch(); const pg = await b.newPage({ viewport: { width: 1080, height: 1350 } });
  await pg.goto('file://' + path.join(dir, 'series.html')); await pg.evaluate(() => document.fonts.ready);
  const els = await pg.$$('.s'); let k = 0; const man = [];
  for (const p of posts) {
    const files = [];
    for (let j = 0; j < 6; j++) {
      const el = els[k++];
      const over = () => el.evaluate(s => { const e = s.querySelector('.txt,.blk'); return e.getBoundingClientRect().bottom - s.getBoundingClientRect().top - 1230; });
      let o = await over(); for (const c of ['sm1', 'sm2']) if (o > 0) { await el.evaluate((s, c) => { s.className = 's ' + c; }, c); o = await over(); }
      if (o > 0) console.log('OVERFLOW', p.id, j + 1, Math.round(o));
      const f = `${String(p.id).padStart(2, '0')}-s${j + 1}.jpg`; await el.screenshot({ path: path.join(dir, 'slides', f), type: 'jpeg', quality: 92 }); files.push(f);
    }
    const cap = `${p.a}\n\n${p.b}\n\nGeser buat lihat perbandingannya. 👉\n\n${p.e2}\n\nCatatan: ini contoh ilustrasi, bukan hasil nyata.\n\n${tags}`;
    man.push({ id: p.id, files, caption: cap });
  }
  fs.writeFileSync(path.join(dir, 'manifest.json'), JSON.stringify(man, null, 1)); console.log('posts', man.length); await b.close();
})();

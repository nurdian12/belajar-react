// Gaya model chat (gelembung pesan). Isi sama dengan b6.js.  ONLY=37 OUT=v13 node bubble.js
const { chromium } = require('playwright'); const fs = require('fs'), path = require('path');
const posts = require(process.env.SRC || './b6.js').filter(p => !process.env.ONLY || String(p.id) === process.env.ONLY);
const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const HANDLE = '@alamnurdiann'; const lines = s => String(s).split('|').map(x => `<p>${esc(x)}</p>`).join('');
const bar = `<div class="bar"><div class="back">&#8249;</div><div><div class="who">AI Agent</div><div class="on"><i></i>online</div></div></div>`;
const foot = (i, n) => `<div class="ft"><span>${i} / ${n}</span><b><i></i>${HANDLE}<i></i></b><span>${i < n ? 'GESER →' : 'SELESAI ✓'}</span></div>`;
const slidesOf = p => [
  `P<div class="txt">${[p.a, p.b].map(x => `<p>${esc(x)}</p>`).join('')}</div>`,
  ...p.k.map(k => `<div class="chat"><div class="sys">${esc(k[0])}</div><div class="msg in bad"><span class="tag">✗ JANGAN</span>${esc(k[1])}<small>09.14</small></div><div class="msg out good"><span class="tag">✓ ${esc(k[3] || 'TULIS')}</span>${lines(k[2])}<small>09.15 ✓✓</small></div></div>`),
  `P<div class="txt">${[p.e1, p.e2].map(x => `<p>${esc(x)}</p>`).join('')}</div>`,
];
const css = `*{margin:0;padding:0;box-sizing:border-box}body{background:#ccc;font-family:'Inter','DejaVu Sans',sans-serif;font-feature-settings:'cv08' 1;color:#111}
.s{width:1080px;height:1350px;position:relative;margin-bottom:20px;overflow:hidden;background:#f4f5f7}
.bar{position:absolute;left:0;right:0;top:0;height:200px;background:#fff;border-bottom:2px solid #e6e7eb;display:flex;align-items:center;gap:30px;padding:70px 70px 0}
.back{font-size:84px;color:#1d6fe8;line-height:1;margin-top:-14px}.who{font-size:44px;font-weight:700}.on{font-size:28px;color:#6f7684;margin-top:4px;display:flex;align-items:center;gap:10px}.on i{width:14px;height:14px;border-radius:50%;background:#25c26a;display:inline-block}
.chat{position:absolute;left:60px;right:60px;top:260px;display:flex;flex-direction:column;gap:34px}
.msg{max-width:830px;font-size:50px;line-height:1.32;padding:34px 42px 40px;border-radius:44px;position:relative}
.msg p{margin-bottom:16px}.msg p:last-of-type{margin-bottom:0}
.msg small{display:block;font-size:24px;margin-top:16px;opacity:.6;text-align:right}
.in{align-self:flex-start;background:#fff;border:2px solid #e6e7eb;border-bottom-left-radius:10px}
.out{align-self:flex-end;background:#1d6fe8;color:#fff;border-bottom-right-radius:10px}
.tag{display:block;font-size:24px;letter-spacing:.2em;font-weight:800;margin-bottom:12px}
.bad{color:#111}.bad .tag{color:#111}.good .tag{color:#dbe8ff}
.sys{align-self:center;background:#e9eaee;color:#4b5060;border-radius:40px;padding:14px 32px;font-size:30px;font-weight:600}
.ft{position:absolute;left:70px;right:70px;bottom:60px;display:grid;grid-template-columns:1fr auto 1fr;align-items:center;font-size:26px;color:#1d6fe8;font-weight:600}.ft b{color:#111;font-size:30px;display:flex;gap:12px;align-items:center}.ft i{width:11px;height:11px;border-radius:50%;background:#1d6fe8;display:inline-block}.ft span:last-child{text-align:right}
.plain{background:#fff}.plain .txt{position:absolute;left:128px;right:110px;top:300px}.plain .txt p{font-size:64px;line-height:1.3;margin-bottom:48px;font-weight:450}
.sm1 .msg{font-size:44px}.sm2 .msg{font-size:38px}`;
const html = `<!doctype html><html><head><meta charset="utf-8"><style>${css}</style></head><body>${posts.map(p => slidesOf(p).map((b, i, a) => (b[0] === 'P' ? `<div class="s plain">${b.slice(1)}${foot(i + 1, a.length)}</div>` : `<div class="s">${bar}${b}${foot(i + 1, a.length)}</div>`)).join('')).join('')}</body></html>`;
const dir = path.join(__dirname, process.env.OUT || 'v13'); fs.mkdirSync(path.join(dir, 'slides'), { recursive: true }); fs.writeFileSync(path.join(dir, 'series.html'), html);
(async () => {
  const b = await chromium.launch(); const pg = await b.newPage({ viewport: { width: 1080, height: 1350 } });
  await pg.goto('file://' + path.join(dir, 'series.html')); await pg.evaluate(() => document.fonts.ready);
  const els = await pg.$$('.s'); let k = 0; const man = []; const tags = '#aiagent #aiautomation #belajarai #aiindonesia #produktivitas';
  for (const p of posts) {
    const files = [];
    for (let j = 0; j < 6; j++) {
      const el = els[k++];
      const over = () => el.evaluate(s => s.querySelector('.chat,.txt').getBoundingClientRect().bottom - s.getBoundingClientRect().top - 1230);
      let o = await over(); for (const c of ['sm1', 'sm2']) if (o > 0) { await el.evaluate((s, c) => { s.className = 's ' + c; }, c); o = await over(); }
      if (o > 0) console.log('OVERFLOW', p.id, j + 1, Math.round(o));
      const f = `${String(p.id).padStart(2, '0')}-s${j + 1}.jpg`;
      await el.screenshot({ path: path.join(dir, 'slides', f), type: 'jpeg', quality: 92 }); files.push(f);
    }
    const cap = `${p.a}\n\n${p.b}\n\nGeser buat lihat skripnya. 👉\n\n${p.e2}${p.opini ? '\n\nCatatan: ini opini pribadi, bukan aturan mutlak.' : ''}${p.il ? '\n\nCatatan: ini contoh ilustrasi, bukan hasil nyata.' : ''}\n\n${tags}`;
    man.push({ id: p.id, files, caption: cap });
  }
  fs.writeFileSync(path.join(dir, 'manifest.json'), JSON.stringify(man, null, 1));
  await b.close(); console.log('ok', k, 'posts', man.length);
})();

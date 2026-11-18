const { chromium } = require('playwright'); const path = require('path'); const fs = require('fs');
const posts = require('./posts.js');
const NAME = 'Alam Nurdian', HANDLE = '@alamnurdiann', INI = 'AN';
const KIND = { tips: ['TIPS', '#tipsai'], trik: ['TRIK', '#triksai'], fakta: ['FAKTA UNIK', '#faktaunik'] };
const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const hl = s => esc(s).replace(/\*\*(.+?)\*\*/g, '<span class="hl">$1</span>');
const plain = s => String(s).replace(/\*\*/g, '');
const ICON = {
  tips: '<svg viewBox="0 0 24 24" fill="none" stroke="#0f1115" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 12.5l5 5L20 6.5"/></svg>',
  trik: '<svg viewBox="0 0 24 24" fill="#0f1115" stroke="#0f1115" stroke-width="1.5" stroke-linejoin="round"><path d="M13 2L4 14h6l-1 8 9-12h-6z"/></svg>',
  fakta: '<span style="font-size:70px;line-height:1">!</span>'
};
const head = `<div class="head"><div class="avatar">${INI}</div><div><div class="name">${NAME}</div><div class="handle">${HANDLE}</div></div></div>`;
const foot = (n, last) => `<div class="foot"><span>${n} / 5</span><span>${last ? 'SELESAI ✓' : 'GESER →'}</span></div>`;
const step = (kind, idx) => `<div class="stephead"><div class="badge">${ICON[kind]}</div><div class="label">${KIND[kind][0]} #${idx}</div></div>`;
const cards = (items) => items.map((t, i) => `<div class="card"><div class="num">${i + 1}</div><p>${hl(t)}</p></div>`).join('');
function body(s) {
  switch (s.t) {
    case 'cards': return `<h1>${hl(s.h)}</h1>${cards(s.items)}${s.note ? `<div class="note">${hl(s.note)}</div>` : ''}`;
    case 'table': return `<h1>${hl(s.h)}</h1><div class="tbl"><div class="r h">${s.cols.map(c => `<div>${esc(c)}</div>`).join('')}</div>${s.rows.map(r => `<div class="r">${r.map(c => `<div>${esc(c)}</div>`).join('')}</div>`).join('')}</div><div class="caption">${esc(s.foot || '')}</div>`;
    case 'prompt': return `<h1>${hl(s.h)}</h1>${cards(s.items)}<div class="prompt"><div class="tag">PROMPT</div><p>${esc(s.prompt)}</p></div>`;
    case 'flow': return `<h1>${hl(s.h)}</h1><div class="pills">${s.pills.map((p, i) => `${i ? '<span class="arrow">→</span>' : ''}<span class="pill">${esc(p)}</span>`).join('')}</div><div class="card" style="padding:34px 40px"><p style="font-weight:600">${hl(s.text)}</p></div>${s.note ? `<div class="note">${hl(s.note)}</div>` : ''}`;
    case 'fact': return `<h1>${hl(s.h)}</h1><div class="card" style="padding:36px 40px"><p style="font-weight:600;font-size:35px">${esc(s.body)}</p></div><div class="kv res"><div class="k">KENAPA PENTING</div><div class="v">${esc(s.why)}</div></div><div class="caption">Sumber: ${esc(s.src)}</div>`;
  }
}
const closeBody = (c, kind) => `<h1>${hl(c.h)}</h1>${c.items.map((t, i) => `<div class="card"><div class="sq">${i + 1}</div><p>${hl(t)}</p></div>`).join('')}<div class="sub" style="font-weight:700">Simpan dulu, praktikkan nanti.</div><div class="btn">SIMPAN POSTINGAN INI</div>`;
function slides(p, idx) {
  const out = []; const [lab] = KIND[p.kind]; const n = idx;
  out.push(`<div class="slide" id="p${n}s1">${head}<div class="content" style="top:318px;gap:38px"><div class="kicker">${lab} #${p.n} · Seri AI agent</div><h1 class="xl">${hl(p.title)}</h1><div class="sub">${esc(p.sub)}</div></div>${foot(1)}</div>`);
  p.s.forEach((s, i) => out.push(`<div class="slide" id="p${n}s${i + 2}">${head}<div class="content">${step(p.kind, p.n)}${body(s)}</div>${foot(i + 2)}</div>`));
  out.push(`<div class="slide" id="p${n}s5">${head}<div class="content">${step(p.kind, p.n)}${closeBody(p.close, p.kind)}</div>${foot(5, true)}</div>`);
  return out.join('\n');
}
const counters = { tips: 0, trik: 0, fakta: 0 };
// urutan tayang: bergilir tips, trik, fakta
const byKind = { tips: [], trik: [], fakta: [] };
posts.forEach(p => { p.n = ++counters[p.kind]; byKind[p.kind].push(p); });
const order = []; for (let i = 0; i < 10; i++) ['tips', 'trik', 'fakta'].forEach(k => order.push(byKind[k][i]));
const css = fs.readFileSync(path.join(__dirname, '..', 'carousel.html'), 'utf8').match(/<style>([\s\S]*?)<\/style>/)[1];
const html = `<!doctype html><html lang="id"><head><meta charset="utf-8"><style>${css}.tight .tbl .r>div{padding:18px 22px;font-size:29px}.tight .tbl .r.h>div{padding:18px 22px;font-size:23px}.tighter .tbl .r>div{padding:14px 20px;font-size:27px}.tight .kv .k{font-size:22px}.xl2 h1.xl{font-size:80px}.tbl .r{grid-template-columns:1fr 1fr 1.3fr !important}</style></head><body>${order.map((p, i) => slides(p, i + 1)).join('\n')}</body></html>`;
fs.writeFileSync(path.join(__dirname, 'series.html'), html);
(async () => {
  const b = await chromium.launch(); const pg = await b.newPage({ viewport: { width: 1080, height: 1350 } });
  await pg.goto('file://' + path.join(__dirname, 'series.html')); await pg.evaluate(() => document.fonts.ready);
  const outDir = path.join(__dirname, 'slides'); fs.mkdirSync(outDir, { recursive: true });
  const manifest = []; let warn = 0;
  for (let i = 0; i < order.length; i++) {
    const p = order[i], files = [];
    for (let k = 1; k <= 5; k++) {
      const el = await pg.$(`#p${i + 1}s${k}`);
      const over = () => el.evaluate(s => { const c = s.querySelector('.content'); return c.scrollHeight - c.clientHeight; });
      let o = await over();
      for (const cls of ['tight', 'tighter']) { if (o > 0) { await el.evaluate((s, c) => s.querySelector('.content').classList.add(c), cls); o = await over(); } }
      if (o > 0) { warn++; console.log(`OVERFLOW p${i + 1} s${k} ${o}px`); }
      const f = `${String(i + 1).padStart(2, '0')}-s${k}.jpg`;
      await el.screenshot({ path: path.join(outDir, f), type: 'jpeg', quality: 92 }); files.push(f);
    }
    const [lab, tag] = KIND[p.kind];
    const ask = { tips: 'Tips mana yang paling kamu butuhkan sekarang? Tulis di komentar.', trik: 'Trik ini sudah pernah kamu coba? Ceritakan di komentar.', fakta: 'Fakta mana yang paling mengejutkan buatmu? Komen ya.' }[p.kind];
    const caption = `${lab} #${p.n}: ${plain(p.title)}\n\n${p.sub}\n\nYang dibahas:\n${p.close.items.map((t, j) => `${j + 1}. ${plain(t)}`).join('\n')}\n\n${ask} 👇\nSimpan postingan ini buat dipraktikkan, dan geser sampai slide terakhir. 👉${p.kind === 'fakta' ? `\n\nSumber: ${p.s[0].src}.` : ''}\n\n#aiagent #agentai #claude #otomatisasi #belajarai #aiindonesia ${tag}`;
    manifest.push({ day: i + 1, kind: p.kind, n: p.n, title: plain(p.title), files, caption });
  }
  fs.writeFileSync(path.join(__dirname, 'manifest.json'), JSON.stringify(manifest, null, 1));
  console.log('posts', manifest.length, 'slides', manifest.length * 5, 'warnings', warn); await b.close();
})();

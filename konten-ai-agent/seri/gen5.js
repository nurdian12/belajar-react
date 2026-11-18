// Tampilan v2: tema gelap + stabilo merah, @handle di tengah bawah.  node gen2.js        -> hanya postingan hari ke-1
//                                                                    ALL=1 node gen2.js  -> semua 30 (ke v2/slides, v2/manifest.json)
const { chromium } = require('playwright'); const path = require('path'); const fs = require('fs');
const B = require('./posts_batch2.js');
const HANDLE = '@alamnurdiann', ALL = !!process.env.ALL;
const KIND = { tips: ['TIPS', '#tipsai'], trik: ['TRIK', '#triksai'], fakta: ['FAKTA UNIK', '#faktaunik'], revisi: ['REVISI PROMPT', '#revisiprompt'] };
const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const hl = s => esc(s).replace(/\*\*(.+?)\*\*/g, '<span class="hl">$1</span>');
const plain = s => String(s).replace(/\*\*/g, '');
const W = 'stroke="#fff" stroke-width="3.4" stroke-linecap="round" stroke-linejoin="round"';
const ICON = { tips: `<svg viewBox="0 0 24 24" fill="none" ${W}><path d="M4 12.5l5 5L20 6.5"/></svg>`, trik: `<svg viewBox="0 0 24 24" fill="#fff" stroke="#fff" stroke-width="1.5" stroke-linejoin="round"><path d="M13 2L4 14h6l-1 8 9-12h-6z"/></svg>`, revisi: `<svg viewBox="0 0 24 24" fill="none" ${W}><path d="M20 12a8 8 0 1 1-2.6-5.9"/><path d="M20 4v5h-5"/></svg>`, fakta: '<span style="font-size:66px;line-height:1;font-weight:800">!</span>' };
const foot = (n, last) => `<div class="foot"><span class="fl">${n} / 5</span><span class="fc"><i></i>${HANDLE}<i></i></span><span class="fr">${last ? 'SELESAI ✓' : 'GESER →'}</span></div>`;
const step = (kind, idx) => `<div class="stephead"><div class="badge">${ICON[kind]}</div><div class="label">${KIND[kind][0]} #${idx}</div></div>`;
const cards = items => items.map((t, i) => `<div class="card"><div class="num">${i + 1}</div><p>${hl(t)}</p></div>`).join('');
function body(s) {
  switch (s.t) {
    case 'cards': return `<h1>${hl(s.h)}</h1>${cards(s.items)}${s.note ? `<div class="note">${hl(s.note)}</div>` : ''}`;
    case 'table': return `<h1>${hl(s.h)}</h1><div class="tbl"><div class="r h" style="grid-template-columns:${s.cols.length === 2 ? '1fr 1.4fr' : '1fr 1fr 1.3fr'}">${s.cols.map(c => `<div>${esc(c)}</div>`).join('')}</div>${s.rows.map(r => `<div class="r" style="grid-template-columns:${s.cols.length === 2 ? '1fr 1.4fr' : '1fr 1fr 1.3fr'}">${r.map(c => `<div>${esc(c)}</div>`).join('')}</div>`).join('')}</div><div class="caption">${esc(s.foot || '')}</div>`;
    case 'prompt': return `<h1>${hl(s.h)}</h1>${cards(s.items)}<div class="prompt"><div class="tag">PROMPT · TEMPEL KE CLAUDE</div><p>${esc(s.prompt)}</p></div>`;
    case 'flow': return `<h1>${hl(s.h)}</h1><div class="pills">${s.pills.map((p, i) => `${i ? '<span class="arrow">→</span>' : ''}<span class="pill">${esc(p)}</span>`).join('')}</div><div class="card" style="padding:34px 40px"><p style="font-weight:600">${hl(s.text)}</p></div>${s.note ? `<div class="note">${hl(s.note)}</div>` : ''}`;
    case 'prompts2': return `<h1>${hl(s.h)}</h1>${s.prompts.map(t => `<div class="prompt"><div class="tag">SALIN-TEMPEL</div><p>${esc(t)}</p></div>`).join('')}`;
    case 'kv': return `<h1>${hl(s.h)}</h1>${s.rows.map((r, i) => `<div class="kv${i === s.rows.length - 1 ? ' res' : ''}"><div class="k">${esc(r[0])}</div><div class="v">${esc(r[1])}</div></div>`).join('')}<div class="caption">${esc(s.foot || '')}</div>`;
    case 'fact': return `<h1>${hl(s.h)}</h1><div class="card" style="padding:36px 40px"><p style="font-weight:600;font-size:35px">${esc(s.body)}</p></div><div class="kv res"><div class="k">KENAPA PENTING</div><div class="v">${esc(s.why)}</div></div><div class="caption">Sumber: ${esc(s.src)}</div>`;
  }
}
const closeBody = c => `<h1>${hl(c.h)}</h1>${c.items.map((t, i) => `<div class="card"><div class="sq">${i + 1}</div><p>${hl(t)}</p></div>`).join('')}<div class="sub" style="font-weight:700">Simpan dulu, praktikkan nanti.</div><div class="btn">SIMPAN POSTINGAN INI</div>`;
function slides(p, n) {
  const [lab] = KIND[p.kind], out = [];
  out.push(`<div class="slide cover" id="p${n}s1"><div class="deco">#${p.n}</div><div class="content" style="top:150px;gap:36px"><div class="chip">${lab} #${p.n} · SERI AI AGENT</div><h1 class="xl">${hl(p.title)}</h1><div class="sub">${esc(p.sub)}</div><div class="swipe">GESER UNTUK BACA →</div></div>${foot(1)}</div>`);
  p.s.forEach((s, i) => out.push(`<div class="slide" id="p${n}s${i + 2}"><div class="content">${step(p.kind, p.n)}${body(s)}</div>${foot(i + 2)}</div>`));
  out.push(`<div class="slide" id="p${n}s5"><div class="content">${step(p.kind, p.n)}${closeBody(p.close)}</div>${foot(5, true)}</div>`);
  return out.join('\n');
}
const css = `
:root{--bg:#0e0f13;--card:#181b22;--line:#2b303b;--red:#ff3b3b;--mut:#8d93a1}
*{box-sizing:border-box;margin:0;padding:0}
body{font-family:'Inter','DejaVu Sans',sans-serif;font-feature-settings:'cv08' 1;color:#fff;background:#222}
.slide{width:1080px;height:1350px;position:relative;overflow:hidden;margin:0 0 30px;background:
 radial-gradient(760px 620px at 105% -5%,rgba(255,59,59,.30),transparent 62%),radial-gradient(640px 520px at -8% 108%,rgba(255,59,59,.16),transparent 62%),
 radial-gradient(rgba(255,255,255,.055) 1.6px,transparent 1.7px) 0 0/38px 38px,var(--bg)}
.slide:before{content:'';position:absolute;left:0;top:0;bottom:0;width:14px;background:var(--red)}
.content{position:absolute;top:96px;left:92px;right:84px;bottom:176px;display:flex;flex-direction:column;gap:30px}
.content>*{flex:none}
.stephead{display:flex;align-items:center;gap:26px;margin-bottom:4px}
.badge{width:104px;height:104px;border-radius:50%;background:var(--red);border:5px solid #fff;display:flex;align-items:center;justify-content:center;font-size:60px;font-weight:800;flex:none;box-shadow:0 10px 30px rgba(255,59,59,.45)}
.badge svg{width:56px;height:56px}
.label{font-size:30px;letter-spacing:.2em;font-weight:800;color:#ff7b74;text-transform:uppercase}
h1{font-size:76px;line-height:1.06;font-weight:800;letter-spacing:-.04em}
h1.xl{font-size:100px;line-height:1.02;letter-spacing:-.05em}
.hl{color:#fff;background:linear-gradient(transparent 6%,var(--red) 6%,var(--red) 94%,transparent 94%);padding:0 14px;margin:0 -4px;border-radius:10px;white-space:nowrap;box-decoration-break:clone;-webkit-box-decoration-break:clone}
.card{background:var(--card);border:2px solid var(--line);border-left:9px solid var(--red);border-radius:30px;padding:36px 38px;display:flex;gap:26px;align-items:center}
.card p{font-size:39px;line-height:1.22;font-weight:700;letter-spacing:-.02em}
.num,.sq{width:62px;height:62px;border-radius:50%;background:var(--red);color:#fff;font-weight:800;font-size:33px;display:flex;align-items:center;justify-content:center;flex:none}
.sq{border-radius:16px;width:68px;height:68px;font-size:40px}
.note{background:rgba(255,59,59,.13);border:2px solid rgba(255,59,59,.5);color:#ffd6d3;border-radius:28px;padding:32px 38px;font-size:35px;line-height:1.3;font-weight:600}
.prompt{background:#f6f2ea;color:#14161b;border-radius:30px;padding:34px 40px;border-left:12px solid var(--red);box-shadow:0 14px 40px rgba(0,0,0,.45)}
.prompt .tag{color:var(--red);font-weight:800;letter-spacing:.16em;font-size:23px}
.prompt p{white-space:pre-line;font-family:'JetBrains Mono','DejaVu Sans Mono',monospace;font-size:31px;line-height:1.4;margin-top:12px;font-weight:600}
.pills{display:flex;align-items:center;gap:14px;flex-wrap:wrap}
.pill{background:var(--red);color:#fff;border-radius:999px;padding:17px 32px;font-weight:800;font-size:34px;box-shadow:0 8px 22px rgba(255,59,59,.35)}
.arrow{color:var(--mut);font-size:38px;font-weight:600}
.sub{font-size:40px;line-height:1.25;font-weight:600;color:#c6cad3;letter-spacing:-.02em}
.caption{font-size:26px;color:var(--mut);font-weight:500;margin-top:-6px}
.chip{align-self:flex-start;border:3px solid var(--red);color:#ff8a84;border-radius:999px;padding:12px 26px;font-size:26px;letter-spacing:.18em;font-weight:800}
.swipe{margin-top:8px;align-self:flex-start;background:var(--red);color:#fff;border-radius:999px;padding:18px 34px;font-size:28px;letter-spacing:.14em;font-weight:800}
.deco{position:absolute;right:-30px;bottom:150px;font-size:430px;font-weight:800;letter-spacing:-.06em;color:transparent;-webkit-text-stroke:3px rgba(255,59,59,.35);line-height:1}
.tbl{border:2px solid var(--line);border-radius:30px;overflow:hidden;background:var(--card)}
.tbl .r{display:grid;grid-template-columns:1fr 1fr 1.3fr;border-top:2px solid var(--line)}
.tbl .r.h{background:var(--red);border-top:0;font-weight:800;letter-spacing:.14em;font-size:24px}
.tbl .r>div{padding:28px 26px;font-size:33px;line-height:1.22;font-weight:500;display:flex;align-items:center;color:#e8eaee}
.tbl .r.h>div{color:#fff;padding:20px 24px}
.tbl .r>div:last-child{background:rgba(255,59,59,.14);font-weight:800;color:#fff}.tbl .r.h>div:last-child{background:#d92424}
.kv{background:var(--card);border:2px solid var(--line);border-radius:30px;padding:26px 32px;display:grid;grid-template-columns:190px 1fr;gap:18px;align-items:center}
.kv .k{font-size:23px;letter-spacing:.14em;color:var(--mut);font-weight:800}.kv .v{font-size:35px;line-height:1.25;font-weight:600}
.kv.res{background:rgba(255,59,59,.13);border:3px solid var(--red)}.kv.res .k{color:#ff8a84}
.btn{display:inline-flex;background:var(--red);color:#fff;border-radius:999px;padding:24px 44px;font-weight:800;font-size:36px;align-self:flex-start;box-shadow:0 12px 30px rgba(255,59,59,.45)}
.foot{position:absolute;left:92px;right:84px;bottom:58px;display:grid;grid-template-columns:1fr auto 1fr;align-items:center;font-size:25px;letter-spacing:.14em;color:var(--mut);font-weight:700}
.foot .fc{color:#fff;font-size:30px;letter-spacing:.04em;font-weight:800;display:flex;align-items:center;gap:14px}.foot .fc i{width:12px;height:12px;border-radius:50%;background:var(--red);display:inline-block}
.foot .fr{text-align:right}
.tight{gap:16px !important}.tight h1{font-size:58px}.tight .card{padding:22px 30px}.tight .card p{font-size:31px}.tight .num{width:54px;height:54px;font-size:29px}.tight .prompt{padding:22px 32px}.tight .prompt p{font-size:26px;margin-top:8px}.tight .badge{width:92px;height:92px}.tight .tbl .r>div{padding:16px 22px;font-size:27px}.tight .kv .v{font-size:30px}
.tighter h1{font-size:52px}.tighter .card p{font-size:29px}.tighter .card{padding:18px 28px}.tighter .prompt p{font-size:24px}
`;
const THEME = process.env.THEME || 'gelap';

const LIGHT = `
:root{--card:#f4f5f7;--line:#e3e5ea;--mut:#6f7684}
body{color:#0e0f13}
.slide{background:radial-gradient(760px 620px at 105% -5%,rgba(255,59,59,.15),transparent 62%),radial-gradient(640px 520px at -8% 108%,rgba(255,59,59,.09),transparent 62%),radial-gradient(rgba(14,15,19,.075) 1.6px,transparent 1.7px) 0 0/38px 38px,#ffffff}
.badge{border:5px solid #0e0f13;box-shadow:0 10px 26px rgba(255,59,59,.35)}
.label{color:#e02d2d}.chip{color:#e02d2d}.sub{color:#3b404b}.arrow,.caption{color:#6f7684}
.card{background:#f4f5f7;border:2px solid #e3e5ea;border-left:9px solid var(--red)}
.note{background:#fff0ef;border:2px solid rgba(255,59,59,.55);color:#8a1c1c}
.prompt{background:#14161b;color:#f6f2ea;box-shadow:0 14px 34px rgba(0,0,0,.2)}.prompt .tag{color:#ff6b64}
.tbl{background:#fff;border-color:#e3e5ea}.tbl .r{border-top-color:#e3e5ea}.tbl .r>div{color:#1b1e25}
.tbl .r>div:last-child{background:#fff0ef;color:#0e0f13}.tbl .r.h>div{color:#fff}.tbl .r.h>div:last-child{background:#d92424}
.kv{background:#f4f5f7;border-color:#e3e5ea}.kv.res{background:#fff0ef;border-color:var(--red)}.kv.res .k{color:#d92424}.kv .k{color:#6f7684}
.deco{-webkit-text-stroke:3px rgba(255,59,59,.28)}
.foot{color:#6f7684}.foot .fc{color:#0e0f13}
`;
B.tips.forEach((p, i) => p.n = 11 + i); B.trik.forEach((p, i) => p.n = 11 + i); B.rev.forEach((p, i) => p.n = 9 + i);
const order = []; const L = [B.rev, B.tips, B.trik]; for (let i = 0; i < 10; i++) L.forEach(l => { if (l[i]) order.push(l[i]); });
const sel = ALL ? order : order.slice(0, 5);
const html = `<!doctype html><html lang="id"><head><meta charset="utf-8"><style>${css}${LIGHT}</style></head><body>${sel.map((p, i) => slides(p, i + 1)).join('\n')}</body></html>`;
const dir = path.join(__dirname, process.env.OUT || 'v5'); fs.mkdirSync(path.join(dir, 'slides'), { recursive: true }); fs.writeFileSync(path.join(dir, 'series.html'), html);
(async () => {
  const b = await chromium.launch(); const pg = await b.newPage({ viewport: { width: 1080, height: 1350 } });
  await pg.goto('file://' + path.join(dir, 'series.html')); await pg.evaluate(() => document.fonts.ready);
  const manifest = []; let warn = 0;
  for (let i = 0; i < sel.length; i++) {
    const p = sel[i], files = [];
    for (let k = 1; k <= 5; k++) {
      const el = await pg.$(`#p${i + 1}s${k}`);
      const over = () => el.evaluate(s => { const c = s.querySelector('.content'); return c.scrollHeight - c.clientHeight; });
      let o = await over();
      for (const cls of ['tight', 'tighter']) if (o > 0) { await el.evaluate((s, c) => s.querySelector('.content').classList.add(c), cls); o = await over(); }
      if (o > 0) { warn++; console.log(`OVERFLOW p${i + 1} s${k} ${o}px`); }
      const f = `${String(i + 1).padStart(2, '0')}-s${k}.jpg`; await el.screenshot({ path: path.join(dir, 'slides', f), type: 'jpeg', quality: 92 }); files.push(f);
    }
    const [lab, tag] = KIND[p.kind];
    const ask = { revisi: 'Kalimat revisi mana yang mau kamu coba duluan? Tulis di komentar.', tips: 'Tips mana yang paling kamu butuhkan sekarang? Tulis di komentar.', trik: 'Trik ini sudah pernah kamu coba? Ceritakan di komentar.', fakta: 'Fakta mana yang paling mengejutkan buatmu? Komen ya.' }[p.kind];
    const caption =  `${lab} #${p.n}: ${plain(p.title)}\n\n${p.sub}\n\nYang dibahas:\n${p.close.items.map((t, j) => `${j + 1}. ${plain(t)}`).join('\n')}\n\n${ask} 👇\nSimpan postingan ini buat dipraktikkan, dan geser sampai slide terakhir. 👉${p.kind === 'fakta' ? `\n\nSumber: ${p.s[0].src}.` : ''}\n\n#aiagent #agentai #claude #otomatisasi #belajarai #aiindonesia ${tag}`;
    manifest.push({ day: i + 1, kind: p.kind, n: p.n, title: plain(p.title), files, caption });
  }
  fs.writeFileSync(path.join(dir, 'manifest.json'), JSON.stringify(manifest, null, 1));
  console.log('posts', manifest.length, 'warnings', warn); await b.close();
})();

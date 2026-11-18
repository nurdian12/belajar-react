const { chromium } = require('playwright'); const path = require('path'); const fs = require('fs');
(async () => {
  const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1080, height: 1350 } });
  await p.goto('file://' + path.join(__dirname, 'carousel.html')); await p.evaluate(() => document.fonts.ready);
  const out = path.join(__dirname, 'slides'); fs.mkdirSync(out, { recursive: true });
  const els = await p.$$('.slide'); let bad = 0;
  for (let i = 0; i < els.length; i++) {
    // overflow check: content block must end above the footer
    const over = await els[i].evaluate(s => { const c = s.querySelector('.content'); const f = s.querySelector('.foot'); return (c.scrollHeight - c.clientHeight); });
    if (over > 0) { bad++; console.log('slide', i + 1, 'overflow', over, 'px'); }
    await els[i].screenshot({ path: path.join(out, `slide-${String(i + 1).padStart(2, '0')}.png`) });
  }
  console.log('slides', els.length, 'overflow', bad); await b.close();
})();

const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');
const [,, mode, a1, a2, a3] = process.argv;
const TL = fs.readFileSync(path.join(__dirname, 'timeline.json'), 'utf8');
const FPS = 30;
async function run(times, outDir, nameOf) {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 720, height: 1280 } });
  page.on('pageerror', e => console.error('PAGEERR', e.message));
  await page.addInitScript('window.TL=' + TL);
  await page.goto('file://' + path.join(__dirname, 'index.html'));
  fs.mkdirSync(outDir, { recursive: true });
  for (const [i, t] of times) {
    await page.evaluate(t => render(t), t);
    await page.screenshot({ path: path.join(outDir, nameOf(i, t)), type: 'jpeg', quality: 92 });
  }
  await browser.close();
}
(async () => {
  if (mode === 'probe') {           // probe t1,t2,... -> /probe
    const ts = a1.split(',').map(Number);
    await run(ts.map((t, i) => [i, t]), a2 || path.join(__dirname, 'probe'), (i, t) => `p_${String(i).padStart(3, '0')}_${t}.jpg`);
  } else {                          // frames start end
    const s = +a1, e = +a2, out = a3;
    const arr = []; for (let f = s; f < e; f++) arr.push([f, f / FPS]);
    await run(arr, out, (i) => `f${String(i).padStart(5, '0')}.jpg`);
  }
})();

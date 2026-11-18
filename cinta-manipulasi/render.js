// usage: node render.js <id> [fps] [previewOnly]
const { chromium } = require('playwright');
const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

const id = +process.argv[2];
const fps = +(process.argv[3] || 30);
const preview = process.argv[4] === 'preview';
const DUR = 20;
const NAMES = process.env.VER === '2'
  ? { 1: 'baru-2-minggu-soulmate', 2: 'dibilang-lebay', 3: 'maaf-ke-100', 4: 'kalau-kamu-sayang-tali', 5: 'putus-balikan-rantai', 6: 'share-loc-vs-kabarin' }
  : { 1: 'love-bombing-hadiah-berbayar', 2: 'gaslighting-kebalikannya', 3: 'diminta-maaf-hitungan', 4: 'manipulasi-tali-boneka', 5: 'siklus-rantai', 6: 'peduli-vs-kontrol' };
const VER = process.env.VER || '';
const outDir = path.join(__dirname, 'out' + VER); fs.mkdirSync(outDir, { recursive: true });
const tmp = process.env.TMPD || outDir;

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1080, height: 1920 } });
  await page.goto('file://' + path.join(__dirname, `scenes${VER}.html`));
  await page.waitForFunction('window.ready === true');
  if (preview) {
    // contact-sheet frames
    const times = process.argv[5] ? process.argv[5].split(',').map(Number) : [1.5, 4, 7, 10, 12.5, 14.5, 16.5, 19];
    for (const [i, t] of times.entries()) {
      await page.evaluate(([a, b]) => window.render(a, b), [id, t]);
      const b64 = await page.evaluate(() => document.getElementById('c').toDataURL('image/png').split(',')[1]);
      fs.writeFileSync(path.join(tmp, `p${id}_${String(i).padStart(2, '0')}.png`), Buffer.from(b64, 'base64'));
    }
    await browser.close(); return;
  }
  const out = path.join(outDir, `video${id}-${NAMES[id]}.mp4`);
  const ff = spawn('ffmpeg', ['-y', '-v', 'error', '-f', 'image2pipe', '-framerate', String(fps), '-c:v', 'mjpeg', '-i', '-',
    '-i', path.join(tmp, `audio${id}.wav`), '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-crf', '20', '-preset', 'medium',
    '-c:a', 'aac', '-b:a', '128k', '-shortest', '-movflags', '+faststart', out], { stdio: ['pipe', 'inherit', 'inherit'] });
  const N = DUR * fps;
  for (let f = 0; f < N; f++) {
    const t = f / fps;
    const b64 = await page.evaluate(([a, b]) => { window.render(a, b); return document.getElementById('c').toDataURL('image/jpeg', 0.92).split(',')[1]; }, [id, t]);
    if (!ff.stdin.write(Buffer.from(b64, 'base64'))) await new Promise(r => ff.stdin.once('drain', r));
  }
  ff.stdin.end();
  await new Promise(r => ff.on('close', r));
  await browser.close();
  console.log('done', out);
})();

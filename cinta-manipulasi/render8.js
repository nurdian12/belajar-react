// usage: node render3.js <id> [fps]   -> out8/videoN-*.mp4 (video + SFX + musik)
const { chromium } = require('playwright');
const { spawn, execFileSync } = require('child_process');
const path = require('path');
const fs = require('fs');

const id = +process.argv[2];
const fps = +(process.argv[3] || 30);
const DUR = 20;
const NAMES = { 1: 'cinta-tulus-vs-fisik-pelukan' };
const outDir = path.join(__dirname, 'out8'); fs.mkdirSync(outDir, { recursive: true });
const tmp = process.env.TMPD || outDir; fs.mkdirSync(tmp, { recursive: true });

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1080, height: 1920 } });
  await page.goto('file://' + path.join(__dirname, 'scenes8.html'));
  await page.waitForFunction('window.ready === true');
  const cues = await page.evaluate(i => window.CUES[i], id);
  const reveal = 6.8;
  const cueFile = path.join(tmp, `cues${id}.json`), wav = path.join(tmp, `audio8_${id}.wav`);
  fs.writeFileSync(cueFile, JSON.stringify(cues));
  console.log(execFileSync('python3', [path.join(__dirname, 'make_audio8.py'), cueFile, wav, String(reveal)]).toString().trim());
  const out = path.join(outDir, `video${id}-${NAMES[id]}.mp4`);
  const ff = spawn('ffmpeg', ['-y', '-v', 'error', '-f', 'image2pipe', '-framerate', String(fps), '-c:v', 'mjpeg', '-i', '-',
    '-i', wav, '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-crf', '19', '-preset', 'medium',
    '-c:a', 'aac', '-b:a', '160k', '-shortest', '-movflags', '+faststart', out], { stdio: ['pipe', 'inherit', 'inherit'] });
  const N = DUR * fps;
  for (let f = 0; f < N; f++) {
    const t = f / fps;
    const b64 = await page.evaluate(([a, b]) => { window.render(a, b); return document.getElementById('c').toDataURL('image/jpeg', 0.93).split(',')[1]; }, [id, t]);
    if (!ff.stdin.write(Buffer.from(b64, 'base64'))) await new Promise(r => ff.stdin.once('drain', r));
  }
  ff.stdin.end();
  await new Promise(r => ff.on('close', r));
  await browser.close();
  console.log('done', out);
})();

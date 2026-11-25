// Reel "AI yang selalu mengiyakan": b-roll meme/ilustrasi + voice over (50,37 dtk), 1080x1920, 30 fps.
// node render.js [--test=detik]
const { chromium } = require('playwright'); const { spawn } = require('child_process'); const fs = require('fs'), path = require('path');
const W = 1080, H = 1920, FPS = 30, DUR = 50.37; const dir = __dirname;
const IMG = n => 'data:image/jpeg;base64,' + fs.readFileSync(path.join(dir, n + '.jpg')).toString('base64');
const IMGS = { selfie: IMG('selfie'), butler: IMG('butler'), terminator: IMG('terminator'), jas: IMG('jas') };
// [mulaiAdegan, akhirAdegan, mulaiSuara, akhirSuara, gambar, teks (*kata* = sorot kuning)]
const SEG = [
  [0, 3.7, 0.05, 3.38, 'jas', 'Kok bisa sih AI selalu bilang idemu *bagus*, padahal belum tentu?'],
  [3.7, 7.5, 3.99, 7.24, 'selfie', 'Kamu tanya soal rencana usaha, tulisan, atau harga.'],
  [7.5, 9.0, 7.69, 8.79, 'butler', 'AI sering *menyetujui*.'],
  [9.0, 12.6, 9.22, 12.24, 'terminator', 'Enak didengar, tapi kalau idemu salah, kamu *tidak sadar*.'],
  [12.6, 15.5, 12.91, 15.25, 'butler', 'AI cenderung mengikuti arah *pertanyaanmu*.'],
  [15.5, 18.9, 15.61, 18.58, 'selfie', 'Kalau kamu tanya "ini bagus kan?", jawabannya sering "*bagus*".'],
  [18.9, 22.3, 19.18, 22.09, 'jas', 'Perbaikannya sederhana: ubah *cara bertanya*.'],
  [22.3, 30.0, 22.48, 29.73, 'jas', 'Jangan minta persetujuan, minta *kritik*. Contohnya: "Kritik rencanaku. Sebutkan *tiga kelemahan* dan asumsi yang belum teruji."'],
  [30.0, 32.75, 30.27, 32.52, 'butler', 'Atau taruh satu *instruksi tetap* di awal:'],
  [32.75, 36.75, 32.97, 36.47, 'butler', '"Jangan langsung setuju. Kalau pendapatku lemah, katakan dengan *alasan*."'],
  [36.75, 40.6, 37.0, 40.43, 'terminator', 'Tapi ingat: AI tetap bisa *salah*, termasuk saat mengkritik.'],
  [40.6, 43.8, 40.79, 43.53, 'jas', '*Periksa* hal penting, dan jangan tempel *data pribadi*.'],
  [43.8, 45.4, 44.06, 45.18, 'selfie', 'Mau lima prompt *penantangnya*?'],
  [45.4, 46.8, 45.56, 46.6, 'selfie', 'Komen *JUJUR*.'],
  [46.8, 50.37, 46.99, 50.37, 'butler', 'Dan kirim ke temanmu yang semua idenya selalu dibilang *jenius*.'],
];
// pecah tiap kalimat jadi potongan <=4 kata, waktu dibagi sesuai jumlah huruf
const CAPS = [];
for (const s of SEG) {
  const words = s[5].split(' '); const chunks = []; let cur = [];
  for (const w of words) { cur.push(w); if (cur.length >= 4 || /[.?:,]"?$/.test(w) && cur.length >= 2) { chunks.push(cur.join(' ')); cur = []; } }
  if (cur.length) { if (chunks.length && cur.length === 1) chunks[chunks.length - 1] += ' ' + cur[0]; else chunks.push(cur.join(' ')); }
  const tot = chunks.reduce((a, c) => a + c.replace(/\*/g, '').length, 0); let t = s[2];
  chunks.forEach((c, i) => { const d = (s[3] - s[2]) * c.replace(/\*/g, '').length / tot; CAPS.push([t, t + d, c]); t += d; });
}
const html = `<!doctype html><html><head><meta charset="utf-8"><style>body{margin:0;background:#000}canvas{display:block}</style></head><body><canvas id="c" width="${W}" height="${H}"></canvas>
<script>
const W=${W},H=${H};const c=document.getElementById('c'),x=c.getContext('2d');
const SEG=${JSON.stringify(SEG.map(s => s.slice(0, 5)))};const CAPS=${JSON.stringify(CAPS)};const SRC=${JSON.stringify(IMGS)};const IM={};
const clamp=(v,a=0,b=1)=>Math.min(b,Math.max(a,v)),lerp=(a,b,t)=>a+(b-a)*t,ease=t=>t<.5?4*t*t*t:1-Math.pow(-2*t+2,3)/2,prog=(t,a,b)=>clamp((t-a)/(b-a));
const F='Inter, DejaVu Sans, sans-serif';
function rr(X,Y,w,h,r){x.beginPath();x.moveTo(X+r,Y);x.arcTo(X+w,Y,X+w,Y+h,r);x.arcTo(X+w,Y+h,X,Y+h,r);x.arcTo(X,Y+h,X,Y,r);x.arcTo(X,Y,X+w,Y,r);x.closePath()}
function txt(s,X,Y,size,col='#fff',w=800,al='left',stroke=0){x.font=w+' '+size+'px '+F;x.textAlign=al;x.textBaseline='alphabetic';if(stroke){x.lineWidth=stroke;x.strokeStyle='#000';x.lineJoin='round';x.strokeText(s,X,Y)}x.fillStyle=col;x.fillText(s,X,Y)}
function segAt(t){for(let i=0;i<SEG.length;i++)if(t<SEG[i][1])return i;return SEG.length-1}
function bg(name,t,a,b){const im=IM[name];const iw=im.width,ih=im.height;const p=prog(t,a,b);
  // latar buram
  x.save();x.filter='blur(40px) brightness(.55)';const s0=Math.max(W/iw,H/ih)*1.15;x.drawImage(im,(W-iw*s0)/2,(H-ih*s0)/2,iw*s0,ih*s0);x.restore();
  const ratio=iw/ih;const zoom=lerp(1.04,1.17,ease(p));
  if(ratio>.9){ // persegi: kartu di tengah
    const w=1000*zoom*.94,h=w/ratio;x.save();x.translate(W/2,820);rr(-w/2,-h/2,w,h,36);x.clip();x.drawImage(im,-w/2,-h/2,w,h);x.restore();
    x.save();x.translate(W/2,820);rr(-1000*zoom*.47,-1000*zoom*.47/ratio,1000*zoom*.94,2000*zoom*.47/ratio,36);x.lineWidth=6;x.strokeStyle='rgba(255,255,255,.85)';x.stroke();x.restore();
  }else{const s=Math.max(W/iw,H/ih)*zoom;const px=(name==='butler'?lerp(-30,30,p):0);x.save();x.translate(W/2+px,H/2);x.drawImage(im,-iw*s/2,-ih*s/2,iw*s,ih*s);x.restore()}
  const g=x.createLinearGradient(0,0,0,H);g.addColorStop(0,'rgba(0,0,0,.45)');g.addColorStop(.35,'rgba(0,0,0,0)');g.addColorStop(.62,'rgba(0,0,0,0)');g.addColorStop(1,'rgba(0,0,0,.72)');x.fillStyle=g;x.fillRect(0,0,W,H)}
function bubble(s,X,Y,col,tcol,t,t0,size=54,align='left'){const p=ease(prog(t,t0,t0+.3));if(p<=0)return;x.save();x.font='800 '+size+'px '+F;const w=x.measureText(s).width+90,h=size+60;
  const bx=align==='right'?W-60-w:X;x.translate(bx+w/2,Y+h/2);x.scale(.7+.3*p,.7+.3*p);x.globalAlpha=p;rr(-w/2,-h/2,w,h,h/2);x.fillStyle=col;x.shadowColor='rgba(0,0,0,.45)';x.shadowBlur=28;x.fill();x.shadowBlur=0;
  x.fillStyle=tcol;x.textAlign='center';x.textBaseline='middle';x.fillText(s,0,4);x.restore()}
function card(label,lines,t,t0,t1,Y,H2,col){const p=ease(prog(t,t0,t0+.4))*(1-ease(prog(t,t1-.3,t1)));if(p<=0)return;x.save();x.globalAlpha=p;x.translate(0,(1-p)*40);
  rr(70,Y,940,H2,36);x.fillStyle='rgba(8,10,20,.92)';x.fill();x.lineWidth=4;x.strokeStyle=col;x.stroke();
  rr(100,Y+28,label.length*26+60,56,28);x.fillStyle=col;x.fill();txt(label,130,Y+68,28,'#fff',800);
  const all=lines.join(' ').length;const n=Math.floor(prog(t,t0+.4,t1-.8)*all);let used=0;
  lines.forEach((s,i)=>{const take=Math.max(0,Math.min(s.length,n-used));used+=s.length+1;txt(s.slice(0,take),105,Y+150+i*62,50,'#f6f2ea',700)});
  if(Math.floor(t*3)%2===0&&n<all){}
  x.restore()}
function caption(t){let i=-1;for(let k=0;k<CAPS.length;k++)if(t>=CAPS[k][0])i=k;if(i<0)return;if(t>CAPS[i][1]+.25)return;
  const s=CAPS[i][2];const pop=ease(prog(t,CAPS[i][0],CAPS[i][0]+.12));x.save();x.translate(W/2,1500);const sc=.9+.1*pop;x.scale(sc,sc);x.globalAlpha=pop;
  // pecah ke baris
  const parts=s.split(' ').map(w=>({w:w.replace(/\\*/g,''),hl:w.includes('*')}));const size=76;x.font='900 '+size+'px '+F;const lines=[];let cur=[],cw=0;
  for(const p of parts){const ww=x.measureText(p.w+' ').width;if(cw+ww>900&&cur.length){lines.push(cur);cur=[];cw=0}cur.push(p);cw+=ww}if(cur.length)lines.push(cur);
  lines.forEach((L,li)=>{const tw=L.reduce((a,p)=>a+x.measureText(p.w+' ').width,0);let X=-tw/2;const Y=(li-(lines.length-1)/2)*92;
    for(const p of L){x.textAlign='left';x.textBaseline='alphabetic';x.lineWidth=16;x.strokeStyle='#000';x.lineJoin='round';x.strokeText(p.w,X,Y);x.fillStyle=p.hl?'#ffd21f':'#fff';x.fillText(p.w,X,Y);X+=x.measureText(p.w+' ').width}});
  x.restore()}
function draw(t){
  const i=segAt(t);const s=SEG[i];x.fillStyle='#000';x.fillRect(0,0,W,H);
  let sh=0;const dt=t-s[0];if(dt<.18&&i>0)sh=(1-dt/.18)*14*Math.sin(t*120);
  x.save();x.translate(sh,0);bg(s[4],t,s[0],s[1]);x.restore();
  // hook
  if(t<3.7){const p=ease(prog(t,.1,.5));x.save();x.globalAlpha=p*(1-ease(prog(t,3.3,3.7)));x.translate(W/2,300);x.scale(.85+.15*p,.85+.15*p);txt('AI SELALU',0,0,100,'#fff',900,'center',18);txt('BILANG \\u201CBAGUS\\u201D?',0,112,100,'#ffd21f',900,'center',18);x.restore()}
  // gelembung "setuju"
  if(t>=7.5&&t<9.0){bubble('Setuju!',70,330,'#25c26a','#fff',t,7.7);bubble('Ide bagus!',70,520,'#25c26a','#fff',t,8.0,54,'right');bubble('Mantap banget!',70,710,'#25c26a','#fff',t,8.35)}
  if(t<3.7)bubble('Idemu bagus banget!',70,620,'#25c26a','#fff',t,.6,52,'right');
  if(t>=15.5&&t<18.9){bubble('Ini bagus kan?',70,320,'#1d6fe8','#fff',t,15.8);bubble('Bagus!',70,500,'#e9ecf3','#10142a',t,17.0,54,'right')}
  if(t>=22.3&&t<30)card('PROMPT 1',['Kritik rencanaku.','Sebutkan 3 kelemahan','dan asumsi yang belum teruji.'],t,22.9,29.8,330,420,'#1d6fe8');
  if(t>=32.75&&t<36.75)card('INSTRUKSI TETAP',['Jangan langsung setuju.','Kalau pendapatku lemah,','katakan dengan alasan.'],t,32.9,36.7,330,420,'#1d6fe8');
  if(t>=36.75&&t<43.8){const p=ease(prog(t,36.9,37.3))*(1-ease(prog(t,43.4,43.8)));if(p>0){x.save();x.globalAlpha=p;x.translate(W/2,330);const pulse=1+.03*Math.sin(t*9);x.scale(pulse,pulse);rr(-250,-70,500,140,70);x.fillStyle='#ffc233';x.fill();txt('PAGAR',0,32,92,'#1a1200',900,'center');x.restore()}
    [[40.9,'Periksa hal penting'],[42.1,'Jangan tempel data pribadi']].forEach(([t0,s2],k)=>{const a=ease(prog(t,t0,t0+.35))*(1-ease(prog(t,43.4,43.8)));if(a>0){x.save();x.globalAlpha=a;rr(90,520+k*130,900,104,52);x.fillStyle='rgba(8,10,20,.9)';x.fill();x.fillStyle='#25c26a';x.beginPath();x.arc(150,572+k*130,34,0,7);x.fill();txt('\\u2713',150,588+k*130,44,'#fff',900,'center');txt(s2,215,588+k*130,48,'#fff',800);x.restore()}})}
  if(t>=45.4){const p=ease(prog(t,45.4,45.8));x.save();x.globalAlpha=p;const pulse=1+.04*Math.sin((t-45.4)*9);x.translate(W/2,430);x.scale(pulse,pulse);rr(-400,-110,800,220,60);x.fillStyle='#1d6fe8';x.shadowColor='#1d6fe8';x.shadowBlur=50;x.fill();x.shadowBlur=0;
    txt('KOMEN',0,-8,64,'#fff',800,'center');txt('JUJUR',0,80,96,'#ffd21f',900,'center');x.restore();
    const q=ease(prog(t,47.2,47.6));if(q>0){x.save();x.globalAlpha=q;txt('+ kirim ke temanmu',W/2,640,52,'#fff',800,'center',12);x.restore()}}
  // kilat transisi
  const d2=t-s[0];if(i>0&&d2<.1){x.fillStyle='rgba(255,255,255,'+.45*(1-d2/.1)+')';x.fillRect(0,0,W,H)}
  caption(t);
  x.save();x.globalAlpha=.6;txt('@alamnurdiann',W-60,H-70,36,'#fff',800,'right',8);x.restore();
  x.save();x.globalAlpha=.05;for(let k=0;k<260;k++){x.fillStyle=Math.random()>.5?'#fff':'#000';x.fillRect(Math.random()*W,Math.random()*H,3,3)}x.restore();
}
window.draw=draw;window.ready=Promise.all(Object.keys(SRC).map(k=>new Promise(r=>{const im=new Image();im.onload=()=>{IM[k]=im;r()};im.src=SRC[k]}))).then(()=>document.fonts.load('900 76px Inter')).then(()=>true);
</script></body></html>`;
fs.writeFileSync(path.join(dir, 'scene.html'), html);
(async () => {
  const test = (process.argv.find(a => a.startsWith('--test=')) || '').split('=')[1];
  const b = await chromium.launch(); const pg = await b.newPage({ viewport: { width: W, height: H } });
  pg.on('pageerror', e => console.log('PAGEERR', e.message));
  await pg.goto('file://' + path.join(dir, 'scene.html')); await pg.evaluate(() => window.ready);
  if (test) { for (const tt of test.split(',')) { await pg.evaluate(t => window.draw(t), +tt); const d = await pg.evaluate(() => document.getElementById('c').toDataURL('image/jpeg', .85)); fs.writeFileSync(path.join(dir, `test_${tt}.jpg`), Buffer.from(d.split(',')[1], 'base64')); } await b.close(); return; }
  const N = Math.round(DUR * FPS);
  const out = path.join(dir, 'reel-jujur.mp4');
  const ff = spawn('ffmpeg', ['-y', '-v', 'error', '-f', 'image2pipe', '-framerate', String(FPS), '-c:v', 'mjpeg', '-i', '-', '-i', path.join(dir, 'voice.wav'), '-i', path.join(dir, 'sfx.wav'),
    '-filter_complex', '[1:a]aresample=44100,volume=1.2[v];[2:a]volume=0.45[s];[v][s]amix=inputs=2:duration=first:normalize=0,alimiter=limit=0.95[a]', '-map', '0:v', '-map', '[a]',
    '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-crf', '20', '-preset', 'medium', '-r', String(FPS), '-c:a', 'aac', '-b:a', '160k', '-t', String(DUR), out], { stdio: ['pipe', 'inherit', 'inherit'] });
  for (let i = 0; i < N; i++) {
    const d = await pg.evaluate(t => { window.draw(t); return document.getElementById('c').toDataURL('image/jpeg', .88); }, i / FPS);
    if (!ff.stdin.write(Buffer.from(d.split(',')[1], 'base64'))) await new Promise(r => ff.stdin.once('drain', r));
    if (i % 200 === 0) console.log('frame', i, '/', N);
  }
  ff.stdin.end(); await new Promise(r => ff.on('close', r)); await b.close(); console.log('selesai');
})();

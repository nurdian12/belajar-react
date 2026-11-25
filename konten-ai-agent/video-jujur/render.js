// Reel "AI yang selalu mengiyakan" - gaya referensi: latar putih, teks tulisan tangan di atas, 1 visual pop-in per frasa.
// node render.js [--test=detik,detik] | node render.js --chunks
const { chromium } = require('playwright'); const { spawn } = require('child_process'); const fs = require('fs'), path = require('path');
const W = 1080, H = 1920, FPS = 30, DUR = 50.37; const dir = __dirname;
const IMG = (n, m = 'jpeg') => `data:image/${m};base64,` + fs.readFileSync(path.join(dir, n)).toString('base64');
const IMGS = { selfie: IMG('selfie.jpg'), butler: IMG('butler.jpg'), terminator: IMG('terminator.jpg'), jas: IMG('jas_putih.jpg') };
for (let i = 0; i < 9; i++) IMGS['face' + i] = IMG(`face${i}.png`, 'png');
const FONT = fs.readFileSync(path.join(dir, 'fonts/kalam-latin-700-normal.woff2')).toString('base64');
// [mulaiSuara, akhirSuara, teks, [visual per frasa]]
const SEG = [
  [0.05, 3.38, 'Kok bisa sih AI selalu bilang idemu bagus, padahal belum tentu?', ['jasBubble', 'tanya']],
  [3.99, 7.24, 'Kamu tanya soal rencana usaha, tulisan, atau harga.', ['selfie', 'chips']],
  [7.69, 8.79, 'AI sering menyetujui.', ['setuju']],
  [9.22, 12.24, 'Enak didengar, tapi kalau idemu salah, kamu tidak sadar.', ['terminator', 'salah', 'faceTanya']],
  [12.91, 15.25, 'AI cenderung mengikuti arah pertanyaanmu.', ['butler', 'arah']],
  [15.61, 18.58, 'Kalau kamu tanya "ini bagus kan?", jawabannya sering "bagus".', ['tanyaBagus', 'jawabBagus']],
  [19.18, 22.09, 'Perbaikannya sederhana: ubah cara bertanya.', ['butlerFace', 'ubah']],
  [22.48, 29.73, 'Jangan minta persetujuan, minta kritik. Contohnya: "Kritik rencanaku. Sebutkan tiga kelemahan dan asumsi yang belum teruji."', ['silang', 'centang', 'prompt1', 'prompt1', 'prompt1']],
  [30.27, 32.52, 'Atau taruh satu instruksi tetap di awal:', ['jasFace', 'awal']],
  [32.97, 36.47, '"Jangan langsung setuju. Kalau pendapatku lemah, katakan dengan alasan."', ['prompt2', 'prompt2', 'prompt2']],
  [37.0, 40.43, 'Tapi ingat: AI tetap bisa salah, termasuk saat mengkritik.', ['pagar', 'terminatorFace', 'terminatorFace']],
  [40.79, 43.53, 'Periksa hal penting, dan jangan tempel data pribadi.', ['cek1', 'cek2']],
  [44.06, 45.18, 'Mau lima prompt penantangnya?', ['paket']],
  [45.56, 46.6, 'Komen JUJUR.', ['cta']],
  [46.99, 50.37, 'Dan kirim ke temanmu yang semua idenya selalu dibilang jenius.', ['kirim', 'butlerFace']],
];
// pecah frasa pendek (maks 5 kata), waktu dibagi menurut jumlah huruf
const CH = [];
SEG.forEach((s, si) => {
  const words = s[2].split(' '); const parts = []; let cur = [];
  for (const w of words) { cur.push(w); if (/[.?:,]"?[,.]?$/.test(w) && cur.length >= 2 || cur.length >= 6) { parts.push(cur.join(' ')); cur = []; } }
  if (cur.length) { if (parts.length && cur.length <= 2) parts[parts.length - 1] += ' ' + cur.join(' '); else parts.push(cur.join(' ')); }
  const tot = parts.reduce((a, c) => a + c.length, 0); let t = s[0];
  parts.forEach((p, i) => { const d = (s[1] - s[0]) * p.length / tot; CH.push({ a: i === 0 ? (si === 0 ? 0 : s[0] - .25) : t, b: i === parts.length - 1 ? (SEG[si + 1] ? SEG[si + 1][0] - .25 : DUR) : t + d, text: p, vis: s[3][Math.min(i, s[3].length - 1)], seg: si }); t += d; });
});
if (process.argv.includes('--chunks')) { CH.forEach(c => console.log(c.a.toFixed(2), c.b.toFixed(2), c.vis.padEnd(14), c.text)); process.exit(0); }
const html = `<!doctype html><html><head><meta charset="utf-8"><style>@font-face{font-family:Kalam;font-weight:700;src:url(data:font/woff2;base64,${FONT})}body{margin:0;background:#fff}canvas{display:block}</style></head><body><canvas id="c" width="${W}" height="${H}"></canvas>
<script>
const W=${W},H=${H};const c=document.getElementById('c'),x=c.getContext('2d');
const CH=${JSON.stringify(CH)};const SRC=${JSON.stringify(IMGS)};const IM={};
const clamp=(v,a=0,b=1)=>Math.min(b,Math.max(a,v)),lerp=(a,b,t)=>a+(b-a)*t,ease=t=>t<.5?4*t*t*t:1-Math.pow(-2*t+2,3)/2,prog=(t,a,b)=>clamp((t-a)/(b-a));
const back=t=>{const c1=1.9,c3=c1+1;return 1+c3*Math.pow(t-1,3)+c1*Math.pow(t-1,2)};
const FK='Kalam, sans-serif',FI='Inter, DejaVu Sans, sans-serif';const BLUE='#1d6fe8',GREEN='#25c26a',RED='#e5352b',YEL='#ffc233';
function rr(X,Y,w,h,r){x.beginPath();x.moveTo(X+r,Y);x.arcTo(X+w,Y,X+w,Y+h,r);x.arcTo(X+w,Y+h,X,Y+h,r);x.arcTo(X,Y+h,X,Y,r);x.arcTo(X,Y,X+w,Y,r);x.closePath()}
function txt(s,X,Y,size,col='#111',w=800,al='center',fam=FI){x.font=w+' '+size+'px '+fam;x.textAlign=al;x.textBaseline='alphabetic';x.fillStyle=col;x.fillText(s,X,Y)}
function shadow(on=true){x.shadowColor=on?'rgba(0,0,0,.28)':'transparent';x.shadowBlur=on?30:0;x.shadowOffsetY=on?12:0}
function bub(s,cx,cy,col,tcol,size=52,t0=0,t=9,tail=0){const p=back(prog(t,t0,t0+.3));if(p<=0)return;x.save();x.font='800 '+size+'px '+FI;const w=x.measureText(s).width+80,h=size+56;x.translate(cx,cy);x.scale(p,p);shadow();rr(-w/2,-h/2,w,h,h/2);x.fillStyle=col;x.fill();shadow(false);
  if(tail){x.beginPath();x.moveTo(tail*(w/2-70),h/2-4);x.lineTo(tail*(w/2-20),h/2+44);x.lineTo(tail*(w/2-120),h/2-4);x.fill()}x.fillStyle=tcol;x.textAlign='center';x.textBaseline='middle';x.fillText(s,0,4);x.restore()}
function pic(name,cx,cy,w,rot=0,round=28,frame=true){const im=IM[name];const h=w*im.height/im.width;x.save();x.translate(cx,cy);x.rotate(rot);shadow(frame);if(frame){rr(-w/2,-h/2,w,h,round);x.fillStyle='#fff';x.fill();shadow(false);x.save();rr(-w/2,-h/2,w,h,round);x.clip();x.drawImage(im,-w/2,-h/2,w,h);x.restore()}else{x.drawImage(im,-w/2,-h/2,w,h)}x.restore()}
function face(cx,cy,w,rot=0,k=1){const im=IM['face'+k];const h=w*im.height/im.width;x.save();x.translate(cx,cy);x.rotate(rot);shadow();x.drawImage(im,-w/2,-h/2,w,h);x.restore()}
function chip(s,cx,cy,col,tcol='#fff',size=44,mark=''){x.save();x.font='800 '+size+'px '+FI;const w=x.measureText(s).width+70+(mark?60:0),h=size+44;shadow();rr(cx-w/2,cy-h/2,w,h,h/2);x.fillStyle=col;x.fill();shadow(false);x.fillStyle=tcol;x.textAlign='center';x.textBaseline='middle';x.fillText(s,cx+(mark?30:0),cy+3);
  if(mark){x.font='900 '+size+'px '+FI;x.fillText(mark,cx-w/2+48,cy+3)}x.restore()}
function typed(lines,t,t0,t1){const all=lines.join(' ').length;const n=Math.floor(prog(t,t0,t1)*all);let used=0;return lines.map(s=>{const take=Math.max(0,Math.min(s.length,n-used));used+=s.length+1;return s.slice(0,take)})}
function card(label,lines,t,t0,t1,cx,cy,col){const w=900,h=150+lines.length*74;x.save();x.translate(cx,cy);shadow();rr(-w/2,-h/2,w,h,36);x.fillStyle='#10142a';x.fill();shadow(false);
  rr(-w/2+34,-h/2+30,label.length*24+64,56,28);x.fillStyle=col;x.fill();txt(label,-w/2+66,-h/2+70,28,'#fff',800,'left');
  typed(lines,t,t0,t1).forEach((s,i)=>txt(s,-w/2+40,-h/2+170+i*74,52,'#f6f2ea',700,'left'));x.restore()}
function vis(t,V){ // V: nama visual, lt: waktu sejak muncul
  const p=V.lt;
  switch(V.n){
  case 'jasBubble':pic('jas',470,1010,640,0,0,false);bub('Idemu bagus banget!',400,740,GREEN,'#fff',54,.35,p,1);face(850,560,300,.1,2);break;
  case 'tanya':x.save();x.translate(540,1010);const s=back(prog(p,0,.35));x.scale(s,s);txt('?',0,230,720,'#111',900,'center',FK);x.restore();face(800,700,330,.15*Math.sin(p*5),7);break;
  case 'selfie':pic('selfie',540,1000,560,-.03,34);break;
  case 'chips':chip('rencana usaha',540,800,BLUE);chip('tulisan',540,960,'#7a4de8');chip('harga',540,1120,'#f08a1d');break;
  case 'setuju':pic('butler',540,1010,560,0,0,false);bub('Setuju!',300,640,GREEN,'#fff',54,.1,p);bub('Ide bagus!',790,820,GREEN,'#fff',54,.4,p);bub('Mantap banget!',330,1020,GREEN,'#fff',54,.7,p);break;
  case 'terminator':pic('terminator',540,1000,860,.02,30);face(210,620,290,-.1,2);break;
  case 'salah':x.save();rr(90,760,900,240,36);shadow();x.fillStyle='#fff';x.fill();shadow(false);x.restore();txt('idemu salah',540,920,110,'#111',900,'center',FK);
    {const a=prog(p,.3,.6);x.save();x.strokeStyle=RED;x.lineWidth=18;x.lineCap='round';x.beginPath();x.moveTo(120,860);x.lineTo(120+a*800,980);x.stroke();x.restore()}bub('tidak ada yang sadar',540,1150,RED,'#fff',44,.7,p);break;
  case 'faceTanya':face(540,980,560,.05*Math.sin(p*4),5);txt('?',860,760,300,RED,900,'center',FK);txt('?',230,800,200,RED,900,'center',FK);break;
  case 'butler':pic('butler',540,1010,600,0,0,false);break;
  case 'butlerFace':pic('butler',440,1010,600,0,0,false);face(830,640,330,.1,2);break;
  case 'arah':bub('Ini bagus kan?',400,780,BLUE,'#fff',54,.1,p,-1);x.save();x.strokeStyle='#111';x.lineWidth=14;x.lineCap='round';x.beginPath();x.moveTo(540,900);x.lineTo(540,1100);x.lineTo(500,1050);x.moveTo(540,1100);x.lineTo(580,1050);x.stroke();x.restore();bub('Bagus!',680,1250,'#e9ecf3','#10142a',54,.55,p,1);break;
  case 'tanyaBagus':bub('Ini bagus kan?',560,900,BLUE,'#fff',58,.1,p,1);face(250,640,300,-.1,7);break;
  case 'jawabBagus':bub('Ini bagus kan?',470,780,BLUE,'#fff',54,0,p,1);bub('Bagus!',620,1010,'#e9ecf3','#10142a',70,.35,p,-1);bub('Bagus!',470,1220,'#e9ecf3','#10142a',70,.7,p,-1);break;
  case 'ubah':bub('Ini bagus kan?',540,790,'#c8ccd6','#555',50,.05,p);x.save();x.strokeStyle='#111';x.lineWidth=14;x.lineCap='round';x.beginPath();x.moveTo(540,900);x.lineTo(540,1030);x.lineTo(500,985);x.moveTo(540,1030);x.lineTo(580,985);x.stroke();x.restore();bub('Kritik rencanaku',540,1190,BLUE,'#fff',58,.5,p);break;
  case 'silang':chip('Minta persetujuan',540,900,'#9aa0ad','#fff',54,'\\u2717');{const a=prog(p,.3,.6);x.save();x.strokeStyle=RED;x.lineWidth=14;x.lineCap='round';x.beginPath();x.moveTo(180,900);x.lineTo(180+a*720,900);x.stroke();x.restore()}break;
  case 'centang':chip('Minta kritik',540,900,GREEN,'#fff',70,'\\u2713');break;
  case 'prompt1':card('PROMPT',['Kritik rencanaku.','Sebutkan 3 kelemahan','dan asumsi yang belum','teruji.'],V.t,25.3,29.6,540,1000,BLUE);break;
  case 'prompt2':card('INSTRUKSI TETAP',['Jangan langsung setuju.','Kalau pendapatku lemah,','katakan dengan alasan.'],V.t,33.0,36.2,540,1000,BLUE);break;
  case 'jasFace':pic('jas',440,1010,640,0,0,false);face(840,660,330,.1,4);break;
  case 'awal':x.save();rr(120,780,840,120,60);shadow();x.fillStyle='#e9ecf3';x.fill();shadow(false);x.restore();txt('pesan pertama',540,860,60,'#555',800,'center');
    {const a=back(prog(p,.2,.55));x.save();x.translate(540,1060);x.scale(a,a);rr(-400,-70,800,140,70);shadow();x.fillStyle=BLUE;x.fill();shadow(false);txt('Instruksi tetap',0,24,64,'#fff',800,'center');x.restore()}break;
  case 'pagar':{const s=back(prog(p,0,.35));x.save();x.translate(540,1000);x.scale(s,s);x.fillStyle=RED;x.beginPath();for(let i=0;i<8;i++){const a=Math.PI/8+i*Math.PI/4;x.lineTo(300*Math.cos(a),300*Math.sin(a))}x.closePath();shadow();x.fill();shadow(false);txt('!',0,95,300,'#fff',900,'center',FK);x.restore();txt('PAGAR',540,1400,120,'#111',900,'center',FK);face(880,640,260,.12,6)}break;
  case 'terminatorFace':pic('terminator',540,1000,860,-.02,30);face(850,600,300,.12,8);break;
  case 'cek1':chip('Periksa hal penting',540,900,GREEN,'#fff',56,'\\u2713');break;
  case 'cek2':chip('Periksa hal penting',540,780,GREEN,'#fff',56,'\\u2713');chip('Jangan tempel data pribadi',540,960,YEL,'#1a1200',52,'!');break;
  case 'paket':x.save();const s2=back(prog(p,0,.35));x.translate(540,1000);x.scale(s2,s2);for(let i=0;i<5;i++){const a=(i-2)*.1;x.save();x.rotate(a);x.translate((i-2)*70,i*8-30);rr(-250,-190,500,380,36);shadow();x.fillStyle=i%2?'#fff':'#f1f4fb';x.fill();shadow(false);x.lineWidth=5;x.strokeStyle=BLUE;x.stroke();x.restore()}
    rr(-250,-190,500,380,36);x.fillStyle='#10142a';x.fill();txt('5 PROMPT',0,-30,70,'#fff',900,'center');txt('PENANTANG',0,60,70,'#ffd21f',900,'center');x.restore();break;
  case 'cta':{const pl=1+.04*Math.sin(p*9);const s=back(prog(p,0,.3))*pl;x.save();x.translate(540,980);x.scale(s,s);rr(-400,-170,800,340,70);shadow();x.fillStyle=BLUE;x.fill();shadow(false);txt('KOMEN',0,-35,80,'#fff',800,'center');txt('JUJUR',0,95,130,'#ffd21f',900,'center');x.restore();face(540,1420,360,.04*Math.sin(p*5),2)}break;
  case 'kirim':pic('butler',540,1010,560,0,0,false);bub('Kirim ke temanmu',540,720,BLUE,'#fff',54,.1,p);bub('idenya selalu \\u201Cjenius\\u201D',540,1300,GREEN,'#fff',50,.6,p);face(850,620,300,.1,2);break;
  }}
function caption(t,k){const C=CH[k];const lines=wrapT(C.text);const pp=back(prog(t,C.a,C.a+.18));x.save();x.translate(W/2,300);const sc=.92+.08*pp;x.scale(sc,sc);x.globalAlpha=clamp(pp*2);
  lines.forEach((L,i)=>txt(L,0,(i-(lines.length-1)/2)*96,84,'#111',700,'center',FK));x.restore()}
function wrapT(s){x.font='700 84px '+FK;const ws=s.split(' ');const L=[];let cur='';for(const w of ws){const tt=cur?cur+' '+w:w;if(x.measureText(tt).width>940&&cur){L.push(cur);cur=w}else cur=tt}if(cur)L.push(cur);return L}
function frame(t){x.fillStyle='#fff';x.fillRect(0,0,W,H);let k=0;for(let i=0;i<CH.length;i++)if(t>=CH[i].a)k=i;const C=CH[k];
  if(t<4.2){x.save();x.globalAlpha=.7*(1-ease(prog(t,3.6,4.2)));txt('Disclaimer: Konten ini murni untuk tujuan edukasi.',W/2,100,30,'#666',600,'center');txt('AI tetap bisa salah, periksa hal penting.',W/2,142,30,'#666',600,'center');x.restore()}
  caption(t,k);vis(t,{n:C.vis,lt:t-C.a,t});
  x.save();x.globalAlpha=.4;txt('@alamnurdiann',W/2,H-210,34,'#333',700,'center');x.restore()}
window.draw=frame;window.ready=Promise.all(Object.keys(SRC).map(k=>new Promise(r=>{const im=new Image();im.onload=()=>{IM[k]=im;r()};im.src=SRC[k]}))).then(()=>Promise.all([document.fonts.load('700 84px Kalam'),document.fonts.load('800 50px Inter')])).then(()=>true);
</script></body></html>`;
fs.writeFileSync(path.join(dir, 'scene.html'), html);
(async () => {
  const test = (process.argv.find(a => a.startsWith('--test=')) || '').split('=')[1];
  const b = await chromium.launch(); const pg = await b.newPage({ viewport: { width: W, height: H } });
  pg.on('pageerror', e => console.log('PAGEERR', e.message));
  await pg.goto('file://' + path.join(dir, 'scene.html')); await pg.evaluate(() => window.ready);
  if (test) { for (const tt of test.split(',')) { await pg.evaluate(t => window.draw(t), +tt); const d = await pg.evaluate(() => document.getElementById('c').toDataURL('image/jpeg', .85)); fs.writeFileSync(path.join(dir, `test_${tt}.jpg`), Buffer.from(d.split(',')[1], 'base64')); } await b.close(); return; }
  const N = Math.round(DUR * FPS); const out = path.join(dir, 'reel-jujur.mp4');
  const ff = spawn('ffmpeg', ['-y', '-v', 'error', '-f', 'image2pipe', '-framerate', String(FPS), '-c:v', 'mjpeg', '-i', '-', '-i', path.join(dir, 'voice.wav'), '-i', path.join(dir, 'sfx.wav'),
    '-filter_complex', '[1:a]aresample=44100,volume=1.2[v];[2:a]volume=0.4[s];[v][s]amix=inputs=2:duration=first:normalize=0,alimiter=limit=0.95[a]', '-map', '0:v', '-map', '[a]',
    '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-crf', '20', '-preset', 'medium', '-r', String(FPS), '-c:a', 'aac', '-b:a', '160k', '-t', String(DUR), out], { stdio: ['pipe', 'inherit', 'inherit'] });
  for (let i = 0; i < N; i++) {
    const d = await pg.evaluate(t => { window.draw(t); return document.getElementById('c').toDataURL('image/jpeg', .88); }, i / FPS);
    if (!ff.stdin.write(Buffer.from(d.split(',')[1], 'base64'))) await new Promise(r => ff.stdin.once('drain', r));
    if (i % 200 === 0) console.log('frame', i, '/', N);
  }
  ff.stdin.end(); await new Promise(r => ff.on('close', r)); await b.close(); console.log('selesai');
})();

// Reel skit "Bos vs admin": avatar bos (kiri, topi koki) dan admin (kanan), visual prop di tengah, teks tulisan tangan di atas, voice over 45,21 dtk.
// node render.js [--test=detik,detik] | node render.js --chunks
const { chromium } = require('playwright'); const { spawn } = require('child_process'); const fs = require('fs'), path = require('path');
const W = 1080, H = 1920, FPS = 30, DUR = 45.21; const dir = __dirname;
const IMG = (n) => 'data:image/png;base64,' + fs.readFileSync(path.join(dir, n)).toString('base64');
const IMGS = {}; for (let i = 0; i < 9; i++) IMGS['face' + i] = IMG(`face${i}.png`);
const FONT = fs.readFileSync(path.join(dir, 'fonts/kalam-latin-700-normal.woff2')).toString('base64');
// [mulaiSuara, akhirSuara, teks (*kata* = sorot), [visual per frasa], [stiker wajah per frasa], pembicara B/A/N]
// stiker: 0 tertawa, 1 marah, 2 sedih menangis, 3 "huh?", 4 datar, 5 sedih, 6 cemas, 7 kaget, 8 lidah
const SEG = [
  [0, 2.69, 'Masa balas chat *harga* saja nggak sempat, sih?', ['tumpuk'], [1], 'B'],
  [3.20, 5.93, 'Chatnya *numpuk*, Pak. Saya ketik ulang jawaban yang sama terus.', ['ulang'], [2], 'A'],
  [6.36, 7.16, 'Terus gimana, dong?', ['tanya'], [4], 'B'],
  [7.75, 12.35, 'Coba minta AI menyusun *draf* balasannya, Pak. Tempel *daftar harga*, tempel pertanyaan pelanggan.', ['drafChip', 'daftarHarga'], [0, 0], 'A'],
  [12.88, 14.56, 'AI yang balas *langsung* ke pelanggan?', ['tanyaLangsung'], [3], 'B'],
  [15.13, 18.51, 'Bukan, Pak. AI cuma menyusun *draf*. Bapak yang *cek* dan kirim.', ['silangBukan', 'drafBukan', 'cekKirim'], [4, 0, 0], 'A'],
  [19.04, 19.93, 'Bisa buat yang lain juga?', ['tanya'], [7], 'B'],
  [20.51, 27.17, 'Bisa. Pesan follow-up, rekap pesanan, rapikan jadwal. Strukturnya *sama*: tugas, bahan, aturan, batas.', ['list1', 'list2', 'list3', 'brief0', 'brief2', 'brief4'], [0, 0, 0, 4, 0, 0], 'A'],
  [27.64, 28.40, '*Mahal* nggak?', ['mahal'], [3], 'B'],
  [28.77, 30.45, 'Mulai aja dari alat AI yang sudah ada.', ['alatAda'], [4], 'A'],
  [30.79, 31.72, '*Cek* dulu batasnya, ya, Pak.', ['cekBatas'], [6], 'A'],
  [32.36, 35.48, 'Oke! Mulai besok *semuanya* AI yang urus!', ['semuaAI'], [0], 'B'],
  [36.08, 39.85, 'Jangan *semuanya*, Pak. *Harga*, *promo*, dan *data pelanggan* tetap Bapak yang cek.', ['pagar', 'pagar', 'cek3', 'cek3'], [7, 6, 6, 6], 'A'],
  [40.36, 41.29, 'Hah, kok *saya* lagi?', ['hah'], [7], 'B'],
  [41.82, 43.88, 'Mau template tugas karyawan AI untuk usaha jasa?', ['paket'], [0], 'N'],
  [44.26, 45.21, 'Komen *JASA*.', ['cta'], [0], 'N'],
];
const CH = [];
SEG.forEach((s, si) => {
  const words = s[2].split(' '); const parts = []; let cur = [];
  for (const w of words) { cur.push(w); if (/[.?:,!]\*?"?[,.]?$/.test(w) && cur.length >= 2 || cur.length >= 6) { parts.push(cur.join(' ')); cur = []; } }
  if (cur.length) { if (parts.length && cur.length <= 2) parts[parts.length - 1] += ' ' + cur.join(' '); else parts.push(cur.join(' ')); }
  const tot = parts.reduce((a, c) => a + c.replace(/\*/g, '').length, 0); let t = s[0];
  parts.forEach((p, i) => { const d = (s[1] - s[0]) * p.replace(/\*/g, '').length / tot;
    CH.push({ a: i === 0 ? (si === 0 ? 0 : s[0] - .15) : t, b: i === parts.length - 1 ? (SEG[si + 1] ? SEG[si + 1][0] - .15 : DUR) : t + d, text: p, vis: s[3][Math.min(i, s[3].length - 1)], face: s[4][Math.min(i, s[4].length - 1)], who: s[5], seg: si }); t += d; });
});
if (process.argv.includes('--chunks')) { CH.forEach(c => console.log(c.a.toFixed(2), c.b.toFixed(2), c.who, c.vis.padEnd(13), c.face, c.text)); process.exit(0); }
const html = `<!doctype html><html><head><meta charset="utf-8"><style>@font-face{font-family:Kalam;font-weight:700;src:url(data:font/woff2;base64,${FONT})}body{margin:0;background:#fff}canvas{display:block}</style></head><body><canvas id="c" width="${W}" height="${H}"></canvas>
<script>
const W=${W},H=${H};const c=document.getElementById('c'),x=c.getContext('2d');
const CH=${JSON.stringify(CH)};const SRC=${JSON.stringify(IMGS)};const IM={};
const clamp=(v,a=0,b=1)=>Math.min(b,Math.max(a,v)),lerp=(a,b,t)=>a+(b-a)*t,ease=t=>t<.5?4*t*t*t:1-Math.pow(-2*t+2,3)/2,prog=(t,a,b)=>clamp((t-a)/(b-a));
const back=t=>{const c1=1.9,c3=c1+1;return 1+c3*Math.pow(t-1,3)+c1*Math.pow(t-1,2)};
const FK='Kalam, sans-serif',FI='Inter, DejaVu Sans, sans-serif';const BLUE='#1d6fe8',GREEN='#25c26a',RED='#e5352b',YEL='#ffc233',GRAY='#e9ecf3',ORANGE='#f08a1d';const Y0=800;
function rr(X,Y,w,h,r){x.beginPath();x.moveTo(X+r,Y);x.arcTo(X+w,Y,X+w,Y+h,r);x.arcTo(X+w,Y+h,X,Y+h,r);x.arcTo(X,Y+h,X,Y,r);x.arcTo(X,Y,X+w,Y,r);x.closePath()}
function txt(s,X,Y,size,col='#111',w=800,al='center',fam=FI){x.font=w+' '+size+'px '+fam;x.textAlign=al;x.textBaseline='alphabetic';x.fillStyle=col;x.fillText(s,X,Y)}
function shadow(on=true){x.shadowColor=on?'rgba(0,0,0,.28)':'transparent';x.shadowBlur=on?30:0;x.shadowOffsetY=on?12:0}
function bub(s,cx,cy,col,tcol,size=52,t0=0,t=9,tail=0){const p=back(prog(t,t0,t0+.3));if(p<=0)return;x.save();x.font='800 '+size+'px '+FI;const w=x.measureText(s).width+80,h=size+56;x.translate(cx,cy);x.scale(p,p);shadow();rr(-w/2,-h/2,w,h,h/2);x.fillStyle=col;x.fill();shadow(false);
  if(tail){x.beginPath();x.moveTo(tail*(w/2-70),h/2-4);x.lineTo(tail*(w/2-20),h/2+44);x.lineTo(tail*(w/2-120),h/2-4);x.fill()}x.fillStyle=tcol;x.textAlign='center';x.textBaseline='middle';x.fillText(s,0,4);x.restore()}
function chip(s,cx,cy,col,tcol='#fff',size=44,mark='',alpha=1,sc=1){x.save();x.globalAlpha=alpha;x.translate(cx,cy);x.scale(sc,sc);x.font='800 '+size+'px '+FI;const w=x.measureText(s).width+70+(mark?60:0),h=size+44;shadow();rr(-w/2,-h/2,w,h,h/2);x.fillStyle=col;x.fill();shadow(false);x.fillStyle=tcol;x.textAlign='center';x.textBaseline='middle';x.fillText(s,(mark?30:0),3);
  if(mark){x.font='900 '+size+'px '+FI;x.fillText(mark,-w/2+48,3)}x.restore()}
function chipAt(s,cx,cy,col,tcol,size,mark,lt,t0){const q=prog(lt,t0,t0+.3);if(q<=0)return;chip(s,cx,cy,col,tcol,size,mark,clamp(q*2),.8+.2*back(q))}
function strike(X1,X2,Y,lt,t0){const a=prog(lt,t0,t0+.3);x.save();x.strokeStyle=RED;x.lineWidth=14;x.lineCap='round';x.beginPath();x.moveTo(X1,Y);x.lineTo(X1+a*(X2-X1),Y);x.stroke();x.restore()}
function card(label,lines,t,t0,t1,cx,cy,col){const w=900,h=150+lines.length*74;x.save();x.translate(cx,cy);shadow();rr(-w/2,-h/2,w,h,36);x.fillStyle='#10142a';x.fill();shadow(false);
  rr(-w/2+34,-h/2+30,label.length*24+64,56,28);x.fillStyle=col;x.fill();txt(label,-w/2+66,-h/2+70,28,'#fff',800,'left');
  const all=lines.join(' ').length;const n=Math.floor(prog(t,t0,t1)*all);let used=0;
  lines.forEach((s,i)=>{const take=Math.max(0,Math.min(s.length,n-used));used+=s.length+1;txt(s.slice(0,take),-w/2+40,-h/2+170+i*74,50,'#f6f2ea',700,'left')});x.restore()}
function faceD(cx,cy,w,rot=0,k=1){const im=IM['face'+k];const h=w*im.height/im.width;x.save();x.translate(cx,cy);x.rotate(rot);shadow();x.drawImage(im,-w/2,-h/2,w,h);x.restore()}
function chefAvatar(cx,cy,w,k,lt,rot=0){const im=IM['face'+k];const h=w*im.height/im.width;x.save();x.translate(cx,cy);x.rotate(rot);shadow();x.drawImage(im,-w/2,-h/2,w,h);shadow(false);
  const y0=-h*.27,lw=Math.max(5,w*.022);x.lineWidth=lw;x.strokeStyle='#111';x.lineJoin='round';x.fillStyle='#fff';
  [[-.22,-.10,.17],[0,-.17,.20],[.22,-.10,.17]].forEach(a=>{x.beginPath();x.arc(a[0]*w,y0+a[1]*h,a[2]*w,0,7);x.fill();x.stroke()});rr(-.36*w,y0-.04*h,.72*w,.11*h,w*.04);x.fill();x.stroke();x.restore()}
function arrow(X1,X2,Y,lt,t0){const a=prog(lt,t0,t0+.3);if(a<=0)return;x.save();x.strokeStyle='#111';x.fillStyle='#111';x.lineWidth=14;x.lineCap='round';const xe=X1+(X2-X1)*a;x.beginPath();x.moveTo(X1,Y);x.lineTo(xe,Y);x.stroke();if(a>.9){x.beginPath();x.moveTo(X2,Y);x.lineTo(X2-34,Y-26);x.lineTo(X2-34,Y+26);x.closePath();x.fill()}x.restore()}
function vis(t,V){const p=V.lt,a=V.t-V.lt;
  switch(V.n){
  case 'tumpuk':for(let i=0;i<5;i++)bub('Berapa harganya, kak?',i%2?680:400,Y0-260+i*95,GRAY,'#10142a',44,.05+i*.12,p,0);break;
  case 'ulang':[['Jawaban yang sama',400],['Jawaban yang sama',680],['Jawaban yang sama',400]].forEach((b,i)=>bub(b[0],b[1],Y0-140+i*140,i==1?BLUE:GRAY,i==1?'#fff':'#10142a',50,.05+i*.4,p,0));chipAt('copy-paste lagi',540,Y0+190,RED,'#fff',48,'',p,1.3);break;
  case 'tanya':{const s=back(prog(p,0,.3));x.save();x.translate(540,Y0+120);x.scale(s,s);txt('?',0,0,420,'#111',900,'center',FK);x.restore()}break;
  case 'drafChip':chip('DRAF',540,Y0,BLUE,'#fff',120);break;
  case 'daftarHarga':card('DAFTAR HARGA + CHAT',['Layanan A   Rp[harga]','Layanan B   Rp[harga]','"Berapa harganya, kak?"'],V.t,a+.1,a+1.3,540,Y0,BLUE);break;
  case 'tanyaLangsung':chip('AI',250,Y0,BLUE,'#fff',70);arrow(360,700,Y0,p,.2);chip('pelanggan',860,Y0,GRAY,'#10142a',54);txt('?',540,Y0-90,160,RED,900,'center',FK);break;
  case 'silangBukan':chip('langsung ke pelanggan',540,Y0,'#9aa0ad','#fff',58,'\\u2717');strike(110,970,Y0,p,.3);break;
  case 'drafBukan':chip('DRAF',540,Y0-100,BLUE,'#fff',90);chip('OTOMATIS',540,Y0+100,'#9aa0ad','#fff',64,'\\u2717');strike(150,930,Y0+100,p,.4);break;
  case 'cekKirim':chipAt('Bapak cek',540,Y0-90,GREEN,'#fff',70,'\\u2713',p,.05);chipAt('Bapak kirim',540,Y0+90,BLUE,'#fff',70,'\\u2713',p,.5);break;
  case 'list1':chipAt('Pesan follow-up',540,Y0-150,GREEN,'#fff',60,'\\u2713',p,.05);break;
  case 'list2':chip('Pesan follow-up',540,Y0-150,GREEN,'#fff',60,'\\u2713');chipAt('Rekap pesanan',540,Y0,GREEN,'#fff',60,'\\u2713',p,.05);break;
  case 'list3':chip('Pesan follow-up',540,Y0-150,GREEN,'#fff',60,'\\u2713');chip('Rekap pesanan',540,Y0,GREEN,'#fff',60,'\\u2713');chipAt('Rapikan jadwal',540,Y0+150,GREEN,'#fff',60,'\\u2713',p,.05);break;
  case 'brief0':chipAt('= STRUKTUR SAMA',540,Y0,'#10142a','#ffd21f',66,'',p,.05);break;
  case 'brief2':chipAt('TUGAS',330,Y0-100,BLUE,'#fff',62,'',p,.05);chipAt('BAHAN',760,Y0-100,'#7a4de8','#fff',62,'',p,.45);break;
  case 'brief4':chip('TUGAS',330,Y0-100,BLUE,'#fff',62);chip('BAHAN',760,Y0-100,'#7a4de8','#fff',62);chipAt('ATURAN',330,Y0+100,GREEN,'#fff',62,'',p,.05);chipAt('BATAS',760,Y0+100,RED,'#fff',62,'',p,.45);break;
  case 'mahal':{const s=back(prog(p,0,.35));x.save();x.translate(540,Y0);x.rotate(-.06);x.scale(s,s);shadow();rr(-290,-150,580,300,50);x.fillStyle='#fff';x.fill();shadow(false);x.lineWidth=8;x.strokeStyle='#111';x.stroke();x.beginPath();x.arc(-220,0,24,0,7);x.stroke();txt('Rp ???',40,40,120,'#111',900,'center',FK);x.restore()}break;
  case 'alatAda':chip('alat AI yang sudah ada',540,Y0,GREEN,'#fff',58,'\\u2713');break;
  case 'cekBatas':chip('cek dulu batasnya',540,Y0,YEL,'#1a1200',64,'!');break;
  case 'semuaAI':{const pl=1+.04*Math.sin(p*9);const s=back(prog(p,0,.3))*pl;x.save();x.translate(540,Y0);x.scale(s,s);chip('SEMUANYA AI!',0,0,BLUE,'#fff',100);x.restore()}break;
  case 'pagar':{const s=back(prog(p,0,.35));x.save();x.translate(540,Y0-20);x.scale(s,s);x.fillStyle=RED;x.beginPath();for(let i=0;i<8;i++){const a2=Math.PI/8+i*Math.PI/4;x.lineTo(190*Math.cos(a2),190*Math.sin(a2))}x.closePath();shadow();x.fill();shadow(false);txt('!',0,65,200,'#fff',900,'center',FK);x.restore();txt('PAGAR',540,Y0+250,110,'#111',900,'center',FK)}break;
  case 'cek3':chipAt('harga',540,Y0-160,GREEN,'#fff',62,'\\u2713',p,.05);chipAt('promo',540,Y0,GREEN,'#fff',62,'\\u2713',p,.5);chipAt('data pelanggan',540,Y0+160,GREEN,'#fff',62,'\\u2713',p,.95);break;
  case 'hah':{const s=back(prog(p,0,.3));x.save();x.translate(540,Y0+80);x.scale(s,s);x.rotate(-.05);txt('Hah?!',0,0,300,RED,900,'center',FK);x.restore()}break;
  case 'paket':{const s2=back(prog(p,0,.35))*.8;x.save();x.translate(540,Y0);x.scale(s2,s2);for(let i=0;i<5;i++){const a2=(i-2)*.1;x.save();x.rotate(a2);x.translate((i-2)*70,i*8-30);rr(-250,-190,500,380,36);shadow();x.fillStyle=i%2?'#fff':'#f1f4fb';x.fill();shadow(false);x.lineWidth=5;x.strokeStyle=BLUE;x.stroke();x.restore()}
    rr(-250,-190,500,380,36);x.fillStyle='#10142a';x.fill();txt('5 PROMPT',0,-30,70,'#fff',900,'center');txt('USAHA JASA',0,60,66,'#ffd21f',900,'center');x.restore()}break;
  case 'cta':{const pl=1+.04*Math.sin(p*9);const s=back(prog(p,0,.3))*pl*.85;x.save();x.translate(540,Y0);x.scale(s,s);rr(-400,-170,800,340,70);shadow();x.fillStyle=BLUE;x.fill();shadow(false);txt('KOMEN',0,-35,80,'#fff',800,'center');txt('JASA',0,95,130,'#ffd21f',900,'center');x.restore()}break;
  }}
function wrapT(star){x.font='700 84px '+FK;const ws=star.split(' ');const L=[];let cur=[],cw=0,hl=false;
  for(const raw of ws){const hasS=raw.startsWith('*'),endS=raw.endsWith('*');if(hasS)hl=true;const w=raw.replace(/\\*/g,'');const ww=x.measureText(w+' ').width;if(cw+ww>940&&cur.length){L.push(cur);cur=[];cw=0}cur.push({w,hl});cw+=ww;if(endS)hl=false}if(cur.length)L.push(cur);return L}
function caption(t,k){const C=CH[k];const lines=wrapT(C.text);const pp=back(prog(t,C.a,C.a+.18));x.save();x.translate(W/2,350);const sc=.92+.08*pp;x.scale(sc,sc);x.globalAlpha=clamp(pp*2);x.font='700 84px '+FK;
  lines.forEach((L,li)=>{const tw=L.reduce((a2,q)=>a2+x.measureText(q.w+' ').width,0);let X=-tw/2;const Y=(li-(lines.length-1)/2)*96+20;
    for(const q of L){x.textAlign='left';x.textBaseline='alphabetic';x.fillStyle=q.hl?(C.who==='B'?ORANGE:BLUE):'#111';x.fillText(q.w,X,Y);X+=x.measureText(q.w+' ').width}});x.restore()}
function avatars(t,C,lt,k){const prevWho=k>0?CH[k-1].who:C.who;
  [['B',250],['A',830]].forEach(([who,cx])=>{const active=C.who===who||C.who==='N';const changed=(prevWho!==C.who);const pop=active&&changed?back(prog(lt,0,.3)):1;const sc=(active?1:.8)*(active?(.9+.1*pop):1);const k2=active?C.face:4;const cy=1290;const bob=active?Math.sin(lt*7)*8:0;
    x.save();x.globalAlpha=active?1:.7;x.translate(cx,cy+bob);x.scale(sc,sc);x.translate(-cx,-cy);if(who==='B')chefAvatar(cx,cy,340,k2,lt,.05*Math.sin(lt*5)*(active?1:0));else faceD(cx,cy,340,.05*Math.sin(lt*5)*(active?1:0),k2);x.restore();
    chip(who==='B'?'BOS':'ADMIN',cx,1565,who==='B'?ORANGE:BLUE,'#fff',34,'',active?1:.6)})}
function frame(t){x.fillStyle='#fff';x.fillRect(0,0,W,H);let k=0;for(let i=0;i<CH.length;i++)if(t>=CH[i].a)k=i;const C=CH[k];
  x.save();x.globalAlpha=.85;chip('SKIT FIKSI',W-170,80,'#e9ecf3','#555',30);x.restore();
  if(t<3.2){x.save();x.globalAlpha=.7*(1-ease(prog(t,2.6,3.2)));txt('Disclaimer: Skit fiksi, murni untuk tujuan edukasi.',W/2,150,30,'#666',600,'center');x.restore()}
  caption(t,k);
  const lt=t-C.a,pp=back(prog(lt,0,.25));x.save();const sc=.88+.12*pp;x.translate(540,Y0);x.scale(sc,sc);x.translate(-540,-Y0);x.globalAlpha=clamp(pp*2.5);vis(t,{n:C.vis,lt,t});x.restore();
  avatars(t,C,t-CH[k].a,k);
  x.save();x.globalAlpha=.4;txt('@alamnurdiann',W/2,H-130,34,'#333',700,'center');x.restore()}
window.draw=frame;window.ready=Promise.all(Object.keys(SRC).map(k=>new Promise(r=>{const im=new Image();im.onload=()=>{IM[k]=im;r()};im.src=SRC[k]}))).then(()=>Promise.all([document.fonts.load('700 84px Kalam'),document.fonts.load('800 50px Inter'),document.fonts.load('900 50px Inter')])).then(()=>true);
</script></body></html>`;
fs.writeFileSync(path.join(dir, 'scene.html'), html);
(async () => {
  const test = (process.argv.find(a => a.startsWith('--test=')) || '').split('=')[1];
  const b = await chromium.launch(); const pg = await b.newPage({ viewport: { width: W, height: H } });
  pg.on('pageerror', e => console.log('PAGEERR', e.message));
  await pg.goto('file://' + path.join(dir, 'scene.html')); await pg.evaluate(() => window.ready);
  if (test) { for (const tt of test.split(',')) { await pg.evaluate(t => window.draw(t), +tt); const d = await pg.evaluate(() => document.getElementById('c').toDataURL('image/jpeg', .85)); fs.writeFileSync(path.join(dir, `test_${tt}.jpg`), Buffer.from(d.split(',')[1], 'base64')); } await b.close(); return; }
  const N = Math.round(DUR * FPS); const out = path.join(dir, 'reel-skit.mp4');
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

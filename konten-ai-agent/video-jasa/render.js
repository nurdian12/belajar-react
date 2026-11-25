// Reel "Draf balasan harga untuk usaha jasa": latar putih, teks tulisan tangan, visual pop-in per frasa, stiker stickman + voice over (62,29 dtk).
// node render.js [--test=detik,detik] | node render.js --chunks
const { chromium } = require('playwright'); const { spawn } = require('child_process'); const fs = require('fs'), path = require('path');
const W = 1080, H = 1920, FPS = 30, DUR = 62.29; const dir = __dirname;
const IMG = (n, m = 'jpeg') => `data:image/${m};base64,` + fs.readFileSync(path.join(dir, n)).toString('base64');
const IMGS = { butler: IMG('butler.jpg') }; for (let i = 0; i < 9; i++) IMGS['face' + i] = IMG(`face${i}.png`, 'png');
const LIP = require('../lipsync/lipsync.js'); const ENV = JSON.parse(fs.readFileSync(path.join(dir, 'env.json')));
const FONT = fs.readFileSync(path.join(dir, 'fonts/kalam-latin-700-normal.woff2')).toString('base64');
// [mulaiSuara, akhirSuara, teks (*kata* = sorot), [visual per frasa], [ekspresi per frasa]]
// ekspresi: 0 marah, 1 datar, 2 senyum lebar, 3 cemberut, 4 tenang, 5 curiga, 6 kaget, 7 heran, 8 sinis
const SEG = [
  [0, 4.36, 'Kok bisa sih pelanggan tanya *harga*, kamu balas, lalu dia *menghilang*?', ['chatHarga', 'seen'], [7, 3]],
  [5.45, 6.98, 'Mungkin bukan cuma soal *harganya*.', ['harga'], [5]],
  [7.38, 11.46, 'Bisa jadi balasanmu terlalu *panjang*, atau tidak ada *langkah berikutnya*.', ['panjang', 'tanpaLangkah'], [3, 7]],
  [12.12, 14.83, 'Dan tiap hari kamu mengetik ulang jawaban yang *sama*.', ['ulang'], [3]],
  [15.87, 19.41, 'Coba minta AI menyusun *draf* balasan, bukan membalas sendiri.', ['butlerDraf', 'drafBukan'], [4, 2]],
  [19.83, 20.45, 'Kamu yang *cek*,', ['cek'], [2]],
  [20.80, 21.39, 'kamu yang *kirim*.', ['kirim'], [2]],
  [22.35, 23.64, 'Tempel *daftar harga* milikmu,', ['daftarHarga'], [1]],
  [23.96, 27.49, 'tempel pertanyaan pelanggan *tanpa nama dan nomor*.', ['pertanyaan'], [1]],
  [27.89, 29.60, 'Lalu beri *aturan*: ramah, maksimal lima kalimat,', ['aturan1'], [4]],
  [29.95, 33.54, 'harga hanya dari daftar, dan tutup dengan *satu pertanyaan*.', ['aturan2'], [4]],
  [34.48, 36.03, 'Untuk *laundry* tanyakan jumlah kilo.', ['laundry'], [2]],
  [36.50, 38.32, '*Katering*, jumlah porsi dan tanggal.', ['katering'], [2]],
  [38.81, 40.48, '*Kursus*, jadwal yang diminati.', ['kursus'], [2]],
  [41.24, 43.74, 'Strukturnya *sama*, tinggal ganti usahanya.', ['sama'], [4]],
  [44.45, 46.44, 'Tapi ingat: AI hanya menyusun *draf*.', ['pagar'], [6]],
  [46.89, 49.77, '*Harga*, *promo*, dan *ketersediaan* tetap kamu cek.', ['cek3'], [4]],
  [50.33, 53.49, 'Jangan tempel *nama*, *nomor*, atau *alamat* pelanggan.', ['dilarang'], [0]],
  [54.27, 56.75, 'Mau template promptnya untuk laundry, katering, dan kursus?', ['paket'], [7]],
  [57.11, 58.31, 'Komen *JASA*.', ['cta'], [2]],
  [58.98, 61.99, 'Dan kirim ke temanmu yang tiap hari mengetik ulang jawaban yang sama.', ['kirimTeman', 'kirimTeman2'], [2, 8]],
];
const CH = [];
SEG.forEach((s, si) => {
  const words = s[2].split(' '); const parts = []; let cur = [];
  for (const w of words) { cur.push(w); if (/[.?:,]\*?"?[,.]?$/.test(w) && cur.length >= 2 || cur.length >= 6) { parts.push(cur.join(' ')); cur = []; } }
  if (cur.length) { if (parts.length && cur.length <= 2) parts[parts.length - 1] += ' ' + cur.join(' '); else parts.push(cur.join(' ')); }
  const tot = parts.reduce((a, c) => a + c.replace(/\*/g, '').length, 0); let t = s[0];
  parts.forEach((p, i) => { const d = (s[1] - s[0]) * p.replace(/\*/g, '').length / tot;
    CH.push({ a: i === 0 ? (si === 0 ? 0 : s[0] - .25) : t, b: i === parts.length - 1 ? (SEG[si + 1] ? SEG[si + 1][0] - .25 : DUR) : t + d, text: p, vis: s[3][Math.min(i, s[3].length - 1)], exp: s[4][Math.min(i, s[4].length - 1)], seg: si }); t += d; });
});
// peta ke lembar stickman: 0 tertawa, 1 marah, 2 sedih menangis, 3 "huh?", 4 datar, 5 sedih, 6 cemas, 7 kaget, 8 menjulur lidah
const MAP = [1, 4, 0, 5, 4, 3, 7, 3, 8], ALT = { 0: 0, 1: 1, 2: 5, 3: 4, 4: 3, 5: 2, 6: 7, 7: 6, 8: 8 }; let prev = -1;
CH.forEach(c => { let m = MAP[c.exp]; if (m === prev) m = ALT[m]; c.face = m; prev = m; });
if (process.argv.includes('--chunks')) { CH.forEach(c => console.log(c.a.toFixed(2), c.b.toFixed(2), c.vis.padEnd(12), c.face, c.text)); process.exit(0); }
const html = `<!doctype html><html><head><meta charset="utf-8"><style>@font-face{font-family:Kalam;font-weight:700;src:url(data:font/woff2;base64,${FONT})}body{margin:0;background:#fff}canvas{display:block}</style></head><body><canvas id="c" width="${W}" height="${H}"></canvas>
<script>
const W=${W},H=${H};const c=document.getElementById('c'),x=c.getContext('2d');
const CH=${JSON.stringify(CH)};const ENV=${JSON.stringify(ENV)};const SPANS=${JSON.stringify(SEG.map(q=>[q[0],q[1]]))};const SRC=${JSON.stringify(IMGS)};const IM={};
const clamp=(v,a=0,b=1)=>Math.min(b,Math.max(a,v)),lerp=(a,b,t)=>a+(b-a)*t,ease=t=>t<.5?4*t*t*t:1-Math.pow(-2*t+2,3)/2,prog=(t,a,b)=>clamp((t-a)/(b-a));
const back=t=>{const c1=1.9,c3=c1+1;return 1+c3*Math.pow(t-1,3)+c1*Math.pow(t-1,2)};
const FK='Kalam, sans-serif',FI='Inter, DejaVu Sans, sans-serif';const BLUE='#1d6fe8',GREEN='#25c26a',RED='#e5352b',YEL='#ffc233',GRAY='#e9ecf3';
function rr(X,Y,w,h,r){x.beginPath();x.moveTo(X+r,Y);x.arcTo(X+w,Y,X+w,Y+h,r);x.arcTo(X+w,Y+h,X,Y+h,r);x.arcTo(X,Y+h,X,Y,r);x.arcTo(X,Y,X+w,Y,r);x.closePath()}
function txt(s,X,Y,size,col='#111',w=800,al='center',fam=FI){x.font=w+' '+size+'px '+fam;x.textAlign=al;x.textBaseline='alphabetic';x.fillStyle=col;x.fillText(s,X,Y)}
function shadow(on=true){x.shadowColor=on?'rgba(0,0,0,.28)':'transparent';x.shadowBlur=on?30:0;x.shadowOffsetY=on?12:0}
function bub(s,cx,cy,col,tcol,size=52,t0=0,t=9,tail=0){const p=back(prog(t,t0,t0+.3));if(p<=0)return;x.save();x.font='800 '+size+'px '+FI;const w=x.measureText(s).width+80,h=size+56;x.translate(cx,cy);x.scale(p,p);shadow();rr(-w/2,-h/2,w,h,h/2);x.fillStyle=col;x.fill();shadow(false);
  if(tail){x.beginPath();x.moveTo(tail*(w/2-70),h/2-4);x.lineTo(tail*(w/2-20),h/2+44);x.lineTo(tail*(w/2-120),h/2-4);x.fill()}x.fillStyle=tcol;x.textAlign='center';x.textBaseline='middle';x.fillText(s,0,4);x.restore()}
function pic(name,cx,cy,w,rot=0){const im=IM[name];const h=w*im.height/im.width;x.save();x.translate(cx,cy);x.rotate(rot);x.drawImage(im,-w/2,-h/2,w,h);x.restore()}
function faceD(cx,cy,w,rot=0,k=1,talk=-1){const im=IM['face'+k];const h=w*im.height/im.width;x.save();x.translate(cx,cy);x.rotate(rot);shadow();x.drawImage(im,-w/2,-h/2,w,h);shadow(false);if(talk>=0)talkMouth(k,w,h,talk);x.restore()}
function inSpan(t){return SPANS.some(q=>t>=q[0]-.03&&t<=q[1]+.05)}
${LIP.code}

function costume(type,cx,cy,w,k,lt=0,rot=0,talk=-1){const im=IM['face'+k];const h=w*im.height/im.width;x.save();x.translate(cx,cy);x.rotate(rot);shadow();x.drawImage(im,-w/2,-h/2,w,h);shadow(false);if(talk>=0)talkMouth(k,w,h,talk);
  const y0=-h*.27,lw=Math.max(5,w*.022);x.lineWidth=lw;x.strokeStyle='#111';x.lineJoin='round';x.lineCap='round';
  if(type==='katering'){x.fillStyle='#fff';[[-.22,-.10,.17],[0,-.17,.20],[.22,-.10,.17]].forEach(a=>{x.beginPath();x.arc(a[0]*w,y0+a[1]*h,a[2]*w,0,7);x.fill();x.stroke()});
    rr(-.36*w,y0-.04*h,.72*w,.11*h,w*.04);x.fill();x.stroke();
    x.save();x.translate(.48*w,.40*h);x.fillStyle='#c98a4b';rr(-.2*w,-.05*w,.4*w,.26*w,w*.03);x.fill();x.stroke();x.fillStyle='#e3a867';rr(-.22*w,-.12*w,.44*w,.1*w,w*.03);x.fill();x.stroke();
    x.strokeStyle='#bbb';x.lineWidth=lw*.8;for(let i=0;i<3;i++){const sx=(i-1)*.1*w,off=Math.sin(lt*4+i)*4;x.beginPath();x.moveTo(sx,-.17*w);x.quadraticCurveTo(sx+10+off,-.25*w,sx,-.32*w);x.stroke()}x.restore()}
  if(type==='kursus'){x.fillStyle='#111';x.beginPath();x.moveTo(-.5*w,y0-.02*h);x.lineTo(0,y0-.12*h);x.lineTo(.5*w,y0-.02*h);x.lineTo(0,y0+.07*h);x.closePath();x.fill();
    x.fillStyle='#333';rr(-.22*w,y0+.04*h,.44*w,.08*h,w*.03);x.fill();x.strokeStyle='#ffc233';x.lineWidth=lw;x.beginPath();x.moveTo(.4*w,y0-.03*h);x.lineTo(.42*w,y0+.14*h);x.stroke();x.fillStyle='#ffc233';x.beginPath();x.arc(.42*w,y0+.16*h,.035*w,0,7);x.fill();
    x.strokeStyle='#111';x.lineWidth=lw;x.beginPath();x.arc(-.19*w,.02*h,.14*w,0,7);x.stroke();x.beginPath();x.arc(.19*w,.02*h,.14*w,0,7);x.stroke();x.beginPath();x.moveTo(-.05*w,.02*h);x.lineTo(.05*w,.02*h);x.stroke();
    x.save();x.translate(.5*w,.40*h);x.rotate(.1);x.fillStyle=BLUE;rr(-.2*w,-.14*w,.4*w,.3*w,w*.02);x.fill();x.stroke();x.fillStyle='#fff';rr(-.17*w,-.11*w,.34*w,.24*w,w*.015);x.fill();x.strokeStyle='#999';x.lineWidth=lw*.6;for(let i=0;i<3;i++){x.beginPath();x.moveTo(-.12*w,-.05*w+i*.07*w);x.lineTo(.12*w,-.05*w+i*.07*w);x.stroke()}x.restore()}
  if(type==='laundry'){x.fillStyle=BLUE;x.beginPath();x.arc(0,y0+.08*h,.46*w,Math.PI,0);x.closePath();x.fill();x.stroke();rr(-.5*w,y0+.07*h,.62*w,.05*h,w*.02);x.fillStyle='#1557b8';x.fill();x.stroke();x.fillStyle='#fff';x.beginPath();x.arc(0,y0-.14*h,.035*w,0,7);x.fill();x.stroke();
    x.lineWidth=lw*.8;x.strokeStyle='#6fb6ff';x.fillStyle='rgba(111,182,255,.25)';[[-.58,-.05,.1],[.62,-.22,.07],[-.66,.22,.06],[.7,.08,.09]].forEach((b,i)=>{const dy=Math.sin(lt*3+i)*8;x.beginPath();x.arc(b[0]*w,b[1]*h+dy,b[2]*w,0,7);x.fill();x.stroke()});
    x.save();x.translate(.5*w,.40*h);x.scale(.17*w/50*1,.17*w/50*1);x.fillStyle='#9ec9ff';x.strokeStyle='#111';x.lineWidth=lw*3;const P=[[-1,-.7],[-.35,-.7],[-.2,-.5],[.2,-.5],[.35,-.7],[1,-.7],[1.25,-.1],[.65,0],[.65,1],[-.65,1],[-.65,0],[-1.25,-.1]];x.beginPath();P.forEach((q,i)=>i?x.lineTo(q[0]*50,q[1]*50):x.moveTo(q[0]*50,q[1]*50));x.closePath();x.fill();x.stroke();x.restore()}
  x.restore()}
function chip(s,cx,cy,col,tcol='#fff',size=44,mark='',alpha=1,sc=1){x.save();x.globalAlpha=alpha;x.translate(cx,cy);x.scale(sc,sc);x.font='800 '+size+'px '+FI;const w=x.measureText(s).width+70+(mark?60:0),h=size+44;shadow();rr(-w/2,-h/2,w,h,h/2);x.fillStyle=col;x.fill();shadow(false);x.fillStyle=tcol;x.textAlign='center';x.textBaseline='middle';x.fillText(s,(mark?30:0),3);
  if(mark){x.font='900 '+size+'px '+FI;x.fillText(mark,-w/2+48,3)}x.restore()}
function chipAt(s,cx,cy,col,tcol,size,mark,p,lt,t0){const q=prog(lt,t0,t0+.3);if(q<=0)return;chip(s,cx,cy,col,tcol,size,mark,clamp(q*2),.8+.2*back(q))}
function strike(X1,X2,Y,lt,t0){const a=prog(lt,t0,t0+.3);x.save();x.strokeStyle=RED;x.lineWidth=14;x.lineCap='round';x.beginPath();x.moveTo(X1,Y);x.lineTo(X1+a*(X2-X1),Y);x.stroke();x.restore()}
function card(label,lines,t,t0,t1,cx,cy,col){const w=900,h=150+lines.length*74;x.save();x.translate(cx,cy);shadow();rr(-w/2,-h/2,w,h,36);x.fillStyle='#10142a';x.fill();shadow(false);
  rr(-w/2+34,-h/2+30,label.length*24+64,56,28);x.fillStyle=col;x.fill();txt(label,-w/2+66,-h/2+70,28,'#fff',800,'left');
  const all=lines.join(' ').length;const n=Math.floor(prog(t,t0,t1)*all);let used=0;
  lines.forEach((s,i)=>{const take=Math.max(0,Math.min(s.length,n-used));used+=s.length+1;txt(s.slice(0,take),-w/2+40,-h/2+170+i*74,50,'#f6f2ea',700,'left')});x.restore()}
function seenTick(lt,t0){const q=prog(lt,t0,t0+.25);if(q<=0)return;x.save();x.globalAlpha=q;txt('Seen',760,1090,40,'#8a909c',800,'right');txt('\\u2713\\u2713',845,1090,44,BLUE,900,'left');x.restore()}
function vis(t,V){const p=V.lt,a=V.t-V.lt;
  switch(V.n){
  case 'chatHarga':bub('Berapa harganya, kak?',400,900,GRAY,'#10142a',56,.1,p,-1);break;
  case 'seen':bub('Berapa harganya, kak?',400,900,GRAY,'#10142a',56,-9,p,-1);seenTick(p,.2);break;
  case 'harga':{const s=back(prog(p,0,.35));x.save();x.translate(540,1000);x.rotate(-.06);x.scale(s,s);shadow();rr(-290,-150,580,300,50);x.fillStyle='#fff';x.fill();shadow(false);x.lineWidth=8;x.strokeStyle='#111';x.stroke();x.beginPath();x.arc(-220,0,24,0,7);x.stroke();txt('Rp ???',40,40,120,'#111',900,'center',FK);x.restore();txt('?',830,780,260,RED,900,'center',FK)}break;
  case 'panjang':{x.save();shadow();rr(110,760,860,500,44);x.fillStyle=GRAY;x.fill();shadow(false);x.restore();const W2=[780,740,790,700,760,500];W2.forEach((w,i)=>{const q=prog(p,.1+i*.08,.3+i*.08);x.fillStyle='#b9bfcc';rr(150,810+i*72,w*q,34,17);x.fill()});chipAt('terlalu panjang',540,1360,RED,'#fff',56,'',p,p,.6)}break;
  case 'tanpaLangkah':bub('Harga paket Rp[harga]',420,820,GRAY,'#10142a',50,.05,p,-1);x.save();x.setLineDash([22,18]);x.lineWidth=8;x.strokeStyle='#999';rr(160,1000,760,260,40);x.stroke();x.restore();txt('?',540,1190,200,'#999',900,'center',FK);chipAt('tidak ada langkah lanjut',540,1380,YEL,'#1a1200',50,'',p,p,.5);break;
  case 'ulang':[['Jawaban yang sama',400,760,-1],['Jawaban yang sama',680,940,1],['Jawaban yang sama',400,1120,-1]].forEach((b,i)=>bub(b[0],b[1],b[2],i==1?BLUE:GRAY,i==1?'#fff':'#10142a',52,.05+i*.4,p,b[3]));chipAt('copy-paste lagi',540,1350,RED,'#fff',54,'',p,p,1.3);break;
  case 'butlerDraf':pic('butler',440,1010,600);chipAt('DRAF',800,1130,BLUE,'#fff',70,'',p,p,.3);break;
  case 'drafBukan':chip('DRAF',540,850,BLUE,'#fff',84);chip('OTOMATIS',540,1050,'#9aa0ad','#fff',70,'\\u2717');strike(150,930,1050,p,.4);break;
  case 'cek':chip('Kamu yang cek',540,1000,GREEN,'#fff',70,'\\u2713');break;
  case 'kirim':chip('Kamu yang kirim',540,1000,BLUE,'#fff',70,'\\u2713');break;
  case 'daftarHarga':card('DAFTAR HARGA',['Layanan A   Rp[harga]','Layanan B   Rp[harga]','Layanan C   Rp[harga]'],V.t,a+.1,a+1.1,540,1000,BLUE);break;
  case 'pertanyaan':bub('Berapa harganya, kak?',400,960,GRAY,'#10142a',56,.05,p,-1);chipAt('tanpa nama',380,1130,RED,'#fff',54,'\\u2717',p,p,.9);chipAt('tanpa nomor',680,1280,RED,'#fff',54,'\\u2717',p,p,1.7);break;
  case 'aturan1':chipAt('ramah',540,860,GREEN,'#fff',64,'\\u2713',p,p,.1);chipAt('maksimal 5 kalimat',540,1030,GREEN,'#fff',64,'\\u2713',p,p,.7);break;
  case 'aturan2':chip('ramah',540,860,GREEN,'#fff',64,'\\u2713');chip('maksimal 5 kalimat',540,1030,GREEN,'#fff',64,'\\u2713');chipAt('harga hanya dari daftar',540,1200,GREEN,'#fff',64,'\\u2713',p,p,.2);chipAt('tutup dengan 1 pertanyaan',540,1370,GREEN,'#fff',64,'\\u2713',p,p,1.7);break;
  case 'laundry':chip('Laundry',540,1130,BLUE,'#fff',90);chipAt('tanya: jumlah kilo',540,1320,GREEN,'#fff',58,'',p,p,.4);break;
  case 'katering':chip('Katering',540,1130,'#7a4de8','#fff',90);chipAt('tanya: jumlah porsi + tanggal',540,1320,GREEN,'#fff',50,'',p,p,.4);break;
  case 'kursus':chip('Kursus',540,1130,'#f08a1d','#fff',90);chipAt('tanya: jadwal yang diminati',540,1320,GREEN,'#fff',54,'',p,p,.4);break;
  case 'sama':chip('Laundry',200,1170,BLUE,'#fff',46);chip('Katering',540,1170,'#7a4de8','#fff',46);chip('Kursus',860,1170,'#f08a1d','#fff',46);chipAt('= struktur sama',540,1380,GREEN,'#fff',64,'',p,p,.5);break;
  case 'pagar':{const s=back(prog(p,0,.35));x.save();x.translate(540,1000);x.scale(s,s);x.fillStyle=RED;x.beginPath();for(let i=0;i<8;i++){const a2=Math.PI/8+i*Math.PI/4;x.lineTo(300*Math.cos(a2),300*Math.sin(a2))}x.closePath();shadow();x.fill();shadow(false);txt('!',0,95,300,'#fff',900,'center',FK);x.restore();txt('PAGAR',540,1400,120,'#111',900,'center',FK)}break;
  case 'cek3':chipAt('harga',540,820,GREEN,'#fff',66,'\\u2713',p,p,.05);chipAt('promo',540,990,GREEN,'#fff',66,'\\u2713',p,p,.7);chipAt('ketersediaan',540,1160,GREEN,'#fff',66,'\\u2713',p,p,1.3);break;
  case 'dilarang':chipAt('nama',540,820,RED,'#fff',66,'\\u2717',p,p,.05);chipAt('nomor',540,990,RED,'#fff',66,'\\u2717',p,p,.8);chipAt('alamat',540,1160,RED,'#fff',66,'\\u2717',p,p,1.5);break;
  case 'paket':{const s2=back(prog(p,0,.35));x.save();x.translate(540,1000);x.scale(s2,s2);for(let i=0;i<5;i++){const a2=(i-2)*.1;x.save();x.rotate(a2);x.translate((i-2)*70,i*8-30);rr(-250,-190,500,380,36);shadow();x.fillStyle=i%2?'#fff':'#f1f4fb';x.fill();shadow(false);x.lineWidth=5;x.strokeStyle=BLUE;x.stroke();x.restore()}
    rr(-250,-190,500,380,36);x.fillStyle='#10142a';x.fill();txt('5 PROMPT',0,-30,70,'#fff',900,'center');txt('USAHA JASA',0,60,66,'#ffd21f',900,'center');x.restore()}break;
  case 'cta':{const pl=1+.04*Math.sin(p*9);const s=back(prog(p,0,.3))*pl;x.save();x.translate(540,980);x.scale(s,s);rr(-400,-170,800,340,70);shadow();x.fillStyle=BLUE;x.fill();shadow(false);txt('KOMEN',0,-35,80,'#fff',800,'center');txt('JASA',0,95,130,'#ffd21f',900,'center');x.restore()}break;
  case 'kirimTeman':pic('butler',440,1010,600);bub('Kirim ke temanmu',690,960,BLUE,'#fff',54,.1,p,-1);break;
  case 'kirimTeman2':pic('butler',440,1010,600);bub('Kirim ke temanmu',690,960,BLUE,'#fff',54,-9,p,-1);bub('yang ngetik ulang terus',640,1290,GREEN,'#fff',48,.1,p,1);break;
  }}
function caption(t,k){const C=CH[k];const lines=wrapT(C.text.replace(/\\*/g,''),C.text);const pp=back(prog(t,C.a,C.a+.18));x.save();x.translate(W/2,340);const sc=.92+.08*pp;x.scale(sc,sc);x.globalAlpha=clamp(pp*2);x.font='700 84px '+FK;
  lines.forEach((L,li)=>{const tw=L.reduce((a2,q)=>a2+x.measureText(q.w+' ').width,0);let X=-tw/2;const Y=(li-(lines.length-1)/2)*96+20;
    for(const q of L){x.textAlign='left';x.textBaseline='alphabetic';x.fillStyle=q.hl?BLUE:'#111';x.fillText(q.w,X,Y);X+=x.measureText(q.w+' ').width}});x.restore()}
function wrapT(plain,star){x.font='700 84px '+FK;const ws=star.split(' ');const L=[];let cur=[],cw=0;let hl=false;
  for(const raw of ws){const hasS=raw.startsWith('*'),endS=raw.endsWith('*');if(hasS)hl=true;const w=raw.replace(/\\*/g,'');const ww=x.measureText(w+' ').width;if(cw+ww>940&&cur.length){L.push(cur);cur=[];cw=0}cur.push({w,hl});cw+=ww;if(endS)hl=false}if(cur.length)L.push(cur);return L}
function frame(t){x.fillStyle='#fff';x.fillRect(0,0,W,H);let k=0;for(let i=0;i<CH.length;i++)if(t>=CH[i].a)k=i;const C=CH[k];
  if(t<4.4){x.save();x.globalAlpha=.7*(1-ease(prog(t,3.8,4.4)));txt('Disclaimer: Konten ini murni untuk tujuan edukasi.',W/2,100,30,'#666',600,'center');txt('AI hanya menyusun draf. Harga dan promo tetap kamu cek.',W/2,142,30,'#666',600,'center');x.restore()}
  caption(t,k);
  const lt=t-C.a,pp=back(prog(lt,0,.25));x.save();const sc=.88+.12*pp;x.translate(540,1000);x.scale(sc,sc);x.translate(-540,-1000);x.globalAlpha=clamp(pp*2.5);vis(t,{n:C.vis,lt,t});x.restore();
  {const v=C.vis,pf=back(prog(lt,0,.3)),tk=inSpan(t)?envAt(t):-1;
   if(v==='laundry'||v==='katering'||v==='kursus'){x.save();x.translate(540,760);const q=.6+.4*pf;x.scale(q,q);x.translate(-540,-760);costume(v,540,760,430,C.face,lt,.05*Math.sin(lt*3),tk);x.restore()}
   else if(v==='sama'){[['laundry',200],['katering',540],['kursus',860]].forEach((a,i)=>{const d=prog(lt,i*.12,i*.12+.3);x.save();x.translate(a[1],880);const q=.5+.5*back(d);x.scale(q,q);x.translate(-a[1],-880);costume(a[0],a[1],880,270,C.face,lt+i,.06*Math.sin(lt*4+i),tk);x.restore()})}
   else{const cta=v==='cta',butler=/butler|kirimTeman/.test(v);
    // avatar berpindah kiri/kanan setiap frasa (butler selalu di kiri, jadi avatar di kanan)
    const right=butler||k%2===0;const sl=ease(prog(lt,0,.4));const cx0=cta?540:(right?850:230),cy=cta?1420:(k%4<2?650:720),w=cta?400:340;const dx=cta?0:(right?1:-1)*(1-sl)*300;
    x.save();x.translate(cx0+dx,cy);x.scale(.6+.4*pf,.6+.4*pf);x.translate(-(cx0+dx),-cy);faceD(cx0+dx,cy,w,.06*Math.sin(lt*4)+(1-sl)*(right?.25:-.25),C.face,tk);x.restore()}}
  x.save();x.globalAlpha=.4;txt('@alamnurdiann',W/2,H-210,34,'#333',700,'center');x.restore()}
window.draw=frame;window.ready=Promise.all(Object.keys(SRC).map(k=>new Promise(r=>{const im=new Image();im.onload=()=>{IM[k]=im;r()};im.src=SRC[k]}))).then(()=>Promise.all([document.fonts.load('700 84px Kalam'),document.fonts.load('800 50px Inter'),document.fonts.load('900 50px Inter')])).then(()=>true);
</script></body></html>`;
fs.writeFileSync(path.join(dir, 'scene.html'), html);
(async () => {
  const test = (process.argv.find(a => a.startsWith('--test=')) || '').split('=')[1];
  const b = await chromium.launch(); const pg = await b.newPage({ viewport: { width: W, height: H } });
  pg.on('pageerror', e => console.log('PAGEERR', e.message));
  await pg.goto('file://' + path.join(dir, 'scene.html')); await pg.evaluate(() => window.ready);
  if (test) { for (const tt of test.split(',')) { await pg.evaluate(t => window.draw(t), +tt); const d = await pg.evaluate(() => document.getElementById('c').toDataURL('image/jpeg', .85)); fs.writeFileSync(path.join(dir, `test_${tt}.jpg`), Buffer.from(d.split(',')[1], 'base64')); } await b.close(); return; }
  const N = Math.round(DUR * FPS); const out = path.join(dir, 'reel-jasa.mp4');
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

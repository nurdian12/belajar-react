// Reel skit "Bos vs admin": avatar bos (kiri, topi koki) dan admin (kanan), visual prop di tengah, teks tulisan tangan di atas, voice over 45,21 dtk.
// node render.js [--test=detik,detik] | node render.js --chunks
const { chromium } = require('playwright'); const { spawn } = require('child_process'); const fs = require('fs'), path = require('path');
const W = 1080, H = 1920, FPS = 30, DUR = 38.42; const dir = __dirname;
const IMG = (n) => 'data:image/png;base64,' + fs.readFileSync(path.join(dir, n)).toString('base64');
const IMGS = {}; for (let i = 0; i < 9; i++) IMGS['face' + i] = IMG(`face${i}.png`);
const LIP = require('../lipsync/lipsync.js'); const ENV = JSON.parse(fs.readFileSync(path.join(dir, 'env.json')));
const FONT = fs.readFileSync(path.join(dir, 'fonts/kalam-latin-700-normal.woff2')).toString('base64');
// [mulaiSuara, akhirSuara, teks (*kata* = sorot), [visual per frasa], [stiker wajah per frasa], pembicara B/A/N]
// stiker: 0 tertawa, 1 marah, 2 sedih menangis, 3 "huh?", 4 datar, 5 sedih, 6 cemas, 7 kaget, 8 lidah
const SEG = [
  [0, 3.00, 'Bikin konten yang *kekinian* aja ya. Yang *viral* gitu.', ['bubKekinian', 'bubViral'], [8, 4], 'B'],
  [3.91, 5.44, '*Kekinian* yang kayak gimana, Kak?', ['tanya'], [3], 'A'],
  [5.93, 6.75, '*Targetnya* siapa?', ['target'], [6], 'A'],
  [7.59, 10.02, 'Pokoknya bagus. Nanti kalau salah, kamu *revisi*.', ['bagusChip', 'revisiStack', 'revisiStack'], [4, 8, 4], 'B'],
  [10.88, 13.77, 'Boleh saya minta AI menyusun *pertanyaan* klarifikasi dulu?', ['aiPertanyaan', 'aiPertanyaan'], [4, 0], 'A'],
  [14.62, 16.05, 'AI yang bikin *kontennya*?', ['aiKonten'], [3], 'B'],
  [16.35, 16.95, 'Bukan, Kak.', ['silangKonten'], [4], 'A'],
  [17.30, 18.81, 'AI cuma menyusun *pertanyaan*.', ['chipPertanyaan'], [0], 'A'],
  [19.27, 22.58, 'Briefnya saya tempel tanpa *data rahasia* dan *login akun*.', ['brief', 'dilarang3'], [4, 6], 'A'],
  [23.39, 24.45, 'Pertanyaan tentang apa aja?', ['tanya'], [3], 'B'],
  [24.83, 26.21, 'Empat hal: tugas, bahan,', ['empat0', 'brief2'], [4, 0], 'A'],
  [26.99, 31.04, 'aturan, dan batas. Semuanya saya *cek* dulu sebelum dikirim, soalnya AI bisa *salah tangkap*.', ['brief4', 'cekDulu', 'salahTangkap'], [0, 4, 6], 'A'],
  [31.86, 33.78, 'Hmm... oke, tanyain aja.', ['hmm', 'oke'], [3, 5], 'B'],
  [34.60, 36.74, 'Mau template prompt untuk memecah *brief* klien?', ['paket', 'paket'], [0, 0], 'N'],
  [37.13, 38.42, 'Komen *BRIEF*.', ['cta'], [0], 'N'],
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
const CH=${JSON.stringify(CH)};const ENV=${JSON.stringify(ENV)};const SPANS=${JSON.stringify(SEG.map(q=>[q[0],q[1]]))};const SRC=${JSON.stringify(IMGS)};const IM={};
const clamp=(v,a=0,b=1)=>Math.min(b,Math.max(a,v)),lerp=(a,b,t)=>a+(b-a)*t,ease=t=>t<.5?4*t*t*t:1-Math.pow(-2*t+2,3)/2,prog=(t,a,b)=>clamp((t-a)/(b-a));
const back=t=>{const c1=1.9,c3=c1+1;return 1+c3*Math.pow(t-1,3)+c1*Math.pow(t-1,2)};
const FK='Kalam, sans-serif',FI='Inter, DejaVu Sans, sans-serif';const BLUE='#1d6fe8',GREEN='#25c26a',RED='#e5352b',YEL='#ffc233',GRAY='#e9ecf3',ORANGE='#f08a1d';const Y0=650;
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
function faceD(cx,cy,w,rot=0,k=1,talk=-1){const im=IM['face'+k];const h=w*im.height/im.width;x.save();x.translate(cx,cy);x.rotate(rot);shadow();x.drawImage(im,-w/2,-h/2,w,h);shadow(false);if(talk>=0)talkMouth(k,w,h,talk);x.restore()}
function chefAvatar(cx,cy,w,k,lt,rot=0,talk=-1){const im=IM['face'+k];const h=w*im.height/im.width;x.save();x.translate(cx,cy);x.rotate(rot);shadow();x.drawImage(im,-w/2,-h/2,w,h);shadow(false);if(talk>=0)talkMouth(k,w,h,talk);
  const y0=-h*.27,lw=Math.max(5,w*.022);x.lineWidth=lw;x.strokeStyle='#111';x.lineJoin='round';x.fillStyle='#fff';
  [[-.22,-.10,.17],[0,-.17,.20],[.22,-.10,.17]].forEach(a=>{x.beginPath();x.arc(a[0]*w,y0+a[1]*h,a[2]*w,0,7);x.fill();x.stroke()});rr(-.36*w,y0-.04*h,.72*w,.11*h,w*.04);x.fill();x.stroke();x.restore()}
${LIP.code}
function arrow(X1,X2,Y,lt,t0){const a=prog(lt,t0,t0+.3);if(a<=0)return;x.save();x.strokeStyle='#111';x.fillStyle='#111';x.lineWidth=14;x.lineCap='round';const xe=X1+(X2-X1)*a;x.beginPath();x.moveTo(X1,Y);x.lineTo(xe,Y);x.stroke();if(a>.9){x.beginPath();x.moveTo(X2,Y);x.lineTo(X2-34,Y-26);x.lineTo(X2-34,Y+26);x.closePath();x.fill()}x.restore()}
function inSpan(t){return SPANS.some(q=>t>=q[0]-.03&&t<=q[1]+.05)}
function vis(t,V){const p=V.lt,a=V.t-V.lt;
  switch(V.n){
  case 'bubKekinian':bub('yang kekinian aja ya',420,Y0,GRAY,'#10142a',54,.05,p,-1);break;
  case 'bubViral':bub('yang kekinian aja ya',420,Y0-70,GRAY,'#10142a',54,-9,p,-1);bub('yang viral gitu!',650,Y0+80,BLUE,'#fff',54,.05,p,1);break;
  case 'tanya':{const s=back(prog(p,0,.3));x.save();x.translate(540,Y0+90);x.scale(s,s);txt('?',0,0,380,'#111',900,'center',FK);x.restore()}break;
  case 'target':chip('Targetnya siapa?',540,Y0,YEL,'#1a1200',64,'?');break;
  case 'bagusChip':chip('pokoknya bagus',540,Y0,GRAY,'#10142a',66);break;
  case 'revisiStack':for(let i=0;i<4;i++){const q=back(prog(p,i*.12,i*.12+.3));x.save();x.translate(540+(i-1.5)*26,Y0-60+i*36);x.rotate((i-1.5)*.08);x.scale(q,q);shadow();rr(-210,-60,420,120,22);x.fillStyle='#fff';x.fill();shadow(false);x.lineWidth=5;x.strokeStyle='#111';x.stroke();txt('REVISI',0,22,64,RED,900,'center',FK);x.restore()}break;
  case 'aiPertanyaan':chip('AI',260,Y0,BLUE,'#fff',70);arrow(370,700,Y0,p,.2);bub('? ? ?',840,Y0,GRAY,'#10142a',60,.5,p,0);break;
  case 'aiKonten':chip('AI',250,Y0,BLUE,'#fff',70);arrow(360,700,Y0,p,.2);chip('KONTEN',860,Y0,GRAY,'#10142a',54,'?');break;
  case 'silangKonten':chip('KONTEN',540,Y0,'#9aa0ad','#fff',80,'✗');strike(120,960,Y0,p,.2);break;
  case 'chipPertanyaan':chip('PERTANYAAN',540,Y0,BLUE,'#fff',84,'✓');break;
  case 'brief':card('BRIEF KLIEN',['"yang kekinian aja ya,','yang viral gitu"'],V.t,a+.1,a+.9,540,Y0,BLUE);break;
  case 'dilarang3':chipAt('data rahasia',540,Y0-80,RED,'#fff',66,'✗',p,.05);chipAt('login akun',540,Y0+80,RED,'#fff',66,'✗',p,.5);break;
  case 'empat0':chip('4 HAL',540,Y0,'#10142a','#ffd21f',110);break;
  case 'brief2':chipAt('TUGAS',330,Y0,BLUE,'#fff',66,'',p,.05);chipAt('BAHAN',760,Y0,'#7a4de8','#fff',66,'',p,.45);break;
  case 'brief4':chip('TUGAS',330,Y0-90,BLUE,'#fff',62);chip('BAHAN',760,Y0-90,'#7a4de8','#fff',62);chipAt('ATURAN',330,Y0+90,GREEN,'#fff',62,'',p,.05);chipAt('BATAS',760,Y0+90,RED,'#fff',62,'',p,.45);break;
  case 'cekDulu':chip('cek dulu',540,Y0,GREEN,'#fff',90,'✓');break;
  case 'salahTangkap':chip('AI bisa salah tangkap',540,Y0,YEL,'#1a1200',62,'!');break;
  case 'hmm':{const s=back(prog(p,0,.3));x.save();x.translate(540,Y0+70);x.scale(s,s);txt('Hmm...',0,0,200,'#111',900,'center',FK);x.restore()}break;
  case 'oke':chip('oke, tanyain aja',540,Y0,GREEN,'#fff',70,'✓');break;
  case 'paket':{const s2=back(prog(p,0,.35))*.8;x.save();x.translate(540,Y0-30);x.scale(s2,s2);for(let i=0;i<5;i++){const a2=(i-2)*.1;x.save();x.rotate(a2);x.translate((i-2)*70,i*8-30);rr(-250,-190,500,380,36);shadow();x.fillStyle=i%2?'#fff':'#f1f4fb';x.fill();shadow(false);x.lineWidth=5;x.strokeStyle=BLUE;x.stroke();x.restore()}
    rr(-250,-190,500,380,36);x.fillStyle='#10142a';x.fill();txt('5 PROMPT',0,-30,70,'#fff',900,'center');txt('BRIEF KLIEN',0,60,66,'#ffd21f',900,'center');x.restore()}break;
  case 'cta':{const pl=1+.04*Math.sin(p*9);const s=back(prog(p,0,.3))*pl*.85;x.save();x.translate(540,Y0-30);x.scale(s,s);rr(-400,-170,800,340,70);shadow();x.fillStyle=BLUE;x.fill();shadow(false);txt('KOMEN',0,-35,80,'#fff',800,'center');txt('BRIEF',0,95,130,'#ffd21f',900,'center');x.restore()}break;
  }}
function wrapT(star){x.font='700 84px '+FK;const ws=star.split(' ');const L=[];let cur=[],cw=0,hl=false;
  for(const raw of ws){const hasS=raw.startsWith('*'),endS=raw.endsWith('*');if(hasS)hl=true;const w=raw.replace(/\\*/g,'');const ww=x.measureText(w+' ').width;if(cw+ww>940&&cur.length){L.push(cur);cur=[];cw=0}cur.push({w,hl});cw+=ww;if(endS)hl=false}if(cur.length)L.push(cur);return L}
function caption(t,k){const C=CH[k];const lines=wrapT(C.text);const pp=back(prog(t,C.a,C.a+.18));x.save();x.translate(W/2,350);const sc=.92+.08*pp;x.scale(sc,sc);x.globalAlpha=clamp(pp*2);x.font='700 84px '+FK;
  lines.forEach((L,li)=>{const tw=L.reduce((a2,q)=>a2+x.measureText(q.w+' ').width,0);let X=-tw/2;const Y=(li-(lines.length-1)/2)*96+20;
    for(const q of L){x.textAlign='left';x.textBaseline='alphabetic';x.fillStyle=q.hl?(C.who==='B'?ORANGE:BLUE):'#111';x.fillText(q.w,X,Y);X+=x.measureText(q.w+' ').width}});x.restore()}
function tube(pts,wo,wi,col='#fff'){x.save();x.lineCap='round';x.lineJoin='round';[['#111',wo],[col,wi]].forEach(([c,w])=>{x.strokeStyle=c;x.lineWidth=w;x.beginPath();pts.forEach((q,i)=>i?x.lineTo(q[0],q[1]):x.moveTo(q[0],q[1]));x.stroke()});x.restore()}
function poly(pts,fill){x.beginPath();pts.forEach((q,i)=>i?x.lineTo(q[0],q[1]):x.moveTo(q[0],q[1]));x.closePath();x.fillStyle=fill;x.fill();x.lineWidth=3.2;x.strokeStyle='#111';x.lineJoin='round';x.stroke()}
// badan + baju stickman. type 'A' admin: kaus hitam, celana jin pendek, sneakers putih. type 'B' klien: kemeja putih, dasi merah, celana panjang abu, sepatu hitam.
function bodyD(type,cx,feetY,hw,k,lt,active,talk,e){const u=hw/100,bodyTop=feetY-178*u,headCy=bodyTop-58*u;x.save();x.translate(cx,bodyTop);x.scale(u,u);x.lineJoin='round';
  const sw=Math.sin(lt*7)*6*e;
  if(type==='A'){ // kaki, celana jin, sepatu
    tube([[-17,112],[-18,160]],10,5.6);tube([[17,112],[18,160]],10,5.6);
    poly([[-34,68],[-2,68],[-4,118],[-38,118]],'#5b86c8');poly([[2,68],[34,68],[38,118],[4,118]],'#5b86c8');
    x.fillStyle='#7ea2da';[[-39,112,36],[3,112,36]].forEach(c=>{x.beginPath();x.rect(c[0],c[1],c[2],7);x.fill();x.lineWidth=3;x.stroke()});
    [[-40,159,34],[6,159,34]].forEach(c=>{rr(c[0],c[1],c[2],19,9);x.fillStyle='#fff';x.fill();x.lineWidth=3.2;x.stroke();x.beginPath();x.moveTo(c[0]+3,c[1]+13);x.lineTo(c[0]+c[2]-3,c[1]+13);x.stroke()});
    // kaus hitam + lengan
    poly([[-32,0],[32,0],[36,74],[-36,74]],'#1c1c21');poly([[-32,2],[-60,12],[-55,38],[-31,30]],'#1c1c21');poly([[32,2],[60,12],[55,38],[31,30]],'#1c1c21');
    const ER=e>0.02&&active?[62+14*e+sw*.4,86-38*e-sw]:[62,86];
    tube([[-57,36],[-60,62],[-62,86]],9,5);tube([[57,36],[ER[0]-4,(36+ER[1])/2],ER],9,5);
    x.fillStyle='#fff';x.lineWidth=3;[[-62,88],[ER[0],ER[1]+2]].forEach(h=>{x.beginPath();x.arc(h[0],h[1],6.5,0,7);x.fill();x.stroke()});
  }else{
    tube([[-15,110],[-16,160]],11,0.1,'#4a4f5c');
    poly([[-32,68],[-1,68],[-3,160],[-28,160]],'#4a4f5c');poly([[1,68],[32,68],[28,160],[3,160]],'#4a4f5c');
    [[-40,159,34],[6,159,34]].forEach(c=>{rr(c[0],c[1],c[2],19,9);x.fillStyle='#17171b';x.fill();x.lineWidth=3.2;x.stroke()});
    poly([[-32,0],[32,0],[36,74],[-36,74]],'#fff');
    poly([[-14,0],[0,22],[-3,0]],'#fff');poly([[14,0],[0,22],[3,0]],'#fff');
    poly([[0,12],[-6,24],[-4,56],[0,64],[4,56],[6,24]],'#e5352b');
    const EL=e>0.02&&active?[-62-14*e-sw*.4,86-38*e-sw]:[-62,86];
    tube([[-34,6],[-58,36],[EL[0]+2,(36+EL[1])/2],EL],14,10);tube([[34,6],[58,36],[62,86]],14,10);
    x.fillStyle='#fff';x.lineWidth=3;[[EL[0],EL[1]+3],[62,89]].forEach(h=>{x.beginPath();x.arc(h[0],h[1],7,0,7);x.fill();x.stroke()});
  }
  x.restore();return headCy}
function avatars(t,C,lt,k){const prevWho=k>0?CH[k-1].who:C.who;
  [['B',270],['A',810]].forEach(([who,cx])=>{const active=C.who===who||C.who==='N';const changed=(prevWho!==C.who);const pop=active&&changed?back(prog(lt,0,.3)):1;const sc=(active?1:.9)*(active?(.92+.08*pop):1);const k2=active?C.face:4;
    const sp=active&&inSpan(t);const tk=sp?envAt(t):-1;const e=sp?Math.max(0,tk):0;const feet=1555,hw=235;const bob=sp?Math.abs(Math.sin(lt*7))*-6*e:0;
    x.save();x.translate(cx,feet+bob);x.scale(sc,sc);x.translate(-cx,-feet);
    const headCy=bodyD(who,cx,feet,hw,k2,lt,active,tk,e);faceD(cx,headCy,hw,.05*Math.sin(lt*5)*(active?1:0),k2,tk);x.restore();
    chip(who==='B'?'KLIEN':'ADMIN',cx,1610,who==='B'?ORANGE:BLUE,'#fff',34,'',active?1:.6)})}
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
  const N = Math.round(DUR * FPS); const out = path.join(dir, 'reel-brief.mp4');
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

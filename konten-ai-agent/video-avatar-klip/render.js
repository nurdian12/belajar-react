// Video Reel: avatar + voice over (41,28 detik), 1080x1920, 30 fps. node render.js [--test=detik]
const { chromium } = require('playwright'); const { spawn } = require('child_process'); const fs = require('fs'), path = require('path');
const W = 1080, H = 1920, FPS = 30, DUR = 41.28; const B = '#1d6fe8';
const AVATAR = 'data:image/jpeg;base64,' + fs.readFileSync(path.join(__dirname, 'avatar.jpg')).toString('base64');
const CAPS = [
  [0.28, 'Kok bisa sih satu video panjang jadi banyak klip,'], [2.97, 'tanpa nonton ulang dari awal?'],
  [5.24, 'Kamu punya webinar atau live sendiri berjam-jam.'], [8.51, 'Sayang kalau cuma tayang sekali.'], [10.46, 'Tapi mencari bagian bagusnya makan waktu.'],
  [13.10, 'Langkah satu:'], [14.10, 'ubah videomu jadi transkrip teks, lengkap dengan penanda waktu.'],
  [17.88, 'Langkah dua:'], [18.95, 'tempel ke AI,'], [20.08, 'minta lima bagian yang bisa berdiri sendiri,'], [22.38, 'dengan waktu dan alasannya.'],
  [24.57, 'Langkah tiga:'], [25.51, 'AI hanya mengusulkan.'], [27.08, 'Kamu cek dan potong sendiri,'], [28.67, 'karena AI bisa salah waktu.'],
  [30.79, 'Dan ingat:'], [31.48, 'hanya video milikmu,'], [32.73, 'atau yang ada izin tertulis.'], [34.62, 'Konten orang lain?'], [35.61, 'Baca aturannya,'], [36.71, 'dan jangan mengaku itu karyamu.'],
  [38.87, 'Mau template promptnya?'], [40.25, 'Komen KLIP.'],
];
const html = `<!doctype html><html><head><meta charset="utf-8"><style>body{margin:0;background:#000}canvas{display:block}</style></head><body><canvas id="c" width="${W}" height="${H}"></canvas>
<script>
const W=${W},H=${H};
const c=document.getElementById('c'),x=c.getContext('2d');const img=new Image();const B='${B}';const CAPS=${JSON.stringify(CAPS)};
const clamp=(v,a=0,b=1)=>Math.min(b,Math.max(a,v)),lerp=(a,b,t)=>a+(b-a)*t,ease=t=>t<.5?4*t*t*t:1-Math.pow(-2*t+2,3)/2,prog=(t,a,b)=>clamp((t-a)/(b-a));
const KF=[[0,360,330,1.95],[4.1,360,350,1.6],[5.3,360,380,1.0],[12.3,360,380,1.08],[13.1,420,380,1.1],[17.3,420,380,1.1],[17.9,300,380,1.1],[24.0,300,380,1.1],[24.6,360,380,1.0],[30.1,360,380,1.08],[30.8,360,300,1.2],[38.1,360,300,1.25],[38.9,360,360,1.1],[41.3,360,360,1.15]];
function cam(t){let i=0;while(i<KF.length-2&&t>KF[i+1][0])i++;const a=KF[i],b=KF[i+1];const p=ease(clamp((t-a[0])/(b[0]-a[0])));return{cx:lerp(a[1],b[1],p),cy:lerp(a[2],b[2],p),z:lerp(a[3],b[3],p)}}
function rr(X,Y,w,h,r){x.beginPath();x.moveTo(X+r,Y);x.arcTo(X+w,Y,X+w,Y+h,r);x.arcTo(X+w,Y+h,X,Y+h,r);x.arcTo(X,Y+h,X,Y,r);x.arcTo(X,Y,X+w,Y,r);x.closePath()}
function txt(s,X,Y,size,col='#fff',w=800,al='left',stroke=0){x.font=w+' '+size+'px Inter, DejaVu Sans, sans-serif';x.textAlign=al;x.textBaseline='alphabetic';if(stroke){x.lineWidth=stroke;x.strokeStyle='#05070f';x.lineJoin='round';x.strokeText(s,X,Y)}x.fillStyle=col;x.fillText(s,X,Y)}
function wrap(s,maxW,size){x.font='800 '+size+'px Inter, DejaVu Sans, sans-serif';const ws=s.split(' ');const L=[];let cur='';for(const w of ws){const t=cur?cur+' '+w:w;if(x.measureText(t).width>maxW&&cur){L.push(cur);cur=w}else cur=t}L.push(cur);return L}
function panel(X,Y,w,h,a=.82,col='10,16,34'){x.save();rr(X,Y,w,h,34);x.fillStyle='rgba('+col+','+a+')';x.fill();x.lineWidth=3;x.strokeStyle='rgba(120,170,255,.55)';x.stroke();x.restore()}
function timeline(t,t0,show,cutT){ // garis waktu panjang
  const p=ease(prog(t,t0,t0+1.6));const X=90,Y=300,w=900,h=64;panel(60,Y-90,960,200,.78);
  txt('02:00:00',90,Y-30,36,'#cfe0ff',800,'left');txt('VIDEO PANJANG',990,Y-30,26,'#7fb0ff',800,'right');
  x.save();rr(X,Y,w,h,18);x.clip();x.fillStyle='rgba(255,255,255,.12)';x.fillRect(X,Y,w,h);
  const cols=['#1d6fe8','#5a9bff','#1d6fe8','#3d86f5','#7fb0ff','#1d6fe8'];
  const cut=cutT!=null?ease(prog(t,cutT,cutT+.5)):0;
  if(!cut){for(let i=0;i<14;i++){x.fillStyle=cols[i%6];x.fillRect(X+i*(w/14),Y,(w/14)*p+1>w/14?w/14-3:(w/14)*p,h)}}
  x.restore();
  if(cut){for(let i=0;i<5;i++){const sw=120,gap=(w-5*sw)/4;const bx=X+i*(sw+gap)*1;const off=(i-2)*28*cut;x.save();x.fillStyle=cols[i];rr(bx+off,Y-6*cut,sw,h+12*cut,16);x.fill();x.restore();txt(String(i+1),bx+off+sw/2,Y+h/2+13,34,'#fff',800,'center')}}
  for(let i=0;i<=10;i++){x.fillStyle='rgba(255,255,255,.45)';x.fillRect(X+i*(w/10),Y+h+10,3,i%5==0?20:12)}
}
function slashFx(t,t0){const p=prog(t,t0,t0+.3);if(p<=0||p>=1)return;const e=ease(p);x.save();x.strokeStyle='#fff';x.lineWidth=14*(1-p)+4;x.shadowColor=B;x.shadowBlur=40;x.beginPath();x.moveTo(-100+e*(W+300),180);x.lineTo(-300+e*(W+300),620);x.stroke();x.restore()}
function transcript(t,t0){const p=ease(prog(t,t0,t0+.6));if(p<=0)return;x.save();x.globalAlpha=p;panel(110,210,860,470,.86);x.fillStyle=B;rr(140,238,220,52,26);x.fill();txt('TRANSKRIP',250,274,26,'#fff',800,'center');
  const lines=7;for(let i=0;i<lines;i++){const a=prog(t,t0+.5+i*.38,t0+.9+i*.38);if(a<=0)continue;const Y=330+i*45;x.globalAlpha=a;txt('00:'+String(1+i*7).padStart(2,'0')+':'+(10+i*3)+'0',150,Y,26,'#7fb0ff',700);x.fillStyle='rgba(255,255,255,.55)';const ww=[520,610,440,590,500,560,380][i]*a;rr(320,Y-22,ww,18,9);x.fill()}x.restore()}
function promptBox(t,t0){const p=ease(prog(t,t0,t0+.5));if(p<=0)return;x.save();x.globalAlpha=p;panel(100,200,880,500,.9,'5,8,20');
  txt('PROMPT',140,262,26,'#7fb0ff',800);const L=['Pilih 5 bagian yang bisa','berdiri sendiri. Beri waktu','mulai dan selesai, serta','alasan singkat.'];const all=L.join(' ').length;const n=Math.floor(prog(t,t0+.3,t0+3.6)*all);let used=0;
  L.forEach((s,i)=>{const take=Math.max(0,Math.min(s.length+1,n-used));used+=s.length+1;txt(s.slice(0,take),140,330+i*56,40,'#f6f2ea',700,'left')});
  for(let i=0;i<5;i++){const a=prog(t,22.4+i*.13,22.55+i*.13);const cx=190+i*155,cy=600;x.fillStyle=a>0?B:'rgba(255,255,255,.15)';x.beginPath();x.arc(cx,cy,46,0,7);x.fill();if(a>0){x.shadowColor=B;x.shadowBlur=30*a;x.fill();x.shadowBlur=0}txt(String(i+1),cx,cy+14,40,'#fff',800,'center')}
  x.restore()}
function pagar(t,t0){const p=ease(prog(t,t0,t0+.5));if(p<=0)return;x.save();x.globalAlpha=p;panel(100,190,880,560,.9,'5,8,20');
  x.fillStyle='#e5352b';x.beginPath();const cx=220,cy=330,r=70;for(let i=0;i<8;i++){const a=Math.PI/8+i*Math.PI/4;x.lineTo(cx+r*Math.cos(a),cy+r*Math.sin(a))}x.closePath();x.fill();txt('!',cx,cy+30,90,'#fff',800,'center');txt('PAGAR',330,350,86,'#fff',800,'left');
  const items=[[31.4,'Milikmu sendiri','#25c26a','\\u2713'],[32.6,'Izin tertulis','#25c26a','\\u2713'],[34.5,'Konten orang lain: baca aturan','#ffc233','!'],[36.7,'Jangan mengaku karyamu','#e5352b','\\u2717']];
  items.forEach((it,i)=>{const a=ease(prog(t,it[0],it[0]+.35));if(a<=0)return;x.save();x.globalAlpha=a;const Y=450+i*74;x.fillStyle=it[2];x.beginPath();x.arc(160,Y,32,0,7);x.fill();txt(it[3],160,Y+13,38,'#fff',800,'center');txt(it[1],220,Y+14,42,'#fff',700,'left');x.restore()});x.restore()}
function cta(t,t0){const p=ease(prog(t,t0,t0+.4));if(p<=0)return;x.save();x.globalAlpha=p;const pulse=1+.04*Math.sin((t-t0)*9);x.translate(540,380);x.scale(pulse,pulse);rr(-380,-110,760,220,60);x.fillStyle=B;x.shadowColor=B;x.shadowBlur=50;x.fill();x.shadowBlur=0;txt('KOMEN: KLIP',0,28,100,'#fff',800,'center');x.restore();
  x.save();x.globalAlpha=p;txt('Template prompt gratis',540,560,46,'#fff',700,'center',10);const by=Math.sin((t-t0)*8)*14;x.fillStyle='#fff';x.beginPath();x.moveTo(540,700+by);x.lineTo(500,650+by);x.lineTo(580,650+by);x.closePath();x.fill();x.restore()}
function hook(t){const p=ease(prog(t,.15,.7));if(p<=0)return;const out=1-ease(prog(t,4.4,5.0));x.save();x.globalAlpha=p*out;panel(70,230,940,250,.8);txt('1 VIDEO PANJANG',540,345,78,'#fff',800,'center');txt('\\u2192  BANYAK KLIP',540,445,78,'#7fb0ff',800,'center');x.restore()}
function caption(t){let i=-1;for(let k=0;k<CAPS.length;k++)if(t>=CAPS[k][0])i=k;if(i<0)return;const s=CAPS[i][1];const next=CAPS[i+1]?CAPS[i+1][0]:99;if(t>CAPS[i][0]+Math.min(next-CAPS[i][0],3.2)+.5)return;const a=ease(prog(t,CAPS[i][0],CAPS[i][0]+.12));const step=/^Langkah/.test(s);const col=step?'#7fb0ff':'#ffffff';const L=wrap(s,900,66);x.save();x.globalAlpha=a;const y0=1560-(L.length-1)*40;L.forEach((l,k)=>txt(l,540,y0+k*84,66,col,800,'center',16));x.restore()}
function draw(t){
  const k=cam(t);const breath=1+.006*Math.sin(t*2.1);const z=k.z*breath;let sh=0;if(t>27.3&&t<27.7)sh=(1-(t-27.3)/.4)*10*Math.sin(t*90);
  x.save();{const bg=x.createLinearGradient(0,0,0,H);bg.addColorStop(0,'#15171d');bg.addColorStop(1,'#2b2d33');x.fillStyle=bg;x.fillRect(0,0,W,H)}x.translate(540+sh,960);x.scale(1.5*z,1.5*z);x.translate(-k.cx,-k.cy);x.drawImage(img,0,0);x.restore();
  const g=x.createLinearGradient(0,0,0,H);g.addColorStop(0,'rgba(0,0,0,.35)');g.addColorStop(.3,'rgba(0,0,0,0)');g.addColorStop(.7,'rgba(0,0,0,0)');g.addColorStop(1,'rgba(0,0,0,.55)');x.fillStyle=g;x.fillRect(0,0,W,H);
  if(t>30.6&&t<38.3){x.fillStyle='rgba(0,0,0,'+.3*ease(prog(t,30.6,31.2))+')';x.fillRect(0,0,W,H)}
  hook(t);
  if(t>5.3&&t<12.9){x.save();x.globalAlpha=ease(prog(t,5.3,5.8))*(1-ease(prog(t,12.2,12.9)));timeline(t,5.4);x.restore()}
  if(t>13.1&&t<17.7){x.save();x.globalAlpha=1-ease(prog(t,17.2,17.7));transcript(t,13.1);x.restore()}
  if(t>17.9&&t<24.4){x.save();x.globalAlpha=1-ease(prog(t,23.9,24.4));promptBox(t,17.9);x.restore()}
  if(t>24.6&&t<30.5){x.save();x.globalAlpha=ease(prog(t,24.6,25.1))*(1-ease(prog(t,30.0,30.5)));timeline(t,24.5,true,27.3);x.restore();slashFx(t,27.2);
    const w=ease(prog(t,28.7,29.0))*(1-ease(prog(t,30.0,30.3)));if(w>0){x.save();x.globalAlpha=w;rr(300,470,480,92,46);x.fillStyle='#ffc233';x.fill();txt('\\u26A0 AI bisa salah waktu',540,532,40,'#1a1200',800,'center');x.restore()}}
  if(t>30.8&&t<38.3){x.save();x.globalAlpha=1-ease(prog(t,37.8,38.3));pagar(t,30.8);x.restore()}
  if(t>38.8)cta(t,38.85);
  if(t>27.3&&t<27.45){x.fillStyle='rgba(255,255,255,'+.5*(1-(t-27.3)/.15)+')';x.fillRect(0,0,W,H)}
  caption(t);
  x.save();x.globalAlpha=.55;txt('@alamnurdiann',W-60,H-70,36,'#fff',800,'right',8);x.restore();
  // grain halus
  x.save();x.globalAlpha=.05;for(let i=0;i<260;i++){x.fillStyle=Math.random()>.5?'#fff':'#000';x.fillRect(Math.random()*W,Math.random()*H,3,3)}x.restore();
}
window.draw=draw;window.ready=new Promise(r=>{img.onload=r;img.src='${AVATAR}'}).then(()=>document.fonts.load('800 66px Inter')).then(()=>true);
</script></body></html>`;
const dir = __dirname; fs.writeFileSync(path.join(dir, 'scene.html'), html);
(async () => {
  const test = (process.argv.find(a => a.startsWith('--test=')) || '').split('=')[1];
  const b = await chromium.launch(); const pg = await b.newPage({ viewport: { width: W, height: H } });
  await pg.goto('file://' + path.join(dir, 'scene.html')); await pg.evaluate(() => window.ready);
  if (test) { await pg.evaluate(t => window.draw(t), +test); const d = await pg.evaluate(() => document.getElementById('c').toDataURL('image/jpeg', .9)); fs.writeFileSync('/tmp/frame.jpg', Buffer.from(d.split(',')[1], 'base64')); await b.close(); return; }
  const N = Math.round(DUR * FPS);
  const ff = spawn('ffmpeg', ['-y', '-v', 'error', '-f', 'image2pipe', '-framerate', String(FPS), '-c:v', 'mjpeg', '-i', '-', '-i', path.join(dir, 'voice.wav'), '-i', path.join(dir, 'sfx.wav'),
    '-filter_complex', '[1:a]aresample=44100,volume=1.25[v];[2:a]volume=0.55[s];[v][s]amix=inputs=2:duration=first:normalize=0,alimiter=limit=0.95[a]', '-map', '0:v', '-map', '[a]',
    '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-crf', '20', '-preset', 'medium', '-r', String(FPS), '-c:a', 'aac', '-b:a', '160k', '-t', String(DUR), path.join(dir, 'klip-avatar.mp4')], { stdio: ['pipe', 'inherit', 'inherit'] });
  for (let i = 0; i < N; i++) {
    const d = await pg.evaluate(t => { window.draw(t); return document.getElementById('c').toDataURL('image/jpeg', .88); }, i / FPS);
    if (!ff.stdin.write(Buffer.from(d.split(',')[1], 'base64'))) await new Promise(r => ff.stdin.once('drain', r));
    if (i % 150 === 0) console.log('frame', i, '/', N);
  }
  ff.stdin.end(); await new Promise(r => ff.on('close', r)); await b.close(); console.log('selesai');
})();

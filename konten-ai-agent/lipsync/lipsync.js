// Kode browser untuk lip-sync stiker stickman: talkMouth(k,w,h,o) menimpa mulut stiker k dengan mulut animasi (o=0..1).
// Dipakai lewat: const LIP = require('../lipsync/lipsync.js'); lalu sisipkan LIP.code ke halaman dan ENV (hasil env.py).
module.exports.code = `
const MOUTH=[[.52,.785,.46,.24,'smile'],[.52,.785,.36,.14,'frown'],[.48,.795,.36,.16,'frown'],[.59,.77,.44,.18,'flat'],[.58,.715,.36,.10,'flat'],[.50,.79,.40,.14,'frown'],[.515,.795,.43,.14,'frown'],[.435,.80,.22,.26,'o'],[.50,.795,.42,.22,'flat']];
function envAt(t){const i=Math.round(t*30);return ENV[Math.min(ENV.length-1,Math.max(0,i))]}
function talkMouth(k,w,h,o){const P=MOUTH[k];const cx=(P[0]-.5)*w,cy=(P[1]-.5)*h,pw=P[2]*w,ph=P[3]*h,hw=pw*.36,lw=Math.max(5,w*.024),type=P[4];
  x.save();x.shadowColor='transparent';x.shadowBlur=0;x.fillStyle='#fff';rr(cx-pw/2,cy-ph/2,pw,ph,ph*.4);x.fill();
  x.strokeStyle='#111';x.fillStyle='#111';x.lineWidth=lw;x.lineCap='round';x.lineJoin='round';
  if(type==='smile'){const top=cy-ph*.25;x.beginPath();x.moveTo(cx-hw,top);
    if(o<.08){x.moveTo(cx-hw,cy-ph*.1);x.quadraticCurveTo(cx,cy+ph*.38,cx+hw,cy-ph*.1);x.stroke()}
    else{const dep=ph*.22+o*ph*.9;x.quadraticCurveTo(cx,top+.04*ph,cx+hw,top);x.quadraticCurveTo(cx,top+dep*2,cx-hw,top);x.closePath();x.fill();x.stroke();
      if(o>.4){x.save();x.clip();x.fillStyle='#e8838b';x.beginPath();x.ellipse(cx,top+dep*1.25,hw*.55,dep*.5,0,0,7);x.fill();x.restore()}}}
  else if(type==='frown'){if(o<.08){x.beginPath();x.moveTo(cx-hw,cy+ph*.15);x.quadraticCurveTo(cx,cy-ph*.4,cx+hw,cy+ph*.15);x.stroke()}
    else{x.beginPath();x.ellipse(cx,cy+ph*.05,hw*.6,ph*.08+o*ph*.42,0,0,7);x.fill()}}
  else if(type==='flat'){if(o<.08){x.beginPath();x.moveTo(cx-hw,cy+ph*.08);x.lineTo(cx+hw,cy-ph*.08);x.stroke()}
    else{x.beginPath();x.ellipse(cx,cy,hw*.62,ph*.07+o*ph*.42,-.06,0,7);x.fill()}}
  else{x.beginPath();x.ellipse(cx,cy,pw*.2+o*pw*.06,ph*.16+o*ph*.34,0,0,7);if(o<.08){x.stroke()}else x.fill()}
  x.restore()}
`;

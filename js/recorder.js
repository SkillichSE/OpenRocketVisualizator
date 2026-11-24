/* recorder.js: video export with SpaceX-style telemetry overlay */
// video export with SpaceX-style telemetry
function compose(){const c=renderer.domElement,w=rec.cv.width,h=rec.cv.height,x=rec.cx,u=h/900,s=w/innerWidth,mw=Math.min(w*.42,900*u),x0=(w-mw)/2,yT=h-40*u,W='#fff',M='rgba(255,255,255,.62)';
  x.drawImage(c,0,0,w,h);
  let g=x.createLinearGradient(0,h-260*u,0,h);g.addColorStop(0,'rgba(0,0,0,0)');g.addColorStop(1,'rgba(0,0,0,.88)');x.fillStyle=g;x.fillRect(0,h-260*u,w,260*u);
  g=x.createLinearGradient(0,0,0,110*u);g.addColorStop(0,'rgba(0,0,0,.7)');g.addColorStop(1,'rgba(0,0,0,0)');x.fillStyle=g;x.fillRect(0,0,w,110*u);
  const tx=(t,px,py,sz,wt,col,al,ls)=>{x.font=`${wt} ${sz*u}px Barlow,"DIN Alternate",Arial,sans-serif`;x.fillStyle=col;x.textAlign=al;if('letterSpacing' in x)x.letterSpacing=ls*u+'px';x.fillText(t,px,py);};
  if(pipR){x.strokeStyle='rgba(255,255,255,.3)';x.lineWidth=1;x.strokeRect(pipR.x*s,pipR.y*s,pipR.w*s,pipR.h*s);const cx=(pipR.x+pipR.w/2)*s,ty=pipR.y*s+19*u,lb=pipR.t.toUpperCase();
    tx(lb,cx,ty,11,600,W,'center',2.4);const hw=x.measureText(lb).width/2;x.fillStyle='#f33';x.beginPath();x.arc(cx-hw-12*u,ty-4*u,3.5*u,0,7);x.fill();}
  tx((tel.name||'Rocket Flight 3D').toUpperCase(),28*u,40*u,15,600,W,'left',5.5);
  tx('SPEED',28*u,h-118*u,11,500,M,'left',2);tx(tel.v,28*u,h-70*u,46,600,W,'left',1);const vw=x.measureText(tel.v).width;tx('KM/H',28*u+vw+10*u,h-70*u,14,500,M,'left',2);tx('THRUST '+tel.f+' N',28*u,h-42*u,11,500,M,'left',2);
  tx('ALTITUDE',w-28*u,h-118*u,11,500,M,'right',2);tx(tel.au.toUpperCase(),w-28*u,h-70*u,14,500,M,'right',2);const uw=x.measureText(tel.au.toUpperCase()).width+10*u;tx(tel.a,w-28*u-uw,h-70*u,46,600,W,'right',1);tx('APOGEE '+tel.m+' '+tel.mu.toUpperCase(),w-28*u,h-42*u,11,500,M,'right',2);
  tx(tel.ph.toUpperCase(),w/2,h-128*u,12,500,M,'center',3.5);tx(tel.T,w/2,h-86*u,40,600,W,'center',3);
  x.fillStyle='rgba(255,255,255,.3)';x.fillRect(x0,yT-u,mw,2*u);x.fillStyle=W;x.fillRect(x0,yT-u,mw*tel.pr,2*u);x.fillRect(x0+mw*tel.pr-1.5*u,yT-8*u,3*u,16*u);
  evT.forEach(([n,t,d],i)=>{const px=x0+mw*(t-tel.t0)/tel.span;x.save();x.translate(px,yT);x.rotate(Math.PI/4);x.fillStyle=tel.tt>=t?W:'#000';x.strokeStyle=W;x.lineWidth=u;x.fillRect(-4*u,-4*u,8*u,8*u);x.strokeRect(-4*u,-4*u,8*u,8*u);x.restore();tx(n,px,i%2?yT+24*u:yT-14*u,10,500,M,'center',1.4);});}
function stopRec(){if(rec&&rec.mr.state!=='inactive')rec.mr.stop();}
function startRec(){if(rec)return stopRec();if(!pts.length)return msg('Load a flight or press Demo first');
  const c=renderer.domElement,cw=Math.min(c.width,1920)&~1,chh=Math.round(cw*c.height/c.width)&~1,cv=document.createElement('canvas');cv.width=cw;cv.height=chh;
  const mt=['video/mp4;codecs=avc1','video/webm;codecs=vp9','video/webm'].find(t=>window.MediaRecorder&&MediaRecorder.isTypeSupported(t));
  if(!mt)return msg('Video recording is not supported in this browser: use Chrome or Edge');
  const parts=[],mr=new MediaRecorder(cv.captureStream(30),{mimeType:mt,videoBitsPerSecond:12e6});
  mr.ondataavailable=e=>{if(e.data.size)parts.push(e.data);};
  mr.onstop=()=>{const a=document.createElement('a');a.href=URL.createObjectURL(new Blob(parts,{type:mt}));a.download='rocket-flight.'+(mt.includes('mp4')?'mp4':'webm');a.click();setTimeout(()=>URL.revokeObjectURL(a.href),6e4);rec=null;$('exp').textContent='Export video';msg('Video saved to your downloads');};
  rec={cv,cx:cv.getContext('2d'),mr};T=pts[0].t;playing=true;$('play').textContent='Pause';mr.start(250);$('exp').textContent='Stop recording';msg('Recording in real time at the selected speed. It stops after landing.');}
$('exp').onclick=startRec;

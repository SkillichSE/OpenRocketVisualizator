// zoomable timeline: wheel / buttons zoom, drag to seek, labels never overlap
let w0=0,w1=1,g0=0,g1=1,seeking=false;
const tlX=t=>(t-w0)/((w1-w0)||1);
function tlReset(){w0=g0=pts[0].t;w1=g1=tEnd;}
function tlZoom(f,tc){const a=pts[0].t,full=tEnd-a;if(tc===undefined)tc=T;const sp=Math.min(full,Math.max(Math.min(2,full),(g1-g0)*f)),fr=(tc-g0)/((g1-g0)||1);let n=tc-fr*sp;n=Math.min(tEnd-sp,Math.max(a,n));g0=n;g1=n+sp;}
function tlStep(){const a=pts[0].t,full=(tEnd-a)||1,sp=g1-g0;
  if(seeking){g0=a;g1=tEnd;}
  else if(Date.now()>manualUntil){
    if(!playing&&T<=a+.001){g0=a;g1=tEnd;}
    else{let p=a,n=tEnd;for(const t of evT.map(e=>e[1]).sort((x,y)=>x-y)){if(t<=T+1e-6)p=t;else{n=t;break;}}
      let s2=(n-p)*1.5;s2=Math.min(full,Math.max(s2,full*.08,Math.min(8,full)));let s0=(p+n)/2-s2/2;
      if(T<s0+.1*s2)s0=T-.1*s2;if(T>s0+.9*s2)s0=T-.9*s2;s0=Math.min(tEnd-s2,Math.max(a,s0));g0=s0;g1=s0+s2;}}
  const k=seeking?.5:.12;w0+=(g0-w0)*k;w1+=(g1-w1)*k;if(Math.abs(g0-w0)+Math.abs(g1-w1)<1e-4*full){w0=g0;w1=g1;}
  const W=$('track').clientWidth||1;let lu=-1e9,ld=-1e9;
  evT.forEach(([n,t,d,L])=>{const x=tlX(t),px=x*W;d.style.display=x<-.03||x>1.03?'none':'';d.style.left=100*x+'%';
    const fu=px-lu>=92,fd=px-ld>=92;let up;if(fu&&fd)up=lu<=ld;else if(fu)up=true;else if(fd)up=false;else up=null;
    L.vis=up!==null;if(up!==null){L.up=up;if(up)lu=px;else ld=px;}d.classList.toggle('up',L.up);d.classList.toggle('nol',!L.vis);});
  const c=v=>Math.min(100,Math.max(0,100*v));$('fill').style.width=c(tlX(T))+'%';$('head').style.left=c(tlX(T))+'%';
  const z=full/((w1-w0)||1);$('zv').textContent=z>1.05?'×'+z.toFixed(1):'';}
const tAt=x=>{const r=$('track').getBoundingClientRect();return w0+(w1-w0)*Math.min(1,Math.max(0,(x-r.left)/r.width));};
const trk=$('track');
trk.addEventListener('pointerdown',e=>{if(!pts.length||e.target.closest('.tick'))return;seeking=true;trk.setPointerCapture(e.pointerId);T=tAt(e.clientX);});
trk.addEventListener('pointermove',e=>{if(seeking)T=tAt(e.clientX);});
['pointerup','pointercancel'].forEach(n=>trk.addEventListener(n,()=>{seeking=false;}));
trk.addEventListener('wheel',e=>{if(!pts.length)return;e.preventDefault();manualUntil=Date.now()+4000;tlZoom(e.deltaY<0?.75:1.33,tAt(e.clientX));},{passive:false});

// play and pause
function togglePlay(){if(!pts.length)return;if(T>=tEnd)T=pts[0].t;playing=!playing;}
// keyboard shortcuts
addEventListener('keydown',e=>{if(/INPUT|SELECT|TEXTAREA/.test(e.target.tagName)&&e.target.type!=='range')return;
  if(e.code==='Space'){e.preventDefault();togglePlay();}
  else if(e.code==='KeyC')toggleCam();
  else if(e.code==='KeyT')$('tm').click();else if(e.code==='KeyD')$('dBtn').click();else if(e.code==='KeyM')$('gear').click();
  else if(e.code==='KeyF'){document.fullscreenElement?document.exitFullscreen():document.documentElement.requestFullscreen&&document.documentElement.requestFullscreen();}
  else if(pts.length&&(e.code==='ArrowLeft'||e.code==='ArrowRight')){e.preventDefault();T=Math.min(tEnd,Math.max(pts[0].t,T+(e.code==='ArrowLeft'?-5:5)));}});
// hide buttons when idle
let idleT=0;const wake=()=>{document.body.classList.remove('idle');clearTimeout(idleT);idleT=setTimeout(()=>{if(playing&&$('autohide').checked&&$('panel').classList.contains('min'))document.body.classList.add('idle');},3000);};
['mousemove','mousedown','touchstart','keydown'].forEach(n=>addEventListener(n,wake,{passive:true}));wake();
// mission name
$('mname').oninput=()=>{$('bn').textContent=$('mname').value.trim()||'Rocket Flight 3D';};
$('hT').onclick=togglePlay;
$('tm').onchange=()=>document.body.classList.toggle('notm',!$('tm').checked);$('tm').onchange();
$('dBtn').onclick=()=>$('ch').classList.toggle('on');
// menu toggle
$('min').onclick=$('gear').onclick=()=>$('panel').classList.toggle('min');
// load csv file
const loadFlight=async f=>{const t=await f.text(),b=pts;loadCSV(t);applyObj();if(pts!==b)keepCSV(f.name,t);};
$('fcsv').onchange=async e=>{const f=e.target.files[0];if(f)await loadFlight(f);e.target.value='';};
$('fobj').onchange=e=>loadModelFiles(e.target.files);
// model option changes
$('axis').onchange=$('len').onchange=$('inside').onchange=$('exact').onchange=applyObj;
// map option changes
$('prov').onchange=()=>{$('keyw').style.display=$('prov').value==='google'?'block':'none';};
// drag and drop files
addEventListener('dragover',e=>e.preventDefault());
addEventListener('drop',async e=>{e.preventDefault();const fl=[...e.dataTransfer.files],isM=f=>/\.(obj|mtl)$/i.test(f.name),md=fl.filter(isM);if(md.length)await loadModelFiles(md);for(const f of fl)if(!isM(f))await loadFlight(f);});
// demo flight kept for old saved sessions
function runDemo(){const P=[];let t=0,h=0,v=0,e=0,n=0,ap=false;csvLL=null;
  for(;t<150;t=Math.round((t+.1)*10)/10){P.push({t,e,n,h,zen:null,az:null,th:t<3?300:0,rr:120,spd:null});
    if(t<3)v+=5.5;else if(v>0&&!ap)v-=(9.81+4e-4*v*v)*.1;else{ap=true;v=-6;}
    h+=v*.1;e+=(ap?4:.8*Math.max(v,0)/100)*.1;n+=.03;if(h<0&&t>1){P.push({t:t+.1,e,n,h:0,zen:null,az:null,th:0,rr:0,spd:null});break;}}
  const apT=P.reduce((m,p)=>p.h>m.h?p:m).t;setPoints(P,{RECOVERY_DEVICE_DEPLOYMENT:apT+.5});keepDemo();}

// markers toggle
$('mk').onchange=()=>world.children.forEach(o=>{if(o.userData.mk)o.visible=$('mk').checked;});
// coordinate input
$('lat').onchange=$('lon').onchange=e=>{const m=e.target.value.match(/(-?\d+(?:\.\d+)?)\s*[,;\s]\s*(-?\d+(?:\.\d+)?)/);if(m&&e.target.id==='lat'){$('lat').value=m[1];$('lon').value=m[2];}syncSel();};
// camera toggle button
const camSync=()=>{$('camL').textContent=$('cam').value==='follow'?'Follow':'Free';};
function toggleCam(){$('cam').value=$('cam').value==='follow'?'free':'follow';camSync();}
$('camBtn').onclick=toggleCam;$('cam').onchange=camSync;

// start render loop after all modules load
resize();requestAnimationFrame(frame);

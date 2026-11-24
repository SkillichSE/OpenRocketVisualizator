/* ui.js: UI event handlers, demo flight, boot */
function togglePlay(){if(!pts.length)return;if(T>=tEnd)T=pts[0].t;playing=!playing;$('play').textContent=playing?'Pause':'Play';}
$('play').onclick=togglePlay;
addEventListener('keydown',e=>{if(e.code==='Space'&&!/INPUT|SELECT/.test(e.target.tagName)){e.preventDefault();togglePlay();}});
$('seek').oninput=e=>{if(pts.length)T=pts[0].t+(tEnd-pts[0].t)*e.target.value/1000;};
$('min').onclick=$('gear').onclick=()=>$('panel').classList.toggle('min');
$('fcsv').onchange=async e=>{const f=e.target.files[0];if(f){loadCSV(await f.text());applyObj();}};
$('fobj').onchange=async e=>{const f=e.target.files[0];if(f)loadOBJ(await f.text());};
$('axis').onchange=$('len').onchange=$('inside').onchange=applyObj;
$('prov').onchange=()=>{$('key').style.display=$('prov').value==='google'?'block':'none';buildMap();};
$('map').onclick=()=>buildMap();$('km').onchange=()=>buildMap();
addEventListener('dragover',e=>e.preventDefault());
addEventListener('drop',async e=>{e.preventDefault();for(const f of e.dataTransfer.files){const t=await f.text();if(/\.obj$/i.test(f.name))loadOBJ(t);else{loadCSV(t);applyObj();}}});
$('demo').onclick=()=>{const P=[];let t=0,h=0,v=0,e=0,n=0,ap=false;csvLL=null;
  for(;t<150;t=Math.round((t+.1)*10)/10){P.push({t,e,n,h,zen:null,az:null,th:t<3?300:0,rr:120,spd:null});
    if(t<3)v+=5.5;else if(v>0&&!ap)v-=(9.81+4e-4*v*v)*.1;else{ap=true;v=-6;}
    h+=v*.1;e+=(ap?4:.8*Math.max(v,0)/100)*.1;n+=.03;if(h<0&&t>1){P.push({t:t+.1,e,n,h:0,zen:null,az:null,th:0,rr:0,spd:null});break;}}
  const apT=P.reduce((m,p)=>p.h>m.h?p:m).t;setPoints(P,{RECOVERY_DEVICE_DEPLOYMENT:apT+.5});};

$('mk').onchange=()=>world.children.forEach(o=>{if(o.userData.mk)o.visible=$('mk').checked;});
$('lat').onchange=$('lon').onchange=e=>{const m=e.target.value.match(/(-?\d+(?:\.\d+)?)\s*[,;\s]\s*(-?\d+(?:\.\d+)?)/);if(m&&e.target.id==='lat'){$('lat').value=m[1];$('lon').value=m[2];}buildMap();};

// start the render loop once every module has loaded
resize();requestAnimationFrame(frame);

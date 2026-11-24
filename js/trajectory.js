/* trajectory.js: CSV parsing and trajectory setup (setPoints) */
// ---------- CSV ----------
function parseCSV(t){const L=t.split(/\r?\n/).map(s=>s.trim()).filter(Boolean),all=L.join('\n');
  const sep=(all.match(/;/g)||[]).length>(all.match(/,/g)||[]).length?';':',';let head=null;const rows=[],events={};
  for(const l of L){const m=l.match(/^#\s*Event\s+(\w+)\s+occurred at t=([-\d.eE+]+)/);if(m){events[m[1]]=+m[2];continue;}
    const cells=l.replace(/^#\s*/,'').split(sep);
    if(!head&&cells.length>=3&&/[a-zа-я]/i.test(l)&&/time|lat|alt|lon|врем|высот|широт/i.test(l)&&cells.filter(c=>isNaN(+c.trim())).length>=cells.length/2){head=cells.map(c=>c.replace(/"/g,'').trim().toLowerCase());continue;}
    if(l[0]==='#'||!head)continue;
    const r=cells.map(c=>parseFloat(sep===';'?c.replace(',','.'):c));if(r.length>=head.length-1&&r.some(isFinite))rows.push(r);}
  return {head,rows,events};}
function loadCSV(text){const {head,rows,events}=parseCSV(text);
  if(!head||!rows.length)return msg('Could not parse CSV: a header row and numeric rows are required');
  const col=re=>head.findIndex(h=>re.test(h));
  const ci={t:col(/^(time|t\b|врем)/),lat:col(/^(latitude|lat\b|широт)/),lon:col(/^(longitude|lon\b|lng\b|долгот)/),alt:col(/^(altitude(?! above)|alt\b|высот|height)/),
    e:col(/^position east/),n:col(/^position north/),ld:col(/^lateral distance/),ldir:col(/^lateral direction/),zen:col(/zenith|vertical orientation/),az:col(/azimuth|lateral orientation/),
    sp:col(/^(total velocity|speed|скорост)/),th:col(/^(thrust \(n\)|thrust\b|тяга)/),roll:col(/^roll rate/),ref:col(/^reference length/)};
  const hasLL=ci.lat>=0&&ci.lon>=0,okv=x=>isFinite(x);csvLL=null;
  if(hasLL){const r=rows.find(r=>okv(r[ci.lat])&&okv(r[ci.lon])&&(r[ci.lat]||r[ci.lon]));if(r)csvLL=[r[ci.lat],r[ci.lon]];}
  refDiam=ci.ref>=0&&okv(rows[0][ci.ref])?rows[0][ci.ref]:null;
  const gpsOnly=!(ci.e>=0&&ci.n>=0)&&hasLL;let g0=null;const P=[];
  rows.forEach((r,i)=>{const t=ci.t>=0?r[ci.t]:i*.1,h=ci.alt>=0?r[ci.alt]:0;let e=0,n=0;
    if(ci.e>=0&&ci.n>=0){e=r[ci.e];n=r[ci.n];}
    else if(hasLL){if(!okv(r[ci.lat])||!okv(r[ci.lon])||(!r[ci.lat]&&!r[ci.lon]))return;if(!g0)g0=[r[ci.lat],r[ci.lon]];
      e=(r[ci.lon]-g0[1])*111320*Math.cos(g0[0]*Math.PI/180);n=(r[ci.lat]-g0[0])*mlat;}
    else if(ci.ld>=0){const d=r[ci.ld],a=(ci.ldir>=0?r[ci.ldir]:0)*Math.PI/180;e=d*Math.sin(a);n=d*Math.cos(a);}
    if(![t,e,n,h].every(okv))return;
    const g=k=>k>=0&&okv(r[k])?r[k]:null;P.push({t,e,n,h,zen:g(ci.zen),az:g(ci.az),th:g(ci.th)||0,rr:g(ci.roll)||0,spd:g(ci.sp)});});
  if(gpsOnly&&g0)csvLL=g0;
  setPoints(P,events);}
function setOrigin(){const a=parseFloat($('lat').value),b=parseFloat($('lon').value);
  if(isFinite(a)&&isFinite(b)){lat0=a;lon0=b;}else if(csvLL){lat0=csvLL[0];lon0=csvLL[1];}else{lat0=lon0=null;}
  if(lat0!==null)mlon=111320*Math.cos(lat0*Math.PI/180);}

function setPoints(P,evIn){
  P=P.filter(p=>isFinite(p.t)).sort((a,b)=>a.t-b.t);if(P.length<2)return msg('At least 2 trajectory points are required');
  {const h0=P[0].h;P.forEach(p=>p.h-=h0);}
  P.forEach(p=>p.v=new THREE.Vector3(p.e,p.h,-p.n));
  let roll=0,prev=UP.clone(),best=0;
  P.forEach((p,i)=>{const a=P[Math.max(0,i-1)],b=P[Math.min(P.length-1,i+1)],dt=(b.t-a.t)||1;
    p.vel=b.v.clone().sub(a.v).divideScalar(dt);p.sp=p.spd!==null?p.spd:p.vel.length();if(i)roll+=p.rr*(p.t-a.t)*Math.PI/180;p.roll=roll;if(p.sp>P[best].sp)best=i;});
  // zenith: elevation from horizon (OpenRocket) or angle from vertical, detected at the fastest point
  let elev=true;const q=P[best];if(q.zen!==null&&q.vel.length()>1){const tv=Math.acos(Math.min(1,Math.max(-1,q.vel.y/q.vel.length())))*180/Math.PI;elev=Math.abs((90-q.zen)-tv)<Math.abs(q.zen-tv);}
  P.forEach(p=>{if(p.zen!==null&&p.az!==null){const z=(elev?90-p.zen:p.zen)*Math.PI/180,az=p.az*Math.PI/180;p.d=new THREE.Vector3(Math.sin(z)*Math.sin(az),Math.cos(z),-Math.sin(z)*Math.cos(az));}
    else if(p.sp>1&&p.vel.length()>.5)p.d=p.vel.clone().normalize();else p.d=prev.clone();prev=p.d;});
  pts=P;T=P[0].t;tEnd=P[P.length-1].t;maxAlt=P.reduce((m,p)=>Math.max(m,p.h),-1e9);maxThr=P.reduce((m,p)=>Math.max(m,p.th),0);
  ev=Object.assign({},evIn);const ap=P.find(p=>p.h===maxAlt);
  if(ev.APOGEE===undefined)ev.APOGEE=ap.t;if(ev.GROUND_HIT===undefined)ev.GROUND_HIT=tEnd;
  if(ev.BURNOUT===undefined&&maxThr>1)ev.BURNOUT=P.filter(p=>p.th>1).pop().t;
  if(ev.RECOVERY_DEVICE_DEPLOYMENT===undefined&&ev.EJECTION_CHARGE!==undefined)ev.RECOVERY_DEVICE_DEPLOYMENT=ev.EJECTION_CHARGE;
  const box=new THREE.Box3();P.forEach(p=>box.expandByPoint(p.v));const size=box.getSize(new THREE.Vector3()),c=box.getCenter(new THREE.Vector3());
  ext=Math.max(size.x,size.y,size.z,50);autoScale();
  while(world.children.length){const o=world.children.pop();if(!o.isSprite&&o.geometry)o.geometry.dispose();o.material.dispose();}
  const g1=new THREE.BufferGeometry();g1.setAttribute('position',new THREE.Float32BufferAttribute(P.flatMap(p=>[p.v.x,p.v.y,p.v.z]),3));
  world.add(new THREE.Line(g1,new THREE.LineBasicMaterial({color:0x6b7bb0})),new THREE.Line(g1.clone(),new THREE.LineBasicMaterial({color:0xff8a3d})));
  const gd=new THREE.BufferGeometry();gd.setAttribute('position',new THREE.Float32BufferAttribute(new Float32Array(6),3));
  drop=new THREE.Line(gd,new THREE.LineBasicMaterial({color:0xffffff,transparent:true,opacity:.5}));world.add(drop);
  const rad=ext*.003;[[P[0],0x34d17a],[ap,0xffd23f],[P[P.length-1],0xff4d5e]].forEach(([p,col])=>{const m=new THREE.Mesh(new THREE.SphereGeometry(rad,12,12),new THREE.MeshBasicMaterial({color:col}));m.position.copy(p.v);m.visible=$('mk').checked;m.userData.mk=1;world.add(m);});
  // smoke: exhaust trail + parachute ejection puff
  smoke=[];let lt=-9;const sc0=+$('sc').value||1;
  P.forEach(p=>{if(p.th>1&&p.t-lt>=.05){lt=p.t;smoke.push({t:p.t,v:p.v.clone().addScaledVector(p.d,-modelLen*sc0*.5),big:p.h<40?3:1});}});
  if(ev.RECOVERY_DEVICE_DEPLOYMENT!==undefined){const d=P.reduce((m,p)=>Math.abs(p.t-ev.RECOVERY_DEVICE_DEPLOYMENT)<Math.abs(m.t-ev.RECOVERY_DEVICE_DEPLOYMENT)?p:m);smoke.push({t:d.t,v:d.v.clone(),big:2.5});}
  if(smoke.length>500)smoke=smoke.filter((_,i)=>i%Math.ceil(smoke.length/500)===0);
  smoke.forEach(s=>{s.sp=new THREE.Sprite(new THREE.SpriteMaterial({map:smokeTex,color:0xe2e2e2,transparent:true,depthWrite:false,opacity:0}));s.sp.visible=false;world.add(s.sp);});
  camera.near=Math.max(.1,ext/5000);camera.updateProjectionMatrix();controls.target.copy(c);camera.position.set(c.x+ext*.9,c.y+ext*.5,c.z+ext*.9);
  const tk=$('ticks'),T0=P[0].t,span=(tEnd-T0)||1;tk.innerHTML='';evT=[];
  [['LIFTOFF',T0],['MECO',ev.BURNOUT],['APOGEE',ev.APOGEE],['PARACHUTE',ev.RECOVERY_DEVICE_DEPLOYMENT],['LANDING',ev.GROUND_HIT]].filter(x=>x[1]!==undefined).forEach(([n,t],i)=>{const d=document.createElement('button');d.className='tick'+(i%2?'':' up');d.style.left=100*(t-T0)/span+'%';d.innerHTML='<i></i><span>'+n+'</span>';d.title=n+' T+'+(t-T0).toFixed(1)+' s';d.onclick=()=>{T=t;};evT.push([n,t]);tk.appendChild(d);});
  setOrigin();let note='';if(csvLL&&!isFinite(parseFloat($('lat').value))&&Math.abs(csvLL[0]-28.61)<.01&&Math.abs(csvLL[1]+80.6)<.02)note=' CSV start is the default OpenRocket site (Cape Canaveral): enter your own coordinates and press Update map.';
  msg(`${P.length} points, apogee ${maxAlt.toFixed(0)} m, ${(tEnd-P[0].t).toFixed(0)} s.${note}`);buildMap(note);}

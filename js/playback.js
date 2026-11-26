// flight phase name
const phase=()=>{if(!playing&&T<=pts[0].t+.001)return 'STANDBY';const dep=ev.RECOVERY_DEVICE_DEPLOYMENT;if(T>=ev.GROUND_HIT-.01)return 'LANDING';if(dep!==undefined&&T>=dep)return 'PARACHUTE DESCENT';
  if(T>=ev.APOGEE)return 'DESCENT';if(ev.BURNOUT!==undefined&&T>=ev.BURNOUT)return 'COASTING';return maxThr>1?'ENGINE BURN':'ASCENT';};
// update scene for current time
function update(){let i=0;while(i<pts.length-2&&pts[i+1].t<=T)i++;
  const a=pts[i],b=pts[Math.min(i+1,pts.length-1)],k=b.t>a.t?Math.min(1,Math.max(0,(T-a.t)/(b.t-a.t))):0,sc=+$('sc').value||1;
  const pos=a.v.clone().lerp(b.v,k),dir=a.d.clone().lerp(b.d,k).normalize(),roll=a.roll+(b.roll-a.roll)*k,th=a.th+(b.th-a.th)*k,dep=ev.RECOVERY_DEVICE_DEPLOYMENT;
// parachute swing
  if(dep!==undefined&&T>dep){const s=T-dep,e=Math.min(1,s/1.2),am=(2+9*Math.exp(-s/18))*e*Math.PI/180,w=2*Math.PI/3.2,
    ax=new THREE.Vector3().crossVectors(dir,Math.abs(dir.y)>.99?new THREE.Vector3(1,0,0):UP).normalize(),ay=new THREE.Vector3().crossVectors(dir,ax).normalize();
    dir.applyAxisAngle(ax,am*Math.sin(w*s)).applyAxisAngle(ay,am*.6*Math.sin(w*s*.93+1.3)).normalize();}
  rocket.position.copy(pos);rocket.quaternion.setFromUnitVectors(UP,dir).multiply(new THREE.Quaternion().setFromAxisAngle(UP,roll));rocket.scale.setScalar(sc);
// flame size
  const fl=maxThr>0?th/maxThr:0;flame.visible=th>1;if(flame.visible){const h=modelLen*1.3*fl*(.85+.3*Math.random());
    fOut.scale.set(bodyR*.95,h,bodyR*.95);fIn.scale.set(bodyR*.5,h*.6,bodyR*.5);}
// smoke sprites
  const sm=Math.max(modelLen*sc*.35,2);smoke.forEach(s=>{const age=T-s.t,vis=age>=0&&age<14;s.sp.visible=vis;if(vis){s.sp.position.copy(s.v);const z=sm*s.big*(1+age*.7);s.sp.scale.set(z,z,1);s.sp.material.opacity=.5*(1-age/14)*(s.big===2.5?1.2:1);}});
// parachute
  chute.visible=dep!==undefined&&T>=dep;if(chute.visible){chute.position.copy(pos).addScaledVector(dir,modelLen*sc);chute.scale.setScalar(modelLen*sc*Math.min(1,.2+.8*(T-dep)/1.5));}
// trail and ground line
  world.children[1].geometry.setDrawRange(0,i+2);
  const dp=drop.geometry.attributes.position;dp.setXYZ(0,pos.x,pos.y,pos.z);dp.setXYZ(1,pos.x,0,pos.z);dp.needsUpdate=true;
// follow camera
  if($('cam').value==='follow'){const dl=pos.clone().sub(controls.target);controls.target.add(dl);camera.position.add(dl);}
// onboard camera pose
  const mode=$('cview').value,L=modelLen,ref=Math.abs(dir.y)>.99?new THREE.Vector3(0,0,1):UP.clone(),r0=new THREE.Vector3().crossVectors(dir,ref).normalize(),u0=new THREE.Vector3().crossVectors(r0,dir).normalize(),rr=$('stab').checked?0:roll,right=r0.clone().applyAxisAngle(dir,rr),upv=u0.clone().applyAxisAngle(dir,rr);
  let at,look,up;if(mode==='fwd'||mode==='back'){at=pos.clone().addScaledVector(right,bodyR*1.7).addScaledVector(dir,L*.8);look=mode==='fwd'?dir.clone():dir.clone().negate();up=upv;}
  else if(mode==='side'){at=pos.clone().addScaledVector(right,bodyR+.01).addScaledVector(dir,L*.7);look=right.clone();up=dir.clone();}
  else{at=pos.clone().addScaledVector(dir,L*.5);look=DOWN.clone();const h=dir.clone().setY(0);up=h.length()>.1?h.normalize():upv.clone().setY(0).normalize();if(up.lengthSq()<.5)up.set(0,0,-1);}
  camB.position.copy(at);camB.up.copy(up);camB.lookAt(at.clone().add(look));camB.rotateX((+$('ctilt').value||0)*Math.PI/180);
// telemetry text
  const ph=phase(),idle=!playing&&T<=pts[0].t+.001;$('hP').textContent=!playing&&!idle&&T<tEnd?ph+' · PAUSED':ph;const s=Math.max(0,T-pts[0].t)|0,p2=n=>String(n).padStart(2,'0'),pr=(T-pts[0].t)/((tEnd-pts[0].t)||1),nf=x=>Math.round(x).toLocaleString('en-US');
  const ts='T+ '+p2(s/3600|0)+':'+p2(s/60%60|0)+':'+p2(s%60);$('hT').textContent=idle?'Launch':ts;$('hT').classList.toggle('go',idle);const au=x=>x>=1e4?[(x/1e3).toFixed(1),'km']:[nf(x),'m'],A=au(pos.y),AM=au(maxAlt);$('hA').textContent=A[0];$('uA').textContent=A[1];evT.forEach(([n,t,d])=>d.classList.toggle('done',T>=t));$('hV').textContent=nf((a.sp+(b.sp-a.sp)*k)*3.6);$('hF').textContent=nf(th);$('hM').textContent=AM[0];$('uM').textContent=AM[1];
  tlStep();const tt=updTel(a,b,k,pos,dir);tel={L:tt.L,R:tt.R,w0,w1,ph,T:ts,v:$('hV').textContent,a:A[0],au:A[1],f:$('hF').textContent,m:AM[0],mu:AM[1],tt:T,name:$('bn').textContent,pr,t0:pts[0].t,span:(tEnd-pts[0].t)||1}}
// render main view and small window (onboard corner, or external when onboard is full screen)
function drawView(cam,x,y,w,h,onboard){cam.aspect=w/h;if(onboard)cam.fov=+$('cfov').value||75;cam.updateProjectionMatrix();
  renderer.setScissorTest(true);renderer.setViewport(x,y,w,h);renderer.setScissor(x,y,w,h);sky.position.copy(cam.position);
  if(onboard){const chv=chute.visible,sc=+$('sc').value||1;rocket.scale.setScalar(1);rocket.visible=$('cview').value!=='down';chute.visible=false;
    renderer.render(scene,cam);rocket.visible=true;rocket.scale.setScalar(sc);chute.visible=chv;}
  else renderer.render(scene,cam);renderer.setScissorTest(false);}
function renderAll(){const m=$('bmode').value,has=pts.length>0,full=m==='full'&&has,pip=(m==='pip'||full)&&has,W=innerWidth,H=innerHeight,pe=$('pip'),tab=$('pipTab');
  renderer.setScissorTest(false);renderer.setViewport(0,0,W,H);controls.enabled=!full;
  pipSlide+=((pipHidden?1:0)-pipSlide)*.2;if(Math.abs((pipHidden?1:0)-pipSlide)<.002)pipSlide=pipHidden?1:0;
  if(full)drawView(camB,0,0,W,H,true);else{camera.aspect=W/H;camera.updateProjectionMatrix();sky.position.copy(camera.position);renderer.render(scene,camera);}
  if(pip){const w=Math.min(W*(+$('psz').value||34)/100,900),h=w*9/16,x0=W-w-10,x=x0+pipSlide*(w+10),y=H-h-64,top=64;
    const lab=full?'External cam':'Onboard cam - '+$('cview').selectedOptions[0].text;pe.firstElementChild.textContent=lab;
    if(pipSlide<1){drawView(full?camera:camB,x,y,w,h,!full);}
    Object.assign(pe.style,{display:pipSlide<1?'block':'none',left:x+'px',top:top+'px',width:w+'px',height:h+'px'});
    Object.assign(tab.style,{display:'block',left:(x-22)+'px',top:(top+h/2-22)+'px'});tab.textContent=pipHidden?'⟨':'⟩';
    pipR=pipSlide<.5?{x,y:top,w,h,t:lab}:null;pipRect={x:x0,y:top,w,h};
    if(full){camera.aspect=W/H;camera.updateProjectionMatrix();}}
  else{pe.style.display='none';tab.style.display='none';pipR=null;pipRect=null;}
  $('tr').style.right=(pipR?pipR.w*(1-pipSlide)+38:28)+'px';}
let pipRect=null;
// main loop
let last=performance.now();
function frame(now){const dt=Math.min(.1,(now-last)/1000);last=now;
  if(pts.length){if(playing){T+=dt*(+$('spd').value);if(T>=tEnd){T=tEnd;playing=false;}}update();sndTick();}
  controls.update();renderAll();if(rec&&tel)compose();if(rec&&T>=tEnd&&!rec.end)rec.end=now+1500;if(rec&&rec.end&&now>rec.end)stopRec();requestAnimationFrame(frame);}
// resize
function resize(){renderer.setSize(innerWidth,innerHeight);camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();}
addEventListener('resize',resize);

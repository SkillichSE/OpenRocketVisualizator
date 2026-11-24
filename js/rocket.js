// engine flame
const flame=new THREE.Group();rocket.add(flame);
const mkCone=(col,op)=>{const g=new THREE.ConeGeometry(1,1,16,1,true).rotateX(Math.PI).translate(0,-.5,0);
  return new THREE.Mesh(g,new THREE.MeshBasicMaterial({color:col,transparent:true,opacity:op,blending:THREE.AdditiveBlending,depthWrite:false,side:THREE.DoubleSide,fog:false}));};
const fOut=mkCone(0xff6a14,.8),fIn=mkCone(0xfff0b0,.95);flame.add(fOut,fIn);
// parachute
const chute=new THREE.Group();(()=>{const R=.55,H=1.3;
  const cm=new THREE.Mesh(new THREE.SphereGeometry(R,24,10,0,2*Math.PI,0,Math.PI/2),new THREE.MeshStandardMaterial({color:0xff7a2f,side:THREE.DoubleSide}));cm.position.y=H;chute.add(cm);
  const pos=[];for(let i=0;i<10;i++){const a=i/10*2*Math.PI;pos.push(R*Math.cos(a),H,R*Math.sin(a),0,0,0);}
  const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));chute.add(new THREE.LineSegments(g,new THREE.LineBasicMaterial({color:0xeeeeee})));})();
chute.visible=false;scene.add(chute);
// smoke texture
const smokeTex=(()=>{const c=document.createElement('canvas');c.width=c.height=64;const x=c.getContext('2d'),g=x.createRadialGradient(32,32,2,32,32,32);
  g.addColorStop(0,'rgba(255,255,255,.9)');g.addColorStop(1,'rgba(255,255,255,0)');x.fillStyle=g;x.fillRect(0,0,64,64);return new THREE.CanvasTexture(c);})();

// model helpers
function clearHolder(){while(holder.children.length)holder.remove(holder.children[0]);}
function setFlame(){flame.position.y=-modelLen/2;}
// default rocket body
function useDefault(){clearHolder();const g=new THREE.Group(),w=new THREE.MeshStandardMaterial({color:0xe8e8ee,roughness:.5}),r=new THREE.MeshStandardMaterial({color:0xd32f3f,roughness:.5});
  const b=new THREE.Mesh(new THREE.CylinderGeometry(.03,.03,.9,24),w);b.position.y=-.135;const n=new THREE.Mesh(new THREE.ConeGeometry(.03,.27,24),r);n.position.y=.45;g.add(b,n);
  for(let i=0;i<3;i++){const a=i*2*Math.PI/3,f=new THREE.Mesh(new THREE.BoxGeometry(.004,.14,.07),r);f.position.set(Math.cos(a)*.05,-.52,Math.sin(a)*.05);f.rotation.y=Math.PI/2-a;g.add(f);}
  holder.add(g);holder.quaternion.identity();holder.scale.setScalar(1);modelLen=1.17;bodyR=.03;setFlame();}
useDefault();

// obj and mtl parsing
let mtlInfo=null;
function parseOBJ(t){const v=[],vn=[],G={};let cur='default',mat='';const ix=(s,n)=>{const i=parseInt(s);return i<0?n/3+i:i-1;};
  for(const l of t.split(/\r?\n/)){
    if(l[0]==='v'&&l[1]===' '){const p=l.trim().split(/\s+/);v.push(+p[1],+p[2],+p[3]);}
    else if(l[0]==='v'&&l[1]==='n'){const p=l.trim().split(/\s+/);vn.push(+p[1],+p[2],+p[3]);}
    else if(l[0]==='g'||l[0]==='o'){cur=l.slice(2).trim()||'default';}
    else if(l.startsWith('usemtl')){mat=l.slice(6).trim();}
    else if(l[0]==='f'&&l[1]===' '){const key=cur+(mat?'|'+mat:''),a=G[key]||(G[key]=Object.assign([],{mat,nrm:[]})),
      idx=l.trim().split(/\s+/).slice(1).map(s=>{const q=s.split('/');return [ix(q[0],v.length),q[2]?ix(q[2],vn.length):-1];});
      for(let k=1;k<idx.length-1;k++)for(const j of [idx[0],idx[k],idx[k+1]]){a.push(v[j[0]*3],v[j[0]*3+1],v[j[0]*3+2]);
        if(a.nrm&&j[1]>=0&&vn.length)a.nrm.push(vn[j[1]*3],vn[j[1]*3+1],vn[j[1]*3+2]);else a.nrm=null;}}
  }return G;}
// read material colors
function parseMTL(t){const M={};let c=null;for(const l of t.split(/\r?\n/)){const p=l.trim().split(/\s+/),k=p[0];
  if(k==='newmtl')c=M[l.trim().slice(7).trim()]={};else if(c){if(k==='Kd')c.kd=[+p[1],+p[2],+p[3]];else if(k==='d')c.d=+p[1];else if(k==='Tr')c.d=1-p[1];}}return M;}
// load picked model files
async function loadModelFiles(fl){const isM=f=>/\.mtl$/i.test(f.name);fl=[...fl].sort((a,b)=>isM(b)-isM(a));
  if(!fl.some(isM)&&fl.length){mtlInfo=null;dropModel('mtl');}
  for(const f of fl){const t=await f.text();keepModel(isM(f)?'mtl':'obj',f.name,t);if(isM(f)){mtlInfo=parseMTL(t);if(objInfo)applyObj();}else loadOBJ(t);}}
// read obj and get its bounds
function loadOBJ(t){const G=parseOBJ(t),mn=[1e9,1e9,1e9],mx=[-1e9,-1e9,-1e9];let n=0;
  for(const a of Object.values(G))for(let i=0;i<a.length;i+=3){n++;for(let k=0;k<3;k++){mn[k]=Math.min(mn[k],a[i+k]);mx[k]=Math.max(mx[k],a[i+k]);}}
  if(!n)return msg('OBJ file is empty or has no faces');objInfo={G,mn,mx,cen:mn.map((m,k)=>(m+mx[k])/2)};applyObj();}
// names of internal parts
const INTERNAL=/inner tube|parachute|mass|motor|engine|j\d{3}/i;
// orient scale and build meshes
function applyObj(){if(!objInfo)return;clearHolder();const {G,mn,mx,cen}=objInfo,sel=$('axis').value;let ax,sg;
  if(sel==='auto'){const d=mx.map((m,k)=>m-mn[k]);ax=d.indexOf(Math.max(...d));const o=[0,1,2].filter(k=>k!==ax),L=d[ax],ext2=[0,0];
    for(const [nm,a] of Object.entries(G)){if(INTERNAL.test(nm))continue;for(let i=0;i<a.length;i+=3){const c=a[i+ax];const r=Math.max(Math.abs(a[i+o[0]]-cen[o[0]]),Math.abs(a[i+o[1]]-cen[o[1]]));
      if(c>mx[ax]-.04*L)ext2[1]=Math.max(ext2[1],r);if(c<mn[ax]+.04*L)ext2[0]=Math.max(ext2[0],r);}}
    sg=ext2[1]<=ext2[0]?1:-1;}else{ax='XYZ'.indexOf(sel[1]);sg=sel[0]==='-'?-1:1;}
  const dir=new THREE.Vector3();dir.setComponent(ax,sg);holder.quaternion.setFromUnitVectors(dir,UP);
  const o=[0,1,2].filter(k=>k!==ax),dimAx=mx[ax]-mn[ax];let rawR=0;
  const bn=Object.keys(G).find(k=>/body/i.test(k));
  for(const [nm,a] of Object.entries(G)){if(bn&&nm!==bn)continue;if(!bn&&/fin/i.test(nm))continue;for(let i=0;i<a.length;i+=3)rawR=Math.max(rawR,Math.hypot(a[i+o[0]]-cen[o[0]],a[i+o[1]]-cen[o[1]]));}
  const lenCm=parseFloat($('len').value);let f=1,how='OBJ units = meters';
  if(lenCm>0){f=lenCm/100/dimAx;how='from set length';}else if(refDiam&&rawR>0){f=refDiam/200/rawR;how='from CSV diameter';}
  const ex=$('exact').checked,ins=$('inside').checked&&!ex;
  for(const [nm,a] of Object.entries(G)){const inn=!ex&&INTERNAL.test(nm);if(inn&&!ins)continue;
    const p=new Float32Array(a.length);for(let i=0;i<a.length;i++)p[i]=a[i]-cen[i%3];
    const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.BufferAttribute(p,3));if(a.nrm&&a.nrm.length===a.length)g.setAttribute('normal',new THREE.BufferAttribute(new Float32Array(a.nrm),3));else g.computeVertexNormals();
    const md=mtlInfo&&a.mat&&mtlInfo[a.mat],col=md&&md.kd?new THREE.Color().setRGB(md.kd[0],md.kd[1],md.kd[2]).convertSRGBToLinear():/nose/i.test(nm)?0xd32f3f:/fin/i.test(nm)?0xa51d2a:/parachute/i.test(nm)?0xff9f43:inn?0x777c8a:0xeceff4;
    holder.add(new THREE.Mesh(g,new THREE.MeshStandardMaterial({color:col,roughness:.5,metalness:.1,side:THREE.DoubleSide,transparent:(ins&&!inn)||(md&&md.d<1),opacity:md&&md.d<1?md.d:ins&&!inn?.28:1,depthWrite:!((ins&&!inn)||(md&&md.d<1))})));}
  holder.scale.setScalar(f);modelLen=dimAx*f;bodyR=rawR>0?rawR*f:modelLen*.026;setFlame();autoScale();
  msg(`Model: length ${(modelLen*100).toFixed(0)} cm (${how}), nose ${sg>0?'+':'-'}${'XYZ'[ax]}${mtlInfo?', MTL colors':'. Tip: load the .mtl together with the .obj for exact colors'}`);}
// pick model scale from flight size
function autoScale(){if(keepSc)return;$('sc').value=Math.round(Math.min(500,Math.max(1,ext*.03/modelLen)));}

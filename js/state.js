/* state.js: shared state, renderer, scene, camera, lights, sky and ground */
const UP=new THREE.Vector3(0,1,0),DOWN=new THREE.Vector3(0,-1,0),$=id=>document.getElementById(id),msg=t=>{const m=$('msg');m.textContent=t;m.style.color='';};
let evT=[],tel=null,rec=null,pipR=null;const mlat=110540;let mlon=111320,lat0=null,lon0=null,csvLL=null;
let pts=[],ev={},T=0,tEnd=0,maxAlt=0,maxThr=0,ext=500,playing=false,objInfo=null,refDiam=null,modelLen=1.17,bodyR=.03,drop,smoke=[];

const renderer=new THREE.WebGLRenderer({antialias:true,logarithmicDepthBuffer:true});
renderer.setPixelRatio(devicePixelRatio);renderer.outputEncoding=THREE.sRGBEncoding;$('view').appendChild(renderer.domElement);
const scene=new THREE.Scene();scene.background=new THREE.Color(0xa9c4e8);scene.fog=new THREE.FogExp2(0xa9c4e8,0.00003);
const camera=new THREE.PerspectiveCamera(50,1,.5,2e6),camB=new THREE.PerspectiveCamera(75,16/9,.01,2e6);camera.position.set(300,200,300);
const controls=new THREE.OrbitControls(camera,renderer.domElement);controls.enableDamping=true;
scene.add(new THREE.HemisphereLight(0xffffff,0x556677,.95));const sun=new THREE.DirectionalLight(0xffffff,.9);sun.position.set(1,2,1);scene.add(sun);
const sky=(()=>{const c=document.createElement('canvas');c.width=2;c.height=256;const x=c.getContext('2d'),g=x.createLinearGradient(0,0,0,256);
  g.addColorStop(0,'#1d4f9c');g.addColorStop(.5,'#6ea0dc');g.addColorStop(.52,'#a9c4e8');g.addColorStop(1,'#a9c4e8');x.fillStyle=g;x.fillRect(0,0,2,256);
  const t=new THREE.CanvasTexture(c);t.encoding=THREE.sRGBEncoding;
  const m=new THREE.Mesh(new THREE.SphereGeometry(9e5,24,16),new THREE.MeshBasicMaterial({map:t,side:THREE.BackSide,fog:false,depthWrite:false}));m.renderOrder=-100;scene.add(m);return m;})();
const disc=new THREE.Mesh(new THREE.CircleGeometry(3e5,48).rotateX(-Math.PI/2),new THREE.MeshBasicMaterial({color:0x6a7a58}));disc.position.y=-3;disc.renderOrder=-200;scene.add(disc);
const rocket=new THREE.Group(),holder=new THREE.Group(),world=new THREE.Group(),mapGroup=new THREE.Group();rocket.add(holder);scene.add(rocket,world,mapGroup);

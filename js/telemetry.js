// telemetry: csv channels, derived values, side stacks, data list
let heads=[],mets=[],tlist=[],trist=[],chE=[];
const ISA=h=>{h=Math.max(0,h);const T=h<11000?288.15-.0065*h:216.65,p=h<11000?101325*Math.pow(T/288.15,5.2559):22632*Math.exp(-(h-11000)/6341.6);return{T,p,rho:p/(287.05*T),a:Math.sqrt(401.87*T)};};
const lerp=(x,y,k)=>x+(y-x)*k,clamp01=v=>Math.min(1,Math.max(0,v));
// metric definitions: re = csv column, fb = computed fallback
const MD=[
{id:'vv',l:'Vertical speed',u:'m/s',re:/^vertical velocity/,fb:s=>s.vel.y},
{id:'ac',l:'G-force',u:'g',re:/^total acceleration/,g:1,fb:s=>s.ac},
{id:'mach',l:'Mach',u:'',re:/^mach/,d:2,fb:s=>s.sp/ISA(s.h).a},
{id:'rng',l:'Downrange',u:'m',re:/^lateral distance/,km:1,fb:s=>Math.hypot(s.e,s.n)},
{id:'pit',l:'Pitch',u:'°',fb:s=>Math.asin(Math.max(-1,Math.min(1,s.d.y)))*180/Math.PI},
{id:'hdg',l:'Heading',u:'°',fb:s=>(Math.atan2(s.d.x,-s.d.z)*180/Math.PI+360)%360},
{id:'q',l:'Dynamic pressure',u:'kPa',re:/^dynamic pressure/,fb:s=>.5*ISA(s.h).rho*s.sp*s.sp/1000},
{id:'tmp',l:'Air temp',u:'°C',re:/^air temperature/,fb:s=>ISA(s.h).T-273.15},
{id:'prs',l:'Air pressure',u:'hPa',re:/^air pressure/,fb:s=>ISA(s.h).p/100},
{id:'rol',l:'Roll rate',u:'°/s',re:/^roll rate/,fb:s=>s.rr},
{id:'drg',l:'Drag',u:'N',re:/^drag force/},
{id:'mas',l:'Mass',u:'g',re:/^mass/},
{id:'stb',l:'Stability',u:'cal',re:/^stability margin/},
{id:'aoa',l:'Angle of attack',u:'°',re:/^angle of attack/},
{id:'cd',l:'Drag coeff',u:'',re:/^drag coefficient/,d:2},
{id:'wnd',l:'Wind speed',u:'m/s',re:/^wind velocity/},
{id:'sat',l:'Satellites',u:'',re:/^(sat|number of sat)/,d:0}];
const fm=(v,d)=>{if(v===null||!isFinite(v))return '—';const a=Math.abs(v);return d!==undefined?v.toFixed(d):a>=1e3?Math.round(v).toLocaleString('en-US'):a>=100?v.toFixed(0):a>=10?v.toFixed(1):v.toFixed(2);};
// value of one metric between points a and b
function mval(m,a,b,k,s){if(m.ci>=0&&a.c&&b.c){const x=a.c[m.ci],y=b.c[m.ci];if(isFinite(x)&&isFinite(y)){let v=lerp(x,y,k);if(m.g&&/m\/s/.test(m.u0))v/=9.80665;return v;}}return m.fb?m.fb(s):null;}
const smp=(a,b,k,pos,dir)=>({h:pos.y,e:pos.x,n:-pos.z,sp:lerp(a.sp,b.sp,k),vel:{y:lerp(a.vel.y,b.vel.y,k)},ac:lerp(a.ac,b.ac,k),d:dir,rr:lerp(a.rr,b.rr,k)});
// build side stacks and the all channels list
function buildTel(){
  mets=MD.map(d=>{const ci=d.re?heads.findIndex(h=>d.re.test(h)):-1,u0=ci>=0?((heads[ci].match(/\(([^)]*)\)/)||[])[1]||d.u):d.u;return Object.assign({},d,{ci,u0,un:d.g&&/m\/s/.test(u0)?'g':u0});}).filter(m=>m.ci>=0||m.fb);
  mets.forEach(m=>{let lo=1e30,hi=-1e30;pts.forEach(p=>{const v=mval(m,p,p,0,{h:p.h,e:p.e,n:p.n,sp:p.sp,vel:p.vel,ac:p.ac,d:p.d,rr:p.rr});if(v!==null&&isFinite(v)){lo=Math.min(lo,v);hi=Math.max(hi,v);}});m.lo=lo;m.hi=hi;});
  mets=mets.filter(m=>m.hi>=m.lo);
  const LI=['vv','ac','mach','rng','pit','hdg'];tlist=mets.filter(m=>LI.includes(m.id));
  trist=mets.filter(m=>!LI.includes(m.id)).sort((a,b)=>(b.ci>=0)-(a.ci>=0)).slice(0,6);
  const row=(m,box)=>{const d=document.createElement('div');d.className='m';d.innerHTML='<small></small><b>0</b><u></u><i><em></em></i>';d.children[0].textContent=m.l;m.b=d.children[1];m.ue=d.children[2];m.em=d.children[3].firstChild;box.appendChild(d);};
  $('tl').innerHTML='';$('tr').innerHTML='';tlist.forEach(m=>row(m,$('tl')));trist.forEach(m=>row(m,$('tr')));
  const ch=$('ch');ch.innerHTML='';chE=heads.map(h=>{const d=document.createElement('div'),n=document.createElement('span'),v=document.createElement('b');n.textContent=h;d.append(n,v);ch.appendChild(d);return v;});
  if(!heads.length)ch.innerHTML='<div><span>No CSV channels</span></div>';}
// update values every frame
function updTel(a,b,k,pos,dir){const s=smp(a,b,k,pos,dir),o=m=>{const v=mval(m,a,b,k,s),ok=v!==null&&isFinite(v),fr=ok?clamp01((v-m.lo)/((m.hi-m.lo)||1)):0;let un=m.un,t='—';
    if(ok){if(m.km&&Math.abs(v)>=1e4){t=(v/1e3).toFixed(1);un='km';}else t=fm(v,m.d);}
    m.b.textContent=t;m.ue.textContent=un;m.em.style.width=100*fr+'%';return[m.l,t,un,fr];};
  const r={L:tlist.map(o),R:trist.map(o)};
  if(chE.length&&$('ch').classList.contains('on')&&a.c&&b.c)chE.forEach((e,i)=>{const x=a.c[i],y=b.c[i];e.textContent=isFinite(x)&&isFinite(y)?fm(lerp(x,y,k)):'—';});
  return r;}

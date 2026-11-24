/* store.js: persistence. Settings in localStorage, flight and model files in IndexedDB */
const LSK='rf3d.v1',IDS=['axis','len','exact','inside','mk','lat','lon','prov','key','km','sc','bmode','cview','stab','cfov','ctilt','psz','spd','cam','mname','autohide'];
let ready=false;
const idb=new Promise(r=>{try{const q=indexedDB.open('rf3d',1);q.onupgradeneeded=()=>q.result.createObjectStore('kv');q.onsuccess=()=>r(q.result);q.onerror=()=>r(null);}catch(e){r(null);}});
const kv=async(m,k,v)=>{const d=await idb;if(!d)return;return new Promise(r=>{try{const s=d.transaction('kv',m==='get'?'readonly':'readwrite').objectStore('kv'),q=m==='get'?s.get(k):m==='put'?s.put(v,k):s.delete(k);q.onsuccess=()=>r(q.result);q.onerror=()=>r();}catch(e){r();}});};
const setSt=(id,t)=>{$(id).textContent=t;};
const keepCSV=(name,text)=>{kv('put','csv',{name,text});kv('del','demo');setSt('stF',name);};
const keepDemo=()=>{kv('put','demo',1);kv('del','csv');setSt('stF','Demo flight');};
const keepModel=(k,name,text)=>{kv('put',k,{name,text});setSt('stM',name);};
const dropModel=k=>kv('del',k);
const val=e=>e.type==='checkbox'?e.checked:e.value;
function save(){if(!ready)return;try{const o={};IDS.forEach(i=>o[i]=val($(i)));o.det={};document.querySelectorAll('#panel details').forEach(d=>o.det[d.id]=d.open);
  o.menu=!$('panel').classList.contains('min');o.T=pts.length?T:null;o.cam=[camera.position.toArray(),controls.target.toArray()];localStorage.setItem(LSK,JSON.stringify(o));}catch(e){}}
setInterval(save,1500);['input','change','toggle'].forEach(n=>addEventListener(n,save,true));addEventListener('pagehide',save);
document.addEventListener('visibilitychange',()=>{if(document.hidden)save();});
$('wipe').onclick=async()=>{if(!confirm('Delete all saved settings and files from this browser?'))return;ready=false;localStorage.removeItem(LSK);for(const k of ['csv','demo','obj','mtl'])await kv('del',k);location.reload();};
(async()=>{let s=null;try{s=JSON.parse(localStorage.getItem(LSK));}catch(e){}
  try{if(s){IDS.forEach(i=>{if(s[i]!=null){const e=$(i);if(e.type==='checkbox')e.checked=!!s[i];else e.value=s[i];}});
      $('key').style.display=$('prov').value==='google'?'block':'none';$('panel').classList.toggle('min',!s.menu);
      Object.entries(s.det||{}).forEach(([k,v])=>{const d=$(k);if(d)d.open=v;});keepSc=true;$('mname').oninput();}
    const [csv,demo,obj,mtl]=await Promise.all(['csv','demo','obj','mtl'].map(k=>kv('get',k)));
    if(mtl){mtlInfo=parseMTL(mtl.text);setSt('stM',mtl.name);}
    if(obj){loadOBJ(obj.text);setSt('stM',obj.name+(mtl?' + '+mtl.name:''));}
    if(csv){loadCSV(csv.text);setSt('stF',csv.name);if(objInfo)applyObj();}else if(demo){$('demo').onclick();setSt('stF','Demo flight');}
    if(s&&pts.length){if(isFinite(s.T))T=Math.min(tEnd,Math.max(pts[0].t,s.T));if(s.cam){camera.position.fromArray(s.cam[0]);controls.target.fromArray(s.cam[1]);}}
  }catch(e){console.error(e);}
  keepSc=false;ready=true;})();

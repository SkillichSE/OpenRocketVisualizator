// world map picker with leaflet
let lm=null,lmk=null,lsel=null,lbase=null,lstreet=false;const wrapLng=x=>((x+540)%360+360)%360-180;
const baseL=st=>window.L.tileLayer(st?'https://tile.openstreetmap.org/{z}/{x}/{y}.png':'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',{maxZoom:20,maxNativeZoom:st?19:17,attribution:st?'OpenStreetMap':'Esri'});
// place or move the red marker
function setSel(ll){lsel=ll;$('lat').value=ll.lat.toFixed(6);$('lon').value=wrapLng(ll.lng).toFixed(6);if(lmk)lmk.setLatLng(ll);else lmk=window.L.circleMarker(ll,{radius:7,color:'#fff',weight:2,fillColor:'#f33',fillOpacity:1}).addTo(lm);$('mi').textContent='Launch site: '+ll.lat.toFixed(6)+', '+wrapLng(ll.lng).toFixed(6);}
// status line under the pick button
function updSite(){const a=parseFloat($('lat').value),b=parseFloat($('lon').value);$('stL').textContent=isFinite(a)&&isFinite(b)?a.toFixed(5)+', '+b.toFixed(5):'No launch site';}
// move marker to typed coordinates
function syncSel(){if(!lm)return;const a=parseFloat($('lat').value),b=parseFloat($('lon').value);if(isFinite(a)&&isFinite(b)){setSel(window.L.latLng(a,b));lm.setView([a,b],Math.max(lm.getZoom(),10));}}
// open the picker
$('pick').onclick=()=>{if(!window.L)return msg('The map picker needs an internet connection (Leaflet did not load)');$('mm').classList.add('on');if(csvLL&&!$('lat').value&&!$('lon').value){$('lat').value=csvLL[0];$('lon').value=csvLL[1];}
  if(!lm){lm=window.L.map('mmap',{worldCopyJump:true,minZoom:2}).setView([20,0],2);lbase=baseL(false).addTo(lm);lm.on('click',e=>setSel(e.latlng));}
  setTimeout(()=>{lm.invalidateSize();const a=parseFloat($('lat').value),b=parseFloat($('lon').value);if(isFinite(a)&&isFinite(b)){setSel(window.L.latLng(a,b));lm.setView([a,b],10);}},60);};
// switch satellite and streets
$('mu').onclick=()=>{if(!lm)return;lstreet=!lstreet;lm.removeLayer(lbase);lbase=baseL(lstreet).addTo(lm);};
// close without saving
$('mc').onclick=()=>$('mm').classList.remove('on');
// apply chosen location
$('mok').onclick=()=>{const a=parseFloat($('lat').value),b=parseFloat($('lon').value);if(!isFinite(a)||!isFinite(b)){if($('prov').value==='none'){$('mm').classList.remove('on');return buildMap();}return $('mi').textContent='Click the map or type coordinates first';}$('mm').classList.remove('on');updSite();buildMap();msg('Launch site set');};
// search by place name or coordinates
$('mg').onclick=async()=>{const q=$('mq').value.trim();if(!q||!lm)return;const m=q.match(/^(-?\d+(?:\.\d+)?)\s*[,;\s]\s*(-?\d+(?:\.\d+)?)$/);let a,b;
  if(m){a=+m[1];b=+m[2];}else{try{const r=await(await fetch('https://nominatim.openstreetmap.org/search?format=json&limit=1&q='+encodeURIComponent(q))).json();if(!r[0])return $('mi').textContent='Nothing found';a=+r[0].lat;b=+r[0].lon;}catch(e){return $('mi').textContent='Search failed: check your internet connection';}}
  setSel(window.L.latLng(a,b));lm.setView([a,b],12);};
$('mq').onkeydown=e=>{if(e.key==='Enter')$('mg').click();};

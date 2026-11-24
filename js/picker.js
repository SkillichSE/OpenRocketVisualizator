/* picker.js: world-map launch site picker (Leaflet) */
// world-map launch site picker (Leaflet)
let lm=null,lmk=null,lsel=null,lbase=null,lstreet=false;const wrapLng=x=>((x+540)%360+360)%360-180;
const baseL=st=>window.L.tileLayer(st?'https://tile.openstreetmap.org/{z}/{x}/{y}.png':'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',{maxZoom:st?19:18,attribution:st?'OpenStreetMap':'Esri'});
function setSel(ll){lsel=ll;if(lmk)lmk.setLatLng(ll);else lmk=window.L.circleMarker(ll,{radius:7,color:'#fff',weight:2,fillColor:'#f33',fillOpacity:1}).addTo(lm);$('mi').textContent='Launch site: '+ll.lat.toFixed(6)+', '+wrapLng(ll.lng).toFixed(6);}
$('pick').onclick=()=>{if(!window.L)return msg('The map picker needs an internet connection (Leaflet did not load)');$('mm').classList.add('on');
  if(!lm){lm=window.L.map('mmap',{worldCopyJump:true,minZoom:2}).setView([20,0],2);lbase=baseL(false).addTo(lm);lm.on('click',e=>setSel(e.latlng));}
  setTimeout(()=>{lm.invalidateSize();const a=parseFloat($('lat').value),b=parseFloat($('lon').value);if(isFinite(a)&&isFinite(b)){setSel(window.L.latLng(a,b));lm.setView([a,b],10);}},60);};
$('mu').onclick=()=>{if(!lm)return;lstreet=!lstreet;lm.removeLayer(lbase);lbase=baseL(lstreet).addTo(lm);};
$('mc').onclick=()=>$('mm').classList.remove('on');
$('mok').onclick=()=>{if(!lsel)return $('mi').textContent='Click the map first';$('lat').value=lsel.lat.toFixed(6);$('lon').value=wrapLng(lsel.lng).toFixed(6);$('mm').classList.remove('on');buildMap();msg('Launch site set');};
$('mg').onclick=async()=>{const q=$('mq').value.trim();if(!q||!lm)return;const m=q.match(/^(-?\d+(?:\.\d+)?)\s*[,;\s]\s*(-?\d+(?:\.\d+)?)$/);let a,b;
  if(m){a=+m[1];b=+m[2];}else{try{const r=await(await fetch('https://nominatim.openstreetmap.org/search?format=json&limit=1&q='+encodeURIComponent(q))).json();if(!r[0])return $('mi').textContent='Nothing found';a=+r[0].lat;b=+r[0].lon;}catch(e){return $('mi').textContent='Search failed: check your internet connection';}}
  setSel(window.L.latLng(a,b));lm.setView([a,b],12);};
$('mq').onkeydown=e=>{if(e.key==='Enter')$('mg').click();};

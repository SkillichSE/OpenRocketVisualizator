// load image and return null on error
const loadImg=u=>new Promise(r=>{const i=new Image();i.crossOrigin='anonymous';i.onload=()=>r(i);i.onerror=()=>r(null);i.src=u;});
// tile url templates
const TILES={esri:(z,x,y)=>`https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/${z}/${y}/${x}`,
  esrist:(z,x,y)=>`https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/${z}/${y}/${x}`,
  esritopo:(z,x,y)=>`https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/${z}/${y}/${x}`,
  carto:(z,x,y)=>`https://a.basemaps.cartocdn.com/dark_all/${z}/${x}/${y}.png`,osm:(z,x,y)=>`https://tile.openstreetmap.org/${z}/${x}/${y}.png`};
// build ground map around the flight
async function buildMap(note=''){while(mapGroup.children.length)mapGroup.remove(mapGroup.children[0]);
  const prov=$('prov').value;if(!pts.length)return;setOrigin();
// flight bounds in meters
  let a=1e9,b=-1e9,c=1e9,d=-1e9;pts.forEach(p=>{a=Math.min(a,p.e);b=Math.max(b,p.e);c=Math.min(c,p.n);d=Math.max(d,p.n);});
  const km=parseFloat($('km').value),S=km>0?km*1000:Math.min(80000,Math.max(4000,maxAlt*3,Math.max(b-a,d-c)*2.5)),cE=(a+b)/2,cN=(c+d)/2;
  if(lat0===null||prov==='none'){mapGroup.add(new THREE.GridHelper(S,40,0x445577,0x2a3555));return msg(lat0===null&&prov!=='none'?'No launch coordinates: showing grid. Enter latitude/longitude and press Update map.':'Map disabled');}
// map center and scale
  const latC=lat0+cN/mlat,lonC=lon0+cE/mlon,cosL=Math.cos(latC*Math.PI/180);
// put an image on the ground
  const addPlane=(src,w,h,e,n,ord=0)=>{const tex=new THREE.Texture(src);tex.needsUpdate=true;tex.encoding=THREE.sRGBEncoding;tex.anisotropy=8;
    const m=new THREE.Mesh(new THREE.PlaneGeometry(w,h),new THREE.MeshBasicMaterial({map:tex,depthWrite:false}));m.renderOrder=ord;m.rotation.x=-Math.PI/2;m.position.set(e,-.5,-n);mapGroup.add(m);};
  msg('Loading map…');
// google static map
  if(prov==='google'){const key=$('key').value.trim();if(!key)return msg('Enter a Google Maps API key');
    const z=Math.max(1,Math.min(21,Math.floor(Math.log2(156543.03392*cosL*640/S)))),mpp=156543.03392*cosL/2**z;
    const img=await loadImg(`https://maps.googleapis.com/maps/api/staticmap?center=${latC},${lonC}&zoom=${z}&size=640x640&scale=2&maptype=satellite&key=${key}`);
    if(!img)return msg('Google map failed to load: check the key, Maps Static API and billing.');addPlane(img,640*mpp,640*mpp,cE,cN);return msg('Google map loaded '+note);}
// stitch tiles into one texture
  const mosaic=async(S,res,ord)=>{let used=prov,ok=0,tot=0;
  for(const pv of [prov,'esri']){used=pv;const z=Math.max(2,Math.min(pv==='osm'?19:17,Math.round(Math.log2(156543.03392*cosL*res/S)))),n=2**z;
    const tx=lo=>(lo+180)/360*n,ty=la=>(1-Math.log(Math.tan(la*Math.PI/180)+1/Math.cos(la*Math.PI/180))/Math.PI)/2*n;
    const lonOf=x=>x/n*360-180,latOf=y=>Math.atan(Math.sinh(Math.PI*(1-2*y/n)))*180/Math.PI,dLat=S/2/mlat,dLon=S/2/mlon;
    const x0=Math.floor(tx(lonC-dLon)),x1=Math.floor(tx(lonC+dLon)),y0=Math.floor(ty(latC+dLat)),y1=Math.floor(ty(latC-dLat));
    const cv=document.createElement('canvas');cv.width=(x1-x0+1)*256;cv.height=(y1-y0+1)*256;const cx=cv.getContext('2d');cx.fillStyle='#6a7a58';cx.fillRect(0,0,cv.width,cv.height);
    const jobs=[];for(let x=x0;x<=x1;x++)for(let y=y0;y<=y1;y++)jobs.push(loadImg(TILES[pv](z,x,y)).then(im=>{if(im)cx.drawImage(im,(x-x0)*256,(y-y0)*256);return !!im;}));
    ok=(await Promise.all(jobs)).filter(Boolean).length;tot=jobs.length;
    if(ok){const W=lonOf(x1+1),E=lonOf(x0),N=latOf(y0),Sg=latOf(y1+1);addPlane(cv,(W-E)*mlon,(N-Sg)*mlat,((W+E)/2-lon0)*mlon,((N+Sg)/2-lat0)*mlat,ord);break;}}
  return {used,ok,tot};};
// several rings for far coverage
  const RG=[[1,2048],[5,1536],[25,1024],[125,768]].filter(([f],i)=>i===0||S*f<=6e5),out=await Promise.all(RG.map(([f,r],i)=>mosaic(S*f,r,-1-i))),{used,ok,tot}=out[0];
  msg(ok?`Map: ${ok}/${tot} tiles, area ${(S/1000).toFixed(1)} km${used!==prov?` (${prov} unavailable, showing Esri)`:''}. ${note}`:'Tiles failed to load: check your internet connection.');}

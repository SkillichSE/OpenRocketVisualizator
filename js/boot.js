// check libraries and webgl and show errors
(function(){const out=t=>{const m=document.getElementById('msg');if(m){m.textContent=t;m.style.color='#ff6b6b';}console.error(t);};
  addEventListener('error',e=>out('Error: '+(e.message||'unknown')));
  addEventListener('unhandledrejection',e=>out('Error: '+((e.reason&&e.reason.message)||e.reason)));
  if(!window.THREE||!THREE.OrbitControls){out('Could not load the 3D libraries. Check your internet connection and reload.');return;}
  try{const c=document.createElement('canvas');if(!(c.getContext('webgl2')||c.getContext('webgl')))out('WebGL is not available in this browser.');}catch(e){out('WebGL is not available in this browser.');}
})();

// flight sounds, all synthesized with web audio (no audio files)
let AC=null,master=null,sdest=null,SN={},sPrev=0,sBurn=false,sIdx=0;
const sndOn=()=>$('snd').checked,sClamp=x=>Math.min(1,Math.max(0,x));
// create the audio graph (needs a user gesture)
function sndInit(){const AX=window.AudioContext||window.webkitAudioContext;if(AC||!AX)return;
  AC=new AX();master=AC.createGain();master.gain.value=0;
  const comp=AC.createDynamicsCompressor();sdest=AC.createMediaStreamDestination();master.connect(comp);comp.connect(AC.destination);comp.connect(sdest);
  const mk=brown=>{const n=AC.sampleRate*2,b=AC.createBuffer(1,n,AC.sampleRate),d=b.getChannelData(0);let l=0;
    for(let i=0;i<n;i++){const w=Math.random()*2-1;if(brown){l=(l+.02*w)/1.02;d[i]=l*3.5;}else d[i]=w;}return b;};
  SN.WH=mk(false);SN.BR=mk(true);
  const loop=buf=>{const s=AC.createBufferSource();s.buffer=buf;s.loop=true;s.start();return s;},
    flt=(type,f,q)=>{const x=AC.createBiquadFilter();x.type=type;x.frequency.value=f;if(q)x.Q.value=q;return x;},
    gn=v=>{const g=AC.createGain();g.gain.value=v;return g;};
// engine rumble + roar + roughness
  SN.rum=loop(SN.BR);SN.lp=flt('lowpass',120);SN.gRum=gn(0);SN.rum.connect(SN.lp).connect(SN.gRum).connect(master);
  SN.roar=loop(SN.WH);SN.bp=flt('bandpass',800,.7);SN.gRoar=gn(0);SN.roar.connect(SN.bp).connect(SN.gRoar).connect(master);
  const lfo=AC.createOscillator();lfo.type='sawtooth';lfo.frequency.value=37;SN.lfoG=gn(0);lfo.connect(SN.lfoG).connect(SN.gRoar.gain);lfo.start();
// air rush
  SN.wind=loop(SN.WH);SN.wbp=flt('bandpass',400,.6);SN.gWind=gn(0);SN.wind.connect(SN.wbp).connect(SN.gWind).connect(master);
  sndSync();}
// one-shot noise burst with a filter sweep
function burst(dur,type,f0,f1,vol,delay=0,q=.8){if(!AC)return;const t=AC.currentTime+delay,s=AC.createBufferSource(),f=AC.createBiquadFilter(),g=AC.createGain();
  s.buffer=SN.WH;f.type=type;f.Q.value=q;f.frequency.setValueAtTime(f0,t);f.frequency.exponentialRampToValueAtTime(Math.max(20,f1),t+dur);
  g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(vol,t+.006);g.gain.exponentialRampToValueAtTime(.001,t+dur);
  s.connect(f).connect(g).connect(master);s.start(t,Math.random());s.stop(t+dur+.05);}
// one-shot tone
function tone(f0,f1,dur,vol,delay=0,type='sine'){if(!AC)return;const t=AC.currentTime+delay,o=AC.createOscillator(),g=AC.createGain();
  o.type=type;o.frequency.setValueAtTime(f0,t);o.frequency.exponentialRampToValueAtTime(Math.max(20,f1),t+dur);
  g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(vol,t+.005);g.gain.exponentialRampToValueAtTime(.001,t+dur);
  o.connect(g).connect(master);o.start(t);o.stop(t+dur+.05);}
// flight events
const SFX={
  ignite(){burst(.8,'bandpass',500,2600,.55);tone(45,95,.6,.4);},
  burnout(){burst(.35,'lowpass',1600,180,.4);tone(900,300,.06,.12,0,'square');},
  apogee(){tone(1100,1100,.13,.22);tone(1100,1100,.13,.22,.22);},
  eject(){burst(.14,'highpass',900,900,.9);tone(170,45,.3,.7);burst(.5,'lowpass',900,250,.5,.25);
    const t=AC.currentTime+.3,s=AC.createBufferSource(),f=AC.createBiquadFilter(),g=AC.createGain(),l=AC.createOscillator(),lg=AC.createGain();
    s.buffer=SN.WH;s.loop=true;f.type='bandpass';f.frequency.value=420;f.Q.value=1;l.frequency.value=11;lg.gain.value=.25;
    g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(.5,t+.25);g.gain.linearRampToValueAtTime(0,t+1.8);
    l.connect(lg).connect(g.gain);s.connect(f).connect(g).connect(master);s.start(t);l.start(t);s.stop(t+1.9);l.stop(t+1.9);},
  land(){tone(110,30,.45,.95);burst(.4,'lowpass',800,140,.85);tone(80,30,.3,.35,.38);burst(.25,'lowpass',500,120,.3,.38);}};
const EVSFX=[['BURNOUT','burnout'],['APOGEE','apogee'],['RECOVERY_DEVICE_DEPLOYMENT','eject'],['GROUND_HIT','land']];
// called every frame
function sndTick(){if(!AC||!pts.length)return;
  const on=sndOn(),vol=(+$('vol').value||0)/100,t=AC.currentTime,spd=+$('spd').value||1;
  master.gain.setTargetAtTime(on?vol:0,t,.05);if(playing&&AC.state==='suspended')AC.resume();
  while(sIdx>0&&pts[sIdx].t>T)sIdx--;while(sIdx<pts.length-2&&pts[sIdx+1].t<=T)sIdx++;
  const a=pts[sIdx],b=pts[Math.min(sIdx+1,pts.length-1)],k=b.t>a.t?sClamp((T-a.t)/(b.t-a.t)):0,
    th=a.th+(b.th-a.th)*k,sp=a.sp+(b.sp-a.sp)*k,h=a.h+(b.h-a.h)*k,adv=T-sPrev,normal=adv>0&&adv<=.12*spd+.05&&(playing||T>=tEnd),burn=th>1;
  if(normal&&on){if(burn&&!sBurn)SFX.ignite();for(const [n,f] of EVSFX){const te=ev[n];if(te!==undefined&&sPrev<te&&te<=T)SFX[f]();}}
  sBurn=burn&&(normal||playing||T>pts[0].t+.05);sPrev=T;
// continuous levels
  const eng=playing&&burn?Math.pow(sClamp(th/(maxThr||1)),.7):0,dens=Math.exp(-Math.max(0,h)/7000),
    wnd=playing?Math.pow(sClamp(sp/120),1.6)*dens*.55:0,rate=Math.min(1.6,Math.max(.6,Math.pow(spd,.35))),tc=.07;
  SN.gRum.gain.setTargetAtTime(.9*eng,t,tc);SN.lp.frequency.setTargetAtTime(90+eng*280,t,tc);
  SN.gRoar.gain.setTargetAtTime(.5*eng,t,tc);SN.bp.frequency.setTargetAtTime(500+eng*1600,t,tc);SN.lfoG.gain.setTargetAtTime(.14*eng,t,tc);
  SN.gWind.gain.setTargetAtTime(wnd,t,.15);SN.wbp.frequency.setTargetAtTime(250+Math.min(sp,300)*7,t,.15);
  SN.rum.playbackRate.setTargetAtTime(rate,t,.1);SN.roar.playbackRate.setTargetAtTime(rate,t,.1);SN.wind.playbackRate.setTargetAtTime(rate,t,.1);}
// audio track for video export
const sndStream=()=>{sndInit();return AC&&sndOn()?sdest.stream:null;};
// button state
function sndSync(){const o=sndOn();$('sndL').textContent=o?'Sound':'Muted';$('sndBtn').classList.toggle('off',!o);}
function sndToggle(){$('snd').checked=!sndOn();$('snd').dispatchEvent(new Event('change',{bubbles:true}));sndSync();sndInit();}
$('sndBtn').onclick=sndToggle;$('snd').onchange=()=>{sndSync();sndInit();};
['pointerdown','keydown'].forEach(n=>addEventListener(n,sndInit,{passive:true}));
addEventListener('keydown',e=>{if(e.code==='KeyS'&&!/INPUT|SELECT|TEXTAREA/.test(e.target.tagName))sndToggle();});

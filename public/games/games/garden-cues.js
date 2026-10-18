// Short original game cues. A single controller cancels delayed audio on reset,
// mute, game changes and page exit, including samples still being decoded.
export function createGardenCues({sounds={}}={}) {
 let enabled=false,context=null,epoch=0,loadPromise=null,controller=null;
 const buffers=new Map(),voices=new Set();
 function stop(){epoch++;for(const voice of voices){try{voice.stop();}catch{}}voices.clear();}
 function unlock(){try{context??=new(window.AudioContext||window.webkitAudioContext)();context.resume().catch(()=>{});return context;}catch{return null;}}
 async function load(){
  if(loadPromise)return loadPromise;const ctx=unlock();if(!ctx)return;
  controller=new AbortController();const signal=controller.signal;
  loadPromise=Promise.allSettled(Object.entries(sounds).filter(([,url])=>typeof url==='string').map(async([key,url])=>{
   const response=await fetch(url,{signal});if(!response.ok)throw new Error('Cue unavailable');
   const buffer=await ctx.decodeAudioData(await response.arrayBuffer());if(!signal.aborted)buffers.set(key,buffer);
  }));return loadPromise;
 }
 function play(key,delay=0,volume=.22,loop=false){
  const buffer=buffers.get(key);if(!enabled||!context||!buffer)return;
  const source=context.createBufferSource(),gain=context.createGain();source.buffer=buffer;source.loop=loop;gain.gain.value=volume;
  source.connect(gain).connect(context.destination);voices.add(source);source.onended=()=>{voices.delete(source);source.disconnect();gain.disconnect();};source.start(context.currentTime+delay);
 }
 async function sequence(kind){
  stop();if(!enabled)return;const token=epoch,started=performance.now();unlock();await load();
  if(token!==epoch||!enabled)return;
  if(kind==='intro'){if(performance.now()-started<3000)play('intro',0,.22);}
  else if(kind==='dance'){play('dance',0,.35,true);}
  else{play('plop',0,.4);play('growl',.18,.17);play('dance',.65,.35,true);}
 }
 return {startIntro:()=>sequence('intro'),chosen:()=>sequence('chosen'),startDance:()=>sequence('dance'),stop,
  setSound(value){enabled=!!value;if(!enabled)stop();else{unlock();load();}},
  destroy(){stop();controller?.abort();loadPromise=null;buffers.clear();const old=context;context=null;old?.close().catch(()=>{});},
  getState(){return{enabled,loaded:[...buffers.keys()],voices:voices.size};}
 };
}

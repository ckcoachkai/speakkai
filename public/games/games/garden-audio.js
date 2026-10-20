// Layered, spatial effects synthesized locally. Audio variation never uses combat RNG.
const caches=new WeakMap();let variation=0;
export function playGardenSynth(audio,master,key,voices,pan=0){
 const at=audio.currentTime,heavy=['explosion','thunder','fireImpact'].includes(key),shot=key==='gatling',duration=heavy?(key==='thunder'?.85:.60):shot?.10:key==='charge'?.50:.23;
 let noise=caches.get(audio);if(!noise){noise=audio.createBuffer(1,audio.sampleRate*2,audio.sampleRate);const d=noise.getChannelData(0);let seed=291;for(let i=0;i<d.length;i++){seed=(Math.imul(seed,1664525)+1013904223)>>>0;d[i]=seed/2147483648-1;}caches.set(audio,noise);}
 const n=variation++,shift=1+(n%7-3)*.025;
 function layer(type,frequency,endFrequency,level,delay=0,length=duration,cutoff=3000){
  if(voices.size>=80){const first=voices.values().next().value;try{first.source.stop();}catch{}voices.delete(first);}
  const source=type==='noise'?audio.createBufferSource():audio.createOscillator(),gain=audio.createGain(),filter=audio.createBiquadFilter();
  if(type==='noise'){source.buffer=noise;}else{source.type=type;source.frequency.setValueAtTime(frequency*shift,at+delay);source.frequency.exponentialRampToValueAtTime(Math.max(20,endFrequency*shift),at+delay+length);}
  filter.type=shot?'highpass':'lowpass';filter.frequency.setValueAtTime(cutoff,at+delay);if(heavy)filter.frequency.exponentialRampToValueAtTime(110,at+delay+length);
  gain.gain.setValueAtTime(.0001,at+delay);gain.gain.exponentialRampToValueAtTime(level,at+delay+.006);gain.gain.exponentialRampToValueAtTime(.0001,at+delay+length);
  source.connect(filter);filter.connect(gain);let panner=null;if(audio.createStereoPanner){panner=audio.createStereoPanner();panner.pan.value=Math.max(-.7,Math.min(.7,pan));gain.connect(panner);panner.connect(master);}else gain.connect(master);
  const voice={source,gain};voices.add(voice);source.onended=()=>{voices.delete(voice);source.disconnect();filter.disconnect();gain.disconnect();panner?.disconnect();};
  if(type==='noise')source.start(at+delay,(n*.173)%1);else source.start(at+delay);source.stop(at+delay+length);
 }
 if(heavy){layer('noise',0,0,.37,0,duration,2300);layer('sine',140,35,.35,0,.45);layer('noise',0,0,.09,.06,duration*.8,750);}
 else if(shot){layer('noise',0,0,.19,0,.075,950);layer('triangle',210,75,.09,0,.08,4200);}
 else if(key==='monkey'){for(let i=0;i<4;i++){layer('sine',i<2?440:650,i<2?310:420,.10,i*.13,.12,1500);layer('triangle',i<2?220:330,180,.025,i*.13,.1,900);}}
 else if(key==='heart'){layer('sine',750,1100,.10,0,.19);layer('sine',1125,1650,.04,.035,.16);}
 else if(key==='teleport'){layer('sine',350,1600,.12,0,.16);layer('noise',0,0,.07,0,.18,1300);}
 else if(key==='charge'){layer('triangle',200,700,.065,0,.48);layer('sine',400,1400,.025,.03,.44);}
 else if(key==='fireball'){layer('noise',0,0,.17,0,.28,1600);layer('triangle',180,95,.07,0,.22);}
 else {layer('sawtooth',920,150,.055,0,.15);layer('sine',1650,300,.055,.01,.18);}
 return true;
}

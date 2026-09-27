// Adapted from the user's red_blue_buzzer.html: one-second competition buzzer.
export function createBuzzer(overlay,volume,reducedMotion){
  let context,voices=[],timer,flashTimer,serial=0;
  function stop(){
    serial++;
    for(const voice of voices){try{voice.stop();}catch{}}
    voices=[];clearTimeout(timer);clearInterval(flashTimer);
    overlay.classList.remove('active','buzzer-blue');
  }
  async function buzz(){
    stop();const request=serial;
    try{
      const AC=window.AudioContext||window.webkitAudioContext;
      if(AC){
        context??=new AC();await context.resume();
        if(request!==serial)return;
        const now=context.currentTime,level=Math.max(.0001,Math.min(1,volume())*.48);
        const gain=context.createGain(),compressor=context.createDynamicsCompressor();
        gain.gain.setValueAtTime(.0001,now);
        gain.gain.exponentialRampToValueAtTime(level,now+.015);
        gain.gain.setValueAtTime(level,now+.95);
        gain.gain.exponentialRampToValueAtTime(.0001,now+1);
        gain.connect(compressor);compressor.connect(context.destination);
        let remaining=3;
        voices=[82,97,121].map((frequency,i)=>{
          const oscillator=context.createOscillator(),mix=context.createGain();
          oscillator.type=i===1?'sawtooth':'square';oscillator.frequency.value=frequency;
          mix.gain.value=i===1?.34:.25;
          oscillator.connect(mix);mix.connect(gain);
          oscillator.onended=()=>{oscillator.disconnect();mix.disconnect();if(!--remaining){gain.disconnect();compressor.disconnect();}};
          oscillator.start(now);oscillator.stop(now+1);return oscillator;
        });
      }
    }catch(error){console.warn('Buzzer audio unavailable',error);}
    if(request!==serial)return;
    overlay.classList.add('active');
    if(!reducedMotion())flashTimer=setInterval(()=>overlay.classList.toggle('buzzer-blue'),105);
    timer=setTimeout(stop,1080);
  }
  return {buzz,stop};
}

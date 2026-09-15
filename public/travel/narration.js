/* Prerecorded ElevenLabs audio; no API credentials or live generation in browser. */
(()=>{
 const $=s=>document.querySelector(s), audio=$('#trip-narration'), player=$('#narration-player');
 const copy={en:{label:'Your trip, narrated',play:'Play introduction',pause:'Pause',replay:'Replay',script:'Script',title:'The full introduction',close:'Close script',credit:'AI narration · ElevenLabs',loading:'Loading…',playing:'English',paused:'Paused',ready:'Tap play to listen',ended:'The journey is yours',error:'Audio unavailable · read the script',progress:'Narration progress',region:'Trip audio introduction'},zh:{label:'听听这趟旅程',play:'播放介绍',pause:'暂停',replay:'重播',script:'文稿',title:'完整语音介绍',close:'关闭文稿',credit:'AI配音 · ElevenLabs',loading:'加载中…',playing:'中文',paused:'已暂停',ready:'点击播放收听',ended:'开启你的旅程',error:'音频暂不可用 · 可阅读文稿',progress:'配音进度',region:'旅行语音介绍'}};
 let language=window.travelI18n.language,sourceLanguage=null,status='ready',requestId=0,seeking=false;
 const format=seconds=>{const n=Number.isFinite(seconds)?Math.max(0,Math.floor(seconds)):0;return Math.floor(n/60)+':'+String(n%60).padStart(2,'0');};
 function progress(){
  const duration=Number.isFinite(audio.duration)?audio.duration:0;
  $('#narration-seek').disabled=duration===0;
  if(!seeking)$('#narration-seek').value=duration?String(audio.currentTime/duration*100):'0';
  $('#narration-time').textContent=format(audio.currentTime)+' / '+format(duration);
  $('#narration-seek').setAttribute('aria-valuetext',format(audio.currentTime)+' / '+format(duration));
 }
 function render(){
  const text=copy[language];player.setAttribute('aria-label',text.region);
  $('#narration-label').textContent=text.label;
  $('#narration-status').textContent=text[status];
  $('#narration-toggle').textContent=!audio.paused?text.pause:text.play;
  $('#narration-toggle').setAttribute('aria-label',!audio.paused?text.pause:text.play);
  $('#narration-replay').textContent=text.replay;$('#narration-script').textContent=text.script;
  $('#narration-title').textContent=text.title;$('#narration-close').setAttribute('aria-label',text.close);
  $('#narration-credit').textContent=text.credit;$('#narration-seek').setAttribute('aria-label',text.progress);
  document.querySelectorAll('[data-narration-transcript]').forEach(el=>el.hidden=el.dataset.narrationTranscript!==language);
  progress();
 }
 function play(restart=false){
  const id=++requestId;
  if(sourceLanguage!==language){audio.pause();audio.src='/travel/assets/introduction-'+language+'.mp3';sourceLanguage=language;}
  else if(restart)audio.currentTime=0;
  player.hidden=false;status='loading';render();
  // Called synchronously from language-button activation to retain autoplay permission.
  const result=audio.play();render();
  if(result)result.then(()=>{if(id!==requestId)return;status='playing';render();}).catch(error=>{
   if(id!==requestId)return;status=error.name==='NotAllowedError'?'ready':error.name==='AbortError'?'paused':'error';render();
  });
 }
 $('#narration-toggle').onclick=()=>{if(audio.paused)play();else{requestId++;audio.pause();status='paused';render();}};
 $('#narration-replay').onclick=()=>play(true);
 $('#narration-script').onclick=()=>$('#narration-dialog').showModal();
 $('#narration-close').onclick=()=>$('#narration-dialog').close();
 $('#narration-seek').addEventListener('input',()=>{if(Number.isFinite(audio.duration)){seeking=true;audio.currentTime=Number($('#narration-seek').value)/100*audio.duration;progress();}});
 $('#narration-seek').addEventListener('change',()=>{seeking=false;progress();});
 audio.addEventListener('timeupdate',progress);audio.addEventListener('loadedmetadata',progress);
 audio.addEventListener('playing',()=>{status='playing';render();});
 audio.addEventListener('waiting',()=>{status='loading';render();});
 audio.addEventListener('pause',()=>{if(!audio.ended&&status!=='error')status='paused';render();});
 audio.addEventListener('ended',()=>{status='ended';render();});
 audio.addEventListener('error',()=>{status='error';render();});
 document.addEventListener('travel-language',()=>{language=window.travelI18n.language;render();});
 document.addEventListener('travel-language-selected',()=>play(true));
 $('#language-open').addEventListener('click',()=>{requestId++;audio.pause();});
 document.addEventListener('visibilitychange',()=>{if(document.hidden){requestId++;audio.pause();}});
 render();if(!$('#language-dialog').open)play();
})();

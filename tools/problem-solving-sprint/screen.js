(() => {
 const button=document.getElementById('fullscreen');
 if(!document.fullscreenEnabled){button.hidden=true;return;}
 button.addEventListener('click',async()=>{
  try {if(document.fullscreenElement)await document.exitFullscreen();else await document.documentElement.requestFullscreen();}
  catch {button.textContent='Full screen unavailable';}
 });
 document.addEventListener('fullscreenchange',()=>{
  const active=!!document.fullscreenElement;
  button.textContent=active?'Exit full screen':'Full screen';
  button.setAttribute('aria-pressed',String(active));
 });
})();

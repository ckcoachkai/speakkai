const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
document.querySelectorAll<HTMLElement>('[data-motion-scene]').forEach(scene => {
  const replay = scene.querySelector<HTMLButtonElement>('[data-motion-replay]');
  const play = () => { if(reduced.matches)return; scene.classList.remove('scene-playing'); requestAnimationFrame(()=>requestAnimationFrame(()=>scene.classList.add('scene-playing'))); };
  if(replay){replay.hidden=false;replay.addEventListener('click',play);}
  play();
  reduced.addEventListener('change',()=>{if(reduced.matches)scene.classList.remove('scene-playing');});
});
if('IntersectionObserver' in window && !reduced.matches){
  const observer = new IntersectionObserver(entries=>entries.forEach(entry=>{if(entry.isIntersecting){entry.target.classList.add('reveal-arrived');observer.unobserve(entry.target);}}),{threshold:.08});
  document.querySelectorAll('[data-reveal]').forEach(el=>observer.observe(el));
}

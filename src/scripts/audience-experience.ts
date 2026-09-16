const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
// Finite reveals start only when visible. Static content is never hidden beforehand.
if ('IntersectionObserver' in window) {
  const observer = new IntersectionObserver(entries => entries.forEach(entry => {
    const el = entry.target as HTMLElement;
    if (entry.isIntersecting && !reduced.matches) {
      el.classList.add('reveal-arrived');
      el.style.animationPlayState = 'running';
    } else if (!entry.isIntersecting) el.style.animationPlayState = 'paused';
  }), { threshold: .08 });
  document.querySelectorAll<HTMLElement>('[data-reveal]').forEach((el,i) => {
    el.style.setProperty('--reveal-delay', `calc(${i%3} * var(--motion-stagger))`);
    observer.observe(el);
    el.addEventListener('animationend', () => observer.unobserve(el), {once:true});
  });
}

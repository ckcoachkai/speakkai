/** Small, self-contained product portraits. SVG extrusion keeps the original
 * symbols readable at inventory size without image downloads or GPU canvases. */
let portraitId = 0;
const shade = (hex, amount) => {
  const value = hex.replace('#','');
  if (!/^[0-9a-f]{6}$/i.test(value)) return hex;
  return '#'+[0,2,4].map(i=>Math.round(Math.min(255,Math.max(0,parseInt(value.slice(i,i+2),16)+amount))).toString(16).padStart(2,'0')).join('');
};
const tint = (body, color) => body.replace(/(fill|stroke)="(?!none)([^"]+)"/g,(_,attribute)=>`${attribute}="${color}"`);
export function itemPortrait(body, color='#b8c9ff') {
  const id=`r3-item-${++portraitId}`;
  const colors=[...new Set([...body.matchAll(/(?:fill|stroke)="(#[0-9a-f]{6})"/gi)].map(m=>m[1]))];
  const gradients=colors.map((c,i)=>`<linearGradient id="${id}-${i}" x1="0" y1="0" x2=".8" y2="1"><stop stop-color="${shade(c,65)}"/><stop offset=".32" stop-color="${shade(c,20)}"/><stop offset=".52" stop-color="${c}"/><stop offset="1" stop-color="${shade(c,-55)}"/></linearGradient>`).join('');
  const enamel=body.replace(/(fill|stroke)="(#[0-9a-f]{6})"/gi,(_,attribute,c)=>`${attribute}="url(#${id}-${colors.indexOf(c)})"`);
  return `<svg class="race3d-item-portrait" viewBox="0 0 80 80" aria-hidden="true" focusable="false" data-render="extruded-enamel"><defs>${gradients}<radialGradient id="${id}-aura"><stop stop-color="${color}" stop-opacity=".26"/><stop offset="1" stop-color="${color}" stop-opacity="0"/></radialGradient></defs><ellipse cx="40" cy="42" rx="39" ry="37" fill="url(#${id}-aura)"/><ellipse cx="42" cy="69" rx="23" ry="5" fill="#000d1e" opacity=".46"/><ellipse cx="40" cy="68" rx="18" ry="2" fill="${color}" opacity=".25"/><g transform="translate(8 4) rotate(-7 32 32)"><g transform="translate(3 5)" opacity=".9">${tint(body,'#061321')}</g><g transform="translate(1.5 2.6)">${tint(body,shade(color,-65))}</g><g transform="translate(-.6 -.8)" opacity=".75">${tint(body,'#eafaff')}</g>${enamel}</g><path d="M61 10v6m-3-3h6" stroke="#fff" stroke-opacity=".75" stroke-width="1.5" stroke-linecap="round"/></svg>`;
}

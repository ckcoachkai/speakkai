// Names identify the loaded representations; ratings and telemetry below are game values.
export const RACER_CARD_NAMES = Object.freeze({
  'f1-2026':'Qvist 2026 Formula concept', gt3:'Race Car 01 LMGT3',
  'car-concept':'CarConcept sports coupe', 'lamborghini-gallardo':'Lamborghini Gallardo 2010',
  'tesla-roadster':'Tesla Roadster 2020 concept',
  'cheese-swiss':'Swiss cheese', 'cheese-cheddar':'Cheddar wedge', 'cheese-brie':'Brie wheel',
  'cheese-blue':'Blue cheese', 'cheese-gouda':'Waxed Gouda', 'cheese-parmesan':'Parmesan wedge',
  'cheese-mozzarella':'Mozzarella ball', 'cheese-feta':'Feta cube',
  'cheese-provolone':'Provolone pear', 'cheese-leicester':'Red Leicester',
  bear:'Brown bear', eagle:'Bald eagle', fox:'Red fox', rabbit:'Rabbit',
  'x-wing':'Crosswing starfighter', 'tie-fighter':'Twin-panel interceptor',
  falcon:'Disk freighter', snail:'Garden snail', 'monster-truck':'Monster truck',
});

const carSilhouette = '<path d="M9 43 15 32 28 29 39 19h36l16 13 17 3 4 13H8Z" fill="currentColor"/><path d="m42 23-10 9h50l-10-9Z" fill="#add8eb"/><path d="m16 35 14-1m61 3 13 2" stroke="#fff5cb" stroke-width="3"/><path d="M19 45h83" stroke="#101923" stroke-width="4"/><g fill="#111b25" stroke="#6f8190" stroke-width="3"><circle cx="28" cy="46" r="9"/><circle cx="91" cy="46" r="9"/></g>';
const shapes = {
  cheese:'<path d="M18 44 79 13l25 33-56 15Z" fill="#f5c84b"/><path d="M18 44v-17L79 7v6Z" fill="#ffe9a1"/><path d="m18 44 30 17V42L18 27Z" fill="#dca12d"/><g fill="#b88621"><ellipse cx="68" cy="36" rx="7" ry="4"/><ellipse cx="85" cy="44" rx="5" ry="3"/><ellipse cx="55" cy="49" rx="4" ry="3"/><ellipse cx="32" cy="40" rx="4" ry="6"/></g>',
  snail:'<path d="M13 52c12-18 28-15 50-6 16 8 28-4 36-17 7 12 6 22-5 24Z" fill="#bb9d60"/><circle cx="51" cy="32" r="23" fill="#b86535"/><path d="M61 43c-26 7-30-22-11-25 17-3 22 20 6 21-11 1-12-11-4-12" fill="none" stroke="#713e29" stroke-width="4"/><path d="m97 32-1-17m8 19 7-18" stroke="#a58c50" stroke-width="3"/><g fill="#172329"><circle cx="96" cy="14" r="4"/><circle cx="112" cy="15" r="4"/></g>',
  bird:'<path d="M61 31C41 10 17 18 6 8c4 21 25 36 45 32L40 59l21-10 20 10-12-20c23 0 37-14 45-31-23 13-40 8-53 23Z" fill="currentColor"/><ellipse cx="63" cy="29" rx="9" ry="12" fill="#e8e2c7"/><path d="m69 24 11 6-11 4Z" fill="#e2a83a"/><circle cx="66" cy="25" r="2" fill="#132330"/>',
  animal:'<ellipse cx="52" cy="35" rx="29" ry="20" fill="currentColor"/><circle cx="83" cy="27" r="17" fill="currentColor"/><circle cx="73" cy="13" r="7" fill="currentColor"/><circle cx="92" cy="13" r="7" fill="currentColor"/><path d="M31 46v12m19-11v11m20-12v12m17-15v15" stroke="currentColor" stroke-width="9" stroke-linecap="round"/><ellipse cx="92" cy="33" rx="10" ry="6" fill="#c6b18e"/><circle cx="87" cy="24" r="3" fill="#132330"/><circle cx="99" cy="30" r="3" fill="#132330"/>',
  rabbit:'<ellipse cx="50" cy="39" rx="27" ry="17" fill="currentColor"/><ellipse cx="80" cy="28" rx="16" ry="17" fill="currentColor"/><ellipse cx="73" cy="10" rx="5" ry="13" fill="currentColor"/><ellipse cx="85" cy="10" rx="5" ry="13" fill="currentColor"/><ellipse cx="41" cy="54" rx="16" ry="5" fill="currentColor"/><ellipse cx="82" cy="53" rx="12" ry="5" fill="currentColor"/><circle cx="21" cy="37" r="9" fill="#f5f0de"/><circle cx="84" cy="25" r="3" fill="#132330"/>',
  spacecraft:'<path d="m60 5 8 27 43-12v11L73 44l-3 14H50l-3-14L9 31V20l43 12Z" fill="#c9d5df" stroke="#526d83" stroke-width="2"/><path d="M60 12v33" stroke="#2f748e" stroke-width="6"/><path d="M15 20v-8m90 8v-8M15 32v10m90-10v10" stroke="#d55c43" stroke-width="3"/><path d="M53 58v7m14-7v7" stroke="#62d2fb" stroke-width="5"/>',
  truck:'<path d="M16 35V20h19l10-11h29l13 15h19v14Z" fill="currentColor"/><path d="m48 13-9 10h38l-6-10Z" fill="#a8d5e4"/><path d="M21 38h80" stroke="#657c85" stroke-width="4"/><g fill="#17242a" stroke="#4c5b62" stroke-width="5"><circle cx="29" cy="47" r="16"/><circle cx="91" cy="47" r="16"/></g><g fill="#a7bac3"><circle cx="29" cy="47" r="6"/><circle cx="91" cy="47" r="6"/></g>',
  formula:'<path d="M10 25h17v20H10Zm83 0h17v20H93ZM47 9h26v49H47Z" fill="currentColor"/><path d="M21 33h78M24 52h72" stroke="currentColor" stroke-width="10"/><path d="M57 19h7v24h-7Z" fill="#a5c4d8"/><g fill="#13212b"><rect x="16" y="17" width="13" height="20" rx="3"/><rect x="91" y="17" width="13" height="20" rx="3"/><rect x="20" y="45" width="14" height="19" rx="3"/><rect x="86" y="45" width="14" height="19" rx="3"/></g>',
};

export function racerThumbnail(type) {
  let key = type?.startsWith('cheese-') ? 'cheese' : type === 'snail' ? 'snail' :
    type === 'eagle' ? 'bird' : type === 'rabbit' ? 'rabbit' : ['bear','fox'].includes(type) ? 'animal' :
    ['x-wing','tie-fighter','falcon'].includes(type) ? 'spacecraft' : type === 'monster-truck' ? 'truck' :
    type === 'f1-2026' ? 'formula' : 'car';
  return `<svg viewBox="0 0 120 70" aria-hidden="true" focusable="false">${shapes[key] || carSilhouette}</svg>`;
}

export const ITEM_VISUALS = Object.freeze({
  boost:['Nitro boost','<path d="m34 5-22 30h16l-7 24 28-33H32Z" fill="#6ae3ff"/>'],
  banana:['Banana','<path d="M39 9c3 19-6 31-28 35 13 17 37 7 39-13 1-9-4-17-11-22Z" fill="#ffe15b" stroke="#caa72d" stroke-width="2"/><path d="m37 8 3-5" stroke="#826434" stroke-width="4"/>'],
  repair:['Repair','<path d="m41 7-8 12-9-5 2-12c-15 6-15 23-5 28L6 48a7 7 0 0 0 10 9l18-20c16 1 22-15 7-30Z" fill="#9ef0b3"/><circle cx="12" cy="51" r="3" fill="#183740"/>'],
  shield:['Shield','<path d="M32 4 10 13v18c0 14 22 28 22 28s22-14 22-28V13Z" fill="#68c3fa" stroke="#d7f2ff" stroke-width="3"/><path d="M32 13v35" stroke="#c1ecff" stroke-width="4"/>'],
  bomb:['Bomb','<circle cx="30" cy="36" r="21" fill="#283542" stroke="#c7d5df" stroke-width="2"/><path d="m36 14 6-9 7 4" stroke="#c3b681" stroke-width="4" fill="none"/><path d="m48 2 3 10 8-6m-3 11 5 3" stroke="#ffb74a" stroke-width="3"/>'],
  missile:['Missile','<path d="M51 6c8 17-9 36-24 37L17 32C20 17 36 4 51 6Z" fill="#edf2f6"/><circle cx="40" cy="19" r="6" fill="#f27667"/><path d="m18 35-11 4 4-14 12-3m5 17-3 13 14-5-2-12" fill="#e96855"/><path d="m13 42-9 17 18-11" fill="#ffce61"/>'],
  launch:['Launch','<path d="m18 47 14-32 14 32Z" fill="#e2a7ff"/><path d="m18 51 14-8 14 8" fill="none" stroke="#f8d6ff" stroke-width="6"/><path d="m17 23 15-16 15 16" fill="none" stroke="#f8d6ff" stroke-width="5"/>'],
  rocket:['Rocket','<path d="M32 3C16 15 17 33 22 42h20c5-9 6-27-10-39Z" fill="#eef3f7"/><circle cx="32" cy="21" r="7" fill="#7bd4ef"/><path d="m21 32-10 15 12-3m19-12 11 15-12-3" fill="#ff7963"/><path d="m26 45 6 16 6-16" fill="#ffcb65"/>'],
  shockwave:['Shockwave','<path d="M9 30c0-28 46-28 46 0Z" fill="#c6b0ff" stroke="#e5d6ff" stroke-width="2"/><path d="M17 31c-7 17 12 16 4 29m11-29c-8 15 10 17 2 27m12-27c8 15-10 17-3 27" fill="none" stroke="#b69bff" stroke-width="4"/>'],
  freeze:['Freeze','<g stroke="#b3efff" stroke-width="4" stroke-linecap="round"><path d="M32 5v54M9 18l46 27M9 45l46-27M25 10l7 7 7-7M25 54l7-7 7 7M11 26l10-3-1-10M44 51l-1-10 10-3M11 38l10 3-1 10M44 13l-1 10 10 3"/></g>'],
});
export function itemThumbnail(type) {
  const body = ITEM_VISUALS[type]?.[1] || '<text x="32" y="48" text-anchor="middle" font-family="system-ui" font-weight="900" font-size="52" fill="#fff4ad">?</text>';
  return `<svg viewBox="0 0 64 64" aria-hidden="true" focusable="false">${body}</svg>`;
}

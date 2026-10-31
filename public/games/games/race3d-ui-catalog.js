import {itemPortrait} from './race3d-item-portraits.js?v=20261031-volume';
import {ALL_ITEM_IDS,ITEM_REGISTRY} from './race3d-item-registry.js?v=20261027-midnight';
import {extraIconSvg} from './race3d-item-icons.js?v=20261027-midnight';
import {CONCEPT_VEHICLE_PROFILES} from './race3d-concept-profiles.js?v=20261027-midnight';
// Names identify the loaded representations; ratings and telemetry below are game values.
export const RACER_CARD_NAMES = Object.freeze({
  ...Object.fromEntries(Object.entries(CONCEPT_VEHICLE_PROFILES).map(([id,profile])=>[id,profile.vehicleName])),
  'f1-2026':'Qvist 2026 Formula concept', gt3:'Race Car 01 LMGT3',
  'car-concept':'CarConcept sports coupe', 'lamborghini-gallardo':'Lamborghini Gallardo 2010',
  'tesla-roadster':'Tesla Roadster 2020 concept',
});

const carSilhouette = '<path d="M9 43 15 32 28 29 39 19h36l16 13 17 3 4 13H8Z" fill="currentColor"/><path d="m42 23-10 9h50l-10-9Z" fill="#add8eb"/><path d="m16 35 14-1m61 3 13 2" stroke="#fff5cb" stroke-width="3"/><path d="M19 45h83" stroke="#101923" stroke-width="4"/><g fill="#111b25" stroke="#6f8190" stroke-width="3"><circle cx="28" cy="46" r="9"/><circle cx="91" cy="46" r="9"/></g>';
const shapes = {
  formula:'<path d="M10 25h17v20H10Zm83 0h17v20H93ZM47 9h26v49H47Z" fill="currentColor"/><path d="M21 33h78M24 52h72" stroke="currentColor" stroke-width="10"/><path d="M57 19h7v24h-7Z" fill="#a5c4d8"/><g fill="#13212b"><rect x="16" y="17" width="13" height="20" rx="3"/><rect x="91" y="17" width="13" height="20" rx="3"/><rect x="20" y="45" width="14" height="19" rx="3"/><rect x="86" y="45" width="14" height="19" rx="3"/></g>',
};

export function racerThumbnail(type) {
  const key = type === 'f1-2026' ? 'formula' : type;
  return `<svg viewBox="0 0 120 70" aria-hidden="true" focusable="false">${shapes[key] || carSilhouette}${type === 'gt3' ? '<path d="M75 20h34v5H75Zm25 5v13" fill="currentColor" stroke="currentColor" stroke-width="3"/>' : type === 'lamborghini-gallardo' ? '<path d="m16 34 25-14h33l21 15-43-5Z" fill="currentColor"/><path d="m41 23-9 8h48l-9-8Z" fill="#b7ddec"/>' : type === 'tesla-roadster' ? '<path d="M42 23h28l10 9H33Z" fill="#101e2b"/><path d="m51 37 12 8 12-8" fill="none" stroke="#f9f4e0" stroke-width="2"/>' : type === 'car-concept' ? '<path d="m18 33 25-17h31l24 20-46-4Z" fill="currentColor"/><path d="m44 21-9 10h46l-12-10Z" fill="#aee4ed"/><path d="M33 39h48" stroke="#eefaff" stroke-width="2"/>' : ''}</svg>`;
}

const BASE_ITEM_VISUALS = {
  boost:['Nitro boost','<path d="m34 5-22 30h16l-7 24 28-33H32Z" fill="#6ae3ff"/>'],
  banana:['Banana','<path d="M39 9c3 19-6 31-28 35 13 17 37 7 39-13 1-9-4-17-11-22Z" fill="#ffe15b" stroke="#caa72d" stroke-width="2"/><path d="m37 8 3-5" stroke="#826434" stroke-width="4"/>'],
  repair:['Repair','<path d="m41 7-8 12-9-5 2-12c-15 6-15 23-5 28L6 48a7 7 0 0 0 10 9l18-20c16 1 22-15 7-30Z" fill="#9ef0b3"/><circle cx="12" cy="51" r="3" fill="#183740"/>'],
  shield:['Shield','<path d="M32 4 10 13v18c0 14 22 28 22 28s22-14 22-28V13Z" fill="#68c3fa" stroke="#d7f2ff" stroke-width="3"/><path d="M32 13v35" stroke="#c1ecff" stroke-width="4"/>'],
  bomb:['Bomb','<circle cx="30" cy="36" r="21" fill="#283542" stroke="#c7d5df" stroke-width="2"/><path d="m36 14 6-9 7 4" stroke="#c3b681" stroke-width="4" fill="none"/><path d="m48 2 3 10 8-6m-3 11 5 3" stroke="#ffb74a" stroke-width="3"/>'],
  missile:['Missile','<path d="M51 6c8 17-9 36-24 37L17 32C20 17 36 4 51 6Z" fill="#edf2f6"/><circle cx="40" cy="19" r="6" fill="#f27667"/><path d="m18 35-11 4 4-14 12-3m5 17-3 13 14-5-2-12" fill="#e96855"/><path d="m13 42-9 17 18-11" fill="#ffce61"/>'],
  launch:['Launch','<path d="m18 47 14-32 14 32Z" fill="#e2a7ff"/><path d="m18 51 14-8 14 8" fill="none" stroke="#f8d6ff" stroke-width="6"/><path d="m17 23 15-16 15 16" fill="none" stroke="#f8d6ff" stroke-width="5"/>'],
  rocket:['Rocket','<path d="M32 3C16 15 17 33 22 42h20c5-9 6-27-10-39Z" fill="#eef3f7"/><circle cx="32" cy="21" r="7" fill="#7bd4ef"/><path d="m21 32-10 15 12-3m19-12 11 15-12-3" fill="#ff7963"/><path d="m26 45 6 16 6-16" fill="#ffcb65"/>'],
  shockwave:['Jellyfish shockwave','<path d="M9 30c0-28 46-28 46 0Z" fill="#c6b0ff" stroke="#e5d6ff" stroke-width="2"/><path d="M17 31c-7 17 12 16 4 29m11-29c-8 15 10 17 2 27m12-27c8 15-10 17-3 27" fill="none" stroke="#b69bff" stroke-width="4"/>'],
  freeze:['Freeze','<g stroke="#b3efff" stroke-width="4" stroke-linecap="round"><path d="M32 5v54M9 18l46 27M9 45l46-27M25 10l7 7 7-7M25 54l7-7 7 7M11 26l10-3-1-10M44 51l-1-10 10-3M11 38l10 3-1 10M44 13l-1 10 10 3"/></g>'],
};
export const ITEM_VISUALS=Object.freeze({...BASE_ITEM_VISUALS,...Object.fromEntries(ALL_ITEM_IDS.filter(id=>!BASE_ITEM_VISUALS[id]).map(id=>[id,[ITEM_REGISTRY[id].label,extraIconSvg(id)]]))});
export function itemThumbnail(type) {
  const body = ITEM_VISUALS[type]?.[1] || '<text x="32" y="48" text-anchor="middle" font-family="system-ui" font-weight="900" font-size="52" fill="#fff4ad">?</text>';
  return itemPortrait(body,ITEM_REGISTRY[type]?.color || '#b8c9ff');
}

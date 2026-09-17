// Deterministic, non-graphic attack targets for the forest encounter.
//
// Coordinates are normalized to the painted boss box: x and y are in the
// range 0..1, with y increasing downwards.  Keeping the landmarks separate
// from the drawing code lets the wolf and every other boss share the same
// encounter choreography without moving their artwork or rig.

export const ATTACK_ZONES = Object.freeze(['stomach', 'head', 'neck', 'arm', 'stomach']);

// Ten readable reaction names give the renderer/audio layer a stable cue while
// keeping all reactions cartoon-like.  They are deliberately pose names, not
// damage descriptions: a hit never detaches a limb or creates blood effects.
export const REACTION_STYLES = Object.freeze([
  'quick-recoil', 'side-snap', 'soft-whiplash', 'corkscrew-wobble',
  'heavy-stagger', 'rubber-neck', 'uppercut-bob', 'double-wobble',
  'limp-sway', 'spring-rebound',
]);

const clamp = value => Math.max(0, Math.min(1, Number.isFinite(value) ? value : 0));
const finite = value => Number.isFinite(value);
const point = (x, y) => Object.freeze({ x: clamp(x), y: clamp(y) });
const clonePoint = p => point(p.x, p.y);

// Traced against the same 1024 x 1536 character artwork used by boss-rigs.js.
// The eyes/mouth in hosts.json are useful for a host-specific head fallback;
// these body landmarks keep arm, neck and stomach positions stable between
// frames even when a face is animated.
const HOST_LANDMARKS = Object.freeze({
  dog:    { head: point(.34, .22), neck: point(.37, .34), arm: point(.63, .48), stomach: point(.50, .60) },
  monkey: { head: point(.48, .21), neck: point(.49, .365), arm: point(.72, .51), stomach: point(.50, .57) },
  parrot: { head: point(.48, .22), neck: point(.49, .35), arm: point(.76, .43), stomach: point(.50, .58) },
  rabbit: { head: point(.44, .20), neck: point(.47, .36), arm: point(.74, .48), stomach: point(.50, .58) },
  cat:    { head: point(.38, .30), neck: point(.49, .445), arm: point(.78, .54), stomach: point(.50, .64) },
  sock:   { head: point(.49, .20), neck: point(.51, .40), arm: point(.76, .50), stomach: point(.50, .62) },
  queen:  { head: point(.49, .16), neck: point(.50, .29), arm: point(.73, .43), stomach: point(.50, .58) },
  elton:  { head: point(.49, .14), neck: point(.49, .27), arm: point(.75, .39), stomach: point(.50, .53) },
  trump:  { head: point(.40, .20), neck: point(.49, .32), arm: point(.75, .45), stomach: point(.50, .59) },
  koala:  { head: point(.45, .28), neck: point(.48, .44), arm: point(.76, .55), stomach: point(.50, .64) },
});

const FALLBACK_LANDMARKS = Object.freeze({
  head: point(.50, .22), neck: point(.50, .36), arm: point(.74, .48), stomach: point(.50, .59),
});

function hostIdOf(hostOrId) {
  return typeof hostOrId === 'string' ? hostOrId : hostOrId?.id;
}

function averageEyes(host) {
  const eyes = host?.eyes;
  if (!Array.isArray(eyes) || eyes.length === 0) return null;
  const usable = eyes.filter(pair => Array.isArray(pair) && finite(pair[0]) && finite(pair[1]));
  if (!usable.length) return null;
  return point(usable.reduce((sum, pair) => sum + pair[0], 0) / usable.length,
    usable.reduce((sum, pair) => sum + pair[1], 0) / usable.length + .035);
}

/**
 * Return a fresh set of normalized landmarks for a host id or hosts.json row.
 * The optional row allows the face landmarks in hosts.json to refine the head
 * center while body targets remain host-specific and deterministic.
 */
export function getBossLandmarks(hostOrId, host = typeof hostOrId === 'object' ? hostOrId : null) {
  const base = HOST_LANDMARKS[hostIdOf(hostOrId)] || FALLBACK_LANDMARKS;
  const head = averageEyes(host) || base.head;
  return Object.freeze({
    head: clonePoint(head),
    neck: clonePoint(base.neck),
    arm: clonePoint(base.arm),
    stomach: clonePoint(base.stomach),
  });
}

function targetRadius(zone, hostId) {
  const scale = hostId === 'sock' ? 1.2 : hostId === 'queen' ? .9 : 1;
  return { head: .095, neck: .075, arm: .085, stomach: .13 }[zone] * scale;
}

/** Return the target id for a zero-based encounter beat. */
export function attackZoneAt(beat = 0) {
  const index = Math.max(0, Math.floor(Number(beat) || 0));
  return ATTACK_ZONES[index % ATTACK_ZONES.length];
}

/**
 * Resolve one attack target. `side` alternates so repeated arm beats do not
 * always land on the same painted limb.  `point` is local to the boss box.
 */
export function getAttackTarget(hostOrId, beat = 0, host = typeof hostOrId === 'object' ? hostOrId : null) {
  const id = hostIdOf(hostOrId) || 'unknown';
  const zone = attackZoneAt(beat);
  const landmarks = getBossLandmarks(hostOrId, host);
  const side = zone === 'arm' ? (Math.floor(Number(beat) || 0) % 2 ? 'left' : 'right') : 'center';
  const offset = zone === 'arm' && side === 'left' ? -.08 : zone === 'arm' ? .08 : 0;
  const center = landmarks[zone];
  const targetPoint = point(center.x + offset, center.y);
  return Object.freeze({
    hostId: id,
    beat: Math.max(0, Math.floor(Number(beat) || 0)),
    zone,
    label: zone[0].toUpperCase() + zone.slice(1),
    side,
    point: targetPoint,
    radius: targetRadius(zone, id),
    landmarks,
  });
}

/** Build a deterministic attack sequence for a full five-beat encounter. */
export function createAttackSequence(hostOrId, count = ATTACK_ZONES.length, startBeat = 0, host = typeof hostOrId === 'object' ? hostOrId : null) {
  const total = Math.max(0, Math.floor(Number(count) || 0));
  const start = Math.max(0, Math.floor(Number(startBeat) || 0));
  return Object.freeze(Array.from({ length: total }, (_, i) => getAttackTarget(hostOrId, start + i, host)));
}

/** Convert a normalized target to scene/world coordinates. */
export function targetWorldPoint(target, box) {
  if (!target?.point || !box || ![box.x, box.y, box.w, box.h].every(finite)) return null;
  return Object.freeze({ x: box.x + target.point.x * box.w, y: box.y + target.point.y * box.h });
}

// Zone-specific pose parameters. Values are intentionally modest and
// reversible: the renderer can exaggerate them, but never needs to represent
// dismemberment, blood, or a permanent state change.
const ZONE_POSES = Object.freeze({
  head:    { rotation: -.62, sway: .16, squash: 1,    stretch: 1.04, duration: .32, cue: 'impact-head' },
  neck:    { rotation: .34,  sway: .28, squash: .98, stretch: 1.03, duration: .38, cue: 'impact-neck' },
  arm:     { rotation: .52,  sway: .12, squash: 1,    stretch: 1.08, duration: .30, cue: 'impact-arm' },
  stomach: { rotation: 0,    sway: .08, squash: .90, stretch: 1.02, duration: .42, cue: 'impact-stomach' },
});

/**
 * Get a reversible, cartoon reaction for a resolved target or zone id.
 * `variant` selects one of ten motion styles; `gentle` scales the pose down.
 */
export function reactionForTarget(targetOrZone, variant = 0, gentle = false) {
  const zone = typeof targetOrZone === 'string' ? targetOrZone : targetOrZone?.zone;
  const key = ZONE_POSES[zone] ? zone : 'stomach';
  const base = ZONE_POSES[key];
  const index = Math.max(0, Math.floor(Number(variant) || 0));
  const amount = gentle ? .38 : 1;
  const wiggle = [1, -.8, 1.12, -.92, .72, .88, -.72, .64, 1.05, -.86][index % 10];
  return Object.freeze({
    zone: key,
    style: REACTION_STYLES[index % REACTION_STYLES.length],
    rotation: base.rotation * wiggle * amount,
    sway: base.sway * (1 + (index % 3) * .12) * amount,
    squash: 1 - (1 - base.squash) * amount,
    stretch: 1 + (base.stretch - 1) * amount,
    duration: base.duration,
    cue: base.cue,
    reversible: true,
    detach: false,
    blood: false,
  });
}

// Short aliases make the module easy to wire into the existing encounter loop.
export const attackTargetAt = getAttackTarget;
export const targetReaction = reactionForTarget;


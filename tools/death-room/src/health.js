// Shared game health. The owner of the round still owns selection, actor.alive,
// movement and the death/reveal sequence; this module never writes any of them.
const MAX_HEALTH = 100;
const SURVIVOR_MIN = 8;
const FATAL_PROGRESS = 0.97;
const REFERENCE_DURATION = 20;
const HIT_INTERVAL = 0.12;
const EXPOSURE_INTERVAL = 0.25;
const ACTIVE_PHASES = new Set(['running', 'reveal']);
const NATIVE_DAMAGE = Object.freeze({ bite: 6, 'electric-strike': 9, impact: 7 });
const AMBIENT_KIND = Object.freeze({ boiler: 'heat', gas: 'poison', freeze: 'cold', flood: 'water' });

const clamp = (value, low, high) => Math.max(low, Math.min(high, value));
const finite = value => typeof value === 'number' && Number.isFinite(value);
const keyOf = id => id === undefined || id === null ? null : String(id);
const active = state => !!state && ACTIVE_PHASES.has(state.phase) && state.paused !== true;
const progressOf = state => finite(state?.progress) ? clamp(state.progress, 0, 1) : 0;
const stageOf = hp => hp <= 0 ? 'dead' : hp <= 25 ? 'critical' : hp <= 60 ? 'wounded' : hp <= 85 ? 'hurt' : 'healthy';

function copyPosition(value, actor) {
  const source = value ?? actor?.position;
  if (Array.isArray(source) && source.length >= 3 && source.slice(0, 3).every(finite)) return source.slice(0, 3);
  if (source && [source.x, source.y, source.z].every(finite)) return [source.x, source.y, source.z];
  return null;
}

function durationOf(state) {
  for (const value of [state?.durationSeconds, state?.duration, state?.roundDuration]) {
    if (finite(value) && value > 0) return clamp(value, 5, 120);
  }
  // Read the supplied state on each apply: room events arrive before update().
  if (state?.phase === 'running' && finite(state.elapsed) && state.elapsed > 0 && progressOf(state) > 0) {
    return clamp(state.elapsed / progressOf(state), 5, 120);
  }
  return null;
}

function readDose(type, payload) {
  for (const field of ['damageHP', 'damage', 'amount']) {
    if (Object.prototype.hasOwnProperty.call(payload, field)) {
      return finite(payload[field]) && payload[field] > 0 ? payload[field] : 0;
    }
  }
  // A native hit is contact evidence even if its producer leaves damage optional.
  // Generic room effects are not damage unless a positive HP amount is declared.
  return NATIVE_DAMAGE[type] ?? 0;
}

/**
 * createHealthSystem({ actors, onInjury, random? })
 *
 * Apply room events before update(dt, state). Pass the CURRENT state to apply.
 * state.victimIds (Set/array), or state.selectedId, is the sole selection source.
 * state.fatalReady === false holds even a selected, exposed actor above zero.
 * state.durationSeconds/duration is recommended; running elapsed/progress can
 * infer it. Declared HP doses are trusted as already paced by each scenario;
 * only the small missing-event ambient fallback uses duration normalization.
 *
 * Health objects are stable, enumerable, read-only views. Hit callbacks coalesce
 * micro-hits at bounded rates and include `hits` and `damage` so no accepted hit
 * is silently discarded. Stage transitions and final zero notify immediately.
 */
export function createHealthSystem({ actors = [], onInjury = () => {}, random = Math.random } = {}) {
  const records = new Map();
  let disposed = false;
  let simulationTime = 0;
  let roundDuration = REFERENCE_DURATION;
  let selectedKey = null;
  let fatalKey = null;
  let currentState = null;
  let totalEvents = 0;
  let fallbackEvents = 0;
  let callbackCount = 0;
  let callbackErrors = 0;
  let totalApplied = 0;

  const randomUnit = () => {
    const n = random();
    return finite(n) ? clamp(n, 0, 1 - Number.EPSILON) : 0.5;
  };

  function release(record) {
    if (record.actor.health !== record.view) return;
    if (record.previousDescriptor) Object.defineProperty(record.actor, 'health', record.previousDescriptor);
    else delete record.actor.health;
  }

  function makeRecord(actor) {
    const data = { current: MAX_HEALTH, max: MAX_HEALTH, ratio: 1, stage: 'healthy', damageTaken: 0, lastKind: null };
    const view = {};
    for (const name of Object.keys(data)) {
      Object.defineProperty(view, name, { enumerable: true, get: () => data[name] });
    }
    Object.freeze(view);
    const previousDescriptor = Object.getOwnPropertyDescriptor(actor, 'health');
    const record = {
      actor, data, view, previousDescriptor,
      sensitivity: 1, selectedSensitivity: 1, survivalFloor: SURVIVOR_MIN,
      realExposure: 0, fallbackExposure: 0, lastRealTime: -Infinity,
      lastRealKind: null, lastRealPosition: null, pending: null,
      lastCallback: -Infinity, fatal: false,
    };
    Object.defineProperty(actor, 'health', { value: view, enumerable: true, configurable: true, writable: false });
    randomize(record);
    return record;
  }

  function randomize(record) {
    record.sensitivity = 0.88 + randomUnit() * 0.26;
    record.selectedSensitivity = 1.35 + randomUnit() * 0.35;
    // All survivors keep at least 8 HP. Different reserves avoid a uniform row
    // of identical 8-HP survivors after an unusually large room-wide impact.
    record.survivalFloor = SURVIVOR_MIN + randomUnit() * 8;
  }

  function syncActors() {
    const present = new Set();
    for (const actor of actors) {
      const key = keyOf(actor?.id);
      if (!actor || key === null || present.has(key)) continue;
      present.add(key);
      let record = records.get(key);
      if (record && record.actor !== actor) {
        release(record);
        records.delete(key);
        record = null;
      }
      if (!record && (actor.alive !== false || actor.invincible === true)) records.set(key, makeRecord(actor));
    }
    for (const [key, record] of records) {
      if (!present.has(key)) {
        release(record);
        records.delete(key);
      }
    }
  }

  function useState(state) {
    currentState = state ?? currentState;
    const duration = durationOf(currentState);
    if (duration !== null) roundDuration = duration;
    if (finite(currentState?.elapsed)) simulationTime = Math.max(simulationTime, currentState.elapsed);
    const ids = currentState?.victimIds;
    const choices = ids instanceof Set || Array.isArray(ids) ? ids : [currentState?.selectedId];
    selectedKey = null;
    // Even a malformed multi-selection state can produce only one fatal actor.
    for (const id of choices) {
      const key = keyOf(id);
      const record = records.get(key);
      if (record && record.actor.alive !== false && record.actor.invincible !== true) {
        selectedKey = key;
        break;
      }
    }
    return currentState;
  }

  function writeHealth(record, hp, kind) {
    const data = record.data;
    data.current = clamp(hp, 0, MAX_HEALTH);
    data.ratio = data.current / MAX_HEALTH;
    data.stage = stageOf(data.current);
    data.damageTaken = MAX_HEALTH - data.current;
    data.lastKind = kind;
  }

  function flush(record) {
    if (!record.pending) return;
    const info = record.pending;
    record.pending = null;
    record.lastCallback = simulationTime;
    callbackCount++;
    try {
      onInjury(record.actor, {
        ...info,
        stage: record.data.stage,
        ratio: record.data.ratio,
        position: info.position?.slice() ?? null,
      });
    } catch (error) {
      // Visual consumers cannot corrupt authoritative health or prevent the
      // remaining students from receiving their actual exposure damage.
      callbackErrors++;
    }
  }

  function notify(record, { type, kind, amount, intensity, position, fallback }, changedStage) {
    const pending = record.pending;
    record.pending = {
      type, kind, position,
      eventType: type,
      stageChanged: changedStage || pending?.stageChanged || false,
      intensity: Math.max(pending?.intensity ?? 0, intensity),
      damage: (pending?.damage ?? 0) + amount,
      hits: (pending?.hits ?? 0) + 1,
      fallback: !!fallback && (pending?.fallback ?? true),
    };
    const interval = type === 'damage' ? EXPOSURE_INTERVAL : HIT_INTERVAL;
    if (changedStage || record.data.current === 0 || simulationTime - record.lastCallback >= interval) flush(record);
  }

  function takeDamage(record, amount, { type, kind, position, intensity = 0, fallback = false }, state) {
    if (record.fatal || record.actor.alive === false || record.actor.invincible === true) return 0;
    const selected = keyOf(record.actor.id) === selectedKey && fatalKey === null;
    const canDie = selected && !fallback && fatalKey === null && progressOf(state) >= FATAL_PROGRESS && state.fatalReady !== false;
    const floor = selected ? (canDie ? 0 : 1) : record.survivalFloor;
    const oldStage = record.data.stage;
    const before = record.data.current;
    const after = Math.max(floor, before - amount);
    const applied = Math.max(0, before - after);
    if (!fallback) {
      record.realExposure += amount;
      record.lastRealTime = simulationTime;
      record.lastRealKind = kind;
      record.lastRealPosition = position;
    } else record.fallbackExposure += amount;
    if (applied > 0) {
      writeHealth(record, after, kind);
      totalApplied += applied;
      record.fatal = after === 0;
      if (record.fatal) fatalKey = keyOf(record.actor.id);
    }
    // Real contacts still produce bounded injury feedback at the survival floor.
    notify(record, {
      type, kind, position, amount: applied, fallback,
      intensity: clamp(Math.max(intensity, applied / 18, 0.08), 0, 1),
    }, record.data.stage !== oldStage);
    return applied;
  }

  function ambientExposure(record, state, dt) {
    const kind = AMBIENT_KIND[state.scenarioId];
    if (!kind || state.hazardActive === false || progressOf(state) < 0.12 || dt <= 0) return;
    // Wait for the scenario's own event stream. This is a small safety net for
    // missing ambient producers, never a second damage stream on top of them.
    const grace = Math.max(0.6, roundDuration * 0.07);
    if (simulationTime < grace || simulationTime - record.lastRealTime < grace || record.fallbackExposure >= 14) return;
    if (kind === 'water') {
      const feetY = finite(record.actor.position?.y) ? record.actor.position.y : 0;
      if (!finite(state.waterLevel) || state.waterLevel < feetY + 0.25) return;
    }
    const dose = Math.min(14 - record.fallbackExposure, dt * (REFERENCE_DURATION / roundDuration) * 1.05 * record.sensitivity);
    if (dose <= 0) return;
    fallbackEvents++;
    takeDamage(record, dose, {
      type: 'damage', kind, position: copyPosition(null, record.actor), fallback: true,
    }, state);
  }

  function reset(state = {}) {
    if (disposed) return;
    syncActors();
    simulationTime = finite(state.elapsed) ? Math.max(0, state.elapsed) : 0;
    roundDuration = durationOf(state) ?? REFERENCE_DURATION;
    totalEvents = fallbackEvents = callbackCount = callbackErrors = totalApplied = 0;
    fatalKey = null;
    for (const record of records.values()) {
      record.pending = null;
      record.lastCallback = -Infinity;
      record.realExposure = record.fallbackExposure = 0;
      record.lastRealTime = -Infinity;
      record.lastRealKind = null;
      record.lastRealPosition = null;
      record.fatal = false;
      randomize(record);
      if (record.actor.alive !== false || record.actor.invincible === true) writeHealth(record, MAX_HEALTH, null);
    }
    useState(state);
  }

  function apply(type, payload = {}, state = currentState) {
    if (disposed || !active(state) || !['damage', 'bite', 'electric-strike', 'impact'].includes(type)) return 0;
    if (!payload || typeof payload !== 'object') return 0;
    syncActors();
    useState(state);
    const record = records.get(keyOf(payload.actorId));
    if (!record || record.actor.alive === false || record.actor.invincible === true || payload.invincible === true || record.fatal) return 0;
    const rawDose = readDose(type, payload);
    if (rawDose <= 0) return 0;
    const selected = keyOf(record.actor.id) === selectedKey && fatalKey === null;
    const multiplier = record.sensitivity * (selected ? record.selectedSensitivity : 1);
    const dose = Math.min(rawDose, 10000) * multiplier;
    const kind = typeof payload.kind === 'string' && payload.kind ? payload.kind : type === 'electric-strike' ? 'electric' : type;
    totalEvents++;
    return takeDamage(record, dose, {
      type, kind, position: copyPosition(payload.position, record.actor),
      intensity: finite(payload.intensity) ? clamp(payload.intensity, 0, 1) : 0,
    }, state);
  }

  function update(dt, state = currentState) {
    if (disposed || !active(state)) return;
    syncActors();
    const hasElapsed = finite(state.elapsed);
    useState(state);
    const step = finite(dt) && dt > 0 ? Math.min(dt, 0.25) : 0;
    if (!hasElapsed) simulationTime += step;
    for (const record of records.values()) {
      if (record.actor.alive === false || record.actor.invincible === true || record.fatal) continue;
      ambientExposure(record, state, step);
      if (record.pending && simulationTime - record.lastCallback >= (record.pending.type === 'damage' ? EXPOSURE_INTERVAL : HIT_INTERVAL)) flush(record);
    }
    const selected = records.get(selectedKey);
    // The final beat is the culmination of a real recorded exposure. Time alone
    // and synthetic missing-event fallback can NEVER authorize an elimination.
    if (selected && fatalKey === null && !selected.fatal && selected.realExposure > 0 && progressOf(state) >= 1 && state.fatalReady !== false) {
      takeDamage(selected, selected.data.current, {
        type: 'damage', kind: selected.lastRealKind ?? 'damage',
        position: selected.lastRealPosition ?? copyPosition(null, selected.actor), intensity: 1,
      }, state);
    }
  }

  function get(actorId) {
    return disposed ? undefined : records.get(keyOf(actorId))?.view;
  }

  syncActors();
  return {
    reset, apply, update, get,
    get stats() {
      const list = [...records.values()];
      const living = list.filter(r => r.actor.alive !== false && r.actor.invincible !== true);
      const fatalIds = list.filter(r => r.fatal).map(r => r.actor.id);
      return Object.freeze({
        activeCount: living.length,
        injuredCount: living.filter(r => r.data.current < MAX_HEALTH).length,
        criticalCount: living.filter(r => r.data.stage === 'critical').length,
        fatalCount: fatalIds.length,
        fatalIds: Object.freeze(fatalIds),
        fatalActorId: fatalIds[0] ?? null,
        eventCount: totalEvents, fallbackEventCount: fallbackEvents,
        callbackCount, callbackErrors, totalDamage: totalApplied,
        durationSeconds: roundDuration,
      });
    },
    dispose() {
      if (disposed) return;
      for (const record of records.values()) release(record);
      records.clear();
      currentState = null;
      disposed = true;
    },
  };
}

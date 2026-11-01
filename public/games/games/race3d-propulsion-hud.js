/** Focused-car propulsion readout. Pass the race HUD section as root. */
export function createPropulsionHud(root, { reducedMotion = false } = {}) {
  if (!root || typeof root.querySelector !== 'function') throw new TypeError('createPropulsionHud requires the race HUD root');
  const stats = root.matches?.('.race3d-stats') ? root : root.querySelector('.race3d-stats');
  if (!stats) throw new TypeError('createPropulsionHud requires .race3d-stats');
  const doc = stats.ownerDocument;
  const style = doc.createElement('style');
  style.textContent = `
.race3d-propulsion{grid-column:1/-1;display:flex;align-items:center;justify-content:center;gap:4px;min-width:0;padding:4px 6px 6px;border-top:1px solid rgb(255 255 255 / 13%);font:700 10px/1.2 system-ui,sans-serif;pointer-events:none}
.race3d-propulsion[hidden],.race3d-propulsion-chip[hidden]{display:none}
.race3d-propulsion-chip{display:inline-flex;align-items:center;gap:3px;min-width:0;padding:3px 5px;border:1px solid;border-radius:5px;white-space:nowrap;font-variant-numeric:tabular-nums;letter-spacing:.2px}
.race3d-propulsion-chip[data-kind=nitro]{color:#c8f6ff;border-color:#5ccae3;background:#103f55}
.race3d-propulsion-chip[data-kind=rocket]{color:#fff0cf;border-color:#efa866;background:#553416}
.race3d-propulsion-chip[data-kind=draft]{color:#d8ffec;border-color:#73d5a4;background:#163e32}
.race3d-propulsion-mark{font-size:10px;line-height:1}
@media(max-width:700px),(max-height:480px){.race3d-propulsion{gap:3px;padding:3px 3px 4px;font-size:9px}.race3d-propulsion-chip{gap:2px;padding:3px}.race3d-propulsion-mark{font-size:9px}}
`;
  const panel = doc.createElement('div');
  panel.className = 'race3d-propulsion';
  panel.hidden = true;
  panel.setAttribute('role', 'group');
  panel.setAttribute('aria-label', 'Followed car propulsion');
  if (reducedMotion) panel.dataset.reducedMotion = 'true';
  const chip = (kind, mark, label) => {
    const node = doc.createElement('span'); node.className = 'race3d-propulsion-chip'; node.dataset.kind = kind; node.hidden = true;
    const symbol = doc.createElement('span'); symbol.className = 'race3d-propulsion-mark'; symbol.textContent = mark; symbol.setAttribute('aria-hidden', 'true');
    const text = doc.createElement('span'); text.textContent = label; node.append(symbol, text); panel.append(node);
    return { node, text };
  };
  const nitro = chip('nitro', '◆', 'NITRO');
  const rocket = chip('rocket', '▲', 'ROCKET');
  const draft = chip('draft', '≋', 'DRAFT');
  stats.append(style, panel);
  let disposed = false;
  let state = { visible: false, nitro: false, rocket: false, draft: 0 };
  const num = value => Number.isFinite(Number(value)) ? Number(value) : 0;
  function reset() {
    state = { visible: false, nitro: false, rocket: false, draft: 0 };
    panel.hidden = true; nitro.node.hidden = rocket.node.hidden = draft.node.hidden = true;
    draft.text.textContent = 'DRAFT';
    panel.setAttribute('aria-label', 'Followed car propulsion');
  }
  function update(car, { active = true, quality } = {}) {
    if (disposed) return;
    if (!active || !car || car.finished) { reset(); return; }
    // Acceleration is the applied force, unlike a held item or remaining timer.
    // Explicit EMP/air guards avoid stale acceleration values on transitions.
    const emp = num(car.itemEffects?.emp) > 0;
    const airborne = num(car.flightRemaining) > 0;
    const nitroActive = !emp && !airborne &&
      (num(car.nitroAcceleration) > 0.001 || num(car.spontaneousNitroAcceleration) > 0.001);
    const rocketActive = !emp && (num(car.rocketAcceleration) > 0.001 || num(car.rocketVectorThrust) > 0.001);
    const strength = Math.max(0, Math.min(1, num(car.draft)));
    // Quantization keeps the readout stable at frame rate while remaining useful.
    const percent = strength > 0.01 ? Math.max(5, Math.round(strength * 20) * 5) : 0;
    state = { visible: nitroActive || rocketActive || percent > 0, nitro: nitroActive, rocket: rocketActive, draft: percent };
    nitro.node.hidden = !nitroActive; rocket.node.hidden = !rocketActive; draft.node.hidden = !percent;
    if (percent) draft.text.textContent = `DRAFT ${percent}%`;
    panel.hidden = !state.visible;
    const parts = [];
    if (nitroActive) parts.push('Nitro active');
    if (rocketActive) parts.push('Rocket active');
    if (percent) parts.push(`Slipstream ${percent} percent`);
    panel.setAttribute('aria-label', parts.length ? `Followed car: ${parts.join(', ')}` : 'Followed car propulsion');
  }
  function dispose() { if (disposed) return; reset(); panel.remove(); style.remove(); disposed = true; }
  function snapshot() { return { ...state, disposed }; }
  return { update, reset, dispose, snapshot };
}

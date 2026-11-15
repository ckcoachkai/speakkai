import { Vector3 } from 'three';

const CARD_WIDTH = 80;
const CARD_HEIGHT = 18;
const GAP = 3;
const INSET = 5;
const OFFSETS = [0, -20, 20, -40, 40].flatMap(x => [0, -27, 27, -40, 40].map(y => ({
  x, y, cost: x * x + y * y + (y > 0 ? 400 : 0),
}))).sort((a, b) => a.cost - b.cost);
const STYLE = `
.dr-healthHud{position:absolute;inset:0;overflow:hidden;pointer-events:none;user-select:none;contain:layout style;isolation:isolate}
.dr-healthHud[hidden],.dr-healthHud__card[hidden]{display:none!important}
.dr-healthHud__leaders{position:absolute;inset:0;overflow:visible;pointer-events:none}
.dr-healthHud__leader{stroke:#d4bb83;stroke-width:1;stroke-opacity:.35;fill:none}
.dr-healthHud__card{position:absolute;left:0;top:0;width:80px;height:18px;box-sizing:border-box;padding:2px 5px;border:1px solid #c8aa6844;border-radius:3px;background:#0b141bd9;color:#eee8d9;font:600 10px/12px Inter,Segoe UI,Arial,sans-serif;text-align:center;white-space:nowrap;will-change:transform;contain:layout style;overflow:hidden;text-overflow:ellipsis}
`;


const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

/**
 * Screen-space health for the mutable character-system actor array. The owner
 * calls update after moving the camera. Pass phase:'paused' or paused:true to
 * freeze the health animation while allowing the labels to follow the camera.
 * This module never changes actors, health or the supplied container. Its card
 * is the visible name label; the owner hides its legacy separate name labels.
 */
export function createHealthHUD({ container, actors, camera, viewport = container }) {
  if (!container?.ownerDocument || !viewport || !camera) {
    throw new TypeError('Health HUD requires a container, viewport and camera.');
  }
  const document = container.ownerDocument;
  const style = document.createElement('style');
  style.dataset.deathRoomHealthHud = '';
  style.textContent = STYLE;
  (document.head || container).appendChild(style);
  const layer = document.createElement('div');
  layer.className = 'dr-healthHud';
  layer.setAttribute('role', 'group');
  layer.setAttribute('aria-label', 'Participant names');
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.classList.add('dr-healthHud__leaders');
  svg.setAttribute('aria-hidden', 'true');
  layer.appendChild(svg);
  container.appendChild(layer);

  const entries = new Map();
  const head = new Vector3();
  const crown = new Vector3();
  const viewPosition = new Vector3();
  const candidates = [];
  let disposed = false;
  let visible = true;
  let mode = 'all';
  let frame = 0;
  let lastWidth = -1;
  let lastHeight = -1;

  function element(className, parent) {
    const node = document.createElement('span');
    node.className = className;
    parent.appendChild(node);
    return node;
  }

  function makeEntry(actor) {
    const card = document.createElement('div');
    card.className = 'dr-healthHud__card';
    card.dataset.actorId = String(actor.id);
    card.hidden = true;
    const nameNode = element('dr-healthHud__name', card);
    const leader = document.createElementNS(svg.namespaceURI, 'line');
    leader.classList.add('dr-healthHud__leader');
    leader.style.display = 'none';
    svg.appendChild(leader); layer.appendChild(card);
    const entry = {actor,card,nameNode,leader,seen:frame,lastName:'',lastTransform:'',lastLeader:'',lastOffsets:'',x:0,y:0,depth:0,naturalX:0,naturalY:0};
    entries.set(actor.id,entry); return entry;
  }

  function removeEntry(entry) {
    entry.card.remove();
    entry.leader.remove();
  }

  function hide(entry) {
    if (!entry.card.hidden) entry.card.hidden = true;
    if (entry.leader.style.display !== 'none') entry.leader.style.display = 'none';
  }

  function sampleName(entry) {
    const name = String(entry.actor.name ?? entry.actor.id ?? 'Participant');
    if (name === entry.lastName) return;
    entry.nameNode.textContent = name;
    entry.card.title = name;
    entry.card.setAttribute('aria-label',name);
    entry.lastName = name;
  }

  function overlapArea(a, b) {
    const x = Math.max(0, Math.min(a.x + CARD_WIDTH + GAP, b.x + CARD_WIDTH + GAP) - Math.max(a.x, b.x));
    const y = Math.max(0, Math.min(a.y + CARD_HEIGHT + GAP, b.y + CARD_HEIGHT + GAP) - Math.max(a.y, b.y));
    return x * y;
  }

  function layout(width, height) {
    const maxX = Math.max(INSET, width - CARD_WIDTH - INSET);
    const maxY = Math.max(INSET, height - CARD_HEIGHT - INSET);
    for (const entry of candidates) {
      entry.baseX = clamp(entry.naturalX - CARD_WIDTH / 2, INSET, maxX);
      entry.baseY = clamp(entry.naturalY, INSET, maxY);
      entry.choices = OFFSETS.map(offset => ({ entry,
        x: Math.round(clamp(entry.baseX + offset.x, INSET, maxX)),
        y: Math.round(clamp(entry.baseY + offset.y, INSET, maxY)), cost: offset.cost,
      }));
    }
    // Try a few stable orders rather than sending a late card far from its
    // character. Every option remains within 40 px of the natural head label.
    const orders = [
      candidates,
      [...candidates].sort((a, b) => a.naturalY - b.naturalY),
      [...candidates].sort((a, b) => b.naturalY - a.naturalY),
      [...candidates].sort((a, b) => a.naturalX - b.naturalX),
      [...candidates].sort((a, b) => b.naturalX - a.naturalX),
      ...candidates.slice(1).map((_, index) => candidates.slice(index + 1).concat(candidates.slice(0, index + 1))),
    ];
    let best = null;
    for (const order of orders) {
      const positions = [];
      let score = 0;
      for (const entry of order) {
        let choice = null;
        let choiceScore = Infinity;
        for (const option of entry.choices) {
          const overlap = positions.reduce((total, other) => total + overlapArea(option, other), 0);
          if (overlap && mode === 'auto') continue;
          const optionScore = option.cost + overlap * 1000;
          if (optionScore < choiceScore) { choice = option; choiceScore = optionScore; }
          if (!overlap) break;
        }
        if (choice) { positions.push(choice); score += choiceScore; }
      }
      if (!best || positions.length > best.positions.length || (positions.length === best.positions.length && score < best.score)) best = { positions, score };
    }
    const shown = new Set(best?.positions.map(position => position.entry));
    for (const entry of candidates) if (!shown.has(entry)) hide(entry);
    for (const position of best?.positions || []) place(position, width, height);
  }

  function place(position, width, height) {
    const { entry, x, y } = position;
    entry.x = x;
    entry.y = y;
    const offsetX = entry.x - entry.baseX;
    const offsetY = entry.y - entry.baseY;
    const offsets = `${Math.round(offsetX)},${Math.round(offsetY)}`;
    if (offsets !== entry.lastOffsets) {
      entry.card.dataset.offsetX = String(Math.round(offsetX));
      entry.card.dataset.offsetY = String(Math.round(offsetY));
      entry.lastOffsets = offsets;
    }
    const transform = `translate3d(${x}px,${y}px,0)`;
    if (transform !== entry.lastTransform) entry.card.style.transform = entry.lastTransform = transform;
    if (entry.card.hidden) entry.card.hidden = false;
    const displaced = Math.hypot(offsetX, offsetY) > 20;
    const x2 = Math.round(clamp(entry.naturalX, INSET, width - INSET));
    const y2 = Math.round(clamp(entry.naturalY + CARD_HEIGHT + 4, INSET, height - INSET));
    const x1 = Math.round(clamp(x2, x + 4, x + CARD_WIDTH - 4));
    const y1 = y2 < y ? y : y2 > y + CARD_HEIGHT ? y + CARD_HEIGHT : y2;
    if (displaced && Math.hypot(x2 - x1, y2 - y1) > 3) {
      const leaderKey = `${x1},${y1},${x2},${y2}`;
      if (leaderKey !== entry.lastLeader) {
        entry.leader.setAttribute('x1', String(x1)); entry.leader.setAttribute('y1', String(y1));
        entry.leader.setAttribute('x2', String(x2)); entry.leader.setAttribute('y2', String(y2));
        entry.lastLeader = leaderKey;
      }
      if (entry.leader.style.display !== '') entry.leader.style.display = '';
    } else if (entry.leader.style.display !== 'none') entry.leader.style.display = 'none';
  }

  function setMode(value) {
    if (disposed) return;
    if (!['auto', 'all', 'off'].includes(value)) return;
    mode = value;
    visible = mode !== 'off';
    layer.hidden = !visible;
    layer.dataset.mode = mode;
  }

  function setVisible(value) {
    // Backwards-compatible boolean integration uses all labels when enabled.
    setMode(value ? 'all' : 'off');
  }

  function update(dt = 0, state = {}) {
    if (disposed) return;
    // Read the viewport once, before any DOM writes. No per-label measurements,
    // window size assumptions, observers, timers or animation-frame ownership.
    const width = viewport.clientWidth;
    const height = viewport.clientHeight;
    const paused = state.paused === true || state.phase === 'paused';
    const step = paused ? 0 : clamp(Number.isFinite(dt) ? dt : 0, 0, .1);
    frame++;
    candidates.length = 0;
    if (width !== lastWidth || height !== lastHeight) {
      svg.setAttribute('width', String(width)); svg.setAttribute('height', String(height));
      lastWidth = width; lastHeight = height;
    }
    camera.updateMatrixWorld();
    for (const actor of actors || []) {
      if (!actor) continue;
      let entry = entries.get(actor.id);
      if (entry && entry.actor !== actor) {
        removeEntry(entry); entries.delete(actor.id); entry = null;
      }
      entry ||= makeEntry(actor);
      entry.seen = frame;
      // Eliminated actors no longer need a name label.
      if (actor.alive === false || actor.root?.visible === false) { hide(entry); continue; }
      sampleName(entry);
      if (!visible || width < CARD_WIDTH + INSET * 2 || height < CARD_HEIGHT + INSET * 2) { hide(entry); continue; }
      if (actor.headAnchor?.getWorldPosition) actor.headAnchor.getWorldPosition(head);
      else if (actor.root?.getWorldPosition) { actor.root.getWorldPosition(head); head.y += 1.65; }
      else if (actor.position) { head.copy(actor.position); head.y += 1.65; }
      else { hide(entry); continue; }
      viewPosition.copy(head).applyMatrix4(camera.matrixWorldInverse);
      if (!Number.isFinite(viewPosition.z) || viewPosition.z >= 0) { hide(entry); continue; }
      crown.copy(head); crown.y += .2; crown.project(camera);
      head.project(camera);
      if (![head.x, head.y, head.z].every(Number.isFinite)
        || head.z < -1 || head.z > 1 || Math.abs(head.x) > 1 || Math.abs(head.y) > 1) { hide(entry); continue; }
      const headX = (head.x * .5 + .5) * width;
      const top = (-crown.y * .5 + .5) * height - CARD_HEIGHT - 4;
      entry.naturalX = headX;
      entry.naturalY = top;
      entry.depth = head.z;
      candidates.push(entry);
    }
    for (const [id, entry] of entries) {
      if (entry.seen !== frame) { removeEntry(entry); entries.delete(id); }
    }
    // Nearer actors retain the closest anchors; ID tie-breaking is stable.
    candidates.sort((a, b) => a.depth - b.depth || String(a.actor.id).localeCompare(String(b.actor.id)));
    layout(width, height);
  }

  function reset() {
    if (disposed) return;
    for (const entry of entries.values()) removeEntry(entry);
    entries.clear();
    candidates.length = 0;
  }

  function dispose() {
    if (disposed) return;
    reset();
    disposed = true;
    layer.remove();
    style.remove();
  }

  return { update, reset, setVisible, setMode, dispose };
}

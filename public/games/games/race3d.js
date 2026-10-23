import * as THREE from '../assets/vendor/three.module.js';
import { createRaceTrack } from './race3d-track.js';
import { createRaceCars } from './race3d-cars.js';
import { createRaceSimulation } from './race3d-physics.js';
import { createChaseCamera } from './race3d-camera.js';
import { createRaceAudio } from './race3d-audio.js';
import { createRaceUI } from './race3d-ui.js';
import { createRaceEffects } from './race3d-fx.js';
import { createRaceScenery } from './race3d-scenery.js';

const COLORS = ['#54d7c4', '#f4c65a', '#ff7666', '#a6b1f1', '#79b8ee', '#d2a4dd', '#a9d58b', '#edb987'];
const STEP = 1 / 60;
const COUNTDOWN = 2.25;
const SIMULATION_RATE = 5;
const SCENE_SCALE = 1 / SIMULATION_RATE;
const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

/** Three.js Grand Prix, keeping the arcade's regular create/start/reset/destroy contract. */
export default function createGame({ container, names = [], onPick, random = Math.random, sound = true }) {
  const players = names.slice(0, 60).map((player, index) => ({
    ...player,
    id: player.id,
    name: String(player.name ?? ''),
    color: player.color || COLORS[index % COLORS.length],
  }));
  const root = document.createElement('div');
  root.className = 'race3d';
  root.innerHTML = `<style>
    .race3d{position:absolute;inset:0;overflow:hidden;background:#111a20;color:#edf0eb;font-family:inherit;isolation:isolate}
    .race3d canvas.race3d-canvas{display:block;width:100%;height:100%;outline:none}
    .race3d .race3d-error{position:absolute;inset:0;display:grid;place-content:center;padding:24px;text-align:center;color:#e8eee9;background:#101a20;line-height:1.5}
  </style>`;
  container.appendChild(root);
  let renderer, track, scenery, simulation, carModels, chaseCamera, audio, ui, effects;
  let alive = true, mode = 'idle', elapsed = 0, raceElapsed = 0, previous = null, accumulator = 0, raf = 0;
  let picked = false, winnerId = null, cameraOffset = 0, focusedId = null;
  let resizeObserver = null;
  let audioEvents = [];
  let size = { width: 1, height: 1 };
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x8cb7c4);
  scene.fog = new THREE.Fog(0x9ab9bd, 105, 520);
  const world = new THREE.Group();
  world.scale.setScalar(SCENE_SCALE);
  scene.add(world);
  const camera = new THREE.PerspectiveCamera(66, 1, 0.08, 1000);
  scene.add(camera);
  const hemi = new THREE.HemisphereLight(0xd8efff, 0x4b4034, 1.45);
  const sun = new THREE.DirectionalLight(0xffe1b2, 3.2);
  sun.position.set(-85, 115, 44);
  sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048);
  sun.shadow.camera.left = -420;
  sun.shadow.camera.right = 420;
  sun.shadow.camera.top = 420;
  sun.shadow.camera.bottom = -420;
  sun.shadow.bias = -0.00015;
  scene.add(hemi, sun);

  const canvas = document.createElement('canvas');
  canvas.className = 'race3d-canvas';
  canvas.setAttribute('role', 'img');
  canvas.setAttribute('aria-label', 'Three dimensional Grand Prix. Follow the leading racer through a two lap circuit.');
  root.prepend(canvas);

  const resize = () => {
    if (!alive || !renderer) return;
    const rect = root.getBoundingClientRect();
    size.width = Math.max(1, rect.width || container.clientWidth || 1);
    size.height = Math.max(1, rect.height || container.clientHeight || 1);
    renderer.setSize(size.width, size.height, false);
    camera.aspect = size.width / size.height;
    camera.updateProjectionMatrix();
    renderer.render(scene, camera);
  };

  const playerFor = id => simulation?.cars.find(car => car.id === id);
  const standings = () => simulation?.cars.slice().sort((a, b) => b.distance - a.distance) || [];
  const focusCar = () => {
    if (winnerId !== null) return playerFor(winnerId) || standings()[0];
    const order = standings();
    if (!order.length) return null;
    const slot = ((cameraOffset % order.length) + order.length) % order.length;
    return order[slot];
  };

  const projectCars = order => {
    for (let rank = 0; rank < order.length; rank++) {
      const car = order[rank];
      const sample = track.sampleTrack(car.distance);
      const lateral = sample.right.clone().multiplyScalar(car.lateral || 0);
      const point = new THREE.Vector3(sample.position.x, sample.position.y, sample.position.z).add(lateral).multiplyScalar(SCENE_SCALE);
      point.y += 1.35;
      point.project(camera);
      const x = (point.x * 0.5 + 0.5) * size.width;
      const y = (-point.y * 0.5 + 0.5) * size.height;
      car.screen = { x, y, visible: point.z > -1 && point.z < 1 && x > -80 && x < size.width + 80 && y > -60 && y < size.height + 60 };
      car.position = rank + 1;
      car.speedKmh = Math.max(0, Number(car.speed ?? car.velocity ?? 0) * 3.6);
      car.lapCount = Math.min(2, Math.floor(Math.max(0, car.distance) / track.totalLength) + 1);
    }
  };

  const reportEffects = events => {
    for (const event of events || []) {
      const car = playerFor(event.carId ?? event.id) || (event.type === 'finish' ? playerFor(winnerId) : null);
      if (!car) continue;
      const sample = track.sampleTrack(car.distance);
      const position = sample.position.clone().add(sample.right.clone().multiplyScalar(car.lateral || 0));
      const mapped = {
        collision: 'collision', spin: 'skid', recovery: 'dust', finish: 'celebration',
        oil: 'skid', cone: 'dust', gas: 'speed', boost: 'speed',
        hazard: event.hazardType === 'oil' || event.hazardType === 'water' ? 'skid' : event.hazardType === 'cone' ? 'dust' : 'speed',
      }[event.type];
      if (!mapped) continue;
      effects.emit({
        type: mapped,
        position: { x: position.x, y: position.y + 0.25, z: position.z },
        direction: { x: sample.tangent.x, y: 0, z: sample.tangent.z },
        intensity: clamp(Number(event.intensity) || (mapped === 'celebration' ? 1 : 0.58), 0.2, 1.8),
        color: mapped === 'celebration' ? 0xffd470 : undefined,
      }, { cars: simulation.cars, track });
    }
  };

  const setPhase = phase => {
    mode = phase;
    root.dataset.phase = phase;
  };

  const render = (dt, cameraDt = dt) => {
    if (!alive || !renderer) return;
    scenery?.update(elapsed);
    effects?.update(dt);
    const ordered = standings();
    carModels?.update(track);
    const focused = focusCar();
    if (focused) {
      focusedId = focused.id;
      let cameraTime = Math.max(0, cameraDt);
      if (!cameraTime) chaseCamera?.update(focused, 0);
      while (cameraTime > 0.00001) {
        const substep = Math.min(0.05, cameraTime);
        chaseCamera?.update(focused, substep);
        cameraTime -= substep;
      }
      // Chase camera computes against the track's unscaled coordinates; keep
      // its orientation and scale its world position to match the scene rig.
      camera.position.multiplyScalar(SCENE_SCALE);
    }
    camera.updateMatrixWorld(true);
    projectCars(ordered);
    ui?.update(ordered, raceElapsed, mode);
    audio?.update(simulation?.cars || [], focusedId, audioEvents);
    audioEvents = [];
    renderer.render(scene, camera);
  };

  const finish = id => {
    if (picked || mode !== 'running' || id === undefined || id === null) return;
    const car = playerFor(id);
    if (!car) return;
    picked = true;
    winnerId = id;
    finishAt = elapsed;
    setPhase('finished');
    ui?.setWinner(car);
    audio?.finish(car);
    canvas.setAttribute('aria-label', `${car.name} won the Grand Prix and is the next speaker.`);
    onPick?.(car.id);
  };

  const frame = now => {
    if (!alive) return;
    raf = 0;
    if (previous === null) previous = now;
    const frameDelta = clamp((now - previous) / 1000, 0, 0.1);
    previous = now;
    elapsed += frameDelta;
    let cameraDelta = 0;
    if (mode === 'countdown') {
      if (elapsed >= COUNTDOWN) setPhase('running');
    } else if (mode === 'running') {
      accumulator += frameDelta;
      while (accumulator >= STEP && alive && mode === 'running') {
        const winner = simulation.update(STEP * SIMULATION_RATE);
        raceElapsed += STEP;
        cameraDelta += STEP * SIMULATION_RATE;
        accumulator -= STEP;
        const events = simulation.drainEvents?.() || [];
        reportEffects(events);
        audioEvents.push(...events);
        if (audioEvents.length > 48) audioEvents.splice(0, audioEvents.length - 48);
        if (winner !== null && winner !== undefined) finish(winner);
      }
    }
    render(frameDelta, cameraDelta || frameDelta);
    if (mode === 'finished') {
      if (elapsed < (finishAt + 3.2)) raf = requestAnimationFrame(frame);
    } else raf = requestAnimationFrame(frame);
  };
  let finishAt = 0;

  const start = () => {
    if (!alive || mode === 'countdown' || mode === 'running' || !players.length) return;
    cancelAnimationFrame(raf);
    raf = 0;
    simulation.reset();
    picked = false;
    winnerId = null;
    focusedId = null;
    cameraOffset = 0;
    elapsed = 0;
    raceElapsed = 0;
    accumulator = 0;
    audioEvents = [];
    previous = performance.now();
    finishAt = Infinity;
    setPhase('countdown');
    ui?.reset();
    audio?.reset();
    audio?.start();
    canvas.setAttribute('aria-label', 'Grand Prix starting. Chase camera follows the leader through a two lap circuit.');
    render(0);
    raf = requestAnimationFrame(frame);
  };

  const reset = () => {
    if (!alive) return;
    cancelAnimationFrame(raf);
    raf = 0;
    simulation?.reset();
    picked = false;
    winnerId = null;
    focusedId = null;
    cameraOffset = 0;
    elapsed = 0;
    raceElapsed = 0;
    accumulator = 0;
    audioEvents = [];
    previous = null;
    finishAt = Infinity;
    setPhase('idle');
    chaseCamera?.reset();
    audio?.reset();
    ui?.reset();
    canvas.setAttribute('aria-label', 'Three dimensional Grand Prix starting grid. All racers begin with the same specifications.');
    render(0);
  };

  const destroy = () => {
    if (!alive) return;
    alive = false;
    cancelAnimationFrame(raf);
    raf = 0;
    resizeObserver?.disconnect();
    window.removeEventListener('resize', resize);
    ui?.destroy();
    audio?.destroy();
    chaseCamera?.dispose();
    effects?.dispose();
    carModels?.dispose();
    simulation?.dispose();
    scenery?.dispose();
    track?.dispose();
    renderer?.dispose();
    renderer?.forceContextLoss?.();
    root.remove();
    scene.clear();
  };

  try {
    renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false, powerPreference: 'high-performance' });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.65));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.15;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    track = createRaceTrack(THREE);
    scenery = createRaceScenery(THREE, track);
    simulation = createRaceSimulation({ players, track, random });
    carModels = createRaceCars(THREE, simulation.cars);
    chaseCamera = createChaseCamera({ THREE, camera, track });
    effects = createRaceEffects(THREE);
    audio = createRaceAudio({ sound });
    world.add(track.group, scenery.group, carModels.group, effects.group);
    ui = createRaceUI(root, players, {
      laps: 2,
      totalLength: track.totalLength,
      onCamera: direction => {
        const count = simulation?.cars.length || 1;
        cameraOffset = (cameraOffset + Math.sign(direction) + count) % count;
        if (mode === 'idle') chaseCamera?.reset();
        render(0, 0.05);
      },
    });
    resizeObserver = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(resize) : null;
    resizeObserver?.observe(root);
    window.addEventListener('resize', resize, { passive: true });
    track.raceDistance = track.totalLength * 2;
    simulation.reset();
    setPhase('idle');
    resize();
    render(0);
    root.__race3d = {
      snapshot: () => {
        const direction = camera.getWorldDirection(new THREE.Vector3());
        return {
          phase: mode,
          elapsed,
          raceElapsed,
          totalLength: track?.totalLength || 0,
          finishDistance: simulation?.finishDistance || 0,
          picked,
          winnerId,
          focusedId,
          camera: {
            x: camera.position.x, y: camera.position.y, z: camera.position.z,
            direction: { x: direction.x, y: direction.y, z: direction.z },
            fov: camera.fov,
          },
          cars: simulation?.cars.map(car => ({ id: car.id, name: car.name, distance: car.distance, speed: car.speed ?? car.velocity ?? 0, finished: !!car.finished })) || [],
        };
      },
    };
  } catch (error) {
    console.error('Grand Prix 3D failed to initialize', error);
    resizeObserver?.disconnect();
    window.removeEventListener('resize', resize);
    ui?.destroy();
    audio?.destroy();
    chaseCamera?.dispose();
    effects?.dispose();
    carModels?.dispose();
    simulation?.dispose();
    scenery?.dispose();
    track?.dispose();
    renderer?.dispose();
    renderer?.forceContextLoss?.();
    root.replaceChildren();
    root.style.cssText = 'position:absolute;inset:0;overflow:hidden;background:#101a20;color:#e8eee9;font-family:inherit;isolation:isolate';
    const message = document.createElement('div');
    message.setAttribute('role', 'status');
    message.textContent = 'This browser could not start the 3D Grand Prix. Try a browser with WebGL enabled.';
    message.style.cssText = 'position:absolute;inset:0;display:grid;place-content:center;padding:24px;text-align:center;color:#e8eee9;background:#101a20;line-height:1.5';
    root.appendChild(message);
    return { start() {}, reset() {}, setSound() {}, destroy() { if (!alive) return; alive = false; root.remove(); } };
  }

  return {
    start,
    reset,
    setSound(value) { audio?.setSound(value); },
    destroy,
  };
}

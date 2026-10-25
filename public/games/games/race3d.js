import * as THREE from '../assets/vendor/three.module.js';
import { createRaceTrack } from './race3d-track.js?v=20261025-city-contact1';
import { createRaceCars } from './race3d-cars.js?v=20261025-city-contact1';
import { createRaceSimulation } from './race3d-physics.js?v=20261025-city-contact1';
import { createChaseCamera } from './race3d-camera.js?v=20261025-city-contact1';
import { createRaceAudio } from './race3d-audio.js?v=20261025-city-contact1';
import { createRaceUI } from './race3d-ui.js?v=20261025-city-contact1';
import { createRaceEffects } from './race3d-fx.js?v=20261025-city-contact1';
import { createRaceScenery } from './race3d-city.js?v=20261025-city-contact1';
import { createRaceAtmosphere } from './race3d-atmosphere.js?v=20261025-city-contact1';
import { createRacePowerups } from './race3d-powerups.js?v=20261025-city-contact1';
import { createRaceRamps } from './race3d-ramps.js?v=20261025-city-contact1';
import { createSkySpirit } from './race3d-sky-spirit.js?v=20261025-city-contact1';
import { assignRacerTypes } from './race3d-roster.js?v=20261025-city-contact1';
import { resolveQuality } from './race3d-quality.js?v=20261025-city-contact1';
import { createContactShadows } from './race3d-quality.js?v=20261025-city-contact1';
import { createCircuitFestival } from './race3d-festival.js?v=20261025-city-contact1';
import {createRaceSelection,SELECTION_SECONDS} from './race3d-selection.js?v=20261025-city-contact1';
import {rampPlaybackTarget,advancePlaybackRate} from './race3d-playback.js?v=20261025-city-contact1';
import {createFrameBudget} from './race3d-frame-budget.js?v=20261025-city-contact1';

const COLORS = ['#54d7c4', '#f4c65a', '#ff7666', '#a6b1f1', '#79b8ee', '#d2a4dd', '#a9d58b', '#edb987'];
const STEP = 1 / 60;
const COUNTDOWN = 3;
const SIMULATION_RATE = 5;
const SCENE_SCALE = 1 / SIMULATION_RATE;
const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

/** Three.js Grand Prix, keeping the arcade's regular create/start/reset/destroy contract. */
export default function createGame({ container, names = [], onPick, random = Math.random, sound = true }) {
  let laps = 5;
  try { const n = Number(localStorage.getItem('race3d-laps')); if ([1,3,5,10].includes(n)) laps = n; } catch {}
  const players = assignRacerTypes(names.slice(0, 60).map((player, index) => ({
    ...player,
    id: player.id,
    name: String(player.name ?? ''),
    color: player.color || COLORS[index % COLORS.length],
  })), random);
  let qualityMode='auto';try{const saved=localStorage.getItem('race3d-quality');if(['auto','low','medium','high'].includes(saved))qualityMode=saved;}catch{}
  const qualityFor=()=>resolveQuality(qualityMode,{width:container.clientWidth||innerWidth,cores:navigator.hardwareConcurrency||4,racers:players.length});
  let quality=qualityFor(),festival,contactShadows;
  const root = document.createElement('div');
  root.className = 'race3d';
  root.innerHTML = `<style>
    .race3d{position:absolute;inset:0;overflow:hidden;background:#111a20;color:#edf0eb;font-family:inherit;isolation:isolate}
    .race3d canvas.race3d-canvas{display:block;width:100%;height:100%;outline:none}
    .race3d .race3d-error{position:absolute;inset:0;display:grid;place-content:center;padding:24px;text-align:center;color:#e8eee9;background:#101a20;line-height:1.5}
  </style>`;
  container.appendChild(root);
  const credits = document.createElement('a');
  credits.href = new URL('../assets/race3d-cars/RELEASE-CREDITS.md', import.meta.url).href;
  credits.textContent = 'Models & sound credits';
  credits.target = '_blank'; credits.rel = 'noopener';
  credits.style.cssText = 'position:absolute;bottom:4px;left:12px;z-index:12;color:#d6e4eb;font:10px/1.5 sans-serif;text-decoration:none;background:#13212a99;padding:2px 5px;border-radius:3px';
  root.appendChild(credits);
  let renderer, track, scenery, atmosphere, skySpirit, simulation, carModels, chaseCamera, audio, ui, effects, powerups, ramps, frogs, selection;
  let alive = true, mode = 'idle', elapsed = 0, raceElapsed = 0, previous = null, accumulator = 0, raf = 0;
  let shaderReady = false, pendingStart = false, warmRevision = 0;
  const preparing = document.createElement('div');
  preparing.setAttribute('role', 'status');
  preparing.textContent = 'Preparing the circuit…';
  preparing.style.cssText = 'position:absolute;inset:0;z-index:9;display:grid;place-content:center;pointer-events:none;background:#10202dcc;font:600 18px system-ui';
  root.appendChild(preparing);
  let playbackRate = SIMULATION_RATE;
  let cinematicRamps=false;try{cinematicRamps=localStorage.getItem('race3d-cinematic')==='true';}catch{}
  const frameBudget=createFrameBudget();let detailScale=1,renderScale=1,warmFrames=0;
  let picked = false, winnerId = null, cameraOffset = 0, focusedId = null, cameraTargetId = null;
  let countdownAt = 0, countdownElapsed = 0, countdownCue = 3, goAt = -Infinity;
  let selectionAt = null, selectionProgress = 0, selectionEpoch = 0,selectionTimeout=0;
  let resizeObserver = null;
  let audioEvents = [];
  let uiEvents = [];
  let recentEvents = [];
  let eventCounts = Object.create(null);
  let size = { width: 1, height: 1 };
  const scene = new THREE.Scene();
  const world = new THREE.Group();
  world.scale.setScalar(SCENE_SCALE);
  scene.add(world);
  const camera = new THREE.PerspectiveCamera(66, 1, 0.08, 1000);
  scene.add(camera);

  const canvas = document.createElement('canvas');
  let lastViewWheelAt = -Infinity;
  const changeView = direction => {
    if (!alive || !chaseCamera?.changeMode(direction)) return false;
    if (mode === 'finished') finishAt = elapsed;
    if (mode === 'idle' || (mode === 'finished' && !raf)) {
      previous = performance.now();
      if (!raf) raf = requestAnimationFrame(frame);
    }
    return true;
  };
  const onViewWheel = event => {
    if (!alive || !event.deltaY || event.ctrlKey) return;
    const now = performance.now();
    if (now - lastViewWheelAt < 300) { event.preventDefault(); return; }
    if (changeView(Math.sign(event.deltaY))) {
      lastViewWheelAt = now;
      event.preventDefault();
    }
  };
  canvas.className = 'race3d-canvas';
  canvas.setAttribute('role', 'img');
  canvas.setAttribute('aria-label', 'Three dimensional Grand Prix. Follow the leading racer through the selected race circuit.');
  root.prepend(canvas);
  canvas.addEventListener('wheel', onViewWheel, { passive: false });

  const resize = () => {
    if (!alive || !renderer) return;
    const rect = root.getBoundingClientRect();
    size.width = Math.max(1, rect.width || container.clientWidth || 1);
    size.height = Math.max(1, rect.height || container.clientHeight || 1);
    renderer.setSize(size.width, size.height, false);
    camera.aspect = size.width / size.height;
    camera.updateProjectionMatrix();
    if(shaderReady){if(mode==='selecting')render(0,0);else renderer.render(scene,camera);}
  };

  const playerFor = id => simulation?.cars.find(car => car.id === id);
  const standings = () => simulation?.cars.slice().sort((a, b) => {
    const aFinished = Number.isFinite(a.finishTime), bFinished = Number.isFinite(b.finishTime);
    if (aFinished || bFinished) {
      if (!aFinished) return 1;
      if (!bFinished) return -1;
      return a.finishTime - b.finishTime || (a.finishPosition || 0) - (b.finishPosition || 0);
    }
    return b.distance - a.distance;
  }) || [];
  const focusCar = () => {
    if (cameraTargetId !== null) return playerFor(cameraTargetId) || standings()[0];
    if (winnerId !== null) return playerFor(winnerId) || standings()[0];
    const order = standings();
    if (!order.length) return null;
    const slot = ((cameraOffset % order.length) + order.length) % order.length;
    return order[slot];
  };

  const projectCars = order => {
    for (let rank = 0; rank < order.length; rank++) {
      const car = order[rank];
      const visual = carModels?.visualPose?.(car.id) || car;
      const sample = track.sampleTrack(visual.distance);
      const lateral = sample.right.clone().multiplyScalar(visual.lateral || 0);
      const point = new THREE.Vector3(sample.position.x, sample.position.y, sample.position.z).add(lateral);
      // Roof clearance is in the same track metres as the car, before scaling.
      point.y += Math.max(0, Number(visual.flightHeight) || 0) + Math.max(0, Number(visual.rampHeight) || 0) + (Number(sample.bank) || 0) * (visual.lateral || 0) + 1.65;
      point.multiplyScalar(SCENE_SCALE);
      point.project(camera);
      const x = (point.x * 0.5 + 0.5) * size.width;
      const y = (-point.y * 0.5 + 0.5) * size.height;
      car.screen = { x, y, visible: point.z > -1 && point.z < 1 && x > -80 && x < size.width + 80 && y > -60 && y < size.height + 60 };
      car.position = rank + 1;
      car.speedKmh = Math.max(0, Number(visual.speed ?? visual.velocity ?? 0) * 3.6);
      car.lapCount = Math.min(laps, Math.floor(Math.max(0, car.distance) / track.totalLength) + 1);
    }
  };

  const reportEffects = events => {
    uiEvents.push(...(events || []));
    if (uiEvents.length > 240) uiEvents.splice(0, uiEvents.length - 240);
    powerups?.handleEvents(events, { cars: simulation.cars });
    for (const event of events || []) if (event.type === 'car-finish') frogs?.celebrate(event.carId ?? event.id);
    for (const event of events || []) {
      eventCounts[event.type] = (eventCounts[event.type] || 0) + 1;
      if(event.itemType&&['item-pickup','item-ready','item-use'].includes(event.type)){
        const key=event.type+':'+event.itemType;eventCounts[key]=(eventCounts[key]||0)+1;
      }
      recentEvents.push({
        type: event.type, carId: event.carId, time: event.time,
        itemType: event.itemType, distance: event.distance, lateral: event.lateral,
        rampId: event.rampId, fullFlips: event.fullFlips, successful: event.successful,
        trickAngle: event.trickAngle, speedBonus: event.speedBonus, bonusAdded: event.bonusAdded,
      });
      if (recentEvents.length > 32) recentEvents.shift();
      const car = playerFor(event.carId ?? event.id) || (event.type === 'finish' ? playerFor(winnerId) : null);
      if (!car) continue;
      const sample = track.sampleTrack(Number.isFinite(event.distance) ? event.distance : car.distance);
      const lateral = Number.isFinite(event.lateral) ? event.lateral : car.lateral || 0;
      const position = sample.position.clone().add(sample.right.clone().multiplyScalar(lateral));
      position.y += Math.max(0, Number(car.flightHeight) || 0) + Math.max(0, Number(car.rampHeight) || 0);
      const mapped = {
        collision: 'collision', spin: 'skid', recovery: 'dust',
        oil: 'skid', cone: 'dust', gas: 'speed', boost: 'speed',
        'banana-hit': 'skid', 'bomb-hit': 'collision',
        land: 'dust', 'ramp-land': 'dust', 'trick-complete': 'speed', 'missile-hit': 'collision', repair: 'speed', rocket: 'speed',
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
    if (!alive || !renderer || !shaderReady) return;
    scenery?.update(elapsed);
    ramps?.update(elapsed);
    frogs?.update(dt, { cars: simulation?.cars || [], time: simulation?.time || 0 });
    effects?.update(dt);
    const ordered = standings();
    if (mode === 'selecting') {
      selection?.update(selectionProgress, size, selectionAt === null);
      focusedId = null;
    } else {
    const focused = focusCar();
    carModels?.update(track, dt,{focusedId:focused?.id,lodDistance:quality.lodDistance*detailScale,detailedCars:Math.max(1,Math.floor(quality.detailedCars*detailScale))});
    audioEvents.push(...(carModels?.drainFinishEvents?.()||[]));
    contactShadows?.update(id=>carModels?.visualPose(id));
    festival?.update(elapsed);
    if (focused) {
      const cameraCar = carModels?.visualPose?.(focused.id) || focused;
      focusedId = focused.id;
      let cameraTime = Math.max(0, cameraDt);
      if (mode !== 'running' && mode !== 'finishing') cameraTime *= SIMULATION_RATE;
      if (!cameraTime) chaseCamera?.update(cameraCar, 0);
      while (cameraTime > 0.00001) {
        const substep = Math.min(0.05, cameraTime);
        chaseCamera?.update(cameraCar, substep);
        cameraTime -= substep;
      }
      // Chase camera computes against the track's unscaled coordinates; keep
      // its orientation and scale its world position to match the scene rig.
      camera.position.multiplyScalar(SCENE_SCALE);
    }
    carModels?.setHiddenId?.(chaseCamera?.hideFocusedCar ? focusedId : null);
    atmosphere?.update(camera.position);
    skySpirit?.update(dt, camera.position, camera);
    camera.updateMatrixWorld(true);
    powerups?.update(dt, {
      pickups: simulation?.pickups || [], projectiles: simulation?.projectiles || [],
      hazards: simulation?.hazards || [], waves: simulation?.waves || [], time: simulation?.time || 0,
    }, { cars: simulation?.cars || [], camera });
    projectCars(ordered);
    }
    ui?.update(ordered, raceElapsed, mode, focusedId, {
      events: uiEvents,
      results: simulation?.results || [], allFinished: !!simulation?.allFinished,finishCelebrationComplete:carModels?.finishSnapshot?.().complete!==false,
      simulationTime: simulation?.time || 0, timeScale: SIMULATION_RATE,effectTimeScale:playbackRate,
      cameraMode: chaseCamera?.mode || 'chase',
      selectionProgress, selectionLoading: mode === 'selecting' && selectionAt === null,
      countdownRemaining: mode === 'countdown' ? Math.max(0, COUNTDOWN - countdownElapsed) : 0,
      countdownStep: mode === 'countdown' ? Math.max(1, Math.ceil(COUNTDOWN - countdownElapsed)) :
        mode === 'running' && elapsed - goAt < .65 ? 'GO' : null,
    });
    uiEvents = [];
    // Unlock audio on the start gesture, but assign engines only after GO.
    audio?.update(mode === 'running' || mode === 'finishing' ? simulation?.cars || [] : [], focusedId, audioEvents);
    audioEvents = [];
    renderer.render(mode === 'selecting' ? selection.scene : scene, mode === 'selecting' ? selection.camera : camera);
  };

  const warmScene = () => {
    const revision = ++warmRevision;
    shaderReady = false; preparing.style.display = 'grid';
    // compileAsync polls KHR_parallel_shader_compile before first draw. Retain
    // Three's shader diagnostics, but avoid blocking on unfinished programs.
    Promise.all([renderer.compileAsync(scene, camera),selection?renderer.compileAsync(selection.scene,selection.camera):null,selection&&carModels?renderer.compileAsync(carModels.group,selection.camera,selection.scene):null]).then(() => {
      if (!alive || revision !== warmRevision) return;
      shaderReady = true; preparing.style.display = 'none'; render(0, 0);
      if (pendingStart) { pendingStart = false; start(); }
    }).catch(error => {
      if (!alive || revision !== warmRevision) return;
      pendingStart = false;
      preparing.textContent = 'The circuit could not prepare. Try Performance quality or restart.';
      console.error('Grand Prix shader preparation failed', error);
    });
  };
  const carOptions = () => ({...quality, prepareAsset: model => Promise.all([renderer.compileAsync(model,camera,scene),selection?renderer.compileAsync(model,selection.camera,selection.scene):null])});
  const watchCarAssets = models => {
    models?.assetsReady?.then(() => {
      if (!alive || carModels !== models) return;
      // Idle has no animation loop; redraw when authored models replace fallbacks.
      if (mode === 'idle' || mode === 'finished') render(0, 0);
    }, error => console.warn('Grand Prix car assets could not finish loading', error));
  };

  const finish = id => {
    if (winnerId !== null || mode !== 'running' || id === undefined || id === null) return;
    const car = playerFor(id);
    if (!car) return;
    winnerId = id;
    finishAt = elapsed;
    setPhase('finishing');
    ui?.setWinner(car);
    audio?.finish(car);
    canvas.setAttribute('aria-label', `${car.name} won the Grand Prix and is the next speaker.`);
  };

  const continueWinner = () => {
    if (picked || winnerId === null || !simulation?.allFinished || !carModels?.finishSnapshot?.().complete) return;
    const winner = playerFor(winnerId);
    if (!winner) return;
    picked = true;
    setPhase('finished');
    cancelAnimationFrame(raf); raf = 0;
    render(0, 0);
    onPick?.(winner.id);
  };

  const frame = now => {
    if (!alive) return;
    const cpuStart=performance.now(),rawFrameMs=previous===null?0:now-previous;
    raf = 0;
    if (previous === null) previous = now;
    const frameDelta = clamp((now - previous) / 1000, 0, 0.1);
    previous = now;
    elapsed += frameDelta;
    let cameraDelta = 0;
    if (mode === 'selecting') {
      selectionProgress = selectionAt === null ? 0 : clamp((now-selectionAt)/1000/SELECTION_SECONDS,0,1);
      if (selectionProgress >= 1) {
        selection.end();
        chaseCamera?.reset();
        countdownAt=now;countdownElapsed=0;countdownCue=3;
        setPhase('countdown');
        audioEvents.push({type:'countdown',value:3});
      }
    } else if (mode === 'countdown') {
      countdownElapsed = Math.max(0, (now - countdownAt) / 1000);
      if (countdownElapsed >= COUNTDOWN) {
        setPhase('running'); goAt = elapsed; countdownCue = 'GO';
        audioEvents.push({ type: 'countdown', value: 'GO' });
      } else {
        const cue = Math.max(1, Math.ceil(COUNTDOWN - countdownElapsed));
        if (cue !== countdownCue) { countdownCue = cue; audioEvents.push({ type: 'countdown', value: cue }); }
      }
    } else if (mode === 'running' || mode === 'finishing') {
      accumulator += frameDelta;
      while (accumulator >= STEP && alive && (mode === 'running' || mode === 'finishing')) {
        playbackRate = advancePlaybackRate(playbackRate, cinematicRamps?rampPlaybackTarget(focusCar(), SIMULATION_RATE):SIMULATION_RATE, STEP);
        const simulationDelta = STEP * playbackRate;
        const winner = simulation.update(simulationDelta);
        raceElapsed += simulationDelta / SIMULATION_RATE;
        cameraDelta += simulationDelta;
        accumulator -= STEP;
        const events = simulation.drainEvents?.() || [];
        reportEffects(events);
        audioEvents.push(...events);
        if (audioEvents.length > 48) audioEvents.splice(0, audioEvents.length - 48);
        if (winner !== null && winner !== undefined) finish(winner);
        if (winnerId !== null && simulation.allFinished) {
          finishAt = elapsed;
          setPhase('finished');
        }
      }
    }
    render(frameDelta, cameraDelta || frameDelta);
    if(qualityMode==='auto'&&(mode==='running'||mode==='finishing')&&++warmFrames>180){
      const next=frameBudget.sample(rawFrameMs,performance.now()-cpuStart);
      if(next){detailScale=next.detail;if(renderScale!==next.scale){renderScale=next.scale;renderer.setPixelRatio(Math.min(devicePixelRatio||1,quality.dpr)*renderScale);renderer.setSize(size.width,size.height,false);}}
    }
    // The arcade may destroy this game synchronously from onPick.
    if (!alive) return;
    if (mode === 'finished') {
      if (elapsed < (finishAt + 4.2)) raf = requestAnimationFrame(frame);
    } else raf = requestAnimationFrame(frame);
  };
  let finishAt = 0;

  const start = () => {
    if (!alive || mode === 'selecting' || mode === 'countdown' || mode === 'running' || mode === 'finishing' || !players.length) return;
    if (!shaderReady) { pendingStart = true; audio?.start(); return; }
    frameBudget.reset();warmFrames=0;detailScale=renderScale=1;
    renderer.setPixelRatio(Math.min(devicePixelRatio||1,quality.dpr));renderer.setSize(size.width,size.height,false);
    cancelAnimationFrame(raf);
    raf = 0;
    simulation.reset();
    carModels?.reset();
    selection?.end();
    picked = false;
    winnerId = null;
    focusedId = null;
    cameraOffset = 0;
    cameraTargetId = null;
    elapsed = 0;
    raceElapsed = 0;
    playbackRate = SIMULATION_RATE;
    accumulator = 0;
    audioEvents = [];
    recentEvents = [];
    uiEvents = [];
    eventCounts = Object.create(null);
    const epoch=++selectionEpoch;
    selectionAt=null;selectionProgress=0;
    countdownElapsed = 0; countdownCue = 3; goAt = -Infinity;
    previous = performance.now();
    finishAt = Infinity;
    setPhase('selecting');
    selection.begin(carModels);
    const beginSelectionClock=()=>{
      if(selectionEpoch===epoch){clearTimeout(selectionTimeout);selectionTimeout=0;if(alive && mode==='selecting' && selectionAt===null)selectionAt=performance.now();}
    };
    // Network stalls never hold a classroom in the showroom indefinitely.
    clearTimeout(selectionTimeout);Promise.race([carModels.assetsReady,new Promise(resolve=>{selectionTimeout=setTimeout(resolve,2500);})]).then(beginSelectionClock,beginSelectionClock);
    ui?.reset();
    frogs?.reset();
    chaseCamera?.reset();
    audio?.reset();
    powerups?.reset();
    audio?.start();
    canvas.setAttribute('aria-label', 'Random car selection. Each racer reveals their assigned three dimensional supercar before the countdown.');
    render(0);
    raf = requestAnimationFrame(frame);
  };

  const reset = () => {
    if (!alive) return;
    pendingStart = false;
    frameBudget.reset();warmFrames=0;detailScale=renderScale=1;
    renderer.setPixelRatio(Math.min(devicePixelRatio||1,quality.dpr));renderer.setSize(size.width,size.height,false);clearTimeout(selectionTimeout);selectionTimeout=0;
    cancelAnimationFrame(raf);
    raf = 0;
    ++selectionEpoch;selectionAt=null;selectionProgress=0;
    selection?.end();
    simulation?.reset();
    carModels?.reset();
    picked = false;
    winnerId = null;
    focusedId = null;
    cameraOffset = 0;
    cameraTargetId = null;
    elapsed = 0;
    raceElapsed = 0;
    playbackRate = SIMULATION_RATE;
    accumulator = 0;
    audioEvents = [];
    recentEvents = [];
    uiEvents = [];
    eventCounts = Object.create(null);
    previous = null;
    countdownElapsed = 0; countdownCue = 3; goAt = -Infinity;
    finishAt = Infinity;
    setPhase('idle');
    chaseCamera?.reset();
    audio?.reset();
    powerups?.reset();
    ui?.reset();
    frogs?.reset();
    canvas.setAttribute('aria-label', 'Three dimensional Grand Prix starting grid with randomly assigned racers.');
    render(0);
  };

  const destroy = () => {
    clearTimeout(selectionTimeout);selectionTimeout=0;
    pendingStart = false; warmRevision++;
    if (!alive) return;
    alive = false;
    cancelAnimationFrame(raf);
    raf = 0;
    resizeObserver?.disconnect();
    window.removeEventListener('resize', resize);
    canvas.removeEventListener('wheel', onViewWheel);
    ++selectionEpoch;
    selection?.dispose();
    ui?.destroy();
    audio?.destroy();
    chaseCamera?.dispose();
    effects?.dispose();
    powerups?.dispose();
    ramps?.dispose();
    frogs?.dispose();
    carModels?.dispose();
    simulation?.dispose();
    scenery?.dispose();
    track?.dispose();
    atmosphere?.dispose();
    skySpirit?.dispose();
    festival?.dispose();contactShadows?.dispose();
    renderer?.dispose();
    renderer?.forceContextLoss?.();
    root.remove();
    scene.clear();
  };

  try {
    renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false, powerPreference: 'high-performance' });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, quality.dpr));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.0;
    renderer.shadowMap.enabled = quality.shadows;
    renderer.shadowMap.type = THREE.PCFShadowMap;
    atmosphere = createRaceAtmosphere(THREE, { scene, renderer,shadows:quality.shadows,shadowSize:quality.shadowSize,skyWidth:quality.skyWidth });
    skySpirit = createSkySpirit(THREE, { scene });
    track = createRaceTrack(THREE);
    scenery = createRaceScenery(THREE, track,quality);
    track.raceDistance = track.totalLength * laps;
    simulation = createRaceSimulation({ players, track, random });
    carModels = createRaceCars(THREE, simulation.cars,carOptions());
    selection=createRaceSelection(THREE,{racers:simulation.cars});
    chaseCamera = createChaseCamera({ THREE, camera, track, timeScale: SIMULATION_RATE });
    effects = createRaceEffects(THREE);
    powerups = createRacePowerups(THREE, { track });
    ramps = createRaceRamps(THREE, { track });
    festival=createCircuitFestival(THREE,track);festival.group.visible=quality.id!=='low';
    contactShadows=createContactShadows(THREE,track,simulation.cars);
    audio = createRaceAudio({ sound });
    world.add(track.group, scenery.group, carModels.group, effects.group, powerups.group, ramps.group,festival.group,contactShadows.group);
    ui = createRaceUI(root, players, {
      laps, track,qualityMode,cinematicRamps,onCinematic:value=>{cinematicRamps=value;try{localStorage.setItem('race3d-cinematic',String(value));}catch{}},
      onQuality:value=>{
        if(mode!=='idle')return false;
        qualityMode=value;quality=qualityFor();try{localStorage.setItem('race3d-quality',value);}catch{}
        renderer.setPixelRatio(Math.min(devicePixelRatio||1,quality.dpr));renderer.shadowMap.enabled=quality.shadows;
        frameBudget.reset();warmFrames=0;detailScale=renderScale=1;
        atmosphere.dispose();atmosphere=createRaceAtmosphere(THREE,{scene,renderer,shadows:quality.shadows,shadowSize:quality.shadowSize,skyWidth:quality.skyWidth});
        carModels.dispose();carModels=createRaceCars(THREE,simulation.cars,carOptions());world.add(carModels.group);watchCarAssets(carModels);
        festival.group.visible=quality.id!=='low';scenery?.setQuality?.(quality.id);warmScene();return true;
      },
      onLaps: value => {
        if (mode === 'selecting' || mode === 'countdown' || mode === 'running' || mode === 'finishing') return false;
        laps = value;
        try { localStorage.setItem('race3d-laps', String(laps)); } catch {}
        track.raceDistance = track.totalLength * laps;
        selection.dispose();simulation.dispose(); world.remove(carModels.group); carModels.dispose();
        simulation = createRaceSimulation({ players, track, random });
        carModels = createRaceCars(THREE, simulation.cars,carOptions()); world.add(carModels.group);
        contactShadows.dispose();contactShadows=createContactShadows(THREE,track,simulation.cars);world.add(contactShadows.group);
    selection=createRaceSelection(THREE,{racers:simulation.cars});
        watchCarAssets(carModels);
        reset(); return true;
      },
      totalLength: track.totalLength,
      onContinue: continueWinner,
      onView: changeView,
      onCamera: direction => {
        const order = standings(), count = order.length;
        if (!count) return;
        const current = Math.max(0, order.findIndex(car => car.id === focusedId));
        cameraOffset = (current + Math.sign(direction) + count) % count;
        cameraTargetId = order[cameraOffset].id;
        if (mode === 'idle') chaseCamera?.reset();
        render(0, 0.05);
      },
    });
    resizeObserver = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(resize) : null;
    resizeObserver?.observe(root);
    window.addEventListener('resize', resize, { passive: true });
    track.raceDistance = track.totalLength * laps;
    simulation.reset();
    setPhase('idle');
    resize();
    render(0);
    watchCarAssets(carModels);
    warmScene();
    root.__race3d = {
      snapshot: () => {
        const direction = camera.getWorldDirection(new THREE.Vector3());
        return {
          finishEffects:carModels?.finishSnapshot?.(),phase: mode, shaderReady, laps,quality:{mode:qualityMode,...quality},festival:festival?.stats,
          playbackRate,selection:selection?.snapshot?.()||null,selectionProgress,
          frameBudget:{...frameBudget.snapshot(),actualDpr:renderer.getPixelRatio(),renderScale},city:scenery?.stats,
          countdownRemaining: mode === 'countdown' ? Math.max(0, COUNTDOWN - countdownElapsed) : 0,
          countdownStep: mode === 'countdown' ? Math.max(1, Math.ceil(COUNTDOWN - countdownElapsed)) :
            mode === 'running' && elapsed - goAt < .65 ? 'GO' : null,
          elapsed,
          raceElapsed,
          totalLength: track?.totalLength || 0,
          finishDistance: simulation?.finishDistance || 0,
          picked,
          winnerId,
          focusedId,
          simulationTime: simulation?.time || 0,
          results: (simulation?.results || []).map(result => ({ ...result })),
          allFinished: !!simulation?.allFinished,
          carMotion: carModels?.snapshot?.() || [],
          carAssets: carModels?.assetSnapshot?.() || null,
          damageVisuals: carModels?.damageSnapshot?.() || [],
          audio: audio?.snapshot?.() || null,
          frogs: frogs?.stats || null,
          ramps: ramps?.snapshot?.() || (ramps?.layout || []).map(ramp => ({ ...ramp })),
          skySpirit: skySpirit?.group ? {
            position: { x: skySpirit.group.position.x, y: skySpirit.group.position.y, z: skySpirit.group.position.z },
            rotationY: skySpirit.group.rotation.y,
            vertexSample: Array.from(skySpirit.group.children.find(child => child.geometry?.attributes?.position)?.geometry.attributes.position.array.slice(0, 9) || []),
            projectedCenter: (() => {
              const center = skySpirit.group.localToWorld(new THREE.Vector3(-11, 0, 0)).project(camera);
              return { x: center.x, y: center.y, z: center.z, visible: Math.abs(center.x) < 1.15 && Math.abs(center.y) < 1.15 && center.z > -1 && center.z < 1 };
            })(),
          } : null,
          eventCounts: { ...eventCounts },
          recentEvents: recentEvents.map(event => ({ ...event })),
          pickups: (simulation?.pickups || []).map(item => ({ ...item })),
          hazards: (simulation?.hazards || []).map(item => ({ ...item })),
          projectiles: (simulation?.projectiles || []).map(item => ({ ...item })),
          waves: (simulation?.waves || []).map(item => ({ ...item })),
          activePowers: (simulation?.cars || []).filter(car => car.activeItem || car.boost > 0 || car.spin > 0 || car.flightRemaining > 0 || car.rocketRemaining > 0 || car.shieldRemaining > 0 || car.freezeRemaining > 0)
            .map(car => ({ id: car.id, item: car.activeItem, boost: car.boost || 0, spin: car.spin || 0,
              flight: car.flightRemaining || 0, rocket: car.rocketRemaining || 0,
              shield: car.shieldRemaining || 0, freeze: car.freezeRemaining || 0 })),
          powerupMeshes:(()=>{const counts={};powerups?.group.traverse(mesh=>{if(mesh.isInstancedMesh)counts[mesh.name]=mesh.count;});return counts;})(),
          powerupAssets: powerups?.snapshot?.() || null,
          renderer: {
            calls: renderer.info.render.calls, triangles: renderer.info.render.triangles,
            geometries: renderer.info.memory.geometries, textures: renderer.info.memory.textures,
          },
          camera: {
            x: camera.position.x, y: camera.position.y, z: camera.position.z,
            direction: { x: direction.x, y: direction.y, z: direction.z },
            fov: camera.fov,
            mode: chaseCamera?.mode || 'chase', transition: chaseCamera?.transition,
            tracking: chaseCamera?.snapshot?.() || null,
            hiddenCarId: chaseCamera?.hideFocusedCar ? focusedId : null,
          },
          cars: simulation?.cars.map(car => ({
            inventoryItem:car.inventoryItem,inventoryPhase:car.inventoryPhase,inventorySerial:car.inventorySerial,
            rouletteRemaining:car.rouletteRemaining,itemsCollected:car.itemsCollected,itemsUsed:car.itemsUsed,lastUsedItem:car.lastUsedItem,
            itemDecision:car.itemDecision?{...car.itemDecision}:null,massKg:car.massKg,brakeFactor:car.brakeFactor,powerW:car.powerW,tractionRecovery:car.tractionRecovery||0,
            racerType: car.racerType, vehicleName: car.vehicleName, damageLevel: car.damageLevel,
            hitPoints: car.hitPoints, replacements: car.replacements, replacementRemaining: car.replacementRemaining,
            id: car.id, name: car.name, distance: car.distance, lateral: car.lateral,
            screen: car.screen ? { ...car.screen } : null,
            speed: car.speed ?? car.velocity ?? 0, finished: !!car.finished,
            boost: car.boost || 0, spin: car.spin || 0, brake: car.brake || 0,
            acceleration: car.acceleration || 0, lateralAcceleration: car.lateralAcceleration || 0,
            flightHeight: car.flightHeight || 0, flightRemaining: car.flightRemaining || 0,
            flightKind: car.flightKind || null, rampState: car.rampState || 'ground', rampId: car.rampId ?? null,
            rampHeight: car.rampHeight || 0, rampPitch: car.rampPitch || 0,
            rampPlan:car.rampPlan?{...car.rampPlan}:null,wheelLoads:(car.wheelLoads||[]).map(w=>({...w})),tireGripFactor:car.tireGripFactor||1,
            trickAngle: car.trickAngle || 0, trickFlips: car.trickFlips || 0,
            completedFlips: car.completedFlips || 0, trickSpeedBonus: car.trickSpeedBonus || 0,
            rampTakeoffs: car.rampTakeoffs || 0, spinAngle: car.spinAngle || 0,
            rampTargetId: car.rampTargetId || null, rampTargetLateral: car.rampTargetLateral ?? null,
            rampTargetDistance: car.rampTargetDistance ?? null, rampSeeking: !!car.rampSeeking,
            targetLane: car.targetLane ?? car.preferredLane ?? 0,
            supportY: car.supportY ?? null, supportHeight: car.supportHeight || 0,
            supportPitch: car.supportPitch || 0, supportRoll: car.supportRoll || 0,
            massKg: car.massKg, wheelbase: car.wheelbase, trackWidth: car.trackWidth,
            wheelContacts: (car.wheelContacts || []).map(contact => ({ ...contact })),
            throttle: car.throttle || 0, nitroAcceleration: car.nitroAcceleration || 0,
            rocketAcceleration: car.rocketAcceleration || 0,
            verticalVelocity: car.verticalVelocity || 0, landingImpulse: car.landingImpulse || 0,
            rocketRemaining: car.rocketRemaining || 0, shieldRemaining: car.shieldRemaining || 0,
            repairRemaining: car.repairRemaining || 0,
            freezeRemaining: car.freezeRemaining || 0, damage: car.damage || 0, activeItem: car.activeItem || null,
            finishTime: car.finishTime ?? null, finishPosition: car.finishPosition ?? null,
            drafting: car.draft || car.drafting || 0,
            mistake: car.mistakeTimer || car.mistake || 0, mistakeType: car.mistakeType || null,
          })) || [],
        };
      },
    };
  } catch (error) {
    console.error('Grand Prix 3D failed to initialize', error);
    resizeObserver?.disconnect();
    window.removeEventListener('resize', resize);
    canvas.removeEventListener('wheel', onViewWheel);
    ++selectionEpoch;
    selection?.dispose();
    ui?.destroy();
    audio?.destroy();
    chaseCamera?.dispose();
    effects?.dispose();
    powerups?.dispose();
    ramps?.dispose();
    carModels?.dispose();
    simulation?.dispose();
    scenery?.dispose();
    track?.dispose();
    atmosphere?.dispose();
    skySpirit?.dispose();
    festival?.dispose();contactShadows?.dispose();frogs?.dispose();
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

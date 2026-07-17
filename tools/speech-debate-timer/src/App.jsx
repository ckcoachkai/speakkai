import {
  Bell,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Copy,
  GripVertical,
  Maximize2,
  Mic2,
  Pause,
  Play,
  Plus,
  RotateCcw,
  Save,
  Settings2,
  Shield,
  Swords,
  Trash2,
  Users,
  Volume2,
  VolumeX,
  Zap,
} from 'lucide-react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

const SPEECH_PRESETS = {
  oo5: { group: 'Original Oratory', label: 'MS', duration: 300, green: 240, yellow: 270, red: 300, bell: 300 },
  oo10: { group: 'Original Oratory', label: 'HS', duration: 600, green: 540, yellow: 570, red: 600, bell: 600 },
  extemp7: { group: 'Extemporaneous Speaking', label: 'Extemporaneous Speaking - 7 Minutes', duration: 420, green: 360, yellow: 390, red: 420, bell: 420, extemp: true },
  expo3: { group: 'Expository Speaking', label: 'Expository Speaking - 3 Minutes', duration: 180, green: 120, yellow: 150, red: 180, bell: 180 },
  expo5: { group: 'Expository Speaking', label: 'Expository Speaking - 5 Minutes', duration: 300, green: 240, yellow: 270, red: 300, bell: 300 },
  di10: { group: 'Interpretation', label: 'Dramatic Interpretation - 10 Minutes', duration: 600, green: 540, yellow: 570, red: 600, bell: 600 },
  hi10: { group: 'Interpretation', label: 'Humorous Interpretation - 10 Minutes', duration: 600, green: 540, yellow: 570, red: 600, bell: 600 },
};

const PF_SEGMENTS = [
  { id: 'pf-1', title: 'Constructive', team: 'A', speakerIndex: 1, duration: 240 },
  { id: 'pf-2', title: 'Constructive', team: 'B', speakerIndex: 1, duration: 240 },
  { id: 'pf-3', title: 'Crossfire', speaker: 'Speakers 1 and 2', duration: 180 },
  { id: 'pf-4', title: 'Rebuttal', team: 'A', speakerIndex: 2, duration: 240 },
  { id: 'pf-5', title: 'Rebuttal', team: 'B', speakerIndex: 2, duration: 240 },
  { id: 'pf-6', title: 'Crossfire', speaker: 'Speakers 3 and 4', duration: 180 },
  { id: 'pf-7', title: 'Summary', team: 'A', speakerIndex: 1, duration: 180 },
  { id: 'pf-8', title: 'Summary', team: 'B', speakerIndex: 1, duration: 180 },
  { id: 'pf-9', title: 'Grand Crossfire', speaker: 'All Speakers', duration: 180 },
  { id: 'pf-10', title: 'Final Focus', team: 'A', speakerIndex: 2, duration: 120 },
  { id: 'pf-11', title: 'Final Focus', team: 'B', speakerIndex: 2, duration: 120 },
];

const BP_SEGMENTS = [
  { id: 'bp-1', title: 'Prime Minister', speaker: 'Opening Government', duration: 420, protectedStart: 60, protectedEnd: 60 },
  { id: 'bp-2', title: 'Leader of the Opposition', speaker: 'Opening Opposition', duration: 420, protectedStart: 60, protectedEnd: 60 },
  { id: 'bp-3', title: 'Deputy Prime Minister', speaker: 'Opening Government', duration: 420, protectedStart: 60, protectedEnd: 60 },
  { id: 'bp-4', title: 'Deputy Leader of the Opposition', speaker: 'Opening Opposition', duration: 420, protectedStart: 60, protectedEnd: 60 },
  { id: 'bp-5', title: 'Member of Government', speaker: 'Closing Government', duration: 420, protectedStart: 60, protectedEnd: 60 },
  { id: 'bp-6', title: 'Member of Opposition', speaker: 'Closing Opposition', duration: 420, protectedStart: 60, protectedEnd: 60 },
  { id: 'bp-7', title: 'Government Whip', speaker: 'Closing Government', duration: 420, protectedStart: 60, protectedEnd: 60 },
  { id: 'bp-8', title: 'Opposition Whip', speaker: 'Closing Opposition', duration: 420, protectedStart: 60, protectedEnd: 60 },
];

const JUNIOR_DEFAULT = [
  { id: 'jr-1', title: 'Team A Opening Speech', speaker: 'Team A', duration: 180 },
  { id: 'jr-2', title: 'Team B Opening Speech', speaker: 'Team B', duration: 180 },
  { id: 'jr-3', title: 'Crossfire', speaker: 'Both Teams', duration: 120 },
  { id: 'jr-4', title: 'Team A Rebuttal', speaker: 'Team A', duration: 120 },
  { id: 'jr-5', title: 'Team B Rebuttal', speaker: 'Team B', duration: 120 },
  { id: 'jr-6', title: 'Team A Closing Speech', speaker: 'Team A', duration: 60 },
  { id: 'jr-7', title: 'Team B Closing Speech', speaker: 'Team B', duration: 60 },
];

const EMPTY_CUSTOM_STAGE = {
  title: 'New Stage', speaker: 'Speaker or Team', duration: 180, warnings: [], bell: 'standard', protectedStart: 0, protectedEnd: 0, notes: '',
};

const DEFAULT_CUSTOM_SPEECH = {
  name: 'Custom Speech', duration: '5:00', green: '4:00', yellow: '4:30', red: '5:00', bell: '5:00', grace: '0',
};

function usePersistentState(key, fallback) {
  const [value, setValue] = useState(() => {
    try {
      const stored = window.localStorage.getItem(key);
      return stored ? JSON.parse(stored) : fallback;
    } catch {
      return fallback;
    }
  });

  useEffect(() => {
    try { window.localStorage.setItem(key, JSON.stringify(value)); } catch { /* Storage can be unavailable. */ }
  }, [key, value]);

  return [value, setValue];
}

function clamp(value, min, max) { return Math.min(max, Math.max(min, value)); }

function formatClock(seconds) {
  const safe = Math.max(0, Math.floor(seconds));
  const hours = Math.floor(safe / 3600);
  const minutes = Math.floor((safe % 3600) / 60);
  const secs = safe % 60;
  if (hours > 0) return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  return `${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

function parseClock(value) {
  const text = String(value).trim();
  if (/^\d+$/.test(text)) return Number(text);
  const parts = text.split(':').map(Number);
  if (parts.some((part) => Number.isNaN(part) || part < 0)) return null;
  if (parts.length === 2 && parts[1] < 60) return parts[0] * 60 + parts[1];
  if (parts.length === 3 && parts[1] < 60 && parts[2] < 60) return parts[0] * 3600 + parts[1] * 60 + parts[2];
  return null;
}

function makeId(prefix) { return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`; }

let audioContext = null;
function getAudioContext() {
  const AudioContext = window.AudioContext || window.webkitAudioContext;
  if (!AudioContext) return null;
  if (!audioContext || audioContext.state === 'closed') audioContext = new AudioContext();
  return audioContext;
}

function primeAudio() {
  const context = getAudioContext();
  if (context?.state === 'suspended') context.resume();
}

function playSignal(kind, muted) {
  if (muted) return;
  const context = getAudioContext();
  if (!context) return;
  if (context.state === 'suspended') context.resume();

  const tone = (frequency, start, duration, volume = 0.22) => {
    const oscillator = context.createOscillator();
    const gain = context.createGain();
    oscillator.type = kind === 'strong' ? 'triangle' : 'sine';
    oscillator.frequency.setValueAtTime(frequency, context.currentTime + start);
    gain.gain.setValueAtTime(0.0001, context.currentTime + start);
    gain.gain.exponentialRampToValueAtTime(volume, context.currentTime + start + 0.015);
    gain.gain.exponentialRampToValueAtTime(0.0001, context.currentTime + start + duration);
    oscillator.connect(gain);
    gain.connect(context.destination);
    oscillator.start(context.currentTime + start);
    oscillator.stop(context.currentTime + start + duration + 0.03);
  };

  if (kind === 'soft') {
    tone(880, 0, 0.28, 0.16);
  } else if (kind === 'strong') {
    tone(523, 0, 0.34, 0.3);
    tone(659, 0.3, 0.4, 0.3);
    tone(784, 0.68, 0.55, 0.34);
  } else {
    tone(659, 0, 0.34, 0.25);
    tone(988, 0.12, 0.65, 0.25);
  }
}

function normalizeCustomSpeech(draft) {
  const parsed = {
    label: draft.name.trim() || 'Custom Speech',
    duration: parseClock(draft.duration),
    green: parseClock(draft.green),
    yellow: parseClock(draft.yellow),
    red: parseClock(draft.red),
    bell: parseClock(draft.bell),
    grace: parseClock(draft.grace || '0'),
  };
  if (Object.values(parsed).slice(1).some((value) => value === null)) return null;
  if (!(parsed.green <= parsed.yellow && parsed.yellow <= parsed.red && parsed.red <= parsed.bell)) return null;
  return parsed;
}

function App() {
  const [mode, setMode] = usePersistentState('sdt-mode', 'speech');
  const [speechPreset, setSpeechPreset] = usePersistentState('sdt-speech-event', 'oo5');
  const [debateFormat, setDebateFormat] = usePersistentState('sdt-debate-format', 'pf');
  const [muted, setMuted] = usePersistentState('sdt-muted', false);
  const [flashEnabled, setFlashEnabled] = usePersistentState('sdt-flash', true);
  const [autoAdvance, setAutoAdvance] = usePersistentState('sdt-auto-advance', false);
  const [autoStart, setAutoStart] = usePersistentState('sdt-auto-start', false);
  const [graceChoice, setGraceChoice] = usePersistentState('sdt-grace-choice', '0');
  const [customGrace, setCustomGrace] = usePersistentState('sdt-custom-grace', 15);
  const [extempPrepSeconds, setExtempPrepSeconds] = usePersistentState('sdt-extemp-prep', 1800);
  const [bpMotionSeconds, setBpMotionSeconds] = usePersistentState('sdt-bp-motion-prep', 900);
  const [customSpeechDraft, setCustomSpeechDraft] = usePersistentState('sdt-custom-speech-draft', DEFAULT_CUSTOM_SPEECH);
  const [customSpeechPresets, setCustomSpeechPresets] = usePersistentState('sdt-custom-speech-presets', []);
  const [juniorSegments, setJuniorSegments] = usePersistentState('sdt-junior-format', JUNIOR_DEFAULT);
  const [bpSegments, setBpSegments] = usePersistentState('sdt-bp-format', BP_SEGMENTS);
  const [customSegments, setCustomSegments] = usePersistentState('sdt-custom-debate-draft', [{ ...EMPTY_CUSTOM_STAGE, id: makeId('custom') }]);
  const [customFormatName, setCustomFormatName] = usePersistentState('sdt-custom-debate-name', 'My Debate Format');
  const [savedFormats, setSavedFormats] = usePersistentState('sdt-custom-debate-presets', []);
  const [teamNames, setTeamNames] = usePersistentState('sdt-team-names', { A: 'Team A', B: 'Team B' });
  const [speakerNames, setSpeakerNames] = usePersistentState('sdt-speaker-names', { A1: 'Speaker 1', A2: 'Speaker 2', B1: 'Speaker 1', B2: 'Speaker 2' });
  const [reverseOrder, setReverseOrder] = usePersistentState('sdt-reverse-order', false);

  const [currentStage, setCurrentStage] = useState(0);
  const [elapsed, setElapsed] = useState(0);
  const [runState, setRunState] = useState('idle');
  const [activeClock, setActiveClock] = useState('main');
  const [validationError, setValidationError] = useState('');
  const [pulse, setPulse] = useState('');
  const [editorOpen, setEditorOpen] = useState(false);
  const [prepRemaining, setPrepRemaining] = useState({ speechPrep: extempPrepSeconds, bpMotion: bpMotionSeconds, pfA: 180, pfB: 180, jrA: 120, jrB: 120 });

  const frameRef = useRef(null);
  const startedAtRef = useRef(null);
  const baseElapsedRef = useRef(0);
  const prepBaseRef = useRef(0);
  const activeClockRef = useRef('main');
  const runStateRef = useRef('idle');
  const cuesRef = useRef(new Set());
  const completionRef = useRef(false);
  const dragIndexRef = useRef(null);
  const pulseTimerRef = useRef(null);
  const reducedMotionRef = useRef(false);

  const customSpeech = useMemo(() => normalizeCustomSpeech(customSpeechDraft), [customSpeechDraft]);
  const savedSpeech = customSpeechPresets.find((item) => `saved:${item.id}` === speechPreset);
  const speechTiming = savedSpeech || (speechPreset === 'custom' ? customSpeech : SPEECH_PRESETS[speechPreset]) || SPEECH_PRESETS.oo5;
  const graceSeconds = savedSpeech ? savedSpeech.grace : graceChoice === 'custom' ? customGrace : Number(graceChoice);

  const selectedSavedFormat = savedFormats.find((item) => `saved:${item.id}` === debateFormat);
  const debateSegments = debateFormat === 'pf'
    ? PF_SEGMENTS
    : debateFormat === 'bp'
      ? bpSegments
      : debateFormat === 'junior'
        ? juniorSegments
        : selectedSavedFormat?.segments || customSegments;
  const segment = debateSegments[clamp(currentStage, 0, Math.max(0, debateSegments.length - 1))] || EMPTY_CUSTOM_STAGE;
  const officialLimit = mode === 'speech' ? speechTiming?.bell || 300 : segment.duration || 180;
  const overtime = Math.max(0, elapsed - officialLimit);

  const displayedTeamKey = useCallback((team) => {
    if (!reverseOrder || !team) return team;
    return team === 'A' ? 'B' : team === 'B' ? 'A' : team;
  }, [reverseOrder]);

  const segmentCopy = useCallback((item) => {
    if (!item) return { title: '', speaker: '' };
    if (debateFormat === 'pf' && item.team) {
      const team = displayedTeamKey(item.team);
      return { title: item.title, speaker: `${teamNames[team]} - ${speakerNames[`${team}${item.speakerIndex}`]}` };
    }
    if (debateFormat === 'junior') {
      return {
        title: item.title.replaceAll('Team A', teamNames.A).replaceAll('Team B', teamNames.B),
        speaker: item.speaker.replaceAll('Team A', teamNames.A).replaceAll('Team B', teamNames.B),
      };
    }
    return { title: item.title, speaker: item.speaker };
  }, [debateFormat, displayedTeamKey, speakerNames, teamNames]);

  const currentCopy = segmentCopy(segment);
  const nextSegment = debateSegments[currentStage + 1];
  const nextCopy = segmentCopy(nextSegment);

  const speechStage = elapsed >= (speechTiming?.red ?? officialLimit)
    ? 'red'
    : elapsed >= (speechTiming?.yellow ?? officialLimit)
      ? 'yellow'
      : elapsed >= (speechTiming?.green ?? officialLimit)
        ? 'green'
        : 'neutral';

  const bpStatus = mode === 'debate' && debateFormat === 'bp'
    ? overtime > 0
      ? 'Overtime'
      : elapsed < (segment.protectedStart || 60)
        ? 'Protected Time'
        : elapsed >= officialLimit - (segment.protectedEnd || 60)
          ? 'Final Protected Time'
          : 'POIs Open'
    : '';

  const visualStage = mode === 'speech' ? speechStage : overtime > 0 ? 'red' : debateFormat === 'bp' && bpStatus === 'POIs Open' ? 'green' : 'neutral';

  const timerStatus = mode === 'speech'
    ? overtime > 0
      ? graceSeconds > 0 && overtime <= graceSeconds ? `Grace period - ${formatClock(graceSeconds - overtime)} remaining` : 'Overtime'
      : speechStage === 'neutral' ? 'Official timing' : `${speechStage.charAt(0).toUpperCase()}${speechStage.slice(1)} warning`
    : bpStatus || (overtime > 0 ? 'Overtime' : 'Round timing');

  useEffect(() => {
    reducedMotionRef.current = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches || false;
    const tick = () => {
      if (runStateRef.current === 'running' && startedAtRef.current !== null) {
        const delta = (performance.now() - startedAtRef.current) / 1000;
        if (activeClockRef.current === 'main') {
          setElapsed(baseElapsedRef.current + delta);
        } else {
          const key = activeClockRef.current;
          const remaining = Math.max(0, prepBaseRef.current - delta);
          setPrepRemaining((current) => ({ ...current, [key]: remaining }));
          if (remaining <= 0) {
            runStateRef.current = 'idle';
            setRunState('idle');
            playSignal('strong', muted);
          }
        }
      }
      frameRef.current = requestAnimationFrame(tick);
    };
    frameRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frameRef.current);
  }, [muted]);

  useEffect(() => () => {
    window.clearTimeout(pulseTimerRef.current);
    if (audioContext && audioContext.state !== 'closed') audioContext.close().catch(() => {});
  }, []);

  const firePulse = useCallback((kind) => {
    if (!flashEnabled || reducedMotionRef.current) return;
    setPulse(kind);
    window.clearTimeout(pulseTimerRef.current);
    pulseTimerRef.current = window.setTimeout(() => setPulse(''), 700);
  }, [flashEnabled]);

  const beginMain = useCallback((fromZero = false) => {
    primeAudio();
    const startValue = fromZero ? 0 : elapsed;
    if (fromZero) setElapsed(0);
    activeClockRef.current = 'main';
    setActiveClock('main');
    baseElapsedRef.current = startValue;
    startedAtRef.current = performance.now();
    runStateRef.current = 'running';
    setRunState('running');
  }, [elapsed]);

  const pauseTimer = useCallback(() => {
    if (runStateRef.current !== 'running') return;
    if (activeClockRef.current === 'main') baseElapsedRef.current = elapsed;
    else prepBaseRef.current = prepRemaining[activeClockRef.current] || 0;
    runStateRef.current = 'paused';
    setRunState('paused');
  }, [elapsed, prepRemaining]);

  const resetMain = useCallback(() => {
    if (activeClockRef.current === 'main') {
      runStateRef.current = 'idle';
      setRunState('idle');
    }
    setElapsed(0);
    baseElapsedRef.current = 0;
    cuesRef.current.clear();
    completionRef.current = false;
  }, []);

  const startPrep = useCallback((key) => {
    primeAudio();
    if (runStateRef.current === 'running' && activeClockRef.current === key) {
      pauseTimer();
      return;
    }
    activeClockRef.current = key;
    setActiveClock(key);
    prepBaseRef.current = prepRemaining[key];
    startedAtRef.current = performance.now();
    runStateRef.current = 'running';
    setRunState('running');
  }, [pauseTimer, prepRemaining]);

  const resetPrep = useCallback((key, total) => {
    if (!window.confirm('Reset this prep-time bank?')) return;
    if (activeClockRef.current === key) {
      runStateRef.current = 'idle';
      setRunState('idle');
    }
    setPrepRemaining((current) => ({ ...current, [key]: total }));
  }, []);

  const moveStage = useCallback((direction, startNext = false) => {
    const nextIndex = clamp(currentStage + direction, 0, Math.max(0, debateSegments.length - 1));
    runStateRef.current = 'idle';
    setRunState('idle');
    setCurrentStage(nextIndex);
    setElapsed(0);
    baseElapsedRef.current = 0;
    cuesRef.current.clear();
    completionRef.current = false;
    if (startNext && nextIndex !== currentStage) window.setTimeout(() => beginMain(true), 250);
  }, [beginMain, currentStage, debateSegments.length]);

  useEffect(() => {
    if (activeClock !== 'main' || runState === 'idle') return;
    const cue = (id, at, kind, pulseKind) => {
      if (at >= 0 && elapsed >= at && !cuesRef.current.has(id)) {
        cuesRef.current.add(id);
        playSignal(kind, muted);
        if (pulseKind) firePulse(pulseKind);
      }
    };

    if (mode === 'speech') {
      cue('green', speechTiming.green, 'soft', 'green');
      cue('yellow', speechTiming.yellow, 'soft', 'yellow');
      cue('official', speechTiming.bell, 'standard', 'red');
      if (graceSeconds > 0) cue('grace', speechTiming.bell + graceSeconds, 'strong', 'red');
    } else if (debateFormat === 'bp') {
      cue('poi-open', segment.protectedStart || 60, 'soft', 'green');
      cue('poi-close', officialLimit - (segment.protectedEnd || 60), 'soft', 'yellow');
      cue('official', officialLimit, 'strong', 'red');
    } else {
      (segment.warnings || []).forEach((warning, index) => cue(`warning-${index}`, warning, 'soft', 'yellow'));
      cue('official', officialLimit, segment.bell === 'strong' ? 'strong' : 'standard', 'red');
    }

    if (mode === 'debate' && elapsed >= officialLimit && autoAdvance && !completionRef.current) {
      completionRef.current = true;
      window.setTimeout(() => moveStage(1, autoStart), 350);
    }
  }, [activeClock, autoAdvance, autoStart, debateFormat, elapsed, firePulse, graceSeconds, mode, moveStage, muted, officialLimit, runState, segment, speechTiming]);

  const switchMode = (nextMode) => {
    setMode(nextMode);
    setCurrentStage(0);
    resetMain();
  };

  const switchSpeech = (value) => {
    setSpeechPreset(value);
    const saved = customSpeechPresets.find((item) => `saved:${item.id}` === value);
    if (saved) {
      setCustomSpeechDraft({ name: saved.label, duration: formatClock(saved.duration), green: formatClock(saved.green), yellow: formatClock(saved.yellow), red: formatClock(saved.red), bell: formatClock(saved.bell), grace: String(saved.grace || 0) });
      setGraceChoice('custom');
      setCustomGrace(saved.grace || 0);
    }
    resetMain();
  };

  const switchDebate = (value) => {
    setDebateFormat(value);
    setCurrentStage(0);
    resetMain();
  };

  const saveCustomSpeech = () => {
    const parsed = normalizeCustomSpeech(customSpeechDraft);
    if (!parsed) {
      setValidationError('Use valid M:SS times in increasing warning order.');
      return;
    }
    const saved = { ...parsed, id: makeId('speech') };
    setCustomSpeechPresets((current) => [...current, saved]);
    setSpeechPreset(`saved:${saved.id}`);
    setValidationError('');
  };

  const updateEditorSegments = (updater) => {
    if (debateFormat === 'junior') setJuniorSegments(updater);
    else setCustomSegments(updater);
  };

  const updateStage = (index, patch) => updateEditorSegments((current) => current.map((item, itemIndex) => itemIndex === index ? { ...item, ...patch } : item));
  const addStage = () => updateEditorSegments((current) => [...current, { ...EMPTY_CUSTOM_STAGE, id: makeId('stage') }]);
  const duplicateStage = (index) => updateEditorSegments((current) => {
    const copy = { ...current[index], id: makeId('stage'), title: `${current[index].title} Copy` };
    return [...current.slice(0, index + 1), copy, ...current.slice(index + 1)];
  });
  const deleteStage = (index) => updateEditorSegments((current) => current.length > 1 ? current.filter((_, itemIndex) => itemIndex !== index) : current);
  const dropStage = (targetIndex) => {
    const sourceIndex = dragIndexRef.current;
    if (sourceIndex === null || sourceIndex === targetIndex) return;
    updateEditorSegments((current) => {
      const next = [...current];
      const [moved] = next.splice(sourceIndex, 1);
      next.splice(targetIndex, 0, moved);
      return next;
    });
    dragIndexRef.current = null;
  };

  const saveDebateFormat = (segments = debateFormat === 'junior' ? juniorSegments : customSegments, name = customFormatName) => {
    const saved = { id: makeId('debate'), name: name.trim() || 'Custom Debate Format', segments: segments.map((item) => ({ ...item, id: makeId('stage') })) };
    setSavedFormats((current) => [...current, saved]);
    setDebateFormat(`saved:${saved.id}`);
    setCurrentStage(0);
  };

  const loadSavedFormat = (item) => {
    setCustomFormatName(item.name);
    setCustomSegments(item.segments.map((stage) => ({ ...stage })));
    setDebateFormat('custom');
    setCurrentStage(0);
    resetMain();
  };

  const toggleFullscreen = async () => {
    try {
      if (document.fullscreenElement) await document.exitFullscreen();
      else await document.documentElement.requestFullscreen();
    } catch { /* Fullscreen may be blocked inside a preview. */ }
  };

  useEffect(() => {
    const onKeyDown = (event) => {
      if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement || event.target instanceof HTMLSelectElement) return;
      if (event.code === 'Space') {
        event.preventDefault();
        if (runStateRef.current === 'running') pauseTimer(); else beginMain(false);
      }
      if (event.key.toLowerCase() === 'r') resetMain();
      if (event.key.toLowerCase() === 'f') toggleFullscreen();
      if (event.key.toLowerCase() === 'm') setMuted((current) => !current);
      if (mode === 'debate' && event.key === 'ArrowRight') moveStage(1);
      if (mode === 'debate' && event.key === 'ArrowLeft') moveStage(-1);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [beginMain, mode, moveStage, pauseTimer, resetMain, setMuted]);

  useEffect(() => {
    setPrepRemaining((current) => ({ ...current, speechPrep: extempPrepSeconds }));
  }, [extempPrepSeconds]);
  useEffect(() => {
    setPrepRemaining((current) => ({ ...current, bpMotion: bpMotionSeconds }));
  }, [bpMotionSeconds]);

  const isMainRunning = runState === 'running' && activeClock === 'main';
  const editorSegments = debateFormat === 'junior' ? juniorSegments : customSegments;
  const editorAvailable = debateFormat === 'junior' || debateFormat === 'custom';

  return (
    <div className={`app mode-${mode} stage-${visualStage} ${pulse ? `pulse-${pulse}` : ''}`}>
      <div className="pulse-layer" aria-hidden="true" />
      <header className="topbar">
        <div className="brand">
          <span className="brand-mark"><Mic2 size={23} /></span>
          <div>
            <h1>Student Speech &amp; Debate Timer</h1>
            <p>Practice speeches, manage debate rounds, and stay within competition time.</p>
          </div>
        </div>
        <div className="header-actions">
          <button className="icon-button" onClick={() => setMuted((current) => !current)} title={muted ? 'Turn sound on (M)' : 'Turn sound off (M)'} aria-label={muted ? 'Turn sound on' : 'Turn sound off'}>
            {muted ? <VolumeX size={19} /> : <Volume2 size={19} />}
          </button>
          <button className={`icon-button ${flashEnabled ? 'is-active' : ''}`} onClick={() => setFlashEnabled((current) => !current)} title="Toggle flash effect" aria-label="Toggle flash effect">
            <Zap size={19} />
          </button>
          <button className="icon-button" onClick={toggleFullscreen} title="Fullscreen (F)" aria-label="Fullscreen">
            <Maximize2 size={19} />
          </button>
        </div>
      </header>

      <nav className="mode-switch" aria-label="Timer mode">
        <button className={mode === 'speech' ? 'active' : ''} onClick={() => switchMode('speech')}><Mic2 size={18} /> Speech</button>
        <button className={mode === 'debate' ? 'active' : ''} onClick={() => switchMode('debate')}><Swords size={18} /> Debate</button>
      </nav>

      <main className="workspace">
        <section className="timer-column" aria-label={`${mode} timer`}>
          <div className="event-toolbar">
            <div>
              <span className="eyebrow">{mode === 'speech' ? 'Speech event' : 'Debate format'}</span>
              <strong>{mode === 'speech' ? speechTiming?.label : debateFormat === 'pf' ? 'Public Forum' : debateFormat === 'bp' ? 'British Parliamentary' : debateFormat === 'junior' ? 'Junior Debate - Classroom Default' : selectedSavedFormat?.name || 'Custom Debate Format'}</strong>
            </div>
            {mode === 'speech' ? (
              <select value={speechPreset} onChange={(event) => switchSpeech(event.target.value)} aria-label="Speech event">
                {['Original Oratory', 'Extemporaneous Speaking', 'Expository Speaking', 'Interpretation'].map((group) => (
                  <optgroup label={group} key={group}>
                    {Object.entries(SPEECH_PRESETS).filter(([, preset]) => preset.group === group).map(([key, preset]) => (
                      <option key={key} value={key}>{preset.label}{preset.note ? ` - ${preset.note}` : ''}</option>
                    ))}
                  </optgroup>
                ))}
                <optgroup label="Custom Speech">
                  <option value="custom">Custom Speech Timer</option>
                  {customSpeechPresets.map((preset) => <option key={preset.id} value={`saved:${preset.id}`}>{preset.label}</option>)}
                </optgroup>
              </select>
            ) : (
              <select value={debateFormat} onChange={(event) => switchDebate(event.target.value)} aria-label="Debate format">
                <option value="pf">Public Forum</option>
                <option value="bp">British Parliamentary</option>
                <option value="junior">Junior Debate - Classroom Default</option>
                <option value="custom">Custom Debate Format</option>
                {savedFormats.map((format) => <option key={format.id} value={`saved:${format.id}`}>{format.name}</option>)}
              </select>
            )}
          </div>

          {mode === 'debate' && (
            <div className="segment-heading">
              <span>{currentCopy.speaker}</span>
              <h2>{currentCopy.title}</h2>
              {segment.notes && <p className="segment-notes">{segment.notes}</p>}
              <div className="round-meta">
                <span>Segment {currentStage + 1} of {debateSegments.length}</span>
                <span>{formatClock(officialLimit)}</span>
              </div>
            </div>
          )}

          <div className="timer-surface">
            <div className="status-line">
              <span className={`status-badge status-${visualStage}`}><i />{timerStatus}</span>
              {mode === 'speech' && <span>{speechTiming?.note || speechTiming?.label}</span>}
              {mode === 'debate' && <span>Round progress {Math.min(currentStage + 1, debateSegments.length)}/{debateSegments.length}</span>}
            </div>

            <div className="time-display" aria-live="polite" aria-label={`${timerStatus}, elapsed ${formatClock(elapsed)}`}>
              <strong>{formatClock(elapsed)}</strong>
              {overtime > 0 && <span className="overtime">OVERTIME +{formatClock(overtime)}</span>}
              {mode === 'speech' && overtime > 0 && graceSeconds > 0 && overtime <= graceSeconds && (
                <span className="grace-label">Grace ends in {formatClock(graceSeconds - overtime)}</span>
              )}
            </div>

            <div className="progress-track" aria-hidden="true">
              <span style={{ width: `${clamp((elapsed / officialLimit) * 100, 0, 100)}%` }} />
            </div>

            <div className="next-line">
              {mode === 'speech' ? (
                <><Bell size={17} /> Official limit: <strong>{formatClock(officialLimit)}</strong>{graceSeconds > 0 && <> · Grace: <strong>{formatClock(graceSeconds)}</strong></>}</>
              ) : nextSegment ? (
                <>Next: <strong>{nextCopy.speaker} - {nextCopy.title}</strong> · {formatClock(nextSegment.duration)}</>
              ) : (
                <><Bell size={17} /> Final segment</>
              )}
            </div>

            <div className="main-controls">
              {mode === 'debate' && <button className="secondary-button icon-command" onClick={() => moveStage(-1)} disabled={currentStage === 0} title="Previous stage (Left arrow)"><ChevronLeft size={20} /><span>Previous</span></button>}
              <button className="secondary-button" onClick={resetMain} disabled={elapsed === 0 && runState === 'idle'}><RotateCcw size={18} /> Reset</button>
              {isMainRunning ? (
                <button className="primary-button" onClick={pauseTimer}><Pause size={22} fill="currentColor" /> Pause</button>
              ) : (
                <button className="primary-button" onClick={() => beginMain(false)}><Play size={22} fill="currentColor" /> {runState === 'paused' && activeClock === 'main' ? 'Resume' : 'Start'}</button>
              )}
              {mode === 'debate' && <button className="secondary-button icon-command" onClick={() => moveStage(1)} disabled={currentStage >= debateSegments.length - 1} title="Next stage (Right arrow)"><span>Next</span><ChevronRight size={20} /></button>}
            </div>
          </div>

          {mode === 'debate' && (
            <div className="round-progress" aria-label="Round progress">
              {debateSegments.map((item, index) => <span key={item.id} className={index < currentStage ? 'done' : index === currentStage ? 'current' : ''} />)}
            </div>
          )}

          {mode === 'speech' && speechTiming?.extemp && (
            <PrepBank label="Extemporaneous Prep" clockKey="speechPrep" remaining={prepRemaining.speechPrep} total={extempPrepSeconds} activeClock={activeClock} runState={runState} onToggle={startPrep} onReset={resetPrep} />
          )}

          {mode === 'debate' && debateFormat === 'pf' && (
            <div className="prep-grid">
              <PrepBank label={`${teamNames.A} Prep`} clockKey="pfA" remaining={prepRemaining.pfA} total={180} activeClock={activeClock} runState={runState} onToggle={startPrep} onReset={resetPrep} />
              <PrepBank label={`${teamNames.B} Prep`} clockKey="pfB" remaining={prepRemaining.pfB} total={180} activeClock={activeClock} runState={runState} onToggle={startPrep} onReset={resetPrep} />
            </div>
          )}

          {mode === 'debate' && debateFormat === 'junior' && (
            <div className="prep-grid">
              <PrepBank label={`${teamNames.A} Prep`} clockKey="jrA" remaining={prepRemaining.jrA} total={120} activeClock={activeClock} runState={runState} onToggle={startPrep} onReset={resetPrep} />
              <PrepBank label={`${teamNames.B} Prep`} clockKey="jrB" remaining={prepRemaining.jrB} total={120} activeClock={activeClock} runState={runState} onToggle={startPrep} onReset={resetPrep} />
            </div>
          )}

          {mode === 'debate' && debateFormat === 'bp' && (
            <PrepBank label="Motion Preparation" clockKey="bpMotion" remaining={prepRemaining.bpMotion} total={bpMotionSeconds} activeClock={activeClock} runState={runState} onToggle={startPrep} onReset={resetPrep} />
          )}
        </section>

        <aside className="control-panel" aria-label="Timer settings">
          <div className="panel-heading"><div><span className="eyebrow">Competition controls</span><h2>{mode === 'speech' ? 'Speech Setup' : 'Round Setup'}</h2></div><Settings2 size={22} /></div>

          <section className="control-section">
            <h3><Shield size={17} /> Timing behavior</h3>
            {mode === 'speech' ? (
              <>
                <label className="field-label">Grace period
                  <select value={graceChoice} onChange={(event) => setGraceChoice(event.target.value)}>
                    <option value="0">No grace period</option>
                    <option value="15">15 seconds</option>
                    <option value="30">30 seconds</option>
                    <option value="custom">Custom</option>
                  </select>
                </label>
                {graceChoice === 'custom' && <label className="field-label">Custom grace (seconds)<input type="number" min="0" max="600" value={customGrace} onChange={(event) => setCustomGrace(Math.max(0, Number(event.target.value) || 0))} /></label>}
                {speechTiming?.extemp && <label className="field-label">Prep timer (minutes)<input type="number" min="1" max="120" value={Math.round(extempPrepSeconds / 60)} onChange={(event) => setExtempPrepSeconds(Math.max(60, (Number(event.target.value) || 30) * 60))} /></label>}
              </>
            ) : (
              <>
                <Toggle label="Automatically move to next segment" checked={autoAdvance} onChange={setAutoAdvance} />
                <Toggle label="Automatically start next segment" checked={autoStart} onChange={setAutoStart} disabled={!autoAdvance} />
                {debateFormat === 'bp' && <label className="field-label">Motion prep (minutes)<input type="number" min="1" max="60" value={Math.round(bpMotionSeconds / 60)} onChange={(event) => setBpMotionSeconds(Math.max(60, (Number(event.target.value) || 15) * 60))} /></label>}
              </>
            )}
            <Toggle label="Sound" checked={!muted} onChange={(checked) => setMuted(!checked)} />
            <Toggle label="Controlled screen pulse" checked={flashEnabled} onChange={setFlashEnabled} />
          </section>

          {mode === 'speech' && speechPreset === 'custom' && (
            <section className="control-section">
              <h3><Clock3 size={17} /> Custom speech</h3>
              <div className="custom-speech-grid">
                <label className="wide">Event name<input value={customSpeechDraft.name} onChange={(event) => setCustomSpeechDraft((current) => ({ ...current, name: event.target.value }))} /></label>
                {['duration', 'green', 'yellow', 'red', 'bell', 'grace'].map((key) => <label key={key}>{key === 'duration' ? 'Total time' : key.charAt(0).toUpperCase() + key.slice(1)}<input value={customSpeechDraft[key]} onChange={(event) => setCustomSpeechDraft((current) => ({ ...current, [key]: event.target.value }))} placeholder="M:SS" /></label>)}
              </div>
              {validationError && <p className="validation-error">{validationError}</p>}
              <button className="save-button" onClick={saveCustomSpeech}><Save size={17} /> Save Custom Speech</button>
            </section>
          )}

          {mode === 'speech' && customSpeechPresets.length > 0 && (
            <section className="control-section compact-list">
              <h3><Save size={17} /> Saved speeches</h3>
              {customSpeechPresets.map((preset) => <div className="saved-row" key={preset.id}><button onClick={() => switchSpeech(`saved:${preset.id}`)}>{preset.label} · {formatClock(preset.duration)}</button><button className="danger-icon" onClick={() => setCustomSpeechPresets((current) => current.filter((item) => item.id !== preset.id))} title="Delete saved speech"><Trash2 size={16} /></button></div>)}
            </section>
          )}

          {mode === 'debate' && (debateFormat === 'pf' || debateFormat === 'junior') && (
            <section className="control-section">
              <h3><Users size={17} /> Teams and speakers</h3>
              <div className="team-grid">
                <label>Team A<input value={teamNames.A} onChange={(event) => setTeamNames((current) => ({ ...current, A: event.target.value }))} /></label>
                <label>Team B<input value={teamNames.B} onChange={(event) => setTeamNames((current) => ({ ...current, B: event.target.value }))} /></label>
              </div>
              {debateFormat === 'pf' && <div className="speaker-grid">{['A1', 'A2', 'B1', 'B2'].map((key) => <label key={key}>{key}<input value={speakerNames[key]} onChange={(event) => setSpeakerNames((current) => ({ ...current, [key]: event.target.value }))} /></label>)}</div>}
              {debateFormat === 'pf' && <Toggle label="Reverse which team speaks first" checked={reverseOrder} onChange={setReverseOrder} />}
            </section>
          )}

          {mode === 'debate' && debateFormat === 'junior' && <p className="format-note">Junior debate rules vary. You can edit this format below.</p>}

          {mode === 'debate' && debateFormat === 'bp' && (
            <section className="control-section stage-editor-section">
              <button className="editor-toggle" onClick={() => setEditorOpen((current) => !current)} aria-expanded={editorOpen}>
                <span><Settings2 size={17} /> Edit BP Timings</span><ChevronRight className={editorOpen ? 'rotated' : ''} size={18} />
              </button>
              {editorOpen && (
                <div className="stage-editor bp-editor">
                  <p className="editor-help">Set each speech length and the protected time at the beginning and end.</p>
                  <div className="stage-list">
                    {bpSegments.map((item, index) => (
                      <article className="stage-row bp-stage-row" key={item.id}>
                        <div className="stage-fields">
                          <strong className="wide">{item.title}</strong>
                          <label>Speech (seconds)<input type="number" min="1" value={item.duration} onChange={(event) => setBpSegments((current) => current.map((stage, itemIndex) => itemIndex === index ? { ...stage, duration: Math.max(1, Number(event.target.value) || 1) } : stage))} /></label>
                          <label>Protected start<input type="number" min="0" value={item.protectedStart || 0} onChange={(event) => setBpSegments((current) => current.map((stage, itemIndex) => itemIndex === index ? { ...stage, protectedStart: Math.max(0, Number(event.target.value) || 0) } : stage))} /></label>
                          <label>Protected end<input type="number" min="0" value={item.protectedEnd || 0} onChange={(event) => setBpSegments((current) => current.map((stage, itemIndex) => itemIndex === index ? { ...stage, protectedEnd: Math.max(0, Number(event.target.value) || 0) } : stage))} /></label>
                        </div>
                      </article>
                    ))}
                  </div>
                  <button className="text-command" onClick={() => setBpSegments(BP_SEGMENTS)}><RotateCcw size={15} /> Restore BP defaults</button>
                </div>
              )}
            </section>
          )}

          {mode === 'debate' && editorAvailable && (
            <section className="control-section stage-editor-section">
              <button className="editor-toggle" onClick={() => setEditorOpen((current) => !current)} aria-expanded={editorOpen}><span><Settings2 size={17} /> Edit {debateFormat === 'junior' ? 'Junior Format' : 'Custom Format'}</span><ChevronRight className={editorOpen ? 'rotated' : ''} size={18} /></button>
              {editorOpen && (
                <div className="stage-editor">
                  {debateFormat === 'custom' && <label className="field-label">Format name<input value={customFormatName} onChange={(event) => setCustomFormatName(event.target.value)} /></label>}
                  <div className="stage-list">
                    {editorSegments.map((item, index) => (
                      <article className="stage-row" key={item.id} draggable onDragStart={() => { dragIndexRef.current = index; }} onDragOver={(event) => event.preventDefault()} onDrop={() => dropStage(index)}>
                        <span className="drag-handle" title="Drag to reorder"><GripVertical size={18} /></span>
                        <div className="stage-fields">
                          <label>Stage name<input value={item.title} onChange={(event) => updateStage(index, { title: event.target.value })} /></label>
                          <label>Speaker or team<input value={item.speaker} onChange={(event) => updateStage(index, { speaker: event.target.value })} /></label>
                          <label>Duration (seconds)<input type="number" min="1" value={item.duration} onChange={(event) => updateStage(index, { duration: Math.max(1, Number(event.target.value) || 1) })} /></label>
                          {debateFormat === 'custom' && <>
                            <label>Warnings (seconds)<input value={(item.warnings || []).join(', ')} onChange={(event) => updateStage(index, { warnings: event.target.value.split(',').map(Number).filter((value) => Number.isFinite(value) && value >= 0) })} /></label>
                            <label>Bell<select value={item.bell || 'standard'} onChange={(event) => updateStage(index, { bell: event.target.value })}><option value="standard">Standard</option><option value="strong">Strong</option></select></label>
                            <label>Protected start (sec)<input type="number" min="0" value={item.protectedStart || 0} onChange={(event) => updateStage(index, { protectedStart: Math.max(0, Number(event.target.value) || 0) })} /></label>
                            <label>Protected end (sec)<input type="number" min="0" value={item.protectedEnd || 0} onChange={(event) => updateStage(index, { protectedEnd: Math.max(0, Number(event.target.value) || 0) })} /></label>
                            <label className="wide">Notes<input value={item.notes || ''} onChange={(event) => updateStage(index, { notes: event.target.value })} /></label>
                          </>}
                        </div>
                        <div className="stage-actions"><button onClick={() => duplicateStage(index)} title="Duplicate stage"><Copy size={16} /></button><button onClick={() => deleteStage(index)} title="Delete stage"><Trash2 size={16} /></button></div>
                      </article>
                    ))}
                  </div>
                  <button className="secondary-wide" onClick={addStage}><Plus size={17} /> Add Stage</button>
                  <button className="save-button" onClick={() => saveDebateFormat(editorSegments, debateFormat === 'junior' ? 'Junior Debate Custom' : customFormatName)}><Save size={17} /> Save as Custom Preset</button>
                  <button className="text-command" onClick={() => debateFormat === 'junior' ? setJuniorSegments(JUNIOR_DEFAULT) : setCustomSegments([{ ...EMPTY_CUSTOM_STAGE, id: makeId('custom') }])}><RotateCcw size={15} /> Restore default format</button>
                </div>
              )}
            </section>
          )}

          {mode === 'debate' && savedFormats.length > 0 && (
            <section className="control-section compact-list">
              <h3><Save size={17} /> Saved formats</h3>
              {savedFormats.map((format) => <div className="saved-row" key={format.id}><button onClick={() => loadSavedFormat(format)}>{format.name} · {format.segments.length} stages</button><button className="danger-icon" onClick={() => setSavedFormats((current) => current.filter((item) => item.id !== format.id))} title="Delete saved format"><Trash2 size={16} /></button></div>)}
            </section>
          )}
        </aside>
      </main>

      <footer className="shortcut-footer"><span>Space: start/pause</span><span>R: reset</span><span>F: fullscreen</span><span>M: sound</span>{mode === 'debate' && <><span>Left: previous</span><span>Right: next</span></>}</footer>
    </div>
  );
}

function Toggle({ label, checked, onChange, disabled = false }) {
  return (
    <label className={`toggle-row ${disabled ? 'disabled' : ''}`}>
      <span>{label}</span>
      <input type="checkbox" checked={checked} disabled={disabled} onChange={(event) => onChange(event.target.checked)} />
      <i />
    </label>
  );
}

function PrepBank({ label, clockKey, remaining, total, activeClock, runState, onToggle, onReset }) {
  const running = activeClock === clockKey && runState === 'running';
  return (
    <section className={`prep-bank ${running ? 'is-running' : ''}`} aria-label={`${label} prep timer`}>
      <div className="prep-copy"><span>{label}</span><strong>{formatClock(remaining)}</strong><small>of {formatClock(total)}</small></div>
      <div className="prep-actions">
        <button className="prep-toggle" onClick={() => onToggle(clockKey)}>{running ? <Pause size={17} /> : <Play size={17} fill="currentColor" />} {running ? 'Pause' : remaining < total ? 'Resume' : 'Start'}</button>
        <button className="prep-reset" onClick={() => onReset(clockKey, total)} title={`Reset ${label}`} aria-label={`Reset ${label}`}><RotateCcw size={16} /></button>
      </div>
    </section>
  );
}

export default App;

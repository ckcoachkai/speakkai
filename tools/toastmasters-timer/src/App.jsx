import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  AlarmClock,
  Bell,
  ChevronDown,
  Expand,
  Eye,
  EyeOff,
  Gauge,
  Maximize2,
  Pause,
  Play,
  RotateCcw,
  Settings2,
  Sparkles,
  Volume2,
  VolumeX,
} from 'lucide-react';

const PRESETS = {
  evaluation: {
    label: 'Evaluation Speech',
    shortLabel: 'Evaluation',
    green: 60,
    yellow: 120,
    red: 180,
    bell: 210,
  },
  prepared: {
    label: 'Prepared Speech',
    shortLabel: 'Prepared',
    green: 300,
    yellow: 360,
    red: 420,
    bell: 450,
  },
  tableTopics: {
    label: 'Table Topics',
    shortLabel: 'Table Topics',
    green: 60,
    yellow: 90,
    red: 120,
    bell: 150,
  },
};

const DEFAULT_CUSTOM = {
  label: 'Custom Speech',
  shortLabel: 'Custom',
  green: 60,
  yellow: 90,
  red: 120,
  bell: 150,
};

const SOUND_OPTIONS = [
  { id: 'classic', label: 'Classic Bell', note: 'Single clear bell' },
  { id: 'double', label: 'Double Chime', note: 'Two-stage chime' },
  { id: 'digital', label: 'Digital Buzzer', note: 'Strong electronic alert' },
];

const EFFECT_OPTIONS = [
  { id: 'flash', label: 'Black & White Flash' },
  { id: 'pulse', label: 'Stage Pulse' },
  { id: 'shake', label: 'Screen Shake' },
  { id: 'spotlight', label: 'Spotlight Burst' },
];

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function secondsToClock(totalSeconds, showTenths = false) {
  const safe = Math.max(0, totalSeconds);
  const minutes = Math.floor(safe / 60);
  const seconds = Math.floor(safe % 60);
  if (!showTenths) return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  const tenths = Math.floor((safe % 1) * 10);
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}.${tenths}`;
}

function secondsToEditable(totalSeconds) {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = Math.floor(totalSeconds % 60);
  return `${minutes}:${String(seconds).padStart(2, '0')}`;
}

function parseTimeInput(value) {
  const trimmed = String(value).trim();
  if (!trimmed) return null;

  if (/^\d+$/.test(trimmed)) return Number(trimmed) * 60;

  const match = trimmed.match(/^(\d{1,3}):([0-5]\d)$/);
  if (!match) return null;
  return Number(match[1]) * 60 + Number(match[2]);
}

function getStage(elapsed, timing) {
  if (elapsed >= timing.red) return 'red';
  if (elapsed >= timing.yellow) return 'yellow';
  if (elapsed >= timing.green) return 'green';
  return 'neutral';
}

function buildCueItems(timing) {
  return [
    { stage: 'green', label: 'Green', seconds: timing.green },
    { stage: 'yellow', label: 'Yellow', seconds: timing.yellow },
    { stage: 'red', label: 'Red', seconds: timing.red },
    { stage: 'bell', label: 'Bell', seconds: timing.bell },
  ];
}

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
    try {
      window.localStorage.setItem(key, JSON.stringify(value));
    } catch {
      // localStorage can be unavailable in private or restricted browsing.
    }
  }, [key, value]);

  return [value, setValue];
}

let sharedAudioContext = null;

function getAudioContext() {
  const AudioContext = window.AudioContext || window.webkitAudioContext;
  if (!AudioContext) return null;
  if (!sharedAudioContext || sharedAudioContext.state === 'closed') {
    sharedAudioContext = new AudioContext();
  }
  return sharedAudioContext;
}

function primeAudio() {
  const context = getAudioContext();
  if (context?.state === 'suspended') context.resume();
}

function playAlarm(soundId, muted) {
  if (muted) return;

  const context = getAudioContext();
  if (!context) return;
  if (context.state === 'suspended') context.resume();
  const master = context.createGain();
  master.gain.setValueAtTime(0.0001, context.currentTime);
  master.gain.exponentialRampToValueAtTime(0.32, context.currentTime + 0.02);
  master.connect(context.destination);

  const tone = (frequency, start, duration, type = 'sine', volume = 0.8) => {
    const oscillator = context.createOscillator();
    const gain = context.createGain();
    oscillator.type = type;
    oscillator.frequency.setValueAtTime(frequency, context.currentTime + start);
    gain.gain.setValueAtTime(0.0001, context.currentTime + start);
    gain.gain.exponentialRampToValueAtTime(volume, context.currentTime + start + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, context.currentTime + start + duration);
    oscillator.connect(gain);
    gain.connect(master);
    oscillator.start(context.currentTime + start);
    oscillator.stop(context.currentTime + start + duration + 0.03);
  };

  if (soundId === 'classic') {
    tone(784, 0, 0.18, 'sine', 0.75);
    tone(1174, 0.04, 0.85, 'sine', 0.55);
    tone(1568, 0.08, 1.15, 'sine', 0.18);
  } else if (soundId === 'double') {
    tone(660, 0, 0.45, 'sine', 0.65);
    tone(990, 0.04, 0.65, 'sine', 0.4);
    tone(784, 0.62, 0.55, 'sine', 0.65);
    tone(1174, 0.66, 0.8, 'sine', 0.4);
  } else {
    [0, 0.24, 0.48].forEach((start) => {
      tone(170, start, 0.17, 'square', 0.52);
      tone(235, start + 0.02, 0.15, 'sawtooth', 0.24);
    });
  }

}


function App() {
  const [preset, setPreset] = usePersistentState('tm-preset', 'prepared');
  const [customTiming, setCustomTiming] = usePersistentState('tm-custom-timing', DEFAULT_CUSTOM);
  const [customDraft, setCustomDraft] = useState({
    green: secondsToEditable(customTiming.green),
    yellow: secondsToEditable(customTiming.yellow),
    red: secondsToEditable(customTiming.red),
    bell: secondsToEditable(customTiming.bell),
  });
  const [countdownSeconds, setCountdownSeconds] = usePersistentState('tm-countdown-v2', 0);
  const [sound, setSound] = usePersistentState('tm-sound', 'classic');
  const [effect, setEffect] = usePersistentState('tm-effect', 'flash');
  const [muted, setMuted] = usePersistentState('tm-muted', false);
  const [showTenths, setShowTenths] = usePersistentState('tm-tenths', false);
  const [stageMode, setStageMode] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);

  const [elapsed, setElapsed] = useState(0);
  const [runState, setRunState] = useState('idle'); // idle | countdown | running | paused | finished
  const [countdownRemaining, setCountdownRemaining] = useState(0);
  const [effectActive, setEffectActive] = useState(false);
  const [validationError, setValidationError] = useState('');

  const rafRef = useRef(null);
  const startedAtRef = useRef(null);
  const elapsedBeforeRunRef = useRef(0);
  const countdownEndRef = useRef(null);
  const bellTriggeredRef = useRef(false);
  const effectTimeoutRef = useRef(null);

  const timing = preset === 'custom' ? customTiming : PRESETS[preset];
  const stage = getStage(elapsed, timing);
  const cues = useMemo(() => buildCueItems(timing), [timing]);
  const progress = clamp((elapsed / timing.bell) * 100, 0, 100);
  const overtime = Math.max(0, elapsed - timing.bell);

  const triggerBell = useCallback(() => {
    if (bellTriggeredRef.current) return;
    bellTriggeredRef.current = true;
    playAlarm(sound, muted);
    setEffectActive(true);
    window.clearTimeout(effectTimeoutRef.current);
    effectTimeoutRef.current = window.setTimeout(() => setEffectActive(false), effect === 'flash' ? 2200 : 1800);
  }, [effect, muted, sound]);

  const updateFrame = useCallback(() => {
    const now = performance.now();

    if (runState === 'countdown') {
      const remainingMs = Math.max(0, countdownEndRef.current - now);
      const nextRemaining = Math.ceil(remainingMs / 1000);
      setCountdownRemaining(nextRemaining);

      if (remainingMs <= 0) {
        startedAtRef.current = performance.now();
        elapsedBeforeRunRef.current = 0;
        setElapsed(0);
        setRunState('running');
      }
    }

    if (runState === 'running') {
      const nextElapsed = elapsedBeforeRunRef.current + (now - startedAtRef.current) / 1000;
      setElapsed(nextElapsed);
      if (nextElapsed >= timing.bell) triggerBell();
    }

    rafRef.current = requestAnimationFrame(updateFrame);
  }, [runState, timing.bell, triggerBell]);

  useEffect(() => {
    rafRef.current = requestAnimationFrame(updateFrame);
    return () => cancelAnimationFrame(rafRef.current);
  }, [updateFrame]);

  useEffect(() => () => window.clearTimeout(effectTimeoutRef.current), []);

  const startTimer = useCallback(() => {
    if (runState === 'running' || runState === 'countdown') return;
    primeAudio();

    if (runState === 'paused') {
      startedAtRef.current = performance.now();
      setRunState('running');
      return;
    }

    bellTriggeredRef.current = false;
    elapsedBeforeRunRef.current = 0;
    setElapsed(0);
    setEffectActive(false);

    if (countdownSeconds > 0) {
      countdownEndRef.current = performance.now() + countdownSeconds * 1000;
      setCountdownRemaining(countdownSeconds);
      setRunState('countdown');
    } else {
      startedAtRef.current = performance.now();
      setRunState('running');
    }
  }, [countdownSeconds, runState]);

  const pauseTimer = useCallback(() => {
    if (runState === 'countdown') {
      setRunState('idle');
      setCountdownRemaining(0);
      return;
    }
    if (runState !== 'running') return;
    elapsedBeforeRunRef.current = elapsed;
    setRunState('paused');
  }, [elapsed, runState]);

  const resetTimer = useCallback(() => {
    startedAtRef.current = null;
    countdownEndRef.current = null;
    elapsedBeforeRunRef.current = 0;
    bellTriggeredRef.current = false;
    setRunState('idle');
    setCountdownRemaining(0);
    setElapsed(0);
    setEffectActive(false);
  }, []);

  const switchPreset = (nextPreset) => {
    setPreset(nextPreset);
    resetTimer();
    setSettingsOpen(false);
  };

  const applyCustomTiming = () => {
    const parsed = {
      green: parseTimeInput(customDraft.green),
      yellow: parseTimeInput(customDraft.yellow),
      red: parseTimeInput(customDraft.red),
      bell: parseTimeInput(customDraft.bell),
    };

    if (Object.values(parsed).some((value) => value === null || value < 0)) {
      setValidationError('Use M:SS format, for example 1:30.');
      return;
    }

    if (!(parsed.green < parsed.yellow && parsed.yellow < parsed.red && parsed.red < parsed.bell)) {
      setValidationError('Times must increase in this order: green, yellow, red, bell.');
      return;
    }

    setCustomTiming((current) => ({ ...current, ...parsed }));
    setValidationError('');
    setPreset('custom');
    resetTimer();
  };

  const toggleFullscreen = async () => {
    try {
      if (!document.fullscreenElement) await document.documentElement.requestFullscreen();
      else await document.exitFullscreen();
    } catch {
      // Fullscreen can be blocked in embedded preview environments.
    }
  };

  const previewAlarm = () => playAlarm(sound, muted);

  useEffect(() => {
    const onKeyDown = (event) => {
      if (event.target instanceof HTMLInputElement || event.target instanceof HTMLSelectElement) return;
      if (event.code === 'Space') {
        event.preventDefault();
        if (runState === 'running' || runState === 'countdown') pauseTimer();
        else startTimer();
      }
      if (event.key.toLowerCase() === 'r') resetTimer();
      if (event.key.toLowerCase() === 'f') toggleFullscreen();
      if (event.key.toLowerCase() === 's') setStageMode((current) => !current);
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [pauseTimer, resetTimer, runState, startTimer]);

  const activeCueIndex = cues.findIndex((cue) => elapsed < cue.seconds);
  const nextCue = activeCueIndex === -1 ? null : cues[activeCueIndex];
  const nextCueIn = nextCue ? Math.max(0, nextCue.seconds - elapsed) : 0;

  return (
    <div className={`app stage-${stage} ${stageMode ? 'stage-mode' : ''} ${effectActive ? `effect-${effect}` : ''}`}>
      <div className="effect-layer" aria-hidden="true" />

      <header className="topbar">
        <div className="brand">
          <div className="brand-mark"><Gauge size={22} strokeWidth={2.2} /></div>
          <div>
            <p>Professional Meeting Tool</p>
            <h1>Toastmasters Timer</h1>
          </div>
        </div>

        <div className="topbar-actions">
          <button className="icon-button" onClick={() => setStageMode((current) => !current)} title="Toggle stage mode (S)">
            {stageMode ? <Eye size={19} /> : <EyeOff size={19} />}
          </button>
          <button className="icon-button" onClick={toggleFullscreen} title="Fullscreen (F)">
            <Maximize2 size={19} />
          </button>
          <button className="icon-button mobile-settings" onClick={() => setSettingsOpen((current) => !current)} title="Settings">
            <Settings2 size={19} />
          </button>
        </div>
      </header>

      <main className="workspace">
        <section className="timer-panel" aria-label="Speech timer">
          <div className="preset-row">
            <label htmlFor="preset">Speech format</label>
            <div className="select-wrap">
              <select id="preset" value={preset} onChange={(event) => switchPreset(event.target.value)}>
                <option value="prepared">Prepared Speech</option>
                <option value="evaluation">Evaluation Speech</option>
                <option value="tableTopics">Table Topics</option>
                <option value="custom">Custom Timing</option>
              </select>
              <ChevronDown size={18} aria-hidden="true" />
            </div>
          </div>

          <div className="timer-card">
            <div className="timer-status-row">
              <span className={`status-pill status-${stage}`}>
                <span className="status-dot" />
                {runState === 'countdown' ? 'Get Ready' : stage === 'neutral' ? 'Timing' : stage.charAt(0).toUpperCase() + stage.slice(1)}
              </span>
              <span className="speech-name">{timing.label}</span>
            </div>

            <div className="time-display" aria-live="polite" aria-label={`Elapsed time ${secondsToClock(elapsed)}`}>
              {runState === 'countdown' ? (
                <div className="countdown-display">
                  <span>Starting in</span>
                  <strong>{countdownRemaining}</strong>
                </div>
              ) : (
                <>
                  <span className="digits">{secondsToClock(elapsed, showTenths)}</span>
                  {overtime > 0 && <span className="overtime">+{secondsToClock(overtime)}</span>}
                </>
              )}
            </div>

            <div className="progress-shell" aria-hidden="true">
              <div className="progress-fill" style={{ width: `${progress}%` }} />
              {cues.slice(0, 3).map((cue) => (
                <span
                  key={cue.stage}
                  className={`progress-marker marker-${cue.stage}`}
                  style={{ left: `${(cue.seconds / timing.bell) * 100}%` }}
                />
              ))}
            </div>

            <div className="next-cue">
              {nextCue ? (
                <>
                  <span>Next signal</span>
                  <strong className={`cue-${nextCue.stage}`}>{nextCue.label}</strong>
                  <span>in {secondsToClock(nextCueIn)}</span>
                </>
              ) : (
                <><Bell size={16} /> Bell completed</>
              )}
            </div>

            <div className="timer-controls">
              <button className="secondary-button" onClick={resetTimer} disabled={runState === 'idle' && elapsed === 0}>
                <RotateCcw size={18} /> Reset
              </button>
              {runState === 'running' || runState === 'countdown' ? (
                <button className="primary-button" onClick={pauseTimer}>
                  <Pause size={21} fill="currentColor" /> Pause
                </button>
              ) : (
                <button className="primary-button" onClick={startTimer}>
                  <Play size={21} fill="currentColor" /> {runState === 'paused' ? 'Resume' : 'Start Timer'}
                </button>
              )}
              <button className="secondary-button" onClick={toggleFullscreen}>
                <Expand size={18} /> Fullscreen
              </button>
            </div>
          </div>

          <div className="cue-grid">
            {cues.map((cue) => (
              <article key={cue.stage} className={`cue-card cue-card-${cue.stage} ${elapsed >= cue.seconds ? 'is-reached' : ''}`}>
                <div className="cue-card-icon">
                  {cue.stage === 'bell' ? <Bell size={18} /> : <span />}
                </div>
                <div>
                  <p>{cue.label}</p>
                  <strong>{secondsToClock(cue.seconds)}</strong>
                </div>
              </article>
            ))}
          </div>
        </section>

        <aside className={`settings-panel ${settingsOpen ? 'is-open' : ''}`}>
          <div className="settings-heading">
            <div>
              <p>Timer setup</p>
              <h2>Meeting Controls</h2>
            </div>
            <Settings2 size={21} />
          </div>

          <section className="settings-section">
            <div className="section-title"><AlarmClock size={18} /><h3>Start countdown</h3></div>
            <label className="countdown-field" htmlFor="countdown-seconds">
              <span>Seconds before timing begins</span>
              <input
                id="countdown-seconds"
                type="number"
                min="0"
                max="60"
                step="1"
                value={countdownSeconds}
                onChange={(event) => setCountdownSeconds(clamp(Number(event.target.value) || 0, 0, 60))}
              />
            </label>
            <p className="field-note">Use 0 to start immediately.</p>
          </section>

          <section className="settings-section">
            <div className="section-title"><Volume2 size={18} /><h3>Alarm sound</h3></div>
            <div className="sound-list">
              {SOUND_OPTIONS.map((option) => (
                <button key={option.id} className={`sound-option ${sound === option.id ? 'selected' : ''}`} onClick={() => setSound(option.id)}>
                  <span className="radio-dot" />
                  <span><strong>{option.label}</strong><small>{option.note}</small></span>
                </button>
              ))}
            </div>
            <div className="sound-actions">
              <button className="text-button" onClick={() => setMuted((current) => !current)}>
                {muted ? <VolumeX size={16} /> : <Volume2 size={16} />}
                {muted ? 'Unmute' : 'Mute'}
              </button>
              <button className="text-button" onClick={previewAlarm}><Bell size={16} /> Preview</button>
            </div>
          </section>

          <section className="settings-section">
            <div className="section-title"><Sparkles size={18} /><h3>Bell effect</h3></div>
            <div className="effect-grid">
              {EFFECT_OPTIONS.map((option) => (
                <button key={option.id} className={effect === option.id ? 'selected' : ''} onClick={() => setEffect(option.id)}>
                  <span className={`effect-swatch effect-swatch-${option.id}`} />
                  {option.label}
                </button>
              ))}
            </div>
          </section>

          <section className="settings-section custom-section">
            <div className="section-title"><Settings2 size={18} /><h3>Custom timing</h3></div>
            <p className="section-help">Enter M:SS. Each signal must occur later than the one before it.</p>
            <div className="custom-grid">
              {['green', 'yellow', 'red', 'bell'].map((key) => (
                <label key={key}>
                  <span><i className={`mini-dot mini-${key}`} />{key.charAt(0).toUpperCase() + key.slice(1)}</span>
                  <input
                    value={customDraft[key]}
                    inputMode="numeric"
                    onChange={(event) => setCustomDraft((current) => ({ ...current, [key]: event.target.value }))}
                    aria-label={`${key} signal time`}
                  />
                </label>
              ))}
            </div>
            {validationError && <p className="validation-error">{validationError}</p>}
            <button className="apply-button" onClick={applyCustomTiming}>Apply Custom Timing</button>
          </section>

          <section className="settings-section compact-section">
            <label className="toggle-row">
              <span><strong>Show tenths</strong><small>Useful for rehearsal precision</small></span>
              <input type="checkbox" checked={showTenths} onChange={(event) => setShowTenths(event.target.checked)} />
              <span className="toggle-track" />
            </label>
          </section>
        </aside>
      </main>

      <footer className="footer">
        <span>Space: start/pause</span>
        <span>R: reset</span>
        <span>F: fullscreen</span>
        <span>S: stage mode</span>
      </footer>
    </div>
  );
}

export default App;

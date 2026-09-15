export function createSoundController(getSettings) {
  let context = null, master = null;

  function ensureContext() {
    if (!context) {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (!AudioContext) return null;
      context = new AudioContext();
      master = context.createGain(); master.connect(context.destination);
    }
    const settings = getSettings();
    master.gain.setTargetAtTime(settings.soundEnabled ? settings.soundVolume : 0, context.currentTime, .02);
    if (context.state === "suspended") context.resume().catch(()=>{});
    return context;
  }

  function tone(frequency, duration=.12, type="sine", delay=0, gain=.16) {
    const audio = ensureContext();
    if (!audio || !getSettings().soundEnabled) return;
    const oscillator=audio.createOscillator(), envelope=audio.createGain(), start=audio.currentTime+delay;
    oscillator.type=type; oscillator.frequency.setValueAtTime(frequency,start);
    envelope.gain.setValueAtTime(.0001,start); envelope.gain.exponentialRampToValueAtTime(Math.max(.001,gain),start+.018); envelope.gain.exponentialRampToValueAtTime(.0001,start+duration);
    oscillator.connect(envelope); envelope.connect(master); oscillator.start(start); oscillator.stop(start+duration+.025);
  }

  function play(cue="good") {
    if (!getSettings().soundEnabled) return;
    if (typeof cue === "object") cue = cue.action || cue.kind || (cue.damage ? "attack" : "good");
    if (cue === "bad") { tone(150,.2,"sawtooth",0,.12); tone(105,.24,"square",.06,.07); }
    else if (cue === "warn") { tone(260,.12,"triangle",0,.12); tone(220,.16,"triangle",.09,.1); }
    else if (cue === "attack" || cue === "monster" || cue === "trap") { tone(190,.08,"square",0,.09); tone(110,.12,"sawtooth",.045,.07); }
    else if (cue === "spell") { tone(420,.14,"sine",0,.12); tone(630,.2,"triangle",.06,.09); }
    else if (cue === "potion" || cue === "heal") { tone(360,.14,"sine",0,.11); tone(520,.18,"sine",.07,.09); }
    else if (cue === "loot" || cue === "craft") { tone(440,.1,"triangle",0,.11); tone(660,.12,"triangle",.07,.1); tone(880,.18,"sine",.14,.08); }
    else { tone(330,.09,"triangle",0,.09); tone(495,.14,"sine",.065,.07); }
  }

  function sync() { if (context && master) ensureContext(); }
  return { play, sync };
}

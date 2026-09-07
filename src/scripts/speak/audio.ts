export class AudioEngine {
  context: AudioContext | null = null;
  stream: MediaStream | null = null;
  source: MediaStreamAudioSourceNode | null = null;
  analyser: AnalyserNode | null = null;
  frame = 0;
  private processor: ScriptProcessorNode | null = null;
  private mute: GainNode | null = null;
  epoch = 0;
  oscillators = new Set<OscillatorNode>();
  private onLevel: (level: number) => void;
  constructor(onLevel: (level: number) => void) {
    this.onLevel = onLevel;
  }
  async unlock() {
    if (!this.context || this.context.state === "closed")
      this.context = new AudioContext();
    if (this.context.state === "suspended") await this.context.resume();
  }
  async microphone(deviceId = '', noiseSuppression = true) {
    const epoch = ++this.epoch;
    const stream = await navigator.mediaDevices.getUserMedia({
      audio: {
        echoCancellation: true,
        noiseSuppression,
        autoGainControl: true,
        ...(deviceId ? { deviceId: { exact: deviceId } } : {}),
      },
    });
    if (epoch !== this.epoch) {
      stream.getTracks().forEach((t) => t.stop());
      throw new Error("cancelled");
    }
    this.stream = stream;
    if (!this.context || this.context.state === "closed") return;
    this.source = this.context.createMediaStreamSource(stream);
    this.analyser = this.context.createAnalyser();
    this.analyser.fftSize = 256;
    this.source.connect(this.analyser);
    const samples = new Uint8Array(256);
    const tick = () => {
      if (!this.analyser) return;
      this.analyser.getByteTimeDomainData(samples);
      const rms = Math.sqrt(
        samples.reduce((sum, s) => sum + ((s - 128) / 128) ** 2, 0) /
          samples.length,
      );
      this.onLevel(Math.min(1, rms * 5));
      this.frame = requestAnimationFrame(tick);
    };
    tick();
  }
  siren(volume: number) {
    const ctx = this.context;
    if (!ctx || ctx.state !== "running" || volume <= 0) return;
    this.silence();
    const oscillator = ctx.createOscillator(),
      gain = ctx.createGain(),
      now = ctx.currentTime;
    oscillator.type = "sawtooth";
    oscillator.frequency.setValueAtTime(440, now);
    oscillator.frequency.exponentialRampToValueAtTime(1000, now + 0.25);
    oscillator.frequency.exponentialRampToValueAtTime(500, now + 0.5);
    oscillator.frequency.exponentialRampToValueAtTime(1100, now + 0.75);
    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(Math.min(1, volume) * 0.18, now + 0.025);
    gain.gain.setValueAtTime(Math.min(1, volume) * 0.18, now + 0.7);
    gain.gain.linearRampToValueAtTime(0, now + 0.85);
    oscillator.connect(gain);
    gain.connect(ctx.destination);
    this.oscillators.add(oscillator);
    oscillator.onended = () => {
      oscillator.disconnect();
      gain.disconnect();
      this.oscillators.delete(oscillator);
    };
    oscillator.start(now);
    oscillator.stop(now + 0.86);
  }
  silence() {
    this.oscillators.forEach((o) => {
      try {
        o.stop();
      } catch {}
    });
    this.oscillators.clear();
  }
  startProcessing(consume: (buffer: AudioBuffer) => void) {
    if (!this.context || !this.source)
      throw new Error("Microphone is not ready");
    this.stopProcessing();
    // A worker performs recognition; this small node only forwards PCM samples.
    this.processor = this.context.createScriptProcessor(4096, 1, 1);
    this.processor.onaudioprocess = (event) => consume(event.inputBuffer);
    this.mute = this.context.createGain();
    this.mute.gain.value = 0;
    this.source.connect(this.processor);
    this.processor.connect(this.mute);
    this.mute.connect(this.context.destination);
  }
  stopProcessing() {
    if (this.processor) {
      this.processor.onaudioprocess = null;
      try {
        this.source?.disconnect(this.processor);
      } catch {}
      this.processor.disconnect();
      this.processor = null;
    }
    this.mute?.disconnect();
    this.mute = null;
  }
  releaseMicrophone() {
    this.stopProcessing();
    this.epoch++;
    cancelAnimationFrame(this.frame);
    this.stream?.getTracks().forEach((t) => t.stop());
    this.stream = null;
    this.source?.disconnect();
    this.source = null;
    this.analyser = null;
    this.onLevel(0);
  }
  dispose() {
    this.releaseMicrophone();
    this.silence();
    void this.context?.close();
    this.context = null;
  }
}

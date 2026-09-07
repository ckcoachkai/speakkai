import { AudioEngine } from './audio';
export class PracticeAudio extends AudioEngine {
  private capture: AudioWorkletNode | null = null;
  private zero: GainNode | null = null;
  async startCapture(deviceId: string, receive: (data: Float32Array, rate: number) => void) {
    await this.microphone(deviceId, false);
    const context = this.context!, source = this.source!, epoch = this.epoch;
    if (!context.audioWorklet) {
      this.startProcessing(buffer => receive(buffer.getChannelData(0).slice(),buffer.sampleRate)); return;
    }
    await context.audioWorklet.addModule('/speech-v1/capture-worklet.mjs');
    if (epoch !== this.epoch || !this.stream) throw new Error('cancelled');
    this.capture = new AudioWorkletNode(context,'speak-capture');
    this.capture.port.onmessage = ({ data }) => { if (epoch === this.epoch) receive(data,context.sampleRate); };
    this.zero = context.createGain(); this.zero.gain.value = 0;
    source.connect(this.capture); this.capture.connect(this.zero); this.zero.connect(context.destination);
  }
  override releaseMicrophone() {
    if (this.capture) { this.capture.port.onmessage = null; this.capture.port.close(); this.capture.disconnect(); this.capture = null; }
    this.zero?.disconnect(); this.zero = null;
    super.releaseMicrophone();
  }
}

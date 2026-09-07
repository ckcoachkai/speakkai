// Only capture PCM here. All model work stays in a separate worker.
class SpeakCapture extends AudioWorkletProcessor {
  buffer = new Float32Array(1024);
  used = 0;
  process(inputs) {
    const input = inputs[0];
    if (!input?.length) return true;
    for (let i = 0; i < input[0].length; i++) {
      let value = 0;
      for (const channel of input) value += channel[i];
      this.buffer[this.used++] = value / input.length;
      if (this.used === this.buffer.length) {
        this.port.postMessage(this.buffer, [this.buffer.buffer]);
        this.buffer = new Float32Array(1024); this.used = 0;
      }
    }
    return true;
  }
}
registerProcessor('speak-capture', SpeakCapture);

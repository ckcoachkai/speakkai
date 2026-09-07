export type FillerEvent = { start: number; end: number; confidence: number; type: string };
export type Inference = { events: FillerEvent[]; ms: number };
export class AcousticEngine {
  private worker: Worker | null = null;
  private request = 0;
  private cancel: ((error: Error) => void) | null = null;
  private pending: { id: number; resolve: (r: Inference) => void; reject: (e: Error) => void; timer: number } | null = null;
  ready = false;
  backend = '';
  async prepare(forceCPU: boolean, progress: (text: string) => void) {
    this.dispose();
    const worker = new Worker('/speech-v1/worker.mjs', { type:'module' });
    this.worker = worker;
    return new Promise<void>((resolve, reject) => {
      const timeout = window.setTimeout(() => fail(new Error('Model preparation timed out. Check your connection or try CPU mode.')), 180000);
      const fail = (error: Error) => { clearTimeout(timeout); this.cancel = null; this.dispose(); reject(error); };
      this.cancel = fail;
      worker.onerror = () => {
        if (this.worker !== worker) return;
        const error = new Error('Speech processing could not start. Reload the page or try CPU mode.');
        if (!this.ready) fail(error); else { this.pending?.reject(error); this.dispose(); }
      };
      worker.onmessage = ({ data }) => {
        if (this.worker !== worker) return;
        if (data.type === 'progress') progress(data.text);
        if (data.type === 'ready') {
          clearTimeout(timeout); this.cancel = null; this.ready = true; this.backend = data.backend; resolve();
        }
        if (data.type === 'error') {
          const error = new Error(data.message);
          if (!this.ready) fail(error); else { this.pending?.reject(error); this.dispose(); }
        }
        if (data.type === 'result' && this.pending?.id === data.id) {
          const task = this.pending!; this.pending = null; clearTimeout(task.timer); task.resolve(data);
        }
      };
      worker.postMessage({ type:'prepare', forceCPU });
    });
  }
  infer(samples: Float32Array, threshold: number) {
    if (!this.worker || !this.ready || this.pending) return Promise.reject(new Error('Speech processing is not ready. Please restart practice.'));
    const id = ++this.request;
    return new Promise<Inference>((resolve, reject) => {
      const timer = window.setTimeout(() => {
        const task = this.pending; this.pending = null;
        task?.reject(new Error('Your device took too long to process speech. Try CPU mode or another browser.')); this.dispose();
      }, 15000);
      this.pending = { id, resolve, reject, timer };
      this.worker!.postMessage({ type:'infer', id, samples, threshold }, [samples.buffer]);
    });
  }
  dispose() {
    const cancel = this.cancel; this.cancel = null;
    this.worker?.terminate(); this.worker = null; this.ready = false;
    if (this.pending) { const task = this.pending; this.pending = null; clearTimeout(task.timer); task.reject(new Error('cancelled')); }
    cancel?.(new Error('cancelled'));
  }
}

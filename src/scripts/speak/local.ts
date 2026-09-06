import type { AudioEngine } from "./audio";
import type { Recognition, ResultEvent } from "./session";

type Message = { result?: { partial?: string; text?: string }; error?: string };
type Decoder = {
  on: (event: string, fn: (message: Message) => void) => void;
  acceptWaveform: (buffer: AudioBuffer) => void;
  remove: () => void;
};
type Model = {
  ready: boolean;
  on: (
    event: string,
    fn: (message: { result?: boolean; error?: string }) => void,
  ) => void;
  terminate: () => void;
  KaldiRecognizer: new (sampleRate: number) => Decoder;
};
type VoskLibrary = { Model: new (url: string, logLevel: number) => Model };
const library = () => (window as unknown as { Vosk?: VoskLibrary }).Vosk;

export class LocalEngine {
  private model: Model | null = null;
  private cancel: (() => void) | null = null;
  get ready() {
    return Boolean(this.model?.ready);
  }
  async prepare() {
    if (this.ready) return;
    const failure = (message: string) => {
      const error = new Error(message);
      error.name = "ModelLoadError";
      return error;
    };
    await new Promise<void>((resolve, reject) => {
      let settled = false;
      const finish = (error?: Error) => {
        if (settled) return;
        settled = true;
        clearTimeout(timeout);
        this.cancel = null;
        if (error) {
          this.model?.terminate();
          this.model = null;
          reject(error);
        } else resolve();
      };
      const timeout = setTimeout(
        () =>
          finish(
            failure(
              "The on-device English model took too long to load. Check your connection to SpeakKai, then retry.",
            ),
          ),
        120000,
      );
      this.cancel = () => finish(failure("Model preparation cancelled."));
      const loadModel = () => {
        if (settled) return;
        try {
          this.model = new (library()!.Model)(
            new URL(
              "/speech-model/english-small-0.15.tar.gz",
              location.origin,
            ).href,
            -1,
          );
          this.model.on("load", (message) =>
            message.result
              ? finish()
              : finish(
                  failure(
                    "The English model could not load. Reload this page and retry.",
                  ),
                ),
          );
          this.model.on("error", () =>
            finish(
              failure(
                "On-device recognition could not initialize. Try a current desktop browser and allow enough memory for the English model.",
              ),
            ),
          );
        } catch {
          finish(
            failure(
              "This browser could not start the on-device recognizer. Try desktop Chrome or Edge.",
            ),
          );
        }
      };
      if (library()) {
        loadModel();
        return;
      }
      const script = document.createElement("script");
      script.src = "/speech-model/vosk-0.0.8.js";
      script.async = true;
      script.onload = loadModel;
      script.onerror = () => {
        script.remove();
        finish(
          failure(
            "The recognition files could not download from SpeakKai. Check the connection and retry.",
          ),
        );
      };
      document.head.append(script);
    });
  }
  cancelPreparing() {
    this.cancel?.();
  }
  createRecognition(audio: AudioEngine): Recognition {
    if (!this.model?.ready || !audio.context)
      throw new Error("Local model is not ready");
    return new LocalRecognition(this.model, audio);
  }
  dispose() {
    this.cancelPreparing();
    this.model?.terminate();
    this.model = null;
  }
}

// Adapts streaming on-device results to the same tested session logic.
export class LocalRecognition implements Recognition {
  continuous = true;
  interimResults = true;
  lang = "en-US";
  maxAlternatives = 1;
  onstart: Recognition["onstart"] = null;
  onresult: Recognition["onresult"] = null;
  onerror: Recognition["onerror"] = null;
  onend: Recognition["onend"] = null;
  private model: Model;
  private audio: AudioEngine;
  private decoder: Decoder | null = null;
  private stopped = true;
  private completed: Array<{ isFinal: boolean; 0: { transcript: string } }> =
    [];
  constructor(model: Model, audio: AudioEngine) {
    this.model = model;
    this.audio = audio;
  }
  start() {
    this.stopped = false;
    this.completed = [];
    const decoder = new this.model.KaldiRecognizer(
      this.audio.context!.sampleRate,
    );
    this.decoder = decoder;
    const deliver = (text: string, final: boolean) => {
      if (this.stopped) return;
      const result = { isFinal: final, 0: { transcript: text } };
      const event: ResultEvent = {
        resultIndex: this.completed.length,
        results: [...this.completed, result],
      };
      this.onresult?.(event);
      if (final && text.trim()) this.completed.push(result);
    };
    decoder.on("partialresult", (message) =>
      deliver(message.result?.partial ?? "", false),
    );
    decoder.on("result", (message) =>
      deliver(message.result?.text ?? "", true),
    );
    decoder.on("error", () => {
      if (!this.stopped) this.onerror?.({ error: "local-recognition" });
    });
    this.audio.startProcessing((buffer) => {
      if (!this.stopped)
        try {
          decoder.acceptWaveform(buffer);
        } catch {
          this.onerror?.({ error: "local-recognition" });
        }
    });
    this.onstart?.();
  }
  abort() {
    this.stopped = true;
    this.audio.stopProcessing();
    this.decoder?.remove();
    this.decoder = null;
  }
}

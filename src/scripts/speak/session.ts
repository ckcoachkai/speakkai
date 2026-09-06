import { findFillers, type Match } from "./detector.ts";

export type Snapshot = {
  status:
    | "idle"
    | "starting"
    | "listening"
    | "reconnecting"
    | "stopped"
    | "error";
  transcript: string;
  matches: Match[];
  counts: Record<string, number>;
  total: number;
  elapsed: number;
  error: string;
};
export const INITIAL: Snapshot = {
  status: "idle",
  transcript: "",
  matches: [],
  counts: {},
  total: 0,
  elapsed: 0,
  error: "",
};
type Result = { isFinal: boolean; 0: { transcript: string } };
export type ResultEvent = { resultIndex: number; results: ArrayLike<Result> };
export type Recognition = {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  maxAlternatives: number;
  onstart: (() => void) | null;
  onresult: ((event: ResultEvent) => void) | null;
  onerror: ((event: { error: string }) => void) | null;
  onend: (() => void) | null;
  start: () => void;
  abort: () => void;
};
export type RecognitionConstructor = new () => Recognition;
type Dependencies = {
  createRecognition: () => Recognition;
  microphone: () => Promise<void>;
  releaseMicrophone: () => void;
  onChange: (snapshot: Snapshot) => void;
  onFiller: (word: string) => void;
  now?: () => number;
};
type Segment = { text: string; peak: number };
export class Session {
  snapshot: Snapshot = { ...INITIAL };
  private recognition: Recognition | null = null;
  private selected: string[] = [];
  private segments = new Map<string, Segment>();
  private epoch = 0;
  private cycle = 0;
  private wanted = false;
  private started: number | null = null;
  private timer: ReturnType<typeof setInterval> | null = null;
  private retry: ReturnType<typeof setTimeout> | null = null;
  private watchdog: ReturnType<typeof setTimeout> | null = null;
  private emptyRestarts = 0;
  private deps: Dependencies;
  constructor(deps: Dependencies) {
    this.deps = deps;
  }
  private now() {
    return this.deps.now?.() ?? performance.now();
  }
  private emit() {
    this.deps.onChange({
      ...this.snapshot,
      counts: { ...this.snapshot.counts },
    });
  }
  private tick() {
    if (this.started !== null)
      this.snapshot.elapsed = this.now() - this.started;
    this.emit();
  }
  async start(selected: string[]) {
    if (this.wanted || !selected.length) return;
    this.reset();
    this.selected = [...selected];
    this.wanted = true;
    const epoch = ++this.epoch;
    this.snapshot.status = "starting";
    this.emit();
    try {
      await this.deps.microphone();
      if (!this.wanted || epoch !== this.epoch) return;
      this.connect(epoch);
    } catch (error) {
      if (epoch !== this.epoch) return;
      const name = (error as Error).name;
      this.fail(
        name === "NotAllowedError"
          ? "Microphone access was denied. Allow it in browser site settings, then try again."
          : name === "NotFoundError"
            ? "No microphone was found. Connect one and try again."
            : "Could not access the microphone. Check your device and browser permissions.",
      );
    }
  }
  private connect(epoch: number) {
    if (!this.wanted || epoch !== this.epoch) return;
    const cycle = ++this.cycle;
    let rec: Recognition;
    try {
      rec = this.deps.createRecognition();
    } catch {
      this.fail(
        "Speech recognition is unavailable. Try desktop Google Chrome.",
      );
      return;
    }
    this.recognition = rec;
    rec.continuous = true;
    rec.interimResults = true;
    rec.lang = "en-US";
    rec.maxAlternatives = 1;
    const current = () =>
      this.wanted && epoch === this.epoch && this.recognition === rec;
    rec.onstart = () => {
      if (!current()) return;
      if (this.watchdog) clearTimeout(this.watchdog);
      this.snapshot.status = "listening";
      if (this.started === null) {
        this.started = this.now();
        this.timer = setInterval(() => this.tick(), 250);
      }
      this.emit();
    };
    rec.onresult = (event) => {
      if (!current()) return;
      this.emptyRestarts = 0;
      for (const key of this.segments.keys()) {
        const [keyCycle, index] = key.split(":").map(Number);
        if (keyCycle === cycle && index >= event.results.length)
          this.segments.delete(key);
      }
      let alertWord = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i],
          key = `${cycle}:${i}`,
          text = result[0].transcript;
        const matches = findFillers(text, this.selected),
          previous = this.segments.get(key);
        // High-water mark prevents interim/final revisions from repeating an alarm.
        if (matches.length > (previous?.peak ?? 0))
          alertWord = matches[matches.length - 1].word;
        this.segments.set(key, {
          text,
          peak: Math.max(matches.length, previous?.peak ?? 0),
        });
      }
      this.recount();
      this.emit();
      if (alertWord) this.deps.onFiller(alertWord);
    };
    rec.onerror = (event) => {
      if (!current() || event.error === "no-speech") return;
      const errors: Record<string, string> = {
        "not-allowed":
          "Speech recognition permission was denied. Allow the microphone in browser site settings, then retry.",
        "service-not-allowed":
          "Your browser speech service is unavailable. Try desktop Google Chrome.",
        "audio-capture":
          "The microphone stopped working. Check the connection and try again.",
        network:
          "The browser speech service could not connect. Check your internet connection. This service may be unavailable on your network.",
        "language-not-supported":
          "English recognition is unavailable in this browser.",
        aborted: "Recognition was interrupted. Start a new session to retry.",
      };
      this.fail(
        errors[event.error] ||
          `Speech recognition stopped (${event.error}). Start again to retry.`,
      );
    };
    rec.onend = () => {
      if (!current()) return;
      if (this.watchdog) clearTimeout(this.watchdog);
      if (++this.emptyRestarts > 3) {
        this.fail(
          "Recognition kept stopping without a transcript. Check microphone input and speech-service access, then start again.",
        );
        return;
      }
      this.snapshot.status = "reconnecting";
      this.emit();
      this.retry = setTimeout(() => this.connect(epoch), 500);
    };
    this.watchdog = setTimeout(() => {
      if (current())
        this.fail(
          "The speech service did not start. Try desktop Google Chrome and check your internet connection.",
        );
    }, 12000);
    try {
      rec.start();
    } catch {
      this.fail(
        "Recognition could not start. Check browser permissions and try again.",
      );
    }
  }
  private recount() {
    let transcript = "";
    const counts: Record<string, number> = {},
      allMatches: Match[] = [];
    for (const segment of this.segments.values()) {
      const text = segment.text.trim(),
        offset = transcript.length;
      for (const match of findFillers(text, this.selected)) {
        counts[match.word] = (counts[match.word] ?? 0) + 1;
        allMatches.push({
          ...match,
          start: match.start + offset,
          end: match.end + offset,
        });
      }
      transcript += text + " ";
    }
    this.snapshot.transcript = transcript.trimEnd();
    this.snapshot.matches = allMatches;
    this.snapshot.counts = counts;
    this.snapshot.total = Object.values(counts).reduce((a, b) => a + b, 0);
  }
  private fail(message: string) {
    this.stop();
    this.snapshot.status = "error";
    this.snapshot.error = message;
    this.emit();
  }
  stop() {
    this.wanted = false;
    this.epoch++;
    if (this.timer) clearInterval(this.timer);
    if (this.retry) clearTimeout(this.retry);
    if (this.watchdog) clearTimeout(this.watchdog);
    this.timer = null;
    this.retry = null;
    this.watchdog = null;
    const rec = this.recognition;
    this.recognition = null;
    if (rec) {
      rec.onstart = null;
      rec.onresult = null;
      rec.onerror = null;
      rec.onend = null;
      try {
        rec.abort();
      } catch {}
    }
    this.deps.releaseMicrophone();
    if (this.started !== null) {
      this.snapshot.elapsed = this.now() - this.started;
      this.started = null;
    }
    if (this.snapshot.status !== "idle") this.snapshot.status = "stopped";
    this.emit();
  }
  reset() {
    this.stop();
    this.snapshot = { ...INITIAL, counts: {}, matches: [] };
    this.segments.clear();
    this.emptyRestarts = 0;
    this.cycle = 0;
    this.emit();
  }
  dispose() {
    this.stop();
  }
}

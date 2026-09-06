import {
  Session,
  INITIAL,
  type Snapshot,
  type RecognitionConstructor,
} from "./session";
import { AudioEngine } from "./audio";
import { DEFAULT_FILLERS } from "./detector";

const element = <T extends HTMLElement = HTMLElement>(id: string) =>
  document.getElementById(id) as T;
const start = element<HTMLButtonElement>("start"),
  stop = element<HTMLButtonElement>("stop"),
  test = element<HTMLButtonElement>("test-alert");
const siren = element<HTMLInputElement>("siren"),
  volume = element<HTMLInputElement>("volume"),
  selection = element<HTMLFieldSetElement>("filler-selection");
const chips = Array.from(
  document.querySelectorAll<HTMLButtonElement>("[data-filler]"),
);
let fillers = [...DEFAULT_FILLERS],
  latest: Snapshot = { ...INITIAL },
  alertTimer: ReturnType<typeof setTimeout> | null = null,
  lastAlert = -Infinity,
  audioError = "",
  lastTranscript = "";
const win = window as unknown as {
  SpeechRecognition?: RecognitionConstructor;
  webkitSpeechRecognition?: RecognitionConstructor;
};
const Recognition = win.SpeechRecognition || win.webkitSpeechRecognition;
const supported =
  Boolean(Recognition) &&
  window.isSecureContext &&
  Boolean(navigator.mediaDevices?.getUserMedia);
const bars = Array.from(element("level").children) as HTMLElement[];
const audio = new AudioEngine((level) => {
  element("mic-orbit").style.transform = `scale(${1 + level * 0.16})`;
  bars.forEach((bar, i) => {
    bar.style.height = `${5 + level * (16 + Math.sin(i * 2.1) * 10 + Math.sin(i * 0.2) * 18)}px`;
    bar.style.opacity = String(0.25 + level * 0.75);
  });
  element("level").setAttribute(
    "aria-label",
    level ? "Microphone receiving audio" : "Microphone quiet or inactive",
  );
});
const active = () =>
  ["starting", "listening", "reconnecting"].includes(latest.status);
function renderStage() {
  if (document.body.classList.contains("has-alert")) return;
  element("stage-kicker").textContent = active()
    ? "TAKE YOUR TIME"
    : latest.status === "stopped"
      ? "NICE WORK. TAKE A BREATH."
      : "MAKE ROOM FOR THE PAUSE";
  element("stage-title").textContent = active()
    ? "Keep speaking."
    : latest.status === "stopped"
      ? "Practice, then repeat."
      : "Speak with intention.";
  element("stage-help").textContent = active()
    ? "A quiet pause is better than a filler."
    : "Catch your fillers as you speak. One thought at a time.";
}
function clearAlert() {
  if (alertTimer) clearTimeout(alertTimer);
  alertTimer = null;
  document.body.classList.remove("has-alert");
  element("alert-announcement").textContent = "";
  audio.silence();
  renderStage();
  test.disabled = active();
}
function showAlert(label: string, isTest = false) {
  // Counts still update during cooldown. A single red hold avoids repeated flashing.
  if (performance.now() - lastAlert < 2000) return;
  lastAlert = performance.now();
  document.body.classList.add("has-alert");
  test.disabled = true;
  element("stage-kicker").textContent = isTest
    ? "ALERT PREVIEW"
    : "FILLER DETECTED";
  element("stage-title").textContent = `“${label.toLowerCase()}”`;
  element("stage-help").textContent = isTest
    ? "This preview does not affect your score."
    : "Pause. Breathe. Carry on.";
  element("alert-announcement").textContent =
    `${isTest ? "Test alert" : "Filler detected"}: ${label}`;
  if (siren.checked) audio.siren(Number(volume.value) / 100);
  if (alertTimer) clearTimeout(alertTimer);
  alertTimer = setTimeout(clearAlert, 1100);
}
function render(snapshot: Snapshot) {
  latest = snapshot;
  const running = active();
  start.hidden = running;
  stop.hidden = !running;
  start.disabled = !supported || !fillers.length;
  test.disabled = running || Boolean(alertTimer);
  selection.disabled = running;
  start.querySelector("span")!.textContent =
    snapshot.status === "stopped" ? "Start a new session" : "Start practice";
  element("status").textContent = {
    idle: "Ready when you are",
    starting: "Connecting microphone…",
    listening: "● Listening",
    reconnecting: "Reconnecting…",
    stopped: "Session complete",
    error: "Needs attention",
  }[snapshot.status];
  element("status").classList.toggle("is-live", running);
  element("permission-note").textContent = running
    ? "End practice to change fillers. Switching tabs stops the microphone."
    : "Allow microphone access when prompted. Headphones recommended.";
  element("transcript-state").textContent = running
    ? "May revise as you speak"
    : "Only for this session";
  const seconds = Math.floor(snapshot.elapsed / 1000);
  element("elapsed").textContent =
    `${String(Math.floor(seconds / 60)).padStart(2, "0")}:${String(seconds % 60).padStart(2, "0")}`;
  element("total").textContent = String(snapshot.total).padStart(2, "0");
  element("rate").textContent =
    seconds >= 10
      ? (snapshot.total / (snapshot.elapsed / 60000)).toFixed(1)
      : "—";
  const transcript = element("transcript");
  if (lastTranscript !== snapshot.transcript) {
    lastTranscript = snapshot.transcript;
    const nearBottom =
      transcript.scrollHeight - transcript.scrollTop - transcript.clientHeight <
      50;
    const fragment = document.createDocumentFragment();
    let cursor = 0;
    for (const match of snapshot.matches) {
      fragment.append(
        document.createTextNode(snapshot.transcript.slice(cursor, match.start)),
      );
      const mark = document.createElement("mark");
      mark.textContent = snapshot.transcript.slice(match.start, match.end);
      fragment.append(mark);
      cursor = match.end;
    }
    fragment.append(
      document.createTextNode(
        snapshot.transcript.slice(cursor) ||
          (!snapshot.transcript
            ? "Your words will appear here when recognition starts. Fillers will be highlighted."
            : ""),
      ),
    );
    transcript.replaceChildren(fragment);
    if (nearBottom) transcript.scrollTop = transcript.scrollHeight;
  }
  transcript.classList.toggle("empty", !snapshot.transcript);
  element<HTMLButtonElement>("clear").hidden = running || !snapshot.transcript;
  const breakdown = element("breakdown");
  breakdown.replaceChildren();
  const counts = Object.entries(snapshot.counts).sort((a, b) => b[1] - a[1]);
  if (!counts.length) {
    const p = document.createElement("p");
    p.textContent = "Your filler breakdown will appear here.";
    breakdown.append(p);
  }
  for (const [word, count] of counts) {
    const row = document.createElement("div");
    row.className = "count-row";
    const label = document.createElement("span");
    label.textContent = `“${word}”`;
    const track = document.createElement("div");
    track.className = "count-track";
    const bar = document.createElement("i");
    bar.style.width = `${(count / snapshot.total) * 100}%`;
    track.append(bar);
    const total = document.createElement("strong");
    total.textContent = String(count);
    row.append(label, track, total);
    breakdown.append(row);
  }
  const error =
    snapshot.error ||
    audioError ||
    (!supported
      ? "Live recognition is unavailable here. Open this page in desktop Google Chrome over HTTPS. Browser support and speech-service access vary."
      : "");
  element("error").textContent = error;
  element("error").hidden = !error;
  if (snapshot.status === "error") clearAlert();
  else renderStage();
}
const session = new Session({
  createRecognition: () => new Recognition!(),
  microphone: () => audio.microphone(),
  releaseMicrophone: () => audio.releaseMicrophone(),
  onChange: render,
  onFiller: (word) => showAlert(word),
});
start.addEventListener("click", () => {
  clearAlert();
  audioError = "";
  lastAlert = -Infinity;
  // Both requests originate in the button gesture, without waiting on an audio prompt.
  void audio.unlock().catch(() => {
    audioError = "Sound is unavailable. Visual alerts still work.";
    render(latest);
  });
  void session.start(fillers);
});
function endPractice() {
  session.stop();
  clearAlert();
}
stop.addEventListener("click", endPractice);
test.addEventListener("click", async () => {
  test.disabled = true;
  try {
    await audio.unlock();
  } catch {
    audioError = "Sound is unavailable. Check browser audio settings.";
    render(latest);
  }
  if (!active() && !document.hidden) {
    lastAlert = -Infinity;
    showAlert("um", true);
  }
  test.disabled = active() || Boolean(alertTimer);
});
siren.addEventListener("change", () => {
  volume.disabled = !siren.checked;
  if (!siren.checked) audio.silence();
});
volume.addEventListener("input", () => {
  element("volume-value").textContent = `${volume.value}%`;
  if (Number(volume.value) === 0) audio.silence();
});
chips.forEach((chip) =>
  chip.addEventListener("click", () => {
    if (active()) return;
    const word = chip.dataset.filler!;
    fillers = fillers.includes(word)
      ? fillers.filter((w) => w !== word)
      : [...fillers, word];
    chip.setAttribute("aria-pressed", String(fillers.includes(word)));
    chip.classList.toggle("selected", fillers.includes(word));
    chip.querySelector("span")!.textContent = fillers.includes(word)
      ? "−"
      : "+";
    element("selection-warning").hidden = Boolean(fillers.length);
    render(latest);
  }),
);
element("clear").addEventListener("click", () => {
  clearAlert();
  session.reset();
});
document.addEventListener("visibilitychange", () => {
  if (document.hidden) {
    if (active()) endPractice();
    else clearAlert();
  }
});
window.addEventListener("pagehide", () => {
  session.dispose();
  clearAlert();
  audio.dispose();
});
render(latest);

// Optional browser agent surface. Microphone start always stays a user gesture.
type ModelTool = {
  name: string;
  description: string;
  inputSchema: object;
  annotations: { readOnlyHint: boolean };
  execute: (input: unknown) => unknown;
};
const modelContext = (
  document as unknown as {
    modelContext?: {
      registerTool: (
        tool: ModelTool,
        options: { signal: AbortSignal },
      ) => void | Promise<void>;
    };
  }
).modelContext;
if (modelContext?.registerTool) {
  const lifecycle = new AbortController();
  const readSummary = () => ({
    status: latest.status,
    fillers: latest.total,
    elapsedSeconds: Math.floor(latest.elapsed / 1000),
    counts: { ...latest.counts },
  });
  const validateEmpty = (input: unknown) => {
    if (
      input === null ||
      typeof input !== "object" ||
      Array.isArray(input) ||
      Object.keys(input).length
    )
      throw new Error("Expected an empty object.");
  };
  for (const tool of [
    {
      name: "read_speaking_session_summary",
      description:
        "Read the current speaking practice count, duration, and status. Does not return the transcript.",
      inputSchema: {
        type: "object",
        properties: {},
        additionalProperties: false,
      },
      annotations: { readOnlyHint: true },
      execute: (input: unknown) => {
        validateEmpty(input);
        return readSummary();
      },
    },
    {
      name: "end_speaking_practice",
      description:
        "Stop this speaking practice session, release microphone access, silence the alert, and return its summary.",
      inputSchema: {
        type: "object",
        properties: {},
        additionalProperties: false,
      },
      annotations: { readOnlyHint: false },
      execute: (input: unknown) => {
        validateEmpty(input);
        endPractice();
        return readSummary();
      },
    },
  ]) {
    try {
      void Promise.resolve(
        modelContext.registerTool(tool, { signal: lifecycle.signal }),
      ).catch(() => {});
    } catch {}
  }
  window.addEventListener("pagehide", () => lifecycle.abort(), { once: true });
}

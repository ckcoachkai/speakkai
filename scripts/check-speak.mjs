import assert from "node:assert/strict";
import { test } from "node:test";
import { findFillers, DEFAULT_FILLERS } from "../src/scripts/speak/detector.ts";
import { Session } from "../src/scripts/speak/session.ts";
import { AudioEngine } from "../src/scripts/speak/audio.ts";

test("detects hesitation sounds and stretched spellings, ignoring word substrings", () => {
  assert.deepEqual(
    findFillers(
      "Um, uhhh, ahhh, ugh, erm, er. Summer thumb sojourn ahead.",
      DEFAULT_FILLERS,
    ).map((m) => m.word),
    DEFAULT_FILLERS,
  );
  assert.equal(
    findFillers("summary drummer umbrella aha error", DEFAULT_FILLERS).length,
    0,
  );
});
test("optional phrases are opt-in, case insensitive, and preserve exact highlight offsets", () => {
  const text = "I mean, you know, I actually like this.";
  assert.equal(findFillers(text, DEFAULT_FILLERS).length, 0);
  const matches = findFillers(text, ["I mean", "you know", "like"]);
  assert.deepEqual(
    matches.map((m) => text.slice(m.start, m.end)),
    ["I mean", "you know", "like"],
  );
});
test("transcript text is treated as text, including markup and apostrophes", () => {
  assert.equal(
    findFillers("I'm assuming <img src=x> uh", ["um", "uh"]).length,
    1,
  );
  assert.equal(findFillers("um uh", []).length, 0);
});

function harness(options = {}) {
  const records = [],
    alerts = [];
  let released = 0,
    now = 0;
  const session = new Session({
    microphone: options.microphone ?? (async () => {}),
    releaseMicrophone: () => released++,
    now: () => now,
    createRecognition: () => {
      const rec = {
        start() {
          this.onstart?.();
        },
        abort() {
          this.aborted = true;
        },
      };
      records.push(rec);
      return rec;
    },
    onChange: () => {},
    onFiller: (word) => alerts.push(word),
  });
  function result(text, final = false, index = 0, preceding = []) {
    const rec = records.at(-1);
    rec.onresult?.({
      resultIndex: index,
      results: [...preceding, { isFinal: final, 0: { transcript: text } }],
    });
  }
  return {
    session,
    records,
    alerts,
    result,
    get released() {
      return released;
    },
    setNow(value) {
      now = value;
    },
  };
}
test("interim updates and their final result trigger one alarm and one count", async () => {
  const h = harness();
  try {
    await h.session.start(DEFAULT_FILLERS);
    h.result("um");
    h.result("ummmm today");
    h.result("um today", true);
    assert.deepEqual(h.alerts, ["um"]);
    assert.equal(h.session.snapshot.total, 1);
    h.result("um today uh", true);
    assert.equal(h.alerts.length, 2);
    assert.equal(h.session.snapshot.total, 2);
  } finally {
    h.session.dispose();
  }
});
test("a corrected false filler is removed from the count; alternative spelling does not re-alarm", async () => {
  const h = harness();
  try {
    await h.session.start(DEFAULT_FILLERS);
    h.result("uh");
    h.result("um");
    assert.equal(h.alerts.length, 1);
    assert.deepEqual(h.session.snapshot.counts, { um: 1 });
    h.result("umbrella", true);
    assert.equal(h.session.snapshot.total, 0);
  } finally {
    h.session.dispose();
  }
});
test("counts all fillers in a result even when one combined alert is emitted", async () => {
  const h = harness();
  try {
    await h.session.start(DEFAULT_FILLERS);
    h.result("um uh um", true);
    assert.equal(h.session.snapshot.total, 3);
    assert.equal(h.alerts.length, 1);
    assert.deepEqual(h.session.snapshot.counts, { um: 2, uh: 1 });
  } finally {
    h.session.dispose();
  }
});
test("multiple recognition segments preserve order, counts, and highlight spans", async () => {
  const h = harness();
  try {
    await h.session.start(DEFAULT_FILLERS);
    h.result("today um", true);
    h.result(" uh tomorrow", true, 1, [
      { isFinal: true, 0: { transcript: "today um" } },
    ]);
    assert.equal(h.session.snapshot.transcript, "today um uh tomorrow");
    assert.deepEqual(
      h.session.snapshot.matches.map((m) =>
        h.session.snapshot.transcript.slice(m.start, m.end),
      ),
      ["um", "uh"],
    );
  } finally {
    h.session.dispose();
  }
});
test("stopping releases the microphone, freezes the timer, and rejects stale callbacks", async () => {
  const h = harness();
  await h.session.start(DEFAULT_FILLERS);
  const rec = h.records[0],
    stale = rec.onresult;
  h.setNow(1500);
  h.session.stop();
  stale({
    resultIndex: 0,
    results: [{ isFinal: true, 0: { transcript: "um" } }],
  });
  assert.equal(h.session.snapshot.elapsed, 1500);
  assert.equal(h.session.snapshot.total, 0);
  assert.ok(rec.aborted);
  assert.ok(h.released >= 1);
  assert.equal(rec.onend, null);
});
test("cancelling a pending microphone request never starts recognition afterward", async () => {
  let resolve;
  const h = harness({ microphone: () => new Promise((r) => (resolve = r)) });
  const pending = h.session.start(DEFAULT_FILLERS);
  h.session.stop();
  resolve();
  await pending;
  assert.equal(h.records.length, 0);
  assert.equal(h.session.snapshot.status, "stopped");
});
test("permission denial is explicit and returns to a retryable state", async () => {
  const h = harness({
    microphone: async () => {
      const e = new Error("denied");
      e.name = "NotAllowedError";
      throw e;
    },
  });
  await h.session.start(DEFAULT_FILLERS);
  assert.equal(h.session.snapshot.status, "error");
  assert.match(h.session.snapshot.error, /denied/);
  assert.equal(h.records.length, 0);
});
test("network failure stops the microphone and does not claim to be listening", async () => {
  const h = harness();
  await h.session.start(DEFAULT_FILLERS);
  h.records[0].onerror({ error: "network" });
  assert.equal(h.session.snapshot.status, "error");
  assert.match(h.session.snapshot.error, /network/);
  assert.ok(h.records[0].aborted);
});
test("recognition can restart without replacing earlier transcript or counting it twice", async (t) => {
  t.mock.timers.enable({ apis: ["setTimeout"] });
  const h = harness();
  try {
    await h.session.start(DEFAULT_FILLERS);
    h.result("um today", true);
    h.records[0].onend();
    assert.equal(h.session.snapshot.status, "reconnecting");
    t.mock.timers.tick(500);
    h.result("uh tomorrow", true);
    assert.equal(h.session.snapshot.total, 2);
    assert.equal(h.session.snapshot.transcript, "um today uh tomorrow");
    assert.equal(h.records.length, 2);
  } finally {
    h.session.dispose();
  }
});
test("repeated empty recognition restarts stop after a bounded number of retries", async (t) => {
  t.mock.timers.enable({ apis: ["setTimeout"] });
  const h = harness();
  await h.session.start(DEFAULT_FILLERS);
  for (let i = 0; i < 4; i++) {
    h.records.at(-1).onend();
    t.mock.timers.tick(500);
  }
  assert.equal(h.records.length, 4);
  assert.equal(h.session.snapshot.status, "error");
  assert.match(h.session.snapshot.error, /kept stopping/);
});
test("reset starts with a clean transcript, counter, and time", async () => {
  const h = harness();
  await h.session.start(DEFAULT_FILLERS);
  h.result("um", true);
  h.session.reset();
  assert.equal(h.session.snapshot.status, "idle");
  assert.equal(h.session.snapshot.transcript, "");
  assert.equal(h.session.snapshot.total, 0);
});
test("siren uses bounded gain and ends automatically; mute creates no oscillator", () => {
  const calls = [];
  const param = {
    setValueAtTime: (...v) => calls.push(["set", ...v]),
    linearRampToValueAtTime: (...v) => calls.push(["linear", ...v]),
    exponentialRampToValueAtTime: (...v) => calls.push(["exponential", ...v]),
  };
  const oscillator = {
    frequency: param,
    connect() {},
    disconnect() {},
    start: () => calls.push(["start"]),
    stop: (v) => calls.push(["stop", v]),
  };
  const audio = new AudioEngine(() => {});
  audio.context = {
    state: "running",
    currentTime: 0,
    createOscillator: () => oscillator,
    createGain: () => ({ gain: param, connect() {}, disconnect() {} }),
  };
  audio.siren(0);
  assert.equal(calls.length, 0);
  audio.siren(0.35);
  assert.ok(
    calls.some((c) => c[0] === "linear" && Math.abs(c[1] - 0.063) < 0.00001),
  );
  assert.ok(calls.some((c) => c[0] === "stop" && c[1] === 0.86));
  audio.silence();
  assert.equal(audio.oscillators.size, 0);
});

import { readFile } from "node:fs/promises";
import assert from "node:assert/strict";
import { resolve } from "node:path";
import {
  assertConcisePublicSchedule,
  sanitizeCalendarCell,
} from "./schedule-privacy.mjs";

const schedulePath = resolve("public/data/schedule.json");
const schedule = JSON.parse(await readFile(schedulePath, "utf8"));

assertConcisePublicSchedule(schedule);

assert.equal(
  sanitizeCalendarCell(
    "3\n09:30-16:00 private class\n17:00-18:00 private appointment\n19:30-21:00 private lesson",
  ),
  "3\nLimited availability\n09:30–16:00 · Coaching\n17:00–18:00 · Coaching\n19:30–21:00 · Coaching",
);
assert.equal(
  sanitizeCalendarCell("23\n14:30 private appointment"),
  "23\nLimited availability\n14:30 · Coaching",
);
assert.equal(
  sanitizeCalendarCell("12\n9：05～10：30 private appointment"),
  "12\nLimited availability\n09:05–10:30 · Coaching",
);
assert.equal(
  sanitizeCalendarCell("8\n09:30–10:30 龙柏班课\n13:00 JH class\n16:00 SAS\n18:00 TMC"),
  "8\nLimited availability\n09:30–10:30 · 龙柏班课\n13:00 · JH班课\n16:00 · SAS\n18:00 · TMC",
);
const approvedNameCue = sanitizeCalendarCell(
  "9\n09:00–10:00 Claire private lesson at a private location; contact details: 12345",
);
assert.equal(approvedNameCue, "9\nLimited availability\n09:00–10:00 · Claire");
assert.doesNotMatch(approvedNameCue, /Busy:|private location|contact details|12345/i);
assert.equal(
  sanitizeCalendarCell("10\n09:00–10:00 confidential work block"),
  "10\nLimited availability\n09:00–10:00 · Reserved time",
);
assert.equal(sanitizeCalendarCell("1\nAll day private travel details"), "1\nUnavailable");
assert.equal(
  sanitizeCalendarCell("29\nAll day Malaysia travel (Booked)"),
  "29\nUnavailable\nTravel: Malaysia",
);
assert.equal(
  sanitizeCalendarCell(
    "29\n09:15-12:15 private class\n13:00-15:30 private class\nAll day Malaysia (Travel) — Online open; in-person Malaysia only",
  ),
  "29\nOnline available\nIn-person: Malaysia only\n09:15–12:15 · Coaching\n13:00–15:30 · Coaching",
);
assert.equal(
  sanitizeCalendarCell(
    "30\nAll day Malaysia (Travel) — Online open; in-person Malaysia only",
  ),
  "30\nOnline available\nIn-person: Malaysia only",
);
assert.equal(sanitizeCalendarCell("1\nAll day Thailand (Planned)"), "1\nUnavailable");
console.log("Concise public schedule privacy check passed.");

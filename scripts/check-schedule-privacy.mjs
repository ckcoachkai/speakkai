import { readFile } from "node:fs/promises";
import assert from "node:assert/strict";
import { resolve } from "node:path";
import {
  assertAvailabilityOnlySchedule,
  sanitizeCalendarCell,
} from "./schedule-privacy.mjs";

const schedulePath = resolve("public/data/schedule.json");
const schedule = JSON.parse(await readFile(schedulePath, "utf8"));

assertAvailabilityOnlySchedule(schedule);

assert.equal(
  sanitizeCalendarCell(
    "3\n09:30-16:00 private class\n17:00-18:00 private appointment\n19:30-21:00 private lesson",
  ),
  "3\nLimited availability\nBusy: 09:30–16:00\nBusy: 17:00–18:00\nBusy: 19:30–21:00",
);
assert.equal(
  sanitizeCalendarCell("23\n14:30 private appointment"),
  "23\nLimited availability\nBusy: 14:30",
);
assert.equal(
  sanitizeCalendarCell("12\n9：05～10：30 private appointment"),
  "12\nLimited availability\nBusy: 09:05–10:30",
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
  "29\nOnline available\nIn-person: Malaysia only\nBusy: 09:15–12:15\nBusy: 13:00–15:30",
);
assert.equal(
  sanitizeCalendarCell(
    "30\nAll day Malaysia (Travel) — Online open; in-person Malaysia only",
  ),
  "30\nOnline available\nIn-person: Malaysia only",
);
assert.equal(sanitizeCalendarCell("1\nAll day Thailand (Planned)"), "1\nUnavailable");
console.log("Public schedule privacy check passed.");

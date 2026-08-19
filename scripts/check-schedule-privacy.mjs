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
console.log("Public schedule privacy check passed.");

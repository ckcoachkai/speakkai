import { readFile } from "node:fs/promises";
import assert from "node:assert/strict";
import { resolve } from "node:path";
import {
  assertCalendarDisplayPublicSchedule,
  classifyCalendarDisplayEvent,
  sanitizeCalendarCell,
} from "./schedule-privacy.mjs";

const schedulePath = resolve("public/data/schedule.json");
const schedule = JSON.parse(await readFile(schedulePath, "utf8"));

assertCalendarDisplayPublicSchedule(schedule);

assert.equal(
  sanitizeCalendarCell(
    "3\n09:30-16:00 JH 线下 班课\n17:00-18:00 龙柏 - Victoria\n19:30-21:00 龙柏 - JAC VIP",
  ),
  "3\nLimited availability\n09:30–16:00 · JH 线下 班课\n17:00–18:00 · 龙柏 - Victoria\n19:30–21:00 · 龙柏 - JAC VIP",
);
assert.equal(
  sanitizeCalendarCell("23\n14:30 JH - Demo Class"),
  "23\nLimited availability\n14:30 · JH - Demo Class",
);
assert.equal(
  sanitizeCalendarCell("12\n9：05～10：30 线下 - Claire 1-1"),
  "12\nLimited availability\n09:05–10:30 · 线下 - Claire 1-1",
);
assert.equal(
  sanitizeCalendarCell("8\n09:30–10:30 龙柏班课\n13:00 SAS Weds Class\n16:00 SHNo.1分享(TMC)"),
  "8\nLimited availability\n09:30–10:30 · 龙柏班课\n13:00 · SAS Weds Class\n16:00 · SHNo.1分享(TMC)",
);
const contactSafeEvent = sanitizeCalendarCell(
  "9\n09:00–10:00 Claire 1-1 email claire@example.com +86 138 0013 8000",
);
assert.doesNotMatch(contactSafeEvent, /Busy:|example\.com|138 0013 8000/i);
assert.equal(
  sanitizeCalendarCell("10\n09:00–10:00"),
  "10\nLimited availability\n09:00–10:00 · Reserved time",
);
assert.equal(classifyCalendarDisplayEvent("JH 线下 班课"), "group");
assert.equal(classifyCalendarDisplayEvent("SAS - 五年级"), "group");
assert.equal(classifyCalendarDisplayEvent("井亭大厦 - 二年级 Logan 班"), "group");
assert.equal(classifyCalendarDisplayEvent("古北1699 - 八九年级"), "group");
assert.equal(classifyCalendarDisplayEvent("龙柏 - Victoria"), "vip");
assert.equal(classifyCalendarDisplayEvent("龙柏 - nina.r"), "vip");
assert.equal(classifyCalendarDisplayEvent("YoYo class (US)"), "vip");
assert.equal(classifyCalendarDisplayEvent("Kunshan 1-on-1 class"), "vip");
assert.equal(classifyCalendarDisplayEvent("SAS Class"), "sas");
assert.equal(classifyCalendarDisplayEvent("SHNo.1分享(TMC)"), "tmc");
assert.equal(classifyCalendarDisplayEvent("Reserved time"), "reserved");
assert.equal(sanitizeCalendarCell("1\nAll day private travel details"), "1\nUnavailable");
assert.equal(
  sanitizeCalendarCell("29\nAll day Malaysia travel (Booked)"),
  "29\nUnavailable\nTravel: Malaysia",
);
assert.equal(
  sanitizeCalendarCell(
    "29\n09:15-12:15 龙柏 班课\n13:00-15:30 线下 - Claire 1-1\nAll day Malaysia (Travel) — Online open; in-person Malaysia only",
  ),
  "29\nOnline available\nIn-person: Malaysia only\n09:15–12:15 · 龙柏 班课\n13:00–15:30 · 线下 - Claire 1-1",
);
assert.equal(
  sanitizeCalendarCell(
    "30\nAll day Malaysia (Travel) — Online open; in-person Malaysia only",
  ),
  "30\nOnline available\nIn-person: Malaysia only",
);
assert.equal(sanitizeCalendarCell("1\nAll day Thailand (Planned)"), "1\nUnavailable");
assert.equal(sanitizeCalendarCell("25\nHoliday"), "25\nHoliday");
console.log("Calendar Display schedule privacy check passed.");

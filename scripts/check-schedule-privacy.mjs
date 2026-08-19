import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { assertAvailabilityOnlySchedule } from "./schedule-privacy.mjs";

const schedulePath = resolve("public/data/schedule.json");
const schedule = JSON.parse(await readFile(schedulePath, "utf8"));

assertAvailabilityOnlySchedule(schedule);
console.log("Public schedule privacy check passed.");

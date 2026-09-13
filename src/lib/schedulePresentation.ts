const nonNameCapitalizedWords = new Set([
  "Class", "Demo", "Training", "Kunshan", "SAS", "TMC", "JH", "SH", "US", "Weds", "Thursday",
  "Booked", "Reserved", "Time", "Office", "Work", "Block", "Online", "Offline",
]);

export function calendarDisplayEventKind(label: string) {
  if (/\bVIP\b|\b1\s*(?:-|v)\s*1\b|\b1\s*-?\s*on\s*-?\s*1\b|一对一/i.test(label)) return "vip";
  if (/班课|年级|\bSTCC\b|\bgroup\b|\bLogan\s*班\b/i.test(label)) return "group";
  const words = label.match(/\b[A-Z][a-z]{1,}\b/g) ?? [];
  if (
    words.some((word) => !nonNameCapitalizedWords.has(word)) ||
    /\b[A-Z][a-z]+(?:[A-Z][a-z]+)+\b/.test(label) ||
    /[-–—]\s*[a-z][a-z]+(?:\.[a-z])?\b/.test(label)
  ) return "vip";
  if (/\bSAS\b/i.test(label)) return "sas";
  if (/\bTMC\b|\(TMC\)/i.test(label)) return "tmc";
  if (/班课|\bclass\b|\bgroup\b|\bJH\b|龙柏/i.test(label)) return "group";
  return "reserved";
}

export function publicBookingPresentation(label: string) {
  const originalKind = calendarDisplayEventKind(label);
  if (/\bTMC\b|\(TMC\)/i.test(label)) return { kind: "tmc", title: label };
  if (originalKind === "vip") return { kind: "vip", title: "VIP 1-to-1 booked" };
  if (originalKind === "group" || originalKind === "sas") return { kind: "group", title: "Class booked" };
  return { kind: "reserved", title: "Time booked" };
}

export function scheduleStartMinutes(timeText: string) {
  const match = timeText.match(/^([01]\d|2[0-3]):([0-5]\d)/);
  return match ? Number(match[1]) * 60 + Number(match[2]) : -1;
}

export function sortScheduleEvents(content: HTMLElement) {
  // Keep the date first and untimed day notices above the chronological entries.
  const entries = Array.from(content.querySelectorAll<HTMLElement>(".event-line"));
  entries.sort((a, b) =>
    scheduleStartMinutes(a.querySelector(".event-time")?.textContent ?? "") -
    scheduleStartMinutes(b.querySelector(".event-time")?.textContent ?? ""),
  );
  content.append(...entries);
}

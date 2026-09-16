const nonNameCapitalizedWords = new Set([
  "Class", "Demo", "Training", "Kunshan", "SAS", "TMC", "JH", "SH", "US", "Weds", "Thursday",
  "Booked", "Reserved", "Time", "Office", "Work", "Block", "Online", "Offline",
]);

export function calendarDisplayEventKind(label: string) {
  if (/\bVIP\b|\b1\s*(?:-|v)\s*1\b|\b1\s*-?\s*on\s*-?\s*1\b|一对一/i.test(label)) return "vip";
  if (/^Class booked(?: · (?:Hongqiao Hub|Huacao|Longbai|Gubei|Weining Road|G\d+(?:–\d+)*))*$/.test(label)) return "group";
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

export function internalBookingLabel(label: string) {
  return label
    .replace(/\bSTCC\b(?!\s*[·（(]\s*威宁路)/gi, "STCC · 威宁路")
    .replace(/\bSAS\b(?:\s*·\s*华漕)?(?!\s*·\s*虹桥天地)/gi, "SAS · 虹桥天地（虹桥枢纽）")
    .replace(/井亭大厦/g, "龙柏")
    .replace(/\bGubei\b|古北1699/gi, "古北");
}

// Areas are approximate travel labels, not administrative district boundaries.
// Only allowlisted metadata reaches the public page; never reuse a raw class title.
export function bookingArea(label: string) {
  // Kai confirmed that the classes tagged SAS are taught at Hongqiao Tiandi.
  if (/\bSAS\b|虹桥天地|Hongqiao Tiandi|Hongqiao Hub/i.test(label)) return "Hongqiao Hub";
  if (/华漕|Huacao/i.test(label)) return "Huacao";
  if (/井亭大厦|龙柏|Jingting|Longbai/i.test(label)) return "Longbai";
  if (/古北\s*16[-–]?99|古北|Gubei/i.test(label)) return "Gubei";
  if (/\bSTCC\b|威宁路|Weining Road/i.test(label)) return "Weining Road";
  return "";
}

export function bookingGrade(label: string) {
  const english = label.match(/\b(?:Grades?\s*|G)([1-9]|1[0-2])(?:\s*[-–/＆&]\s*([1-9]|1[0-2]))?\b/i);
  if (english) return `G${english[1]}${english[2] ? `–${english[2]}` : ''}`;
  const chinese = label.match(/([一二三四五六七八九十0-9]+)年级/);
  if (!chinese) return "";
  const value = chinese[1];
  const digits: Record<string, number> = {一:1,二:2,三:3,四:4,五:5,六:6,七:7,八:8,九:9};
  if (/^\d+$/.test(value)) return Number(value) >= 1 && Number(value) <= 12 ? `G${Number(value)}` : '';
  if (value === '十') return 'G10';
  if (/^十[一二]$/.test(value)) return `G${10 + digits[value[1]]}`;
  const grades = [...value].map(char => digits[char]);
  if (grades.some(n => !n)) return '';
  return `G${grades.join('–')}`;
}

export function publicBookingPresentation(label: string) {
  const originalKind = calendarDisplayEventKind(label);
  if (/\bTMC\b|\(TMC\)/i.test(label)) return { kind: "tmc", title: "TMC booked" };
  // Private sessions remain anonymous, including their area and grade.
  if (originalKind === "vip") return { kind: "vip", title: "VIP 1-to-1 booked" };
  if (originalKind === "group" || originalKind === "sas") {
    const details = [bookingArea(label), bookingGrade(label)].filter(Boolean);
    return { kind: "group", title: ['Class booked', ...details].join(' · ') };
  }
  return { kind: "reserved", title: "Time booked" };
}

export function publicScheduleCell(value: string) {
  return value.split('\n').map(line => line.replace(
    /^(\d{2}:\d{2}(?:–\d{2}:\d{2})? · )(.+)$/,
    (_match, time, label) => time + publicBookingPresentation(label).title,
  )).join('\n');
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

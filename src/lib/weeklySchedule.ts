export type WeeklyScheduleBlock = {
  kind: "free" | "reserved" | "special";
  timeText: string;
  title: string;
};

type TimeRange = { start: number; end: number };

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];
const GENERAL_FREE_START = 2026 * 12 + 8;
const GENERAL_FREE_END = 2026 * 12 + 11;

function monthKey(monthTitle: string) {
  const match = monthTitle.match(/^([A-Za-z]+) (\d{4})$/);
  if (!match) return null;
  const month = MONTH_NAMES.indexOf(match[1]);
  return month < 0 ? null : Number(match[2]) * 12 + month;
}

function hasMalaysiaAvailability(lines: string[]) {
  const details = lines.slice(1).join(" ");
  return /Online available/i.test(details) && /In-person: Malaysia only/i.test(details);
}

function timeRange(line: string): TimeRange | null {
  const match = line.match(/^([01]\d|2[0-3]):([0-5]\d)(?:[–-]([01]\d|2[0-3]):([0-5]\d))?/);
  if (!match) return null;
  const start = Number(match[1]) * 60 + Number(match[2]);
  const end = match[3] ? Number(match[3]) * 60 + Number(match[4]) : start + 60;
  return { start, end };
}

function dayIsBlocked(lines: string[]) {
  const malaysiaAvailability = hasMalaysiaAvailability(lines);
  return lines.slice(1).some((line) => {
    if (malaysiaAvailability && /^(?:Travel: Malaysia|In-person: Malaysia only)$/i.test(line)) {
      return false;
    }
    return /^(?:Holiday|Unavailable|Travel:|In-person:|All day)/i.test(line);
  });
}

function availableSegments(lines: string[], freeStart: number, freeEnd: number) {
  if (dayIsBlocked(lines)) return [];

  const busyRanges = lines
    .slice(1)
    .map(timeRange)
    .filter((range): range is TimeRange =>
      Boolean(range && range.start < freeEnd && range.end > freeStart),
    )
    .map((range) => ({
      start: Math.max(freeStart, range.start),
      end: Math.min(freeEnd, range.end),
    }))
    .sort((a, b) => a.start - b.start);

  const segments: TimeRange[] = [];
  let cursor = freeStart;
  for (const range of busyRanges) {
    if (range.start > cursor) segments.push({ start: cursor, end: range.start });
    cursor = Math.max(cursor, range.end);
  }
  if (cursor < freeEnd) segments.push({ start: cursor, end: freeEnd });
  return segments.filter((segment) => segment.end - segment.start >= 15);
}

function hasBookingOverlap(lines: string[], start: number, end: number) {
  return lines.slice(1).some((line) => {
    const range = timeRange(line);
    return range ? range.start < end && range.end > start : false;
  });
}

function formatMinutes(total: number) {
  const hours = Math.floor(total / 60).toString().padStart(2, "0");
  const minutes = (total % 60).toString().padStart(2, "0");
  return `${hours}:${minutes}`;
}

function freeBlocks(
  lines: string[],
  start: number,
  end: number,
  title: string,
): WeeklyScheduleBlock[] {
  return availableSegments(lines, start, end).map((segment) => ({
    kind: "free",
    timeText: `${formatMinutes(segment.start)}–${formatMinutes(segment.end)}`,
    title,
  }));
}

export function weeklyScheduleBlocks(
  column: number,
  lines: string[],
  monthTitle: string,
): WeeklyScheduleBlock[] {
  const key = monthKey(monthTitle);
  const malaysiaAvailability = hasMalaysiaAvailability(lines);
  const generalFreeEnabled =
    key !== null && key >= GENERAL_FREE_START && key <= GENERAL_FREE_END;

  if (!generalFreeEnabled && !malaysiaAvailability) return [];

  const inPersonTitle = malaysiaAvailability
    ? "Online free · Malaysia in-person only"
    : "Online / offline free";

  if (column === 0) {
    return [
      ...freeBlocks(
        lines,
        7 * 60,
        9 * 60,
        malaysiaAvailability ? inPersonTitle : "Online free",
      ),
      ...freeBlocks(lines, 17 * 60, 22 * 60, inPersonTitle),
    ];
  }

  if (column === 1) {
    return freeBlocks(lines, 7 * 60, 15 * 60, inPersonTitle);
  }

  if (column === 2) {
    return !dayIsBlocked(lines) && !hasBookingOverlap(lines, 9 * 60, 12 * 60)
      ? [{ kind: "reserved", timeText: "09:00–12:00", title: "Booked" }]
      : [];
  }

  if (column === 3) {
    return !dayIsBlocked(lines)
      ? [{
          kind: "special",
          timeText: "",
          title: "Off day · Times available for special circumstances",
        }]
      : [];
  }

  if (column === 4 || column === 5) {
    return [
      ...freeBlocks(lines, 7 * 60, 15 * 60, inPersonTitle),
      ...freeBlocks(lines, 20 * 60, 23 * 60, inPersonTitle),
    ];
  }

  return [];
}


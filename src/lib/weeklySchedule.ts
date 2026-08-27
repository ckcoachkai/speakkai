export type WeeklyScheduleBlock = {
  kind: "free" | "reserved" | "special";
  timeText: string;
  title: string;
};

type TimeRange = { start: number; end: number };

function timeRange(line: string): TimeRange | null {
  const match = line.match(/^([01]\d|2[0-3]):([0-5]\d)(?:[–-]([01]\d|2[0-3]):([0-5]\d))?/);
  if (!match) return null;
  const start = Number(match[1]) * 60 + Number(match[2]);
  const end = match[3] ? Number(match[3]) * 60 + Number(match[4]) : start + 60;
  return { start, end };
}

function dayIsBlocked(lines: string[]) {
  return lines.slice(1).some((line) =>
    /^(?:Holiday|Unavailable|Travel:|In-person:|All day)/i.test(line),
  );
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

export function weeklyScheduleBlocks(column: number, lines: string[]): WeeklyScheduleBlock[] {
  if (column === 0) {
    return [
      ...freeBlocks(lines, 7 * 60, 9 * 60, "Online free"),
      ...freeBlocks(lines, 17 * 60, 22 * 60, "Online / offline free"),
    ];
  }

  if (column === 1) {
    return freeBlocks(lines, 7 * 60, 15 * 60, "Online / offline free");
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
      ...freeBlocks(lines, 7 * 60, 15 * 60, "Online / offline free"),
      ...freeBlocks(lines, 20 * 60, 23 * 60, "Online / offline free"),
    ];
  }

  return [];
}

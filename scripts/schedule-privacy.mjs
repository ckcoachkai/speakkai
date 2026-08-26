const PUBLIC_COLUMN_COUNT = 7;
const PUBLIC_STATUSES = new Set(["Holiday", "Limited availability", "Online available", "Unavailable"]);
export const PUBLIC_PRIVACY_MODE = "calendar-display-event-details";
const PUBLIC_EVENT_LINE_PATTERN =
  /^(?:[01]\d|2[0-3]):[0-5]\d(?:–(?:[01]\d|2[0-3]):[0-5]\d)? · .+$/;
const PUBLIC_TRAVEL_LABEL_PATTERN = /^Travel: Malaysia$/;
const PUBLIC_IN_PERSON_LABEL = "In-person: Malaysia only";
const PUBLIC_DETAIL_FORBIDDEN_PATTERN =
  /(?:https?:\/\/|\bwww\.|[\w.+-]+@[\w.-]+\.[a-z]{2,}|\+?\d[\d\s()-]{6,}\d)/i;
const RAW_TIME = String.raw`(?:[01]?\d|2[0-3])[:：][0-5]\d`;
const RAW_TIME_RANGE_PATTERN = new RegExp(
  String.raw`(?<!\d)(${RAW_TIME})\s*(?:-|–|—|~|～|to|至)\s*(${RAW_TIME})(?!\d)`,
  "gi",
);
const RAW_SINGLE_TIME_PATTERN = new RegExp(String.raw`(?<!\d)(${RAW_TIME})(?!\d)`, "g");

function cleanLines(value) {
  return String(value ?? "")
    .replace(/\r/g, "")
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
}

function normalizeTime(value) {
  const [hour, minute] = value.replace("：", ":").split(":");
  return `${hour.padStart(2, "0")}:${minute}`;
}

export function extractBusyTimes(value) {
  const busyTimes = [];
  const seen = new Set();
  const addTime = (time) => {
    if (seen.has(time)) return;
    seen.add(time);
    busyTimes.push(time);
  };

  const remainingDetails = String(value ?? "").replace(
    RAW_TIME_RANGE_PATTERN,
    (_match, start, end) => {
      addTime(`${normalizeTime(start)}–${normalizeTime(end)}`);
      return " ";
    },
  );

  for (const match of remainingDetails.matchAll(RAW_SINGLE_TIME_PATTERN)) {
    addTime(normalizeTime(match[1]));
  }

  return busyTimes;
}

function removeCalendarDisplayContactDetails(value) {
  return String(value ?? "")
    .replace(/https?:\/\/\S+|\bwww\.\S+/gi, " ")
    .replace(/[\w.+-]+@[\w.-]+\.[a-z]{2,}/gi, " ")
    .replace(/\+?\d[\d\s()-]{6,}\d/g, " ");
}

function normalizeCalendarDisplayLabel(value) {
  return removeCalendarDisplayContactDetails(value)
    .replace(RAW_TIME_RANGE_PATTERN, " ")
    .replace(RAW_SINGLE_TIME_PATTERN, " ")
    .replace(/\s+/g, " ")
    .replace(/^[\s,;:|/–—-]+|[\s,;:|/–—-]+$/g, "")
    .trim() || "Reserved time";
}

const NON_NAME_CAPITALIZED_WORDS = new Set([
  "Class",
  "Demo",
  "Training",
  "Kunshan",
  "SAS",
  "TMC",
  "JH",
  "SH",
  "US",
  "Weds",
  "Thursday",
  "Reserved",
  "Time",
  "Office",
  "Work",
  "Block",
  "Online",
  "Offline",
]);

export function classifyCalendarDisplayEvent(label) {
  const details = String(label ?? "").trim();
  if (/\bVIP\b|\b1\s*(?:-|v)\s*1\b|\b1\s*-?\s*on\s*-?\s*1\b|一对一/i.test(details)) {
    return "vip";
  }

  if (/班课|年级|\bgroup\b|\bLogan\s*班\b/i.test(details)) return "group";

  const capitalizedWords = details.match(/\b[A-Z][a-z]{1,}\b/g) ?? [];
  const hasNamedPerson = capitalizedWords.some((word) => !NON_NAME_CAPITALIZED_WORDS.has(word));
  const hasCamelCaseName = /\b[A-Z][a-z]+(?:[A-Z][a-z]+)+\b/.test(details);
  const hasLowerCaseDottedName = /[-–—]\s*[a-z][a-z]+(?:\.[a-z])?\b/.test(details);
  if (hasNamedPerson || hasCamelCaseName || hasLowerCaseDottedName) return "vip";

  if (/\bSAS\b/i.test(details)) return "sas";
  if (/\bTMC\b|\(TMC\)/i.test(details)) return "tmc";
  if (/班课|\bclass\b|\bgroup\b|\bJH\b|龙柏/i.test(details)) return "group";
  return "reserved";
}

export function extractCalendarDisplayEvents(detailLines) {
  const lines = Array.isArray(detailLines) ? detailLines : cleanLines(detailLines);
  const entries = [];
  const seen = new Set();

  for (const line of lines) {
    for (const time of extractBusyTimes(line)) {
      const label = normalizeCalendarDisplayLabel(line);
      const key = `${time}\n${label}`;
      if (seen.has(key)) continue;
      seen.add(key);
      entries.push({ time, label });
    }
  }

  return entries;
}

function extractPublicTravelLabel(value) {
  const details = String(value ?? "");
  const isTravel = /\ball\s*day\b|\btravel\b|\bbooked\b|\bplanned\b|旅行/i.test(details);
  return isTravel && /\bmalaysia\b/i.test(details) ? "Travel: Malaysia" : "";
}

function isMalaysiaOnlineOpen(value) {
  const details = String(value ?? "");
  const isMalaysiaTravel = Boolean(extractPublicTravelLabel(details));
  const onlineIsOpen = /\bonline\s+(?:is\s+)?(?:open|available)\b/i.test(details);
  return isMalaysiaTravel && onlineIsOpen;
}

export function sanitizeCalendarCell(value) {
  const lines = cleanLines(value);
  if (lines.length === 0) return "";

  const dayMatch = lines[0].match(/^(\d{1,2})(?:\s+(.+))?$/);
  if (!dayMatch) return "";

  const day = dayMatch[1];
  const detailLines = [dayMatch[2], ...lines.slice(1)].filter(Boolean);
  const details = detailLines.join(" ");
  if (!details) return day;

  const timedEntries = extractCalendarDisplayEvents(detailLines);
  if (isMalaysiaOnlineOpen(details)) {
    return [
      day,
      "Online available",
      PUBLIC_IN_PERSON_LABEL,
      ...timedEntries.map(({ time, label }) => `${time} · ${label}`),
    ].join("\n");
  }

  const holiday = /\bholiday\b|休假/i.test(details);
  const unavailable =
    !holiday &&
    (/\ball\s*day\b|全天/i.test(details) ||
      (timedEntries.length === 0 && /\btravel\b|\bbooked\b|\bplanned\b|旅行/i.test(details)));

  const publicLines = [
    day,
    holiday ? "Holiday" : unavailable ? "Unavailable" : "Limited availability",
  ];
  if (unavailable) {
    const publicTravelLabel = extractPublicTravelLabel(details);
    if (publicTravelLabel) publicLines.push(publicTravelLabel);
  } else {
    publicLines.push(...timedEntries.map(({ time, label }) => `${time} · ${label}`));
  }

  return publicLines.join("\n");
}

export function sanitizeCalendarGrid(rows, monthTitle) {
  const weekdayRow = rows.findIndex((row) => /^Sunday$/i.test(String(row[0] ?? "").trim()));
  if (weekdayRow < 0) {
    throw new Error(`${monthTitle} does not contain a Sunday-to-Saturday calendar grid.`);
  }

  const titleRow = Array.from(
    { length: PUBLIC_COLUMN_COUNT },
    (_, columnIndex) => (columnIndex === 0 ? monthTitle : ""),
  );
  const weekdayHeadings = Array.from(
    { length: PUBLIC_COLUMN_COUNT },
    (_, columnIndex) => String(rows[weekdayRow][columnIndex] ?? "").trim(),
  );
  const calendarRows = rows
    .slice(weekdayRow + 1)
    .map((row) =>
      Array.from(
        { length: PUBLIC_COLUMN_COUNT },
        (_, columnIndex) => sanitizeCalendarCell(row[columnIndex] ?? ""),
      ),
    )
    .filter((row) => row.some(Boolean));

  return [titleRow, weekdayHeadings, ...calendarRows];
}

export function assertCalendarDisplayPublicScheduleSheet(sheet) {
  if (sheet.columns.length !== PUBLIC_COLUMN_COUNT) {
    throw new Error(`${sheet.title} must expose exactly seven calendar columns.`);
  }

  sheet.rows.forEach((row, rowIndex) => {
    if ((row.cells?.length ?? 0) !== PUBLIC_COLUMN_COUNT) {
      throw new Error(`${sheet.title} row ${rowIndex + 1} is not a seven-day calendar row.`);
    }

    row.cells.forEach((cell, columnIndex) => {
      const value = String(cell.value ?? "").trim();
      if (!value) return;

      if (rowIndex === 0) {
        if (columnIndex !== 0 || value !== sheet.title) {
          throw new Error(`${sheet.title} contains unexpected title-row content.`);
        }
        return;
      }

      if (rowIndex === 1) {
        const weekday = [
          "Sunday",
          "Monday",
          "Tuesday",
          "Wednesday",
          "Thursday",
          "Friday",
          "Saturday",
        ][columnIndex];
        if (value !== weekday) {
          throw new Error(`${sheet.title} contains an unexpected weekday heading.`);
        }
        return;
      }

      const [day, status, ...extra] = cleanLines(value);
      const invalidLimitedDetails = extra.some(
        (line) => !PUBLIC_EVENT_LINE_PATTERN.test(line) || PUBLIC_DETAIL_FORBIDDEN_PATTERN.test(line),
      );
      const invalidUnavailableDetails = extra.some(
        (line) => !PUBLIC_TRAVEL_LABEL_PATTERN.test(line),
      );
      const invalidOnlineDetails =
        !extra.includes(PUBLIC_IN_PERSON_LABEL) ||
        extra.some(
          (line) =>
            line !== PUBLIC_IN_PERSON_LABEL &&
            (!PUBLIC_EVENT_LINE_PATTERN.test(line) || PUBLIC_DETAIL_FORBIDDEN_PATTERN.test(line)),
        );
      const invalidStatusDetails =
        (!status && extra.length > 0) ||
        (status === "Holiday" && extra.length > 0) ||
        (status === "Unavailable" && invalidUnavailableDetails) ||
        (status === "Limited availability" && invalidLimitedDetails) ||
        (status === "Online available" && invalidOnlineDetails);

      if (
        !/^\d{1,2}$/.test(day) ||
        (status && !PUBLIC_STATUSES.has(status)) ||
        invalidStatusDetails
      ) {
        throw new Error(`${sheet.title} contains non-public schedule detail in row ${rowIndex + 1}.`);
      }
    });
  });
}

export function assertCalendarDisplayPublicSchedule(data) {
  if (data.privacyMode !== PUBLIC_PRIVACY_MODE) {
    throw new Error("The public schedule must declare Calendar Display event-detail privacy mode.");
  }

  if (!Array.isArray(data.sheets)) {
    throw new Error("The public schedule is missing its sheets array.");
  }

  data.sheets.forEach(assertCalendarDisplayPublicScheduleSheet);
}

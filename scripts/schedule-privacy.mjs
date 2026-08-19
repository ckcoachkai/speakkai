const PUBLIC_COLUMN_COUNT = 7;
const PUBLIC_STATUSES = new Set(["Limited availability", "Unavailable"]);
const PUBLIC_BUSY_TIME_PATTERN =
  /^Busy: (?:[01]\d|2[0-3]):[0-5]\d(?:–(?:[01]\d|2[0-3]):[0-5]\d)?$/;
const PUBLIC_TRAVEL_LABEL_PATTERN = /^Travel: Malaysia$/;
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

function extractPublicTravelLabel(value) {
  const details = String(value ?? "");
  const isTravel = /\ball\s*day\b|\btravel\b|\bbooked\b|\bplanned\b|旅行/i.test(details);
  return isTravel && /\bmalaysia\b/i.test(details) ? "Travel: Malaysia" : "";
}

export function sanitizeCalendarCell(value) {
  const lines = cleanLines(value);
  if (lines.length === 0) return "";

  const dayMatch = lines[0].match(/^(\d{1,2})(?:\s+(.+))?$/);
  if (!dayMatch) return "";

  const day = dayMatch[1];
  const details = [dayMatch[2], ...lines.slice(1)].filter(Boolean).join(" ");
  if (!details) return day;

  const busyTimes = extractBusyTimes(details);
  const unavailable =
    /\ball\s*day\b|\bholiday\b|全天|休假/i.test(details) ||
    (busyTimes.length === 0 && /\btravel\b|\bbooked\b|\bplanned\b|旅行/i.test(details));

  const publicLines = [day, unavailable ? "Unavailable" : "Limited availability"];
  if (unavailable) {
    const publicTravelLabel = extractPublicTravelLabel(details);
    if (publicTravelLabel) publicLines.push(publicTravelLabel);
  } else {
    publicLines.push(...busyTimes.map((time) => `Busy: ${time}`));
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

export function assertAvailabilityOnlySheet(sheet) {
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
      const invalidBusyTimes = extra.some((line) => !PUBLIC_BUSY_TIME_PATTERN.test(line));
      const invalidTravelLabels = extra.some((line) => !PUBLIC_TRAVEL_LABEL_PATTERN.test(line));
      const invalidStatusDetails =
        (!status && extra.length > 0) ||
        (status === "Unavailable" && invalidTravelLabels) ||
        (status === "Limited availability" && invalidBusyTimes);

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

export function assertAvailabilityOnlySchedule(data) {
  if (data.privacyMode !== "availability-only") {
    throw new Error("The public schedule must declare availability-only privacy mode.");
  }

  if (!Array.isArray(data.sheets)) {
    throw new Error("The public schedule is missing its sheets array.");
  }

  data.sheets.forEach(assertAvailabilityOnlySheet);
}

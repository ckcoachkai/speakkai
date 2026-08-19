const PUBLIC_COLUMN_COUNT = 7;
const PUBLIC_STATUSES = new Set(["Limited availability", "Unavailable"]);

function cleanLines(value) {
  return String(value ?? "")
    .replace(/\r/g, "")
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
}

export function sanitizeCalendarCell(value) {
  const lines = cleanLines(value);
  if (lines.length === 0) return "";

  const dayMatch = lines[0].match(/^(\d{1,2})(?:\s+(.+))?$/);
  if (!dayMatch) return "";

  const day = dayMatch[1];
  const details = [dayMatch[2], ...lines.slice(1)].filter(Boolean).join(" ");
  if (!details) return day;

  const unavailable =
    /\ball\s*day\b|\btravel\b|\bholiday\b|\bbooked\b|\bplanned\b|全天|休假|旅行/i.test(
      details,
    );

  return `${day}\n${unavailable ? "Unavailable" : "Limited availability"}`;
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
      if (!/^\d{1,2}$/.test(day) || extra.length > 0 || (status && !PUBLIC_STATUSES.has(status))) {
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

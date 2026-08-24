import { mkdir, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import {
  assertCalendarDisplayPublicSchedule,
  PUBLIC_PRIVACY_MODE,
  sanitizeCalendarGrid,
} from "./schedule-privacy.mjs";

const OUTPUT_PATH = resolve("public/data/schedule.json");
const MONTH_NAMES = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];
const MONTH_TITLE_PATTERN = new RegExp(`^(${MONTH_NAMES.join("|")}) (\\d{4})$`);

function requiredEnv(name) {
  const value = process.env[name]?.trim();
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

function parseFeedConfig(value) {
  let feeds;
  try {
    feeds = JSON.parse(value);
  } catch {
    throw new Error("GOOGLE_PUBLISHED_SHEETS_JSON is not valid JSON.");
  }

  if (!Array.isArray(feeds) || feeds.length === 0) {
    throw new Error("GOOGLE_PUBLISHED_SHEETS_JSON must contain at least one feed.");
  }

  return feeds.map((feed) => {
    if (!Number.isInteger(feed.id) || !feed.title || !feed.url) {
      throw new Error("Each published sheet feed needs a numeric id, title, and url.");
    }

    let url;
    try {
      url = new URL(feed.url);
    } catch {
      throw new Error(`Invalid published feed URL for ${feed.title}.`);
    }

    if (
      url.protocol !== "https:" ||
      !["docs.google.com", "docs.googleusercontent.com"].includes(url.hostname)
    ) {
      throw new Error(`Published feed for ${feed.title} must use an official Google HTTPS URL.`);
    }

    return { id: feed.id, title: String(feed.title), url: url.toString() };
  });
}

function parsePublishedWorkbookUrl(value) {
  let url;
  try {
    url = new URL(value);
  } catch {
    throw new Error("GOOGLE_PUBLISHED_SHEETS_URL is not a valid URL.");
  }

  if (
    url.protocol !== "https:" ||
    url.hostname !== "docs.google.com" ||
    !/^\/spreadsheets\/d\/e\/[^/]+\/pubhtml\/?$/.test(url.pathname)
  ) {
    throw new Error(
      "GOOGLE_PUBLISHED_SHEETS_URL must be an official Google published-workbook URL ending in /pubhtml.",
    );
  }

  url.search = "";
  url.hash = "";
  return url;
}

function parseStartMonth(value) {
  if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(value)) {
    throw new Error("GOOGLE_SCHEDULE_START_MONTH must use YYYY-MM format.");
  }

  const [year, month] = value.split("-").map(Number);
  return year * 12 + month - 1;
}

function toMonthKey(title) {
  const match = title.match(MONTH_TITLE_PATTERN);
  if (!match) return null;
  return Number(match[2]) * 12 + MONTH_NAMES.indexOf(match[1]);
}

function discoverMonthFeeds(workbookUrl, body, startMonth) {
  const feeds = [];
  const seen = new Set();
  const itemPattern = /items\.push\(\{name:\s*"([^"]+)",[\s\S]*?gid:\s*"(\d+)"[\s\S]*?\}\);/g;

  for (const match of body.matchAll(itemPattern)) {
    const title = match[1];
    const id = Number(match[2]);
    const monthKey = toMonthKey(title);
    if (monthKey === null || monthKey < startMonth || seen.has(id)) continue;

    const url = new URL(workbookUrl);
    url.pathname = url.pathname.replace(/\/pubhtml\/?$/, "/pub");
    url.searchParams.set("gid", String(id));
    url.searchParams.set("single", "true");
    url.searchParams.set("output", "csv");
    feeds.push({ id, title, url: url.toString(), monthKey });
    seen.add(id);
  }

  feeds.sort((left, right) => left.monthKey - right.monthKey);
  if (feeds.length === 0) {
    throw new Error("No published monthly schedule tabs were discovered.");
  }

  return feeds.map(({ monthKey: _monthKey, ...feed }) => feed);
}

async function fetchPublishedWorkbook(url) {
  const maximumAttempts = 4;
  let response;

  for (let attempt = 1; attempt <= maximumAttempts; attempt += 1) {
    try {
      response = await fetch(url, {
        headers: { "user-agent": "SpeakKai-Schedule-Mirror/1.0" },
        redirect: "follow",
        signal: AbortSignal.timeout(45_000),
      });

      if (response.ok || (response.status < 500 && response.status !== 429)) break;
    } catch (error) {
      if (attempt === maximumAttempts) {
        throw new Error("Published Google workbook could not be reached.", {
          cause: error,
        });
      }
    }

    if (attempt < maximumAttempts) {
      await new Promise((resolve) => setTimeout(resolve, attempt * 2_000));
    }
  }

  if (!response?.ok) {
    throw new Error(`Published Google workbook failed (${response.status}).`);
  }

  const body = await response.text();
  if (!/<html[\s>]/i.test(body) || !body.includes("items.push")) {
    throw new Error("Published Google workbook did not return the expected sheet index.");
  }

  return body;
}

async function resolveFeeds() {
  const publishedWorkbook = process.env.GOOGLE_PUBLISHED_SHEETS_URL?.trim();
  if (!publishedWorkbook) {
    return parseFeedConfig(requiredEnv("GOOGLE_PUBLISHED_SHEETS_JSON"));
  }

  const workbookUrl = parsePublishedWorkbookUrl(publishedWorkbook);
  const startMonth = parseStartMonth(
    process.env.GOOGLE_SCHEDULE_START_MONTH?.trim() || "2026-07",
  );
  const body = await fetchPublishedWorkbook(workbookUrl);
  return discoverMonthFeeds(workbookUrl, body, startMonth);
}

function parseCsv(input) {
  const rows = [];
  let row = [];
  let value = "";
  let quoted = false;

  for (let index = 0; index < input.length; index += 1) {
    const character = input[index];
    const nextCharacter = input[index + 1];

    if (quoted) {
      if (character === '"' && nextCharacter === '"') {
        value += '"';
        index += 1;
      } else if (character === '"') {
        quoted = false;
      } else {
        value += character;
      }
      continue;
    }

    if (character === '"') {
      quoted = true;
    } else if (character === ",") {
      row.push(value);
      value = "";
    } else if (character === "\n") {
      row.push(value.replace(/\r$/, ""));
      rows.push(row);
      row = [];
      value = "";
    } else {
      value += character;
    }
  }

  if (quoted) {
    throw new Error("Published CSV contains an unterminated quoted value.");
  }

  if (value.length > 0 || row.length > 0) {
    row.push(value.replace(/\r$/, ""));
    rows.push(row);
  }

  return rows;
}

function trimGrid(rows) {
  let lastUsedRow = -1;
  let lastUsedColumn = -1;

  rows.forEach((row, rowIndex) => {
    row.forEach((value, columnIndex) => {
      if (value !== "") {
        lastUsedRow = Math.max(lastUsedRow, rowIndex);
        lastUsedColumn = Math.max(lastUsedColumn, columnIndex);
      }
    });
  });

  if (lastUsedRow < 0 || lastUsedColumn < 0) {
    return [];
  }

  return rows.slice(0, lastUsedRow + 1).map((row) =>
    Array.from({ length: lastUsedColumn + 1 }, (_, index) => row[index] ?? ""),
  );
}

function toPublicSheet(feed, rows) {
  const grid = trimGrid(rows);
  const publicGrid = sanitizeCalendarGrid(grid, feed.title);

  return {
    id: feed.id,
    title: feed.title,
    frozenRows: 0,
    frozenColumns: 0,
    columns: Array.from({ length: 7 }, () => ({ width: 120 })),
    rows: publicGrid.map((row) => ({
      cells: row.map((value) => ({ value })),
    })),
    merges: [],
  };
}

async function fetchPublishedSheet(feed) {
  const maximumAttempts = 4;
  let response;

  for (let attempt = 1; attempt <= maximumAttempts; attempt += 1) {
    try {
      response = await fetch(feed.url, {
        headers: { "user-agent": "SpeakKai-Schedule-Mirror/1.0" },
        redirect: "follow",
        signal: AbortSignal.timeout(45_000),
      });

      if (response.ok || (response.status < 500 && response.status !== 429)) break;
    } catch (error) {
      if (attempt === maximumAttempts) {
        throw new Error(`Published feed for ${feed.title} could not be reached.`, {
          cause: error,
        });
      }
    }

    if (attempt < maximumAttempts) {
      await new Promise((resolve) => setTimeout(resolve, attempt * 2_000));
    }
  }

  if (!response?.ok) {
    throw new Error(`Published feed for ${feed.title} failed (${response.status}).`);
  }

  const contentType = response.headers.get("content-type") ?? "";
  const body = await response.text();
  if (contentType.includes("text/html") || /^\s*<!doctype html/i.test(body)) {
    throw new Error(`Published feed for ${feed.title} returned a web page instead of CSV.`);
  }

  return toPublicSheet(feed, parseCsv(body.replace(/^\uFEFF/, "")));
}

async function main() {
  const feeds = await resolveFeeds();
  const sheets = await Promise.all(feeds.map(fetchPublishedSheet));

  const output = {
    status: "ready",
    updatedAt: new Date().toISOString(),
    spreadsheetTitle: "Kai Schedule 2026",
    timeZone: "Asia/Shanghai",
    privacyMode: PUBLIC_PRIVACY_MODE,
    sheets,
  };

  assertCalendarDisplayPublicSchedule(output);

  await mkdir(dirname(OUTPUT_PATH), { recursive: true });
  await writeFile(OUTPUT_PATH, `${JSON.stringify(output)}\n`, "utf8");
  console.log(`Mirrored ${sheets.length} published schedule tab(s).`);
}

main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});

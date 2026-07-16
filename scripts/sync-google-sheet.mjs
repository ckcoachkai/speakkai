import { mkdir, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";

const OUTPUT_PATH = resolve("public/data/schedule.json");

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
  const columnCount = grid.reduce((maximum, row) => Math.max(maximum, row.length), 0);

  return {
    id: feed.id,
    title: feed.title,
    frozenRows: 0,
    frozenColumns: 0,
    columns: Array.from({ length: columnCount }, () => ({ width: 120 })),
    rows: grid.map((row) => ({
      cells: row.map((value) => ({ value })),
    })),
    merges: [],
  };
}

async function fetchPublishedSheet(feed) {
  const response = await fetch(feed.url, {
    headers: { "user-agent": "SpeakKai-Schedule-Mirror/1.0" },
    redirect: "follow",
  });

  if (!response.ok) {
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
  const feeds = parseFeedConfig(requiredEnv("GOOGLE_PUBLISHED_SHEETS_JSON"));
  const sheets = await Promise.all(feeds.map(fetchPublishedSheet));

  const output = {
    status: "ready",
    updatedAt: new Date().toISOString(),
    spreadsheetTitle: "SpeakKai Schedule",
    timeZone: "Asia/Shanghai",
    sheets,
  };

  await mkdir(dirname(OUTPUT_PATH), { recursive: true });
  await writeFile(OUTPUT_PATH, `${JSON.stringify(output)}\n`, "utf8");
  console.log(`Mirrored ${sheets.length} published schedule tab(s).`);
}

main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});

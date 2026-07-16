import { createSign } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";

const OUTPUT_PATH = resolve("public/data/schedule.json");
const SHEETS_READ_SCOPE = "https://www.googleapis.com/auth/spreadsheets.readonly";

function requiredEnv(name) {
  const value = process.env[name]?.trim();
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

function base64Url(value) {
  return Buffer.from(value)
    .toString("base64")
    .replace(/=/g, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");
}

async function getAccessToken(credentials) {
  const issuedAt = Math.floor(Date.now() / 1000);
  const header = base64Url(JSON.stringify({ alg: "RS256", typ: "JWT" }));
  const payload = base64Url(
    JSON.stringify({
      iss: credentials.client_email,
      scope: SHEETS_READ_SCOPE,
      aud: "https://oauth2.googleapis.com/token",
      iat: issuedAt,
      exp: issuedAt + 3600,
    }),
  );
  const unsignedToken = `${header}.${payload}`;
  const signer = createSign("RSA-SHA256");
  signer.update(unsignedToken);
  signer.end();
  const signature = signer.sign(credentials.private_key, "base64url");

  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion: `${unsignedToken}.${signature}`,
    }),
  });

  if (!response.ok) {
    throw new Error(`Google authentication failed (${response.status}).`);
  }

  const token = await response.json();
  return token.access_token;
}

async function fetchSpreadsheet(spreadsheetId, token, allowedSheetIds) {
  const metadataUrl = new URL(
    `https://sheets.googleapis.com/v4/spreadsheets/${encodeURIComponent(spreadsheetId)}`,
  );
  metadataUrl.searchParams.set(
    "fields",
    "properties(title,timeZone),sheets(properties(sheetId,title,index,hidden))",
  );

  const metadataResponse = await fetch(metadataUrl, {
    headers: { authorization: `Bearer ${token}` },
  });
  if (!metadataResponse.ok) {
    throw new Error(`Google Sheets metadata request failed (${metadataResponse.status}).`);
  }

  const metadata = await metadataResponse.json();
  const allowedSheets = metadata.sheets
    .filter((sheet) => allowedSheetIds.has(sheet.properties.sheetId))
    .sort((a, b) => a.properties.index - b.properties.index);

  const missingIds = [...allowedSheetIds].filter(
    (id) => !allowedSheets.some((sheet) => sheet.properties.sheetId === id),
  );
  if (missingIds.length > 0) {
    throw new Error(`Configured sheet tabs were not found: ${missingIds.join(", ")}`);
  }

  const dataUrl = new URL(
    `https://sheets.googleapis.com/v4/spreadsheets/${encodeURIComponent(spreadsheetId)}`,
  );
  dataUrl.searchParams.set("includeGridData", "true");
  for (const sheet of allowedSheets) {
    const title = sheet.properties.title.replace(/'/g, "''");
    dataUrl.searchParams.append("ranges", `'${title}'`);
  }

  const dataResponse = await fetch(dataUrl, {
    headers: { authorization: `Bearer ${token}` },
  });
  if (!dataResponse.ok) {
    throw new Error(`Google Sheets data request failed (${dataResponse.status}).`);
  }

  return { metadata, spreadsheet: await dataResponse.json() };
}

function colorToHex(color) {
  if (!color) return undefined;
  const channels = [color.red ?? 0, color.green ?? 0, color.blue ?? 0].map((channel) =>
    Math.round(channel * 255)
      .toString(16)
      .padStart(2, "0"),
  );
  return `#${channels.join("")}`;
}

function sanitizeCell(cell = {}) {
  const format = cell.effectiveFormat ?? {};
  const textFormat = format.textFormat ?? {};
  const background =
    format.backgroundColorStyle?.rgbColor ?? format.backgroundColor;
  const foreground =
    textFormat.foregroundColorStyle?.rgbColor ?? textFormat.foregroundColor;

  return {
    value: cell.formattedValue ?? "",
    ...(background && { background: colorToHex(background) }),
    ...(foreground && { foreground: colorToHex(foreground) }),
    ...(textFormat.bold && { bold: true }),
    ...(textFormat.italic && { italic: true }),
    ...(format.horizontalAlignment && {
      horizontalAlignment: format.horizontalAlignment.toLowerCase(),
    }),
    ...(format.verticalAlignment && {
      verticalAlignment: format.verticalAlignment.toLowerCase(),
    }),
    ...(format.wrapStrategy && { wrapStrategy: format.wrapStrategy.toLowerCase() }),
    ...(isSafeLink(cell.hyperlink) && { link: cell.hyperlink }),
  };
}

function isSafeLink(value) {
  if (!value) return false;
  try {
    const url = new URL(value);
    return url.protocol === "https:" || url.protocol === "http:";
  } catch {
    return false;
  }
}

function trimRows(rows) {
  let lastUsedRow = -1;
  let lastUsedColumn = -1;

  rows.forEach((row, rowIndex) => {
    row.values?.forEach((cell, columnIndex) => {
      if (cell.formattedValue !== undefined && cell.formattedValue !== "") {
        lastUsedRow = Math.max(lastUsedRow, rowIndex);
        lastUsedColumn = Math.max(lastUsedColumn, columnIndex);
      }
    });
  });

  if (lastUsedRow < 0 || lastUsedColumn < 0) {
    return { rows: [], columnCount: 0 };
  }

  return {
    rows: rows.slice(0, lastUsedRow + 1).map((row) => ({
      hidden: Boolean(row.hidden),
      height: row.height,
      cells: (row.values ?? [])
        .slice(0, lastUsedColumn + 1)
        .map((cell) => sanitizeCell(cell)),
    })),
    columnCount: lastUsedColumn + 1,
  };
}

function sanitizeSheet(sheet) {
  const data = sheet.data?.[0] ?? {};
  const rowData = data.rowData ?? [];
  const rowMetadata = data.rowMetadata ?? [];
  const rowsWithMetadata = rowData.map((row, index) => ({
    ...row,
    hidden: rowMetadata[index]?.hiddenByUser,
    height: rowMetadata[index]?.pixelSize,
  }));
  const trimmed = trimRows(rowsWithMetadata);

  return {
    id: sheet.properties.sheetId,
    title: sheet.properties.title,
    frozenRows: sheet.properties.gridProperties?.frozenRowCount ?? 0,
    frozenColumns: sheet.properties.gridProperties?.frozenColumnCount ?? 0,
    columns: Array.from({ length: trimmed.columnCount }, (_, index) => ({
      hidden: Boolean(data.columnMetadata?.[index]?.hiddenByUser),
      width: data.columnMetadata?.[index]?.pixelSize,
    })),
    rows: trimmed.rows,
    merges: (sheet.merges ?? []).map((merge) => ({
      startRow: merge.startRowIndex ?? 0,
      endRow: merge.endRowIndex ?? 0,
      startColumn: merge.startColumnIndex ?? 0,
      endColumn: merge.endColumnIndex ?? 0,
    })),
  };
}

async function main() {
  const rawCredentials = requiredEnv("GOOGLE_SERVICE_ACCOUNT_JSON");
  const spreadsheetId = requiredEnv("GOOGLE_SHEET_ID");
  const allowedSheetIds = new Set(
    requiredEnv("GOOGLE_SHEET_GIDS")
      .split(",")
      .map((value) => Number.parseInt(value.trim(), 10))
      .filter(Number.isInteger),
  );

  if (allowedSheetIds.size === 0) {
    throw new Error("GOOGLE_SHEET_GIDS must contain at least one numeric sheet ID.");
  }

  let credentials;
  try {
    credentials = JSON.parse(rawCredentials);
  } catch {
    throw new Error("GOOGLE_SERVICE_ACCOUNT_JSON is not valid JSON.");
  }

  if (!credentials.client_email || !credentials.private_key) {
    throw new Error("The Google service account JSON is missing required fields.");
  }

  const token = await getAccessToken(credentials);
  const { metadata, spreadsheet } = await fetchSpreadsheet(
    spreadsheetId,
    token,
    allowedSheetIds,
  );

  const output = {
    status: "ready",
    updatedAt: new Date().toISOString(),
    spreadsheetTitle: metadata.properties.title,
    timeZone: metadata.properties.timeZone,
    sheets: spreadsheet.sheets.map(sanitizeSheet),
  };

  await mkdir(dirname(OUTPUT_PATH), { recursive: true });
  await writeFile(OUTPUT_PATH, `${JSON.stringify(output)}\n`, "utf8");
  console.log(`Mirrored ${output.sheets.length} approved sheet tab(s).`);
}

main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});

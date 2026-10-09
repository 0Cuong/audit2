import fs from "node:fs";
import path from "node:path";
import { TABLES } from "../worker/schema.js";

const root = process.cwd();
const dbPath = path.join(root, "recovered", "database.json");
const outputPath = path.join(root, "recovered", "private", "seed-recovered.local.sql");

if (!fs.existsSync(dbPath)) {
  console.error("Database file not found:", dbPath);
  process.exit(1);
}

const db = JSON.parse(fs.readFileSync(dbPath, "utf8"));
const tablesData = db.tables || {};

function escapeSqlString(val) {
  if (val === null || val === undefined) return "NULL";
  return "'" + String(val).replace(/'/g, "''") + "'";
}

function normalizeMediaValue(table, column, row, value) {
  if (typeof value === "string") {
    if (value.startsWith("https://recpvczpwybpbbntwnnk.supabase.co/storage/v1/object/public/")) {
      value = value.replace("https://recpvczpwybpbbntwnnk.supabase.co/storage/v1/object/public/", "/api/media/");
    }
    if (table === "anniversaries" && column === "photo_url" && value.startsWith("data:image/")) {
      const ext = value.startsWith("data:image/webp") ? "webp" : "jpg";
      return `/api/recovered/anniversaries/${row.id}.${ext}`;
    }
  }
  return value;
}

function serializeForD1(table, column, row, rawValue) {
  const type = TABLES[table]?.[column];
  const value = normalizeMediaValue(table, column, row, rawValue);
  if (value === undefined || value === null) return "NULL";
  if (type === "boolean") {
    const isTrue = value === true || value === 1 || value === "1" || value === "t" || value === "true";
    return isTrue ? "1" : "0";
  }
  if (type === "number") {
    const num = Number(value);
    return Number.isFinite(num) ? String(num) : "NULL";
  }
  if (type === "json") {
    if (typeof value === "string") {
      try {
        const parsed = JSON.parse(value);
        return escapeSqlString(JSON.stringify(parsed));
      } catch {
        if (value === "{}" || value === "") return "'[]'";
        return escapeSqlString(value);
      }
    }
    return escapeSqlString(JSON.stringify(value));
  }
  return escapeSqlString(value);
}

const statements = [];
let totalRows = 0;

for (const [table, info] of Object.entries(tablesData)) {
  if (!TABLES[table]) {
    console.warn("Table not in schema:", table);
    continue;
  }
  const rows = info.rows || [];
  if (!rows.length) continue;

  const validColumns = Object.keys(TABLES[table]);

  for (const row of rows) {
    const colsInRow = Object.keys(row).filter((col) => validColumns.includes(col));
    if (!colsInRow.length) continue;

    const colNames = colsInRow.map((c) => `"${c}"`).join(", ");
    const colValues = colsInRow.map((c) => serializeForD1(table, c, row, row[c])).join(", ");

    statements.push(`INSERT OR IGNORE INTO "${table}" (${colNames}) VALUES (${colValues});`);
    totalRows++;
  }
}

const sqlContent = "-- Generated seed file for Cloudflare D1 from recovered/database.json\n" +
  "-- Total rows: " + totalRows + "\n\n" +
  statements.join("\n") + "\n";

fs.mkdirSync(path.dirname(outputPath), { recursive: true });
fs.writeFileSync(outputPath, sqlContent, "utf8");
console.log(`Generated LOCAL-ONLY seed ${outputPath} with ${totalRows} rows across ${Object.keys(tablesData).length} tables (${sqlContent.length} bytes).`);
console.log("Do not commit this file or apply it before verifying source and target row/media counts.");

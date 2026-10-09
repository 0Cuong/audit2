import fs from "node:fs";
import path from "node:path";

const repoRoot = process.cwd();
const backupPath = path.resolve(process.env.DB_BACKUP_PATH || path.join(repoRoot, "db_cluster-03-10-2026@23-05-37.backup"));
const target = String(process.env.TARGET_API_URL || "").replace(/\/+$/, "");
const secret = process.env.IMPORT_SECRET || "";
const accessClientId = process.env.CF_ACCESS_CLIENT_ID || "";
const accessClientSecret = process.env.CF_ACCESS_CLIENT_SECRET || "";
const accessHeaders = accessClientId && accessClientSecret
  ? { "CF-Access-Client-Id": accessClientId, "CF-Access-Client-Secret": accessClientSecret }
  : {};
const storageRoot = process.env.STORAGE_DUMP_PATH ? path.resolve(process.env.STORAGE_DUMP_PATH) : null;
const dryRun = process.env.DRY_RUN === "1";

if (!fs.existsSync(backupPath)) throw new Error("Backup file not found: " + backupPath);
if (Boolean(accessClientId) !== Boolean(accessClientSecret)) throw new Error("Set both CF_ACCESS_CLIENT_ID and CF_ACCESS_CLIENT_SECRET");
if (!dryRun && (!target || !secret || !accessClientId || !accessClientSecret)) {
  throw new Error("Set TARGET_API_URL, IMPORT_SECRET and the Cloudflare Access service-token pair. Use DRY_RUN=1 for inspection only.");
}

const SUPPORTED_TABLES = [
  "anniversaries","bucket_list_items","bucket_list_replies","couple_invites","couple_members",
  "couple_profile","gifts","journal_entries","listening_history","love_letter_replies","love_letters",
  "map_locations","memories","messages","mood_entries","settings","songs","timeline_event_replies",
  "timeline_events","user_assets","user_config_revisions","user_custom_pages","user_personalization",
  "user_presets","user_rules","user_saved_views","user_workspaces"
];

const JSON_COLUMNS = new Set([
  "photos","tags","contact_links","appearance","background","identity","navigation","blocks",
  "theme_override","background_override","navigation_override","filters","condition","action_payload",
  "identity_decoration","sample_blocks","snapshot"
]);
const BOOLEAN_COLUMNS = new Set([
  "is_completed","is_favorite","is_pinned","is_draft","is_locked","is_future","privacy_mode",
  "notifications_enabled","is_background","is_received","is_default","is_enabled"
]);
const ARRAY_COLUMNS = new Set(["photos","tags"]);

function parseCopyLine(line) {
  const fields = [];
  let current = "";
  let escaped = false;
  let nullField = false;

  const push = () => {
    fields.push(nullField ? null : current);
    current = "";
    nullField = false;
  };

  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (escaped) {
      if (ch === "N" && current === "" && !nullField) {
        nullField = true;
      } else if (!nullField) {
        if (ch === "t") current += "\t";
        else if (ch === "n") current += "\n";
        else if (ch === "r") current += "\r";
        else if (ch === "b") current += "\b";
        else if (ch === "f") current += "\f";
        else if (ch === "v") current += "\v";
        else current += ch;
      }
      escaped = false;
      continue;
    }
    if (ch === "\\") { escaped = true; continue; }
    if (ch === "\t") { push(); continue; }
    if (!nullField) current += ch;
  }

  if (escaped && !nullField) current += "\\";
  push();
  return fields;
}

function parsePgArray(value) {
  if (value == null) return [];
  if (value === "{}") return [];
  if (!value.startsWith("{") || !value.endsWith("}")) return [value];
  const inner = value.slice(1, -1);
  const out = [];
  let current = "";
  let quoted = false;
  let escaped = false;
  for (const ch of inner) {
    if (escaped) { current += ch; escaped = false; continue; }
    if (ch === "\\") { escaped = true; continue; }
    if (ch === '"') { quoted = !quoted; continue; }
    if (ch === "," && !quoted) { out.push(current); current = ""; continue; }
    current += ch;
  }
  out.push(current);
  return out.filter(v => v !== "");
}

function parseValue(column, value) {
  if (value == null) return null;
  if (BOOLEAN_COLUMNS.has(column)) return value === "t" || value === "true" || value === "1";
  if (ARRAY_COLUMNS.has(column)) return parsePgArray(value);
  if (JSON_COLUMNS.has(column)) {
    try { return JSON.parse(value); } catch {
      if (value === "{}") return {};
      if (value === "[]") return [];
      return value;
    }
  }
  if (column === "size" || column === "sort_order" || column === "intensity" || column === "reminder_days" || column === "id" && /^\d+$/.test(value)) {
    return value === "" ? null : Number(value);
  }
  return value;
}

function parseDump(sql) {
  const re = /^COPY public\.([^\s(]+) \(([^)]*)\) FROM stdin;\n([\\s\\S]*?)^\\\.\n/gm;
  const tables = new Map();
  let match;
  while ((match = re.exec(sql))) {
    const table = match[1];
    if (!SUPPORTED_TABLES.includes(table)) continue;
    const columns = match[2].split(",").map(v => v.trim().replace(/^"|"$/g, ""));
    const rawRows = match[3].split("\n").filter(Boolean);
    const rows = rawRows.map(line => {
      const values = parseCopyLine(line);
      if (values.length !== columns.length) {
        throw new Error(table + ": COPY column/value mismatch (" + columns.length + " vs " + values.length + ")");
      }
      return Object.fromEntries(columns.map((column, i) => [column, parseValue(column, values[i])]));
    });
    tables.set(table, { columns, rows });
  }
  return tables;
}

async function importTable(table, rows) {
  const response = await fetch(target + "/api/admin/import/table", {
    method: "POST",
    headers: { "content-type": "application/json", "X-Import-Secret": secret, ...accessHeaders },
    body: JSON.stringify({
      table,
      rows,
      mode: "insert-if-missing"
    })
  });
  if (!response.ok) throw new Error("Import " + table + " failed: HTTP " + response.status + " " + (await response.text()).slice(0, 500));
  return response.json();
}

function collectStorageFiles(root) {
  if (!root || !fs.existsSync(root)) return [];
  const result = [];
  function walk(dir) {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) walk(full);
      else result.push(full);
    }
  }
  walk(root);
  return result;
}

function storageObjectFromPath(file, root) {
  const rel = path.relative(root, file).split(path.sep).join("/");
  const parts = rel.split("/");
  const bucketIndex = parts.findIndex(p => ["avatars","memories","photos","assets"].includes(p));
  if (bucketIndex < 0) return null;
  const bucket = parts[bucketIndex];
  const objectPath = parts.slice(bucketIndex + 1).join("/");
  if (!objectPath) return null;
  return { bucket, objectPath, file };
}

async function importStorage(root) {
  const objects = collectStorageFiles(root).map(f => storageObjectFromPath(f, root)).filter(Boolean);
  for (const object of objects) {
    const form = new FormData();
    const buffer = fs.readFileSync(object.file);
    form.append("bucket", object.bucket);
    form.append("path", object.objectPath);
    form.append("file", new Blob([buffer], { type: "application/octet-stream" }), path.basename(object.file));
    const response = await fetch(target + "/api/admin/import/storage", {
      method: "POST",
      headers: { "X-Import-Secret": secret, ...accessHeaders },
      body: form
    });
    if (!response.ok) throw new Error("Import storage " + object.bucket + "/" + object.objectPath + " failed: HTTP " + response.status);
  }
  return objects.length;
}

const sql = fs.readFileSync(backupPath, "utf8");
const tables = parseDump(sql);
if (tables.size === 0) throw new Error("No supported PostgreSQL COPY tables were found in the backup input");
const summary = Object.fromEntries([...tables].map(([table, data]) => [table, data.rows.length]));
console.log(JSON.stringify({ backup: path.basename(backupPath), tables: summary, dryRun }, null, 2));

if (!dryRun) {
  const health = await fetch(target + "/api/health");
  if (!health.ok) throw new Error("Cloudflare health check failed: HTTP " + health.status);
  const imported = {};
  for (const [table, data] of tables) {
    const result = await importTable(table, data.rows);
    imported[table] = result?.imported ?? data.rows.length;
  }
  const storageImported = storageRoot ? await importStorage(storageRoot) : 0;
  console.log(JSON.stringify({ ok: true, mode: "insert-if-missing", imported, storageImported }, null, 2));
}

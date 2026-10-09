import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const databasePath = path.join(root, "recovered", "database.json");
const target = String(process.env.TARGET_API_URL || "").replace(/\/+$/, "");
const secret = process.env.IMPORT_SECRET || "";
const clientId = process.env.CF_ACCESS_CLIENT_ID || "";
const clientSecret = process.env.CF_ACCESS_CLIENT_SECRET || "";
const accessHeaders = clientId && clientSecret ? { "CF-Access-Client-Id": clientId, "CF-Access-Client-Secret": clientSecret } : {};

if (!fs.existsSync(databasePath)) throw new Error("Private recovered/database.json is missing; restore it locally before media upload");
if (!target || !secret || !clientId || !clientSecret) throw new Error("Set TARGET_API_URL, IMPORT_SECRET, CF_ACCESS_CLIENT_ID and CF_ACCESS_CLIENT_SECRET");
const database = JSON.parse(fs.readFileSync(databasePath, "utf8"));
const rows = database.tables?.anniversaries?.rows || [];
const maxBytes = 50 * 1024 * 1024;
let uploaded = 0;
let skipped = 0;

async function upload(row, mime, encoded) {
  if (!row.id || !/^[0-9a-f-]{36}$/i.test(String(row.id))) throw new Error("Anniversary media row has an invalid UUID");
  const extension = mime === "image/webp" ? "webp" : mime === "image/png" ? "png" : "jpg";
  const bytes = Buffer.from(encoded, "base64");
  if (!bytes.length || bytes.length > maxBytes) throw new Error("Anniversary image is empty or exceeds 50 MiB");
  const form = new FormData();
  form.append("bucket", "photos");
  form.append("path", "anniversaries/" + row.id + "." + extension);
  form.append("file", new Blob([bytes], { type: mime }), String(row.id) + "." + extension);
  const response = await fetch(target + "/api/admin/import/storage", {
    method: "POST",
    headers: { "X-Import-Secret": secret, ...accessHeaders },
    body: form
  });
  if (!response.ok) throw new Error("Upload failed for anniversary " + row.id + ": HTTP " + response.status);
  return "/api/recovered/anniversaries/" + row.id + "." + extension;
}

for (const row of rows) {
  const value = row?.photo_url;
  if (typeof value !== "string" || !value.startsWith("data:image/")) { skipped++; continue; }
  const match = value.match(/^data:(image\/(?:jpeg|png|webp));base64,([A-Za-z0-9+/=\r\n]+)$/i);
  if (!match) throw new Error("Unsupported or malformed inline image data for anniversary " + (row.id || "(missing id)"));
  await upload(row, match[1].toLowerCase(), match[2].replace(/\s/g, ""));
  uploaded++;
  console.log("Uploaded recovered anniversary media " + row.id);
}

console.log(JSON.stringify({ ok: true, uploaded, skipped, totalRows: rows.length, r2Prefix: "photos/anniversaries/" }, null, 2));

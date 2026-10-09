import fs from "node:fs";
import path from "node:path";
import { resolveMediaContentType } from "../worker/modules/media-utils.js";

const storageRoot = process.env.STORAGE_DUMP_PATH ? path.resolve(process.env.STORAGE_DUMP_PATH) : "";
const target = String(process.env.TARGET_API_URL || "").replace(/\/+$/, "");
const secret = process.env.IMPORT_SECRET || "";
const clientId = process.env.CF_ACCESS_CLIENT_ID || "";
const clientSecret = process.env.CF_ACCESS_CLIENT_SECRET || "";
const accessHeaders = clientId && clientSecret
  ? { "CF-Access-Client-Id": clientId, "CF-Access-Client-Secret": clientSecret }
  : {};
const BUCKETS = new Set(["avatars", "memories", "photos", "assets"]);
const MAX_UPLOAD_BYTES = 20 * 1024 * 1024;

if (!storageRoot) throw new Error("Set STORAGE_DUMP_PATH to the local Supabase Storage export folder");
if (!target || !secret || !clientId || !clientSecret) {
  throw new Error("Set TARGET_API_URL, IMPORT_SECRET, CF_ACCESS_CLIENT_ID and CF_ACCESS_CLIENT_SECRET in your local shell");
}
let targetUrl;
try {
  targetUrl = new URL(target);
} catch {
  throw new Error("TARGET_API_URL must be a valid HTTPS URL");
}
if (targetUrl.protocol !== "https:" || targetUrl.hostname.toLowerCase() !== "formygf.luongminhcuong130.workers.dev" || targetUrl.username || targetUrl.password || targetUrl.search || targetUrl.hash) {
  throw new Error("For safety, TARGET_API_URL must be https://formygf.luongminhcuong130.workers.dev with no path, query or credentials");
}
if (!fs.existsSync(storageRoot) || !fs.statSync(storageRoot).isDirectory()) {
  throw new Error("Storage export folder not found or is not a directory: " + storageRoot);
}

function collectFiles(root) {
  const files = [];
  function walk(directory) {
    for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
      const fullPath = path.join(directory, entry.name);
      if (entry.isDirectory()) walk(fullPath);
      else if (entry.isFile()) files.push(fullPath);
    }
  }
  walk(root);
  return files;
}

function objectFromFile(file) {
  const relative = path.relative(storageRoot, file);
  const parts = relative.split(path.sep);
  const bucketIndex = parts.findIndex((part) => BUCKETS.has(part.toLowerCase()));
  let bucket;
  let objectParts;

  if (bucketIndex >= 0) {
    bucket = parts[bucketIndex].toLowerCase();
    objectParts = parts.slice(bucketIndex + 1);
  } else {
    const rootBucket = path.basename(storageRoot).toLowerCase();
    if (rootBucket === "anniversaries") {
      bucket = "photos";
      objectParts = ["anniversaries", ...parts];
    } else if (BUCKETS.has(rootBucket)) {
      bucket = rootBucket;
      objectParts = parts;
    } else {
      return null;
    }
  }

  const objectPath = objectParts.join("/");
  if (!objectPath || objectParts.some((part) => !part || part === "." || part === "..")) return null;
  if (objectPath.includes("\\\\")) return null;
  const key = bucket + "/" + objectPath;
  if (Buffer.byteLength(key, "utf8") > 512) {
    throw new Error("KV key exceeds 512 UTF-8 bytes: " + key);
  }

  return { bucket, objectPath, file };
}

const objects = collectFiles(storageRoot).map(objectFromFile).filter(Boolean);
if (!objects.length) {
  throw new Error("No supported storage objects found. Set STORAGE_DUMP_PATH to a folder containing bucket folders such as memories/uploads/...");
}

const oversized = objects.filter((object) => fs.statSync(object.file).size > MAX_UPLOAD_BYTES);
if (oversized.length) {
  throw new Error("These files exceed the Worker’s 20 MiB upload limit; no files were uploaded:\n" +
    oversized.map((object) => object.bucket + "/" + object.objectPath).join("\n"));
}

async function expectOk(response, label) {
  if (response.ok) return;
  const body = await response.text().catch(() => "");
  throw new Error(label + " failed with HTTP " + response.status + (body ? " — " + body.slice(0, 400) : ""));
}

const healthResponse = await fetch(target + "/api/health", { headers: accessHeaders });
await expectOk(healthResponse, "Cloudflare health check");
const health = await healthResponse.json().catch(() => null);
if (!health?.ok) throw new Error("Cloudflare health endpoint did not report ok=true");

const importedByBucket = {};
let imported = 0;
for (const [index, object] of objects.entries()) {
  const fileBytes = fs.readFileSync(object.file);
  const contentType = resolveMediaContentType(null, object.objectPath, fileBytes);
  const form = new FormData();
  form.append("bucket", object.bucket);
  form.append("path", object.objectPath);
  form.append("file", new Blob([fileBytes], { type: contentType }), path.basename(object.file));

  const response = await fetch(target + "/api/admin/import/storage", {
    method: "POST",
    headers: { "X-Import-Secret": secret, ...accessHeaders },
    body: form
  });
  await expectOk(response, "Upload " + object.bucket + "/" + object.objectPath);
  importedByBucket[object.bucket] = (importedByBucket[object.bucket] || 0) + 1;
  imported++;
  console.log("Uploaded " + (index + 1) + "/" + objects.length + ": " + object.bucket + "/" + object.objectPath);
}

console.log(JSON.stringify({
  ok: true,
  mode: "local-storage-to-cloudflare-kv",
  imported,
  importedByBucket
}, null, 2));

import { TABLES } from "./schema.js";


import { BUCKETS } from "./modules/storage-constants.js";
import { normalizeMediaReferences, resolveMediaContentType } from "./modules/media-utils.js";
import { buildCorsHeaders, isCorsOriginAllowed } from "./cors.js";
import { verifyCloudflareAccess, isAdminAccessIdentity } from "./access-auth.js";


const MAX_UPLOAD_BYTES = 20 * 1024 * 1024;
const BLOCKED_UPLOAD_TYPES = new Set(["text/html", "application/xhtml+xml", "application/javascript", "text/javascript", "text/css", "application/xml", "text/xml"]);

function safeUploadContentType(file) {
  const contentType = String(file?.type || "application/octet-stream").split(";")[0].trim().toLowerCase();
  return BLOCKED_UPLOAD_TYPES.has(contentType) ? null : contentType;
}

function mediaSecurityHeaders() {
  return {
    "cache-control": "private, no-store",
    "x-content-type-options": "nosniff",
    "content-security-policy": "default-src 'none'; sandbox",
    "x-frame-options": "DENY"
  };
}

function json(data, status = 200, headers = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "content-type": "application/json; charset=UTF-8", ...headers }
  });
}

function withCors(response, request, env) {
  const headers = new Headers(response.headers);
  for (const [key, value] of Object.entries(buildCorsHeaders(request, env.CORS_ORIGIN))) headers.set(key, value);
  headers.set("Vary", "Origin");
  if (new URL(request.url).pathname.startsWith("/api/")) {
    headers.set("Cache-Control", "no-store");
    headers.set("X-Content-Type-Options", "nosniff");
  }
  return new Response(response.body, { status: response.status, statusText: response.statusText, headers });
}

function apiError(message, status = 400, code = "API_ERROR") {
  return { data: null, error: { message, code, status } };
}

function tableSchema(table) {
  if (!Object.prototype.hasOwnProperty.call(TABLES, table)) throw new Error("Unknown table");
  return TABLES[table];
}

function validateColumn(table, column) {
  if (!Object.prototype.hasOwnProperty.call(TABLES[table], column)) throw new Error("Invalid column: " + column);
}

function serializeValue(table, column, value) {
  const type = TABLES[table][column];
  if (value === undefined || value === null) return null;
  if (type === "json") return JSON.stringify(value);
  if (type === "boolean") return value === true || value === 1 || value === "1" || value === "true" || value === "t" ? 1 : 0;
  if (type === "number") return Number(value);
  return String(value);
}

function deserializeValue(table, column, value) {
  const type = TABLES[table][column];
  if (value === undefined || value === null) return value ?? null;
  if (type === "json") {
    if (typeof value !== "string") return value;
    if (value === "") return null;
    try { return JSON.parse(value); } catch { return value; }
  }
  if (type === "boolean") return value === true || value === 1 || value === "1" || value === "t" || value === "true";
  if (type === "number") return Number(value);
  return value;
}

function hydrateRow(table, row) {
  const schema = tableSchema(table);
  const output = {};
  for (const key of Object.keys(row)) {
    const value = schema[key] ? deserializeValue(table, key, row[key]) : row[key];
    output[key] = normalizeMediaReferences(value);
  }

  // Compatibility aliases for data that originated in the older Supabase schema.
  if (table === "timeline_events") {
    if (!output.category) output.category = output.event_type || "custom";
    if (!output.description) output.description = output.story || "";
    if (!output.image_url && Array.isArray(output.photos) && output.photos.length) output.image_url = output.photos[0];
    if (!output.icon) output.icon = output.event_type || "custom";
    output.is_favorite = Boolean(output.is_favorite);
  }

  if (table === "memories") {
    if (!output.media_type) output.media_type = output.category || "photo";
    if (!Array.isArray(output.collection_ids)) output.collection_ids = [];
    output.is_favorite = Boolean(output.is_favorite);
    output.is_pinned = Boolean(output.is_pinned);
  }

  if (table === "journal_entries") {
    if (!output.title) output.title = "";
    if (!output.type) output.type = "memory";
    if (!output.mood) output.mood = "peaceful";
    if (!Array.isArray(output.tags)) output.tags = [];
    if (!output.metadata || typeof output.metadata !== "object") output.metadata = {};
    output.is_favorite = Boolean(output.is_favorite);
    output.is_pinned = Boolean(output.is_pinned);
  }

  if (table === "anniversaries" && !output.type) {
    output.type = output.anniversary_type || "yearly";
  }

  return output;
}

function cleanColumns(table, row) {
  const schema = tableSchema(table);
  const keys = Object.keys(row || {});
  const unknown = keys.filter((key) => !Object.prototype.hasOwnProperty.call(schema, key));
  if (unknown.length) throw new Error("Unknown columns for " + table + ": " + unknown.join(", "));
  return keys;
}

function buildWhere(table, filters, params) {
  if (!Array.isArray(filters) || filters.length === 0) return "";
  const parts = [];
  for (const filter of filters) {
    const column = filter?.column;
    const op = filter?.op || "eq";
    const value = filter?.value;
    validateColumn(table, column);

    if (op === "in") {
      if (!Array.isArray(value) || value.length === 0) {
        parts.push("1 = 0");
        continue;
      }
      parts.push('"' + column + '" IN (' + value.map(() => "?").join(",") + ")");
      for (const item of value) params.push(serializeValue(table, column, item));
      continue;
    }

    if (op === "is") {
      if (value === null || value === "null") parts.push('"' + column + '" IS NULL');
      else parts.push('"' + column + '" IS NOT NULL');
      continue;
    }

    if (op === "contains") {
      if (!Array.isArray(value) || value.length === 0) {
        parts.push("1 = 1");
        continue;
      }
      for (const item of value) {
        parts.push('EXISTS (SELECT 1 FROM json_each("' + column + '") WHERE json_each.value = ?)');
        params.push(String(item));
      }
      continue;
    }

    const operators = { eq: "=", neq: "!=", gt: ">", gte: ">=", lt: "<", lte: "<=" };
    if (!operators[op]) throw new Error("Unsupported filter operator: " + op);
    parts.push('"' + column + '" ' + operators[op] + " ?");
    params.push(serializeValue(table, column, value));
  }
  return " WHERE " + parts.join(" AND ");
}

async function queryRows(env, body) {
  const table = body.table;
  tableSchema(table);
  const select = body.select || "*";
  const columns = select === "*"
    ? "*"
    : String(select).split(",").map((c) => c.trim()).filter(Boolean);

  if (columns !== "*") columns.forEach((c) => validateColumn(table, c));

  const params = [];
  let sql = 'SELECT ' + (columns === "*" ? "*" : columns.map((c) => '"' + c + '"').join(", "))
    + ' FROM "' + table + '"';

  sql += buildWhere(table, body.filters, params);

  if (body.order) {
    validateColumn(table, body.order.column);
    sql += ' ORDER BY "' + body.order.column + '" ' + (body.order.ascending === false ? "DESC" : "ASC");
  }

  if (Number.isFinite(body.limit)) {
    sql += " LIMIT " + Math.min(500, Math.max(0, Math.trunc(body.limit)));
  }

  const result = await env.DB.prepare(sql).bind(...params).all();
  const rows = (result.results || []).map((row) => hydrateRow(table, row));

  if (body.single === "single" && rows.length !== 1) {
    return apiError(rows.length === 0 ? "No rows found" : "Multiple rows returned", rows.length === 0 ? 404 : 400, "PGRST116");
  }
  return { data: body.single ? (rows[0] ?? null) : rows, error: null };
}

async function insertRows(env, body) {
  const table = body.table;
  tableSchema(table);
  const incoming = Array.isArray(body.data) ? body.data : [body.data];
  if (!incoming.length || incoming.some((row) => !row || typeof row !== "object")) {
    return apiError("Insert payload is empty");
  }

  const prepared = incoming.map((row) => {
    const clean = { ...row };
    if (!clean.id && Object.prototype.hasOwnProperty.call(TABLES[table], "id")) clean.id = crypto.randomUUID();
    const cols = cleanColumns(table, clean);
    if (!cols.length) throw new Error("No valid columns");
    return {
      clean,
      cols,
      values: cols.map((col) => serializeValue(table, col, clean[col]))
    };
  });

  const statements = prepared.map(({ cols, values }) => {
    const quoted = cols.map((c) => '"' + c + '"').join(", ");
    const marks = cols.map(() => "?").join(", ");
    if (body.action === "insert") {
      return env.DB.prepare('INSERT INTO "' + table + '" (' + quoted + ") VALUES (" + marks + ")").bind(...values);
    }

    const conflicts = Array.isArray(body.onConflict) ? body.onConflict : [body.onConflict || "id"];
    conflicts.forEach((column) => validateColumn(table, column));
    const conflictSet = new Set(conflicts);
    const updates = cols
      .filter((column) => !conflictSet.has(column))
      .map((column) => "\"" + column + "\" = excluded.\"" + column + "\"");
    const target = conflicts.map((column) => "\"" + column + "\"").join(", ");

    if (body.onConflictAction === "ignore") {
      return env.DB.prepare(
        'INSERT INTO "' + table + '" (' + quoted + ") VALUES (" + marks + ') ON CONFLICT (' + target + ') DO NOTHING'
      ).bind(...values);
    }

    if (!updates.length) throw new Error("Upsert has no fields to update");
    return env.DB.prepare(
      'INSERT INTO "' + table + '" (' + quoted + ") VALUES (" + marks + ') ON CONFLICT (' + target + ') DO UPDATE SET ' + updates.join(", ")
    ).bind(...values);
  });

  await env.DB.batch(statements);

  if (!body.returnRows) return { data: null, error: null };

  const ids = prepared.map((item) => item.clean.id).filter(Boolean);
  const params = [];
  const where = buildWhere(table, [{ column: "id", op: "in", value: ids }], params);
  const selected = await env.DB.prepare('SELECT * FROM "' + table + '"' + where).bind(...params).all();
  const rows = (selected.results || []).map((row) => hydrateRow(table, row));
  return { data: body.single ? (rows[0] ?? null) : rows, error: null };
}

async function updateRows(env, body) {
  const table = body.table;
  tableSchema(table);
  const data = body.data && typeof body.data === "object" ? body.data : {};
  const cols = cleanColumns(table, data);
  if (!cols.length) return apiError("Update payload is empty");

  const whereParams = [];
  const where = buildWhere(table, body.filters, whereParams);
  if (!where) return apiError("Refusing update without a filter", 400, "MISSING_FILTER");

  const values = cols.map((col) => serializeValue(table, col, data[col]));
  const sql = 'UPDATE "' + table + '" SET ' + cols.map((c) => '"' + c + '" = ?').join(", ") + where;
  await env.DB.prepare(sql).bind(...values, ...whereParams).run();

  if (!body.returnRows) return { data: null, error: null };
  const selected = await env.DB.prepare('SELECT * FROM "' + table + '"' + where).bind(...whereParams).all();
  const rows = (selected.results || []).map((row) => hydrateRow(table, row));
  if (body.single === "single" && rows.length !== 1) return apiError("Updated row not found", 404, "PGRST116");
  return { data: body.single ? (rows[0] ?? null) : rows, error: null };
}

async function deleteRows(env, body) {
  const table = body.table;
  tableSchema(table);
  const params = [];
  const where = buildWhere(table, body.filters, params);
  if (!where) return apiError("Refusing delete without a filter", 400, "MISSING_FILTER");
  await env.DB.prepare('DELETE FROM "' + table + '"' + where).bind(...params).run();
  return { data: null, error: null };
}

async function handleData(request, env) {
  try {
    const body = await request.json();
    if (body.action === "select") return json(await queryRows(env, body));
    if (body.action === "insert" || body.action === "upsert") return json(await insertRows(env, body));
    if (body.action === "update") return json(await updateRows(env, body));
    if (body.action === "delete") return json(await deleteRows(env, body));
    return json(apiError("Unsupported action"), 400);
  } catch (err) {
    const message = err?.message || "Database operation failed";
    const status = /Unknown columns|Invalid column|Unsupported action|Unsupported filter|payload|filter/i.test(message) ? 400 : 500;
    return json(apiError(message, status, status === 400 ? "INVALID_REQUEST" : "D1_ERROR"), status);
  }
}

function safeObjectPath(value) {
  const path = String(value || "").replace(/^\/+/, "");
  if (!path || path.includes("..") || path.includes("\\") || path.length > 900) throw new Error("Invalid object path");
  return path;
}

async function handleStorage(request, env, pathname) {
  const uploadPrefix = "/api/storage/";
  const mediaPrefix = "/api/media/";
  const isUpload = pathname.startsWith(uploadPrefix);
  const relative = pathname.slice((isUpload ? uploadPrefix : mediaPrefix).length);
  const parts = relative.split("/");
  const bucket = decodeURIComponent(parts.shift() || "");
  const path = safeObjectPath(parts.map(decodeURIComponent).join("/"));

  if (!BUCKETS.has(bucket)) return json(apiError("Unknown storage bucket", 404), 404);
  const key = bucket + "/" + path;
  if (new TextEncoder().encode(key).byteLength > 512) {
    return json(apiError("Media key exceeds the Cloudflare KV 512-byte key limit", 400, "MEDIA_KEY_TOO_LONG"), 400);
  }

  if (!env.MEDIA) return json(apiError("Media KV namespace is not configured", 503, "STORAGE_UNAVAILABLE"), 503);

  if (!isUpload && request.method === "GET") {
    const stored = await env.MEDIA.getWithMetadata(key, "arrayBuffer");
    if (!stored.value) return new Response("Not Found", { status: 404 });
    const headers = new Headers();
    for (const [name, value] of Object.entries(mediaSecurityHeaders())) headers.set(name, value);
    headers.set("content-type", resolveMediaContentType(stored.metadata?.contentType, path));
    if (stored.metadata?.etag) headers.set("etag", stored.metadata.etag);
    return new Response(stored.value, { status: 200, headers });
  }

  if (isUpload && (request.method === "POST" || request.method === "PUT")) {
    const form = await request.formData();
    const file = form.get("file");
    if (!(file instanceof File)) return json(apiError("Missing file"), 400);
    if (file.size > MAX_UPLOAD_BYTES) {
      return json(apiError("File exceeds the 20 MiB limit for free-tier KV media storage", 413, "UPLOAD_TOO_LARGE"), 413);
    }
    const contentType = safeUploadContentType(file);
    if (!contentType) return json(apiError("Active document content types are not accepted", 415, "UNSAFE_MEDIA_TYPE"), 415);

    await env.MEDIA.put(key, await file.arrayBuffer(), {
      metadata: { contentType, size: file.size, uploadedAt: new Date().toISOString() }
    });
    return json({ data: { path, bucket }, error: null });
  }

  if (isUpload && request.method === "DELETE") {
    await env.MEDIA.delete(key);
    return json({ data: null, error: null });
  }

  return json(apiError("Method not allowed", 405), 405);
}

async function handleAdminImport(request, env) {
  if (!env.IMPORT_SECRET || request.headers.get("X-Import-Secret") !== env.IMPORT_SECRET) {
    return json(apiError("Unauthorized", 401, "UNAUTHORIZED"), 401);
  }

  const url = new URL(request.url);

  if (url.pathname === "/api/admin/import/table" && request.method === "POST") {
    const body = await request.json();
    const table = body?.table;
    tableSchema(table);
    const rows = Array.isArray(body?.rows) ? body.rows : [];

    const conflict = table === "couple_members" ? ["couple_id", "user_id"] : "id";
    for (let i = 0; i < rows.length; i += 40) {
      await insertRows(env, {
        table,
        action: "upsert",
        data: rows.slice(i, i + 40),
        returnRows: false,
        onConflict: conflict,
        onConflictAction: body?.mode === "insert-if-missing" ? "ignore" : "update"
      });
    }

    return json({ ok: true, table, imported: rows.length });
  }

  if (url.pathname === "/api/admin/import/storage" && request.method === "POST") {
    const form = await request.formData();
    const bucket = String(form.get("bucket") || "");
    const path = safeObjectPath(form.get("path"));
    const file = form.get("file");

    if (!BUCKETS.has(bucket) || !(file instanceof File)) return json(apiError("Invalid storage upload"), 400);
    if (file.size > MAX_UPLOAD_BYTES) return json(apiError("File exceeds the 20 MiB limit for free-tier KV media storage", 413, "UPLOAD_TOO_LARGE"), 413);
    const contentType = safeUploadContentType(file);
    if (!contentType) return json(apiError("Active document content types are not accepted", 415, "UNSAFE_MEDIA_TYPE"), 415);
    if (!env.MEDIA) return json(apiError("Media KV namespace is not configured", 503, "STORAGE_UNAVAILABLE"), 503);

    const key = bucket + "/" + path;
    if (new TextEncoder().encode(key).byteLength > 512) {
      return json(apiError("Media key exceeds the Cloudflare KV 512-byte key limit", 400, "MEDIA_KEY_TOO_LONG"), 400);
    }
    await env.MEDIA.put(key, await file.arrayBuffer(), {
      metadata: { contentType, size: file.size, uploadedAt: new Date().toISOString() }
    });

    return json({ ok: true, bucket, path });
  }

  return json(apiError("Not found", 404), 404);
}

async function handleRecoveredAnniversary(request, env, pathname) {
  const match = pathname.match(new RegExp("^/api/recovered/anniversaries/([0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}\\.(?:jpg|jpeg|png|webp))$", "i"));
  if (!match) return json(apiError("Recovered media not found", 404, "MEDIA_NOT_FOUND"), 404);
  if (!env.MEDIA) return json(apiError("Media KV namespace is not configured", 503, "STORAGE_UNAVAILABLE"), 503);

  const requestedName = match[1];
  const candidates = [requestedName];
  const lowerName = requestedName.toLowerCase();
  if (lowerName.endsWith(".jpg")) candidates.push(requestedName.slice(0, -4) + ".webp");
  if (lowerName.endsWith(".webp")) candidates.push(requestedName.slice(0, -5) + ".jpg");

  for (const filename of candidates) {
    const stored = await env.MEDIA.getWithMetadata("photos/anniversaries/" + filename, "arrayBuffer");
    if (!stored.value) continue;
    const fallbackTypes = { jpg: "image/jpeg", jpeg: "image/jpeg", png: "image/png", webp: "image/webp" };
    const extension = filename.split(".").pop().toLowerCase();
    const headers = new Headers(mediaSecurityHeaders());
    if (stored.metadata?.etag) headers.set("etag", stored.metadata.etag);
    headers.set("content-type", resolveMediaContentType(stored.metadata?.contentType, filename) || fallbackTypes[extension] || "application/octet-stream");
    return new Response(stored.value, { status: 200, headers });
  }
  return json(apiError("Recovered media not found in KV", 404, "MEDIA_NOT_FOUND"), 404);
}

async function handleApi(request, env) {
  const url = new URL(request.url);

  if (url.pathname === "/api/health" && request.method === "GET") {
    const result = await env.DB.prepare("SELECT 1 AS ok").first();
    return json({ ok: result?.ok === 1, backend: "cloudflare-d1-kv" });
  }

  if (url.pathname === "/api/data" && request.method === "POST") return handleData(request, env);

  if (url.pathname.startsWith("/api/recovered/anniversaries/") && request.method === "GET") {
    return handleRecoveredAnniversary(request, env, url.pathname);
  }

  if (url.pathname.startsWith("/api/storage/") || url.pathname.startsWith("/api/media/")) {
    return handleStorage(request, env, url.pathname);
  }

  if (url.pathname.startsWith("/api/admin/import/")) return handleAdminImport(request, env);

  return json(apiError("Not found", 404), 404);
}

export default {
  async fetch(request, env) {
    if (!isCorsOriginAllowed(request, env.CORS_ORIGIN)) {
      return withCors(json(apiError("Origin not allowed", 403, "CORS_ORIGIN_DENIED"), 403), request, env);
    }

    if (request.method === "OPTIONS") return withCors(new Response(null, { status: 204 }), request, env);

    const url = new URL(request.url);
    if (url.pathname.startsWith("/api/")) {
      if (url.pathname !== "/api/health") {
        const identity = await verifyCloudflareAccess(request, env);
        if (!identity.ok) {
          const status = identity.status || 401;
          const message = status === 503 ? "Cloudflare Access authentication is not configured or unavailable" : "Authentication required or identity is not allowed";
          return withCors(json(apiError(message, status, identity.code || "UNAUTHORIZED"), status), request, env);
        }
        if (url.pathname.startsWith("/api/admin/import/") && !isAdminAccessIdentity(identity, env)) {
          return withCors(json(apiError("Administrator identity required", 403, "ADMIN_REQUIRED"), 403), request, env);
        }
      }
      try {
        return withCors(await handleApi(request, env), request, env);
      } catch (err) {
        return withCors(json(apiError(err?.message || "Internal server error", 500), 500), request, env);
      }
    }

    const assetResponse = await env.ASSETS.fetch(request);
    if (assetResponse.status !== 404) return assetResponse;

    if (request.method === "GET" || request.method === "HEAD") {
      const fallback = new URL(request.url);
      fallback.pathname = "/index.html";
      return env.ASSETS.fetch(new Request(fallback.toString(), request));
    }

    return assetResponse;
  }
};

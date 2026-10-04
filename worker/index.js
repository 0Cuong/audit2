const TABLES = {
  couple_profile: {
    id:"text", partner1_name:"text", partner1_avatar:"text", partner1_gender:"text",
    partner1_birthday:"date", partner2_name:"text", partner2_avatar:"text", partner2_gender:"text",
    partner2_birthday:"date", relationship_status:"text", relationship_start:"date",
    created_at:"text", updated_at:"text"
  },
  timeline_events: {
    id:"text", couple_id:"text", title:"text", date:"date", event_type:"text", story:"text",
    photos:"json", location:"text", mood:"text", tags:"json", sort_order:"number", from_partner:"text",
    description:"text", image_url:"text", category:"text", icon:"text", is_favorite:"boolean",
    created_at:"text", updated_at:"text"
  },
  memories: {
    id:"text", couple_id:"text", title:"text", category:"text", url:"text", description:"text",
    is_favorite:"boolean", is_pinned:"boolean", date:"date", tags:"json", collection_ids:"json",
    author_id:"text", author_name:"text", media_type:"text", context:"text", location:"json",
    metadata:"json", created_at:"text", updated_at:"text"
  },
  love_letters: {
    id:"text", couple_id:"text", title:"text", content:"text", from_partner:"text", to_partner:"text",
    is_draft:"boolean", is_locked:"boolean", scheduled_at:"text", is_future:"boolean",
    reaction:"text", created_at:"text", updated_at:"text", delivered_at:"text"
  },
  journal_entries: {
    id:"text", couple_id:"text", date:"date", content:"text", mood:"text", photos:"json",
    title:"text", content_html:"text", type:"text", time:"text", tags:"json",
    author_id:"text", author_name:"text", author:"text", location:"json", location_name:"text",
    is_favorite:"boolean", is_pinned:"boolean", metadata:"json",
    sender_name:"text", sender_avatar:"text", response_content:"text",
    response_sender_name:"text", response_sender_avatar:"text", response_date:"date",
    created_at:"text", updated_at:"text"
  },
  mood_entries: {
    id:"text", couple_id:"text", mood:"text", note:"text", partner:"text", date:"date",
    partner_id:"text", partner_name:"text", intensity:"number", created_at:"text", updated_at:"text"
  },
  bucket_list_items: {
    id:"text", couple_id:"text", title:"text", category:"text", description:"text",
    is_completed:"boolean", completed_at:"text", image_url:"text", from_partner:"text", created_at:"text", updated_at:"text"
  },
  anniversaries: {
    id:"text", couple_id:"text", title:"text", date:"date", anniversary_type:"text", type:"text",
    notes:"text", reminder_days:"number", recurrence:"text", photo_url:"text", created_at:"text", updated_at:"text"
  },
  map_locations: {
    id:"text", couple_id:"text", title:"text", description:"text", address:"text", latitude:"number",
    longitude:"number", location_type:"text", photos:"json", memory_id:"text", created_at:"text", updated_at:"text"
  },
  songs: {
    id:"text", couple_id:"text", title:"text", artist:"text", url:"text",
    is_favorite:"boolean", is_background:"boolean", artwork_url:"text", cover_url:"text", lyrics:"text", created_at:"text", updated_at:"text"
  },
  gifts: {
    id:"text", couple_id:"text", title:"text", description:"text", url:"text", image_url:"text",
    category:"text", occasion:"text", price_range:"text", is_received:"boolean",
    for_partner:"text", created_at:"text", updated_at:"text"
  },
  messages: {
    id:"text", couple_id:"text", content:"text", message_type:"text", is_pinned:"boolean",
    created_at:"text", updated_at:"text"
  },
  settings: {
    id:"text", couple_id:"text", language:"text", theme:"text", contact_links:"json",
    privacy_mode:"boolean", password_hash:"text", privacy_password:"text",
    notifications_enabled:"boolean", created_at:"text", updated_at:"text"
  },
  user_personalization: {
    id:"text", couple_id:"text", appearance:"json", background:"json", identity:"json",
    navigation:"json", active_workspace_id:"text", created_at:"text", updated_at:"text"
  },
  user_workspaces: {
    id:"text", couple_id:"text", name:"text", icon:"text", description:"text",
    is_default:"boolean", layout_mode:"text", blocks:"json", theme_override:"json",
    background_override:"json", navigation_override:"json", active_page_id:"text",
    created_at:"text", updated_at:"text"
  },
  user_custom_pages: {
    id:"text", couple_id:"text", workspace_id:"text", title:"text", slug:"text", icon:"text",
    description:"text", blocks:"json", is_default:"boolean", created_at:"text", updated_at:"text"
  },
  user_assets: {
    id:"text", couple_id:"text", name:"text", category:"text", url:"text", thumbnail:"text",
    size:"number", mime_type:"text", tags:"json", is_favorite:"boolean", created_at:"text"
  },
  user_saved_views: {
    id:"text", couple_id:"text", page_key:"text", name:"text", icon:"text", description:"text",
    filters:"json", sort_by:"text", sort_order:"text", display_mode:"text",
    is_default:"boolean", created_at:"text"
  },
  user_rules: {
    id:"text", couple_id:"text", name:"text", trigger:"text", condition:"json",
    action:"text", action_payload:"json", is_enabled:"boolean", created_at:"text"
  },
  user_presets: {
    id:"text", couple_id:"text", name:"text", description:"text", category:"text",
    author:"text", version:"text", preview_thumbnail:"text", tags:"json",
    appearance:"json", background:"json", navigation_style:"text",
    identity_decoration:"json", sample_blocks:"json", created_at:"text"
  },
  user_config_revisions: {
    id:"text", couple_id:"text", timestamp:"text", label:"text", snapshot:"json"
  },
  bucket_list_replies: {
    id:"text", created_at:"text", bucket_item_id:"text", content:"text", from_partner:"text"
  },
  couple_invites: {
    id:"text", couple_id:"text", email:"text", token:"text", created_by:"text",
    expires_at:"text", accepted_at:"text", created_at:"text"
  },
  couple_members: {
    couple_id:"text", user_id:"text", role:"text", created_at:"text"
  },
  listening_history: {
    id:"text", song_id:"text", played_at:"text"
  },
  love_letter_replies: {
    id:"text", letter_id:"text", content:"text", from_partner:"text", created_at:"text"
  },
  timeline_event_replies: {
    id:"number", event_id:"text", from_partner:"text", content:"text", created_at:"text"
  }
};

import { BUCKETS } from "./modules/storage-constants.js";


function json(data, status = 200, headers = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "content-type": "application/json; charset=UTF-8", ...headers }
  });
}

function corsHeaders(request, env) {
  const origin = request.headers.get("Origin");
  const configured = String(env.CORS_ORIGIN || "").trim();
  return {
    "Access-Control-Allow-Origin": configured && configured !== "*" ? configured : (origin || "*"),
    "Access-Control-Allow-Methods": "GET,POST,PATCH,DELETE,OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, X-Import-Secret, X-Audit2-Key",
    "Access-Control-Max-Age": "86400"
  };
}

function withCors(response, request, env) {
  const headers = new Headers(response.headers);
  for (const [key, value] of Object.entries(corsHeaders(request, env))) headers.set(key, value);
  headers.set("Vary", "Origin");
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
  if (type === "boolean") return value ? 1 : 0;
  if (type === "number") return Number(value);
  return String(value);
}

function deserializeValue(table, column, value) {
  const type = TABLES[table][column];
  if (value === undefined || value === null) return value ?? null;
  if (type === "json") {
    try { return JSON.parse(value); } catch { return type === "json" ? [] : value; }
  }
  if (type === "boolean") return value === true || value === 1 || value === "1";
  if (type === "number") return Number(value);
  return value;
}

function hydrateRow(table, row) {
  const schema = tableSchema(table);
  const output = {};
  for (const key of Object.keys(row)) {
    output[key] = schema[key] ? deserializeValue(table, key, row[key]) : row[key];
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
    sql += " LIMIT " + Math.max(0, Math.trunc(body.limit));
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

  if (!isUpload && request.method === "GET") {
    const object = await env.MEDIA.get(key);
    if (!object) return new Response("Not Found", { status: 404 });
    const headers = new Headers();
    headers.set("etag", object.httpEtag || object.etag || "");
    headers.set("cache-control", "public, max-age=31536000, immutable");
    headers.set("content-type", object.httpMetadata?.contentType || "application/octet-stream");
    return new Response(object.body, { status: 200, headers });
  }

  if (isUpload && (request.method === "POST" || request.method === "PUT")) {
    const form = await request.formData();
    const file = form.get("file");
    if (!(file instanceof File)) return json(apiError("Missing file"), 400);
    await env.MEDIA.put(key, file.stream(), {
      httpMetadata: {
        contentType: file.type || "application/octet-stream",
        cacheControl: "public, max-age=31536000, immutable"
      }
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

    await env.MEDIA.put(bucket + "/" + path, file.stream(), {
      httpMetadata: {
        contentType: file.type || "application/octet-stream",
        cacheControl: "public, max-age=31536000, immutable"
      }
    });

    return json({ ok: true, bucket, path });
  }

  return json(apiError("Not found", 404), 404);
}

async function handleApi(request, env) {
  const url = new URL(request.url);

  if (url.pathname === "/api/health" && request.method === "GET") {
    const result = await env.DB.prepare("SELECT 1 AS ok").first();
    return json({ ok: result?.ok === 1, backend: "cloudflare-d1-r2" });
  }

  if (url.pathname === "/api/data" && request.method === "POST") return handleData(request, env);

  if (url.pathname.startsWith("/api/storage/") || url.pathname.startsWith("/api/media/")) {
    return handleStorage(request, env, url.pathname);
  }

  if (url.pathname.startsWith("/api/admin/import/")) return handleAdminImport(request, env);

  return json(apiError("Not found", 404), 404);
}

export default {
  async fetch(request, env) {
    if (request.method === "OPTIONS") return withCors(new Response(null, { status: 204 }), request, env);

    const url = new URL(request.url);
    if (url.pathname.startsWith("/api/")) {
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

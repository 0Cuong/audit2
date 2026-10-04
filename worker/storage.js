import { BUCKETS } from "./schema.js";

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

export { handleStorage };
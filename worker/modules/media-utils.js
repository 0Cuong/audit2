const LEGACY_SUPABASE_PUBLIC_PREFIX = "https://recpvczpwybpbbntwnnk.supabase.co/storage/v1/object/public/";

const MIME_BY_EXTENSION = Object.freeze({
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  jpe: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
  gif: "image/gif",
  avif: "image/avif",
  bmp: "image/bmp",
  ico: "image/x-icon",
  mp3: "audio/mpeg",
  m4a: "audio/mp4",
  wav: "audio/wav",
  ogg: "audio/ogg",
  opus: "audio/ogg",
  mp4: "video/mp4",
  webm: "video/webm",
  mov: "video/quicktime"
});

export function normalizeMediaReferences(value) {
  if (typeof value === "string") {
    if (value.startsWith(LEGACY_SUPABASE_PUBLIC_PREFIX)) {
      return "/api/media/" + value.slice(LEGACY_SUPABASE_PUBLIC_PREFIX.length);
    }
    return value;
  }
  if (Array.isArray(value)) return value.map(normalizeMediaReferences);
  if (value && typeof value === "object") {
    return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, normalizeMediaReferences(item)]));
  }
  return value;
}

export function inferMediaContentType(objectPath) {
  const cleanPath = String(objectPath ?? "").split(/[?#]/, 1)[0];
  const match = cleanPath.match(/\.([a-z0-9]+)$/i);
  if (!match) return null;
  return MIME_BY_EXTENSION[match[1].toLowerCase()] || null;
}

export function resolveMediaContentType(storedContentType, objectPath) {
  const storedType = String(storedContentType ?? "").split(";")[0].trim().toLowerCase();
  if (!storedType || storedType === "application/octet-stream") {
    return inferMediaContentType(objectPath) || "application/octet-stream";
  }
  return storedType;
}

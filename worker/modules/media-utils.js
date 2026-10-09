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

function toBytes(value) {
  if (value instanceof ArrayBuffer) return new Uint8Array(value);
  if (ArrayBuffer.isView(value)) return new Uint8Array(value.buffer, value.byteOffset, value.byteLength);
  return null;
}

/**
 * Detect common passive media payloads by their signatures. This corrects
 * mislabeled legacy files, including a recovered WebP payload named .jpg.
 * Active document types such as HTML, JavaScript and SVG are never inferred.
 */
export function detectMediaContentTypeFromBytes(value) {
  const bytes = toBytes(value);
  if (!bytes || bytes.length < 4) return null;

  const ascii = (start, length) => String.fromCharCode(...bytes.slice(start, start + length));
  if (bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return "image/jpeg";
  if (bytes.length >= 8 && bytes[0] === 0x89 && ascii(1, 3) === "PNG" &&
      bytes[4] === 0x0d && bytes[5] === 0x0a && bytes[6] === 0x1a && bytes[7] === 0x0a) return "image/png";
  if (bytes.length >= 6 && ["GIF87a", "GIF89a"].includes(ascii(0, 6))) return "image/gif";
  if (ascii(0, 2) === "BM") return "image/bmp";
  if (bytes[0] === 0x00 && bytes[1] === 0x00 && bytes[2] === 0x01 && bytes[3] === 0x00) return "image/x-icon";
  if (bytes.length >= 12 && ascii(0, 4) === "RIFF" && ascii(8, 4) === "WEBP") return "image/webp";
  if (bytes.length >= 12 && ascii(4, 4) === "ftyp" && ["avif", "avis"].includes(ascii(8, 4))) return "image/avif";
  if (bytes.length >= 12 && ascii(4, 4) === "ftyp" && ["heic", "heix", "hevc", "hevx", "mif1", "msf1"].includes(ascii(8, 4))) return "image/heic";
  if (bytes.length >= 4 && bytes[0] === 0x1a && bytes[1] === 0x45 && bytes[2] === 0xdf && bytes[3] === 0xa3) return "video/webm";
  if (bytes.length >= 8 && ascii(4, 4) === "ftyp") return "video/mp4";
  if (ascii(0, 4) === "OggS") return "audio/ogg";
  if (ascii(0, 3) === "ID3") return "audio/mpeg";
  return null;
}

export function resolveMediaContentType(storedContentType, objectPath, bytes) {
  const detectedType = detectMediaContentTypeFromBytes(bytes);
  if (detectedType) return detectedType;

  const storedType = String(storedContentType ?? "").split(";")[0].trim().toLowerCase();
  if (!storedType || storedType === "application/octet-stream") {
    return inferMediaContentType(objectPath) || "application/octet-stream";
  }
  return storedType;
}

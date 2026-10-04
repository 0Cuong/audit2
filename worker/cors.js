const DEFAULT_ALLOWED_HEADERS = "Content-Type, Authorization, X-Import-Secret, X-Audit2-Key";
const DEFAULT_ALLOWED_METHODS = "GET,POST,PATCH,DELETE,OPTIONS";

function parseAllowedOrigins(value) {
  return new Set(
    String(value ?? "")
      .split(",")
      .map((origin) => origin.trim())
      .filter((origin) => origin && origin !== "*")
  );
}

function getRequestOrigin(request) {
  try {
    return new URL(request.url).origin;
  } catch {
    return "";
  }
}

export function isCorsOriginAllowed(request, configuredOrigins) {
  const origin = request.headers.get("Origin");
  if (!origin) return true;
  if (origin === getRequestOrigin(request)) return true;
  return parseAllowedOrigins(configuredOrigins).has(origin);
}

export function buildCorsHeaders(request, configuredOrigins) {
  const headers = {
    "Access-Control-Allow-Methods": DEFAULT_ALLOWED_METHODS,
    "Access-Control-Allow-Headers": DEFAULT_ALLOWED_HEADERS,
    "Access-Control-Max-Age": "86400",
    "Vary": "Origin",
  };

  const origin = request.headers.get("Origin");
  if (origin && isCorsOriginAllowed(request, configuredOrigins) && origin !== getRequestOrigin(request)) {
    headers["Access-Control-Allow-Origin"] = origin;
  }

  return headers;
}

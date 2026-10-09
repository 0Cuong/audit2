const JWKS_CACHE_TTL_MS = 5 * 60 * 1000;
const jwksCache = new Map();
const CLOCK_SKEW_SECONDS = 60;

function parseList(value) {
  return new Set(String(value ?? "").split(",").map((item) => item.trim().toLowerCase()).filter(Boolean));
}

function getTeamIssuer(value) {
  const raw = String(value ?? "").trim();
  if (!raw) return null;
  try {
    const url = new URL(raw.includes("://") ? raw : "https://" + raw);
    if (url.protocol !== "https:" || !url.hostname.toLowerCase().endsWith(".cloudflareaccess.com") || url.pathname !== "/" || url.search || url.hash || url.username || url.password) return null;
    return url.origin;
  } catch { return null; }
}

function decodeBase64Url(value) {
  const normalized = value.replace(/-/g, "+").replace(/_/g, "/");
  const padded = normalized + "=".repeat((4 - normalized.length % 4) % 4);
  const binary = atob(padded);
  return Uint8Array.from(binary, (character) => character.charCodeAt(0));
}

function decodeJsonSegment(segment) {
  return JSON.parse(new TextDecoder().decode(decodeBase64Url(segment)));
}

async function loadJwks(issuer, forceRefresh = false) {
  const cached = jwksCache.get(issuer);
  if (!forceRefresh && cached && cached.expiresAt > Date.now()) return cached.keys;
  const response = await fetch(issuer + "/cdn-cgi/access/certs", { headers: { Accept: "application/json" } });
  if (!response.ok) throw new Error("Cloudflare Access JWKS request failed");
  const body = await response.json();
  if (!body || !Array.isArray(body.keys)) throw new Error("Cloudflare Access JWKS response is invalid");
  jwksCache.set(issuer, { keys: body.keys, expiresAt: Date.now() + JWKS_CACHE_TTL_MS });
  return body.keys;
}

function audienceMatches(value, expected) {
  const actual = Array.isArray(value) ? value : [value];
  return actual.some((item) => typeof item === "string" && item === expected);
}

function denied(status, code) { return { ok: false, status, code }; }

export async function verifyCloudflareAccess(request, env) {
  const issuer = getTeamIssuer(env?.ACCESS_TEAM_DOMAIN);
  const audience = String(env?.ACCESS_AUD ?? "").trim();
  const allowedEmails = parseList(env?.ACCESS_ALLOWED_EMAILS);
  const allowedServices = parseList(env?.ACCESS_ALLOWED_SERVICE_NAMES);
  if (!issuer || !audience || (allowedEmails.size === 0 && allowedServices.size === 0)) return denied(503, "AUTH_NOT_CONFIGURED");

  const token = request.headers.get("cf-access-jwt-assertion");
  if (!token) return denied(401, "MISSING_ACCESS_TOKEN");
  const parts = token.split(".");
  if (parts.length !== 3 || parts.some((part) => !part)) return denied(401, "INVALID_ACCESS_TOKEN");

  let header, claims, signature;
  try {
    header = decodeJsonSegment(parts[0]);
    claims = decodeJsonSegment(parts[1]);
    signature = decodeBase64Url(parts[2]);
  } catch { return denied(401, "INVALID_ACCESS_TOKEN"); }
  if (header?.alg !== "RS256" || typeof header?.kid !== "string" || !header.kid) return denied(401, "INVALID_ACCESS_TOKEN");

  let jwk;
  try {
    let keys = await loadJwks(issuer);
    jwk = keys.find((key) => key?.kid === header.kid && key?.kty === "RSA" && key?.use !== "enc");
    if (!jwk) {
      keys = await loadJwks(issuer, true);
      jwk = keys.find((key) => key?.kid === header.kid && key?.kty === "RSA" && key?.use !== "enc");
    }
  } catch { return denied(503, "ACCESS_IDENTITY_PROVIDER_UNAVAILABLE"); }
  if (!jwk) return denied(401, "INVALID_ACCESS_TOKEN");

  let signatureValid = false;
  try {
    const key = await crypto.subtle.importKey("jwk", jwk, { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" }, false, ["verify"]);
    const signingInput = new TextEncoder().encode(parts[0] + "." + parts[1]);
    signatureValid = await crypto.subtle.verify({ name: "RSASSA-PKCS1-v1_5" }, key, signature, signingInput);
  } catch { return denied(401, "INVALID_ACCESS_TOKEN"); }
  if (!signatureValid) return denied(401, "INVALID_ACCESS_TOKEN");

  const now = Math.floor(Date.now() / 1000);
  if (claims?.iss !== issuer || !audienceMatches(claims?.aud, audience) || !Number.isFinite(claims?.exp) || claims.exp <= now - CLOCK_SKEW_SECONDS || (claims.nbf !== undefined && (!Number.isFinite(claims.nbf) || claims.nbf > now + CLOCK_SKEW_SECONDS))) {
    return denied(401, "INVALID_ACCESS_TOKEN");
  }

  const email = typeof claims.email === "string" ? claims.email.trim().toLowerCase() : "";
  const commonName = typeof claims.common_name === "string" ? claims.common_name.trim().toLowerCase() : "";
  const isAllowedUser = Boolean(email && allowedEmails.has(email));
  const isAllowedService = Boolean(commonName && allowedServices.has(commonName));
  if (!isAllowedUser && !isAllowedService) return denied(403, "IDENTITY_NOT_ALLOWED");
  return { ok: true, email: email || null, commonName: commonName || null, isServiceToken: isAllowedService && !isAllowedUser };
}

export function isAdminAccessIdentity(identity, env) {
  if (!identity?.ok) return false;
  if (identity.isServiceToken) return true;
  const admins = parseList(env?.ACCESS_ADMIN_EMAILS);
  return Boolean(identity.email && admins.has(identity.email.toLowerCase()));
}

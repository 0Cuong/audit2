import test from "node:test";
import assert from "node:assert/strict";
import { buildCorsHeaders, isCorsOriginAllowed } from "./cors.js";

function request(url, origin) {
  return new Request(url, origin ? { headers: { Origin: origin } } : undefined);
}

test("same-origin requests are allowed without CORS configuration", () => {
  const req = request("https://app.example.test/api/data", "https://app.example.test");
  assert.equal(isCorsOriginAllowed(req, ""), true);
  const headers = buildCorsHeaders(req, "");
  assert.equal(headers["Access-Control-Allow-Origin"], undefined);
});

test("configured cross-origin is allowed exactly", () => {
  const req = request("https://api.example.test/api/data", "https://app.example.test");
  assert.equal(isCorsOriginAllowed(req, "https://app.example.test"), true);
  const headers = buildCorsHeaders(req, "https://app.example.test, https://admin.example.test");
  assert.equal(headers["Access-Control-Allow-Origin"], "https://app.example.test");
  assert.equal(headers["Vary"], "Origin");
});

test("unconfigured cross-origin is rejected", () => {
  const req = request("https://api.example.test/api/data", "https://evil.example.test");
  assert.equal(isCorsOriginAllowed(req, "https://app.example.test"), false);
  const headers = buildCorsHeaders(req, "https://app.example.test");
  assert.equal(headers["Access-Control-Allow-Origin"], undefined);
});

test("wildcard configuration does not become an arbitrary-origin allowlist", () => {
  const req = request("https://api.example.test/api/data", "https://evil.example.test");
  assert.equal(isCorsOriginAllowed(req, "*"), false);
});

test("preflight headers include Authorization for future bearer auth", () => {
  const req = request("https://api.example.test/api/data", "https://app.example.test");
  const headers = buildCorsHeaders(req, "https://app.example.test");
  assert.match(headers["Access-Control-Allow-Headers"], /Authorization/);
});

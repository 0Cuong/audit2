import test from "node:test";
import assert from "node:assert/strict";
import worker from "./index.js";

function makeEnv(overrides = {}) {
  return {
    CORS_ORIGIN: "",
    DB: { prepare() { return { first: async () => ({ ok: 1 }), all: async () => ({ results: [] }), bind() { return this; }, run: async () => ({ success: true }) }; } },
    ASSETS: { fetch: async () => new Response("asset", { status: 200 }) },
    ...overrides
  };
}

test("data API fails closed when Cloudflare Access is not configured", async () => {
  const request = new Request("https://audit2.example.com/api/data", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ action: "select", table: "memories" }) });
  const response = await worker.fetch(request, makeEnv());
  assert.equal(response.status, 503);
  assert.equal((await response.json()).error.code, "AUTH_NOT_CONFIGURED");
});

test("data API rejects a missing Access JWT when configuration exists", async () => {
  const request = new Request("https://audit2.example.com/api/data", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ action: "select", table: "memories" }) });
  const response = await worker.fetch(request, makeEnv({ ACCESS_TEAM_DOMAIN: "audit2-test.cloudflareaccess.com", ACCESS_AUD: "expected-audience", ACCESS_ALLOWED_EMAILS: "cuong@example.com" }));
  assert.equal(response.status, 401);
  assert.equal((await response.json()).error.code, "MISSING_ACCESS_TOKEN");
});

test("health endpoint remains available for non-sensitive deployment probes", async () => {
  const response = await worker.fetch(new Request("https://audit2.example.com/api/health"), makeEnv());
  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), { ok: true, backend: "cloudflare-d1-r2" });
});

import test from "node:test";
import assert from "node:assert/strict";
import { webcrypto } from "node:crypto";
import { verifyCloudflareAccess } from "./access-auth.js";

if (!globalThis.crypto) globalThis.crypto = webcrypto;
let hostCounter = 0;
const jsonSegment = (value) => Buffer.from(JSON.stringify(value)).toString("base64url");

async function createFixture(overrides = {}, options = {}) {
  const host = "audit2-test-" + (++hostCounter) + ".cloudflareaccess.com";
  const issuer = "https://" + host;
  const audience = "test-audience";
  const pair = await crypto.subtle.generateKey({ name: "RSASSA-PKCS1-v1_5", modulusLength: 2048, publicExponent: new Uint8Array([1, 0, 1]), hash: "SHA-256" }, true, ["sign", "verify"]);
  const publicJwk = await crypto.subtle.exportKey("jwk", pair.publicKey);
  Object.assign(publicJwk, { kid: "test-key", use: "sig", alg: "RS256" });
  const now = Math.floor(Date.now() / 1000);
  const header = { alg: "RS256", typ: "JWT", kid: "test-key" };
  const claims = { iss: issuer, aud: [audience], email: "cuong@example.com", exp: now + 300, nbf: now - 1, ...overrides };
  const input = jsonSegment(header) + "." + jsonSegment(claims);
  const signingKey = options.wrongSignature
    ? await crypto.subtle.generateKey({ name: "RSASSA-PKCS1-v1_5", modulusLength: 2048, publicExponent: new Uint8Array([1, 0, 1]), hash: "SHA-256" }, true, ["sign", "verify"])
    : pair;
  const signature = await crypto.subtle.sign({ name: "RSASSA-PKCS1-v1_5" }, signingKey.privateKey, new TextEncoder().encode(input));
  const token = input + "." + Buffer.from(signature).toString("base64url");
  const env = { ACCESS_TEAM_DOMAIN: issuer, ACCESS_AUD: audience, ACCESS_ALLOWED_EMAILS: "cuong@example.com,nghi@example.com", ACCESS_ALLOWED_SERVICE_NAMES: "migration-client.access" };
  const request = new Request("https://audit2.example.com/api/data", { method: "POST", headers: { "cf-access-jwt-assertion": token } });
  return { env, request, publicJwk, issuer };
}

test("Access authentication fails closed when configuration is missing", async () => {
  const result = await verifyCloudflareAccess(new Request("https://audit2.example.com/api/data"), {});
  assert.deepEqual(result, { ok: false, status: 503, code: "AUTH_NOT_CONFIGURED" });
});

test("Access authentication rejects a missing JWT", async () => {
  const fixture = await createFixture();
  const result = await verifyCloudflareAccess(new Request("https://audit2.example.com/api/data"), fixture.env);
  assert.equal(result.ok, false);
  assert.equal(result.status, 401);
});

test("Access authentication verifies signature, issuer, audience and allow-listed email", async (t) => {
  const fixture = await createFixture();
  const previousFetch = globalThis.fetch;
  globalThis.fetch = async (input) => {
    assert.equal(String(input), fixture.issuer + "/cdn-cgi/access/certs");
    return new Response(JSON.stringify({ keys: [fixture.publicJwk] }), { status: 200, headers: { "content-type": "application/json" } });
  };
  t.after(() => { globalThis.fetch = previousFetch; });
  const result = await verifyCloudflareAccess(fixture.request, fixture.env);
  assert.equal(result.ok, true);
  assert.equal(result.email, "cuong@example.com");
  assert.equal(result.isServiceToken, false);
});

test("Access authentication rejects an invalid signature", async (t) => {
  const fixture = await createFixture({}, { wrongSignature: true });
  const previousFetch = globalThis.fetch;
  globalThis.fetch = async () => new Response(JSON.stringify({ keys: [fixture.publicJwk] }), { status: 200 });
  t.after(() => { globalThis.fetch = previousFetch; });
  const result = await verifyCloudflareAccess(fixture.request, fixture.env);
  assert.equal(result.ok, false);
  assert.equal(result.status, 401);
});

test("Access authentication supports explicitly allow-listed service tokens", async (t) => {
  const fixture = await createFixture({ email: undefined, sub: "", common_name: "migration-client.access" });
  const previousFetch = globalThis.fetch;
  globalThis.fetch = async () => new Response(JSON.stringify({ keys: [fixture.publicJwk] }), { status: 200 });
  t.after(() => { globalThis.fetch = previousFetch; });
  const result = await verifyCloudflareAccess(fixture.request, fixture.env);
  assert.equal(result.ok, true);
  assert.equal(result.isServiceToken, true);
  assert.equal(result.commonName, "migration-client.access");
});

test("Access authentication rejects a disallowed email and wrong audience", async (t) => {
  const fixture = await createFixture({ email: "intruder@example.com", aud: ["another-app"] });
  const previousFetch = globalThis.fetch;
  globalThis.fetch = async () => new Response(JSON.stringify({ keys: [fixture.publicJwk] }), { status: 200 });
  t.after(() => { globalThis.fetch = previousFetch; });
  const result = await verifyCloudflareAccess(fixture.request, fixture.env);
  assert.equal(result.ok, false);
  assert.equal(result.status, 401);
});

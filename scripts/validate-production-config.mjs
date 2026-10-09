import fs from "node:fs";

const config = JSON.parse(fs.readFileSync(new URL("../wrangler.json", import.meta.url), "utf8"));
const database = config.d1_databases?.find((item) => item.binding === "DB");
const errors = [];
if (!database || !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(database.database_id || "")) errors.push("wrangler.json must contain the authoritative D1 database UUID for binding DB");
if (!database || !database.database_name || database.database_name === "my-db-name") errors.push("wrangler.json must contain the real Cloudflare D1 database name");
const required = ["CLOUDFLARE_ACCOUNT_ID", "CLOUDFLARE_API_TOKEN", "ACCESS_TEAM_DOMAIN", "ACCESS_AUD", "ACCESS_ALLOWED_EMAILS", "ACCESS_ADMIN_EMAILS", "ACCESS_ALLOWED_SERVICE_NAMES", "CF_ACCESS_CLIENT_ID", "CF_ACCESS_CLIENT_SECRET", "IMPORT_SECRET"];
for (const key of required) if (!String(process.env[key] || "").trim()) errors.push("Missing required deployment secret: " + key);
function csv(value) { return String(value || "").split(",").map((item) => item.trim().toLowerCase()).filter(Boolean); }
const emails = csv(process.env.ACCESS_ALLOWED_EMAILS);
const admins = csv(process.env.ACCESS_ADMIN_EMAILS);
const services = csv(process.env.ACCESS_ALLOWED_SERVICE_NAMES);
if (!emails.length) errors.push("ACCESS_ALLOWED_EMAILS must contain at least one permitted user email");
if (!admins.length || admins.some((email) => !emails.includes(email))) errors.push("ACCESS_ADMIN_EMAILS must be a non-empty subset of ACCESS_ALLOWED_EMAILS");
if (!services.includes(String(process.env.CF_ACCESS_CLIENT_ID || "").trim().toLowerCase())) errors.push("ACCESS_ALLOWED_SERVICE_NAMES must include the configured Cloudflare Access service-token client ID");
if (String(process.env.IMPORT_SECRET || "").length < 32) errors.push("IMPORT_SECRET must be at least 32 characters");
try {
  const raw = String(process.env.ACCESS_TEAM_DOMAIN || "").trim();
  const url = new URL(raw.includes("://") ? raw : "https://" + raw);
  if (url.protocol !== "https:" || !url.hostname.toLowerCase().endsWith(".cloudflareaccess.com") || url.pathname !== "/" || url.search || url.hash) errors.push("ACCESS_TEAM_DOMAIN must be the HTTPS Cloudflare Access team domain");
} catch { errors.push("ACCESS_TEAM_DOMAIN must be the HTTPS Cloudflare Access team domain"); }
if (errors.length) { console.error("Production configuration is incomplete:"); for (const error of errors) console.error("- " + error); process.exit(1); }
console.log("Production configuration passed structural validation. No secret values were printed.");

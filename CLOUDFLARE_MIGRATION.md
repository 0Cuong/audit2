# audit2 — Cloudflare D1 + R2 migration

Runtime: React/Vite -> Worker Assets; application data -> D1; media -> R2; browser data access -> compatibility adapter.

Required deployment secrets: CLOUDFLARE_API_TOKEN and CLOUDFLARE_ACCOUNT_ID.
Before deployment: create audit2-db, create audit2-media, and replace REPLACE_WITH_D1_DATABASE_ID in wrangler.json only with the authoritative production D1 database ID. `CORS_ORIGIN` is an explicit comma-separated allowlist; keep it empty for same-origin Worker Assets or set exact trusted origins for cross-origin clients. Never use `*`.

## Supabase recovery

Keep the original Supabase project intact until cutover is verified.

    $env:SUPABASE_URL="https://YOUR_PROJECT.supabase.co"
    $env:SUPABASE_ANON_KEY="YOUR_ANON_OR_SERVICE_KEY"
    $env:TARGET_API_URL="https://YOUR_WORKER_DOMAIN"
    $env:IMPORT_SECRET="A_LONG_RANDOM_SECRET"
    node scripts/migrate-supabase-to-cloudflare.mjs

The migration script reads all 21 application tables plus avatars, memories, photos, and assets. It first checks the target health endpoint and stops on read/import errors.

## Verification

- GET /api/health returns ok=true.
- Requests from unconfigured browser origins are rejected with `403 CORS_ORIGIN_DENIED`; same-origin requests remain valid.
- Configure application authentication and tenant isolation before production exposure.
- Major pages load after refresh.
- Representative reads/writes succeed.
- Representative R2 objects open.
- Source and target row/object counts match.

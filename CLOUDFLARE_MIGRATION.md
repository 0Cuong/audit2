# audit2 — Cloudflare D1 + R2 migration

Runtime: React/Vite -> Worker Assets; application data -> D1; media -> R2; browser data access -> compatibility adapter.

Required deployment secrets: CLOUDFLARE_API_TOKEN and CLOUDFLARE_ACCOUNT_ID.
Before deployment: verify the existing production D1 and R2 resources, and replace REPLACE_WITH_AUTHORITATIVE_D1_DATABASE_ID in wrangler.json only with the authoritative ID from Cloudflare. Do not guess a D1 ID. Configure a Cloudflare Access application for the entire app hostname and its allow/service-auth policies. CORS is not authentication and must never be treated as an authorization boundary.

## Supabase recovery

Keep the original Supabase project intact until cutover is verified.

    $env:SUPABASE_URL="https://YOUR_PROJECT.supabase.co"
    $env:SUPABASE_ANON_KEY="YOUR_ANON_OR_SERVICE_KEY"
    $env:TARGET_API_URL="https://YOUR_WORKER_DOMAIN"
    $env:IMPORT_SECRET="A_LONG_RANDOM_SECRET"
    node scripts/migrate-supabase-to-cloudflare.mjs

The migration script reads all 21 application tables plus avatars, memories, photos, and assets. It requires the Cloudflare Access service-token pair CF_ACCESS_CLIENT_ID/CF_ACCESS_CLIENT_SECRET as well as IMPORT_SECRET. It checks the target health endpoint and stops on read/import errors.

## Verification

- GET /api/health returns ok=true.
- Requests from unconfigured browser origins are rejected with `403 CORS_ORIGIN_DENIED`; same-origin requests remain valid.
- Configure application authentication and tenant isolation before production exposure.
- Major pages load after refresh.
- Representative reads/writes succeed.
- Representative R2 objects open.
- Source and target row/object counts match.


## Security hardening added 2026-10-09

All non-health API routes validate the Cloudflare Access JWT signature, issuer, audience, expiry and allow-listed principal inside the Worker. Configure runtime secrets ACCESS_TEAM_DOMAIN, ACCESS_AUD, ACCESS_ALLOWED_EMAILS, ACCESS_ADMIN_EMAILS, ACCESS_ALLOWED_SERVICE_NAMES and IMPORT_SECRET. The manual GitHub deployment workflow validates its required repository secrets before it runs migrations, and syncs the runtime secrets without logging their values. It will intentionally stop until an authoritative D1 database UUID and all required secrets are configured.

The application is one shared couple workspace: allow-listed email identities can access the same data. This is not multi-tenant authorization. R2 uploads are restricted to 50 MiB and reject active document MIME types; media uses private no-store cache headers. Recovered anniversary images are served from the photos/anniversaries prefix in R2, but the original image bytes must still be recovered and uploaded.

IMPORTANT: the public repository previously contained 44 rows of personal recovered data inside migrations/0004_seed_recovered.sql. The checked-in migration is now a no-op and the exporter writes local seed SQL under recovered/private/seed-recovered.local.sql, which is ignored by Git. This does not remove data from previous commits or copies. Follow docs/SECURITY_RECOVERY.md to protect the repository and purge the exposed history.

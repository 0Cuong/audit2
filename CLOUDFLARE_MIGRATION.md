# audit2 — Cloudflare D1 + R2

Supabase runtime integration has been replaced with a compatibility adapter backed by a Cloudflare Worker.

## Architecture

- Vite/React frontend -> Cloudflare Worker Assets
- SQL data -> Cloudflare D1
- uploads/public media -> Cloudflare R2
- existing pages/repositories remain intact through `src/lib/supabase.ts`
- `scripts/migrate-supabase-to-cloudflare.mjs` copies existing Supabase rows and Storage objects

## One-time Cloudflare setup

1. Create a D1 database named `audit2-db`.
2. Create an R2 bucket named `audit2-media`.
3. Put the D1 database ID into `wrangler.json` as `database_id`.
4. Create a Cloudflare API token with Workers Scripts, Workers Routes, D1 edit, R2 edit and Account Settings read permissions for this account.
5. Add GitHub repository secrets:
   - `CLOUDFLARE_API_TOKEN`
   - `CLOUDFLARE_ACCOUNT_ID`
6. Run the workflow `Deploy audit2 to Cloudflare`.

## Local setup

Install dependencies and run the Vite app normally. For local Worker development, use Wrangler after configuring the D1/R2 bindings.

## Data migration

Do not delete or pause the old Supabase project before migration is verified.

From a machine with Node 20+:

```powershell
$env:SUPABASE_URL="https://YOUR_PROJECT.supabase.co"
$env:SUPABASE_ANON_KEY="YOUR_ANON_OR_SERVICE_KEY"
$env:TARGET_API_URL="https://YOUR_WORKER_DOMAIN"
$env:IMPORT_SECRET="A_LONG_RANDOM_SECRET"
node scripts/migrate-supabase-to-cloudflare.mjs
```

For a large media library you can temporarily set:

```powershell
$env:SKIP_STORAGE="1"
```

The migration script imports all application tables and the `avatars`, `memories`, `photos`, and `assets` storage buckets.

## Important

The old Supabase dependency remains in package-lock for a safe transition, but the application no longer imports or calls Supabase at runtime. Remove it later with `npm uninstall @supabase/supabase-js` once the Cloudflare deployment is verified.

The Worker import endpoint is protected by `IMPORT_SECRET`; configure it as a Cloudflare Worker secret before using the migration script.

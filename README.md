# CUONGISME

CUONGISME is a Vite + React + TypeScript relationship and memory web app with a recovery-first local mode and a Cloudflare D1/KV production path.

## Development

```bash
npm install
npm run typecheck
npm run lint
npm run build
npm run skills:check
npm run dev
```

Use `npm run dev:vite` to run Vite directly. The default `npm run dev` starts the local recovery server so recovered data and media can be inspected together.

## Agent workflow

This repository contains a portable `skills/` catalog plus `AGENTS.md`.

```bash
npm run skills:check
npm run skills:route -- "audit this React page and verify accessibility"
```

Skills are intentionally small and progressive: select the smallest useful set, read references only when needed, and verify every material change with evidence.

## Production stack

React/Vite is served as Cloudflare Worker Assets. Application data is stored in D1 and media in the configured KV namespace (`MEDIA`). KV is a compromise for a no-R2 setup: keep uploads below the enforced 20 MiB application limit and retain independent backups, because recovered files are not automatically copied into KV. The original Supabase migrations remain in `supabase/migrations/` for recovery reference.

For production Workers Builds, set the production branch to `main`, build command to `npm run build`, and deploy command to `npx wrangler deploy`. The production Worker configuration is maintained in `wrangler.json`: `DB` binds to Cloudflare D1 and `MEDIA` binds to the configured KV namespace. Keep the production branch on `main`; retrying an old failed build can reuse its original source revision, so push a new commit to validate the latest configuration. Keep `npx wrangler preview` only for non-production branches; Previews need their own Preview-safe D1/KV bindings and Cloudflare Access configuration, not production resources. Production API access is fail-closed and requires Cloudflare Access JWT validation. Before deployment, verify the real D1 database ID, create a Cloudflare Access application covering the entire app hostname, and populate the required GitHub deployment secrets. Only allow-listed emails and service tokens can reach API routes; admin imports additionally require IMPORT_SECRET. This repo is a single shared couple workspace, not a multi-tenant authorization system.

## Recovery

Recovery artifacts must remain local/private. Never commit PostgreSQL backups, recovered/database.json, media dumps, or generated seed SQL. The seed generator writes to recovered/private/seed-recovered.local.sql, which Git ignores; apply it manually only after reconciliation. The repository was public while a recovered seed file contained personal relationship data, so removing it from the current tree does not erase public Git history. See docs/SECURITY_RECOVERY.md for the required exposure remediation.

See `docs/ENGINEERING_AUDIT_2026-10-09.md` for the current audit, `docs/SECURITY_RECOVERY.md` for required privacy/security actions, and `docs/AGENT_SKILLS.md` for the skill system.

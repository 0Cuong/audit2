# CUONGISME

CUONGISME is a Vite + React + TypeScript relationship and memory web app with a recovery-first local mode and a Cloudflare D1/R2 production path.

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

React/Vite is served as Cloudflare Worker Assets. Application data is stored in D1 and media in R2. The original Supabase migrations remain in `supabase/migrations/` for recovery reference.

Before production deployment, configure a real D1 database ID, restrict CORS to the application's origin, and add application-level authorization/tenant isolation to the API. The current worker is not a production security boundary by itself.

## Recovery

Recovery artifacts are kept intact for data-integrity reasons. Never reset, truncate, delete, or replace the source recovery artifacts until migration is independently verified.

See `docs/ENGINEERING_AUDIT_2026-10-05.md` for the current evidence-based audit and `docs/AGENT_SKILLS.md` for the skill system.

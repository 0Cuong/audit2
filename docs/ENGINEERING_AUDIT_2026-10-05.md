# audit2 Engineering Audit — 2026-10-05

## Baseline

The repository contains the recovery-first relationship application plus Cloudflare D1/R2 runtime code. Recovery database/storage artifacts remain intentionally preserved.

## Preserved strengths

- Lazy-loaded page routes and a global ErrorBoundary.
- Safe localStorage helpers and local-first recovery behavior.
- Explicit worker table/column validation and parameterized D1 queries.
- Update/delete operations refuse missing filters.
- Recovery scripts have dry-run and import-secret gates.
- Existing design tokens and cinematic components are project-specific rather than a generic component-library rewrite.

## Production-blocker status

### Dependency reproducibility — READY

A CI-generated package-lock.json is now tracked. CI uses npm ci --no-audit --no-fund for both verification and deployment jobs.

Verified on main:
- GitHub Actions run 119: npm ci passed.
- skills check passed.
- npm test passed.
- TypeScript typecheck passed.
- ESLint passed.
- Vite build passed.
- PostgreSQL backup parser dry-run passed.

The lockfile was generated from the existing package.json dependency graph. No package.json dependency-range changes were introduced to create it.

### CORS — READY

CORS is now configuration-driven:
- same-origin requests remain allowed without a configured cross-origin entry;
- cross-origin browser requests require an exact origin in CORS_ORIGIN;
- wildcard * is rejected rather than reflected;
- disallowed browser origins receive 403 CORS_ORIGIN_DENIED;
- Authorization is included in the allow-header list for the future authenticated API;
- focused Node tests cover same-origin, allowed-origin, rejected-origin, wildcard rejection, and Authorization preflight.

The production config defaults CORS_ORIGIN to empty, appropriate for the intended Worker Assets same-origin deployment. Cross-origin clients must explicitly configure exact trusted origins.

### D1 binding — BLOCKED / NEEDS CONFIGURATION

wrangler.json still contains:

REPLACE_WITH_D1_DATABASE_ID

Repository inspection found no authoritative real production D1 ID. The Cloudflare dashboard/provider configuration is not available through the connected tools, and no Cloudflare plugin is installed. No database was created or replaced.

Required human-provided value:
- the authoritative production D1 database ID for audit2-db.

Do not substitute an inferred or new database ID.

## Authorization matrix

| Surface | Read | Create | Update | Delete | Current identity source | Production status |
|---|---|---|---|---|---|---|
| /api/data | Publicly reachable | Publicly reachable | Publicly reachable with a filter | Publicly reachable with a filter | None | BLOCKED |
| Storage upload | Publicly reachable | Publicly reachable | PUT/POST to object path | Publicly reachable | None | BLOCKED |
| Storage download | Publicly reachable | — | — | — | None | BLOCKED |
| Storage delete | — | — | — | Publicly reachable | None | BLOCKED |

### Authentication / tenant isolation — BLOCKED

The existing architecture is explicitly single-tenant/anonymous in the original Supabase schema and does not establish a server-side authenticated user identity. The Cloudflare worker likewise does not verify a session, bearer token, or equivalent user credential before /api/data or R2 access.

The worker accepts client-supplied couple_id filters, but those values are not proof of authorization. The presence of couple_members and couple_invites tables does not create authorization by itself.

Therefore the minimum security requirements remain unmet:
- unauthenticated data access is still possible;
- client-supplied tenant IDs are trusted as query values;
- cross-user/cross-tenant isolation is not enforced;
- storage access is authorized only by object path, not verified identity;
- the existing privacy_password setting is application data, not a server-side authentication mechanism.

### Required architectural decision

Implementing secure authentication + tenant isolation now would require choosing and integrating a real identity model/provider, defining membership semantics, deriving authorization from verified server-side identity, and deciding how existing single-tenant data is mapped into that model.

The repository task explicitly requires approval before introducing a new authentication architecture. No such architecture was invented or deployed in this pass.

## Data integrity

No database rows, storage objects, recovery images, PostgreSQL backup, or recovery dump were modified, deleted, truncated, regenerated, or replaced by this pass.

## Final production-readiness matrix

| Area | Status |
|---|---|
| Dependency reproducibility | READY |
| D1 binding | NEEDS CONFIGURATION / BLOCKED |
| CORS | READY |
| Authentication | BLOCKED |
| Tenant isolation | BLOCKED |
| Storage authorization | BLOCKED |
| CI | READY |
| Build | READY |

## Remaining stop conditions

1. Provide the authoritative production D1 database ID before deployment.
2. Approve the authentication/tenant-isolation architecture before implementation.
3. Do not treat the application as production-secure while authorization and storage authorization remain blocked.

# audit2 Engineering Audit — 2026-10-09

## Verified on the inspected repository snapshot

- Dependency install, skills validation, 9 existing tests, TypeScript typecheck, ESLint and Vite build passed in GitHub Actions run 37930526569.
- The same run failed at the PostgreSQL backup validation step because db_cluster-03-10-2026@23-05-37.backup was not present in the checkout.
- The recovery manifest exists, but recovered/database.json, the referenced PostgreSQL backup, and the recovered binary media tree were absent from the public tree inspected for this audit.
- The current Worker had no server-side identity verification for data or R2 routes. CORS is not authorization.
- The tracked seed migration contained 44 personal rows while the repository was public.

## Changes in this repair branch

- Add Cloudflare Access JWT verification (RS256, JWKS, issuer, audience, expiry, user/service-token allowlists) and fail-closed middleware for all non-health API routes.
- Require an admin identity for import routes in addition to the existing import secret.
- Add R2 upload limits, reject active-document MIME types, use private non-cacheable media responses and add an R2-backed route for recovered anniversary images.
- Correct JSON/boolean coercion and bound API read limits.
- Remove personal recovered rows from the automatically applied migration; generated seed now goes to a Git-ignored local file.
- Add a synthetic PostgreSQL COPY fixture so CI can exercise parser behavior without committing a private database dump.
- Make the local recovery server start in empty mode with a visible warning when private recovery artifacts are absent.
- Add deployment preflight for D1 and Cloudflare Access settings.

## Remaining requirements before production

1. Verify the actual production D1 database UUID and R2 bucket in the Cloudflare account. The checked-in D1 ID is intentionally a placeholder until verified.
2. Configure a Cloudflare Access application for the complete app hostname, identity policies and a Service Auth policy; add required GitHub secrets.
3. Run a dry-run on the real private PostgreSQL backup and restore the missing media bytes to the expected R2 keys.
4. Perform source/target row and object-count reconciliation, then real smoke tests.
5. Remediate the public Git-history exposure by making the repo private if appropriate and purging exposed personal rows from all refs/history. A new sanitized commit alone does not revoke public copies.
6. Do not advertise the app as production-ready until the above checks have evidence.

## Data integrity constraint

Do not reset/truncate D1, delete original local recovery files, or overwrite existing production rows just to make CI green. Use insert-if-missing/transactional procedures where appropriate, back up before any import, and keep generated personal seed SQL out of Git.

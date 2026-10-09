# Security and recovery status

## Public-data exposure: action required

The previous public tree contained recovered personal relationship rows in migrations/0004_seed_recovered.sql. The current fix replaces that tracked SQL with a no-op and moves future seed output to the Git-ignored recovered/private/seed-recovered.local.sql.

This change does not erase copies from old commits, forks, caches, or clones. Before declaring the exposure remediated:
1. Make the repository private if its intended audience is only the owner and partner.
2. Review every branch, tag, release, pull request, and fork for the exposed seed file.
3. Purge the personal SQL from Git history with a controlled history rewrite; coordinate any force-push because it invalidates existing clones and refs.
4. Review whether any secrets or reusable credentials were committed. Rotate any credentials found.
5. Do not re-commit raw database dumps, images, personal rows, or local seed SQL.

Do not delete the original local recovery source. Keep a private offline backup and verify that it is usable before the history cleanup.

## Cloudflare Access boundary

Non-health API routes require a Cloudflare Access JWT whose signature, issuer, audience, expiry and allow-listed identity are verified inside the Worker. Email identities are checked against ACCESS_ALLOWED_EMAILS; service-token principals are checked against ACCESS_ALLOWED_SERVICE_NAMES. Admin-import routes additionally require an admin email or an allow-listed service token, as well as IMPORT_SECRET.

If Access settings are absent or JWKS cannot be retrieved, the API fails closed with HTTP 503. Invalid, expired, wrong-audience, or disallowed tokens are rejected. The public health endpoint returns only a basic D1 connectivity signal.

This is a single shared-couple workspace: all allow-listed member emails can access the same workspace. It is not a generalized multi-tenant product.

## Storage safeguards

- R2 upload is available only after API authentication.
- Uploads over 50 MiB and active document types (HTML, JavaScript, CSS and generic XML) are rejected.
- Media responses use private, no-store, nosniff, and a restrictive CSP.
- Recovered anniversary media is read from the photos/anniversaries prefix; the handler can try the alternate JPEG/WebP extension. The binary objects still need to be present in R2.

## What CI proves

CI can prove the checked-in code builds and unit tests pass. A synthetic PostgreSQL fixture only tests parser mechanics; it does not prove that a private backup was restored. D1 IDs, bucket existence, Access policies/secrets, imported row counts, recovered image bytes, and real deployment must be verified against the owner's Cloudflare account.
